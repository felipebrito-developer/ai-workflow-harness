# Git Governance & Commit Authority

## 1. Sole Commit Authority
To maintain repository integrity, AI subagents (`@test-creator`, `<stack>-specialist`, `@test-runner`) are **strictly prohibited** from executing Git commits. 

Only the `@tech-lead` acting through the `harness close` command possesses the authority to commit code to the repository.

## 2. The Verification Gate
Before a commit is allowed, the `@tech-lead` must verify:
1. **Boundary Compliance:** No files outside the `task-XXX.md` allowed boundaries were modified.
2. **Exit-0 Execution:** All linters, typecheckers, and test runners exit with code 0.
3. **Negative-Proof AC Audit:** Every Gherkin Acceptance Criterion must map to a specific passing test assertion and implementation line.

## 3. Task Isolation
All work must occur on isolated task branches following the format: `task/<id>-<slug>`. Direct commits to `main`, `master`, or `dev` are forbidden.
