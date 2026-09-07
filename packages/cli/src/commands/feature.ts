import fs from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import matter from "gray-matter";
import { ConfigManager } from "../engines/config-manager.js";
import { RiskEngine } from "../engines/risk-engine.js";

export async function runFeature(
	featureName: string,
	options: { files?: string; isSchema?: boolean },
): Promise<void> {
	const cwd = process.cwd();
	const harnessDir = path.join(cwd, ".harness");
	const slug = featureName.toLowerCase().replace(/[^a-z0-9]/g, "-");

	console.log(
		chalk.bold.cyan(
			`\n⚡ Generating Feature (1-Pass Agile Loop): ${featureName}\n`,
		),
	);

	const targetFiles = options.files
		? options.files.split(",").map((f) => f.trim())
		: ["src/feature.ts", "tests/feature.test.ts"];
	const isSchema = !!options.isSchema;

	// 1. Evaluate Risk Score
	const risk = RiskEngine.evaluateTaskRisk(targetFiles, isSchema);
	console.log(RiskEngine.formatRiskCard(risk));

	// 2. Prepare Task Manifest
	await fs.mkdir(harnessDir, { recursive: true });
	const featId = `feat-${slug}`;
	const taskId = `task-${slug}`;

	// 3. Emit Task Manifest task-XXX.md
	const tasksDir = path.join(harnessDir, "tasks");
	await fs.mkdir(tasksDir, { recursive: true });

	const taskPath = path.join(tasksDir, `${taskId}.md`);

	let cfg: any = null;
	try {
		cfg = await ConfigManager.load();
	} catch {}
	const pipelineMode = cfg?.pipelineMode || "agile-fasttrack";
	const workflowMode = cfg?.workflowMode || "orchestrated";

	const taskContent = matter.stringify(
		[
			`# Task: ${featureName}`,
			"",
			"## 1. Allowed File Boundaries",
			...targetFiles.map((f) => `- \`${f}\``),
			"",
			"## 2. Acceptance Criteria",
			"- [ ] Verify component contract and layout invariants",
			`- [ ] Verify ${featureName} logic satisfies RED-GREEN test suite`,
			"",
			"## 3. Verification Commands",
			"```bash",
			"bun test",
			"```",
		].join("\n"),
		{
			id: taskId,
			title: featureName,
			status: "TODO",
			pipelineMode,
			workflowMode,
			riskLevel: risk.level,
			feature_ref: featId,
		},
	);

	await fs.writeFile(taskPath, taskContent, "utf-8");

	console.log(
		chalk.bold.green(
			`\n✔ Feature ${featureName} initialized and atomic task generated:`,
		),
	);
	console.log(chalk.dim(`  - Task Manifest: .harness/tasks/${taskId}.md`));
	console.log(
		chalk.cyan(`\nNext: Run 'harness start ${taskId}' to execute.\n`),
	);
}
