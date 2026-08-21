import { afterEach, describe, expect, it, mock } from "bun:test";

const execaMock = mock();
mock.module("execa", () => ({
	execa: execaMock,
}));

import { GitManager } from "../src/engines/git-manager.js";

describe("GitManager", () => {
	afterEach(() => {
		execaMock.mockClear();
	});

	describe("getCurrentBranch", () => {
		it("should return branch using rev-parse", async () => {
			execaMock.mockResolvedValueOnce({ stdout: "feature-branch\n" });
			const branch = await GitManager.getCurrentBranch();
			expect(branch).toBe("feature-branch");
		});

		it("should fallback to symbolic-ref if rev-parse fails", async () => {
			execaMock.mockRejectedValueOnce(new Error("fatal: ambiguous argument"));
			execaMock.mockResolvedValueOnce({ stdout: "fallback-branch\n" });
			const branch = await GitManager.getCurrentBranch();
			expect(branch).toBe("fallback-branch");
		});

		it("should default to main if both commands fail (0-commit repo)", async () => {
			execaMock.mockRejectedValueOnce(new Error("fail 1"));
			execaMock.mockRejectedValueOnce(new Error("fail 2"));
			const branch = await GitManager.getCurrentBranch();
			expect(branch).toBe("main");
		});
	});

	describe("hasCommits", () => {
		it("should return true if rev-parse succeeds", async () => {
			execaMock.mockResolvedValueOnce({ stdout: "commit-hash" });
			const result = await GitManager.hasCommits();
			expect(result).toBe(true);
		});

		it("should return false if rev-parse fails", async () => {
			execaMock.mockRejectedValueOnce(new Error("no commits"));
			const result = await GitManager.hasCommits();
			expect(result).toBe(false);
		});
	});

	describe("ensureTaskBranch", () => {
		it("should create branch via checkout -b in a 0-commit repo", async () => {
			// Mock getCurrentBranch to return 'main' (fails both checks)
			execaMock.mockRejectedValueOnce(new Error()); // rev-parse
			execaMock.mockRejectedValueOnce(new Error()); // symbolic-ref

			// Mock hasCommits to return false
			execaMock.mockRejectedValueOnce(new Error());

			// Mock checkout -b
			execaMock.mockResolvedValueOnce({ stdout: "" });

			const branch = await GitManager.ensureTaskBranch("task-123", "test slug");
			expect(branch).toBe("task/task-123-test-slug");
		});
	});
});
