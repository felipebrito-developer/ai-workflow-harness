import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import { parseTaskManifest } from "../src/parsers/task-parser.js";

describe("parseTaskManifest", () => {
  const tmpTaskDir = path.join(process.cwd(), ".tmp-task-test");
  const tmpTaskFile = path.join(tmpTaskDir, "task-999.md");

  beforeAll(async () => {
    await fs.mkdir(tmpTaskDir, { recursive: true });
    const content = `---
id: task-999
title: Unit Test Task
status: TODO
feature_ref: core
---

# Task: Unit Test Task

## 1. Allowed File Boundaries
- \`src/index.ts\`
- \`tests/index.test.ts\`

## 2. Acceptance Criteria
- [ ] Verify test passes

## 3. Verification Commands
\`\`\`bash
bun test
\`\`\`
`;
    await fs.writeFile(tmpTaskFile, content, "utf-8");
  });

  afterAll(async () => {
    await fs.rm(tmpTaskDir, { recursive: true, force: true });
  });

  it("should parse task manifest Markdown with frontmatter and sections", async () => {
    const manifest = await parseTaskManifest(tmpTaskFile);
    expect(manifest.frontmatter.id).toBe("task-999");
    expect(manifest.allowedFiles).toContain("src/index.ts");
    expect(manifest.acceptanceCriteria).toContain("Verify test passes");
    expect(manifest.verificationCommands).toContain("bun test");
  });
});
