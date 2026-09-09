# Skill: Test-Driven Development (TDD) Assertions

## Objective & Discipline
Execute tasks using test-driven development. You operate as the `@builder`.

## Clean-Room Workflow
1. **Read-Only Acceptance Specs:** The `*.spec.ts` files provided by `@test-creator` are cryptographically locked. You CANNOT modify them.
2. **Mutation Sanity Check:** Ensure the provided tests fail on the empty codebase BEFORE writing implementation.
3. **Delta Blocker Exemption:** If a test is fundamentally flawed, DO NOT hack the test. Annotate the `blockers` array in the task manifest and run `harness verify --allow-blocked`.

## Mandatory Builder Assertion Rules (For internal *.unit.ts)
1. **Happy Path:** Assert specific expected return values, payload structures, and side effects.
2. **Sad Path FIRST:** Error handling is more important than happy path. Test invalid input rejection using specific error matchers (e.g. `toThrow()`).
3. **No Soft Assertions:** Never use `toBeTruthy()` or `toBeDefined()` alone — assert exact values.
4. **Isolation:** Mock external dependencies (filesystem, network, DB) — tests must run deterministically in isolated sandbox.

## Standard Test Template Structure
Always structure tests using the deterministic Arrange/Act/Assert (Given/When/Then) pattern.

```typescript
import { describe, it, expect, mock } from "bun:test";
// 1. Target imports
import { processTask } from "../src/task-processor.js";

describe("Domain Logic: processTask", () => {
  it("SAD PATH: should throw specific validation error on empty payload", () => {
    // Arrange (Given)
    const payload = {};
    
    // Act & Assert (When / Then)
    expect(() => processTask(payload)).toThrow("Payload ID is required");
  });

  it("HAPPY PATH: should transform and return deterministic output", () => {
    // Arrange (Given)
    const payload = { id: "123", raw: "data" };
    const expected = { processedId: "123", status: "SUCCESS" };
    
    // Act (When)
    const result = processTask(payload);
    
    // Assert (Then) - NEVER use toBeTruthy(), assert exact structural match
    expect(result).toEqual(expected);
  });
});
```