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
   - **Clean-Room Specification:** `@test-creator` produces cryptographically locked `*.spec.ts` files that `@builder` must implement without modifying.

---

## 3. Task Risk Scoring & Sub-Slicing (`RiskEngine`)

`RiskEngine` automatically scores task complexity before execution:

- **LOW RISK (Score 0-2):** $\le$ 2 files modified, no schema changes. Executed directly.
- **MEDIUM RISK (Score 3-4):** 3-4 files modified. Emits warning card.
- **HIGH RISK (Score $\ge$ 5):** $> 5$ files or DB schema mutations. Automatically emits sub-slicing recommendations (`task-XXXa`, `task-XXXb`).

---

## 4. The Delta Protocol (Scope Escalation & Blockers)

When new requirements or edge cases are discovered mid-task:

- **Tier 1 (Patch):** Minor tweak within file boundaries. Append acceptance criteria to task manifest.
- **Tier 2 (Dependency Blocker):** Missing architectural support or flawed spec. The `@builder` annotates the task manifest with `blockers` and runs `harness verify --allow-blocked` to send it back to the `@planner` (`NEEDS_PLANNER_REVIEW`).
- **Tier 3 (Pivot):** Flawed architecture. Halt task, rollback branch, and return to Phase 1 grill.
