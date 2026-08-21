import path from "node:path";
import chalk from "chalk";
import { AstValidator } from "../engines/ast-validator.js";
import { GitManager } from "../engines/git-manager.js";
import { SecurityScanner } from "../engines/security-scanner.js";
import { parseTaskManifest } from "../parsers/task-parser.js";

export async function runPreflight(taskId: string): Promise<void> {
	const taskFilePath = path.join(
		process.cwd(),
		".harness",
		"tasks",
		`${taskId}.md`,
	);
	const manifest = await parseTaskManifest(taskFilePath);
	console.log(chalk.bold.cyan(`\n🔍 Running Preflight Gate for ${taskId}\n`));

	// 1. Working Tree Inspection & Security Secret Gate
	const isClean = await GitManager.isWorkingTreeClean();
	const currentBranch = await GitManager.getCurrentBranch();

	console.log(`- Active Branch: ${chalk.bold(currentBranch)}`);
	if (!isClean) {
		console.log(
			chalk.yellow(
				"⚠️  Working tree has uncommitted modifications. Scanning for secrets...",
			),
		);
		const diffText = await GitManager.getWorkingTreeDiff();
		const securityIssues = await SecurityScanner.scanDiffSecrets(diffText);
		if (securityIssues.length > 0) {
			console.log(`\n${SecurityScanner.formatSecurityCard(securityIssues)}\n`);
			process.exit(1);
		}
	} else {
		console.log(chalk.green("✔ Working tree clean and secret-free."));
	}

	// 2. Memory Backend Daemon Check
	try {
		const { ConfigManager } = await import("../engines/config-manager.js");
		const config = await ConfigManager.load();
		if (config?.memoryBackend?.type === "ai-memory") {
			try {
				const res = await fetch("http://127.0.0.1:49374/admin/status", {
					signal: AbortSignal.timeout(1000),
				});
				if (res.ok) {
					console.log(
						chalk.green(
							"✔ Memory Backend (ai-memory) daemon online (127.0.0.1:49374).",
						),
					);
				} else {
					console.log(
						chalk.yellow(
							"⚠️ Memory Backend daemon (ai-memory) returned non-200 status.",
						),
					);
				}
			} catch {
				console.log(
					chalk.yellow(
						"⚠️ Memory Backend (ai-memory) daemon not reachable at http://127.0.0.1:49374.\n" +
							"   Start daemon: nohup ~/.local/bin/ai-memory --data-dir ~/.local/share/ai-memory > ~/.local/share/ai-memory/server.log 2>&1 &",
					),
				);
			}
		}
	} catch {}

	// 2. Boundary AST Validation
	console.log("- Validating AST for target boundaries...");
	const astValidator = new AstValidator();
	const astResult = await astValidator.validateFiles(manifest.allowedFiles);

	if (!astResult.valid) {
		console.log(chalk.yellow("✖ AST Diagnostic Warnings:"));
		for (const err of astResult.errors) {
			console.log(chalk.dim(`  | ${err}`));
		}
	} else {
		console.log(chalk.green("✔ AST / Type resolution clean."));
	}

	// 3. Output Mandatory Agent Echo Contract
	console.log(
		chalk.bold.blue(
			"\n📋 Required Agent Echo Contract (Paste in opening turn):",
		),
	);
	console.log(
		chalk.dim("┌────────────────────────────────────────────────────────┐"),
	);
	console.log(
		chalk.dim("│ [PREFLIGHT ECHO]                                       │"),
	);
	console.log(chalk.dim(`│ Task ID: ${manifest.frontmatter.id.padEnd(46)}│`));
	console.log(
		chalk.dim(
			`│ Allowed Files: ${manifest.allowedFiles.join(", ").slice(0, 39).padEnd(40)}│`,
		),
	);
	console.log(
		chalk.dim(
			`│ Verification: ${(manifest.verificationCommands[0] || "None").slice(0, 40).padEnd(41)}│`,
		),
	);
	console.log(
		chalk.dim("└────────────────────────────────────────────────────────┘\n"),
	);
}
