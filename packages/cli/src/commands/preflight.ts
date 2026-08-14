import path from "node:path";
import chalk from "chalk";
import { AstValidator } from "../engines/ast-validator.js";
import { GitManager } from "../engines/git-manager.js";
import { parseTaskManifest } from "../parsers/task-parser.js";

export async function runPreflight(taskId: string): Promise<void> {
  const taskFilePath = path.join(process.cwd(), ".harness", "tasks", `${taskId}.md`);
  const manifest = await parseTaskManifest(taskFilePath);

  console.log(chalk.bold.cyan(`\n🔍 Running Preflight Gate for ${taskId}\n`));

  // 1. Working Tree Inspection
  const isClean = await GitManager.isWorkingTreeClean();
  const currentBranch = await GitManager.getCurrentBranch();

  console.log(`- Active Branch: ${chalk.bold(currentBranch)}`);
  if (!isClean) {
    console.log(chalk.yellow("⚠️  Working tree has uncommitted modifications."));
  } else {
    console.log(chalk.green("✔ Working tree clean."));
  }

  // 2. Boundary AST Validation
  console.log(`- Validating AST for allowed files...`);
  const astValidator = new AstValidator();
  const astResult = await astValidator.validateFiles(manifest.allowedFiles);

  if (!astResult.valid) {
    console.log(chalk.red("✖ AST Diagnostics Warnings:"));
    for (const err of astResult.errors) {
      console.log(chalk.dim(`  | ${err}`));
    }
  } else {
    console.log(chalk.green("✔ AST / Type resolution clean."));
  }

  // 3. Output Mandatory Agent Echo Template
  console.log(chalk.bold.blue("\n📋 Required Agent Echo Contract (Paste in opening response):"));
  console.log(chalk.dim("┌────────────────────────────────────────────────────────┐"));
  console.log(chalk.dim(`│ [PREFLIGHT ECHO]                                       │`));
  console.log(chalk.dim(`│ Task ID: ${manifest.frontmatter.id}                                        │`));
  console.log(chalk.dim(`│ Allowed Files: ${JSON.stringify(manifest.allowedFiles)}`));
  console.log(chalk.dim(`│ Verification: ${manifest.verificationCommands[0] || "None"}`));
  console.log(chalk.dim("└────────────────────────────────────────────────────────┘\n"));
}