export class TemplateScaffolder {
	public static getCoreSkills(): Record<string, string> {
		return {
			"skill-harness.md":
				"# Skill: AI Workflow Harness Framework\n\n## Objective\nOperate the 2-tier XP workflow, SQLite spec engine, and security gates.\n\n## Core Rules\n- Tier 1: `harness init` / `harness analyze` for app vision & zero-prompt brownfield auto-discovery.\n- Tier 2: `harness feature <name>` for 1-pass Agile feature generation & risk evaluation.\n- Pre-Commit Security: `harness audit` & `harness preflight` block uncommitted credentials or `.env` files.\n- File Boundaries: Restrict changes to `allowedFiles` (<=2 files per task). Require test exit code 0 on `harness verify`.\n",
			"skill-caveman.md":
				"# Skill: Caveman Mode\n\n## Objective\nDrastically conserve context tokens by eliminating conversational pleasantries.\n\n## Rules\n- Output dense code diffs and bullet points only.\n- Skip greetings, confirmations, and polite transitions.\n- Maximize signal-to-noise ratio in every reply.\n",
			"skill-context-caching.md":
				"# Skill: 2-Level Context Caching\n\n## Objective\nMinimize prompt cost across multi-turn agent sessions.\n\n## Rules\n1. Always load `.harness/spec/app-summary.md` as the root anchor.\n2. Load detailed feature sub-specs (`business/`, `ui/`, `technical/`) only when actively implementing that specific feature.\n3. Never load unneeded source files into the context window.\n",
			"skill-wayfinder-harness.md":
				"# Skill: Wayfinder Planning (Harness-Adapted)\n\n## Objective\nChart large planning efforts by creating discovery Maps at `.harness/memory/discovery/<feature>-map.md`, then resolving decision tickets one at a time until the way is clear.\n\n## Core Rules\n- Plan, don't do: produce decisions and specifications, not code.\n- Map structure: Destination, Notes, Decisions So Far, Fog of War, Out of Scope.\n- Ticket types map to harness tasks: research (no boundaries), spike (relaxed), grilling (HITL Q&A), task (standard ≤2 files).\n- Use `depends_on` arrays to model the dependency frontier.\n- Fog of War: only ticket what you can state precisely. Leave the rest as fog until resolved tickets clear it.\n",
		};
	}

	public static getStackSkills(): Record<string, string> {
		return {
			"skill-tailwind-shadcn.md":
				"# Skill: Tailwind & Component Architecture\n\n## Rules\n- Use utility-first Tailwind classes adhering to design system tokens.\n- Maintain accessibility attributes (`aria-*`, `role`, focus states).\n- Keep presentation logic separate from data hooks.\n",
			"skill-tanstack-query.md":
				"# Skill: TanStack Query Best Practices\n\n## Rules\n- Declare standardized query keys using array tuples `['resource', id]`.\n- Implement optimistic updates for mutating actions with automatic rollback.\n- Centralize API fetchers in dedicated service modules.\n",
			"skill-expo-router.md":
				"# Skill: Expo Router & React Native\n\n## Rules\n- Follow file-based routing conventions in `app/`.\n- Utilize `react-native-reanimated` for 60fps UI transitions.\n- Ensure safe area insets are respected across iOS and Android.\n",
			"skill-typescript-strict.md":
				"# Skill: Strict TypeScript & Zod\n\n## Rules\n- Enforce `strict: true` with zero usage of `any` (use `unknown` + type guards).\n- Derive runtime types from Zod schemas using `z.infer<typeof Schema>`.\n- Use discriminated unions for distinct application states.\n",
			"skill-idiomatic-go.md":
				'# Skill: Idiomatic Golang\n\n## Rules\n- Always accept `context.Context` as the first argument in I/O methods.\n- Explicitly wrap errors using `fmt.Errorf("action: %w", err)`.\n- Use structured logging via standard library `log/slog`.\n',
			"skill-sqlc.md":
				"# Skill: sqlc Type-Safe SQL\n\n## Rules\n- Author pure SQL queries with annotated query names `-- name: GetUser :one`.\n- Run `sqlc generate` to produce type-safe Go structs without ORM overhead.\n",
			"skill-postgres-schema-design.md":
				"# Skill: PostgreSQL Schema & Migration Strategy\n\n## Rules\n- All foreign keys must include explicit index coverage.\n- Author migrations with deterministic down/rollback scripts.\n- Use `TIMESTAMPTZ` for all temporal columns.\n",
			"skill-dynamodb-single-table.md":
				"# Skill: DynamoDB Single-Table Design\n\n## Rules\n- Model access patterns before defining Partition (`PK`) and Sort (`SK`) keys.\n- Use composite sort keys with delimiters (e.g., `USER#123#METADATA`).\n",
		};
	}

	public static getTestingSkills(): Record<string, string> {
		return {
			"skill-tdd-assertions.md":
				"# Skill: Test-Driven Development (TDD)\n\n## Rules\n- Author failing tests first before modifying implementation code.\n- Ensure tests assert specific error messages, not just truthiness.\n",
			"skill-zero-noise-reporter.md":
				"# Skill: Zero-Noise Test Diagnostic Reporting\n\n## Rules\n- Output concise failure cards containing only: Suite Name, Target File, Line Number, and Expected vs Actual values.\n- Do not output successful assertions or hundreds of irrelevant stack trace lines.\n",
		};
	}

	public static getPipelineStandards(): Record<string, string> {
		return {
			"phase-1-discovery.md":
				"# Phase 1: Problem Discovery & Baseline Audit\n\n## 1. Interactive Q&A Protocol\nUse Strict 3+2 rule: 3 recommended options, 4) Other, 5) Explain it better.\n\n## 2. Artifacts\nSave interview transcripts to `.harness/memory/discovery/<feature>.md`.\n",
			"phase-2-strategy.md":
				"# Phase 2: Functional Scope & Workflow Strategy\n\n## 1. Functional Scope\nDefine epics, user journeys, and validate AI execution topology (Orchestrated, Solo, Vibe-Assist).\n",
			"phase-3-design.md":
				"# Phase 3: Visualization & Design Architecture\n\n## 1. Component Registry\nDefine reusable components in `.harness/UI/custom-components-registry.ts` and details in `.harness/UI/details/<name>/`.\n",
			"phase-4-architecture.md":
				"# Phase 4: Technical Architecture & Contracts\n\n## 1. Contracts & ADRs\nDefine API contracts, DB schemas, and technical specs (≤500 lines) in `.harness/spec/features/<feature>/technical/spec.md`.\n",
			"phase-5-slicing.md":
				"# Phase 5: User Story Slicing & Task Backlog\n\n## 1. Task Invariants\nSlice specs into atomic manifests in `.harness/tasks/task-XXX.md` touching ≤2 files each.\n",
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
			"",
		].join("\n");
	}
}
