import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import { execa } from "execa";
import matter from "gray-matter";
import { AstValidator } from "../engines/ast-validator.js";
import { CircuitBreaker } from "../engines/circuit-breaker.js";
import { ConfigManager } from "../engines/config-manager.js";
import { ErrorSanitizer } from "../engines/error-sanitizer.js";
import { GitManager } from "../engines/git-manager.js";
import { isTestFile } from "../schemas/task-manifest.schema.js";
import { parseTaskManifest } from "../parsers/task-parser.js";
import type { HarnessConfig } from "../schemas/harness-config.schema.js";

function parseCommandArgs(cmd: string): string[] {
	const matches = cmd.match(/[^"\s]+|"(?:\\"|[^"])*"/g);
	if (!matches) return [];
	return matches.map((arg) => {
		if (arg.startsWith('"') && arg.endsWith('"')) {
			return arg.slice(1, -1).replace(/\\"/g, '"');
		}
		return arg;
	});
}

async function computeSha256(filePath: string): Promise<string> {
	const content = await fs.readFile(filePath, "utf-8");
	return crypto.createHash("sha256").update(content).digest("hex");
}

export async function runVerify(
	taskId: string,
	options: { allowBlocked?: boolean } = {},
): Promise<void> {
	const taskFilePath = path.join(
		process.cwd(),
		".harness",
		"tasks",
		`${taskId}.md`,
	);
	const manifest = await parseTaskManifest(taskFilePath);

	console.log(
		chalk.bold.cyan(`\n🧪 Verifying Task: ${manifest.frontmatter.id}\n`),
	);

	// 2. Load Config
	let cfg: HarnessConfig | null = null;
	try {
		cfg = await ConfigManager.load();
	} catch {}
	const configLimit = cfg?.circuitBreakerLimit || 3;

	// 2a. Anti-Tampering Spec Lock
	if (manifest.frontmatter.specChecksum) {
		const testFile = manifest.allowedFiles.find(isTestFile);
		if (!testFile) {
			console.error(
				chalk.bold.red(
					"🚨 TAMPERING DETECTED: Task has a specChecksum but no test file is declared in allowedFiles.",
				),
			);
			process.exit(1);
		}
		
		const testFilePath = path.resolve(process.cwd(), testFile);
		try {
			const currentChecksum = await computeSha256(testFilePath);
			if (currentChecksum !== manifest.frontmatter.specChecksum) {
				console.error(
					chalk.bold.red(
						"🚨 TAMPERING DETECTED: Acceptance test file was modified by builder. Checksums do not match.",
					),
				);
				console.error(chalk.red(`Expected: ${manifest.frontmatter.specChecksum}`));
				console.error(chalk.red(`Actual:   ${currentChecksum}`));
				process.exit(1);
			}
			console.log(chalk.green("✔ Cryptographic Spec Lock valid."));
		} catch (err: any) {
			console.error(
				chalk.bold.red(
					`🚨 TAMPERING DETECTED: Failed to verify test file checksum: ${err.message}`,
				),
			);
			process.exit(1);
		}
	}

	if (options.allowBlocked) {
		console.log(chalk.yellow("⚠️  Running in Partial Verification Mode (--allow-blocked)."));
	}

	// 2. Validate Boundary Compliance
	const boundaryCheck = await GitManager.validateFileBoundaries(
		manifest.allowedFiles,
	);
	if (!boundaryCheck.valid) {
		console.log(chalk.bold.red("❌ File Boundary Compliance Failure:"));
		console.log(
			chalk.red(`  Violating files modified: ${boundaryCheck.violatingFiles.join(", ")}`),
		);
		console.log(
			chalk.dim("  Task execution must be restricted to declared allowedFiles in task manifest."),
		);

		await GitManager.revertUnallowedFiles(boundaryCheck.violatingFiles);
		console.log(
			chalk.yellow(`  Reverted unallowed files: ${boundaryCheck.violatingFiles.join(", ")}\n`),
		);

		const { tripped, currentAttempts } = await CircuitBreaker.recordFailure(
			taskId,
			"boundary-check",
			`File boundary violation: ${boundaryCheck.violatingFiles.join(", ")}`,
			configLimit,
			manifest.allowedFiles,
		);

		if (tripped) {
			console.error(
				chalk.bold.red(
					`\n🚨 CIRCUIT BREAKER TRIPPED (${currentAttempts}/${configLimit} failed attempts).`,
				),
			);
			console.error(
				chalk.yellow(
					"Working tree rolled back to preflight state.\n",
				),
			);
		}
		process.exit(1);
	}

	// 2b. AST Validation for Allowed Files
	const astValidator = new AstValidator();
	const astResult = await astValidator.validateFiles(manifest.allowedFiles);
	if (!astResult.valid) {
		console.log(chalk.bold.red("❌ AST Validation Failure:"));
		for (const err of astResult.errors) {
			console.log(chalk.red(`  - ${err}`));
		}
		const { tripped, currentAttempts } = await CircuitBreaker.recordFailure(
			taskId,
			"ast-validation",
			`AST syntax/symbol errors: ${astResult.errors.slice(0, 3).join("; ")}`,
			configLimit,
			manifest.allowedFiles,
		);
		if (tripped) {
			console.error(
				chalk.bold.red(
					`\n🚨 CIRCUIT BREAKER TRIPPED (${currentAttempts}/${configLimit} failed attempts).`,
				),
			);
		}
		process.exit(1);
	}

	console.log(chalk.green("✔ File boundaries verified."));

	// 3. Execute Verification Commands
	for (const cmd of manifest.verificationCommands) {
		console.log(chalk.dim(`- Executing: ${cmd}`));
		try {
			const parsedArgs = parseCommandArgs(cmd.trim());
			if (parsedArgs.length === 0) continue;
			const bin = parsedArgs[0];
			const args = parsedArgs.slice(1);
			await execa(bin, args, { stdio: "pipe" });
			console.log(chalk.green(`✔ Passed: ${cmd}`));
		} catch (err: any) {
			console.error(chalk.red(`✖ Failed: ${cmd}`));

			const errorCard = ErrorSanitizer.sanitize(
				cmd,
				err.stderr || "",
				err.stdout || "",
			);
			console.log(`\n${ErrorSanitizer.formatErrorCard(errorCard)}\n`);

			// Record failure with circuit breaker
			const { tripped, currentAttempts } = await CircuitBreaker.recordFailure(
				taskId,
				cmd,
				errorCard.summary,
				configLimit,
				manifest.allowedFiles,
			);

			if (tripped) {
				console.error(
					chalk.bold.red(
						`\n🚨 CIRCUIT BREAKER TRIPPED (${currentAttempts}/${configLimit} failed attempts).`,
					),
				);
				console.error(
					chalk.yellow(
						"Working tree rolled back to preflight state. Spawn receipt written to .harness/logs/spawn-log/.\n",
					),
				);
			} else {
				console.log(
					chalk.yellow(
						`Attempt ${currentAttempts}/${configLimit}. Fix errors and re-verify.\n`,
					),
				);
			}
			process.exit(1);
		}
	}

	// All passed: Step 4 - Update task frontmatter status
	let newStatus = "DONE";
	if (options.allowBlocked && manifest.frontmatter.status === "BLOCKED_PARTIAL") {
		newStatus = "NEEDS_PLANNER_REVIEW";
	}

	try {
		const raw = await fs.readFile(taskFilePath, "utf-8");
		const parsed = matter(raw);
		parsed.data.status = newStatus;
		await fs.writeFile(
			taskFilePath,
			matter.stringify(parsed.content, parsed.data),
			"utf-8",
		);
	} catch (writeErr: any) {
		console.error(
			chalk.red(`Failed to update task status to ${newStatus}: ${writeErr.message}`),
		);
	}

	await CircuitBreaker.resetAttempts(taskId);
	await GitManager.createAtomicTaskCommit(taskId, manifest.allowedFiles, taskFilePath);
	
	if (newStatus === "DONE") {
		console.log(
			chalk.bold.green(
				`\n✨ Task ${manifest.frontmatter.id} verified & marked DONE!\n`,
			),
		);
	} else {
		console.log(
			chalk.bold.yellow(
				`\n⚠️ Task ${manifest.frontmatter.id} verified partially & marked NEEDS_PLANNER_REVIEW.\n`,
			),
		);
	}
}
