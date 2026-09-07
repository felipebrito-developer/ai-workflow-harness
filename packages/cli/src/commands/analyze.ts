import chalk from "chalk";
import { RepoAnalyzer } from "../engines/repo-analyzer.js";

export async function runAnalyze(): Promise<void> {
	const cwd = process.cwd();
	console.log(
		chalk.bold.cyan("\n🚀 Running Harness Brownfield Auto-Discovery\n"),
	);
	const result = await RepoAnalyzer.analyze(cwd);
	console.log(
		chalk.bold.green(
			`\n✔ Auto-discovery complete for project: ${result.projectName}`,
		),
	);
	console.log(
		chalk.dim("- Created baseline markdown specs in .harness/spec/\n"),
	);
}
