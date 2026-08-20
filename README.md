# AI Workflow Harness (`ai-workflow-harness`)

A standardized, token-efficient, tool-agnostic AI development meta-framework for TypeScript and Go projects. Built for high context hygiene, deterministic verification gates, spec-driven execution, and built-in security auditing.

---

## 📚 Detailed Documentation Index

For detailed architectural deep dives, command guides, and framework specifications, see:

- 🏛️ **[System Architecture & Design](file:///home/chu/AI-project/ai-workflow-harness/docs/architecture.md)** — Monorepo design, SQLite WAL spec engine, `ai-memory` backend, and SOLID principles.
- ⚡ **[CLI Command Reference](file:///home/chu/AI-project/ai-workflow-harness/docs/cli-commands.md)** — Exhaustive guide for `init`, `analyze`, `audit`, `feature`, `start`, `preflight`, `verify`, `checkpoint`, `close`, `agent`, and `mcp`.
- 🔄 **[Planning Engine & Agile Workflow](file:///home/chu/AI-project/ai-workflow-harness/docs/planning-and-agile.md)** — 2-Pass Agile Fast-Track, 5-Phase Waterfall, `RiskEngine` scoring, and Delta Protocol.
- 🔒 **[Security Scanner & Verification Gates](file:///home/chu/AI-project/ai-workflow-harness/docs/security-and-gates.md)** — Secret leak scanner (`.env`, `AWS_KEY`), dependency vulnerability checks (`bun audit`, `govulncheck`), AST validation, and 3-strike circuit breaker rollback.
- 🔌 **[Tool Adapters & OpenRouter Integration](file:///home/chu/AI-project/ai-workflow-harness/docs/adapters-and-tools.md)** — Transpiler adapters for OpenCode, Antigravity, and Cursor, OpenRouter presets, and prompt caching.

---

## 1. What Problems Does the Harness Solve?

When AI agents work on complex software projects without guardrails, they encounter three core failure modes:

1. **Context Loss & Pollution:** Unstructured chat sessions accumulate thousands of lines of raw code, causing token costs to explode and AI models to forget architectural invariants.
2. **Hallucinated Regressions & Broken Files:** Models modify arbitrary files outside their assigned scope, breaking unmonitored packages and introducing secret leaks (`.env`, API keys).
3. **Waterfall Overhead:** Heavy multi-turn planning slows down feature velocity when simple agile iteration is needed.

### Core Goals & Solutions:
- **2-Tier XP Planning Pipeline:** Choose between **Agile Fast-Track (2-Pass)** for rapid feature speed or **Full Waterfall (5-Pass)** for complex enterprise refactors.
- **SQLite WAL Spec Engine (`SpecDatabase`):** Persists features, topics, and tasks in a local SQLite database (`.harness/harness.db`) with automatic Markdown export.
- **Micro-Task Boundary Enforcement:** Agents execute atomic tasks (`task-XXX.md`) constrained to $\le 2$ files. Unpermitted edits are blocked by pre-commit hooks and preflight checks.
- **Automated Security Gates (`SecurityScanner`):** Detects credential leaks, prevents committed `.env` files, and audits package vulnerabilities (`bun audit`, `govulncheck`).
- **3-Strike Circuit Breaker (`CircuitBreaker`):** Tracks verification test failures and automatically rolls back working tree edits after 3 consecutive failures to prevent context window degradation.

---

## 2. System Overview & Monorepo Structure

```
ai-workflow-harness/
├── packages/
│   ├── cli/          # @harness/cli: Command engine, Zod schemas, SQLite DB, Security Scanner
│   ├── core-rules/   # @harness/core-rules: Modular planning standards & protocol guardrails
│   ├── templates/    # @harness/templates: Canonical agent configs & stack standards
│   └── adapters/     # @harness/adapters: Transpilers for OpenCode, Antigravity, and Cursor
├── docs/             # Comprehensive documentation modules
```

---

## 3. Quick Start & CLI Workflow

### Installation

```bash
# Clone & install dependencies
git clone https://github.com/felipebrito-developer/ai-workflow-harness.git
cd ai-workflow-harness
bun install

# Compile standalone binary & link globally
bun run build
sudo ln -sf $(pwd)/packages/cli/bin/harness /usr/local/bin/harness
```

### Essential Commands

```bash
# 1. Initialize harness (auto-runs brownfield discovery on existing repos)
harness init

# 2. Run security & vulnerability audit
harness audit

# 3. Create a feature and generate 1-pass micro-task manifest
harness feature "User Auth" --files "src/auth.ts,tests/auth.test.ts"

# 4. Start task execution (creates task branch)
harness start task-user-auth

# 5. Run preflight AST and secret leak checks
harness preflight task-user-auth

# 6. Verify implementation tests & file boundaries
harness verify task-user-auth

# 7. Close task (marks DONE, exports SQLite DB to Markdown)
harness close task-user-auth
```

---

## 4. OpenRouter Model Presets & Multi-Agent Allocation

Configured in `harness.config.json` with `openrouter/` namespacing and prompt caching enabled:

| Role | Complex — Best | Complex — Efficient | Small — Best | Small — Efficient |
| :--- | :--- | :--- | :--- | :--- |
| **@workflow-orchestrator** | `openrouter/anthropic/claude-3.5-sonnet` | `openrouter/z-ai/glm-5.2` | `openrouter/anthropic/claude-3.5-sonnet` | `openrouter/z-ai/glm-5.2` |
| **@architect-agent** | `openrouter/deepseek/deepseek-r1` | `openrouter/deepseek/deepseek-r1` | `openrouter/anthropic/claude-3.5-sonnet` | `openrouter/z-ai/glm-5.2` |
| **@po-agent** | `openrouter/z-ai/glm-5.2` | `openrouter/z-ai/glm-5.2` | `openrouter/z-ai/glm-5.2` | `openrouter/z-ai/glm-5.2` |
| **@tech-lead** | `openrouter/anthropic/claude-3.5-sonnet` | `openrouter/z-ai/glm-5.2` | `openrouter/anthropic/claude-3.5-sonnet` | `openrouter/qwen/qwen-2.5-coder-32b-instruct` |
| **<stack>-specialist** | `openrouter/anthropic/claude-3.5-sonnet` | `openrouter/qwen/qwen-2.5-coder-32b-instruct` | `openrouter/anthropic/claude-3.5-sonnet` | `openrouter/qwen/qwen-2.5-coder-32b-instruct` |
| **@test-runner** | `openrouter/google/gemini-2.5-flash` | `openrouter/google/gemini-2.5-flash` | `openrouter/google/gemini-2.5-flash` | `openrouter/google/gemini-2.5-flash` |

---

## 5. Development & Testing

Run the full automated test suite (100% coverage verified):

```bash
bun test
```