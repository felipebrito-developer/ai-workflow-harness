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

---

## 3. Clean-Room Specification (Dual-Role Pattern)

The AI Workflow Harness uses a deterministic **Clean-Room Specification Pattern** to eliminate the primary risk in autonomous workflows: test tampering and false positives. This establishes a strict governance boundary between requirement definition and implementation.

**1. Dual-Tier Test Scopes**
- **Tier 1 (Acceptance Specs):** `*.spec.ts` files are owned exclusively by `@test-creator`. They serve as the read-only living spec mapped 1:1 to business acceptance criteria.
- **Tier 2 (Unit Tests):** `*.unit.ts` files are owned by the `@builder` for internal mechanics and refactoring safety. `@builder` has write access here.

**2. Cryptographic Spec Locking (Anti-Tampering)**
When `@test-creator` produces a `*.spec.ts` file, the framework locks it via a SHA-256 hash stored in the task manifest (`specChecksum`). During `harness verify <taskId>`, the CLI mathematically guarantees that the builder has not altered any assertions to artificially pass the test.

**3. Mutation Sanity Check (Negative Proof)**
Before code is written, a preflight check ensures the acceptance tests fail on empty implementations. Tautological tests that pass before any code is written are rejected immediately.

**4. Delta Blocker Exemption (Conflict Protocol)**
If a `@builder` encounters a fundamental flaw in the spec or a blocked dependency, they may not modify the test. Instead, they annotate the task manifest with `blockers` and run `harness verify --allow-blocked`. The CLI skips the blocked tests, enforces the cryptographic hash on the unmodified spec, and shifts the status to `NEEDS_PLANNER_REVIEW` for triage.

For a visual flowchart of this lifecycle, see [Clean-Room Specification Lifecycle](diagrams/05-clean-room-specification.md).
