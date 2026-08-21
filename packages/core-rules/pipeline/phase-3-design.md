# Phase 3: Visualization & Design Architecture

## 1. File Structure & Component Registry Contract
UI specifications and component layouts are registered in:

.harness/UI/
├── custom-components-registry.ts        # Index of all reusable components
└── details/<component-name>/
    ├── component.md                     # Behaviors, states, props, and subcomponents
    ├── wireframe-ascii.md               # ASCII Block Layout per state
    └── route-flow-mermaid.md            # Mermaid Screen Navigation & Route Flowchart

## 2. DB-First Feature UI Spec Contract (ADR-01)
- **Primary Spec Store:** Store feature UI specs in SQLite `.harness/harness.db` (`spec_topics` with category=`ui`, `spec_chunks` with level=`detail`).
- **Context Lookup:** Retrieve UI specs via `spec-query` MCP tool (`get_spec("<feature>", "ui")`) referencing components defined in `.harness/UI/`.
- **Git Versioning:** `.harness/harness.db` is un-gitignored (`!harness.db`) and committed as the versioned source of truth.[cite: 1901, 1904].