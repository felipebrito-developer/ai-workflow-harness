# Planning Engine & Agile Workflow

The Harness framework enforces rapid **2-Pass Agile Fast-Track** execution with zero waterfall overhead.

---

## 1. 2-Pass Agile Fast-Track (Default)

Designed for rapid iteration, continuous delivery, and high velocity:

1. **Pass 1: Vision & Scope (Product/UI):**
   - High-level epic goals, wireframe layout, and user journey definition.
   - Interactive 3-question baseline verification prompt during `harness analyze`.
2. **Pass 2: Technical Execution & Micro-Tasks:**
   - Schema contracts and boundary-enforced task manifest generation (`task-XXX.md`).

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
