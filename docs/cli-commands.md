# CLI Command Reference

The `@harness/cli` binary (`harness`) provides a lean 2-command interface for project scaffolding and task verification.

---

## 1. Project Scaffolding & Setup

### `harness init`
Scaffolds directory structure, `.gitignore`, stack standards, tool adapters, and agent configurations directly into the **Target Project Workspace** (`process.cwd()`).
```bash
harness init
```
- **Target Separation:** Never runs inside the `ai-workflow-harness` framework repository itself. It strictly scaffolds the downstream consumer project.
- **Auto-Discovery:** Automatically inspects codebase structure, package manager (`bun`/`pnpm`/`npm`/`cargo`/`go`), and default commands.
- **Model Presets:** Configures prompt caching and model routing for `@planner` and `@builder` agents.

---

## 2. Verification Gate

### `harness verify <taskId> [--allow-blocked]`
Runs verification test suite, checks file boundaries, sanitizes failure cards, validates cryptographic spec locks, and enforces the deterministic 3-strike circuit breaker.
```bash
harness verify task-001
```
- **Boundary Enforcement:** Validates modified files against `allowedFiles` in `.harness/tasks/<taskId>.md` (max 2 code files + 1 test file).
- **Anti-Tampering Check:** Computes the SHA-256 hash of the modified test spec to ensure the builder agent has not tampered with the cryptographically locked Acceptance Criteria.
- **Partial Verification (`--allow-blocked`):** If a builder encounters a fundamental block in the specification, they may add a `blockers` list to the manifest. Running with `--allow-blocked` skips those tests and transitions the task to `NEEDS_PLANNER_REVIEW` instead of `DONE`.
- **Circuit Breaker:** Automatically rolls back working tree changes if verification fails 3 consecutive times.
