# React Native Standards: Summary & Core Invariants

> **Stack:** React Native / Expo + TypeScript + Bun Test + Biome[cite: 2]
> **Line Limit:** ≤100 lines (Level 1 Index)[cite: 10]

---

## 1. Non-Negotiable Invariants
1. **Absolute Type Safety:** `strict: true`. No `any` types; use explicit interfaces and discriminated unions[cite: 3].
2. **Local-First Persistence:** SQLite / Drizzle operations must be non-blocking and wrapped in migration-safe repositories[cite: 2].
3. **Neuro-Inclusive / Minimalist UI:** Zero layout thrashing; provide skeleton loaders for async states and clear visual feedback[cite: 4].
4. **Offline Resilience:** State mutations persist locally before dispatching background network sync.

## 2. Canonical Commands
- **Lint & Format:** `bun biome check .`
- **Typecheck:** `bun tsc --noEmit`
- **Test Runner:** `bun test`

## 3. Detail Specifications (Load On-Demand Only)[cite: 8, 10]
| Domain | Reference Path | When to Load |
| :--- | :--- | :--- |
| Components & UI | [components.md](details/components.md) | Editing `.tsx` screens, components, or styles |
| State Management | [state.md](details/state.md) | Working with Jotai/Zustand global stores |
| Local Storage | [storage.md](details/storage.md) | Writing SQLite schemas, migrations, or cache layers[cite: 2, 4] |