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