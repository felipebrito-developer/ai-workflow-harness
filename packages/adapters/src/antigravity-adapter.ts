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
		mcpMap["spec-query"] = {
			command: sqBin,
			args: sqArgs,
		};

		if (config.memoryBackend?.type === "ai-memory") {
			const cmdParts =
				config.memoryBackend.command && config.memoryBackend.command.length > 0
					? config.memoryBackend.command
					: ["ai-memory", "mcp"];
			const [bin, ...args] = cmdParts;
			mcpMap["ai-memory"] = {
				command: bin,
				args: args,
				env: {},
			};
		}

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

		const directives = [
			"On session startup or new feature: If no discovery map exists at .harness/memory/discovery/, trigger Phase 1 (Problem Discovery). Have @architect-agent conduct structured Q&A (3+2 choice rule) before generating code.",
			"Enforce 5-phase planning pipeline before generating implementation code.",
			"Call list_features (spec-query MCP) to inspect system architecture and feature specs dynamically from SQLite harness.db.",
			"Adhere to task-XXX.md file boundary restrictions strictly.",
			`Primary stack: ${Array.isArray(config.stack) ? config.stack.join(", ") : config.stack}`,
		];
		if (config.memoryBackend?.type === "ai-memory") {
			directives.push(
				"Query ai-memory for cross-agent project context and wiki retrieval on task startup.",
			);
		}

		const agents: Record<string, unknown> = {};
		for (const agent of customAgents) {
			agents[agent.name] = {
				description: agent.description,
				mode: agent.mode,
				model: agent.provider.model,
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
		];

		for (const agent of customAgents) {
			files.push({
				relativePath: path.join(".antigravity", "agents", `${agent.name}.md`),
				content: `# Role: ${agent.name}\n\n${agent.systemPrompt}`,
			});
		}

		return files;
	}
}
