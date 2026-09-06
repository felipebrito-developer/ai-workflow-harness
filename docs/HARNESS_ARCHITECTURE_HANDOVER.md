# AI Workflow Harness — Architectural Decisions & Specifications

## 1. Core Operating Philosophy
- **2-Agent Separation:** `@planner` (Discovery, JIT Spec Slicing) and `@builder` (Stack-specific TDD executor: `@web-builder`, `@mobile-builder`, `@backend-builder`).
- **Living Executable Specs:** Replace prose Markdown and ASCII diagrams with TypeScript contracts (`*.contract.ts`) and functional/UI component specs (`*.spec.ts`, `*.spec.tsx`).
- **Atomic Tasks:** Tasks in `.harness/tasks/task-XXX.md` must touch <= 2 implementation files + 1 test file.
- **Deterministic Gates:** `harness verify <taskId>` enforces file boundaries (`git diff`), runs tests with `ErrorSanitizer`, and triggers a 3-strike circuit breaker rollback.

## 2. CLI Implementation Scope (`packages/cli/src/`)
- `init.ts`: Setup wizard, model presets, scaffold `.harness/` and tool adapters.
- `verify.ts`: Boundary validation, test runner, ErrorSanitizer, circuit breaker.
- `index.ts`: Gatekeeper CLI entrypoint exposing ONLY `init` and `verify <taskId>` commands.