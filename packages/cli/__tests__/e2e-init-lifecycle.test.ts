import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import { AgentMapper } from "../src/engines/agent-mapper.js";
import { TemplateScaffolder } from "../src/engines/template-scaffolder.js";
import {
	HarnessConfigSchema,
	type HarnessConfig,
} from "../src/schemas/harness-config.schema.js";
import { AdapterCompiler } from "../../adapters/src/index.js";
import { runFeature } from "../src/commands/feature.js";
import { RepoAnalyzer } from "../src/engines/repo-analyzer.js";
import type { InitAnswers } from "../src/commands/init.js";

const PROJECT_ROOT = path.resolve(process.cwd());

// ---------------------------------------------------------------------------
// Helper: replicates init.ts directory scaffolding
// ---------------------------------------------------------------------------
async function scaffoldDirs(
	harnessDir: string,
): Promise<void> {
	const dirs = [
		"spec/features",
		"tasks",
		"standards/pipeline",
		"agents",
		"skills/core",
		"skills/stack",
		"skills/testing",
		"mcp",
		"UI/details",
		"temp/scripts",
		"temp/assets",
		"temp/artifacts",
		"state/discovery",
		"logs/workday-log",
		"logs/spawn-log",
		"state/attempts",
		"wiki",
	];

	for (const dir of dirs) {
		await fs.mkdir(path.join(harnessDir, dir), { recursive: true });
		try {
			await fs.writeFile(path.join(harnessDir, dir, ".gitkeep"), "", {
				flag: "wx",
			});
		} catch {}
	}
}

// ---------------------------------------------------------------------------
// Helper: replicates init.ts skill & standard writing
// ---------------------------------------------------------------------------
async function writeSkills(harnessDir: string): Promise<void> {
	const skillsBase = path.join(harnessDir, "skills");
	const core = TemplateScaffolder.getCoreSkills();
	const stack = TemplateScaffolder.getStackSkills();
	const testing = TemplateScaffolder.getTestingSkills();

	for (const [file, content] of Object.entries(core)) {
		await fs.writeFile(path.join(skillsBase, "core", file), content, "utf-8");
	}
	for (const [file, content] of Object.entries(stack)) {
		await fs.writeFile(path.join(skillsBase, "stack", file), content, "utf-8");
	}
	for (const [file, content] of Object.entries(testing)) {
		await fs.writeFile(
			path.join(skillsBase, "testing", file),
			content,
			"utf-8",
		);
	}
}

async function writePipelineStandards(harnessDir: string): Promise<void> {
	const pipelineDir = path.join(harnessDir, "standards", "pipeline");
	const files = TemplateScaffolder.getPipelineStandards();
	for (const [filename, content] of Object.entries(files)) {
		await fs.writeFile(path.join(pipelineDir, filename), content, "utf-8");
	}
}

// ---------------------------------------------------------------------------
// Shared test answers matching real InitAnswers interface
// ---------------------------------------------------------------------------
const makeAnswers = (
	overrides: Partial<InitAnswers> = {},
): InitAnswers => ({
	projectName: "e2e-test-app",
	enableTokenOptimizations: true,
	stack: ["react-web", "node"],
	createSpecialistTemplates: true,
	installRecommendedSkills: true,
	adapters: ["opencode", "antigravity"],
	providerType: "openrouter",
	modelPreset: "complex-efficient",
	packageManager: "bun",
	...overrides,
});

// ---------------------------------------------------------------------------
// Build a HarnessConfig from InitAnswers (mirrors init.ts logic)
// ---------------------------------------------------------------------------
function buildConfig(answers: InitAnswers): HarnessConfig {
	const primaryModel = AgentMapper.getModelForRole(
		"planner",
		answers,
	);
	return HarnessConfigSchema.parse({
		version: "1.0.0",
		projectName: answers.projectName,
		stack: answers.stack,
		adapters: answers.adapters,
		provider: {
			model: primaryModel,
			promptCaching: answers.enableTokenOptimizations,
		},
		packageManager: answers.packageManager || "bun",
		circuitBreakerLimit: 3,
	});
}

// ---------------------------------------------------------------------------
// Full lifecycle: scaffold, write agents, skills, standards, spec, adapters
// ---------------------------------------------------------------------------
async function fullInit(
	tmpDir: string,
	answers: InitAnswers,
): Promise<HarnessConfig> {
	const harnessDir = path.join(tmpDir, ".harness");
	await fs.mkdir(harnessDir, { recursive: true });

	const config = buildConfig(answers);

	// 1. Directories
	await scaffoldDirs(harnessDir);

	// 2. Config file
	await fs.writeFile(
		path.join(harnessDir, "harness.config.json"),
		JSON.stringify(config, null, 2),
		"utf-8",
	);

	// 3. Core agents (getCoreAgents returns Record<string, any>)
	const agentsDir = path.join(harnessDir, "agents");
	const coreAgents = AgentMapper.getCoreAgents(answers);
	for (const [name, def] of Object.entries(coreAgents)) {
		await fs.writeFile(
			path.join(agentsDir, `${name}.json`),
			JSON.stringify(def, null, 2),
			"utf-8",
		);
	}

	// 4. Specialist agents
	if (answers.createSpecialistTemplates) {
		const specialistMap = AgentMapper.getSpecialistMap(answers);
		for (const stackKey of answers.stack) {
			const specAgent = specialistMap[stackKey as keyof typeof specialistMap];
			if (specAgent) {
				await fs.writeFile(
					path.join(agentsDir, `${specAgent.name}.json`),
					JSON.stringify(specAgent, null, 2),
					"utf-8",
				);
			}
		}
	}

	// 5. Skills
	if (answers.installRecommendedSkills) {
		await writeSkills(harnessDir);
	}

	// 6. Pipeline standards
	await writePipelineStandards(harnessDir);

	// 7. UI component registry stub
	const registryPath = path.join(harnessDir, "UI", "custom-components-registry.ts");
	try {
		await fs.access(registryPath);
	} catch {
		await fs.writeFile(
			registryPath,
			TemplateScaffolder.getUIComponentRegistryStarter(),
			"utf-8",
		);
	}

	// 8. Adapter compilation
	await AdapterCompiler.compileAll(config, tmpDir);

	// 9. Write Master Spec Index (app-summary.md)
	const appSummaryPath = path.join(harnessDir, "spec", "app-summary.md");
	try {
		await fs.access(appSummaryPath);
	} catch {
		await fs.writeFile(
			appSummaryPath,
			[
				`# ${answers.projectName} — Application Summary`,
				"",
				"> **Status:** In Development",
				`> **Stack:** ${answers.stack.join(", ")}`,
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

	return config;
}

// ============================================================================
// TEST SUITE 1: Full React Web + OpenRouter + Orchestrated lifecycle
// ============================================================================
describe("E2E Init Lifecycle — React Web + OpenRouter + 3-Mode Clean-Room", () => {
	const tmpDir = path.join(PROJECT_ROOT, `.tmp-e2e-lifecycle-${Date.now()}`);
	const harnessDir = path.join(tmpDir, ".harness");
	const answers = makeAnswers();
	let config: HarnessConfig;

	beforeAll(async () => {
		config = await fullInit(tmpDir, answers);
		process.chdir(tmpDir);
	});

	afterAll(async () => {
		process.chdir(PROJECT_ROOT);
		await fs.rm(tmpDir, { recursive: true, force: true });
	});

	// ---- A. Directory Structure ----
	describe("A. Directory Structure", () => {
		const expectedDirs = [
			"spec/features",
			"tasks",
			"standards/pipeline",
			"agents",
			"skills/core",
			"skills/stack",
			"skills/testing",
			"mcp",
			"UI/details",
			"temp/scripts",
			"temp/assets",
			"temp/artifacts",
			"state/discovery",
			"logs/workday-log",
			"logs/spawn-log",
			"state/attempts",
			"wiki",
		];

		it("should create all 17 required directories", async () => {
			for (const dir of expectedDirs) {
				const stat = await fs.stat(path.join(harnessDir, dir));
				expect(stat.isDirectory()).toBe(true);
			}
		});
	});

	// ---- B. Core Agent JSON Files ----
	describe("B. Core Agent JSON Files", () => {
		const agentNames = [
			"planner",
			"test-creator",
		];

		for (const agentName of agentNames) {
			it(`${agentName} has valid schema`, async () => {
				const raw = await fs.readFile(
					path.join(harnessDir, "agents", `${agentName}.json`),
					"utf-8",
				);
				const json = JSON.parse(raw);

				expect(json.name).toBe(agentName);
				expect(typeof json.description).toBe("string");
				expect(["primary", "subagent"]).toContain(json.mode);
				expect(json.provider.type).toBe("openrouter");
				expect(json.provider.model.startsWith("openrouter/")).toBe(true);
				expect(typeof json.provider.promptCaching).toBe("boolean");
				expect(json.permissions).toHaveProperty("edit");
				expect(json.permissions).toHaveProperty("bash");
				expect(json.permissions).toHaveProperty("task");
				expect(json.permissions).toHaveProperty("externalDirectory");
				expect(json.permissions.externalDirectory).toBe("deny");
				expect(Array.isArray(json.skills)).toBe(true);
				expect(json.skills.length).toBeGreaterThan(0);
				expect(typeof json.systemPrompt).toBe("string");
				expect(json.systemPrompt.length).toBeGreaterThan(20);
			});
		}
	});

	// ---- C. Agent Model Allocation (complex-efficient) ----
	describe("C. Agent Model Allocation", () => {
		const expectedModels: Record<string, string> = {
			planner: "openrouter/deepseek/deepseek-r1",
			"test-creator": "openrouter/deepseek/deepseek-r1",
		};

		it("should assign correct models for complex-efficient preset", async () => {
			for (const [name, model] of Object.entries(expectedModels)) {
				const raw = await fs.readFile(
					path.join(harnessDir, "agents", `${name}.json`),
					"utf-8",
				);
				expect(JSON.parse(raw).provider.model).toBe(model);
			}
		});
	});

	// ---- D. Agent Permissions Matrix ----
	describe("D. Agent Permissions Matrix", () => {
		it("planner is primary with full task delegation", async () => {
			const json = JSON.parse(
				await fs.readFile(
					path.join(harnessDir, "agents/planner.json"),
					"utf-8",
				),
			);
			expect(json.mode).toBe("primary");
			expect(json.permissions.task).toEqual({ "*": "allow" });
		});
	});

	// ---- E. Specialist Agents ----
	describe("E. Specialist Agents", () => {
		it("web-builder exists with correct skills", async () => {
			const json = JSON.parse(
				await fs.readFile(
					path.join(harnessDir, "agents/web-builder.json"),
					"utf-8",
				),
			);
			expect(json.name).toBe("web-builder");
			expect(json.skills).toContain("skill-executable-specs.md");
			expect(json.skills).toContain("skill-ui-contracts.md");
		});

		it("backend-builder exists with correct skills", async () => {
			const json = JSON.parse(
				await fs.readFile(
					path.join(harnessDir, "agents/backend-builder.json"),
					"utf-8",
				),
			);
			expect(json.name).toBe("backend-builder");
			expect(json.skills).toContain("skill-executable-specs.md");
		});
	});

	// ---- F. Skills Installation ----
	describe("F. Skills Installation", () => {
		const expectedSkills = [
			"core/skill-harness.md",
			"core/skill-caveman.md",
			"core/skill-context-caching.md",
			"core/skill-preflight.md",
			"stack/skill-tailwind-shadcn.md",
			"stack/skill-tanstack-query.md",
			"stack/skill-expo-router.md",
			"stack/skill-typescript-strict.md",
			"stack/skill-idiomatic-go.md",
			"stack/skill-sqlc.md",
			"stack/skill-postgres-schema-design.md",
			"stack/skill-dynamodb-single-table.md",
			"testing/skill-executable-specs.md",
			"testing/skill-ui-contracts.md",
			"testing/skill-tdd-assertions.md",
			"testing/skill-zero-noise-reporter.md",
		];

		it("should install all required skill files starting with '# Skill:'", async () => {
			for (const skill of expectedSkills) {
				const content = await fs.readFile(
					path.join(harnessDir, "skills", skill),
					"utf-8",
				);
				expect(content.startsWith("# Skill:")).toBe(true);
			}
		});
	});

	// ---- G. Pipeline Standards ----
	describe("G. Pipeline Standards", () => {
		const phases = [
			"summary.md",
		];

		it("should create pipeline standard summary index", async () => {
			for (const phase of phases) {
				const stat = await fs.stat(
					path.join(harnessDir, "standards/pipeline", phase),
				);
				expect(stat.isFile()).toBe(true);
			}
		});
	});

	// ---- H. Config File ----
	describe("H. Config File", () => {
		it("should create valid harness.config.json matching HarnessConfigSchema", async () => {
			const raw = await fs.readFile(
				path.join(harnessDir, "harness.config.json"),
				"utf-8",
			);
			const parsed = HarnessConfigSchema.parse(JSON.parse(raw));

			expect(parsed.projectName).toBe("e2e-test-app");
			expect(parsed.stack).toEqual(["react-web", "node"]);
			expect(parsed.adapters).toEqual(["opencode", "antigravity"]);
			expect(parsed.provider.model).toBe("openrouter/deepseek/deepseek-r1");
			expect(parsed.provider.promptCaching).toBe(true);
			expect(parsed.circuitBreakerLimit).toBe(3);
		});
	});

	// ---- I. Adapter Output — OpenCode ----
	describe("I. Adapter Output — OpenCode", () => {
		it("should generate valid opencode.json", async () => {
			const raw = await fs.readFile(
				path.join(tmpDir, "opencode.json"),
				"utf-8",
			);
			const json = JSON.parse(raw);

			expect(json.$schema).toBe("https://opencode.ai/config.json");
			expect(typeof json.model).toBe("string");
			expect(json.model).toContain("openrouter/");
			expect(Array.isArray(json.instructions)).toBe(true);
			expect(json.instructions).toContain(".harness/spec/app-summary.md");
			expect(json.instructions).toContain(".harness/standards/**/*.md");
			expect(json.instructions).toContain(".harness/skills/**/*.md");
			expect(json.agent).toHaveProperty("planner");
			expect(json.agent).toHaveProperty("test-creator");
			expect(json.agent.planner.mode).toBe("primary");
			expect(json.agent.planner).toHaveProperty("actions");
			expect(json.agent.planner.actions).toHaveProperty("harness-preflight");

			// Provider with setCacheKey
			expect(json.provider).toHaveProperty("openrouter");
			expect(json.provider.openrouter.options.setCacheKey).toBe(true);
			expect(json.provider.openrouter.options.baseURL).toBe(
				"https://openrouter.ai/api/v1",
			);
		});

		it("should generate opencode.md with project info and commands", async () => {
			const content = await fs.readFile(
				path.join(tmpDir, "opencode.md"),
				"utf-8",
			);
			expect(content).toContain("e2e-test-app");
			expect(content).toContain("Dynamically decided by the @planner");
			expect(content).toContain("react-web");
			expect(content).toContain("3-Mode Clean-Room Architecture");
		});

		it("should generate default OpenCode agent personas", async () => {
			const testRunnerMd = await fs.readFile(
				path.join(tmpDir, ".opencode/agents/test-runner.md"),
				"utf-8",
			);
			expect(testRunnerMd).toContain("mode: subagent");
			expect(testRunnerMd).toContain("edit: deny");
			expect(testRunnerMd).toContain("bash: allow");

			const codeReviewerMd = await fs.readFile(
				path.join(tmpDir, ".opencode/agents/code-reviewer.md"),
				"utf-8",
			);
			expect(codeReviewerMd).toContain("VERDICT");
		});
	});

	// ---- J. Adapter Output — Antigravity ----
	describe("J. Adapter Output — Antigravity", () => {
		it("should generate valid antigravity.json and AGENTS.md", async () => {
			const raw = await fs.readFile(
				path.join(tmpDir, "antigravity.json"),
				"utf-8",
			);
			const json = JSON.parse(raw);

			expect(json.version).toBe("1.0.0");
			expect(json.project).toBe("e2e-test-app");
			expect(Array.isArray(json.directives)).toBe(true);
			expect(json.directives.length).toBeGreaterThanOrEqual(4);
			expect(json.agents).toHaveProperty("planner");
			expect(json.agents).toHaveProperty("test-creator");
			expect(json.agents.planner).toHaveProperty("actions");
			expect(json.agents.planner.actions).toHaveProperty("/harness-preflight");

			const agentsMd = await fs.readFile(
				path.join(tmpDir, "AGENTS.md"),
				"utf-8",
			);
			expect(agentsMd).toContain("Antigravity Directive");
			expect(agentsMd).toContain("3-Mode Clean-Room Architecture");
			expect(agentsMd).toContain("@planner");
			expect(agentsMd).toContain("@test-creator");
			expect(agentsMd).toContain("@builder");
		});
	});

	// ---- K. No Linear MCP Anywhere ----
	describe("K. No Linear MCP Anywhere", () => {
		it("should not inject linear MCP in any adapter output", async () => {
			const opencode = JSON.parse(
				await fs.readFile(path.join(tmpDir, "opencode.json"), "utf-8"),
			);
			if (opencode.mcp) {
				expect(opencode.mcp).not.toHaveProperty("linear");
			}

			const antigravity = JSON.parse(
				await fs.readFile(path.join(tmpDir, "antigravity.json"), "utf-8"),
			);
			expect(antigravity.mcpServers).not.toHaveProperty("linear");
		});
	});

	// ---- L. App Summary ----
	describe("L. App Summary", () => {
		it("should create spec/app-summary.md with project name", async () => {
			const content = await fs.readFile(
				path.join(harnessDir, "spec/app-summary.md"),
				"utf-8",
			);
			expect(content).toContain("e2e-test-app");
		});
	});

	// ---- M. Feature Lifecycle ----
	describe("M. Feature Lifecycle", () => {
		it("should generate valid task manifest via runFeature", async () => {
			await runFeature("UserProfile", {
				files: "src/user-profile.ts,tests/user-profile.test.ts",
			});

			const content = await fs.readFile(
				path.join(harnessDir, "tasks/task-userprofile.md"),
				"utf-8",
			);
			expect(content).toContain("status: TODO");
			expect(content).toContain("title: UserProfile");
			expect(content).toContain("## 1. Allowed File Boundaries");
			expect(content).toContain("src/user-profile.ts");
			expect(content).toContain("tests/user-profile.test.ts");
			expect(content).toContain("## 2. Acceptance Criteria");
			expect(content).toContain("- [ ]");
			expect(content).toContain("## 3. Verification Commands");
			expect(content).toContain("```bash");
		});
	});
});

// ============================================================================
// TEST SUITE 3: Agent Workflow Readiness Validation
// ============================================================================
describe("Agent Workflow Readiness Validation", () => {
	const tmpDir = path.join(PROJECT_ROOT, `.tmp-e2e-readiness-${Date.now()}`);
	const harnessDir = path.join(tmpDir, ".harness");
	const answers = makeAnswers({
		stack: ["react-web", "node", "db-sql"],
		createSpecialistTemplates: true,
	});
	const allSkillNames: string[] = [];

	beforeAll(async () => {
		await fullInit(tmpDir, answers);

		// Collect all available skill filenames across all categories
		const core = TemplateScaffolder.getCoreSkills();
		const stack = TemplateScaffolder.getStackSkills();
		const testing = TemplateScaffolder.getTestingSkills();
		allSkillNames.push(
			...Object.keys(core),
			...Object.keys(stack),
			...Object.keys(testing),
		);
	});

	afterAll(async () => {
		process.chdir(PROJECT_ROOT);
		await fs.rm(tmpDir, { recursive: true, force: true });
	});

	it("planner agent references .harness/ paths in systemPrompt", async () => {
		const json = JSON.parse(
			await fs.readFile(path.join(harnessDir, "agents/planner.json"), "utf-8"),
		);
		expect(json.systemPrompt).toMatch(/\.harness\//);
	});

	it("planner enforces zero-code rule in systemPrompt", async () => {
		const json = JSON.parse(
			await fs.readFile(
				path.join(harnessDir, "agents/planner.json"),
				"utf-8",
			),
		);
		expect(json.systemPrompt).toContain(
			"NEVER write application implementation code",
		);
	});

	it("every agent skill reference exists in the skill catalog", async () => {
		const agentFiles = await fs.readdir(path.join(harnessDir, "agents"));
		for (const file of agentFiles) {
			if (!file.endsWith(".json")) continue;
			const json = JSON.parse(
				await fs.readFile(path.join(harnessDir, "agents", file), "utf-8"),
			);
			for (const skill of json.skills) {
				expect(allSkillNames).toContain(skill);
			}
		}
	});

	it("planner can delegate to all agents (task.*=allow)", async () => {
		const json = JSON.parse(
			await fs.readFile(
				path.join(harnessDir, "agents/planner.json"),
				"utf-8",
			),
		);
		expect(json.permissions.task["*"]).toBe("allow");
	});

	it("all subagents deny externalDirectory access", async () => {
		const agentFiles = await fs.readdir(path.join(harnessDir, "agents"));
		for (const file of agentFiles) {
			if (!file.endsWith(".json")) continue;
			const json = JSON.parse(
				await fs.readFile(path.join(harnessDir, "agents", file), "utf-8"),
			);
			if (json.mode === "subagent") {
				expect(json.permissions.externalDirectory).toBe("deny");
			}
		}
	});

	describe("RepoAnalyzer Package Manager Auto-Discovery", () => {
		it("detects bun from bun.lockb and sets bun commands", async () => {
			const tmp = path.join(PROJECT_ROOT, `.tmp-repo-analyzer-bun-${Date.now()}`);
			await fs.mkdir(tmp, { recursive: true });
			await fs.writeFile(path.join(tmp, "bun.lockb"), "");
			const result = await RepoAnalyzer.analyze(tmp, { interactive: false });
			expect(result.packageManager).toBe("bun");
			expect(result.testCmd).toBe("bun test");
			expect(result.lintCmd).toBe("bunx @biomejs/biome check .");
			await fs.rm(tmp, { recursive: true, force: true });
		});

		it("detects pnpm from pnpm-lock.yaml and sets pnpm commands", async () => {
			const tmp = path.join(PROJECT_ROOT, `.tmp-repo-analyzer-pnpm-${Date.now()}`);
			await fs.mkdir(tmp, { recursive: true });
			await fs.writeFile(path.join(tmp, "pnpm-lock.yaml"), "");
			const result = await RepoAnalyzer.analyze(tmp, { interactive: false });
			expect(result.packageManager).toBe("pnpm");
			expect(result.testCmd).toBe("pnpm test");
			expect(result.lintCmd).toBe("pnpm exec biome check .");
			await fs.rm(tmp, { recursive: true, force: true });
		});
	});
});
