# Skill: Idiomatic Golang Architecture

## Rules & Invariants
- Always accept `context.Context` as the first argument in I/O and database methods.
- Explicitly wrap errors using `fmt.Errorf("action: %w", err)`.
- Use structured logging via standard library `log/slog`.