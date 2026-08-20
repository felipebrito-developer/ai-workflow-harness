# Planning Engine & Agile Workflow

The Harness framework supports both lightweight **2-Pass Agile Fast-Track** and comprehensive **5-Phase Waterfall** planning strategies.

---

## 1. 2-Pass Agile Fast-Track (Default)

Designed for rapid iteration and high velocity without waterfall overhead:

1. **Pass 1: Vision & Scope (Product/UI):**
   - High-level epic goals, wireframe layout, and user journey definition.
   - Interactive 3-question baseline verification prompt during `harness analyze`.
2. **Pass 2: Technical Execution & Micro-Tasks:**
   - Schema contracts and boundary-enforced task manifest generation (`task-XXX.md`).

---

## 2. 5-Phase Waterfall Strategy

Recommended for enterprise refactors or high-ambiguity greenfield projects:

| Phase | Output Artifact | Scope & Purpose |
| :--- | :--- | :--- |
| **Phase 1: Discovery** | `.harness/memory/discovery/<feat>.md` | Interviews user, defines personas, audits existing codebase baseline. |
| **Phase 2: Functional** | `spec/features/<feat>/business/spec.md` | User journeys, epics, milestones, AI workflow mode. |
| **Phase 3: Visualization** | `spec/features/<feat>/ui/spec.md` | ASCII wireframes, UI state tables, Mermaid flowcharts. |
| **Phase 4: Tech Specs** | `spec/features/<feat>/technical/spec.md` | Contracts, schemas, error modes, boundary constraints. |
| **Phase 5: Task Slicing** | `.harness/tasks/task-XXX.md` | Atomic micro-manifest generation ($\le$ 2 files per task). |

---

## 3. Task Risk Scoring & Sub-Slicing (`RiskEngine`)

`RiskEngine` automatically scores task complexity before execution:

- **LOW RISK (Score 0-2):** $\le$ 2 files modified, no schema changes. Executed directly.
- **MEDIUM RISK (Score 3-4):** 3-4 files modified. Emits warning card.
- **HIGH RISK (Score $\ge$ 5):** $> 5$ files or DB schema mutations. Automatically emits sub-slicing recommendations (`task-XXXa`, `task-XXXb`).

---

## 4. The Delta Protocol (Scope Escalation)

When new requirements or edge cases are discovered mid-task:

- **Tier 1 (Patch):** Minor tweak within file boundaries. Append acceptance criteria to task manifest.
- **Tier 2 (Delta):** New files or schema changes needed. Run `harness checkpoint <taskId>` to stash current progress, generate `GAP-XXX.md` spec, and create sub-task `task-XXX.1.md`.
- **Tier 3 (Pivot):** Flawed architecture. Halt task, rollback branch, and return to Phase 1 grill.
