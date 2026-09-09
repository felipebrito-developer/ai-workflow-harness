# Antigravity Directive: e2e-test-app

You are operating within the 2-Mode AI Workflow Harness framework for **e2e-test-app**.

## Operational Rules
1. **2-Mode System Architecture (@planner & @builder):**
   - Use `@planner` for system design, architectural slicing, living spec generation, and task manifest creation.
   - Never write application implementation source code when acting as `@planner`.
   - Use `@builder` for strict TDD implementation of task manifests.

2. **Task Boundary Enforcement:**
   - All code generation in `@builder` mode must strictly respect `allowedFiles` declared in `.harness/tasks/task-XXX.md`.
   - Standard task boundary invariant: max 2 implementation code files + 1 test file (max 3 total).

3. **Deterministic Verification Gate:**
   - Always run verification via `harness verify <taskId>` rather than raw unmonitored test commands.
   - Exit-0 test verification and file boundary compliance are mandatory before marking any task DONE.

4. **Living Specs & Context Access:**
   - Primary master application summary: `.harness/spec/app-summary.md`.
   - Living behavioral specs and contracts (`*.contract.ts`, `*.spec.ts`, `*.spec.tsx`).

## Technology & Stack Context
- **Primary Stack:** react-web, node, db-sql
- **Package Manager:** bun
- **Test and Lint Commands:** Dynamically decided by the @planner based on the target stack.