# Skill: Static Prefix Context Caching Rules

## Objective
Optimize prompt structure to maximize Prompt Caching hit rates across OpenRouter, Anthropic, and OpenAI provider interfaces.

## Rules
1. **Static Prefix Alignment:** Place all invariant context (system prompts, core rules, skill instructions, tool definitions) at the VERY TOP of the prompt sequence.
2. **Dynamic Trailing Data:** Append per-session variable data (current task manifest, git diff, error cards) strictly at the END of the prompt sequence.
3. **No Interleaved Variables:** Never inject volatile timestamps or session IDs into static prefix blocks.
4. **Cache Key Flag:** Ensure `promptCaching: true` is configured in agent provider declarations to set `cache_control` headers.
