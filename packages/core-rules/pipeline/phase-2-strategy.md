# Phase 2: Functional Scope & Workflow Strategy

## 1. Objective
Define user journeys, epics, functional requirements, and confirm the AI execution topology. Lead by @po-agent.

## 2. DB-First Specification Storage (ADR-01)
- **Primary Spec Store:** Store all business specs in SQLite `.harness/harness.db` (`spec_topics` with category=`business`, `spec_chunks` with level=`detail`).
- **Context Lookup:** Use the `spec-query` MCP tool (`get_spec("feature", "business")`) for context retrieval rather than loading large markdown files.
- **Git Versioning:** `.harness/harness.db` is un-gitignored (`!harness.db`) and committed as the canonical versioned source of truth.

## 3. Workflow Mode Confirmation
The PO/Architect agent must validate the mode configured in `harness.config.json` against project complexity:

- [ ] **1) Orchestrated (Current Config):** Lead agent coordinates specialist subagents.
- [ ] **2) Solo-Agent:** Single primary agent executes tasks sequentially.
- [ ] **3) Vibe-Assist:** Interactive developer pairing with preflight harness guardrails.
- [ ] **4) Validate what is the best for us:** Agent audits project scope and outputs an evaluation matrix.

### Dynamic Evaluation Matrix (When Option 4 is chosen)
| Mode | Mechanism | Pros | Cons | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Orchestrated** | Multi-agent state machine | Strict boundary gates; low regression bleed | Higher token overhead per turn | High-complexity full-stack apps |
| **Solo-Agent** | Single executor | Direct context continuity; fast velocity | Higher risk of task drift | Small/medium tasks or single-stack repos |
| **Vibe-Assist** | Human-driven prompting | Full manual control | Slower developer iteration | Prototypes & investigative spikes |[cite: 3010, 3012] |