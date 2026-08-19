import type { HarnessConfig } from "../../cli/src/schemas/harness-config.schema.js";
import type { McpServer } from "../../cli/src/schemas/mcp.schema.js";
import type { SerializedFile } from "./opencode-adapter.js";

export class AntigravitySerializer {
  public static serialize(config: HarnessConfig, mcpServers: McpServer[] = []): SerializedFile[] {
    const mcpMap: Record<string, unknown> = {};

    if (config.taskBackend.type === "linear") {
      mcpMap.linear = {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-linear"],
        env: {
          LINEAR_API_KEY: "${LINEAR_API_KEY}",
        },
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

    const payload = {
      version: "1.0.0",
      project: config.projectName,
      directives: [
        "Enforce 5-phase planning pipeline before generating implementation code.",
        "Read .harness/spec/app-summary.md for architectural context.",
        "Adhere to task-XXX.md file boundary restrictions strictly.",
        `Primary stack: ${Array.isArray(config.stack) ? config.stack.join(", ") : config.stack}`,
      ],
      mcpServers: mcpMap,
    };

    return [
      {
        relativePath: "antigravity.json",
        content: JSON.stringify(payload, null, 2),
      },
    ];
  }
}