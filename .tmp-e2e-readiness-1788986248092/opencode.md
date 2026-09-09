# Project: e2e-test-app

> **Stack:** react-web, node, db-sql
> **Package Manager:** bun

## Operational Discipline
1. **2-Mode System Architecture (@planner & @builder):**
   - `@planner` handles architectural slicing, living spec generation, and task manifest updates.
   - `@builder` executes implementation strictly respecting file boundaries in `task-XXX.md`.

2. **Context Loading (Macro Blueprint & Living Specs):**
   - Read `.harness/spec/app-summary.md` for master application blueprint.
   - Inspect living specs (`*.contract.ts`, `*.spec.ts`, `*.spec.tsx`) for typed contracts and behavior.

3. **Task Execution Boundary:**
   - Read active task manifest at `.harness/tasks/task-XXX.md`.
   - Allowed file boundaries: Max 2 implementation code files + 1 test file (max 3 total).
   - Run `harness verify <taskId>` to validate before marking task done.

4. **Deterministic Commands:**
   - Test and Lint commands: Dynamically decided by the @planner based on the target stack.