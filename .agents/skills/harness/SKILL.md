---
name: harness
description: Operational guide and instruction set for the AI Workflow Harness meta-framework. Teaches AI models how to execute 3-tier XP planning (@planner, @test-creator, and @builder), run CLI commands (init, verify), enforce file boundaries, and maintain living executable specs via Clean-Room separation.
---

# AI Workflow Harness — Agent Skill & Operating Protocol

## 1. Overview & Core Invariants
The **AI Workflow Harness** is a token-efficient, deterministic framework for autonomous and pairing AI development.

1. **3-Mode Clean-Room Architecture (@planner, @test-creator, & @builder):**
   - **@planner:** Architecture planning, feature slicing, and task manifest creation (`.harness/tasks/task-XXX.md`).
   - **@test-creator:** Generates read-only living specs (`*.contract.ts`, `*.spec.ts`, `*.spec.tsx`) mapped to Acceptance Criteria.
   - **@builder:** Stack-specific TDD executor (`@web-builder`, `@mobile-builder`, `@backend-builder`) implementing tasks strictly within `allowedFiles` without modifying tests.
2. **Living Executable Specs:**
   - Macro Blueprint: `.harness/spec/app-summary.md` ($\le 150$ lines).
   - Typed Contracts (`*.contract.ts`) and behavioral test specs (`*.spec.ts`, `*.spec.tsx`).
   - Git and filesystem are the single source of truth.
3. **Deterministic Security & Verification Gate (`harness verify <taskId> [--allow-blocked]`):**
   - File edits strictly limited to `allowedFiles` ($\le 2$ implementation files + 1 test file).
   - Cryptographic Anti-Tampering hash checks to ensure builders do not alter tests.
   - Pre-commit AST syntax check and ErrorSanitizer report cards.
   - 3-strike Circuit Breaker auto-rollback on verification failures.

---

## 2. CLI Command Reference & Workflow Steps

### Step 1: Framework Initialization
```bash
# Scaffold .harness/ tree, agent configurations, skills, and compile tool adapters
harness init
```

### Step 2: Task Execution & Verification
```bash
# Run file boundary validation, AST check, test runner, ErrorSanitizer, and CircuitBreaker
harness verify task-001

# Run partial verification if the spec is flawed and blocked by upstream dependencies
harness verify task-001 --allow-blocked
```
