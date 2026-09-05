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

		const pm = config.packageManager || "bun";
		const [sqBin, ...sqArgs] =
			pm === "bun"
				? ["bun", ".harness/mcp/spec-query.ts"]
				: pm === "pnpm"
					? ["pnpm", "exec", "tsx", ".harness/mcp/spec-query.ts"]
					: pm === "yarn"
						? ["yarn", "dlx", "tsx", ".harness/mcp/spec-query.ts"]
						: ["npx", "-y", "tsx", ".harness/mcp/spec-query.ts"];

		// Always register native spec-query MCP server for database spec lookup
		mcpMap.mcpServers["spec-query"] = {
			command: sqBin,
			args: sqArgs,
		};

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
			"1. **2-Mode System Architecture (@planner & @builder):**",
			"   - `@planner` handles architectural slicing, living spec generation, and task manifest updates.",
			"   - `@builder` executes implementation strictly respecting file boundaries in `task-XXX.md`.",
			"",
			"2. **Context Loading:**",
			"   - Always read `.harness/spec/app-summary.md` first.",
			"   - Use `spec-query` MCP server to inspect SQLite `harness.db`.",
			"",
			"3. **Task Execution Boundary Invariant:**",
			"   - Read active task manifest at `.harness/tasks/task-XXX.md`.",
			"   - `allowedFiles` must contain max 2 code files + 1 test file (max 3 total).",
			"   - Run `harness verify <taskId>` before marking task done.",
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
