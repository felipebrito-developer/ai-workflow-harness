import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import { CircuitBreaker } from "../src/engines/circuit-breaker.js";

describe("CircuitBreaker Engine", () => {
	const attemptsDir = path.join(process.cwd(), ".harness/memory/attempts");

	beforeAll(async () => {
		await fs.mkdir(attemptsDir, { recursive: true });
	});

	afterAll(async () => {
		await fs.rm(attemptsDir, { recursive: true, force: true });
	});

	it("should record attempt failures and trip after max limit", async () => {
		const taskId = "task-test-cb";

		const res1 = await CircuitBreaker.recordFailure(
			taskId,
			"bun test",
			"Syntax error line 5",
			3,
		);
		expect(res1.tripped).toBe(false);
		expect(res1.currentAttempts).toBe(1);

		const res2 = await CircuitBreaker.recordFailure(
			taskId,
			"bun test",
			"Syntax error line 5",
			3,
		);
		expect(res2.tripped).toBe(false);
		expect(res2.currentAttempts).toBe(2);

		const res3 = await CircuitBreaker.recordFailure(
			taskId,
			"bun test",
			"Syntax error line 5",
			3,
		);
		expect(res3.tripped).toBe(true);
		expect(res3.currentAttempts).toBe(3);

		await CircuitBreaker.resetAttempts(taskId);
	});
});
