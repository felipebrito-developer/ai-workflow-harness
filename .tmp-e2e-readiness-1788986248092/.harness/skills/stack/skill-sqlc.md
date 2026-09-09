# Skill: sqlc Type-Safe SQL Queries

## Rules & Invariants
- Author pure SQL queries with annotated query names `-- name: GetUser :one`.
- Run `sqlc generate` to produce type-safe Go structs without ORM overhead.