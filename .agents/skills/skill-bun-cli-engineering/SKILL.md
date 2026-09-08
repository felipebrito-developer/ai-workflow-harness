# Skill: Bun CLI & Engine Engineering
- Subprocess execution must use `execa` or native `Bun.spawn` with `{ stdio: "pipe" }`.
- Always return exit code `0` on verified passes and `1` on boundary/test failures.
- Enforce strict type validation using Zod schemas (`z.infer<typeof Schema>`).