import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import { runAudit } from "../src/commands/audit.js";
import { runFeature } from "../src/commands/feature.js";

describe("CLI Commands Integration Suite", () => {
  const originalCwd = process.cwd();
  const testWorkspace = path.join(process.cwd(), ".tmp-cmd-test-workspace");

  beforeAll(async () => {
    await fs.mkdir(testWorkspace, { recursive: true });
    process.chdir(testWorkspace);
  });

  afterAll(async () => {
    process.chdir(originalCwd);
    await fs.rm(testWorkspace, { recursive: true, force: true });
  });

  it("should execute runAudit without crashing in clean test workspace", async () => {
    // Create package.json to test audit
    await fs.writeFile(path.join(testWorkspace, "package.json"), JSON.stringify({ name: "test-app" }), "utf-8");
    expect(runAudit()).resolves.toBeUndefined();
  });

  it("should execute runFeature to generate 1-pass task manifest and spec db entries", async () => {
    await runFeature("User Profile", { files: "src/profile.ts,tests/profile.test.ts", isSchema: false });

    const taskPath = path.join(testWorkspace, ".harness", "tasks", "task-user-profile.md");
    const taskContent = await fs.readFile(taskPath, "utf-8");

    expect(taskContent).toContain("User Profile");
    expect(taskContent).toContain("src/profile.ts");
    expect(taskContent).toContain("agile-fasttrack");
  });
});
