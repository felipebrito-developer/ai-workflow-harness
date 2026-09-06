import type { InitAnswers, StackOption } from "../commands/init.js";

export class AgentMapper {
	public static getModelForRole(role: string, answers: InitAnswers): string {
		let rawModel = "anthropic/claude-3.5-sonnet";

		if (answers.modelPreset === "custom") {
			rawModel = answers.customDefaultModel || "anthropic/claude-3.5-sonnet";
		} else if (answers.modelPreset === "complex-best") {
			switch (role) {
				case "planner":
					rawModel = "deepseek/deepseek-r1";
					break;
				default:
					rawModel = "anthropic/claude-3.5-sonnet";
			}
		} else if (answers.modelPreset === "complex-efficient") {
			switch (role) {
				case "planner":
					rawModel = "deepseek/deepseek-r1";
					break;
				default:
					rawModel = "qwen/qwen-2.5-coder-32b-instruct";
			}
		} else if (answers.modelPreset === "small-best") {
			switch (role) {
				case "planner":
					rawModel = "anthropic/claude-3.5-sonnet";
					break;
				default:
					rawModel = "anthropic/claude-3.5-sonnet";
			}
		} else {
			switch (role) {
				case "planner":
					rawModel = "z-ai/glm-5.2";
					break;
				default:
					rawModel = "qwen/qwen-2.5-coder-32b-instruct";
			}
		}

		if (
			answers.providerType === "openrouter" &&
			!rawModel.startsWith("openrouter/")
		) {
			return `openrouter/${rawModel}`;
		}
		return rawModel;
	}

	public static getCoreAgents(answers: InitAnswers): Record<string, any> {
		return {
			planner: {
				name: "planner",
				description:
					"Reasoning agent (@planner) for architectural planning, living spec slicing, and task manifest creation.",
				mode: "primary",
				provider: {
					type: answers.providerType,
					model: AgentMapper.getModelForRole("planner", answers),
					promptCaching: answers.enableTokenOptimizations,
				},
				permissions: {
					edit: "allow",
					bash: "ask",
					task: { "*": "allow" },
					externalDirectory: "deny",
				},
				systemPrompt:
					"You are @planner — the Reasoning Agent for system design, architectural slicing, living spec generation (*.contract.ts, *.spec.ts, *.spec.tsx), and task manifest creation (.harness/tasks/task-XXX.md). CRITICAL RULE: You must NEVER write application implementation code. Output atomic task manifests touching <= 2 code files + 1 test file (max 3 total). Load .harness/spec/app-summary.md at session start for master blueprint context.",
				skills: [
					"skill-caveman.md",
					"skill-context-caching.md",
					"skill-executable-specs.md",
				],
			},
		};
	}

	public static getSpecialistMap(
		answers: InitAnswers,
	): Record<StackOption, any> {
		return {
			"react-web": {
				name: "web-builder",
				description:
					"Web builder agent (@web-builder) executing React web frontend implementation tasks.",
				mode: "subagent",
				provider: {
					type: answers.providerType,
					model: AgentMapper.getModelForRole("web-builder", answers),
					promptCaching: answers.enableTokenOptimizations,
				},
				permissions: {
					edit: "allow",
					bash: "ask",
					task: { "*": "deny" },
					externalDirectory: "deny",
				},
				systemPrompt:
					"You are @web-builder — stack-specific TDD executor for React web frontend implementation. Implement features test-first (RED -> GREEN -> REFACTOR) according to living specs. Strictly respect allowedFiles in .harness/tasks/task-XXX.md (max 2 code files + 1 test file). Run harness verify <taskId> to execute verification gates.",
				skills: [
					"skill-caveman.md",
					"skill-context-caching.md",
					"skill-executable-specs.md",
					"skill-ui-contracts.md",
				],
			},
			"react-native": {
				name: "mobile-builder",
				description:
					"Mobile builder agent (@mobile-builder) executing React Native implementation tasks.",
				mode: "subagent",
				provider: {
					type: answers.providerType,
					model: AgentMapper.getModelForRole("mobile-builder", answers),
					promptCaching: answers.enableTokenOptimizations,
				},
				permissions: {
					edit: "allow",
					bash: "ask",
					task: { "*": "deny" },
					externalDirectory: "deny",
				},
				systemPrompt:
					"You are @mobile-builder — stack-specific TDD executor for React Native mobile implementation. Implement features test-first (RED -> GREEN -> REFACTOR) according to living specs. Strictly respect allowedFiles in .harness/tasks/task-XXX.md (max 2 code files + 1 test file). Run harness verify <taskId> to execute verification gates.",
				skills: [
					"skill-caveman.md",
					"skill-context-caching.md",
					"skill-executable-specs.md",
					"skill-ui-contracts.md",
				],
			},
			node: {
				name: "backend-builder",
				description:
					"Backend builder agent (@backend-builder) executing Node.js implementation tasks.",
				mode: "subagent",
				provider: {
					type: answers.providerType,
					model: AgentMapper.getModelForRole("backend-builder", answers),
					promptCaching: answers.enableTokenOptimizations,
				},
				permissions: {
					edit: "allow",
					bash: "ask",
					task: { "*": "deny" },
					externalDirectory: "deny",
				},
				systemPrompt:
					"You are @backend-builder — stack-specific TDD executor for backend API and domain implementation. Implement features test-first (RED -> GREEN -> REFACTOR) according to living specs. Strictly respect allowedFiles in .harness/tasks/task-XXX.md (max 2 code files + 1 test file). Run harness verify <taskId> to execute verification gates.",
				skills: [
					"skill-caveman.md",
					"skill-context-caching.md",
					"skill-executable-specs.md",
				],
			},
			go: {
				name: "backend-builder",
				description:
					"Backend builder agent (@backend-builder) executing Go implementation tasks.",
				mode: "subagent",
				provider: {
					type: answers.providerType,
					model: AgentMapper.getModelForRole("backend-builder", answers),
					promptCaching: answers.enableTokenOptimizations,
				},
				permissions: {
					edit: "allow",
					bash: "ask",
					task: { "*": "deny" },
					externalDirectory: "deny",
				},
				systemPrompt:
					"You are @backend-builder — stack-specific TDD executor for Go backend services. Implement features test-first (RED -> GREEN -> REFACTOR) according to living specs. Strictly respect allowedFiles in .harness/tasks/task-XXX.md (max 2 code files + 1 test file). Run harness verify <taskId> to execute verification gates.",
				skills: [
					"skill-caveman.md",
					"skill-context-caching.md",
					"skill-executable-specs.md",
				],
			},
			"db-sql": {
				name: "backend-builder",
				description:
					"Backend builder agent (@backend-builder) executing SQL database implementation tasks.",
				mode: "subagent",
				provider: {
					type: answers.providerType,
					model: AgentMapper.getModelForRole("backend-builder", answers),
					promptCaching: answers.enableTokenOptimizations,
				},
				permissions: {
					edit: "allow",
					bash: "ask",
					task: { "*": "deny" },
					externalDirectory: "deny",
				},
				systemPrompt:
					"You are @backend-builder — stack-specific TDD executor for SQL schema and database tasks. Implement features test-first according to living specs. Strictly respect allowedFiles in .harness/tasks/task-XXX.md (max 2 code files + 1 test file). Run harness verify <taskId> to execute verification gates.",
				skills: [
					"skill-caveman.md",
					"skill-context-caching.md",
					"skill-executable-specs.md",
				],
			},
			"db-nosql": {
				name: "backend-builder",
				description:
					"Backend builder agent (@backend-builder) executing NoSQL database implementation tasks.",
				mode: "subagent",
				provider: {
					type: answers.providerType,
					model: AgentMapper.getModelForRole("backend-builder", answers),
					promptCaching: answers.enableTokenOptimizations,
				},
				permissions: {
					edit: "allow",
					bash: "ask",
					task: { "*": "deny" },
					externalDirectory: "deny",
				},
				systemPrompt:
					"You are @backend-builder — stack-specific TDD executor for NoSQL data model tasks. Implement features test-first according to living specs. Strictly respect allowedFiles in .harness/tasks/task-XXX.md (max 2 code files + 1 test file). Run harness verify <taskId> to execute verification gates.",
				skills: [
					"skill-caveman.md",
					"skill-context-caching.md",
					"skill-executable-specs.md",
				],
			},
			python: {
				name: "backend-builder",
				description:
					"Backend builder agent (@backend-builder) executing Python implementation tasks.",
				mode: "subagent",
				provider: {
					type: answers.providerType,
					model: AgentMapper.getModelForRole("backend-builder", answers),
					promptCaching: answers.enableTokenOptimizations,
				},
				permissions: {
					edit: "allow",
					bash: "ask",
					task: { "*": "deny" },
					externalDirectory: "deny",
				},
				systemPrompt:
					"You are @backend-builder — stack-specific TDD executor for Python implementation tasks. Implement features test-first according to living specs. Strictly respect allowedFiles in .harness/tasks/task-XXX.md (max 2 code files + 1 test file). Run harness verify <taskId> to execute verification gates.",
				skills: [
					"skill-caveman.md",
					"skill-context-caching.md",
					"skill-executable-specs.md",
				],
			},
		};
	}
}
