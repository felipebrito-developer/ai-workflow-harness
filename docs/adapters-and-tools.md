# Tool Transpiler Adapters & OpenRouter Integration

The Harness framework is natively tool-agnostic, transpiling canonical agent configs into native file formats for OpenCode, Antigravity, and Cursor.

---

## 1. Tool Transpiler Adapters (`@harness/adapters`)

`AdapterCompiler.compileAll()` serializes project configuration into tool-native config files:

- **OpenCode Adapter (`OpenCodeSerializer`):**
  - Generates `opencode.json` and `opencode.md`.
  - Configures agent permission matrix for `@planner` and stack-specific `@builder` agents.
  - Sets OpenRouter `baseURL: "https://openrouter.ai/api/v1"` and `setCacheKey: true` for prompt caching.
- **Antigravity Adapter (`AntigravitySerializer`):**
  - Generates `antigravity.json` and `AGENTS.md`.
  - Registers custom MCP server configurations.
  - Injects executor directives enforcing `task-XXX.md` file boundary rules and `harness verify <taskId>`.
- **Cursor Adapter (`CursorSerializer`):**
  - Generates `.cursor/mcp.json` and `.cursorrules` instructing Cursor models to adhere to harness task boundaries.

---

## 2. 3-Mode Agent Role Mapping & Model Allocation

OpenRouter models use standard `openrouter/<vendor>/<model-id>` namespacing with prompt caching enabled:

| Role | Mode | Description / Model Strategy |
| :--- | :--- | :--- |
| **@planner** | Primary Architect | Architecture planning, living spec slicing (`openrouter/deepseek/deepseek-r1` or `claude-3.5-sonnet`). |
| **@test-creator** | Spec Author | Cryptographically locked TDD Acceptance Criteria generation (`openrouter/anthropic/claude-3.5-sonnet`). |
| **@web-builder** | Subagent Executor | React web frontend TDD implementation (`openrouter/qwen/qwen-2.5-coder-32b-instruct`). |
| **@mobile-builder** | Subagent Executor | React Native mobile TDD implementation (`openrouter/qwen/qwen-2.5-coder-32b-instruct`). |
| **@backend-builder** | Subagent Executor | API & database TDD implementation (`openrouter/qwen/qwen-2.5-coder-32b-instruct`). |
