# The Delta Protocol (Scope Escalation & Mid-Flight Injection)

When an agent or developer discovers missing features, schema mismatches, or unpredicted edge cases during `@builder` execution, apply 3-tier triage immediately.

---

## 1. Triage Classification

| Tier | Condition | Action |
| :--- | :--- | :--- |
| **Tier 1: Patch (Low)** | Logic tweak within existing file boundaries and schemas. | Append checkbox to active `task-XXX.md` acceptance criteria inline. Continue TDD. |
| **Tier 2: Delta (Medium)** | Requires new files, schema alterations, or new API routes. | Auto-checkpoint diffs (`gitManager.checkpointStash`). Create `.harness/spec/features/<feat>/gaps/GAP-XXX.md`. Slice sub-task (`task-XXX.1.md`). |
| **Tier 3: Pivot (High)** | Invalidates core architecture (`app-summary.md` or active milestone). | Halt execution. Roll back working tree. Return to `@planner` mode for architectural re-cut. |

---

## 2. Checkpoint & Stash Execution
When a Tier 2 Delta occurs:
- Work is safely committed to a temporary stash branch (`stash/task-XXX-checkpoint-<timestamp>`).
- `@planner` resolves the gap spec with a clean working tree without polluting active task diffs.