# Go Standards: Summary & Core Invariants

> **Stack:** Go 1.22+ + `golangci-lint` + `go test`
> **Line Limit:** ≤100 lines (Level 1 Index)[cite: 10]

---

## 1. Non-Negotiable Invariants
1. **Explicit Error Handling:** Never ignore returned errors (`_`); wrap errors with context using `fmt.Errorf("action: %w", err)`.
2. **Interface Segregation:** Define interfaces at the consumer site, not the producer site. Keep interfaces small (1–3 methods).
3. **Structured Concurrency:** Always pass `context.Context` as the first argument in blocking calls and goroutines.
4. **Zero Global State:** Inject dependencies via explicit struct constructors (`NewService(...)`).

## 2. Canonical Commands
- **Lint:** `golangci-lint run ./...`
- **Test Runner:** `go test -v -race ./...`

## 3. Detail Specifications (Load On-Demand Only)[cite: 8, 10]
| Domain | Reference Path | When to Load |
| :--- | :--- | :--- |
| Interfaces & DI | [interfaces.md](details/interfaces.md) | Scaffolding new service boundaries |
| Database & SQL | [database.md](details/database.md) | Writing SQL migrations, queries, and repositories |