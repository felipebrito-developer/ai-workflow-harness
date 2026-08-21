# Phase 5: User Story Slicing & Task Backlog

## 1. Slicing Invariants
- [cite_start]Each task manifest (`.harness/tasks/task-XXX.md`) must touch ≤2 primary files[cite: 3762, 3763].
- [cite_start]Must declare explicit file boundaries, TDD execution mode (`VARIANT_A` or `VARIANT_B`), and exit-0 verification commands[cite: 2137, 3762, 3763].
- [cite_start]Tech Lead decomposes tasks into stack-specific todolists before delegation[cite: 1983].

## 2. DB-First Task Storage & Linear Integration (ADR-01)
- **Database Backlog:** Task metadata, boundary files, and acceptance criteria are stored in SQLite `.harness/harness.db` (`tasks` table).
- **Clean Slate Linear Sync:** Create fresh Linear issues via `linear issue create` derived from DB tasks, avoiding legacy stale ticket references.
- **Traceable Spawn Log Receipts:** Every closed task or circuit breaker trip MUST emit a spawn log receipt to `.harness/memory/spawn-log/` via `SpawnLogger`.[cite: 1983].