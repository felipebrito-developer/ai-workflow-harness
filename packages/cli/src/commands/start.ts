import fs from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import matter from "gray-matter";
import { GitManager } from "../engines/git-manager.js";
import { parseTaskManifest } from "../parsers/task-parser.js";

export async function runStart(taskId: string): Promise<void> {
  const taskFilePath = path.join(process.cwd(), ".harness", "tasks", `${taskId}.md`);

  try {
    await fs.access(taskFilePath);
  } catch {
    console.error(chalk.red(`Error: Task manifest not found at ${taskFilePath}`));
    process.exit(1);
  }

  const manifest = await parseTaskManifest(taskFilePath);
  console.log(chalk.bold.cyan(`\n🚀 Starting Task: ${manifest.frontmatter.id} - ${manifest.frontmatter.title}`));

  // 1. Ensure Task Branch
  const branchName = await GitManager.ensureTaskBranch(
    manifest.frontmatter.id,
    manifest.frontmatter.title
  );
  console.log(chalk.dim(`- Git Branch: ${branchName}`));

  // 2. Toggle Status to IN_PROGRESS
  const raw = await fs.readFile(taskFilePath, "utf-8");
  const parsed = matter(raw);
  parsed.data.status = "IN_PROGRESS";
  const updatedContent = matter.stringify(parsed.content, parsed.data);
  await fs.writeFile(taskFilePath, updatedContent, "utf-8");

  console.log(chalk.green(`- Status: IN_PROGRESS`));
  console.log(chalk.dim(`- Allowed Boundaries: ${manifest.allowedFiles.join(", ")}`));
  console.log(chalk.yellow(`\nRun 'harness preflight ${taskId}' before generating code.\n`));
}