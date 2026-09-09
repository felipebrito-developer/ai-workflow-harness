# Skill: Strict TypeScript & Zod Type Safety

## Rules & Invariants
- Enforce `strict: true` with ZERO usage of `any` (use `unknown` + type guards).
- Derive runtime types from Zod schemas using `z.infer<typeof Schema>`.
- Use discriminated unions for distinct application state representations.
- Maintain explicit return types on all public export functions.