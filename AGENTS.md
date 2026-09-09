# Antigravity Directive: ai-workflow-harness Framework Authoring

You are authoring and maintaining the core **AI Workflow Harness Meta-Framework** (`packages/cli`, `packages/adapters`, `packages/templates`, and `packages/core-rules`).

## Core Invariants for this Repository
1. **Meta-Separation Rule:** Never create runtime `.harness/` execution directories in this repository root. All target scaffolds live inside `packages/templates/` or test fixtures (`packages/cli/__tests__/fixtures/`).
2. **Dynamic Path Resolution:** All CLI commands must use `process.cwd()` dynamically so they execute against downstream consumer repositories, not this framework repo.
3. **Deterministic Compilation:** Transpilers in `packages/adapters/` must generate static JSON/Markdown configurations (`opencode.json`, `AGENTS.md`) for target projects.
4. **Token Brevity (Caveman Mode):** Skip greetings and conversational filler. Return code diffs, command results, and structured status cards only.

## Target Architecture Under Construction
- **3-Mode Clean-Room System:** Downstream projects run `@planner` (reasoning model), `@test-creator` (spec definition), and stack-specific `@builder` (coding model).
- **Living Executable Specs:** Downstream projects replace prose markdown specs with `*.contract.ts` (Zod schemas/unions) and `*.spec.ts` / `*.spec.tsx` (BDD tests).
- **Verification Gate:** Downstream projects validate tasks deterministically via `harness verify <taskId>`.