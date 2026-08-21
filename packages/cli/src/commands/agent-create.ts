import fs from "node:fs/promises";
import path from "node:path";
import { AdapterCompiler } from "@harness/adapters";
import chalk from "chalk";
import enquirer from "enquirer";
import {
	type CustomAgent,
	CustomAgentSchema,
} from "../schemas/agent.schema.js";
import type { HarnessConfig } from "../schemas/harness-config.schema.js";

interface AgentCreateAnswers {
	name: string;
	description: string;
	mode: "subagent" | "primary";
	providerType: "openrouter" | "anthropic" | "openai" | "custom";
	model: string;
	promptCaching: boolean;
	permissionPreset: "read_only" | "runner" | "worker";
	systemPrompt: string;
}

type PermissionOption = "allow" | "deny";
type InteractivePermission = PermissionOption | "ask";

interface PermissionType {
	edit: InteractivePermission;
	bash: InteractivePermission;
	task: Record<string, InteractivePermission>;
	externalDirectory: PermissionOption;
}

export async function runAgentCreate(initialName?: string): Promise<void> {
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

	console.log(chalk.bold.cyan("\n🤖 Creating New Agent / Subagent\n"));

	const questions: Parameters<typeof enquirer.prompt>[0] = [
		{
			type: "input",
			name: "name",
			message: "Agent Identifier (kebab-case):",
			initial: initialName || "security-auditor",
			validate: (val: string) =>
				/^[a-z0-9-]+$/.test(val) || "Must be kebab-case (e.g. perf-analyzer)",
		},
		{
			type: "input",
			name: "description",
			message: "Description (What triggers or defines this agent?):",
			initial:
				"Performs security scans and analyzes dependency vulnerabilities.",
		},
		{
			type: "select",
			name: "mode",
			message: "Agent Mode:",
			choices: [
				{ name: "subagent", message: "Subagent (Delegated task execution)" },
				{ name: "primary", message: "Primary (Direct chat persona)" },
			],
		},
		{
			type: "select",
			name: "providerType",
			message: "LLM Provider:",
			choices: [
				{ name: "openrouter", message: "OpenRouter (Multi-model Gateway)" },
				{ name: "anthropic", message: "Anthropic Direct" },
				{ name: "openai", message: "OpenAI Direct" },
				{ name: "custom", message: "Custom / Local Endpoint" },
			],
		},
		{
			type: "input",
			name: "model",
			message: "Model Identifier:",
			initial: config.provider.model,
		},
		{
			type: "confirm",
			name: "promptCaching",
			message: "Enable Prompt Caching for this agent?",
			initial: true,
		},
		{
			type: "select",
			name: "permissionPreset",
			message: "Permission Preset:",
			choices: [
				{
					name: "read_only",
					message: "Read-Only / Auditor (edit: deny, bash: ask, task: deny)",
				},
				{
					name: "runner",
					message: "Test / Script Runner (edit: deny, bash: allow, task: deny)",
				},
				{
					name: "worker",
					message: "Autonomous Worker (edit: allow, bash: allow, task: deny)",
				},
			],
		},
		{
			type: "input",
			name: "systemPrompt",
			message: "Agent Role Instructions / System Prompt:",
			initial:
				"You are a specialized agent. Enforce project standards and report concise summaries.",
		},
	];

	const answers = await enquirer.prompt<AgentCreateAnswers>(questions);

	let permissions: PermissionType = {
		edit: "allow",
		bash: "ask",
		task: { "*": "deny" },
		externalDirectory: "deny",
	};

	if (answers.permissionPreset === "read_only") {
		permissions = {
			edit: "deny",
			bash: "ask",
			task: { "*": "deny" },
			externalDirectory: "deny",
		};
	} else if (answers.permissionPreset === "runner") {
		permissions = {
			edit: "deny",
			bash: "allow",
			task: { "*": "deny" },
			externalDirectory: "deny",
		};
	} else if (answers.permissionPreset === "worker") {
		permissions = {
			edit: "allow",
			bash: "allow",
			task: { "*": "deny" },
			externalDirectory: "deny",
		};
	}

	const agentPayload: CustomAgent = {
		name: answers.name,
		description: answers.description,
		mode: answers.mode,
		provider: {
			type: answers.providerType,
			model: answers.model,
			promptCaching: answers.promptCaching,
		},
		permissions,
		systemPrompt: answers.systemPrompt,
	};

	const validatedAgent = CustomAgentSchema.parse(agentPayload);

	// 1. Save canonical agent definition to .harness/agents/<name>.json
	const agentsDir = path.join(cwd, ".harness", "agents");
	await fs.mkdir(agentsDir, { recursive: true });
	await fs.writeFile(
		path.join(agentsDir, `${validatedAgent.name}.json`),
		JSON.stringify(validatedAgent, null, 2),
		"utf-8",
	);

	// 2. Re-compile all active tool configurations
	const compiledFiles = await AdapterCompiler.compileAll(config, cwd);

	console.log(
		chalk.green(`\n✨ Agent '${validatedAgent.name}' successfully created!`),
	);
	console.log(
		chalk.dim(`- Canonical Spec: .harness/agents/${validatedAgent.name}.json`),
	);
	console.log(
		chalk.dim(
			`- Synchronized Adapter Files:\n  ${compiledFiles.map((f) => `• ${f}`).join("\n  ")}`,
		),
	);
	console.log(
		chalk.cyan(
			`\nYou can now delegate tasks to @${validatedAgent.name} in your AI tool.\n`,
		),
	);
}
