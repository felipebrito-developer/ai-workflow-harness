# Tool Transpiler Adapters & OpenRouter Integration

The Harness framework is natively tool-agnostic, transpiling canonical agent configs into native file formats for OpenCode, Antigravity, and Cursor.

---

## 1. Tool Transpiler Adapters (`@harness/adapters`)

`AdapterCompiler.compileAll()` serializes project configuration into tool-native config files:

- **OpenCode Adapter (`OpenCodeSerializer`):**
  - Generates `opencode.json` and `opencode.md`.
  - Configures agent permission matrix (`architect`, `test-runner`, `code-reviewer`).
  - Sets OpenRouter `baseURL: "https://openrouter.ai/api/v1"` and `promptCaching: true`.
- **Antigravity Adapter (`AntigravitySerializer`):**
  - Generates `antigravity.json`.
  - Registers MCP server configurations (`ai-memory`, `filesystem`, `linear`).
  - Injects executor directives enforcing `task-XXX.md` file boundary rules.
- **Cursor Adapter (`CursorSerializer`):**
  - Generates `.cursorrules` instructing Cursor models to adhere to harness task boundaries.

---

## 2. OpenRouter Model Presets & Prompt Caching

OpenRouter models use standard `openrouter/<vendor>/<model-id>` namespacing with prompt caching enabled:

| Role | Complex — Best | Complex — Efficient | Small — Best | Small — Efficient |
| :--- | :--- | :--- | :--- | :--- |
| **@workflow-orchestrator** | `openrouter/anthropic/claude-3.5-sonnet` | `openrouter/z-ai/glm-5.2` | `openrouter/anthropic/claude-3.5-sonnet` | `openrouter/z-ai/glm-5.2` |
| **@architect-agent** | `openrouter/deepseek/deepseek-r1` | `openrouter/deepseek/deepseek-r1` | `openrouter/anthropic/claude-3.5-sonnet` | `openrouter/z-ai/glm-5.2` |
| **@po-agent** | `openrouter/z-ai/glm-5.2` | `openrouter/z-ai/glm-5.2` | `openrouter/z-ai/glm-5.2` | `openrouter/z-ai/glm-5.2` |
| **@tech-lead** | `openrouter/anthropic/claude-3.5-sonnet` | `openrouter/z-ai/glm-5.2` | `openrouter/anthropic/claude-3.5-sonnet` | `openrouter/qwen/qwen-2.5-coder-32b-instruct` |
| **@designer-lead / UI** | `openrouter/anthropic/claude-3.5-sonnet` | `openrouter/z-ai/glm-5.2` | `openrouter/anthropic/claude-3.5-sonnet` | `openrouter/z-ai/glm-5.2` |
| **<stack>-specialist** | `openrouter/anthropic/claude-3.5-sonnet` | `openrouter/qwen/qwen-2.5-coder-32b-instruct` | `openrouter/anthropic/claude-3.5-sonnet` | `openrouter/qwen/qwen-2.5-coder-32b-instruct` |
| **@db-engineer** | `openrouter/deepseek/deepseek-r1` | `openrouter/deepseek/deepseek-r1` | `openrouter/anthropic/claude-3.5-sonnet` | `openrouter/qwen/qwen-2.5-coder-32b-instruct` |
| **@test-creator** | `openrouter/anthropic/claude-3.5-sonnet` | `openrouter/qwen/qwen-2.5-coder-32b-instruct` | `openrouter/anthropic/claude-3.5-sonnet` | `openrouter/qwen/qwen-2.5-coder-32b-instruct` |
| **@test-runner** | `openrouter/google/gemini-2.5-flash` | `openrouter/google/gemini-2.5-flash` | `openrouter/google/gemini-2.5-flash` | `openrouter/google/gemini-2.5-flash` |
