# Skill: 2-Level Context Window Caching

## Objective
Minimize prompt cost across multi-turn agent sessions using structured specification layering.

## Caching Protocol
1. **Level 1 (Anchor):** Always load `.harness/spec/app-summary.md` into the prompt context on session start.
2. **Level 2 (Demand):** Drill down to `.harness/spec/features/<feature>/README.md` and living specs ONLY when actively implementing that feature.
3. **Zero Unneeded Files:** Never load unreferenced source files or entire directories into the context window.