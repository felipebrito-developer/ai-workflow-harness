import fs from "node:fs/promises";
import path from "node:path";
import { type CustomAgent, CustomAgentSchema } from "../schemas/agent.schema.js";
import type { HarnessConfig } from "../schemas/harness-config.schema.js";
import { type McpServer, McpServerSchema } from "../schemas/mcp.schema.js";
import { AntigravitySerializer } from "./antigravity-serializer.js";
import { OpenCodeSerializer, type SerializedFile } from "./opencode-serializer.js";

export class AdapterCompiler {
  public static async loadCustomAgents(targetDirectory: string): Promise<CustomAgent[]> {
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
    } catch {}

    return customAgents;
  }

  public static async loadMcpServers(targetDirectory: string): Promise<McpServer[]> {
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
    } catch {}

    return mcpServers;
  }

  public static async compileAll(
    config: HarnessConfig,
    targetDirectory: string = process.cwd()
  ): Promise<string[]> {
    const filesToWrite: SerializedFile[] = [];
    const customAgents = await this.loadCustomAgents(targetDirectory);
    const mcpServers = await this.loadMcpServers(targetDirectory);

    if (config.adapters.includes("opencode")) {
      filesToWrite.push(...OpenCodeSerializer.serialize(config, customAgents, mcpServers));
    }

    if (config.adapters.includes("antigravity")) {
      filesToWrite.push(...AntigravitySerializer.serialize(config, mcpServers));
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

export * from "./opencode-serializer.js";
export * from "./antigravity-serializer.js";