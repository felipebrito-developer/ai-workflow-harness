import fs from "node:fs/promises";
import path from "node:path";
import { GitManager } from "./git-manager.js";

export interface TaskAttemptState {
	taskId: string;
	attempts: number;
	lastFailureReason?: string;
	lastFailedCommand?: string;
	updatedAt: string;
}

export class CircuitBreaker {
	private static getMemoryDir(): string {
		return path.resolve(process.cwd(), ".harness/memory/attempts");
	}

	private static getStatePath(taskId: string): string {
		return path.join(CircuitBreaker.getMemoryDir(), `${taskId}.json`);
	}

	public static async recordFailure(
		taskId: string,
		command: string,
		reason: string,
		maxLimit = 3,
		allowedFiles: string[] = [],
	): Promise<{ tripped: boolean; currentAttempts: number }> {
		await fs.mkdir(CircuitBreaker.getMemoryDir(), { recursive: true });
		const statePath = CircuitBreaker.getStatePath(taskId);

		let state: TaskAttemptState = {
			taskId,
			attempts: 0,
			updatedAt: new Date().toISOString(),
		};

		try {
			const raw = await fs.readFile(statePath, "utf-8");
			state = JSON.parse(raw);
		} catch {}

		state.attempts += 1;
		state.lastFailedCommand = command;
		state.lastFailureReason = reason;
		state.updatedAt = new Date().toISOString();

		await fs.writeFile(statePath, JSON.stringify(state, null, 2), "utf-8");

		if (state.attempts >= maxLimit) {
			// Circuit Tripped: Auto-Rollback changes and emit BLOCKED spawn log
			await GitManager.rollbackAllowedFiles(allowedFiles);
			await CircuitBreaker.writeBlockedSpawnLog(taskId, state);
			return { tripped: true, currentAttempts: state.attempts };
		}

		return { tripped: false, currentAttempts: state.attempts };
	}

	public static async resetAttempts(taskId: string): Promise<void> {
		try {
			await fs.unlink(CircuitBreaker.getStatePath(taskId));
		} catch {}
	}

	private static async writeBlockedSpawnLog(
		taskId: string,
		state: TaskAttemptState,
	): Promise<void> {
		const spawnLogDir = path.resolve(
			process.cwd(),
			".harness/memory/spawn-log",
		);
		await fs.mkdir(spawnLogDir, { recursive: true });

		const logPath = path.join(spawnLogDir, `circuit-breaker-${taskId}.md`);
		const content = [
			`# Spawn Log — Circuit Breaker Tripped — ${taskId}`,
			"",
			`> **Task:** ${taskId}`,
			"> **Outcome:** BLOCKED",
			`> **Written:** ${new Date().toISOString()}`,
			"",
			"## Reason",
			`- Task failed ${state.attempts} consecutive verification attempts.`,
			`- Last Failed Command: \`${state.lastFailedCommand}\``,
			"",
			"## Failure Signature",
			"```text",
			state.lastFailureReason || "Unknown failure signature",
			"```",
			"",
			"## Action Taken",
			"- Working tree files matching task boundaries have been automatically rolled back to prevent context contamination.",
			"- Developer intervention or Task Slicing required.",
		].join("\n");

		await fs.writeFile(logPath, content, "utf-8");
	}
}
