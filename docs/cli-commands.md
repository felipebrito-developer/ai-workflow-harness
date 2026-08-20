# CLI Command Reference

The `@harness/cli` binary (`harness`) provides a suite of commands for project scaffolding, brownfield discovery, security auditing, task execution, and agent management.

---

## 1. Project Scaffolding & Setup

### `harness init`
Scaffolds directory structure, `.gitignore`, stack standards, tool adapters, and OpenRouter agent configs.
```bash
harness init
```
- **Auto-Discovery:** Automatically invokes `harness analyze` when an existing codebase (`package.json` / `go.mod`) is detected.
- **Pipeline Prompt:** Selects default planning strategy (`agile-fasttrack`, `full-waterfall`, `hotfix`).

### `harness analyze`
Analyzes existing brownfield repositories, detects stacks, frameworks, and modules, and initializes SQLite spec database entries.
```bash
harness analyze
```

---

## 2. Security & Compliance

### `harness audit`
Runs secret scanner and dependency vulnerability audits.
```bash
harness audit
```
- Scans `git diff` for hardcoded secrets (`.env`, `AWS_KEY`, `RSA_PRIVATE_KEY`).
- Executes `bun audit` and `govulncheck ./...`.
- Returns exit code 1 on critical security findings.

---

## 3. Agile Task Lifecycle

### `harness feature <name>`
Creates a new feature spec in SQLite database and generates 1-pass micro-task manifests (`.harness/tasks/task-XXX.md`).
```bash
harness feature "User Auth" --files "src/auth.ts,tests/auth.test.ts"
```

### `harness start <taskId>`
Creates isolated git branch (`task/<id>-<slug>`) and updates task status to `IN_PROGRESS`.
```bash
harness start task-001
```

### `harness preflight <taskId>`
Executes pre-commit AST type validation, clean working tree check, and secret leak scanner.
```bash
harness preflight task-001
```

### `harness verify <taskId>`
Runs verification commands (`bun test`, `bun run lint`), checks file boundaries, and triggers circuit breaker rollback if tests fail 3 consecutive times.
```bash
harness verify task-001
```

### `harness checkpoint <taskId>`
Stashes uncommitted diffs to branch `stash/<taskId>-checkpoint` for mid-flight requirement changes under the Delta Protocol.
```bash
harness checkpoint task-001
```

### `harness close <taskId>`
Validates boundary compliance, marks task status as `DONE`, exports SQLite spec DB to Markdown (`.harness/spec/`), and records receipt in `.harness/memory/spawn-log/`.
```bash
harness close task-001
```

---

## 4. Custom Agents & MCP Management

### `harness agent create` / `harness agent list`
Creates custom agent specifications (`.harness/agents/<name>.json`) and lists configured agents.
```bash
harness agent create
harness agent list
```

### `harness mcp add` / `harness mcp list`
Configures Model Context Protocol (MCP) servers (`.harness/mcp/<name>.json`) for filesystem, Linear, PostgreSQL, or custom tools.
```bash
harness mcp add
harness mcp list
```
