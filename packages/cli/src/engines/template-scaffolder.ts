export class TemplateScaffolder {
	public static getCoreSkills(): Record<string, string> {
		return {
			"skill-harness.md": [
				"# Skill: AI Workflow Harness Meta-Framework",
				"",
				"## Objective",
				"Operate the 2-mode development harness (@planner and stack-specific @builder), executable specs, boundary enforcement, and circuit breaker gates.",
				"",
				"## 1. Core Architecture Invariants",
				"- **2-Mode Operating System:** `@planner` for architectural planning, living spec slicing, and task manifest creation; stack-specific `@builder` for strict TDD task execution.",
				"- **Living Executable Specs:** Replace prose Markdown and ASCII diagrams with TypeScript contracts (`*.contract.ts`) and functional/UI component specs (`*.spec.ts`, `*.spec.tsx`).",
				"- **Atomic Tasks:** Tasks in `.harness/tasks/task-XXX.md` must touch <= 2 implementation code files + 1 test file (max 3 total).",
				"- **Deterministic Verification Gate:** Require test exit code 0 (`harness verify <taskId>`) before setting task status to `DONE`.",
				"- **3-Strike Circuit Breaker:** 3 consecutive test/verification failures trigger automated Git rollback to preflight state.",
				"",
				"## 2. CLI Engines & Workflow Commands",
				"- `harness init` — Scaffold framework tree, agent configurations, tool adapters, and skills.",
				"- `harness verify <task-id>` — Execute test/lint suite, sanitize error cards, enforce file boundaries, and update status.",
			].join("\n"),

			"skill-caveman.md": [
				"# Skill: Caveman Communication Mode",
				"",
				"## Objective",
				"Ultra-compressed communication mode. Cuts output tokens ~65% while keeping full technical accuracy and code completeness.",
				"",
				"Respond terse like smart caveman. All technical substance stay. Only fluff die.",
				"",
				"## 1. Rules",
				"- Drop articles (a/an/the), filler, pleasantries, hedging.",
				"- Fragments OK. Short synonyms.",
				"- Direct tool calls without narration.",
				"- Preserve technical terms, code, API names, and CLI commands verbatim.",
			].join("\n"),

			"skill-context-caching.md": [
				"# Skill: 2-Level Context Window Caching",
				"",
				"## Objective",
				"Minimize prompt cost across multi-turn agent sessions using structured specification layering.",
				"",
				"## Caching Protocol",
				"1. **Level 1 (Anchor):** Always load `.harness/spec/app-summary.md` into the prompt context on session start.",
				"2. **Level 2 (Demand):** Drill down to `.harness/spec/features/<feature>/README.md` and living specs ONLY when actively implementing that feature.",
				"3. **Zero Unneeded Files:** Never load unreferenced source files or entire directories into the context window.",
			].join("\n"),
		};
	}

	public static getStackSkills(): Record<string, string> {
		return {
			"skill-tailwind-shadcn.md": [
				"# Skill: Tailwind CSS & Component Architecture",
				"",
				"## Rules & Invariants",
				"- Use utility-first Tailwind classes adhering strictly to established design system tokens.",
				"- Maintain accessibility attributes (`aria-*`, `role`, focus visible states) across all interactive elements.",
				"- Keep presentation logic separate from custom data hooks.",
				"- Support seamless dark mode and glassmorphism styling.",
			].join("\n"),

			"skill-tanstack-query.md": [
				"# Skill: TanStack Query Best Practices",
				"",
				"## Rules & Invariants",
				"- Declare standardized query keys using array tuples `['resource', id]`.",
				"- Implement optimistic updates for mutating actions with automatic rollback on error.",
				"- Centralize API fetchers in dedicated service modules with typed responses.",
			].join("\n"),

			"skill-expo-router.md": [
				"# Skill: Expo Router & React Native Architecture",
				"",
				"## Rules & Invariants",
				"- Follow file-based routing conventions inside `app/` directory.",
				"- Utilize `react-native-reanimated` for smooth 60fps UI transitions.",
				"- Ensure safe area insets are respected across iOS and Android viewports.",
			].join("\n"),

			"skill-typescript-strict.md": [
				"# Skill: Strict TypeScript & Zod Type Safety",
				"",
				"## Rules & Invariants",
				"- Enforce `strict: true` with ZERO usage of `any` (use `unknown` + type guards).",
				"- Derive runtime types from Zod schemas using `z.infer<typeof Schema>`.",
				"- Use discriminated unions for distinct application state representations.",
				"- Maintain explicit return types on all public export functions.",
			].join("\n"),

			"skill-idiomatic-go.md": [
				"# Skill: Idiomatic Golang Architecture",
				"",
				"## Rules & Invariants",
				"- Always accept `context.Context` as the first argument in I/O and database methods.",
				"- Explicitly wrap errors using `fmt.Errorf(\"action: %w\", err)`.",
				"- Use structured logging via standard library `log/slog`.",
			].join("\n"),

			"skill-sqlc.md": [
				"# Skill: sqlc Type-Safe SQL Queries",
				"",
				"## Rules & Invariants",
				"- Author pure SQL queries with annotated query names `-- name: GetUser :one`.",
				"- Run `sqlc generate` to produce type-safe Go structs without ORM overhead.",
			].join("\n"),

			"skill-postgres-schema-design.md": [
				"# Skill: PostgreSQL Schema & Migration Strategy",
				"",
				"## Rules & Invariants",
				"- All foreign keys must include explicit index coverage.",
				"- Author migrations with deterministic down/rollback scripts.",
				"- Use `TIMESTAMPTZ` for all temporal columns.",
			].join("\n"),

			"skill-dynamodb-single-table.md": [
				"# Skill: DynamoDB Single-Table Design",
				"",
				"## Rules & Invariants",
				"- Model access patterns before defining Partition (`PK`) and Sort (`SK`) keys.",
				"- Use composite sort keys with delimiters (e.g. `USER#123#METADATA`).",
			].join("\n"),
		};
	}

	public static getTestingSkills(): Record<string, string> {
		return {
			"skill-executable-specs.md": [
				"# Skill: Living Executable Specifications",
				"",
				"## Objective",
				"Author executable TypeScript contracts (*.contract.ts) and component specifications (*.spec.ts, *.spec.tsx) that serve as living system documentation.",
				"",
				"## Rules & Invariants",
				"- Define type contracts using strict Zod schemas or TypeScript interfaces.",
				"- Do NOT write prose markdown specs when executable contracts can be written.",
				"- Keep spec files colocated or linked from feature manifests.",
			].join("\n"),

			"skill-ui-contracts.md": [
				"# Skill: UI Component Contracts & Spec Declarations",
				"",
				"## Objective",
				"Define component prop interfaces, visual state invariants, and layout contracts using functional TypeScript specs.",
				"",
				"## Rules & Invariants",
				"- Author component state trees using typed prop contracts.",
				"- Avoid ASCII block wireframes — declare visual layouts using structured JSX/TSX prop specs.",
			].join("\n"),

			"skill-tdd-assertions.md": [
				"# Skill: Test-Driven Development (TDD) Assertions",
				"",
				"## Objective & Discipline",
				"Author comprehensive, failing test suites BEFORE any implementation code begins (RED phase of TDD).",
				"",
				"## Mandatory Assertion Rules",
				"1. **Happy Path:** Assert specific expected return values, payload structures, and side effects.",
				"2. **Sad Path FIRST:** Error handling is more important than happy path. Test invalid input rejection using specific error matchers (e.g. `toThrow()`).",
				"3. **No Soft Assertions:** Never use `toBeTruthy()` or `toBeDefined()` alone — assert exact values.",
				"4. **Isolation:** Mock external dependencies (filesystem, network, DB) — tests must run deterministically in isolated sandbox.",
			].join("\n"),

			"skill-zero-noise-reporter.md": [
				"# Skill: Zero-Noise Test Diagnostic Reporting",
				"",
				"## Objective",
				"Format test failures into concise, actionable diagnostic cards to prevent log pollution.",
			].join("\n"),
		};
	}

	public static getPipelineStandards(): Record<string, string> {
		return {
			"summary.md": [
				"# Lean 2-Mode AI Workflow Standards",
				"",
				"> **Living Specs, Boundary-Isolated Tasks & Deterministic Gates**",
				"",
				"## Operating Modes",
				"- **@planner:** Reasoning agent for architectural planning, living spec slicing (*.contract.ts, *.spec.ts, *.spec.tsx), and task manifest creation (.harness/tasks/task-XXX.md). Never writes application code.",
				"- **@builder:** Stack-specific TDD executor (e.g. @web-builder, @mobile-builder, @backend-builder). Implements tasks test-first (RED -> GREEN -> REFACTOR) strictly within allowed file boundaries.",
				"",
				"## Execution Invariants",
				"1. **Atomic Tasks:** Max 2 implementation code files + 1 test file (max 3 total) per task.",
				"2. **Living Executable Specs:** Contract & spec definitions replace prose design documents.",
				"3. **Deterministic Verification Gate:** Run `harness verify <taskId>` to enforce boundaries, run tests, and trigger circuit breaker rollbacks on failures.",
			].join("\n"),
		};
	}

	public static getUIComponentRegistryStarter(): string {
		return [
			"export interface UIComponentRecord {",
			"  name: string;",
			'  category: "atom" | "molecule" | "organism" | "template";',
			"  location: string;",
			"  description: string;",
			"  propsInterface?: string;",
			"  subComponents?: string[];",
			"  reusableAcross: string[];",
			"}",
			"",
			"export const CustomComponentsRegistry: UIComponentRecord[] = [];",
		].join("\n");
	}

	public static getRolesJson(): string {
		return JSON.stringify(
			{
				planner: {
					role: "planner",
					allowedTools: ["*"],
					allowedCategories: ["technical", "pipeline", "business", "tasks"],
				},
				builder: {
					role: "builder",
					allowedTools: ["*"],
					allowedCategories: ["tasks"],
				},
			},
			null,
			2,
		);
	}
}
