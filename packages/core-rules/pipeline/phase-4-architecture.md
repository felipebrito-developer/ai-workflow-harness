# Phase 4: Technical Architecture & Contracts

## 1. Objective
Decide technical stacks, libraries, infrastructure models, data schemas, and deployment targets. Lead by @architect-agent.

## 2. DB-First Specification Storage (ADR-01)
- **Primary Spec Store:** Store technical specs, API contracts, and schemas in SQLite `.harness/harness.db` (`spec_topics` with category=`technical`, `spec_chunks` with level=`detail`).
- **Context Lookup:** Retrieve technical specs via `spec-query` MCP tool (`get_spec("<feature>", "technical")`) rather than loading large text files.
- **Git Versioning:** `.harness/harness.db` is un-gitignored (`!harness.db`) and committed as the versioned source of truth.

## 3. Deliverables
1. Write Architectural Decision Records (ADRs) for database, auth, and state management.
2. Upsert technical specifications (≤500 lines) with complete schemas and endpoint contracts into SQLite `harness.db`.
3. Validate that required specialist agents and stack skills exist before moving to slicing.[cite: 1895, 2071].