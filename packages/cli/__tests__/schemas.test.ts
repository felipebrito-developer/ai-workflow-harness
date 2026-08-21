import { describe, expect, it } from "bun:test";
import { CustomAgentSchema } from "../src/schemas/agent.schema.js";
import { HarnessConfigSchema } from "../src/schemas/harness-config.schema.js";
import { McpServerSchema } from "../src/schemas/mcp.schema.js";
import { TaskManifestSchema } from "../src/schemas/task-manifest.schema.js";

describe("Core Zod Schemas Validation Suite", () => {
	it("should parse valid HarnessConfig", () => {
		const config = HarnessConfigSchema.parse({
			projectName: "TestApp",
			stack: ["node"],
			adapters: ["opencode"],
			provider: { type: "openrouter", model: "claude-3.5-sonnet" },
			taskBackend: { type: "local" },
			commands: { test: "bun test", lint: "bun run lint" },
		});
		expect(config.version).toBe("1.0.0");
		expect(config.pipelineMode).toBe("agile-fasttrack");
		expect(config.vibeSettings.autoExpandBoundaries).toBe(true);
	});

	it("should parse valid CustomAgent", () => {
		const agent = CustomAgentSchema.parse({
			name: "test-agent",
			description: "Test agent description",
			mode: "subagent",
			provider: { type: "openrouter", model: "claude-3.5-sonnet" },
			permissions: {
				edit: "allow",
				bash: "allow",
				task: { "*": "deny" },
				externalDirectory: "deny",
			},
			systemPrompt: "System instructions",
		});
		expect(agent.name).toBe("test-agent");
	});

	it("should parse valid McpServer", () => {
		const mcp = McpServerSchema.parse({
			name: "fetch",
			type: "local",
			command: ["npx", "-y", "@modelcontextprotocol/server-fetch"],
		});
		expect(mcp.name).toBe("fetch");
	});

	it("should parse valid TaskManifest", () => {
		const manifest = TaskManifestSchema.parse({
			frontmatter: {
				id: "task-001",
				title: "Test Task",
				status: "TODO",
				feature_ref: "core",
			},
			allowedFiles: ["src/a.ts"],
			acceptanceCriteria: ["Criteria 1"],
			verificationCommands: ["bun test"],
		});
		expect(manifest.frontmatter.id).toBe("task-001");
	});
});
