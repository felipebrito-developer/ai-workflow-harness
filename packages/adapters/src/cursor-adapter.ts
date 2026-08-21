import path from "node:path";
import type { CustomAgent } from "../../cli/src/schemas/agent.schema.js";
import type { HarnessConfig } from "../../cli/src/schemas/harness-config.schema.js";
import type { McpServer } from "../../cli/src/schemas/mcp.schema.js";
import type { SerializedFile } from "./opencode-adapter.js";

export class CursorSerializer {
	public static serialize(
		config: HarnessConfig,
		customAgents: CustomAgent[] = [],
		mcpServers: McpServer[] = [],
	): SerializedFile[] {
		const files: SerializedFile[] = [];

		const mcpMap: Record<string, any> = {
			mcpServers: {},
		};

		if (config.taskBackend.type === "linear") {
			mcpMap.mcpServers.linear = {
				command: "npx",
				args: ["-y", "@modelcontextprotocol/server-linear"],
				env: {
					LINEAR_API_KEY: "${LINEAR_API_KEY}",
				},
			};
		}

		if (config.memoryBackend?.type === "ai-memory") {
			const cmdParts =
				config.memoryBackend.command && config.memoryBackend.command.length > 0
					? config.memoryBackend.command
					: ["npx", "-y", "ai-memory", "mcp"];
			const [bin, ...args] = cmdParts;
			mcpMap.mcpServers["ai-memory"] = {
				command: bin,
				args: args,
			};
		}

		for (const server of mcpServers) {
			if (server.type === "local" && server.command.length > 0) {
				const [bin, ...args] = server.command;
				mcpMap.mcpServers[server.name] = {
					command: bin,
					args,
					...(Object.keys(server.env).length > 0 ? { env: server.env } : {}),
				};
			}
		}

		files.push({
			relativePath: path.join(".cursor", "mcp.json"),
			content: JSON.stringify(mcpMap, null, 2),
		});

		const rulesContent = [
			`# Project: ${config.projectName}`,
			"",
			"## Operational Discipline",
			"1. **Context Loading:**",
			"   - Always read `.harness/spec/app-summary.md` first.",
			"   - Drill down to `.harness/spec/features/<feature>/README.md` only when working on that feature.",
			"   - Load sub-specs (`business/`, `ui/`, `technical/`) only when actively implementing.",
			"",
			"2. **Task Execution Boundary:**",
			"   - Read the active task manifest at `.harness/tasks/task-XXX.md`.",
			"   - You must ONLY modify files listed under `## 1. Allowed File Boundaries` in the task manifest.",
			"   - Preflight verification and exit-0 tests are mandatory before marking any task as done.",
			"",
		];

		if (customAgents.length > 0) {
			rulesContent.push("## Agents");
			for (const agent of customAgents) {
				rulesContent.push(`### Role: ${agent.name}`);
				rulesContent.push(agent.description);
				rulesContent.push("");
				rulesContent.push(agent.systemPrompt);
				rulesContent.push("");
			}
		}

		files.push({
			relativePath: ".cursorrules",
			content: rulesContent.join("\n"),
		});

		return files;
	}
}
