# Skill: Test-Driven Development (TDD) Assertions

## Objective & Discipline
Author comprehensive, failing test suites BEFORE any implementation code begins (RED phase of TDD).

## Mandatory Assertion Rules

1. **Happy Path:** Assert specific expected return values, payload structures, and side effects.
2. **Sad Path FIRST:** Error handling is more important than happy path. Test invalid input rejection using specific error matchers (e.g. `toThrow()`).
3. **No Soft Assertions:** Never use `toBeTruthy()` or `toBeDefined()` alone — assert exact values.
4. **Isolation:** Mock external dependencies (filesystem, network, DB) — tests must run deterministically in isolated sandbox.
