# Skill: Test-Driven Verification & Code Review Engine

## Objective & Foundation

Code review in AI Workflow Harness is **100% test-driven**. Instead of relying on manual visual diff reviews or human approval, code correctness is proven deterministically through unit and integration test execution.

---

## 1. Atomic RED -> GREEN -> REFACTOR Cycle for AI Agents

All code generation must follow strict atomic TDD cycles:

1. **RED Phase (Test Creation):**
   - `@test-creator` or developer authors test contracts in `__tests__/<module>.test.ts` BEFORE source code is implemented.
   - Run `harness verify` to confirm tests fail due to missing implementation (RED state).
2. **GREEN Phase (Implementation):**
   - Specialist agent (`@web-specialist`, `@node-specialist`, etc.) implements code strictly to satisfy the failing test assertions.
   - Run `harness verify` to confirm all assertions pass (GREEN state).
3. **REFACTOR Phase:**
   - Clean up implementation while ensuring tests remain GREEN.

---

## 2. 3-Tier Assertion Depth Pattern

Every test suite MUST satisfy 3 assertion tiers per feature requirement:

### Tier 1: Happy Path State Invariants
- Assert exact object structures, property values, and return payloads using `toEqual()` or `toBe()`.
- **FORBIDDEN:** `toBeTruthy()`, `toBeDefined()`, or checking array length > 0 without checking item contents.

### Tier 2: Sad Path / Error Guard (Test First!)
- Test error handling BEFORE happy path logic.
- Assert specific exception types and exact error messages using `toThrow("exact error message")` or HTTP 400/422 status assertions.
- Verify invalid inputs (malformed JSON, missing fields, out-of-range values) are rejected gracefully.

### Tier 3: Boundary & Property Invariants
- Test boundary limits: null, undefined, empty array, maximum string length, zero, and negative values.
- Verify schema compliance and invariant properties (e.g. "serializing then deserializing yields identical state").

---

## 3. Acceptance Criteria Traceability Gate

Every Acceptance Criterion (AC) listed in a task manifest (`.harness/tasks/task-XXX.md`) MUST map 1-to-1 to a named `describe/it` block in the test file:

```typescript
// AC: Verify UserProfile updates bio and validates max 200 length
describe("UserProfile Update", () => {
  it("AC-1: Happy Path - updates bio successfully", async () => { ... });
  it("AC-2: Sad Path - throws error when bio exceeds 200 chars", async () => { ... });
  it("AC-3: Boundary - allows empty string bio", async () => { ... });
});
```

If an Acceptance Criterion lacks a corresponding test assertion, `harness verify` will flag the task as incomplete.

---

## 4. Zero-Tautology & Assertion Quality Guard

To prevent "fake GREEN" passes, test suites must adhere to strict quality rules:

- **No Tautological Assertions:** Tests like `expect(true).toBe(true)` or `expect(1).toBe(1)` are strictly forbidden.
- **No Empty Mocks:** Mocks must assert call arguments and call counts (`expect(fn).toHaveBeenCalledWith(...)`).
- **Minimum Assertion Density:** Every test block (`it(...)`) MUST contain at least 1 concrete `expect()` assertion.
- **Assertion Inspection:** `harness verify` analyzes test files for non-trivial assertions before declaring task completion.
