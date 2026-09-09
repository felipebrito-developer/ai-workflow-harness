# Lean 3-Mode AI Workflow Standards

> **Clean-Room Specs, Boundary-Isolated Tasks & Deterministic Gates**

## Operating Modes
- **@planner:** Reasoning agent for architectural planning, living spec slicing, and task manifest creation.
- **@test-creator:** Generates read-only Acceptance Specs (`*.spec.ts`) that are cryptographically locked by the framework.
- **@builder:** Stack-specific TDD executor. Implements tasks strictly within allowed file boundaries without modifying the locked spec.

## Execution Invariants
1. **Clean-Room Specification:** `@builder` cannot modify the acceptance tests written by `@test-creator`. Blocked tests must be flagged via `blockers` in the task manifest.
2. **Atomic Tasks:** Max 2 implementation code files + 1 test file (max 3 total) per task.
3. **Deterministic Verification Gate:** Run `harness verify <taskId>` to enforce boundaries, validate cryptographic hashes, run tests, and trigger circuit breaker rollbacks on failures.