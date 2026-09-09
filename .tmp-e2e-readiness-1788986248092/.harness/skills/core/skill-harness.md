# Skill: AI Workflow Harness Meta-Framework

## Objective
Operate the 2-mode development harness (@planner and stack-specific @builder), executable specs, boundary enforcement, and circuit breaker gates.

## 1. Core Architecture Invariants
- **2-Mode Operating System:** `@planner` for architectural planning, living spec slicing, and task manifest creation; stack-specific `@builder` for strict TDD task execution.
- **Living Executable Specs:** Replace prose Markdown and ASCII diagrams with TypeScript contracts (`*.contract.ts`) and functional/UI component specs (`*.spec.ts`, `*.spec.tsx`).
- **Atomic Tasks:** Tasks in `.harness/tasks/task-XXX.md` must touch <= 2 implementation code files + 1 test file (max 3 total).
- **Deterministic Verification Gate:** Require test exit code 0 (`harness verify <taskId>`) before setting task status to `DONE`.
- **3-Strike Circuit Breaker:** 3 consecutive test/verification failures trigger automated Git rollback to preflight state.

## 2. CLI Engines & Workflow Commands
- `harness init` — Scaffold framework tree, agent configurations, tool adapters, and skills.
- `harness verify <task-id>` — Execute test/lint suite, sanitize error cards, enforce file boundaries, and update status.