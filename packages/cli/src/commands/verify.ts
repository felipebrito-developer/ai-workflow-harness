import fs from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import { execa } from "execa";
import matter from "gray-matter";
import { CircuitBreaker } from "../engines/circuit-breaker.js";
import { ConfigManager } from "../engines/config-manager.js";
import { ErrorSanitizer } from "../engines/error-sanitizer.js";
import { GitManager } from "../engines/git-manager.js";
import { SpecDatabase } from "../engines/spec-database.js";
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

export async function runVerify(taskId: string): Promise<void> {
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
		process.exit(1);
	}

	// Sync task state with SQLite harness.db
	try {
		const specDb = new SpecDatabase(path.join(process.cwd(), ".harness"));
		const mappedStatus = manifest.frontmatter.status === "BLOCKED" ? "IN_PROGRESS" : (manifest.frontmatter.status as "TODO" | "IN_PROGRESS" | "VERIFYING" | "DONE");
		specDb.upsertTask({
			id: manifest.frontmatter.id,
			spec_id: manifest.frontmatter.feature_ref || "feat-general",
			status: mappedStatus,
			allowed_files: JSON.stringify(manifest.allowedFiles),
			acceptance_criteria: JSON.stringify(manifest.acceptanceCriteria || []),
		});
		specDb.close();
	} catch {}
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
				try {
					await GitManager.rollbackAllowedFiles(manifest.allowedFiles);
				} catch (rollbackErr: any) {
					console.error(
						chalk.red(`Failed to rollback: ${rollbackErr.message}`),
					);
				}
				console.error(
					chalk.yellow(
						"Working tree rolled back to preflight state. Spawn receipt written to .harness/memory/spawn-log/.\n",
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

	// All passed: Step 4 - Update task frontmatter status to DONE & reset attempt counters
	try {
		const raw = await fs.readFile(taskFilePath, "utf-8");
		const parsed = matter(raw);
		parsed.data.status = "DONE";
		await fs.writeFile(
			taskFilePath,
			matter.stringify(parsed.content, parsed.data),
			"utf-8",
		);
	} catch (writeErr: any) {
		console.error(
			chalk.red(`Failed to update task status to DONE: ${writeErr.message}`),
		);
	}

	try {
		const specDb = new SpecDatabase(path.join(process.cwd(), ".harness"));
		specDb.upsertTask({
			id: manifest.frontmatter.id,
			spec_id: manifest.frontmatter.feature_ref || "feat-general",
			status: "DONE",
			allowed_files: JSON.stringify(manifest.allowedFiles),
			acceptance_criteria: JSON.stringify(manifest.acceptanceCriteria || []),
		});
		specDb.close();
	} catch {}

	await CircuitBreaker.resetAttempts(taskId);
	console.log(
		chalk.bold.green(
			`\n✨ Task ${manifest.frontmatter.id} verified & marked DONE!\n`,
		),
	);
}
