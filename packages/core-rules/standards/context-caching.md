# Context Caching Standard

## 1. 2-Level Cache Architecture
To prevent LLM context saturation, the Harness uses a strict 2-level cache architecture for all planning and execution phases.

### Level 1: Application Summary Anchor
- **Location:** `.harness/spec/app-summary.md`
- **Constraint:** Strictly limited to $\le 250$ lines.
- **Purpose:** Provide high-level architectural constraints, tech stack summary, and core invariants. This file is **always** included in every agent's context window.

### Level 2: Ephemeral Sub-Specs
- **Locations:** `.harness/spec/features/<feature>/[business|ui|technical]/spec.md`
- **Constraint:** Strictly limited to $\le 500$ lines each.
- **Purpose:** Deep-dive context loaded **only** when actively working on the specific feature or layer.

## 2. Enforcement
Agents must NEVER attempt to load the entire codebase or multiple feature specs simultaneously.
