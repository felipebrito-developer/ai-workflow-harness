# Skill: Executable Specs & Living BDD Standards

## Objective
Author living executable specifications (`*.contract.ts` and `*.spec.ts`) that serve as both executable test suites and unambiguous system specifications.

## Core Rules & Standards

1. **Executable Specs Over Static Specs:**
   - Write system contracts and behavior specifications in type-safe TypeScript files (`*.contract.ts` and `*.spec.ts`).
   - Every acceptance criterion must map directly to an executable test suite assertion block.

2. **BDD Given/When/Then Pattern:**
   - Use structured `describe` and `it` blocks written as explicit specifications:
   ```typescript
   describe("Feature: User Authentication Contract", () => {
     describe("Given valid user credentials", () => {
       it("When user submits login, Then returns JWT token and updates session state", async () => {
         // Contract assertion
       });
     });
   });
   ```

3. **Domain Entity Contracts:**
   - Define exact interface schemas and input validation contracts.
   - Assert domain invariants before and after state mutations.

4. **Continuous Synchronization:**
   - Living specs are the single source of truth. Passing spec suites guarantee functional correctness.
