# AI Workflow Harness (`ai-workflow-harness`)

A standardized, token-efficient, tool-agnostic AI development meta-framework for TypeScript and Go projects. Built for high context hygiene, deterministic verification gates, living executable specs, and a strict 3-mode Clean-Room development discipline.

---

## 📚 Detailed Documentation Index

For detailed architectural deep dives, command guides, and framework specifications, see:

- 🏛️ **[System Architecture & Design](file:///home/chu/AI-project/ai-workflow-harness/docs/HARNESS_ARCHITECTURE_HANDOVER.md)** — Core operating philosophy, 3-agent Dual-Role Separation, and living specs.
- ⚡ **[CLI Command Reference](file:///home/chu/AI-project/ai-workflow-harness/docs/cli-commands.md)** — Lean CLI entrypoint guide for `init` and `verify <taskId>`.
- 🔄 **[Planning & Execution Diagrams](file:///home/chu/AI-project/ai-workflow-harness/docs/diagrams/01-end-to-end-lifecycle.md)** — Lifecycle maps, JIT spec slicing, and verification gates.
- 🔒 **[Security & Verification Gates](file:///home/chu/AI-project/ai-workflow-harness/docs/security-and-gates.md)** — Boundary enforcement, ErrorSanitizer cards, AST validation, and 3-strike circuit breaker rollback.
- 🔌 **[Tool Adapters](file:///home/chu/AI-project/ai-workflow-harness/docs/adapters-and-tools.md)** — Adapters for OpenCode, Antigravity, and Cursor.

---

## 1. What Problems Does the Harness Solve?

When AI agents work on complex software projects without guardrails, they encounter three core failure modes:

1. **Context Loss & Pollution:** Unstructured chat sessions accumulate thousands of lines of raw code, causing token costs to explode and AI models to forget architectural invariants.
2. **Hallucinated Regressions & Test Tampering:** Models modify arbitrary files outside their assigned scope or secretly alter tests to pass broken implementations.
3. **Uncontrolled Retries:** Failing tests exhaust context windows as agents blindly retry without error compression or automatic rollbacks.

### Core Architecture Solutions:
- **Clean-Room Specification (Dual-Role Pattern):** Complete separation of concerns between the `@planner` (Discovery), the `@test-creator` (who writes cryptographically-locked Acceptance Criteria specs), and stack-specific `@builder` agents who implement the code but cannot touch the tests.
- **Living Executable Specs:** Type contracts (`*.contract.ts`) and functional/UI component specs (`*.spec.ts`, `*.spec.tsx`) replace static prose Markdown and ASCII block wireframes.
- **Atomic Task Boundary Enforcement:** Agents execute atomic tasks (`task-XXX.md`) constrained to $\le 2$ implementation code files + 1 test spec file (max 3 total).
- **Deterministic Verification Gate (`harness verify <taskId> [--allow-blocked]`):** Enforces file boundaries, executes AST syntax validation, mathematically verifies the test spec checksum (Anti-Tampering), runs the test suite, and sanitizes error logs.
- **3-Strike Circuit Breaker:** Automatically rolls back working tree edits after 3 consecutive verification failures to prevent working tree corruption.

---

## 2. Workspace Separation Principle

> [!IMPORTANT]
> **Framework vs Target Project Boundaries**
> This repository (`ai-workflow-harness`) is **only** the meta-framework tooling and CLI source code. It is used to install and configure the workflow onto downstream projects.
> The `harness init` command operates dynamically on the **Target Project Workspace** (`process.cwd()`). The `.harness/` folder and execution pipelines live exclusively in your target consumer projects, never within this framework repository itself.

---

## 3. System Overview & Monorepo Structure

```
ai-workflow-harness/
├── packages/
│   ├── cli/          # @harness/cli: Gatekeeper CLI engine (init, verify), AST validator, CircuitBreaker
│   ├── core-rules/   # @harness/core-rules: 2-mode planning pipeline & protocol guardrails
│   ├── templates/    # @harness/templates: Canonical agent configs, standards, and skill catalog
│   └── adapters/     # @harness/adapters: Transpiler adapters for OpenCode, Antigravity, and Cursor
├── docs/             # Comprehensive documentation modules & visual architecture diagrams
```

---

## 3. Quick Start & CLI Workflow

### Installation

```bash
# Clone & install dependencies
git clone https://github.com/felipebrito-developer/ai-workflow-harness.git
cd ai-workflow-harness
bun install

# Compile standalone binary
bun run --filter @harness/cli build
```

### Essential CLI Commands

```bash
# 1. Initialize harness in current workspace (scaffolds .harness/ and compiles tool adapters)
bun run --cwd packages/cli dev init

# 2. Verify task implementation against boundary rules & test suite
bun run --cwd packages/cli dev verify task-001
```

---

## 4. 3-Mode Agent Roles & Model Strategy

| Role | Mode | Purpose |
| :--- | :--- | :--- |
| **@planner** | Primary Architect | Architecture planning, living spec slicing, and task manifest creation. |
| **@test-creator** | Spec Author | Generates read-only `*.spec.ts` files that are cryptographically locked by the framework. |
| **@web-builder** | Subagent Executor | Executes React/Web frontend task manifests within declared file boundaries. |
| **@mobile-builder** | Subagent Executor | Executes React Native task manifests within declared file boundaries. |
| **@backend-builder** | Subagent Executor | Executes Node/Go/Python API & database implementation task manifests. |

---

## 5. Development & Testing

Run the full monorepo typecheck and test suite:

```bash
bun run typecheck
bun test
```