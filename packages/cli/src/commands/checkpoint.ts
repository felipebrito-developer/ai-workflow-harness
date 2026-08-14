import chalk from "chalk";
import { GitManager } from "../engines/git-manager.js";

export async function runCheckpoint(taskId: string): Promise<void> {
  console.log(chalk.bold.cyan(`\n🛡️  Executing Delta Checkpoint for ${taskId}`));
  const stashBranch = await GitManager.checkpointStash(taskId);
  console.log(chalk.green(`✔ Stashed active diffs to branch: ${chalk.bold(stashBranch)}`));
  console.log(chalk.dim("- Working tree is clean."));
  console.log(
    chalk.yellow(
      "\nCreate your gap spec at `.harness/spec/features/<feat>/gaps/GAP-XXX.md` to triage.\n"
    )
  );
}