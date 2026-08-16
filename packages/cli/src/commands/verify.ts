import fs from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import { execaCommand } from "execa";
import { CircuitBreaker } from "../engines/circuit-breaker.js";
import { ErrorSanitizer } from "../engines/error-sanitizer.js";
import { GitManager } from "../engines/git-manager.js";
import { parseTaskManifest } from "../parsers/task-parser.js";
import type { HarnessConfig } from "../schemas/harness-config.schema.js";

export async function runVerify(taskId: string): Promise<void> {
  const taskFilePath = path.join(process.cwd(), ".harness", "tasks", `${taskId}.md`);
  const manifest = await parseTaskManifest(taskFilePath);

  console.log(chalk.bold.cyan(`\n🧪 Verifying Task: ${manifest.frontmatter.id}\n`));

  // 1. File Boundary Gate Check
  const boundaryCheck = await GitManager.validateFileBoundaries(manifest.allowedFiles);
  if (!boundaryCheck.valid) {
    console.error(chalk.red("✖ File Boundary Violation Detected!"));
    console.error(
      chalk.red(`  Modified out-of-scope files:\n  ${boundaryCheck.violatingFiles.join("\n  ")}`)
    );
    process.exit(1);
  }
  console.log(chalk.green("✔ File boundaries respected."));

  // 2. Load Config for Circuit Breaker limit
  let configLimit = 3;
  try {
    const rawConfig = await fs.readFile(
      path.join(process.cwd(), ".harness", "harness.config.json"),
      "utf-8"
    );
    const cfg: HarnessConfig = JSON.parse(rawConfig);
    configLimit = cfg.circuitBreakerLimit || 3;
  } catch {}

  // 3. Execute Verification Commands
  for (const cmd of manifest.verificationCommands) {
    console.log(chalk.dim(`- Executing: ${cmd}`));
    try {
      await execaCommand(cmd, { stdio: "pipe", shell: true });
      console.log(chalk.green(`✔ Passed: ${cmd}`));
    } catch (err: any) {
      console.error(chalk.red(`✖ Failed: ${cmd}`));

      const errorCard = ErrorSanitizer.sanitize(cmd, err.stderr || "", err.stdout || "");
      console.log("\n" + ErrorSanitizer.formatErrorCard(errorCard) + "\n");

      // Record failure with circuit breaker
      const { tripped, currentAttempts } = await CircuitBreaker.recordFailure(
        taskId,
        cmd,
        errorCard.summary,
        configLimit,
        manifest.allowedFiles
      );

      if (tripped) {
        console.error(
          chalk.bold.red(
            `\n🚨 CIRCUIT BREAKER TRIPPED (${currentAttempts}/${configLimit} failed attempts).`
          )
        );
        console.error(
          chalk.yellow(
            "Working tree rolled back to preflight state. Spawn receipt written to .harness/memory/spawn-log/.\n"
          )
        );
      } else {
        console.log(
          chalk.yellow(`Attempt ${currentAttempts}/${configLimit}. Fix errors and re-verify.\n`)
        );
      }
      process.exit(1);
    }
  }

  // All passed: reset attempt counters
  await CircuitBreaker.resetAttempts(taskId);
  console.log(chalk.bold.green(`\n✔ All verification commands passed (EXIT 0). Ready to close.\n`));
}