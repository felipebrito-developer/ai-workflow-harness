# The Delta Protocol (Scope Escalation & Mid-Flight Injection)

When an agent or developer discovers missing features, schema mismatches, or unpredicted edge cases during Phase 4/5 execution, apply 3-tier triage immediately[cite: 10, 13, 14].

---

## 1. Triage Classification

| Tier | Condition | Action |
| :--- | :--- | :--- |
| **Tier 1: Patch (Low)** | Logic tweak within existing file boundaries and schemas. | Append checkbox to active `task-XXX.md` acceptance criteria inline[cite: 13]. Continue TDD[cite: 14]. |
| **Tier 2: Delta (Medium)** | Requires new files, schema alterations, or new API routes. | Run `harness checkpoint <task-id>` to stash diffs. Create `.harness/spec/features/<feat>/gaps/GAP-XXX.md`. Slice sub-task (`task-XXX.1.md`)[cite: 10, 14]. |
| **Tier 3: Pivot (High)** | Invalids core architecture (`app-summary.md` or milestone)[cite: 10]. | Halt execution. Roll back branch. Return to Phase 1 (Discovery) for spec re-cut[cite: 10, 14]. |

## 2. Checkpoint & Stash Execution
When a Tier 2 Delta occurs:
```bash
# Auto-stashes uncommitted work to stash/task-XXX-checkpoint
harness checkpoint <task-id>

The agent returns to planning mode with a clean working tree to resolve the gap spec without polluting active diffs[cite: 10, 14].

--

#### D. `packages/core-rules/tdd-lifecycle.md`
Governs deterministic implementation and verification gates[cite: 13, 14]:

```markdown
# TDD Lifecycle & Execution Verification Gate

Every task execution must satisfy its declared mode (`VARIANT_A` or `VARIANT_B`)[cite: 13, 14].

---

## Variant A: Full TDD Separation (Mandatory for core logic/data-flow)[cite: 13, 14]
1. **Preflight Gate:** `harness preflight <task-id>` passes (clean git tree, AST types resolve, agent echo emitted)[cite: 13].
2. **RED Phase:** Test agent writes unit/contract tests matching acceptance criteria in `__tests__/`[cite: 13, 14]. Harness confirms failure (RED)[cite: 13, 14].
3. **GREEN Phase:** Developer agent writes minimal code within `## 1. Allowed File Boundaries` to make tests pass[cite: 13, 14].
4. **Verification Gate:** `harness verify <task-id>` exits 0[cite: 13].

## Variant B: Embedded TDD (UI layout, config, and script tasks)[cite: 13, 14]
1. Developer agent creates/edits the configuration/UI component and test in a single pass[cite: 13, 14].
2. `harness verify <task-id>` confirms exit 0 independently[cite: 13].

## Circuit Breaker Rule
If `harness verify <task-id>` fails 3 consecutive times:
- The Circuit Breaker trips automatically[cite: 12, 13].
- Target files are rolled back to the preflight commit[cite: 12, 13].
- A `BLOCKED` receipt is written to `.harness/memory/spawn-log/`[cite: 12, 13].
- The task halts for developer intervention or sub-task re-slicing[cite: 13, 14].