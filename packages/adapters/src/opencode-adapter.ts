import path from "node:path";
import matter from "gray-matter";
import type { CustomAgent } from "../../cli/src/schemas/agent.schema.js";
import type { HarnessConfig } from "../../cli/src/schemas/harness-config.schema.js";
import type { McpServer } from "../../cli/src/schemas/mcp.schema.js";

export interface SerializedFile {
	relativePath: string;
	content: string;
}

export class OpenCodeSerializer {
	public static serialize(
		config: HarnessConfig,
		customAgents: CustomAgent[] = [],
		mcpServers: McpServer[] = [],
	): SerializedFile[] {
		const files: SerializedFile[] = [];

		// 1. Generate compliant opencode.json
		files.push({
			relativePath: "opencode.json",
			content: JSON.stringify(
				OpenCodeSerializer.generateConfigJson(config, customAgents, mcpServers),
				null,
				2,
			),
		});

		// 2. Generate opencode.md context discipline guide
		files.push({
			relativePath: "opencode.md",
			content: OpenCodeSerializer.generateProjectMd(config),
		});

		// 3. Generate default and custom agents under .opencode/agents/
		files.push(...OpenCodeSerializer.generateDefaultAgentPersonas());
		files.push(...OpenCodeSerializer.generateCustomAgentPersonas(customAgents));

		return files;
	}

	private static generateConfigJson(
		config: HarnessConfig,
		customAgents: CustomAgent[],
		mcpServers: McpServer[],
	): Record<string, unknown> {
		const modelIdentifier = config.provider.model;
		const stacks = Array.isArray(config.stack) ? config.stack : [config.stack];

		const taskPermissions: Record<string, string> = {
			"*": "allow",
		};

		// Auto-allow custom subagents on primary architect
		for (const agent of customAgents) {
			if (agent.mode === "subagent") {
				taskPermissions[agent.name] = "allow";
			}
		}

		const codingModel = config.provider.model.startsWith("openrouter/")
			? "openrouter/qwen/qwen-2.5-coder-32b-instruct"
			: config.provider.model;
		const reasoningModel = config.provider.model.startsWith("openrouter/")
			? "openrouter/deepseek/deepseek-r1"
			: config.provider.model;

		const agentsMap: Record<string, unknown> = {};

		for (const agent of customAgents) {
			let agentModel = agent.provider.model;
			if (agent.provider.type === "openrouter" && !agentModel.startsWith("openrouter/")) {
				agentModel = `openrouter/${agentModel}`;
			}

			const agentConfig: any = {
				mode: agent.mode,
				model: agentModel,
				description: agent.description,
				permission: {
					edit: agent.permissions.edit,
					bash: agent.permissions.bash,
					task: agent.name === "planner" ? taskPermissions : agent.permissions.task,
					external_directory: agent.permissions.externalDirectory,
				},
			};

			if (agent.name === "planner") {
				agentConfig.actions = {
					"harness-preflight": {
						description: "Validate Harness 3-Mode Architecture and auto-migrate legacy configs.",
						instruction: "Execute the preflight validation following the steps in .harness/skills/core/skill-preflight.md"
					}
				};
			}

			agentsMap[agent.name] = agentConfig;
		}

		const opencodeConfig: Record<string, unknown> = {
			$schema: "https://opencode.ai/config.json",
			model: modelIdentifier,
			instructions: [
				".harness/spec/app-summary.md",
				".harness/standards/**/*.md",
				".harness/skills/**/*.md",
				"opencode.md",
			],
			agent: agentsMap,
		};

		// Providers mapping
		const providers: Record<string, unknown> = {};
		if (config.provider.model.startsWith("openrouter/")) {
			providers.openrouter = {
				options: {
					baseURL: "https://openrouter.ai/api/v1",
					...(config.provider.promptCaching ? { setCacheKey: true } : {}),
				},
			};
		} else if (config.provider.promptCaching) {
			const providerName = config.provider.model.split("/")[0] || "default";
			providers[providerName] = {
				options: {
					setCacheKey: true,
				},
			};
		}

		for (const agent of customAgents) {
			if (agent.provider && !providers[agent.provider.type]) {
				providers[agent.provider.type] = {
					options: {
						...(agent.provider.baseUrl
							? { baseURL: agent.provider.baseUrl }
							: {}),
						...(agent.provider.promptCaching ? { setCacheKey: true } : {}),
					},
				};
			}
		}

		if (Object.keys(providers).length > 0) {
			opencodeConfig.provider = providers;
		}

		// MCP Servers mapping
		const mcpMap: Record<string, unknown> = {};

		for (const server of mcpServers) {
			if (server.type === "remote" && server.url) {
				mcpMap[server.name] = {
					type: "remote",
					url: server.url,
				};
			} else {
				mcpMap[server.name] = {
					type: "local",
					command: server.command,
					...(Object.keys(server.env).length > 0 ? { environment: server.env } : {}),
				};
			}
		}

		if (Object.keys(mcpMap).length > 0) {
			opencodeConfig.mcp = mcpMap;
		}

		return opencodeConfig;
	}

	private static generateCustomAgentPersonas(
		customAgents: CustomAgent[],
	): SerializedFile[] {
		return customAgents.map((agent) => {
			let agentModel = agent.provider.model;
			if (
				agent.provider.type === "openrouter" &&
				!agentModel.startsWith("openrouter/")
			) {
				agentModel = `openrouter/${agentModel}`;
			}

			const frontmatter: Record<string, unknown> = {
				description: agent.description,
				mode: agent.mode,
				model: agentModel,
				permission: {
					edit: agent.permissions.edit,
					bash: agent.permissions.bash,
					task: agent.permissions.task,
					external_directory: agent.permissions.externalDirectory,
				},
			};

			const markdownContent = [
				`# Role: ${agent.name}`,
				"",
				agent.systemPrompt,
			].join("\n");

			return {
				relativePath: path.join(".opencode", "agents", `${agent.name}.md`),
				content: matter.stringify(markdownContent, frontmatter),
			};
		});
	}

	private static generateDefaultAgentPersonas(): SerializedFile[] {
		return [
			{
				relativePath: path.join(".opencode", "agents", "test-runner.md"),
				content: [
					"---",
					"description: Executes test suites, linters, and preflight verification gates without editing source code.",
					"mode: subagent",
					"permission:",
					"  edit: deny",
					"  bash: allow",
					"  task: deny",
					"  external_directory: deny",
					"---",
					"",
					"# Role: Test Runner",
					"You execute build, test, and verification commands. Return verbatim output and concise error summaries only.",
				].join("\n"),
			},
			{
				relativePath: path.join(".opencode", "agents", "code-reviewer.md"),
				content: [
					"---",
					"description: Read-only reviewer checking task diffs against architectural standards and acceptance criteria.",
					"mode: subagent",
					"permission:",
					"  edit: deny",
					"  bash: ask",
					"  task: deny",
					"  external_directory: deny",
					"---",
					"",
					"# Role: Code Reviewer",
					"Inspect the git diff against acceptance criteria in the active `.harness/tasks/task-XXX.md`.",
					"Conclude with either `## VERDICT: APPROVE` or `## VERDICT: REJECT`.",
				].join("\n"),
			},
		];
	}

	private static generateProjectMd(config: HarnessConfig): string {
		const stackList = Array.isArray(config.stack)
			? config.stack.join(", ")
			: config.stack;

		return [
			`# Project: ${config.projectName}`,
			"",
			`> **Stack:** ${stackList}`,
			`> **Package Manager:** ${config.packageManager}`,
			"",
			"## Operational Discipline",
			"1. **3-Mode Clean-Room Architecture (@planner, @test-creator, & @builder):**",
			"   - `@planner` handles architectural slicing and task manifest updates.",
			"   - `@test-creator` drafts living specs and tests based on task constraints.",
			"   - `@builder` executes implementation strictly respecting file boundaries in `task-XXX.md`.",
			"   - Never write application implementation source code when acting as `@planner` or `@test-creator`.",
			"",
			"2. **Context Loading (Macro Blueprint & Living Specs):**",
			"   - Read `.harness/spec/app-summary.md` for master application blueprint.",
			"   - Inspect living specs (`*.contract.ts`, `*.spec.ts`, `*.spec.tsx`) for typed contracts and behavior.",
			"",
			"3. **Task Execution Boundary:**",
			"   - Read active task manifest at `.harness/tasks/task-XXX.md`.",
			"   - Allowed file boundaries: Max 2 implementation code files + 1 test file (max 3 total).",
			"   - Run `harness verify <taskId>` to validate before marking task done.",
			"",
			"4. **Deterministic Commands:**",
			"   - Test and Lint commands: Dynamically decided by the @planner based on the target stack.",
		].join("\n");
	}
}
