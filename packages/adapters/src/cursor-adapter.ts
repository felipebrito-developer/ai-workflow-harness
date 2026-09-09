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
			"1. **3-Mode Clean-Room Architecture (@planner, @test-creator, & @builder):**",
			"   - `@planner` handles architectural slicing and task manifest generation.",
			"   - `@test-creator` drafts living specs and tests based on task constraints.",
			"   - `@builder` executes implementation strictly respecting file boundaries in `task-XXX.md`.",
			"   - Never write application implementation source code when acting as `@planner` or `@test-creator`.",
			"",
			"2. **Context Loading:**",
			"   - Always read `.harness/spec/app-summary.md` first.",
			"   - Inspect living specs (`*.contract.ts`, `*.spec.ts`, `*.spec.tsx`) for typed contracts.",
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
