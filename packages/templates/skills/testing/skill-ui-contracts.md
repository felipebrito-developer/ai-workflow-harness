# Skill: UI Contracts & Component Testing Specs

## Objective
Define UI state boundaries using discriminated state unions and author robust UI component specifications using React Testing Library or Native Testing Library.

## Core Rules & Standards

1. **Discriminated State Unions:**
   - Always represent component UI states as type-safe discriminated unions rather than boolean flags:
   ```typescript
   export type UIState =
     | { status: "idle" }
     | { status: "loading" }
     | { status: "success"; data: UserProfile }
     | { status: "error"; error: Error };
   ```

2. **Testing Library Specs:**
   - Assert user-visible behavior and accessibility roles rather than internal state:
   ```typescript
   // Assert by role, text, or label
   expect(screen.getByRole("button", { name: /submit/i })).toBeEnabled();
   ```

3. **No Implicit Async State Leaks:**
   - Wrap user interactions and async wait assertions in `waitFor` or `findBy*` queries to ensure zero flaky tests.
