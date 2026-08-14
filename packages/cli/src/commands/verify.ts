import fs from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import { execa } from "execa";
import { CircuitBreaker } from "../engines/circuit-breaker.js";
import { ErrorSanitizer } from "../engines/error-sanitizer.js";
import { GitManager } from "../engines/git-manager.js";
import { parseTaskManifest } from "../parsers/task-parser.js";
import type { HarnessConfig } from "../schemas/harness-config.schema.js";

export async function runVerify(taskId: string): Promise<void> {
  const cwd = process.cwd();
  const configPath = path.join(cwd, ".harness", "harness.config.json");
  const taskFilePath = path.join(cwd, ".harness", "tasks", `${taskId}.md`);

  const rawConfig = await fs.readFile(configPath, "utf-8");
  const config: HarnessConfig = JSON.parse(rawConfig);
  const manifest = await parseTaskManifest(taskFilePath);

  console.log(chalk.bold.cyan(`\n⚡ Executing Verification Gate: ${taskId}\n`));

  // 1. Check Boundary Violations
  const boundaryCheck = await GitManager.validateFileBoundaries(manifest.allowedFiles);
  if (!boundaryCheck.valid) {
    console.error(chalk.red("✖ File Boundary Violation Detected!"));
    console.error(
      chalk.yellow(
        `The following files were modified outside allowed boundaries:\n${boundaryCheck.violatingFiles
          .map((f) => `  - ${f}`)
          .join("\n")}`
      )
    );
    process.exit(1);
  }
  console.log(chalk.green("✔ File boundaries respected."));

  // 2. Run Verification Commands
  for (const cmdString of manifest.verificationCommands) {
    console.log(chalk.dim(`- Running: ${cmdString}`));
    try {
      await execa(cmdString, { shell: true, stdio: "pipe" });
      console.log(chalk.green(`  ✔ Passed: ${cmdString}`));
    } catch (err: any) {
      const sanitized = ErrorSanitizer.sanitize(cmdString, err.stderr || "", err.stdout || "");
      const errorCard = ErrorSanitizer.formatErrorCard(sanitized);
      console.error(chalk.red(`\n${errorCard}\n`));

      const { tripped, currentAttempts } = await CircuitBreaker.recordFailure(
        taskId,
        cmdString,
        sanitized.summary,
        config.circuitBreakerLimit,
        manifest.allowedFiles
      );

      if (tripped) {
        console.error(
          chalk.bgRed.bold(
            `\n🚨 CIRCUIT BREAKER TRIPPED! (${currentAttempts}/${config.circuitBreakerLimit} failures)`
          )
        );
        console.error(
          chalk.yellow(
            "Working tree has been rolled back to preflight state. Check .harness/memory/spawn-log/.\n"
          )
        );
      } else {
        console.error(
          chalk.yellow(`Attempt ${currentAttempts}/${config.circuitBreakerLimit} failed. Fix errors and re-verify.\n`)
        );
      }
      process.exit(1);
    }
  }

  // 3. Reset Failures on Complete Success
  await CircuitBreaker.resetAttempts(taskId);
  console.log(chalk.bold.green("\n🎉 All verification commands passed exit 0!\n"));
}