---
name: tdd
description: Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests.
---

# Test-Driven Development (Clean-Room Specification Pattern)

This framework operates on a **Clean-Room Specification Pattern** (Dual-Role Separation of Concerns). We mathematically eliminate the primary risk of autonomous agent workflows (test tampering and false positives) by splitting test generation and implementation across two distinct roles.

## The Test Pattern Matrix

To implement this workflow effectively, every agent must respect these four core invariants:

| Pattern | Mechanism |
| :--- | :--- |
| **1. Cryptographic Spec Lock** | Checksum hash of `*.spec.ts` stored in task manifest; `verify` rejects if test changed. |
| **2. Dual-Tier Test Scopes** | - **Acceptance Spec (`*.spec.ts`)**: Read-Only (Owned by `@test-creator`)<br>- **Unit Tests (`*.unit.ts`)**: Mutable (Owned by `@builder`) |
| **3. Mutation Sanity Check** | Pre-verify step: run test against empty stub. If test passes on empty code, spec is invalid. |
| **4. Delta Blocker Exemption** | Builder annotates blocked AC in task manifest; `verify` skips blocked test and alerts planner. |

### Pattern 1: Cryptographic Spec Locking (Anti-Tampering)
- **Mechanism:** When `@test-creator` generates `src/feature.spec.ts`, the harness computes its SHA-256 hash and records it in `.harness/tasks/task-XXX.md` under `specChecksum: "sha256-..."`.
- **Enforcement:** During `harness verify <taskId>`, the CLI verifies `sha256(testFile) === manifest.specChecksum`.
- **Result:** If `@builder` alters an assertion (e.g., changing `expect(res.status).toBe(200)` to `toBe(500)`), the gate fails immediately before running tests.

### Pattern 2: Dual-Tier Test Separation
- **Tier 1 — Living Acceptance Spec (`*.spec.ts` / `*.contract.ts`)**: Authored exclusively by `@test-creator`. Mapped 1:1 to Gherkin ACs. Locked and read-only for `@builder`.
- **Tier 2 — Internal Unit Tests (`*.unit.ts`)**: Authored by `@builder` for internal helpers, regex math, or refactoring safety. `@builder` has full write access.

### Pattern 3: Negative-Proof Mutation Preflight
Before `@builder` begins coding, run the acceptance test against the untouched/stubbed codebase. The test **must fail** (Exit Code ≠ 0). If the test passes before any code is written, `@test-creator` wrote a tautology or vacuum test, and the task must be rejected.

### Pattern 4: Mid-Implementation Blockers Cleanly
When `@builder` discovers an AC cannot be satisfied without modifying the read-only test suite, it **must not hack the test**. Instead, follow the Blocker Annotation Protocol:

1. **Annotate the Manifest**: Add a `blockers` entry to `.harness/tasks/task-XXX.md` marking the specific AC and reason. Change status to `BLOCKED_PARTIAL`.
2. **Partial Verification Gate**: Run `harness verify <taskId> --allow-blocked`. The CLI executes unblocked tests while skipping blocked tests.
3. **Planner Triage**: The task status becomes `NEEDS_PLANNER_REVIEW` for the `@planner` to evaluate the blocker and revise the PRD or upstream dependencies.

---

## Top Ecosystem Practices (`skills.sh`)

When generating tests, incorporate these battle-tested standards from the open agent ecosystem:

1. **Vertical Behavior-Focused Slices** (inspired by `mattpocock/skills/tdd`)
   - Test only at pre-agreed API "seams". A seam is the public boundary where you observe behavior without reaching inside.
   - Do not write horizontal slice tests (testing shapes over behavior).
2. **Pre-Implementation Verification** (inspired by `owainlewis/blueprint/tdd`)
   - Never write implementation code until you have witnessed the test fail EXACTLY the way you expect.
   - Avoid testing low-value formatting details.
3. **Strict Loop Constraints** (inspired by `obra/superpowers/tdd`)
   - **Red before green**: Write failing test first, then only enough code to pass it.
   - **One slice at a time**: One seam, one test, one minimal implementation.
   - Refactoring is strictly a post-green step. Do not refactor while trying to turn a test green.

## Anti-patterns

- **Implementation-coupled**: Mocks internal collaborators, tests private methods. The tell: the test breaks when you refactor but behavior hasn't changed.
- **Tautological**: The assertion recomputes the expected value the way the code does (`expect(add(a, b)).toBe(a + b)`), passing by construction. Expected values must come from an independent source of truth (literal/spec).
