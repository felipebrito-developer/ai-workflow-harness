---
name: harness
description: Complete operational guide and instruction set for the AI Workflow Harness meta-framework. Teaches AI models how to execute 2-tier XP planning, run CLI commands (init, analyze, feature, start, preflight, verify, close, audit), enforce file boundaries, and query the SQLite spec engine.
---

# AI Workflow Harness — Agent Skill & Operating Protocol

## 1. Overview & Core Invariants
The **AI Workflow Harness** is a token-efficient, deterministic framework for autonomous and pairing AI development.

1. **2-Tier XP Planning Pipeline:**
   - **Tier 1 (App Vision):** Global framing (`harness init` / `harness analyze`).
   - **Tier 2 (Feature XP Cycle):** 1-pass feature generation (`harness feature <name>`) combining mockup, spec contract, and atomic tasks.
2. **Deterministic Security & Boundary Gates:**
   - Edits strictly limited to `allowedFiles` ($\le 2$ files per task).
   - Pre-commit Secret Scanner blocks credentials, tokens, or `.env` files.
   - Task completion requires exit code 0 (`harness verify`).
3. **SQLite 2-Tier Spec Engine:**
   - Specs stored in `.harness/harness.db` (WAL mode).
   - Summary chunks ($\le 250$ tokens) for fast context; Detail chunks loaded on-demand.

---

## 2. CLI Command Examples & Workflow Steps

### Step 1: Initialization & Auto-Discovery
```bash
# Greenfield Setup: Prompts for vision, epics & strategy
harness init

# Brownfield Setup: Zero-prompt AST & structure discovery on existing TS/Go codebase
harness analyze
```

### Step 2: Security & Vulnerability Audit
```bash
# Scans repo for credentials, un-gitignored .env files, and package CVEs
harness audit
```

### Step 3: Agile Feature Generation & Risk Evaluation
```bash
# 1-Pass Feature Creation with file scope & risk scoring
harness feature "User Authentication" --files "src/auth.ts,tests/auth.test.ts" --isSchema
```
*Output Risk Assessment:*
```
┌────────────────────────────────────────────────────────┐
│ ⚠️ TASK RISK ASSESSMENT: LEVEL HIGH                     │
├────────────────────────────────────────────────────────┤
│ • Modifies database schema / API data contract         │
├────────────────────────────────────────────────────────┤
│ Recommended Sub-Slices:                                │
│   -> task-XXXa-schema (DDL / Type Contract Migration)  │
│   -> task-XXXb-impl (Core Business Logic)              │
└────────────────────────────────────────────────────────┘
```

### Step 4: Task Execution & Preflight Gate
```bash
# Switch to isolated git branch task/task-auth-user-authentication
harness start task-user-authentication

# Run AST check, secret diff scanner, & emit required echo block
harness preflight task-user-authentication
```

### Step 5: Code Implementation & Verification Gate
1. Implement code strictly within declared `allowedFiles`.
2. Run test verification gate:
```bash
harness verify task-user-authentication
```
*If uncommitted credentials exist in diff:*
```
┌────────────────────────────────────────────────────────┐
│ 🚨 HARNESS SECURITY ENGINE: VIOLATION DETECTED         │
├────────────────────────────────────────────────────────┤
│ [CRITICAL] SECRET_LEAK       │ Potential secret leak   │
│   Target File: src/auth.ts                             │
└────────────────────────────────────────────────────────┘
```

### Step 6: Task Closure & Spec Export
```bash
# Marks status DONE, exports SQLite DB to .harness/spec/ markdown tree
harness close task-user-authentication
```

---

## 3. SQLite Spec Engine Directives (`.harness/harness.db`)

When querying project architecture, agents use `bun:sqlite` or MCP tools:

```sql
-- Fast Summary Query (Token Efficient < 250 words)
SELECT c.content FROM spec_chunks c
JOIN spec_topics t ON c.topic_id = t.id
WHERE t.slug = 'auth-ui' AND c.level = 'summary';

-- Detail Query (Loaded ONLY when actively writing code for topic)
SELECT c.content FROM spec_chunks c
JOIN spec_topics t ON c.topic_id = t.id
WHERE t.slug = 'auth-ui' AND c.level = 'detail';
```
