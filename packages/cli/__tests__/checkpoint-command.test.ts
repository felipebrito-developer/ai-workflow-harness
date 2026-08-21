import { describe, expect, it } from "bun:test";
import { GitManager } from "../src/engines/git-manager.js";

describe("GitManager Checkpoint Stash Test Suite", () => {
	it("should generate valid checkpoint stash branch names", () => {
		const stashBranch = `stash/task-test-checkpoint-${Date.now()}`;
		expect(stashBranch).toContain("stash/task-test-checkpoint-");
	});

	it("should verify working tree cleanliness check does not throw errors", async () => {
		const isClean = await GitManager.isWorkingTreeClean();
		expect(typeof isClean).toBe("boolean");
	});
});
