---
name: harness
description: Operational guide and instruction set for the AI Workflow Harness meta-framework. Teaches AI models how to execute 2-tier XP planning (@planner and @builder), run CLI commands (init, verify), enforce file boundaries, and maintain living executable specs.
---

# AI Workflow Harness — Agent Skill & Operating Protocol

## 1. Overview & Core Invariants
The **AI Workflow Harness** is a token-efficient, deterministic framework for autonomous and pairing AI development.

1. **2-Mode System Architecture (@planner & @builder):**
   - **@planner:** Architecture planning, living spec slicing (`*.contract.ts`, `*.spec.ts`, `*.spec.tsx`), and task manifest creation (`.harness/tasks/task-XXX.md`).
   - **@builder:** Stack-specific TDD executor (`@web-builder`, `@mobile-builder`, `@backend-builder`) implementing tasks strictly within `allowedFiles`.
2. **Living Executable Specs:**
   - Macro Blueprint: `.harness/spec/app-summary.md` ($\le 150$ lines).
   - Typed Contracts (`*.contract.ts`) and behavioral test specs (`*.spec.ts`, `*.spec.tsx`).
   - Git and filesystem are the single source of truth.
3. **Deterministic Security & Verification Gate (`harness verify <taskId>`):**
   - File edits strictly limited to `allowedFiles` ($\le 2$ implementation files + 1 test file).
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
```
