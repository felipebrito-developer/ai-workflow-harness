# System Architecture & Monorepo Design

The **AI Workflow Harness** (`@harness/cli`, `@harness/adapters`, `@harness/core-rules`, `@harness/templates`) is a tool-agnostic AI development meta-framework built for high token efficiency, deterministic verification gates, and spec-driven execution across TypeScript and Go codebases.

---

## 1. Core Architecture Principles

1. **Token Efficiency & Living Executable Specs:**
   - **Macro Blueprint:** Agents ingest lightweight summary file (`.harness/spec/app-summary.md` $\le$ 150 lines) as static cached prefix.
   - **Typed Contracts & Living Specs:** TypeScript contracts (`*.contract.ts`) and behavioral test specs (`*.spec.ts`, `*.spec.tsx`) replace prose Markdown and ASCII diagrams. Git and the filesystem serve as the sole source of truth.

2. **Single Responsibility Engine Design (SOLID):**
   - **`SecurityScanner`:** Scans `git diff` for hardcoded credentials (`.env`, `AWS_KEY`, `RSA_PRIVATE_KEY`) and audits dependency vulnerabilities (`bun audit`, `govulncheck`).
   - **`RepoAnalyzer`:** Performs zero-prompt brownfield stack scanning (`package.json`, `go.mod`) and module auto-discovery.
   - **`RiskEngine`:** Evaluates file modification counts and database schema mutations to score task risk (`LOW`, `MEDIUM`, `HIGH`) and suggest atomic sub-slicing (`task-XXXa`, `task-XXXb`).
   - **`AstValidator`:** Uses `ts-morph` to validate TypeScript AST syntax and symbols before test verification.
   - **`CircuitBreaker`:** Tracks consecutive failure attempts and triggers automated git rollback after 3 strikes to protect LLM context windows.

---

## 2. Monorepo Package Breakdown

```
ai-workflow-harness/
├── packages/
│   ├── cli/          # @harness/cli: Executable CLI binary (Commander, Zod, Security, Risk, AST)
│   ├── core-rules/   # @harness/core-rules: Modular planning standards & protocol rules
│   ├── templates/    # @harness/templates: Canonical agent configurations, skills & stack standards
│   └── adapters/     # @harness/adapters: Tool transpilers for OpenCode, Antigravity, and Cursor
```
