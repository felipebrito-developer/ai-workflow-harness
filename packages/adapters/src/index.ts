import fs from "node:fs/promises";
import path from "node:path";
import {
	type CustomAgent,
	CustomAgentSchema,
} from "../../cli/src/schemas/agent.schema.js";
import type { HarnessConfig } from "../../cli/src/schemas/harness-config.schema.js";
import {
	type McpServer,
	McpServerSchema,
} from "../../cli/src/schemas/mcp.schema.js";
import { AntigravitySerializer } from "./antigravity-adapter.js";
import { CursorSerializer } from "./cursor-adapter.js";
import { OpenCodeSerializer, type SerializedFile } from "./opencode-adapter.js";

const ADAPTER_REGISTRY: Record<
	string,
	{ serialize: (config: any, agents?: any, mcp?: any) => SerializedFile[] }
> = {
	opencode: OpenCodeSerializer,
	antigravity: AntigravitySerializer,
	cursor: CursorSerializer,
};

export class AdapterCompiler {
	public static async loadCustomAgents(
		targetDirectory: string,
	): Promise<CustomAgent[]> {
		const agentsDir = path.join(targetDirectory, ".harness", "agents");
		const customAgents: CustomAgent[] = [];

		try {
			const files = await fs.readdir(agentsDir);
			for (const file of files) {
				if (file.endsWith(".json")) {
					const raw = await fs.readFile(path.join(agentsDir, file), "utf-8");
					const parsed = JSON.parse(raw);
					customAgents.push(CustomAgentSchema.parse(parsed));
				}
			}
		} catch (err: any) {
			console.warn(
				`[Adapters] Failed to read or parse custom agents: ${err.message}`,
			);
		}

		return customAgents;
	}

	public static async loadMcpServers(
		targetDirectory: string,
	): Promise<McpServer[]> {
		const mcpDir = path.join(targetDirectory, ".harness", "mcp");
		const mcpServers: McpServer[] = [];

		try {
			const files = await fs.readdir(mcpDir);
			for (const file of files) {
				if (file.endsWith(".json")) {
					const raw = await fs.readFile(path.join(mcpDir, file), "utf-8");
					const parsed = JSON.parse(raw);
					mcpServers.push(McpServerSchema.parse(parsed));
				}
			}
		} catch (err: any) {
			console.warn(
				`[Adapters] Failed to read or parse MCP servers: ${err.message}`,
			);
		}

		return mcpServers;
	}

	public static async compileAll(
		config: HarnessConfig,
		targetDirectory: string = process.cwd(),
	): Promise<string[]> {
		const filesToWrite: SerializedFile[] = [];
		const customAgents =
			await AdapterCompiler.loadCustomAgents(targetDirectory);
		const mcpServers = await AdapterCompiler.loadMcpServers(targetDirectory);

		for (const adapter of config.adapters) {
			if (ADAPTER_REGISTRY[adapter]) {
				filesToWrite.push(
					...ADAPTER_REGISTRY[adapter].serialize(
						config,
						customAgents,
						mcpServers,
					),
				);
			} else {
				console.warn(`[Adapters] Unknown adapter requested: ${adapter}`);
			}
		}

		const writtenFiles: string[] = [];

		for (const file of filesToWrite) {
			const destination = path.resolve(targetDirectory, file.relativePath);
			await fs.mkdir(path.dirname(destination), { recursive: true });
			await fs.writeFile(destination, file.content, "utf-8");
			writtenFiles.push(file.relativePath);
		}

		return writtenFiles;
	}
}

export * from "./opencode-adapter.js";
export * from "./antigravity-adapter.js";
export * from "./cursor-adapter.js";
