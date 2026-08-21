import fs from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import matter from "gray-matter";
import { ConfigManager } from "../engines/config-manager.js";
import { GitManager } from "../engines/git-manager.js";
import { SpecDatabase } from "../engines/spec-database.js";
import { parseTaskManifest } from "../parsers/task-parser.js";

export async function runClose(taskId: string): Promise<void> {
	const taskFilePath = path.join(
		process.cwd(),
		".harness",
		"tasks",
		`${taskId}.md`,
	);
	const manifest = await parseTaskManifest(taskFilePath);

	if (manifest.frontmatter.status === "DONE") {
		console.log(chalk.yellow(`✔ Task ${taskId} is already closed.`));
		return;
	}

	// 1. Boundary Final Check
	const boundaryCheck = await GitManager.validateFileBoundaries(
		manifest.allowedFiles,
	);
	if (!boundaryCheck.valid) {
		console.error(
			chalk.red("✖ Cannot close: Unallowed file modifications exist:"),
		);
		console.error(chalk.red(`  ${boundaryCheck.violatingFiles.join("\n  ")}`));
		process.exit(1);
	}

	// 2. Set Status to DONE
	const raw = await fs.readFile(taskFilePath, "utf-8");
	const parsed = matter(raw);
	parsed.data.status = "DONE";
	await fs.writeFile(
		taskFilePath,
		matter.stringify(parsed.content, parsed.data),
		"utf-8",
	);

	// Update status in SQLite Database
	try {
		const harnessDir = path.join(process.cwd(), ".harness");
		const specDb = new SpecDatabase(harnessDir);
		specDb.updateTaskStatus(taskId, "DONE");
		specDb.close();
	} catch {}

	// 3. Write Spawn Log Receipt with time worked, token usage, and status COMPLETED
	const { SpawnLogger } = await import("../engines/spawn-logger.js");
	const state = await SpawnLogger.getTaskState(taskId, manifest.allowedFiles);
	const endTime = new Date().toISOString();
	const durationSeconds = Math.max(
		0.1,
		(new Date(endTime).getTime() - new Date(state.startTime).getTime()) / 1000,
	);

	const receiptPath = await SpawnLogger.writeReceipt({
		taskId: manifest.frontmatter.id,
		taskTitle: manifest.frontmatter.title,
		agentName: state.agentName || "tech-lead",
		status: "COMPLETED",
		startTime: state.startTime,
		endTime,
		durationSeconds,
		tokenUsage: state.tokenUsage,
		allowedFiles: manifest.allowedFiles,
	});

	console.log(chalk.dim(`- Spawn Receipt: ${receiptPath}`));

	console.log(
		chalk.bold.green(
			`\n✔ Task ${taskId} successfully closed and logged in spawn-log!\n`,
		),
	);
}
