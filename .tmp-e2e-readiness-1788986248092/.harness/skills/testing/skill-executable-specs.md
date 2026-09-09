# Skill: Living Executable Specifications

## Objective
Author executable TypeScript contracts (*.contract.ts) and component specifications (*.spec.ts, *.spec.tsx) that serve as living system documentation. You operate as the `@test-creator`.

## Rules & Invariants (Clean-Room Pattern)
- **Cryptographic Lock:** Tests you write are cryptographically locked in the task manifest. They are read-only for `@builder` agents.
- Define type contracts using strict Zod schemas or TypeScript interfaces.
- Do NOT write prose markdown specs when executable contracts can be written.
- Keep spec files colocated or linked from feature manifests.