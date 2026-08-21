import fs from "node:fs/promises";
import path from "node:path";
import { AdapterCompiler } from "@harness/adapters";
import chalk from "chalk";
import type { HarnessConfig } from "../schemas/harness-config.schema.js";

interface AgentRow {
	name: string;
	mode: string;
	provider: string;
	model: string;
	caching: string;
	source: "default" | "custom";
}

export async function runAgentList(): Promise<void> {
	const cwd = process.cwd();
	const harnessConfigPath = path.join(cwd, ".harness", "harness.config.json");

	try {
		await fs.access(harnessConfigPath);
	} catch {
		console.error(
			chalk.red(
				"Error: .harness directory not found. Run 'harness init' first.",
			),
		);
		process.exit(1);
	}

	const rawConfig = await fs.readFile(harnessConfigPath, "utf-8");
	const config: HarnessConfig = JSON.parse(rawConfig);
	const customAgents = await AdapterCompiler.loadCustomAgents(cwd);

	const agents: AgentRow[] = [
		{
			name: "architect",
			mode: "primary",
			provider: config.provider.type,
			model: config.provider.model,
			caching: config.provider.promptCaching ? "enabled" : "disabled",
			source: "default",
		},
		{
			name: "test-runner",
			mode: "subagent",
			provider: config.provider.type,
			model: config.provider.model,
			caching: config.provider.promptCaching ? "enabled" : "disabled",
			source: "default",
		},
		{
			name: "code-reviewer",
			mode: "subagent",
			provider: config.provider.type,
			model: config.provider.model,
			caching: config.provider.promptCaching ? "enabled" : "disabled",
			source: "default",
		},
		...customAgents.map((agent) => ({
			name: agent.name,
			mode: agent.mode,
			provider: agent.provider.type,
			model: agent.provider.model,
			caching: agent.provider.promptCaching ? "enabled" : "disabled",
			source: "custom" as const,
		})),
	];

	console.log(chalk.bold.cyan("\n🤖 Active Agents & Model Configuration\n"));

	// Column widths
	const colName = 22;
	const colMode = 12;
	const colProvider = 14;
	const colModel = 32;
	const colCaching = 10;

	const header = `  ${chalk.bold("AGENT".padEnd(colName))}${chalk.bold("MODE".padEnd(colMode))}${chalk.bold("PROVIDER".padEnd(colProvider))}${chalk.bold("MODEL".padEnd(colModel))}${chalk.bold("CACHING".padEnd(colCaching))}`;

	console.log(header);
	console.log(
		chalk.dim(
			`  ${"─".repeat(colName + colMode + colProvider + colModel + colCaching)}`,
		),
	);

	for (const agent of agents) {
		const formattedName =
			agent.source === "default"
				? chalk.blue(`@${agent.name}`)
				: chalk.green(`@${agent.name}`);

		const modeColor =
			agent.mode === "primary"
				? chalk.magenta(agent.mode)
				: chalk.dim(agent.mode);
		const cachingColor =
			agent.caching === "enabled" ? chalk.green("✔ on") : chalk.dim("off");

		// Pad lengths manually accounting for terminal color codes
		const namePadded = `@${agent.name}`.padEnd(colName);
		const renderedName =
			agent.source === "default"
				? chalk.blue(namePadded)
				: chalk.green(namePadded);

		console.log(
			`  ${renderedName}` +
				`${modeColor.padEnd(colMode + (modeColor.length - agent.mode.length))}` +
				`${chalk.white(agent.provider.padEnd(colProvider))}` +
				`${chalk.yellow(agent.model.padEnd(colModel))}` +
				`${cachingColor}`,
		);
	}

	console.log(
		chalk.dim(
			`\n  Legend: ${chalk.blue("■ Default (Core)")}  ${chalk.green("■ Custom (.harness/agents/)")}`,
		),
	);
	console.log(chalk.dim(`  Total: ${agents.length} agent(s) configured\n`));
}
