import type { HarnessConfig } from "../../cli/src/schemas/harness-config.schema.js";
import type { McpServer } from "../../cli/src/schemas/mcp.schema.js";
import type { SerializedFile } from "./opencode-adapter.js";

export class CursorSerializer {
  public static serialize(config: HarnessConfig, mcpServers: McpServer[] = []): SerializedFile[] {
    const payload = {
      project: config.projectName,
      instructions: "Follow 5-phase planning strictly. Modify only files in task-XXX.md allowed boundaries.",
    };

    return [
      {
        relativePath: ".cursorrules",
        content: JSON.stringify(payload, null, 2),
      },
    ];
  }
}
