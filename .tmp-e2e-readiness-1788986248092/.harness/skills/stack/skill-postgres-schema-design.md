# Skill: PostgreSQL Schema & Migration Strategy

## Rules & Invariants
- All foreign keys must include explicit index coverage.
- Author migrations with deterministic down/rollback scripts.
- Use `TIMESTAMPTZ` for all temporal columns.