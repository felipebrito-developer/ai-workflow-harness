import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import { type CustomAgent, CustomAgentSchema } from "../src/schemas/agent.schema.js";

describe("Custom Agent Schema & Storage Test Suite", () => {
  const tmpAgentDir = path.join(process.cwd(), ".tmp-agent-test");

  beforeAll(async () => {
    await fs.mkdir(tmpAgentDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(tmpAgentDir, { recursive: true, force: true });
  });

  it("should validate and save custom agent JSON specification", async () => {
    const sampleAgent: CustomAgent = {
      name: "sec-auditor",
      description: "Audits security rules",
      mode: "subagent",
      provider: { type: "openrouter", model: "anthropic/claude-3.5-sonnet", promptCaching: true },
      permissions: { edit: "deny", bash: "allow", task: { "*": "deny" }, externalDirectory: "deny" },
      systemPrompt: "Perform security audits.",
    };

    const parsed = CustomAgentSchema.parse(sampleAgent);
    expect(parsed.name).toBe("sec-auditor");

    const filePath = path.join(tmpAgentDir, "sec-auditor.json");
    await fs.writeFile(filePath, JSON.stringify(parsed, null, 2), "utf-8");

    const raw = await fs.readFile(filePath, "utf-8");
    const loaded = JSON.parse(raw);
    expect(loaded.description).toBe("Audits security rules");
  });
});
