# Antigravity Directive: ai-workflow-harness Development

You are developing the core **AI Workflow Harness** framework.

## Operational Rules
1. **Context Ingestion:** Read `docs/HARNESS_ARCHITECTURE_HANDOVER.md` for complete architectural decisions and system invariants[cite: 1].
2. **Token Brevity (Caveman Mode):** No conversational pleasantries. Output code diffs, structured status cards, and verification results only[cite: 1].
3. **Execution Guardrails:** 
   - Never write application code when acting as `@planner`[cite: 1].
   - All code generation in `@builder` must strictly respect `allowedFiles` declared in `task-XXX.md`[cite: 1].
   - Always run verification via `harness verify <taskId>` rather than raw test commands.

## Visual Architecture Reference
For visual maps of the operational workflows, consult:
- `docs/diagrams/01-end-to-end-lifecycle.md` (System Lifecycle)
- `docs/diagrams/02-executable-specs-and-slicing.md` (Executable Specs & JIT Slicing)
- `docs/diagrams/03-deterministic-verification-gate.md` (Verification Gate & Circuit Breaker)
- `docs/diagrams/04-token-and-context-architecture.md` (Context Caching & Token Flow)
[cite: 1].