# Validation Step 2: Architecture Invariants & Rules

Validate that the codebase enforces these mandatory operational rules:

## 1. Context Separation & 2-Level Caching
- Root anchor is `.harness/spec/app-summary.md` (must remain <=250 lines).
- Feature sub-specs (`business/`, `ui/`, `technical/`) are loaded on demand and must remain <=500 lines.
- Ephemeral workspace `.harness/temp/` (`scripts/`, `assets/`, `artifacts/`) is gitignored by default.

## 2. Planning Pipeline Rules (Phases 1 to 5)
- Phase 1 Discovery: Strict 3+2 Q&A format (3 top recommendations + Option 4 "Other" + Option 5 "Explain it better"). Transcripts write to `.harness/memory/discovery/<feature>.md`.
- Phase 2 Strategy: Validates execution topology (Orchestrated, Solo-Agent, Vibe-Assist) with a trade-off matrix.
- Phase 3 Design: Centralized index in `.harness/UI/custom-components-registry.ts` + ASCII block layout (`wireframe-ascii.md`) + Mermaid route flow (`route-flow-mermaid.md`).
- Phase 4 Architecture: API contracts, DB schemas, and ADRs in `.harness/spec/features/<feature>/technical/spec.md`.
- Phase 5 Slicing: Tasks must touch <=2 primary files and contain 1-4 Gherkin Acceptance Criteria (`Given / When / Then`).

## 3. Tech Lead Role Invariants
- Zero-Code Rule: Tech Lead never writes application code or test syntax directly; it only coordinates `@test-creator` and `<stack>-specialist`.
- Negative-Proof AC Audit: Tech Lead verifies that every Gherkin AC maps to a passing test assertion before closing a task.
- Sole Commit Authority: Tech Lead is the only agent permitted to run `harness close` and create Git commits.

## 4. Subagent Output Contracts
- Specialist Report: Emits only modified files, AC mapping, and blockers.
- Test Runner Card: Emits only result, failing assertions, and file:line locations (zero passing log noise).