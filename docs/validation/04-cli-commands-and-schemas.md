# Validation Step 4: CLI Commands Specification & Zod Schemas

Validate the implementation of all 6 CLI commands and Zod schema contracts:

## 1. CLI Commands Behavior
- `harness init`: Scaffolds directories, `.gitignore`, UI registry, standards, and agent configs with per-agent model mappings.
- `harness start <taskId>`: Ensures task branch `task/<id>-<slug>` exists and sets status to `IN_PROGRESS`.
- `harness preflight <taskId>`: Validates AST symbols for allowed files and generates the agent preflight echo card.
- `harness verify <taskId>`: Enforces file boundaries (`git diff`), runs test/lint commands, sanitizes error logs, and triggers 3-strike circuit breaker rollback on repeated failures.
- `harness checkpoint <taskId>`: Stashes diffs to `stash/<taskId>-checkpoint` for Phase 1 gap triage.
- `harness close <taskId>`: Runs final boundary check, sets status to `DONE`, and writes receipt to `.harness/memory/spawn-log/`.

## 2. Zod Schema: HarnessConfig (packages/cli/src/schemas/harness-config.schema.ts)
- version: string
- projectName: string
- stack: array of strings (min 1)
- adapters: array of ('opencode' | 'antigravity' | 'cursor')
- workflowMode: 'orchestrated' | 'solo-agent' | 'vibe-assist'
- provider: object with type ('openrouter' | 'anthropic' | 'openai' | 'custom'), model (string), promptCaching (boolean)
- taskBackend: object with type ('local' | 'linear')
- circuitBreakerLimit: integer (min 1, max 5, default 3)
- commands: object with test (string) and lint (string)

## 3. Zod Schema: TaskManifest (packages/cli/src/schemas/task-manifest.schema.ts)
- id: string regex(/^task-\d+$/)
- title: string
- status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE'
- feature: string
- allowedFiles: array of strings (min 1, max 2)
- acceptanceCriteria: array of strings (min 1, max 4)
- verificationCommands: array of strings (min 1)

## 4. Monorepo Build Command
Ensure the build script runs without errors:
- bun install
- bun run --filter "@harness/*" typecheck
- bun run --filter @harness/cli build