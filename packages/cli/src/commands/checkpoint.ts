import chalk from "chalk";
import { GitManager } from "../engines/git-manager.js";

export async function runCheckpoint(taskId: string): Promise<void> {
	console.log(
		chalk.bold.cyan(`\n💾 Checkpointing Task: ${taskId} for Delta Protocol`),
	);

	const stashBranch = await GitManager.checkpointStash(taskId);
	console.log(chalk.green(`✔ Diffs stashed to branch: ${stashBranch}`));
	console.log(chalk.dim("- Working tree returned to clean state."));
	console.log(
		chalk.yellow(
			"\nCreate your gap spec at `.harness/spec/features/<feat>/gaps/GAP-XXX.md` to resolve new scope.\n",
		),
	);
}
