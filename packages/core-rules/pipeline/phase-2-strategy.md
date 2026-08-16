# Phase 2: Functional Scope & Workflow Strategy

## 1. Objective
[cite_start]Define user journeys, epics, functional requirements, and confirm the AI execution topology[cite: 3757].

## 2. Workflow Mode Confirmation
[cite_start]The PO/Architect agent must validate the mode configured in `harness.config.json` against project complexity[cite: 1899, 3008]:

- [ ] [cite_start]**1) Orchestrated (Current Config):** Lead agent coordinates specialist subagents[cite: 1899, 2776].
- [ ] [cite_start]**2) Solo-Agent:** Single primary agent executes tasks sequentially[cite: 2776].
- [ ] [cite_start]**3) Vibe-Assist:** Interactive developer pairing with preflight harness guardrails[cite: 2776].
- [ ] [cite_start]**4) Validate what is the best for us:** Agent audits project scope and outputs an evaluation matrix[cite: 1899, 3009, 3010].

### Dynamic Evaluation Matrix (When Option 4 is chosen)
| Mode | Mechanism | Pros | Cons | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Orchestrated** | Multi-agent state machine | Strict boundary gates; low regression bleed | Higher token overhead per turn | [cite_start]High-complexity full-stack apps [cite: 3010, 3012] |
| **Solo-Agent** | Single executor | Direct context continuity; fast velocity | Higher risk of task drift | [cite_start]Small/medium tasks or single-stack repos [cite: 3010, 3012] |
| **Vibe-Assist** | Human-driven prompting | Full manual control | Slower developer iteration | [cite_start]Prototypes & investigative spikes [cite: 3010, 3012] |