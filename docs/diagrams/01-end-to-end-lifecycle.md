# 01. End-to-End System Lifecycle

```mermaid
flowchart TD
    subgraph Setup ["0. Initialization & Environment Anchor"]
        A["harness init"] --> B["Scaffold .harness/ & Standards<br/>(opencode.json / AGENTS.md)"]
        B --> C["Static Cache Anchor: spec/app-summary.md<br/>(Architecture Invariants &le; 150 lines)"]
    end

    subgraph Planning ["1. JIT Planning Session (@planner)"]
        D["User Feature Request / Epic"] --> E["@planner reads spec/app-summary.md<br/>(100% Cached Prefix)"]
        E --> F{"Feature Type"}
        F -->|"Backend / Domain Logic"| G["1. Author Type Contract (*.contract.ts)<br/>2. Author Functional Spec (*.spec.ts)"]
        F -->|"Frontend / UI Component"| H["1. Author State & Props Contract (*.contract.ts)<br/>2. Author Component Spec (*.spec.tsx)"]
        G --> I["JIT Slicing: .harness/tasks/task-XXX.md<br/>(Max 2 code files + 1 test file)"]
        H --> I
    end

    subgraph Execution ["2. TDD Execution Session (@builder)"]
        I --> J["Open Fresh Chat with Domain Builder<br/>(@mobile-builder / @backend-builder)"]
        J --> K["RED Phase: Author / Verify Failing Tests"]
        K --> L["GREEN Phase: Implement Code in allowedFiles"]
        L --> M["Trigger Verification Gate:<br/>harness verify task-XXX"]
    end

    subgraph Verification ["3. Deterministic Gate & Guardrails (CLI Engine)"]
        M --> N{"Boundary Audit<br/>(git diff --name-only)"}
        N -->|"Unallowed files modified"| O["REJECT: File Boundary Violation"]
        O --> L
        N -->|"Clean Boundaries"| P{"Execute Test Runner<br/>(Exit Code 0?)"}
        
        P -->|"Pass (Exit 0)"| Q["Mark task-XXX DONE<br/>Create Atomic Git Commit"]
        P -->|"Fail (Exit != 0)"| R{"Failure Count < 3?"}
        
        R -->|"Attempts 1-2"| S["ErrorSanitizer: Return 10-line Card<br/>(Failing File, Line & Assertion)"]
        S --> L
        R -->|"Attempt 3"| T["CIRCUIT BREAKER: Auto-Rollback Git Tree<br/>Log Failure Signature & Halt"]
    end

    Setup --> Planning
    Planning --> Execution
```