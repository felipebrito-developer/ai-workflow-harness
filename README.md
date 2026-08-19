# AI Workflow Harness (`ai-workflow-harness`)

A standardized, token-efficient, and tool-agnostic AI development framework designed to enforce context hygiene, deterministic verification gates, and spec-driven execution across web, mobile, backend, and game projects.

---

## 1. System Overview & Core Philosophy

The Harness separates **Planning (Phases 1–5)** from **Execution (TDD / Gates)** to prevent role overload, context amnesia, and hallucinated regressions.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PLANNING ENGINE (Phases 1–5)                       │
│  Phase 1: Discovery  ──► Phase 2: Functional ──► Phase 3: Visualization     │
│  (Problem / Personas)    (Scope / AI Mode)       (ASCII Wireframes / State) │
│                                                                │            │
│  Phase 5: Task Slicing ◄── Phase 4: Technical Specs ◄──────────┘            │
│  (task-XXX.md Bounds)      (Schemas / Contracts)                            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXECUTION ENGINE (TDD & Gates)                      │
│  harness start       ──► harness preflight  ──► TDD Impl (Variant A / B)    │
│  (Branch Isolation)      (AST & Echo Gate)      (Boundary Locked Edits)     │
│                                                                │            │
│  harness close       ◄── harness verify     ◄──────────────────┘            │
│  (Log Receipt / Done)    (Circuit Breaker)                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Non-Negotiable Invariants
1. **Tool Agnostic:** Native transpilation adapters for **OpenCode**, **Antigravity**, and **Cursor**.
2. **2-Level Cache Hierarchy:** Agents ingest summary indexes (≤100–250 lines) and drill down into sub-specs or detailed standards **only on demand**.
3. **Deterministic Safety Gates:** Automated AST symbol checks, clean working tree audits, and unbypassable `git diff` file boundary enforcement.
4. **Resilient TDD & Circuit Breakers:** Test stack traces are compressed to token-efficient failure cards; 3 consecutive verification failures trigger an automated git rollback to protect context windows.
5. **The Delta Protocol:** Structured 3-tier triage (Patch, Delta, Pivot) with auto-checkpoint stashing for mid-flight requirements.

---

## 2. Monorepo Package Structure

The harness engine is structured as a TypeScript/Bun monorepo with 4 core packages:

```
ai-workflow-harness/
├── packages/
│   ├── cli/             # @harness/cli: The binary tool (Commander, Zod, Git/AST engines)
│   ├── core-rules/      # @harness/core-rules: Modular 5-phase pipeline standards & guardrails
│   ├── templates/       # @harness/templates: Canonical agent configs, skills, and UI registries
│   └── adapters/        # @harness/adapters: Transpilers for OpenCode, Antigravity, and Cursor
```

---

## 3. How AI Tools Handle the Harness

### 🟢 OpenCode Integration Flow

When you run `opencode` inside a project initialized with `harness init`, OpenCode automatically ingests the transpiled adapter configs:

```
target-project/
├── opencode.json          ← Instruction globs, provider caching, agent permission matrix
├── opencode.md            ← Project stack pin & context drill-down rules
└── .opencode/agents/      ← Scoped subagent personas (test-runner, code-reviewer, etc.)
```

#### How OpenCode Operates:
1. **Instruction Globs & Static Prefix:** OpenCode automatically indexes `.harness/spec/app-summary.md` and `.harness/standards/**/summary.md` as its cached system instructions.
2. **Architect Role Scoping:** The primary `@architect` agent is instructed to drill down into `features/<feature>/` specs *only* when actively working on that feature.
3. **Subagent Delegation Matrix:**
   * In `orchestrated` mode, the Architect cannot directly modify code outside tasks; it delegates testing to `@test-runner` (read-only bash) and reviews to `@code-reviewer`.
   * Subagents inherit strict `external_directory: deny` rules to prevent sibling project bleeding.

---

### 🔵 Antigravity Integration Flow

When using Antigravity, the framework compiles an `antigravity.json` configuration connecting MCP servers and terminal executor directives:

```
target-project/
└── antigravity.json       ← MCP mappings (Filesystem, Linear) & boundary rules
```

#### How Antigravity Operates:
1. **MCP Server Integration:** Automatically registers filesystem tools and Linear MCP servers (if Linear task backend is selected).
2. **Context Anchoring:** Feeds the top-level application index and standard summaries into the agent's context anchor pool.
3. **Boundary Directives:** Injects system constraints enforcing that the terminal agent parses the active `task-XXX.md` file boundary before running code generation or bash commands.
4. **Automated Terminal Execution:** Executes `harness preflight`, test runners, and `harness verify` directly via MCP terminal calls.

---

### 🟠 Cursor Integration Flow

When using Cursor, the framework compiles a `.cursorrules` file:

```
target-project/
└── .cursorrules           ← Context rules and boundary guardrails
```

#### How Cursor Operates:
1. **Context Anchoring:** Instructs Cursor to strictly adhere to the 5-phase planning pipeline.
2. **Boundary Restrictions:** Forces Cursor to only modify files listed in the active `task-XXX.md` manifest allowed boundaries.

---

## 4. Directory Structure (`<target-project>/.harness/`)

```
<project-root>/
├── .harness/
│   ├── harness.config.json       ← Active project config, stack, & tool binds
│   ├── spec/                     ← Single Source of Truth for Planning
│   │   ├── app-summary.md        ← Master index: architecture & feature map (≤250 lines)
│   │   └── features/<feature>/   ← Sliced feature specs
│   │       ├── README.md         ← Feature index & decisions (≤250 lines)
│   │       ├── business/spec.md  ← P1 & P2: Problem statement, personas, user journeys
│   │       ├── ui/spec.md        ← P3: ASCII wireframes, UI state tables, Mermaid flows
│   │       └── technical/spec.md ← P4: Contracts, data models, schemas (≤500 lines)
│   ├── tasks/                    ← Canonical Micro-Manifests (task-XXX.md)
│   ├── standards/                ← Hierarchical Stack Coding Rules
│   │   └── <stack-name>/
│   │       ├── summary.md        ← Level 1 Index: Invariants & canonical commands (≤100 lines)
│   │       └── details/*.md      ← Level 2 Deep Dives: Loaded on-demand only
│   └── memory/                   ← Gitignored Local Runtime Memory
│       ├── discovery/            ← Raw Q&A interview transcripts per feature
│       ├── workday-log/          ← Daily session narratives
│       ├── spawn-log/            ← Subagent task execution receipts & circuit breaker logs
│       └── attempts/             ← Ephemeral circuit breaker failure counters
│
├── .git/hooks/pre-commit         ← Native hook blocking commits with boundary violations
├── opencode.json                 ← (Generated if OpenCode adapter is active)
├── opencode.md                   ← (Generated if OpenCode adapter is active)
├── antigravity.json              ← (Generated if Antigravity adapter is active)
└── .cursorrules                  ← (Generated if Cursor adapter is active)
```

## 5. The 5-Phase Planning Lifecycle

Before an agent or developer writes implementation code, the feature progresses through 5 gated phases:

| Phase | Output Artifact | Scope & Responsibility |
| :--- | :--- | :--- |
| **Phase 1: Discovery** | `.harness/memory/discovery/<feat>.md` | Interviews user, defines personas, audits existing codebase baseline. |
| **Phase 2: Functional** | `spec/features/<feat>/business/spec.md` | Maps user journeys, defines epics/milestones, sets AI mode (`solo`, `orchestrated`, `vibe`). |
| **Phase 3: Visualization** | `spec/features/<feat>/ui/spec.md` | Creates ASCII block wireframes, UI state contract tables, and Mermaid route diagrams. |
| **Phase 4: Tech Specs** | `spec/features/<feat>/technical/spec.md` | Defines schemas, API contracts, error modes, and boundary constraints (≤500 lines). |
| **Phase 5: Task Slicing** | `.harness/tasks/task-XXX.md` | Slices specs into atomic micro-manifests (≤2 files per task). |

---

## 6. OpenRouter Model Allocation Engine (4 Presets)

The harness configures per-role model allocation in `harness.config.json` and agent definitions to balance reasoning power against token costs:

| Agent Role | Complex — Best | Complex — Efficient | Small — Best | Small — Efficient |
| :--- | :--- | :--- | :--- | :--- |
| **@workflow-orchestrator** | `anthropic/claude-3.5-sonnet` | `z-ai/glm-5.2` | `anthropic/claude-3.5-sonnet` | `z-ai/glm-5.2` |
| **@architect-agent** | `deepseek/deepseek-r1` | `deepseek/deepseek-r1` | `anthropic/claude-3.5-sonnet` | `z-ai/glm-5.2` |
| **@po-agent** | `z-ai/glm-5.2` | `z-ai/glm-5.2` | `z-ai/glm-5.2` | `z-ai/glm-5.2` |
| **@tech-lead** | `anthropic/claude-3.5-sonnet` | `z-ai/glm-5.2` | `anthropic/claude-3.5-sonnet` | `qwen/qwen-2.5-coder-32b-instruct` |
| **@designer-lead / UI** | `anthropic/claude-3.5-sonnet` | `z-ai/glm-5.2` | `anthropic/claude-3.5-sonnet` | `z-ai/glm-5.2` |
| **<stack>-specialist** | `anthropic/claude-3.5-sonnet` | `qwen/qwen-2.5-coder-32b-instruct` | `anthropic/claude-3.5-sonnet` | `qwen/qwen-2.5-coder-32b-instruct` |
| **@db-engineer** | `deepseek/deepseek-r1` | `deepseek/deepseek-r1` | `anthropic/claude-3.5-sonnet` | `qwen/qwen-2.5-coder-32b-instruct` |
| **@test-creator** | `anthropic/claude-3.5-sonnet` | `qwen/qwen-2.5-coder-32b-instruct` | `anthropic/claude-3.5-sonnet` | `qwen/qwen-2.5-coder-32b-instruct` |
| **@test-runner** | `google/gemini-2.5-flash` | `google/gemini-2.5-flash` | `google/gemini-2.5-flash` | `google/gemini-2.5-flash` |

---

## 7. Micro-Task Manifest Format (`.harness/tasks/task-XXX.md`)

Each execution task is declared as a self-contained, boundary-enforced manifest:

```markdown
---
id: "task-001" # Or Linear ID (e.g. FEL-101)
title: "Implement SQLite Cache Provider"
status: "TODO" # TODO | IN_PROGRESS | BLOCKED | DONE
mode: "VARIANT_A" # VARIANT_A (Full TDD) | VARIANT_B (Embedded)
feature_ref: "features/offline-cache/technical/spec.md"
depends_on: []
---

# Task: Implement SQLite Cache Provider

## 1. Allowed File Boundaries
> **Constraint:** Agent may ONLY modify or create files listed below (Max 2):
- `src/storage/sqlite-provider.ts`
- `src/storage/__tests__/sqlite-provider.test.ts`

## 2. Acceptance Criteria
- [ ] Implements `ICacheProvider` interface
- [ ] Handles JSON serialization & deserialization
- [ ] Handles database locked error states gracefully

## 3. Verification Commands
\`\`\`bash
bun biome check src/storage/sqlite-provider.ts
bun test src/storage/__tests__/sqlite-provider.test.ts
\`\`\`
```

---

## 8. CLI Command Reference

The `harness` CLI orchestrates the entire operational lifecycle:

```bash
# 1. Initialize harness in the target repository
harness init

# 2. Start a task (switches git branch to 'task/<id>-<slug>' & marks IN_PROGRESS)
harness start <taskId>

# 3. Run preflight gate (validates clean tree, checks AST types, outputs Agent Echo)
harness preflight <taskId>

# 4. Verify implementation (checks boundary diffs & runs test suite with circuit breaker)
harness verify <taskId>

# 5. Checkpoint active task (auto-stashes diffs on Delta Protocol scope escalation)
harness checkpoint <taskId>

# 6. Close task (validates boundaries, marks DONE, and writes spawn-log receipt)
harness close <taskId>
```

---

## 9. The Delta Protocol (Scope Escalation)

When an agent discovers missing requirements, unhandled edge cases, or schema changes mid-task:

```
                    ┌───────────────────────────────┐
                    │ Scope Discovered Mid-Flight   │
                    └───────────────┬───────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
  [ Tier 1: Patch ]          [ Tier 2: Delta ]          [ Tier 3: Pivot ]
  - In-boundary tweak        - New files / schemas      - Flawed architecture
  - Append AC to task        - `harness checkpoint`     - Halt task & branch
  - Continue TDD             - Write `GAP-XXX.md`       - Return to Phase 1 Grill
                             - Slice `task-XXX.1.md`
```

---

## 10. Installation & Monorepo Build

### Prerequisites
- [Bun](https://bun.sh) (v1.1+ or newer)
- Git (v2.30+)

### Build & Link CLI Globally

```bash
# 1. Clone & install dependencies
git clone https://github.com/felipebrito-developer/ai-workflow-harness.git
cd ai-workflow-harness
bun install

# 2. Compile standalone binary
bun run build

# 3. Symlink globally to your path
sudo ln -sf $(pwd)/packages/cli/bin/harness /usr/local/bin/harness

# 4. Verify installation
harness --help
```