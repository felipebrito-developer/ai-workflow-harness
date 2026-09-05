# Project Architecture Master Blueprint: {{projectName}}

> **Stack:** {{stack}}  
> **Package Manager:** {{packageManager}}  
> **Adapters:** {{adapters}}  
> **Last Updated:** {{updatedAt}}

---

## 1. System Vision & Domain Boundaries

- **Core Goal:** Concise high-level description of system purpose.
- **Key Constraints:** Low latency, strict type safety, zero context window bloat.
- **Domain Modules:**
  - `src/core/`: Domain models and business contracts.
  - `src/services/`: Service implementations and protocol adapters.
  - `src/ui/`: Discriminated UI state components.

---

## 2. Executable Specifications Index

All behavioral contracts and system invariants are defined in living test specs:

| Feature / Domain | Spec Contract | Executable Test Suite | Status |
| :--- | :--- | :--- | :--- |
| Core Engine | `src/core/engine.contract.ts` | `tests/core/engine.spec.ts` | ACTIVE |
| API Services | `src/services/api.contract.ts` | `tests/services/api.spec.ts` | ACTIVE |

---

## 3. Technology & Protocol Invariants

1. **Type Safety:** TypeScript strict mode with no explicit `any`.
2. **State Management:** Discriminated state unions for all UI components.
3. **Deterministic Verification:** Passing executable specs via `bun test` is mandatory before merge.

---

## 4. Active Task Backlog

- [ ] `task-001`: Core domain setup
