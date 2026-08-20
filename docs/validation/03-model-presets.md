# Validation Step 3: OpenRouter Model Allocation Matrix

Validate that `packages/cli/src/commands/init.ts` maps agent configurations according to these 4 presets:

## Preset 1: complex-best
- workflow-orchestrator: anthropic/claude-3.5-sonnet
- architect-agent: deepseek/deepseek-r1
- po-agent: z-ai/glm-5.2
- tech-lead: anthropic/claude-3.5-sonnet
- designer-lead / UI: anthropic/claude-3.5-sonnet
- stack-specialists: anthropic/claude-3.5-sonnet
- db-engineer: deepseek/deepseek-r1
- test-creator: anthropic/claude-3.5-sonnet
- test-runner: google/gemini-2.5-flash

## Preset 2: complex-efficient (Recommended Low-Cost / Zero Sonnet)
- workflow-orchestrator: z-ai/glm-5.2
- architect-agent: deepseek/deepseek-r1
- po-agent: z-ai/glm-5.2
- tech-lead: z-ai/glm-5.2 (or deepseek/deepseek-chat)
- designer-lead / UI: z-ai/glm-5.2
- stack-specialists: qwen/qwen-2.5-coder-32b-instruct
- db-engineer: deepseek/deepseek-r1
- test-creator: qwen/qwen-2.5-coder-32b-instruct
- test-runner: google/gemini-2.5-flash

## Preset 3: small-best
- workflow-orchestrator: anthropic/claude-3.5-sonnet
- architect-agent: anthropic/claude-3.5-sonnet
- po-agent: z-ai/glm-5.2
- tech-lead: anthropic/claude-3.5-sonnet
- designer-lead / UI: anthropic/claude-3.5-sonnet
- stack-specialists: anthropic/claude-3.5-sonnet
- db-engineer: anthropic/claude-3.5-sonnet
- test-creator: anthropic/claude-3.5-sonnet
- test-runner: google/gemini-2.5-flash

## Preset 4: small-efficient
- workflow-orchestrator: z-ai/glm-5.2
- architect-agent: z-ai/glm-5.2
- po-agent: z-ai/glm-5.2
- tech-lead: qwen/qwen-2.5-coder-32b-instruct
- designer-lead / UI: z-ai/glm-5.2
- stack-specialists: qwen/qwen-2.5-coder-32b-instruct
- db-engineer: qwen/qwen-2.5-coder-32b-instruct
- test-creator: qwen/qwen-2.5-coder-32b-instruct
- test-runner: google/gemini-2.5-flash