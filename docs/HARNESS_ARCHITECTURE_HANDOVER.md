# AI Workflow Harness — Architectural Handover & Specifications

## 1. End-to-End System Lifecycle

```mermaid
flowchart TD
    subgraph Setup ["0. Initialization & Environment Anchor"]
        A["CLI: harness init"] --> B["Scaffold .harness/ & Standards\n(opencode.json / AGENTS.md)"]
        B --> C["Static Anchor: spec/app-summary.md\n(Architecture Invariants <= 150 lines)"]
    end

    subgraph Planning ["1. JIT Planning Session (@planner & @test-creator)"]
        D["User Feature Request"] --> E["@planner reads spec/app-summary.md\n(100% Cached Static Prefix)"]
        E --> F{"Feature Type"}
        F -->|"Backend / Domain Logic"| G["@test-creator:\n1. Type Contract (*.contract.ts)\n2. Acceptance Spec (*.spec.ts)"]
        F -->|"Frontend / UI Component"| H["@test-creator:\n1. State Contract (*.contract.ts)\n2. Component Spec (*.spec.tsx)"]
        G --> I["JIT Slicing: .harness/tasks/task-XXX.md\n(Max 2 code files + 1 test file)"]
        H --> I
        I --> J["Cryptographic Spec Lock\n(SHA-256 hash generated in manifest)"]
    end

    subgraph Execution ["2. TDD Execution Session (@builder)"]
        J --> K["Open Dedicated Builder Chat\n(@web-builder / @backend-builder)"]
        K --> L["RED Phase: Verify Failing Spec\n(Mutation Sanity Check)"]
        L --> M["GREEN Phase: Implement in allowedFiles\n(Cannot modify locked test)"]
        M --> N["Trigger Gate: harness verify task-XXX"]
    end

    subgraph Verification ["3. Deterministic Gate (CLI Engine)"]
        N --> O{"Boundary Audit\n(git diff --name-only)"}
        O -->|"Boundary Violation"| P["REJECT: Unauthorized Edits"]
        P --> M
        O -->|"Clean Boundaries"| Q{"Anti-Tamper Check\n(SHA-256 Match?)"}
        Q -->|"Tampering Detected"| P
        Q -->|"Valid Hash"| R{"Execute Test Runner\n(Exit Code 0?)"}
        
        R -->|"Pass (Exit 0)"| S["Mark Task DONE\nCreate Atomic Git Commit"]
        R -->|"Fail (Exit != 0)"| T{"Failure Count < 3?"}
        
        T -->|"Attempts 1-2"| U["ErrorSanitizer: Return 10-line Card\n(Failing File, Line & Assertion)"]
        U --> M
        T -->|"Attempt 3"| V["CIRCUIT BREAKER: Auto-Rollback Tree\nLog Failure & Halt Loop"]
        
        M -.->|"Dependency Blocked"| W["Annotate blockers\nharness verify --allow-blocked"]
        W -->|"Pass Unblocked Tests"| X["Status: NEEDS_PLANNER_REVIEW"]
    end

    Setup --> Planning
    Planning --> Execution
```

---

## 2. Model Allocation Strategy

| Role | Complex — Best | Complex — Efficient (Recommended) | Small — Efficient |
| :--- | :--- | :--- | :--- |
| **@planner** | `anthropic/claude-3.5-sonnet` | `deepseek/deepseek-r1` or `z-ai/glm-5.2` | `z-ai/glm-5.2` |
| **@test-creator** | `anthropic/claude-3.5-sonnet` | `qwen/qwen-2.5-coder-32b-instruct` | `qwen/qwen-2.5-coder-32b-instruct` |
| **@builder** (Web / Mobile / Node) | `anthropic/claude-3.5-sonnet` | `qwen/qwen-2.5-coder-32b-instruct` | `qwen/qwen-2.5-coder-32b-instruct` |
| **@test-runner** | `google/gemini-2.5-flash` | `google/gemini-2.5-flash` | `google/gemini-2.5-flash` |

---

## 3. Micro-Task Manifest Schema (`.harness/tasks/task-XXX.md`)

```markdown
---
id: "task-001"
title: "Implement user authentication state handler"
stack: "node"
status: "TODO"
---

# Task: Implement User Authentication State Handler

## 1. Allowed File Boundaries
> **Constraint:** Agent may ONLY modify or create the files listed below:
- `src/features/auth/auth.service.ts`
- `src/features/auth/auth.spec.ts`

## 2. Acceptance Criteria
- [ ] AC-1: Given valid credentials, When `login()` is called, Then return signed JWT and status 200.
- [ ] AC-2: Given expired token, When `verifyToken()` is called, Then throw `AuthenticationExpiredError`.

## 3. Verification Commands
```bash
bun test src/features/auth/auth.spec.ts
```
```

---

## 4. CLI Surface Specification

- `harness init`: Scaffolds the `.harness/` directory, templates, and compiles tool adapters (`opencode.json`, `AGENTS.md`).
- `harness verify <taskId> [--allow-blocked]`: Enforces file boundaries, performs cryptographic anti-tamper hash checks, runs the test command with `ErrorSanitizer`, and triggers a 3-strike circuit breaker rollback on repeated failures. If `--allow-blocked` is specified, skipped tests are routed to `NEEDS_PLANNER_REVIEW`.