# Git Governance & Commit Authority

## 1. Task Execution & Isolation
All implementation work must occur on isolated task branches following the format: `task/<id>-<slug>`. Direct unmonitored commits to `main`, `master`, or `dev` are forbidden.

## 2. The Verification Gate
Before a task is marked `DONE` and merged, `harness verify <taskId>` must execute and confirm:
1. **File Boundary Compliance:** No files outside `task-XXX.md` `allowedFiles` were modified.
2. **AST Validation:** TypeScript syntax and symbol parsing pass cleanly without pre-emit diagnostics.
3. **Deterministic Test Execution:** All verification commands exit with code 0.
4. **Circuit Breaker Integrity:** The 3-attempt failure counter has not tripped.

## 3. Operational Discipline
- `@planner` handles architectural slicing, living spec generation, and task manifest updates.
- `@builder` executes TDD tasks strictly within declared file boundaries.
