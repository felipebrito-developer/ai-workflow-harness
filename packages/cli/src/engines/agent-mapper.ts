import type { InitAnswers, StackOption } from "../commands/init.js";

export class AgentMapper {
	public static getModelForRole(role: string, answers: InitAnswers): string {
		let rawModel = "anthropic/claude-3.5-sonnet";

		if (answers.modelPreset === "custom") {
			rawModel = answers.customDefaultModel || "anthropic/claude-3.5-sonnet";
		} else if (answers.modelPreset === "complex-best") {
			switch (role) {
				case "architect-agent":
				case "db-engineer":
					rawModel = "deepseek/deepseek-r1";
					break;
				case "po-agent":
					rawModel = "z-ai/glm-5.2";
					break;
				case "test-runner":
					rawModel = "google/gemini-2.5-flash";
					break;
				default:
					rawModel = "anthropic/claude-3.5-sonnet";
			}
		} else if (answers.modelPreset === "complex-efficient") {
			switch (role) {
				case "architect-agent":
				case "db-engineer":
					rawModel = "deepseek/deepseek-r1";
					break;
				case "workflow-orchestrator":
				case "po-agent":
				case "designer-lead":
				case "designer-ui":
				case "tech-lead":
					rawModel = "z-ai/glm-5.2";
					break;
				case "test-runner":
					rawModel = "google/gemini-2.5-flash";
					break;
				default:
					rawModel = "qwen/qwen-2.5-coder-32b-instruct";
			}
		} else if (answers.modelPreset === "small-best") {
			switch (role) {
				case "po-agent":
					rawModel = "z-ai/glm-5.2";
					break;
				case "test-runner":
					rawModel = "google/gemini-2.5-flash";
					break;
				default:
					rawModel = "anthropic/claude-3.5-sonnet";
			}
		} else {
			switch (role) {
				case "workflow-orchestrator":
				case "architect-agent":
				case "po-agent":
				case "designer-lead":
				case "designer-ui":
					rawModel = "z-ai/glm-5.2";
					break;
				case "test-runner":
					rawModel = "google/gemini-2.5-flash";
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
			"workflow-orchestrator": {
				name: "workflow-orchestrator",
				description:
					"Primary pipeline supervisor managing Phase 1–5 transitions and handoffs.",
				mode: "primary",
				provider: {
					type: answers.providerType,
					model: AgentMapper.getModelForRole("workflow-orchestrator", answers),
					promptCaching: answers.enableTokenOptimizations,
				},
				permissions: {
					edit: "allow",
					bash: "ask",
					task: { "*": "allow" },
					externalDirectory: "deny",
				},
				systemPrompt:
					"You are the Workflow Orchestrator. Manage the 5-Phase Planning Lifecycle. Delegate Phase 1 (Discovery) and Phase 4 (Architecture) to @architect-agent. Delegate Phase 2 (Functional Strategy) and Phase 5 (Task Slicing) to @po-agent. Delegate Phase 3 (UI Design) to @designer-lead. Ensure all phase deliverables pass inspection before triggering technical execution. On execution: hand tasks to @tech-lead for boundary-locked implementation. Load .harness/spec/app-summary.md at session start for architectural context. Load .harness/skills/core/skill-caveman.md for token efficiency.",
				skills: [
					"skill-caveman.md",
					"skill-context-caching.md",
					"skill-harness.md",
				],
			},
			"architect-agent": {
				name: "architect-agent",
				description:
					"Owns Phase 1 Problem Discovery and Phase 4 Technical Architecture.",
				mode: "subagent",
				provider: {
					type: answers.providerType,
					model: AgentMapper.getModelForRole("architect-agent", answers),
					promptCaching: answers.enableTokenOptimizations,
				},
				permissions: {
					edit: "allow",
					bash: "ask",
					task: { "*": "deny" },
					externalDirectory: "deny",
				},
				systemPrompt:
					"You are the Solution Architect. Phase 1 (Problem Discovery): Use Wayfinder grilling methodology for structured Q&A (3+2 choice rule). Create discovery Maps at .harness/memory/discovery/<feature>-map.md. Save interview transcripts to .harness/memory/discovery/<feature>.md. Use research tickets for areas requiring baseline analysis. Phase 4 (Technical Architecture): Design data models, API contracts, and infrastructure ADRs. Write specs to .harness/spec/features/<feature>/technical/spec.md (max 500 lines). Define type contracts, schema migrations, and endpoint signatures. Author ADRs for significant architectural decisions. NEVER write feature source code directly. You produce SPECIFICATIONS, not implementations. If a prototype is needed, create a SPIKE task for @tech-lead.",
				skills: [
					"skill-caveman.md",
					"skill-context-caching.md",
					"skill-wayfinder-harness.md",
				],
			},
			"po-agent": {
				name: "po-agent",
				description:
					"Owns Phase 2 Functional Strategy and Phase 5 Task Slicing.",
				mode: "subagent",
				provider: {
					type: answers.providerType,
					model: AgentMapper.getModelForRole("po-agent", answers),
					promptCaching: answers.enableTokenOptimizations,
				},
				permissions: {
					edit: "allow",
					bash: "ask",
					task: { "*": "deny" },
					externalDirectory: "deny",
				},
				systemPrompt:
					"You are the Product Owner. Phase 2 (Functional Strategy): Define epics, personas, and user journeys. Use Wayfinder methodology: create a discovery Map before defining scope. Mark unclear requirements as 'Fog of War' — do NOT fabricate specifications. Validate AI execution topology (Orchestrated, Solo, Vibe-Assist). Phase 5 (Task Slicing): Slice technical specs into atomic task manifests (.harness/tasks/task-XXX.md). CRITICAL: Each task MUST touch at most 2 allowed files. If a feature requires more than 2 files, split into sequential tasks with depends_on chains. Every task MUST have: explicit AC checkboxes, verification commands in ```bash blocks, and concrete expected outcomes. Use depends_on arrays to model the dependency frontier. Generate task IDs as task-<slug> (lowercase, hyphenated).",
				skills: [
					"skill-caveman.md",
					"skill-context-caching.md",
					"skill-wayfinder-harness.md",
				],
			},
			"designer-lead": {
				name: "designer-lead",
				description:
					"Owns Phase 3 UI Architecture, component registry, and design consistency.",
				mode: "subagent",
				provider: {
					type: answers.providerType,
					model: AgentMapper.getModelForRole("designer-lead", answers),
					promptCaching: answers.enableTokenOptimizations,
				},
				permissions: {
					edit: "allow",
					bash: "ask",
					task: { "*": "deny", "designer-ui": "allow" },
					externalDirectory: "deny",
				},
				systemPrompt:
					"You are the Designer Lead. Define reusable UI components in .harness/UI/custom-components-registry.ts and author component specs in .harness/UI/details/<name>/component.md. Delegate ASCII and Mermaid wireframe creation to @designer-ui.",
				skills: ["skill-caveman.md", "skill-context-caching.md"],
			},
			"designer-ui": {
				name: "designer-ui",
				description:
					"Generates ASCII block wireframes and Mermaid route flowcharts.",
				mode: "subagent",
				provider: {
					type: answers.providerType,
					model: AgentMapper.getModelForRole("designer-ui", answers),
					promptCaching: answers.enableTokenOptimizations,
				},
				permissions: {
					edit: "allow",
					bash: "ask",
					task: { "*": "deny" },
					externalDirectory: "deny",
				},
				systemPrompt:
					"You are the UI Wireframe Designer. Author ASCII block wireframes in wireframe-ascii.md and Mermaid state transition diagrams in route-flow-mermaid.md based on Designer-Lead component specifications.",
				skills: ["skill-caveman.md", "skill-context-caching.md"],
			},
			"tech-lead": {
				name: "tech-lead",
				description:
					"Execution manager. Decomposes tasks into subtasks, verifies ACs, and creates atomic git commits.",
				mode: "primary",
				provider: {
					type: answers.providerType,
					model: AgentMapper.getModelForRole("tech-lead", answers),
					promptCaching: answers.enableTokenOptimizations,
				},
				permissions: {
					edit: "allow",
					bash: "allow",
					task: { "*": "allow" },
					externalDirectory: "deny",
				},
				systemPrompt:
					"You are the Tech Lead — an AUDITOR and STATE MACHINE only. CRITICAL RULE: You must NEVER write application source code, test code, or configuration files directly. You are forbidden from using file-editing tools on any file outside .harness/. Delegate ALL implementation to @<stack>-specialist agents and ALL test authoring to @test-creator. Your workflow: 1) Read task manifest from .harness/tasks/task-XXX.md 2) Decompose into stack subtasks and delegate to specialists 3) Delegate test creation to @test-creator (RED phase) 4) Validate implementation against Acceptance Criteria (negative-proof verification) 5) Run `harness verify <task-id>` to execute automated gates 6) On pass: Run `harness close <task-id>` — you are the SOLE commit authority 7) On fail: Log attempt to .harness/memory/attempts/ and re-delegate. Load .harness/skills/core/skill-caveman.md for token efficiency.",
				skills: [
					"skill-caveman.md",
					"skill-context-caching.md",
					"skill-harness.md",
				],
			},
			"test-creator": {
				name: "test-creator",
				description:
					"Authors contract, unit, and integration tests matching Acceptance Criteria.",
				mode: "subagent",
				provider: {
					type: answers.providerType,
					model: AgentMapper.getModelForRole("test-creator", answers),
					promptCaching: answers.enableTokenOptimizations,
				},
				permissions: {
					edit: "allow",
					bash: "ask",
					task: { "*": "deny" },
					externalDirectory: "deny",
				},
				systemPrompt:
					"You are the Test Creator. Author comprehensive, failing test suites BEFORE any implementation begins (RED phase of TDD). CRITICAL RULES: For EVERY acceptance criterion, generate at minimum: (a) A happy-path assertion with concrete expected values (b) An error/rejection case asserting specific error messages (use toThrow()) (c) A boundary condition or edge case (empty input, max length, null, undefined). NEVER use toBeTruthy() or toBeDefined() alone — assert specific values. Test the SAD PATH FIRST — error handling is more important than happy path. Use describe/it blocks with descriptive names that read as specifications. Mock external dependencies (fs, network, DB) — never hit real services. Include at least one test for malformed/invalid input per public function. Output format: Place tests in __tests__/<module>.test.ts. Do NOT implement feature logic — only test contracts.",
				skills: [
					"skill-caveman.md",
					"skill-context-caching.md",
					"skill-tdd-assertions.md",
				],
			},
			"test-runner": {
				name: "test-runner",
				description:
					"Executes test and linter commands. Emits structured zero-noise failure reports.",
				mode: "subagent",
				provider: {
					type: answers.providerType,
					model: AgentMapper.getModelForRole("test-runner", answers),
					promptCaching: false,
				},
				permissions: {
					edit: "deny",
					bash: "allow",
					task: { "*": "deny" },
					externalDirectory: "deny",
				},
				systemPrompt:
					"You are the Test Runner. Execute verification commands via terminal. Never edit code or tests. Emit concise structured execution summaries containing only failing assertions, files, and line numbers.",
				skills: [
					"skill-caveman.md",
					"skill-context-caching.md",
					"skill-zero-noise-reporter.md",
				],
			},
		};
	}

	public static getSpecialistMap(
		answers: InitAnswers,
	): Record<StackOption, any> {
		return {
			"react-web": {
				name: "web-specialist",
				description:
					"Specialist in React, Next.js/Vite, Tailwind, and Web state management.",
				mode: "subagent",
				provider: {
					type: answers.providerType,
					model: AgentMapper.getModelForRole("web-specialist", answers),
					promptCaching: answers.enableTokenOptimizations,
				},
				permissions: {
					edit: "allow",
					bash: "ask",
					task: { "*": "deny" },
					externalDirectory: "deny",
				},
				systemPrompt:
					"You are the Web Specialist. Implement React and Web frontend components according to .harness/UI/ specs. Strictly respect file boundaries and ACs. You MUST only modify files listed in the task manifest's allowedFiles section. Any file outside this boundary is FORBIDDEN. Before editing any file, verify it appears in the allowedFiles array.",
				skills: [
					"skill-caveman.md",
					"skill-context-caching.md",
					"skill-tailwind-shadcn.md",
					"skill-tanstack-query.md",
				],
			},
			"react-native": {
				name: "react-native-specialist",
				description:
					"Specialist in React Native, Expo Router, NativeWind, and gestures.",
				mode: "subagent",
				provider: {
					type: answers.providerType,
					model: AgentMapper.getModelForRole(
						"react-native-specialist",
						answers,
					),
					promptCaching: answers.enableTokenOptimizations,
				},
				permissions: {
					edit: "allow",
					bash: "ask",
					task: { "*": "deny" },
					externalDirectory: "deny",
				},
				systemPrompt:
					"You are the React Native Specialist. Implement mobile components according to Expo standards and mobile specs. Strictly respect file boundaries. You MUST only modify files listed in the task manifest's allowedFiles section. Any file outside this boundary is FORBIDDEN. Before editing any file, verify it appears in the allowedFiles array.",
				skills: [
					"skill-caveman.md",
					"skill-context-caching.md",
					"skill-expo-router.md",
				],
			},
			node: {
				name: "node-specialist",
				description:
					"Specialist in Node.js, Fastify/Express, TypeScript, and clean architecture.",
				mode: "subagent",
				provider: {
					type: answers.providerType,
					model: AgentMapper.getModelForRole("node-specialist", answers),
					promptCaching: answers.enableTokenOptimizations,
				},
				permissions: {
					edit: "allow",
					bash: "ask",
					task: { "*": "deny" },
					externalDirectory: "deny",
				},
				systemPrompt:
					"You are the Node.js Specialist. Implement backend endpoints, services, and domain models following strict typing and schema contracts. You MUST only modify files listed in the task manifest's allowedFiles section. Any file outside this boundary is FORBIDDEN. Before editing any file, verify it appears in the allowedFiles array.",
				skills: [
					"skill-caveman.md",
					"skill-context-caching.md",
					"skill-typescript-strict.md",
				],
			},
			go: {
				name: "go-specialist",
				description:
					"Specialist in idiomatic Go, Chi/Gin routers, and high-performance services.",
				mode: "subagent",
				provider: {
					type: answers.providerType,
					model: AgentMapper.getModelForRole("go-specialist", answers),
					promptCaching: answers.enableTokenOptimizations,
				},
				permissions: {
					edit: "allow",
					bash: "ask",
					task: { "*": "deny" },
					externalDirectory: "deny",
				},
				systemPrompt:
					"You are the Go Specialist. Implement idiomatic Golang services and HTTP handlers adhering to technical contracts. You MUST only modify files listed in the task manifest's allowedFiles section. Any file outside this boundary is FORBIDDEN. Before editing any file, verify it appears in the allowedFiles array.",
				skills: [
					"skill-caveman.md",
					"skill-context-caching.md",
					"skill-idiomatic-go.md",
					"skill-sqlc.md",
				],
			},
			"db-sql": {
				name: "db-engineer",
				description:
					"Specialist in SQL schema design, migrations, indexing, and query optimization.",
				mode: "subagent",
				provider: {
					type: answers.providerType,
					model: AgentMapper.getModelForRole("db-engineer", answers),
					promptCaching: answers.enableTokenOptimizations,
				},
				permissions: {
					edit: "allow",
					bash: "ask",
					task: { "*": "deny" },
					externalDirectory: "deny",
				},
				systemPrompt:
					"You are the Database Engineer. Author relational schema migrations, DDL scripts, and indexing strategies. You MUST only modify files listed in the task manifest's allowedFiles section. Any file outside this boundary is FORBIDDEN. Before editing any file, verify it appears in the allowedFiles array.",
				skills: [
					"skill-caveman.md",
					"skill-context-caching.md",
					"skill-postgres-schema-design.md",
				],
			},
			"db-nosql": {
				name: "db-engineer",
				description:
					"Specialist in NoSQL data models, single-table design, and aggregation pipelines.",
				mode: "subagent",
				provider: {
					type: answers.providerType,
					model: AgentMapper.getModelForRole("db-engineer", answers),
					promptCaching: answers.enableTokenOptimizations,
				},
				permissions: {
					edit: "allow",
					bash: "ask",
					task: { "*": "deny" },
					externalDirectory: "deny",
				},
				systemPrompt:
					"You are the Database Engineer. Author NoSQL access patterns, schemas, and cache strategies. You MUST only modify files listed in the task manifest's allowedFiles section. Any file outside this boundary is FORBIDDEN. Before editing any file, verify it appears in the allowedFiles array.",
				skills: [
					"skill-caveman.md",
					"skill-context-caching.md",
					"skill-dynamodb-single-table.md",
				],
			},
			python: {
				name: "python-specialist",
				description:
					"Specialist in Python services, FastAPI, and data scripting.",
				mode: "subagent",
				provider: {
					type: answers.providerType,
					model: AgentMapper.getModelForRole("python-specialist", answers),
					promptCaching: answers.enableTokenOptimizations,
				},
				permissions: {
					edit: "allow",
					bash: "ask",
					task: { "*": "deny" },
					externalDirectory: "deny",
				},
				systemPrompt:
					"You are the Python Specialist. Implement typed Python services according to specifications. You MUST only modify files listed in the task manifest's allowedFiles section. Any file outside this boundary is FORBIDDEN. Before editing any file, verify it appears in the allowedFiles array.",
				skills: ["skill-caveman.md", "skill-context-caching.md"],
			},
		};
	}
}
