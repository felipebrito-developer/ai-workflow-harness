import fs from "node:fs/promises";
import path from "node:path";
import { AdapterCompiler } from "@harness/adapters";
import chalk from "chalk";
import enquirer from "enquirer";
import { execa } from "execa";
import { AgentMapper } from "../engines/agent-mapper.js";
import { RepoAnalyzer } from "../engines/repo-analyzer.js";
import { SpecDatabase } from "../engines/spec-database.js";
import { TemplateScaffolder } from "../engines/template-scaffolder.js";
import {
	type HarnessConfig,
	HarnessConfigSchema,
} from "../schemas/harness-config.schema.js";

export type StackOption =
	| "react-web"
	| "react-native"
	| "node"
	| "go"
	| "db-sql"
	| "db-nosql"
	| "python";

export type ModelPresetOption =
	| "complex-best"
	| "complex-efficient"
	| "small-best"
	| "small-efficient"
	| "custom";

export interface InitAnswers {
	projectName: string;
	enableTokenOptimizations: boolean;
	stack: StackOption[];
	createSpecialistTemplates: boolean;
	installRecommendedSkills: boolean;
	adapters: ("opencode" | "antigravity")[];
	providerType: "openrouter" | "anthropic" | "openai" | "custom";
	modelPreset: ModelPresetOption;
	customDefaultModel?: string;
	packageManager?: "bun" | "pnpm" | "yarn" | "npm" | "cargo" | "go";
	cmdTest: string;
	cmdLint: string;
}

export async function runInit(): Promise<void> {
	console.log(chalk.bold.cyan("\n🔧 Initializing AI Workflow Harness\n"));

	const cwd = process.cwd();
	const harnessDir = path.join(cwd, ".harness");

	// 1. Brownfield Auto-Discovery Check
	let brownfieldResult: any = null;
	let isBrownfield = false;
	try {
		await fs.access(path.join(cwd, "package.json"));
		isBrownfield = true;
	} catch {
		try {
			await fs.access(path.join(cwd, "go.mod"));
			isBrownfield = true;
		} catch {}
	}

	if (isBrownfield) {
		const { runAutoScan } = await enquirer.prompt<{ runAutoScan: boolean }>({
			type: "confirm",
			name: "runAutoScan",
			message:
				"Existing codebase detected. Run Brownfield Auto-Discovery (harness analyze)?",
			initial: true,
		});
		if (runAutoScan) {
			brownfieldResult = await RepoAnalyzer.analyze(cwd);
		}
	}

	// 2. Conflict Audit
	const conflicts: string[] = [];
	for (const file of ["opencode.json", "antigravity.json", ".cursorrules"]) {
		try {
			await fs.access(path.join(cwd, file));
			conflicts.push(file);
		} catch {}
	}

	if (conflicts.length > 0) {
		console.log(
			chalk.yellow(
				`⚠️ Found existing tool configurations: ${conflicts.join(", ")}`,
			),
		);
		const { proceed } = await enquirer.prompt<{ proceed: boolean }>({
			type: "confirm",
			name: "proceed",
			message: "Harness will wrap these configurations. Proceed?",
			initial: true,
		});
		if (!proceed) {
			console.log(chalk.red("Initialization aborted."));
			return;
		}
	}

	// 2. Interactive Setup Prompts
	const questions: Parameters<typeof enquirer.prompt>[0] = [
		{
			type: "input",
			name: "projectName",
			message: "Project Name:",
			initial: brownfieldResult?.projectName || path.basename(cwd),
			skip() {
				// Skip asking if project name was already confirmed during brownfield auto-scan
				return !!brownfieldResult?.projectName;
			},
		},
		{
			type: "confirm",
			name: "enableTokenOptimizations",
			message:
				"Enable Token Usage Optimizations (Caveman brevity & Context Caching)?",
			initial: true,
		},
		{
			type: "multiselect",
			name: "stack",
			message: "Stack / Domains (Select all that apply):",
			choices: [
				{ name: "react-web", message: "React / Web Frontend" },
				{ name: "react-native", message: "React Native (Mobile)" },
				{ name: "node", message: "Node.js (Backend)" },
				{ name: "go", message: "Golang (Backend)" },
				{ name: "db-sql", message: "SQL Database (PostgreSQL / SQLite)" },
				{ name: "db-nosql", message: "NoSQL Database (MongoDB / DynamoDB)" },
				{ name: "python", message: "Python" },
			],
			initial: 0,
			validate(val: unknown) {
				if (!Array.isArray(val) || val.length === 0) {
					return "Please select at least one domain.";
				}
				return true;
			},
		},
		{
			type: "confirm",
			name: "createSpecialistTemplates",
			message: "Scaffold dedicated agent templates for selected stacks?",
			initial: true,
		},
		{
			type: "confirm",
			name: "installRecommendedSkills",
			message:
				"Install curated skill catalogs for chosen agents (.harness/skills/)?",
			initial: true,
		},
		{
			type: "multiselect",
			name: "adapters",
			message: "Select AI Tool Adapters:",
			choices: [
				{
					name: "opencode",
					message: "OpenCode (opencode.json + agent personas)",
				},
				{ name: "antigravity", message: "Antigravity (MCP server directives)" },
			],
			initial: 0,
		},
		{
			type: "select",
			name: "providerType",
			message: "LLM Gateway / Provider:",
			choices: [
				{
					name: "openrouter",
					message: "OpenRouter (Recommended — Multi-model routing)",
				},
				{ name: "anthropic", message: "Direct Anthropic" },
				{ name: "openai", message: "Direct OpenAI" },
				{ name: "custom", message: "Custom / Local Endpoint" },
			],
		},
		{
			type: "select",
			name: "modelPreset",
			message: "Select Model Strategy Preset:",
			choices: [
				{
					name: "complex-best",
					message: "Complex — Best Models (Sonnet 3.5 + DeepSeek R1 + GLM 5.2)",
				},
				{
					name: "complex-efficient",
					message:
						"Complex — Low Cost / Efficient (DeepSeek R1 + GLM 5.2 + Qwen 2.5 Coder)",
				},
				{
					name: "small-best",
					message: "Small — Best Models (Sonnet 3.5 + GLM 5.2)",
				},
				{
					name: "small-efficient",
					message:
						"Small — Low Cost / Efficient (GLM 5.2 + Qwen 2.5 Coder + Gemini Flash)",
				},
				{
					name: "custom",
					message: "Custom (Specify a single model ID for all agents)",
				},
			],
		},
		{
			type: "input",
			name: "customDefaultModel",
			message: "Enter Default Model ID:",
			initial: "anthropic/claude-3.5-sonnet",
			skip() {
				// @ts-ignore
				return this.state.answers.modelPreset !== "custom";
			},
		},
		{
			type: "input",
			name: "cmdTest",
			message: "Verification Test Command:",
			initial: brownfieldResult?.testCmd || "bun test",
		},
		{
			type: "input",
			name: "cmdLint",
			message: "Verification Lint Command:",
			initial: brownfieldResult?.lintCmd || "bunx @biomejs/biome check .",
		},
	];

	const answers = await enquirer.prompt<InitAnswers>(questions);

	const primaryModel = AgentMapper.getModelForRole(
		"workflow-orchestrator",
		answers,
	);

	const configPayload = {
		version: "1.0.0",
		projectName: answers.projectName,
		stack: answers.stack,
		packageManager: answers.packageManager || brownfieldResult?.packageManager || "bun",
		adapters: answers.adapters,
		provider: {
			model: primaryModel,
			promptCaching: answers.enableTokenOptimizations,
		},
		circuitBreakerLimit: 3,
		commands: {
			test: answers.cmdTest,
			lint: answers.cmdLint,
		},
	};

	const validatedConfig: HarnessConfig =
		HarnessConfigSchema.parse(configPayload);

	// 3. Directory Scaffolding
	const dirsToCreate = [
		path.join(harnessDir, "spec", "features"),
		path.join(harnessDir, "tasks"),
		path.join(harnessDir, "standards", "pipeline"),
		path.join(harnessDir, "agents"),
		path.join(harnessDir, "skills", "core"),
		path.join(harnessDir, "skills", "stack"),
		path.join(harnessDir, "skills", "testing"),
		path.join(harnessDir, "mcp"),
		path.join(harnessDir, "UI", "details"),
		path.join(harnessDir, "temp", "scripts"),
		path.join(harnessDir, "temp", "assets"),
		path.join(harnessDir, "temp", "artifacts"),
		path.join(harnessDir, "memory", "discovery"),
		path.join(harnessDir, "memory", "workday-log"),
		path.join(harnessDir, "memory", "spawn-log"),
		path.join(harnessDir, "memory", "attempts"),
	];

	for (const dir of dirsToCreate) {
		await fs.mkdir(dir, { recursive: true });
		const gitkeep = path.join(dir, ".gitkeep");
		try {
			await fs.writeFile(gitkeep, "", { flag: "wx" });
		} catch {}
	}

	// 4. Write Root .gitignore
	await fs.writeFile(
		path.join(harnessDir, ".gitignore"),
		[
			"# Ephemeral scratchpad",
			"temp/scripts/*",
			"temp/assets/*",
			"temp/artifacts/*",
			"!temp/*/.gitkeep",
			"",
			"# Ephemeral runtime memory",
			"memory/attempts/*",
			"!memory/attempts/.gitkeep",
			"",
			"# Memory spawn logs (generated)",
			"memory/spawn-log/*",
			"!memory/spawn-log/.gitkeep",
			"",
			"# SQLite Local Database",
			"!harness.db",
			"harness.db-wal",
			"harness.db-shm",
			"",
		].join("\n"),
		"utf-8",
	);

	// 4b. Scaffold spec-query MCP Server Script (.harness/mcp/spec-query.ts) & roles.json
	await fs.writeFile(
		path.join(harnessDir, "mcp", "spec-query.ts"),
		TemplateScaffolder.getSpecQueryMcpServer(),
		"utf-8",
	);

	await fs.writeFile(
		path.join(harnessDir, "mcp", "spec-query.json"),
		JSON.stringify(
			{
				name: "spec-query",
				type: "local",
				command: ["bun", ".harness/mcp/spec-query.ts"],
				env: {},
			},
			null,
			2,
		),
		"utf-8",
	);

	await fs.writeFile(
		path.join(harnessDir, "mcp", "roles.json"),
		TemplateScaffolder.getRolesJson(),
		"utf-8",
	);

	// 4c. Scaffold Permanent Tooling Scripts (.harness/scripts/)
	const scriptsDir = path.join(harnessDir, "scripts");
	await fs.mkdir(scriptsDir, { recursive: true });

	await fs.writeFile(
		path.join(scriptsDir, "checkpoint-db.ts"),
		TemplateScaffolder.getCheckpointDbScript(),
		"utf-8",
	);

	await fs.writeFile(
		path.join(scriptsDir, "seed-features.ts"),
		TemplateScaffolder.getSeedFeaturesScript(),
		"utf-8",
	);

	await fs.writeFile(
		path.join(scriptsDir, "migrate-specs-to-db.ts"),
		TemplateScaffolder.getMigrateSpecsScript(),
		"utf-8",
	);

	// 5. Write Core Agents with Granular Model Allocation
	const agentsDir = path.join(harnessDir, "agents");

	const coreAgents = AgentMapper.getCoreAgents(answers);

	for (const [name, def] of Object.entries(coreAgents)) {
		await fs.writeFile(
			path.join(agentsDir, `${name}.json`),
			JSON.stringify(def, null, 2),
			"utf-8",
		);
	}

	// Specialist Agents Scaffolding
	if (answers.createSpecialistTemplates) {
		const specialistMap = AgentMapper.getSpecialistMap(answers);

		for (const stackKey of answers.stack) {
			const specAgent = specialistMap[stackKey];
			if (specAgent) {
				await fs.writeFile(
					path.join(agentsDir, `${specAgent.name}.json`),
					JSON.stringify(specAgent, null, 2),
					"utf-8",
				);
			}
		}
	}

	// 6. Write Curated Skills in .harness/skills/
	if (answers.installRecommendedSkills) {
		const skillsBase = path.join(harnessDir, "skills");

		const coreSkills = TemplateScaffolder.getCoreSkills();
		const stackSkills = TemplateScaffolder.getStackSkills();
		const testingSkills = TemplateScaffolder.getTestingSkills();

		for (const [file, content] of Object.entries(coreSkills)) {
			await fs.writeFile(path.join(skillsBase, "core", file), content, "utf-8");
		}
		for (const [file, content] of Object.entries(stackSkills)) {
			await fs.writeFile(
				path.join(skillsBase, "stack", file),
				content,
				"utf-8",
			);
		}
		for (const [file, content] of Object.entries(testingSkills)) {
			await fs.writeFile(
				path.join(skillsBase, "testing", file),
				content,
				"utf-8",
			);
		}
	}

	// 7. Write Modular Pipeline Standards in .harness/standards/pipeline/
	const pipelineDir = path.join(harnessDir, "standards", "pipeline");
	const pipelineFiles = TemplateScaffolder.getPipelineStandards();

	for (const [filename, content] of Object.entries(pipelineFiles)) {
		await fs.writeFile(path.join(pipelineDir, filename), content, "utf-8");
	}

	// 8. Initialize UI Components Registry
	const registryPath = path.join(
		harnessDir,
		"UI",
		"custom-components-registry.ts",
	);
	try {
		await fs.access(registryPath);
	} catch {
		await fs.writeFile(
			registryPath,
			TemplateScaffolder.getUIComponentRegistryStarter(),
			"utf-8",
		);
	}

	// 9. Write Master Spec Index (app-summary.md)
	const appSummaryPath = path.join(harnessDir, "spec", "app-summary.md");
	try {
		await fs.access(appSummaryPath);
	} catch {
		await fs.writeFile(
			appSummaryPath,
			[
				`# ${validatedConfig.projectName} — Application Summary`,
				"",
				"> **Status:** In Development",
				`> **Stack:** ${validatedConfig.stack.join(", ")}`,
				"",
				"## System Overview",
				"High-level description of system goals, architecture invariants, and user personas.",
				"",
				"## Features Index",
				"| Feature | Status | Summary | Spec Path |",
				"| :--- | :--- | :--- | :--- |",
				"",
				"## Active Milestones",
				"- [ ] M0: Architectural Foundation",
				"",
			].join("\n"),
			"utf-8",
		);
	}

	// 10. Write harness.config.json
	await fs.writeFile(
		path.join(harnessDir, "harness.config.json"),
		JSON.stringify(validatedConfig, null, 2),
		"utf-8",
	);

	// 11. Initialize SQLite Spec Database (.harness/harness.db)
	const specDb = new SpecDatabase(harnessDir);
	specDb.upsertFeature({
		id: "feat-core",
		name: `${validatedConfig.projectName} Core`,
		slug: "core-architecture",
		summary: `Core architectural foundation and shared utilities for ${validatedConfig.projectName}`,
		status: "STABLE",
	});

	if (brownfieldResult?.detectedModules && brownfieldResult.detectedModules.length > 0) {
		for (const modName of brownfieldResult.detectedModules) {
			const modSlug = modName.toLowerCase().replace(/[^a-z0-9]/g, "-");
			specDb.upsertFeature({
				id: `feat-${modSlug}`,
				name: `${modName.charAt(0).toUpperCase() + modName.slice(1)} Module`,
				slug: modSlug,
				summary: `Auto-discovered brownfield module '${modName}' requiring architectural review and test coverage.`,
				status: "DRAFT",
			});
		}
	}
	await specDb.exportToMarkdown(harnessDir);
	specDb.close();

	// 11b. Seed Baseline Memory & Wiki Overview
	if (isBrownfield) {
		const baselineMapPath = path.join(
			harnessDir,
			"memory",
			"discovery",
			"brownfield-baseline-map.md",
		);
		await fs.writeFile(
			baselineMapPath,
			[
				`# Discovery Map: ${validatedConfig.projectName} (Brownfield Baseline)`,
				"",
				`> **Auto-Discovered Stack:** ${validatedConfig.stack.join(", ")}`,
				`> **Test Command:** \`${validatedConfig.commands.test}\``,
				`> **Lint Command:** \`${validatedConfig.commands.lint}\``,
				"",
				"## Destination",
				`Establish full 5-phase harness discipline and test coverage for existing codebase ${validatedConfig.projectName}.`,
				"",
				"## Discovered Core Modules",
				...(brownfieldResult?.detectedModules?.map((m: string) => `- \`${m}\``) || ["- `src/`"]),
				"",
				"## Decisions So Far",
				`- Primary Stack: ${validatedConfig.stack.join(", ")}`,
				"",
				"## Fog of War (Pending Phase 1 Discovery)",
				"- Audit legacy module boundaries and un-tested codepaths.",
				"- Define TypeScript/Zod schemas for API payload contracts.",
				"- Establish atomic feature slicing for new additions.",
				"",
				"## Out of Scope",
				"- Modifying operational deployment scripts without preflight approval.",
				"",
			].join("\n"),
			"utf-8",
		);
	}
	// 12. Auto-Install Target Dependencies (@modelcontextprotocol/sdk)
	await ensureDependencies(cwd, validatedConfig.packageManager);

	// 13. Transpile Adapters
	const compiledFiles = await AdapterCompiler.compileAll(validatedConfig, cwd);

	console.log(chalk.green("\n✨ AI Harness initialized successfully!"));
	console.log(
		chalk.dim("- Directory: .harness/ (with agents/, skills/, UI/, temp/)"),
	);
	console.log(chalk.dim(`- Selected Strategy: ${answers.modelPreset}`));
	console.log(chalk.dim(`- Compiled Adapters: ${compiledFiles.join(", ")}`));
	console.log(
		chalk.cyan(
			"\nNext: Launch your AI tool or run `harness start <task-id>`.\n",
		),
	);
}

async function ensureDependencies(
	cwd: string,
	packageManager: string,
): Promise<void> {
	const pkgPath = path.join(cwd, "package.json");
	try {
		const pkgRaw = await fs.readFile(pkgPath, "utf-8");
		const pkg = JSON.parse(pkgRaw);
		const deps = {
			...(pkg.dependencies || {}),
			...(pkg.devDependencies || {}),
		};

		if (!deps["@modelcontextprotocol/sdk"]) {
			console.log(
				chalk.cyan(
					"\n📦 Auto-installing @modelcontextprotocol/sdk dependency...",
				),
			);
			const pm = packageManager || "bun";
			let cmd: string[];
			if (pm === "bun") {
				cmd = ["bun", "add", "@modelcontextprotocol/sdk"];
			} else if (pm === "pnpm") {
				cmd = ["pnpm", "add", "-D", "@modelcontextprotocol/sdk"];
			} else if (pm === "yarn") {
				cmd = ["yarn", "add", "-D", "@modelcontextprotocol/sdk"];
			} else {
				cmd = ["npm", "install", "--save-dev", "@modelcontextprotocol/sdk"];
			}

			const proc = Bun.spawn(cmd, { cwd, stdout: "ignore", stderr: "ignore" });
			await proc.exited;
			console.log(chalk.green("✔ Installed @modelcontextprotocol/sdk successfully."));
		}
	} catch {}
}
