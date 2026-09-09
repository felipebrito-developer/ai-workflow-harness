# Skill: TanStack Query Best Practices

## Rules & Invariants
- Declare standardized query keys using array tuples `['resource', id]`.
- Implement optimistic updates for mutating actions with automatic rollback on error.
- Centralize API fetchers in dedicated service modules with typed responses.