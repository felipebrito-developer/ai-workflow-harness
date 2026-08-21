import chalk from "chalk";
import { SecurityScanner } from "../engines/security-scanner.js";

export async function runAudit(): Promise<void> {
	const cwd = process.cwd();
	console.log(
		chalk.bold.cyan("\n🔒 Running Harness Security & Vulnerability Audit\n"),
	);

	console.log(
		chalk.dim(
			"- Scanning repository for credential leaks and unprotected .env files...",
		),
	);
	const secretIssues = await SecurityScanner.scanRepoSecrets(cwd);

	console.log(chalk.dim("- Executing dependency vulnerability checks..."));
	const depIssues = await SecurityScanner.runDependencyAudit(cwd);

	const allIssues = [...secretIssues, ...depIssues];

	if (allIssues.length === 0) {
		console.log(
			chalk.bold.green(
				"\n✔ SECURITY AUDIT PASSED: No credential leaks or critical package vulnerabilities found!\n",
			),
		);
	} else {
		console.log(`\n${SecurityScanner.formatSecurityCard(allIssues)}\n`);
		process.exit(1);
	}
}
