# AI Workflow Harness — Architectural Handover & Implementation Roadmap

## 1. Directory Scaffolding Contract (Target Project Layout)

```
.harness/
├── harness.config.json
├── .gitignore                          # Ignores temp/ and memory/attempts/
├── UI/
│   ├── custom-components-registry.ts   # UIComponentRecord index
│   └── details/<component>/
│       ├── component.md
│       ├── wireframe-ascii.md
│       └── route-flow-mermaid.md
├── temp/                               # Ephemeral scratchpad (gitignored)
│   ├── scripts/
│   ├── assets/
│   └── artifacts/
├── spec/
│   ├── app-summary.md                  # Master index (≤250 lines)
│   └── features/<feature>/
│       ├── business/spec.md
│       ├── ui/spec.md
│       └── technical/spec.md           # Schemas & ADRs (≤500 lines)
├── standards/pipeline/
│   ├── phase-1-discovery.md            # Strict 3+2 Q&A interview format
│   ├── phase-2-strategy.md             # Functional scope & topology matrix
│   ├── phase-3-design.md               # UI specs & wireframe requirements
│   ├── phase-4-architecture.md         # Contracts & ADR requirements
│   └── phase-5-slicing.md              # Slicing invariants (≤2 files, Gherkin ACs)
├── skills/
│   ├── core/ (caveman, context-caching)
│   ├── stack/ (tailwind, tanstack, expo, ts-strict, go, sqlc, postgres, dynamodb)
│   └── testing/ (tdd-assertions, zero-noise-reporter)
├── memory/
│   ├── discovery/
│   ├── workday-log/
│   ├── spawn-log/
│   └── attempts/
└── agents/                             # Agent JSON configurations
```

---

## 2. OpenRouter Model Allocation Matrix

| Role | Complex — Best | Complex — Efficient | Small — Best | Small — Efficient |
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

## 3. Subagent Communication Contracts

### A. Specialist Implementation Summary Format
```markdown
### [Stack Implementation Report]
**Task:** <TASK-ID>
**Status:** [COMPLETED | BLOCKED]
**Files Modified:**
- `src/path/file1.ts` (Lines modified: 14-35)
- `src/path/file2.ts` (Lines modified: 4-18)

**AC Mapping:**
- AC-1: Implemented in `file1.ts:20` via `handleAuthRedirect()`
- AC-2: Implemented in `file2.ts:12` via `AuthErrorCard`

**Blockers:** None
```

### B. Test Runner Zero-Noise Report Format
```markdown
### [Test Execution Summary]
**Result:** [PASS | FAIL]
**Failed Assertion:** Expected status 302, received 200
**Location:** src/auth/login.test.ts:44
```

---

## 4. Implementation Status for `packages/cli`

- [x] `packages/cli/src/commands/init.ts` (Preset engine, skills, agents, pipeline standards, UI registry)
- [x] `packages/cli/src/commands/start.ts` (Task branch creation & status activation)
- [x] `packages/cli/src/commands/preflight.ts` (AST validator & preflight echo card generator)
- [x] `packages/cli/src/commands/verify.ts` (Boundary audit, test runner, circuit breaker rollback)
- [x] `packages/cli/src/commands/checkpoint.ts` (Diff stashing for Delta protocol)
- [x] `packages/cli/src/commands/close.ts` (Boundary validation, status DONE, spawn-log receipt)
- [x] `packages/cli/src/index.ts` (Commander entrypoint)
- [x] Monorepo build validation (`bun run --filter @harness/cli build`)