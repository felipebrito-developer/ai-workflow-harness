import type { HarnessConfig } from "../schemas/harness-config.schema.js";
import type { SerializedFile } from "./opencode-serializer.js";

export class AntigravitySerializer {
  public static serialize(config: HarnessConfig): SerializedFile[] {
    const files: SerializedFile[] = [];

    const mcpServers: Record<string, any> = {
      filesystem: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", process.cwd()],
      },
    };

    if (config.taskBackend.type === "linear") {
      mcpServers.linear = {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-linear"],
        env: {
          LINEAR_API_KEY: "${env:LINEAR_API_KEY}",
        },
      };
    }

    const antigravityConfig = {
      "$schema": "https://antigravity.ai/config.json",
      "project": config.projectName,
      "stack": config.stack,
      "mcpServers": mcpServers,
      "agentDirectives": {
        "role": "Autonomous Terminal Implementation Agent",
        "contextAnchors": [
          ".harness/spec/app-summary.md",
          ".harness/standards/**/summary.md",
        ],
        "boundaryEnforcement": {
          "taskManifestGlob": ".harness/tasks/task-*.md",
          "strictBoundaryCheck": true,
        },
        "executionCommands": config.commands,
        "circuitBreaker": {
          "maxAttempts": config.circuitBreakerLimit,
        },
      },
    };

    files.push({
      relativePath: "antigravity.json",
      content: JSON.stringify(antigravityConfig, null, 2),
    });

    return files;
  }
}