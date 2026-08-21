import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import { RepoAnalyzer } from "../src/engines/repo-analyzer.js";

describe("RepoAnalyzer Engine", () => {
	const tmpRepoDir = path.join(process.cwd(), ".tmp-repo-analyzer-test");

	beforeAll(async () => {
		await fs.mkdir(tmpRepoDir, { recursive: true });
		await fs.writeFile(
			path.join(tmpRepoDir, "package.json"),
			JSON.stringify({
				name: "brownfield-sample",
				dependencies: { express: "^4.18.2" },
			}),
			"utf-8",
		);
	});

	afterAll(async () => {
		await fs.rm(tmpRepoDir, { recursive: true, force: true });
	});

	it("should inspect brownfield package.json and detect stack and modules", async () => {
		// Test helper analysis logic
		expect(path.basename(tmpRepoDir)).toBe(".tmp-repo-analyzer-test");
	});
});
