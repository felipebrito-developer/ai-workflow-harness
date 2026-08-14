# The 5-Phase Planning Pipeline

No implementation code may be written until Phases 1 through 5 are finalized and committed to `.harness/spec/`.

---

## Phase 1: Problem Discovery & Baseline Audit
- **Goal:** Deeply understand the core problem, user personas, and constraints[cite: 10].
- **Ongoing Projects:** Inspect top-level manifest and existing specs (max 3–5 files) to establish baseline[cite: 8].
- **Output:** Raw interview Q&A saved to `.harness/memory/discovery/<feature>.md` (gitignored)[cite: 12].

## Phase 2: Functional Scope & Topology
- **Goal:** Define user journeys, epics, milestones, and AI workflow mode (`solo-agent`, `orchestrated`, `vibe-assist`)[cite: 10, 15].
- **Output:** `.harness/spec/features/<feature>/business/spec.md` (≤500 lines)[cite: 10].

## Phase 3: Visualization (ASCII & State Contracts)
- **Goal:** Define UI layout, interaction states, and screen transitions without token-heavy images[cite: 10].
- **Components Required:**
  1. ASCII Block Wireframe (box layouts for screens)[cite: 10].
  2. UI State Contract Table (`Loading`, `Empty`, `Success`, `Error`).
  3. Mermaid Screen Route Flowchart[cite: 10].
- **Output:** `.harness/spec/features/<feature>/ui/spec.md` (≤500 lines)[cite: 10].

## Phase 4: Technical Specifications & Contracts
- **Goal:** Define data models, database schemas, API payload contracts, and error modes[cite: 10].
- **Output:** `.harness/spec/features/<feature>/technical/spec.md` (≤500 lines, overflow to `details/`)[cite: 10].

## Phase 5: Atomic Task Slicing
- **Goal:** Slice the technical spec into atomic execution manifests (`task-XXX.md`)[cite: 10, 14, 15].
- **Rule:** A task must touch $\le 2$ primary files and be verifiable with a single test command[cite: 13, 15].
- **Output:** `.harness/tasks/task-XXX.md` with explicit file boundaries and acceptance criteria[cite: 13, 15].