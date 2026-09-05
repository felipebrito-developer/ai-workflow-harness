import { describe, expect, it } from "bun:test";
import { AgentMapper } from "../src/engines/agent-mapper.js";
import { AntigravitySerializer } from "../../adapters/src/antigravity-adapter.js";
import { CursorSerializer } from "../../adapters/src/cursor-adapter.js";
import { OpenCodeSerializer } from "../../adapters/src/opencode-adapter.js";
import type { InitAnswers } from "../src/commands/init.js";
import type { HarnessConfig } from "../src/schemas/harness-config.schema.js";

describe("Vibe-Assist Mode Integration Suite", () => {
	const baseAnswers: InitAnswers = {
		projectName: "vibe-test-app",
		enableTokenOptimizations: true,
		stack: ["react-web", "node"],
		createSpecialistTemplates: true,
		installRecommendedSkills: true,
		adapters: ["opencode", "antigravity"],
		workflowMode: "vibe-assist",
		providerType: "openrouter",
		modelPreset: "complex-efficient",
		taskBackendType: "local",
		useAiMemory: true,
		pipelineMode: "xp-strict",
		cmdTest: "bun test",
		cmdLint: "bunx @biomejs/biome check .",
	};

	it("should map core agents and specialists as primary agents in vibe-assist mode", () => {
		const core = AgentMapper.getCoreAgents(baseAnswers);
		expect(core["architect-agent"].mode).toBe("primary");
		expect(core["po-agent"].mode).toBe("primary");
		expect(core["designer-lead"].mode).toBe("primary");
		expect(core["tech-lead"].mode).toBe("primary");
		expect(core["test-creator"].mode).toBe("primary");
		expect(core["architect-agent"].systemPrompt).toContain("STARTUP PROTOCOL");

		const specialists = AgentMapper.getSpecialistMap(baseAnswers);
		expect(specialists["react-web"].mode).toBe("primary");
		expect(specialists["react-web"].systemPrompt).toContain("STARTUP PROTOCOL");
		expect(specialists.node.mode).toBe("primary");
		expect(specialists["db-sql"].mode).toBe("primary");
	});

	it("should serialize vibe-assist directives in adapters", () => {
		const config: HarnessConfig = {
			projectName: "vibe-test-app",
			stack: ["react-web", "node"],
			packageManager: "bun",
			commands: { test: "bun test", lint: "bun check" },
			workflowMode: "vibe-assist",
			pipelineMode: "xp-strict",
			taskBackend: { type: "local" },
			memoryBackend: { type: "ai-memory", command: ["ai-memory", "mcp-bridge"] },
			provider: { type: "openrouter", model: "openrouter/z-ai/glm-5.2", defaultModel: "z-ai/glm-5.2" },
			circuitBreakerLimit: 3,
			vibeSettings: { autoExpandBoundaries: true, retroIndexSpecs: true },
		};

		const anti = AntigravitySerializer.serialize(config, [], []);
		const antiJson = JSON.parse(anti[0].content);
		expect(antiJson.directives[0]).toContain("Vibe-Assist Mode Active");

		const cursor = CursorSerializer.serialize(config, [], []);
		expect(cursor[1].content).toContain("Vibe-Assist Mode");

		const opencode = OpenCodeSerializer.serialize(config, [], []);
		expect(opencode[1].content).toContain("Interactive Pairing");
	});
});
