# Clean-Room Specification Lifecycle

The AI Workflow Harness uses a **Clean-Room Specification** (Dual-Role) pattern. This separates the generation of Acceptance Criteria (AC) tests from the implementation code, preventing autonomous agents from gaming tests or creating false positives.

```mermaid
flowchart TD
    subgraph Phase1 ["1. Requirements & Slicing"]
        A["Requirements / Business Goal"] --> B["@planner: Slices Features & Tasks"]
        B --> C[".harness/tasks/task-XXX.md\n(AC-1, AC-2, AC-3)"]
    end

    subgraph Phase2 ["2. Specification & Locking"]
        C --> D["@test-creator: Generates Living Spec\n(feature.contract.ts + feature.spec.ts)"]
        D --> E["Harness Locks Test\n(Calculates SHA-256 Checksum)"]
    end

    subgraph Phase3 ["3. Implementation & Verification"]
        E --> F["@builder: Evaluates Task & Spec"]
        F --> G{"Blockers / Contradictions\nDiscovered?"}
        
        G -->|"No Blockers"| H["Implement within allowedFiles\n(RED -> GREEN cycle)"]
        H --> I["harness verify task-XXX"]
        I -->|"Tests Pass + Checksum Valid"| J["Task Status: DONE\nCommit Changes"]
        
        G -->|"Blocker Found"| K["Annotate Blocker in Manifest\n(Mark AC-X as BLOCKED + Reason)"]
        K --> L["Implement Unblocked ACs Only"]
        L --> M["harness verify --allow-blocked task-XXX"]
    end

    subgraph Phase4 ["4. Conflict Resolution"]
        M --> N["Task Status: NEEDS_PLANNER_REVIEW"]
        N --> O["@planner: Evaluates Conflict"]
        O --> P{"Architectural Decision"}
        P -->|"Valid Blocker / Spec Flaw"| Q["@planner updates PRD/Contract\n@test-creator updates *.spec.ts"]
        P -->|"Invalid Blocker"| R["Re-dispatch to @builder with guidance"]
        Q --> E
    end
```
