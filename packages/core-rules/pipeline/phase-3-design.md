# Phase 3: Visualization & Design Architecture

## 1. File Structure Contract
[cite_start]UI specifications must be divided into registry and component details:

.harness/UI/
[cite_start]├── custom-components-registry.ts        # Index of all reusable components [cite: 1901, 3014]
└── details/<component-name>/
    [cite_start]├── component.md                     # Behaviors, states, props, and subcomponents [cite: 1904, 3014]
    ├── wireframe-ascii.md               # ASCII Block Layout per state [cite: 1905, 3014]
    └── route-flow-mermaid.md            # Mermaid Screen Navigation & Route Flowchart [cite: 1905, 3014]

## 2. Feature UI Spec Contract
[cite_start]Feature-specific UI specs reside at `.harness/spec/features/<feature>/ui/spec.md` [cite: 1905, 3014, 3760] [cite_start]referencing the components defined in `.harness/UI/`[cite: 1901, 1904].