# AI Workflow Harness — Architectural Handover & Specifications

## 1. End-to-End System Lifecycle

```mermaid
flowchart TD
    subgraph Setup ["0. Initialization & Environment Anchor"]
        A["CLI: harness init"] --> B["Scaffold .harness/ & Standards\n(opencode.json / AGENTS.md)"]
        B --> C["Static Anchor: spec/app-summary.md\n(Architecture Invariants <= 150 lines)"]
    end

    subgraph Planning ["1. JIT Planning Session (@planner)"]
        D["User Feature Request"] --> E["@planner reads spec/app-summary.md\n(100% Cached Static Prefix)"]
        E --> F{"Feature Type"}
        F -->|"Backend / Domain Logic"| G["1. Type Contract (*.contract.ts)\n2. Functional Spec (*.spec.ts)"]
        F -->|"Frontend / UI Component"| H["1. State Contract (*.contract.ts)\n2. Component Spec (*.spec.tsx)"]
        G --> I["JIT Slicing: .harness/tasks/task-XXX.md\n(Max 2 code files + 1 test file)"]
        H --> I
    end

    subgraph Execution ["2. TDD Execution Session (@builder)"]
        I --> J["Open Dedicated Builder Chat\n(@mobile-builder / @backend-builder)"]
        J --> K["RED Phase: Verify Failing Spec"]
        K --> L["GREEN Phase: Implement in allowedFiles"]
        L --> M["Trigger Gate: harness verify task-XXX"]
    end

    subgraph Verification ["3. Deterministic Gate (CLI Engine)"]
        M --> N{"Boundary Audit\n(git diff --name-only)"}
        N -->|"Boundary Violation"| O["REJECT: Unauthorized Edits"]
        O --> L
        N -->|"Clean Boundaries"| P{"Execute Test Runner\n(Exit Code 0?)"}
        
        P -->|"Pass (Exit 0)"| Q["Mark Task DONE\nCreate Atomic Git Commit"]
        P -->|"Fail (Exit != 0)"| R{"Failure Count < 3?"}
        
        R -->|"Attempts 1-2"| S["ErrorSanitizer: Return 10-line Card\n(Failing File, Line & Assertion)"]
        S --> L
        R -->|"Attempt 3"| T["CIRCUIT BREAKER: Auto-Rollback Tree\nLog Failure & Halt Loop"]
    end

    Setup --> Planning
    Planning --> Execution
```

---

## 2. Model Allocation Strategy

| Role | Complex — Best | Complex — Efficient (Recommended) | Small — Efficient |
| :--- | :--- | :--- | :--- |
| **@planner** | `anthropic/claude-3.5-sonnet` | `deepseek/deepseek-r1` or `z-ai/glm-5.2` | `z-ai/glm-5.2` |
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

- `harness init`: Scaffolds the `.harness/` directory, templates, and compiles tool adapters (`opencode.json`, `AGENTS.md`)[cite: 1, 2].
- `harness verify <taskId>`: Enforces file boundaries (`git diff`), runs the test command with `ErrorSanitizer`, and triggers a 3-strike circuit breaker rollback on repeated failures[cite: 1, 2].