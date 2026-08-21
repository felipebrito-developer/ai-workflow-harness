# Security Scanner & Verification Gates

The Harness enforces strict, unbypassable security gates and verification rules to prevent secret leaks, broken types, and context window pollution.

---

## 1. 3-Tier Security Scanner (`SecurityScanner`)

Integrated into `harness audit`, `harness preflight`, and `harness verify`:

1. **Secret Leak Regex Interceptor:**
   - Scans uncommitted working tree diffs and staged commits for credentials (`.env`, `AWS_KEY`, `RSA_PRIVATE_KEY`, API tokens).
   - Hard Fails (Exit Code 1) if secrets or unignored `.env` files are detected.
2. **Dependency Vulnerability Inspector:**
   - Executes `bun audit` (Node/Bun), `npm audit`, `pip audit` (Python), `cargo audit` (Rust), and `govulncheck ./...` (Golang).
   - Reports high-severity package vulnerabilities before deployment.
3. **File Boundary Interceptor:**
   - Ensures agents edit ONLY files explicitly listed under `Allowed File Boundaries` in `task-XXX.md`.

---

## 2. Preflight AST Validation Gate (`AstValidator`)

Before code execution:
- Uses `ts-morph` to validate TypeScript AST symbol exports and syntax correctness.
- Echoes an Agent Echo Card summarizing exact file boundaries and acceptance criteria.

---

## 3. Circuit Breaker & Automatic Rollback (`CircuitBreaker`)

To protect LLM context windows from loop exhaustion:
- Tracks consecutive verification test failures in `.harness/memory/attempts/<taskId>.json`.
- **3-Strike Circuit Tripped:** After 3 consecutive failed verification attempts, automatically rolls back working tree changes matching task boundaries and writes a `BLOCKED` receipt to `.harness/memory/spawn-log/circuit-breaker-<taskId>.md`.
