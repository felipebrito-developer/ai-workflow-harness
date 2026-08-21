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
		let modelIdentifier = config.provider.model;
		if (
			config.provider.type === "openrouter" &&
			!modelIdentifier.startsWith("openrouter/")
		) {
			modelIdentifier = `openrouter/${modelIdentifier}`;
		}

		const isOrchestrated = config.workflowMode === "orchestrated";
		const stacks = Array.isArray(config.stack) ? config.stack : [config.stack];

		const taskPermissions: Record<string, string> = {
			"*": "deny",
		};

		if (isOrchestrated) {
			taskPermissions["test-runner"] = "allow";
			taskPermissions["code-reviewer"] = "allow";

			if (stacks.includes("react-native")) {
				taskPermissions["react-native-developer"] = "allow";
			}
			if (stacks.includes("react-web")) {
				taskPermissions["web-developer"] = "allow";
			}
			if (stacks.includes("go")) {
				taskPermissions["go-developer"] = "allow";
			}
			if (stacks.includes("node")) {
				taskPermissions["node-developer"] = "allow";
			}
			if (stacks.includes("python")) {
				taskPermissions["python-developer"] = "allow";
			}
		}

		// Auto-allow custom subagents on primary architect
		for (const agent of customAgents) {
			if (agent.mode === "subagent") {
				taskPermissions[agent.name] = "allow";
			}
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
			agent: {
				architect: {
					mode: "primary",
					description:
						"Primary architect enforcing Harness 5-phase planning and boundary-locked task execution.",
					permission: {
						task: taskPermissions,
						external_directory: "deny",
					},
				},
			},
		};

		// Providers mapping
		const providers: Record<string, unknown> = {};
		if (config.provider.type === "openrouter") {
			providers.openrouter = {
				options: {
					baseURL: config.provider.baseUrl || "https://openrouter.ai/api/v1",
					...(config.provider.promptCaching ? { setCacheKey: true } : {}),
				},
			};
		} else if (config.provider.baseUrl || config.provider.promptCaching) {
			providers[config.provider.type] = {
				options: {
					...(config.provider.baseUrl
						? { baseURL: config.provider.baseUrl }
						: {}),
					...(config.provider.promptCaching ? { setCacheKey: true } : {}),
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
		const pm = config.packageManager || "bun";
		const specQueryCmd =
			pm === "bun"
				? ["bun", ".harness/mcp/spec-query.ts"]
				: pm === "pnpm"
					? ["pnpm", "exec", "tsx", ".harness/mcp/spec-query.ts"]
					: pm === "yarn"
						? ["yarn", "dlx", "tsx", ".harness/mcp/spec-query.ts"]
						: ["npx", "-y", "tsx", ".harness/mcp/spec-query.ts"];

		// Always register native spec-query MCP server for database spec lookup
		mcpMap["spec-query"] = {
			type: "local",
			command: specQueryCmd,
		};

		if (config.memoryBackend?.type === "ai-memory") {
			const cmdParts =
				config.memoryBackend.command && config.memoryBackend.command.length > 0
					? config.memoryBackend.command
					: ["ai-memory", "mcp"];
			mcpMap["ai-memory"] = {
				type: "local",
				command: cmdParts,
			};
		}

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
			`> **Workflow Mode:** ${config.workflowMode}`,
			`> **Task Backend:** ${config.taskBackend.type}`,
			"",
			"## Operational Discipline",
			"1. **Session Startup Routine (Phase 1 Problem Discovery):**",
			"   - On first launch or new feature, if no discovery map exists at `.harness/memory/discovery/`, immediately trigger Phase 1 (Problem Discovery).",
			"   - Have @architect-agent grill the user via structured Q&A (3+2 choice rule: 3 choices + Write-in + Explain) to chart goals and generate the discovery map before writing code.",
			"",
			"2. **Context Loading (DB-First MCP Access):**",
			"   - Call `list_features` using the `spec-query` MCP server to inspect all system features and status from SQLite `harness.db`.",
			"   - Call `get_spec` or `search_specs` via `spec-query` MCP tool on demand when implementing a specific feature.",
			"   - Do NOT load raw markdown files into prompt context.",
			"",
			"3. **Task Execution Boundary:**",
			"   - Read the active task manifest at `.harness/tasks/task-XXX.md`.",
			"   - You must ONLY modify files listed under `## 1. Allowed File Boundaries` in the task manifest.",
			"   - Preflight verification and exit-0 tests are mandatory before marking any task as done.",
			"",
			"4. **Deterministic Commands:**",
			`   - Test: \`${config.commands.test}\``,
			`   - Lint: \`${config.commands.lint}\``,
			...(config.commands.typecheck
				? [`   - Typecheck: \`${config.commands.typecheck}\``]
				: []),
		].join("\n");
	}
}
