import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import { SpawnLogger, type SpawnReceipt } from "../src/engines/spawn-logger.js";

describe("SpawnLogger Engine", () => {
	const tmpDir = path.resolve(process.cwd(), `.tmp-spawn-logger-test-${Date.now()}`);
	const originalCwd = process.cwd();

	beforeAll(async () => {
		await fs.mkdir(tmpDir, { recursive: true });
		process.chdir(tmpDir);
	});

	afterAll(async () => {
		process.chdir(originalCwd);
		await fs.rm(tmpDir, { recursive: true, force: true });
	});

	it("should record task start session", async () => {
		const state = await SpawnLogger.recordTaskStart("task-101", "tech-lead", [
			"src/index.ts",
		]);
		expect(state.taskId).toBe("task-101");
		expect(state.agentName).toBe("tech-lead");
		expect(state.allowedFiles).toEqual(["src/index.ts"]);
		expect(typeof state.startTime).toBe("string");
	});

	it("should update token usage metrics", async () => {
		await SpawnLogger.updateTokenUsage("task-101", {
			promptTokens: 1000,
			completionTokens: 250,
			totalTokens: 1250,
		});

		const updated = await SpawnLogger.getTaskState("task-101");
		expect(updated.tokenUsage?.promptTokens).toBe(1000);
		expect(updated.tokenUsage?.completionTokens).toBe(250);
		expect(updated.tokenUsage?.totalTokens).toBe(1250);
	});

	it("should format duration correctly", () => {
		expect(SpawnLogger.formatDuration(45.2)).toBe("45.2s");
		expect(SpawnLogger.formatDuration(75.5)).toBe("1m 15.5s (75.5s total)");
	});

	it("should write completed spawn log receipt with worked time, token usage, and status", async () => {
		const receipt: SpawnReceipt = {
			taskId: "task-101",
			taskTitle: "Implement User Profile",
			agentName: "tech-lead",
			status: "COMPLETED",
			startTime: "2026-08-21T11:00:00.000Z",
			endTime: "2026-08-21T11:02:15.000Z",
			durationSeconds: 135.0,
			tokenUsage: {
				promptTokens: 5000,
				completionTokens: 800,
				totalTokens: 5800,
			},
			allowedFiles: ["src/user.ts", "tests/user.test.ts"],
		};

		const receiptPath = await SpawnLogger.writeReceipt(receipt);
		expect(receiptPath).toContain("completed-task-101.md");

		const content = await fs.readFile(receiptPath, "utf-8");
		expect(content).toContain("Spawn Log Receipt");
		expect(content).toContain("@tech-lead");
		expect(content).toContain("COMPLETED");
		expect(content).toContain("2m 15.0s (135.0s total)");
		expect(content).toContain("5,000");
		expect(content).toContain("800");
		expect(content).toContain("5,800");
		expect(content).toContain("src/user.ts");
	});

	it("should write circuit tripped spawn log receipt with failure reason", async () => {
		const receipt: SpawnReceipt = {
			taskId: "task-102",
			agentName: "test-runner",
			status: "CIRCUIT_TRIPPED",
			startTime: "2026-08-21T11:10:00.000Z",
			endTime: "2026-08-21T11:11:30.000Z",
			durationSeconds: 90.0,
			tokenUsage: {
				promptTokens: 2000,
				completionTokens: 300,
				totalTokens: 2300,
			},
			allowedFiles: ["src/auth.ts"],
			failureReason: "Type error: Property 'id' does not exist on type 'User'",
			lastFailedCommand: "bun test",
		};

		const receiptPath = await SpawnLogger.writeReceipt(receipt);
		expect(receiptPath).toContain("circuit_tripped-task-102.md");

		const content = await fs.readFile(receiptPath, "utf-8");
		expect(content).toContain("CIRCUIT_TRIPPED");
		expect(content).toContain("bun test");
		expect(content).toContain("Type error: Property 'id' does not exist");
	});
});
