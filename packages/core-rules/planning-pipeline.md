# 2-Tier XP Planning & Execution Pipeline

The AI Workflow Harness operates on a strict **2-Mode System Architecture**: `@planner` (Discovery, JIT Spec Slicing) and stack-specific `@builder` agents (`@web-builder`, `@mobile-builder`, `@backend-builder`).

No application source code may be written while acting as `@planner`.

---

## Tier 1: `@planner` Architecture & Living Specs
- **Goal:** Architecture discovery, feature modeling, and JIT task slicing.
- **Living Executable Specs:** Executable TypeScript contracts (`*.contract.ts`) and functional/UI component specs (`*.spec.ts`, `*.spec.tsx`) replace static prose Markdown and ASCII block wireframes.
- **Master Blueprint:** Summary specs maintained in `.harness/spec/app-summary.md` (<= 150 lines) and SQLite database `.harness/harness.db`.
- **Output:** Atomic task manifests created in `.harness/tasks/task-XXX.md`.

## Tier 2: `@builder` Task Execution & Boundary Invariants
- **Goal:** Strict TDD execution of declared task manifests (`task-XXX.md`).
- **Atomic Task Invariant:** A standard task manifest must touch **<= 2 implementation code files + 1 test file** (max 3 total).
- **Execution Guardrails:** `@builder` must strictly restrict code modifications to `allowedFiles` declared in `task-XXX.md`.
- **Verification Gate:** Preflight verification executed via `harness verify <taskId>` (enforces file boundaries, runs test suite, applies ErrorSanitizer, and manages 3-strike Circuit Breaker auto-rollback).