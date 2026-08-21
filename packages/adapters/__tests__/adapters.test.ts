import { describe, expect, it } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import type { HarnessConfig } from "../../cli/src/schemas/harness-config.schema.js";
import {
	AdapterCompiler,
	AntigravitySerializer,
	CursorSerializer,
	OpenCodeSerializer,
} from "../src/index.js";

describe("Adapters Serializers", () => {
	const sampleConfig: HarnessConfig = {
		version: "1.0.0",
		projectName: "TestApp",
		stack: ["node", "react-web"],
		adapters: ["opencode", "antigravity", "cursor"],
		workflowMode: "orchestrated",
		provider: {
			type: "openrouter",
			model: "anthropic/claude-3.5-sonnet",
			promptCaching: true,
		},
		taskBackend: { type: "local" },
		memoryBackend: { type: "ai-memory" },
		pipelineMode: "agile-fasttrack",
		vibeSettings: { autoExpandBoundaries: true, retroIndexSpecs: true },
		circuitBreakerLimit: 3,
		commands: { test: "bun test", lint: "bun run lint" },
	};

	it("should serialize Antigravity config with ai-memory MCP and directives", () => {
		const files = AntigravitySerializer.serialize(sampleConfig);
		expect(files.length).toBe(1);
		expect(files[0].relativePath).toBe("antigravity.json");
		expect(files[0].content).toContain("ai-memory");
		expect(files[0].content).toContain("directives");
	});

	it("should serialize OpenCode config with mcp and instructions", () => {
		const files = OpenCodeSerializer.serialize(sampleConfig);
		expect(files.length).toBeGreaterThan(1);
		const opencodeJson = files.find((f) => f.relativePath === "opencode.json");
		expect(opencodeJson).toBeDefined();
		expect(opencodeJson?.content).toContain("ai-memory");
	});

	it("should serialize Cursor rules", () => {
		const files = CursorSerializer.serialize(sampleConfig);
		expect(files.length).toBe(2);
		const cursorRules = files.find((f) => f.relativePath === ".cursorrules");
		expect(cursorRules).toBeDefined();
		expect(cursorRules?.content).toContain("TestApp");
	});

	it("should test AdapterCompiler compileAll function", async () => {
		const tmpDir = path.join(process.cwd(), ".tmp-adapter-compiler-test");
		await fs.mkdir(tmpDir, { recursive: true });

		const writtenFiles = await AdapterCompiler.compileAll(sampleConfig, tmpDir);
		expect(writtenFiles.length).toBeGreaterThan(0);
		expect(writtenFiles).toContain("opencode.json");
		expect(writtenFiles).toContain("antigravity.json");

		await fs.rm(tmpDir, { recursive: true, force: true });
	});

	it("should handle malformed JSON without crashing when loading custom agents or MCP servers", async () => {
		const tmpDir = path.join(process.cwd(), ".tmp-adapter-malformed-test");
		const agentsDir = path.join(tmpDir, ".harness", "agents");
		await fs.mkdir(agentsDir, { recursive: true });

		// Write a valid JSON file and a malformed one
		await fs.writeFile(
			path.join(agentsDir, "bad.json"),
			"{ invalid json }",
			"utf-8",
		);

		// This should catch the JSON parse error, console.warn it, and return empty array
		// without crashing the test.
		const customAgents = await AdapterCompiler.loadCustomAgents(tmpDir);
		expect(customAgents.length).toBe(0);

		await fs.rm(tmpDir, { recursive: true, force: true });
	});
});
