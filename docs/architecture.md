# System Architecture & Monorepo Design

The **AI Workflow Harness** (`@harness/cli`, `@harness/adapters`, `@harness/core-rules`, `@harness/templates`) is a tool-agnostic AI development meta-framework built for high token efficiency, deterministic verification gates, and spec-driven execution across TypeScript and Go codebases.

---

## 1. Core Architecture Principles

1. **Token Efficiency & Context Separation:**
   - **2-Level Context Hierarchy:** Agents ingest lightweight summary files (`app-summary.md` $\le$ 250 lines) and load sub-specs (`features/<slug>/<cat>/spec.md`, `details/*.md`) only on demand.
   - **Single-Source Spec Database (`SpecDatabase`):** Powered by native `bun:sqlite` with Write-Ahead Logging (`WAL` mode) at `.harness/harness.db`. Features, topics, chunks, and tasks are queryable via SQL and automatically exported to Markdown (`.harness/spec/`).

2. **Single Responsibility Engine Design (SOLID):**
   - **`SecurityScanner`:** Scans `git diff` for hardcoded credentials (`.env`, `AWS_KEY`, `RSA_PRIVATE_KEY`) and audits dependency vulnerabilities (`bun audit`, `govulncheck`).
   - **`RepoAnalyzer`:** Performs zero-prompt brownfield stack scanning (`package.json`, `go.mod`) and module auto-discovery.
   - **`RiskEngine`:** Evaluates file modification counts and database schema mutations to score task risk (`LOW`, `MEDIUM`, `HIGH`) and suggest atomic sub-slicing (`task-XXXa`, `task-XXXb`).
   - **`AstValidator`:** Uses `ts-morph` to validate TypeScript AST types before commits.
   - **`CircuitBreaker`:** Tracks consecutive failure attempts and triggers automated git rollback after 3 strikes to protect LLM context windows.

3. **Long-Term Memory Integration (`ai-memory`):**
   - Optional long-term cross-agent memory backend powered by SQLite WAL + Git Markdown wiki (`ai-memory`). Enables persistent context retention across multi-agent sessions.

---

## 2. Monorepo Package Breakdown

```
ai-workflow-harness/
├── packages/
│   ├── cli/          # @harness/cli: Executable CLI binary (Commander, Zod, SQLite, Security, Risk)
│   ├── core-rules/   # @harness/core-rules: Modular planning standards & protocol rules
│   ├── templates/    # @harness/templates: Canonical agent configurations & stack standards
│   └── adapters/     # @harness/adapters: Tool transpilers for OpenCode, Antigravity, and Cursor
```
