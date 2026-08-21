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

	// 3. Write Spawn Log Receipt
	const spawnDir = path.join(process.cwd(), ".harness", "memory", "spawn-log");
	await fs.mkdir(spawnDir, { recursive: true });

	const logContent = [
		`# Spawn Log — Task Closed — ${taskId}`,
		"",
		`> **Task:** ${manifest.frontmatter.title}`,
		"> **Outcome:** GREEN / COMPLETED",
		`> **Closed At:** ${new Date().toISOString()}`,
		"",
		"## Verified Touched Files",
		...manifest.allowedFiles.map((f) => `- \`${f}\``),
	].join("\n");

	await fs.writeFile(
		path.join(spawnDir, `closed-${taskId}.md`),
		logContent,
		"utf-8",
	);

	// 4. Memory Backend Integration
	try {
		const config = await ConfigManager.load();
		if (config.memoryBackend?.type === "ai-memory") {
			const wikiDir = path.join(
				process.cwd(),
				config.memoryBackend.aiMemoryConfig?.wikiPath || ".harness/wiki",
			);
			await fs.mkdir(wikiDir, { recursive: true });
			await fs.appendFile(
				path.join(wikiDir, "spawn-log.md"),
				`\n${logContent}\n`,
				"utf-8",
			);
			console.log(chalk.cyan("- ai-memory: Spawn log appended to wiki"));
		}
	} catch (e) {
		// Graceful fallback
	}

	console.log(
		chalk.bold.green(
			`\n✔ Task ${taskId} successfully closed and logged in spawn-log!\n`,
		),
	);
}
