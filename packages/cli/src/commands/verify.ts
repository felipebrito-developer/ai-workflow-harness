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
		const isVibeMode = cfg?.workflowMode === "vibe-assist";
		const autoExpand = cfg?.vibeSettings?.autoExpandBoundaries ?? true;

		if (isVibeMode && autoExpand) {
			const updatedFiles = Array.from(
				new Set([...manifest.allowedFiles, ...boundaryCheck.violatingFiles]),
			);

			if (updatedFiles.length > 5) {
				console.log(
					chalk.bold.yellow(
						`\n⚠️ Max 5 File Ceiling Exceeded! Task has expanded to ${updatedFiles.length} files.`,
					),
				);
				console.log(
					chalk.yellow(
						"  Consider re-slicing this task into smaller atomic tasks with @po-agent.\n",
					),
				);
			}

			console.log(
				chalk.yellow(
					"⚠️ Vibe-Assist Mode: Auto-expanding allowed files boundary to include:",
				),
			);
			console.log(
				chalk.dim(`  + ${boundaryCheck.violatingFiles.join("\n  + ")}`),
			);
			manifest.allowedFiles = updatedFiles;

			// 1. Persist the updated boundaries back to the task manifest (frontmatter + body)
			try {
				const raw = await fs.readFile(taskFilePath, "utf-8");
				const parsed = matter(raw);
				parsed.data.allowedFiles = manifest.allowedFiles;

				// Update ## 1. Allowed File Boundaries section in content
				let newContent = parsed.content;
				const boundariesRegex = /## 1\. Allowed File Boundaries\n[\s\S]*?(?=\n## |$)/;
				const newBoundariesSection = `## 1. Allowed File Boundaries\n${manifest.allowedFiles.map((f) => `- \`${f}\``).join("\n")}`;
				if (boundariesRegex.test(newContent)) {
					newContent = newContent.replace(boundariesRegex, newBoundariesSection);
				}

				await fs.writeFile(
					taskFilePath,
					matter.stringify(newContent, parsed.data),
					"utf-8",
				);
				console.log(
					chalk.dim("- Updated task manifest file boundaries on disk."),
				);
			} catch (writeErr: any) {
				console.error(
					chalk.red(`Failed to persist boundaries: ${writeErr.message}`),
				);
			}

			// 2. Sync updated boundaries with SQLite harness.db
			try {
				const specDb = new SpecDatabase(path.join(process.cwd(), ".harness"));
				specDb.upsertTask({
					id: manifest.frontmatter.id,
					spec_id: manifest.frontmatter.feature_ref || "feat-general",
					status: manifest.frontmatter.status || "IN_PROGRESS",
					allowed_files: JSON.stringify(manifest.allowedFiles),
					acceptance_criteria: JSON.stringify(manifest.acceptanceCriteria || []),
				});
				specDb.close();
				console.log(chalk.dim("- Synced updated file boundaries to SQLite harness.db"));
			} catch (dbErr: any) {
				console.error(
					chalk.dim(`Note: Could not sync boundaries to harness.db: ${dbErr.message}`),
				);
			}

			// 3. Log expansion receipt to .harness/memory/attempts/boundary-expansions.json
			try {
				const attemptsDir = path.join(process.cwd(), ".harness", "memory", "attempts");
				await fs.mkdir(attemptsDir, { recursive: true });
				const receiptPath = path.join(attemptsDir, "boundary-expansions.json");
				let receipts: any[] = [];
				try {
					const existing = await fs.readFile(receiptPath, "utf-8");
					receipts = JSON.parse(existing);
				} catch {}
				receipts.push({
					taskId: manifest.frontmatter.id,
					timestamp: new Date().toISOString(),
					violatingFiles: boundaryCheck.violatingFiles,
					totalAllowedFiles: manifest.allowedFiles.length,
				});
				await fs.writeFile(receiptPath, JSON.stringify(receipts, null, 2), "utf-8");
			} catch {}
		} else {
			console.error(chalk.red("✖ File Boundary Violation Detected!"));
			console.error(
				chalk.red(
					`  Modified out-of-scope files:\n  ${boundaryCheck.violatingFiles.join("\n  ")}`,
				),
			);
			process.exit(1);
		}
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

			// Write to failed attempts log in ai-memory if enabled
			if (cfg?.memoryBackend?.type === "ai-memory") {
				const failLog = `## Failed Attempt: ${taskId}\n- Error: ${errorCard.summary}\n- Files: ${manifest.allowedFiles.join(", ")}\n- Timestamp: ${new Date().toISOString()}\n`;
				try {
					const attemptsDir = path.join(
						process.cwd(),
						".harness",
						"memory",
						"attempts",
					);
					await fs.mkdir(attemptsDir, { recursive: true });
					await fs.appendFile(
						path.join(attemptsDir, `${taskId}.md`),
						failLog,
						"utf-8",
					);
				} catch {}
			}

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

	// All passed: reset attempt counters
	await CircuitBreaker.resetAttempts(taskId);
	console.log(chalk.bold.green("\n✨ All verification gates passed!\n"));
}
