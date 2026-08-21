import fs from "node:fs/promises";
import path from "node:path";
import { ConfigManager } from "./config-manager.js";

export type SpawnStatus =
	| "COMPLETED"
	| "FAILED"
	| "INTERRUPTED"
	| "CIRCUIT_TRIPPED";

export interface TokenUsageMetrics {
	promptTokens?: number;
	completionTokens?: number;
	totalTokens?: number;
	cacheHits?: number;
}

export interface TaskStateRecord {
	taskId: string;
	agentName: string;
	startTime: string;
	allowedFiles: string[];
	tokenUsage?: TokenUsageMetrics;
}

export interface SpawnReceipt {
	taskId: string;
	taskTitle?: string;
	agentName: string;
	status: SpawnStatus;
	startTime: string;
	endTime: string;
	durationSeconds: number;
	tokenUsage?: TokenUsageMetrics;
	allowedFiles: string[];
	failureReason?: string;
	lastFailedCommand?: string;
}

export class SpawnLogger {
	private static getMemoryDir(): string {
		return path.resolve(process.cwd(), ".harness/memory/attempts");
	}

	private static getStatePath(taskId: string): string {
		return path.join(SpawnLogger.getMemoryDir(), `${taskId}-state.json`);
	}

	private static getSpawnLogDir(): string {
		return path.resolve(process.cwd(), ".harness/memory/spawn-log");
	}

	/**
	 * Record the start of a subagent task session
	 */
	public static async recordTaskStart(
		taskId: string,
		agentName = "tech-lead",
		allowedFiles: string[] = [],
	): Promise<TaskStateRecord> {
		await fs.mkdir(SpawnLogger.getMemoryDir(), { recursive: true });

		const state: TaskStateRecord = {
			taskId,
			agentName,
			startTime: new Date().toISOString(),
			allowedFiles,
		};

		await fs.writeFile(
			SpawnLogger.getStatePath(taskId),
			JSON.stringify(state, null, 2),
			"utf-8",
		);

		return state;
	}

	/**
	 * Load existing task state or initialize fallback state
	 */
	public static async getTaskState(
		taskId: string,
		allowedFiles: string[] = [],
	): Promise<TaskStateRecord> {
		try {
			const raw = await fs.readFile(
				SpawnLogger.getStatePath(taskId),
				"utf-8",
			);
			return JSON.parse(raw);
		} catch {
			return {
				taskId,
				agentName: "tech-lead",
				startTime: new Date().toISOString(),
				allowedFiles,
			};
		}
	}

	/**
	 * Record token usage for an active task session
	 */
	public static async updateTokenUsage(
		taskId: string,
		usage: TokenUsageMetrics,
	): Promise<void> {
		const state = await SpawnLogger.getTaskState(taskId);
		state.tokenUsage = {
			promptTokens:
				(state.tokenUsage?.promptTokens || 0) + (usage.promptTokens || 0),
			completionTokens:
				(state.tokenUsage?.completionTokens || 0) +
				(usage.completionTokens || 0),
			totalTokens:
				(state.tokenUsage?.totalTokens || 0) + (usage.totalTokens || 0),
			cacheHits:
				(state.tokenUsage?.cacheHits || 0) + (usage.cacheHits || 0),
		};
		await fs.writeFile(
			SpawnLogger.getStatePath(taskId),
			JSON.stringify(state, null, 2),
			"utf-8",
		);
	}

	/**
	 * Format duration into human readable string e.g. "1m 15.2s (75.2s)"
	 */
	public static formatDuration(seconds: number): string {
		if (seconds < 60) {
			return `${seconds.toFixed(1)}s`;
		}
		const mins = Math.floor(seconds / 60);
		const secs = (seconds % 60).toFixed(1);
		return `${mins}m ${secs}s (${seconds.toFixed(1)}s total)`;
	}

	/**
	 * Write a comprehensive Spawn Receipt markdown file and append to ai-memory wiki
	 */
	public static async writeReceipt(receipt: SpawnReceipt): Promise<string> {
		const spawnLogDir = SpawnLogger.getSpawnLogDir();
		await fs.mkdir(spawnLogDir, { recursive: true });

		const statusEmoji = {
			COMPLETED: "✔ COMPLETED (GREEN)",
			FAILED: "✖ FAILED",
			INTERRUPTED: "⚠️ INTERRUPTED",
			CIRCUIT_TRIPPED: "🛑 CIRCUIT_TRIPPED (BLOCKED)",
		}[receipt.status];

		const totalTokens = receipt.tokenUsage?.totalTokens || 0;
		const promptTokens = receipt.tokenUsage?.promptTokens || 0;
		const completionTokens = receipt.tokenUsage?.completionTokens || 0;

		const logContent = [
			`# 🧾 Spawn Log Receipt — ${receipt.taskId}`,
			"",
			`> **Agent:** \`@${receipt.agentName}\``,
			`> **Status:** **${statusEmoji}**`,
			`> **Start Time:** \`${receipt.startTime}\``,
			`> **End Time:** \`${receipt.endTime}\``,
			`> **Duration Worked:** \`${SpawnLogger.formatDuration(receipt.durationSeconds)}\``,
			"",
			"## 📊 Resource & Token Metrics",
			"| Metric | Value |",
			"| :--- | :--- |",
			`| **Prompt Tokens** | ${promptTokens.toLocaleString()} |`,
			`| **Completion Tokens** | ${completionTokens.toLocaleString()} |`,
			`| **Total Tokens** | **${totalTokens.toLocaleString()}** |`,
			`| **Worked Time** | ${SpawnLogger.formatDuration(receipt.durationSeconds)} |`,
			"",
			"## 📁 Allowed File Boundaries Touched",
			...(receipt.allowedFiles.length > 0
				? receipt.allowedFiles.map((f) => `- \`${f}\``)
				: ["- None (No files modified)"]),
			"",
			...(receipt.failureReason
				? [
						"## ✖ Failure / Exception Details",
						...(receipt.lastFailedCommand
							? [`> **Failed Command:** \`${receipt.lastFailedCommand}\``, ""]
							: []),
						"```text",
						receipt.failureReason,
						"```",
						"",
					]
				: []),
		].join("\n");

		const fileName = `${receipt.status.toLowerCase()}-${receipt.taskId}.md`;
		const filePath = path.join(spawnLogDir, fileName);

		await fs.writeFile(filePath, logContent, "utf-8");

		// Append to ai-memory wiki if configured
		try {
			const config = await ConfigManager.load();
			if (config.memoryBackend?.type === "ai-memory") {
				const wikiDir = path.resolve(
					process.cwd(),
					config.memoryBackend.aiMemoryConfig?.wikiPath || ".harness/wiki",
				);
				await fs.mkdir(wikiDir, { recursive: true });
				await fs.appendFile(
					path.join(wikiDir, "spawn-log.md"),
					`\n${logContent}\n\n---\n`,
					"utf-8",
				);
			}
		} catch {}

		return filePath;
	}
}
