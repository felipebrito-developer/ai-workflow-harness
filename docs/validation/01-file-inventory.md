# Validation Step 1: Monorepo File Inventory

Validate that every file and directory in this tree exists in the repository with the specified role:

## Root Level
- package.json (Workspace root defining packages/cli, packages/core-rules, packages/templates)
- tsconfig.base.json (Shared TypeScript configuration)
- .agents/rules/harness-meta-development.md (Antigravity 2.0 directive)
- docs/HARNESS_ARCHITECTURE_HANDOVER.md (High-level architecture documentation)

## Package: packages/cli
- package.json (Defines @harness/cli binary)
- tsconfig.json
- src/index.ts (Commander binary entrypoint)
- src/commands/init.ts (Interactive setup wizard)
- src/commands/start.ts (Task isolation and branch manager)
- src/commands/preflight.ts (AST validation and preflight echo generator)
- src/commands/verify.ts (Boundary checker, test runner, circuit breaker)
- src/commands/checkpoint.ts (Delta protocol diff stashing)
- src/commands/close.ts (Final verification and spawn-log writer)
- src/engines/git-manager.ts (Git operations, branch isolation, boundary diffs)
- src/engines/circuit-breaker.ts (3-strike failure counter & automated rollback)
- src/engines/error-sanitizer.ts (Zero-noise test log compressor)
- src/engines/ast-validator.ts (TypeScript AST symbol boundary validator)
- src/parsers/task-parser.ts (Markdown task manifest parser)
- src/schemas/harness-config.schema.ts (Zod schema for harness.config.json)
- src/schemas/task-manifest.schema.ts (Zod schema for task manifests)
- src/serializers/index.ts (AdapterCompiler orchestrator)
- src/serializers/opencode-adapter.ts (Transpiler for OpenCode)
- src/serializers/antigravity-adapter.ts (Transpiler for Antigravity)
- src/serializers/cursor-adapter.ts (Transpiler for Cursor)

## Package: packages/core-rules
- package.json
- pipeline/phase-1-discovery.md (Phase 1: 3+2 Q&A interview rules)
- pipeline/phase-2-strategy.md (Phase 2: Topology evaluation matrix)
- pipeline/phase-3-design.md (Phase 3: Visual architecture & wireframe rules)
- pipeline/phase-4-architecture.md (Phase 4: Tech specs & ADRs <=500 lines)
- pipeline/phase-5-slicing.md (Phase 5: Micro-task slicing rules <=2 files)
- standards/context-caching.md (2-level cache standard)
- standards/circuit-breaker.md (Rollback policy)
- standards/delta-protocol.md (Mid-task gap triage)
- standards/git-governance.md (Tech Lead sole commit authority)

## Package: packages/templates
- package.json
- agents/workflow-orchestrator.json
- agents/architect-agent.json
- agents/po-agent.json
- agents/tech-lead.json (Zero-Code rule & sole commit authority)
- agents/designer-lead.json
- agents/designer-ui.json
- agents/test-creator.json
- agents/test-runner.json (Read-only executor)
- agents/web-specialist.json
- agents/react-native-specialist.json
- agents/node-specialist.json
- agents/go-specialist.json
- agents/db-engineer.json
- agents/python-specialist.json
- skills/core/skill-caveman.md
- skills/core/skill-context-caching.md
- skills/stack/skill-tailwind-shadcn.md
- skills/stack/skill-tanstack-query.md
- skills/stack/skill-expo-router.md
- skills/stack/skill-typescript-strict.md
- skills/stack/skill-fastify-clean-arch.md
- skills/stack/skill-idiomatic-go.md
- skills/stack/skill-sqlc.md
- skills/stack/skill-postgres-schema-design.md
- skills/stack/skill-dynamodb-single-table.md
- skills/testing/skill-tdd-assertions.md
- skills/testing/skill-zero-noise-reporter.md
- UI/custom-components-registry.ts (Registry TypeScript interface)
- UI/details/component-template/component.md
- UI/details/component-template/wireframe-ascii.md
- UI/details/component-template/route-flow-mermaid.md