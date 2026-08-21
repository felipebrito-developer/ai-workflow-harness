import fs from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import matter from "gray-matter";
import { ConfigManager } from "../engines/config-manager.js";
import { GitManager } from "../engines/git-manager.js";
import { SpecDatabase } from "../engines/spec-database.js";
import { parseTaskManifest } from "../parsers/task-parser.js";

export async function runStart(taskId: string): Promise<void> {
	const taskFilePath = path.join(
		process.cwd(),
		".harness",
		"tasks",
		`${taskId}.md`,
	);
	try {
		await fs.access(taskFilePath);
	} catch {
		console.error(
			chalk.red(`Error: Task manifest not found at ${taskFilePath}`),
		);
		process.exit(1);
	}

	const manifest = await parseTaskManifest(taskFilePath);

	if (manifest.frontmatter.status === "DONE") {
		console.error(
			chalk.red("✖ Task is already marked as DONE and cannot be restarted."),
		);
		process.exit(1);
	}

	console.log(
		chalk.bold.cyan(
			`\n🚀 Starting Task: ${manifest.frontmatter.id} - ${manifest.frontmatter.title}`,
		),
	);

	// 1. Switch or create isolated task branch
	const branchName = await GitManager.ensureTaskBranch(
		manifest.frontmatter.id,
		manifest.frontmatter.title,
	);
	console.log(chalk.dim(`- Git Branch: ${branchName}`));

	// 2. Toggle Status to IN_PROGRESS
	const raw = await fs.readFile(taskFilePath, "utf-8");
	const parsed = matter(raw);
	parsed.data.status = "IN_PROGRESS";
	await fs.writeFile(
		taskFilePath,
		matter.stringify(parsed.content, parsed.data),
		"utf-8",
	);

	const specDb = new SpecDatabase(path.join(process.cwd(), ".harness"));
	try {
		specDb.updateTaskStatus(taskId, "IN_PROGRESS");
	} catch {
	} finally {
		specDb.close();
	}

	console.log(chalk.green("- Status: IN_PROGRESS"));
	console.log(
		chalk.dim(`- Allowed Boundaries: ${manifest.allowedFiles.join(", ")}`),
	);

	// 3. Record Task Start Session in SpawnLogger
	const { SpawnLogger } = await import("../engines/spawn-logger.js");
	await SpawnLogger.recordTaskStart(
		manifest.frontmatter.id,
		"tech-lead",
		manifest.allowedFiles,
	);

	// 3. Memory Backend Integration
	try {
		const config = await ConfigManager.load();
		if (config.memoryBackend?.type === "ai-memory") {
			console.log(
				chalk.cyan(
					`- ai-memory: Session tracking enabled for task ${manifest.frontmatter.id}`,
				),
			);
			// Load task context from previous attempts if any
			const attemptsPath = path.join(
				process.cwd(),
				".harness",
				"memory",
				"attempts",
				`${taskId}.md`,
			);
			try {
				const previousAttempts = await fs.readFile(attemptsPath, "utf-8");
				console.log(
					chalk.yellow("\n⚠️ Previous failed attempts found for this task:"),
				);
				console.log(chalk.dim(previousAttempts));
			} catch {
				// No previous attempts - clean start
			}
		}
	} catch (e) {
		// Config not found or invalid, skip gracefully
	}

	console.log(
		chalk.yellow(`\nRun 'harness preflight ${taskId}' before writing code.\n`),
	);
}
