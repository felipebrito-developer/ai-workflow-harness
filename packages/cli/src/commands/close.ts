import fs from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import matter from "gray-matter";
import { GitManager } from "../engines/git-manager.js";
import { parseTaskManifest } from "../parsers/task-parser.js";

export async function runClose(taskId: string): Promise<void> {
  const taskFilePath = path.join(process.cwd(), ".harness", "tasks", `${taskId}.md`);
  const manifest = await parseTaskManifest(taskFilePath);

  // 1. Boundary Final Check
  const boundaryCheck = await GitManager.validateFileBoundaries(manifest.allowedFiles);
  if (!boundaryCheck.valid) {
    console.error(chalk.red("✖ Cannot close: Violating file boundaries exist."));
    process.exit(1);
  }

  // 2. Set Status to DONE
  const raw = await fs.readFile(taskFilePath, "utf-8");
  const parsed = matter(raw);
  parsed.data.status = "DONE";
  await fs.writeFile(taskFilePath, matter.stringify(parsed.content, parsed.data), "utf-8");

  // 3. Write Spawn Log Receipt
  const spawnDir = path.join(process.cwd(), ".harness", "memory", "spawn-log");
  await fs.mkdir(spawnDir, { recursive: true });
  const logContent = [
    `# Spawn Log — Task Closed — ${taskId}`,
    "",
    `> **Task:** ${manifest.frontmatter.title}`,
    `> **Outcome:** GREEN`,
    `> **Closed At:** ${new Date().toISOString()}`,
    "",
    "## Verified Files",
    ...manifest.allowedFiles.map((f) => `- ${f}`),
  ].join("\n");

  await fs.writeFile(path.join(spawnDir, `closed-${taskId}.md`), logContent, "utf-8");
  console.log(chalk.bold.green(`\n✔ Task ${taskId} successfully closed and logged!\n`));
}