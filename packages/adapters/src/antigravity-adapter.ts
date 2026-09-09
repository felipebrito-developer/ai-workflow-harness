import path from "node:path";
import type { CustomAgent } from "../../cli/src/schemas/agent.schema.js";
import type { HarnessConfig } from "../../cli/src/schemas/harness-config.schema.js";
import type { McpServer } from "../../cli/src/schemas/mcp.schema.js";
import type { SerializedFile } from "./opencode-adapter.js";

export class AntigravitySerializer {
	public static serialize(
		config: HarnessConfig,
		customAgents: CustomAgent[] = [],
		mcpServers: McpServer[] = [],
	): SerializedFile[] {
		const mcpMap: Record<string, unknown> = {};

		for (const server of mcpServers) {
			if (server.type === "local" && server.command.length > 0) {
				const [bin, ...args] = server.command;
				mcpMap[server.name] = {
					command: bin,
					args,
					...(Object.keys(server.env).length > 0 ? { env: server.env } : {}),
				};
			} else if (server.type === "remote" && server.url) {
				mcpMap[server.name] = {
					url: server.url,
				};
			}
		}

		const stackStr = Array.isArray(config.stack)
			? config.stack.join(", ")
			: config.stack;

		const directives = [
			"2-Mode Operating System Active: @planner (planning & spec slicing) and @builder (strict TDD task execution).",
			"Never write application code when acting as @planner.",
			"All code generation in @builder must strictly respect allowedFiles declared in task-XXX.md.",
			"Always run verification via `harness verify <taskId>` or deterministic test commands.",
			`Primary stack: ${stackStr}`,
		];
		const agents: Record<string, unknown> = {};
		for (const agent of customAgents) {
			// Antigravity defaults exclusively to Gemini models
			const isSubagent = agent.mode === "subagent";
			const antigravityModel = isSubagent ? "gemini-2.5-flash" : "gemini-2.5-pro";

			agents[agent.name] = {
				description: agent.description,
				mode: agent.mode,
				model: antigravityModel,
				systemPrompt: agent.systemPrompt,
			};
		}

		const payload = {
			version: "1.0.0",
			project: config.projectName,
			directives,
			mcpServers: mcpMap,
			agents,
		};

		const files: SerializedFile[] = [
			{
				relativePath: "antigravity.json",
				content: JSON.stringify(payload, null, 2),
			},
			{
				relativePath: "AGENTS.md",
				content: AntigravitySerializer.generateAgentsMd(config),
			},
		];

		for (const agent of customAgents) {
			files.push({
				relativePath: path.join(".antigravity", "agents", `${agent.name}.md`),
				content: `# Role: ${agent.name}\n\n${agent.systemPrompt}`,
			});
		}

		return files;
	}

	private static generateAgentsMd(config: HarnessConfig): string {
		const stackStr = Array.isArray(config.stack)
			? config.stack.join(", ")
			: config.stack;

		return [
			`# Antigravity Directive: ${config.projectName}`,
			"",
			`You are operating within the 2-Mode AI Workflow Harness framework for **${config.projectName}**.`,
			"",
			"## Operational Rules",
			"1. **2-Mode System Architecture (@planner & @builder):**",
			"   - Use \`@planner\` for system design, architectural slicing, living spec generation, and task manifest creation.",
			"   - Never write application implementation source code when acting as \`@planner\`.",
			"   - Use \`@builder\` for strict TDD implementation of task manifests.",
			"",
			"2. **Task Boundary Enforcement:**",
			"   - All code generation in \`@builder\` mode must strictly respect \`allowedFiles\` declared in \`.harness/tasks/task-XXX.md\`.",
			"   - Standard task boundary invariant: max 2 implementation code files + 1 test file (max 3 total).",
			"",
			"3. **Deterministic Verification Gate:**",
			"   - Always run verification via \`harness verify <taskId>\` rather than raw unmonitored test commands.",
			"   - Exit-0 test verification and file boundary compliance are mandatory before marking any task DONE.",
			"",
			"4. **Living Specs & Context Access:**",
			"   - Primary master application summary: \`.harness/spec/app-summary.md\`.",
			"   - Living behavioral specs and contracts (`*.contract.ts`, `*.spec.ts`, `*.spec.tsx`).",
			"",
			"## Technology & Stack Context",
			`- **Primary Stack:** ${stackStr}`,
			`- **Package Manager:** ${config.packageManager}`,
			`- **Test Command:** \`${config.commands.test}\``,
			`- **Lint Command:** \`${config.commands.lint}\``,
		].join("\n");
	}
}
