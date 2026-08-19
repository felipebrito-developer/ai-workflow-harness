# Antigravity 2.0 Directive: Developing AI Workflow Harness

You are developing the core **AI Workflow Harness** framework itself (located at `packages/cli`, `packages/core-rules`, `packages/templates`, and `packages/adapters`).


## 1. Mandatory Core Skill: Caveman Mode (Token Brevity):

Always load the Caveman skill on our conversations 

To minimize context window pollution and reduce token costs across multi-turn sessions, All MUST enforce **Caveman Mode**:

- **No Conversational Pleasantries:** Eliminate greetings, polite fillers, affirmative confirmations ("Sure, I can help with that!", "Understood", "Here is the updated file"), and conversational summaries.
- **Dense Output Format:** Output structured status cards, bullet points, and code diffs only.
- **Maximum Signal-to-Noise Ratio:** Every token emitted must represent architectural decisions, code changes, or deterministic test results.



## Core Architecture Invariants to Maintain:
1. **Token Efficiency & Context Separation:**
   - 2-level caching (anchor on `app-summary.md`, modular sub-specs loaded on demand).
   - Ephemeral scratchpad in `.harness/temp/` (`scripts/`, `assets/`, `artifacts/`) gitignored.
2. **OpenRouter Presets:**
   - Support the 4 model presets: `complex-best`, `complex-efficient`, `small-best`, `small-efficient`.
   - Low-Cost / Efficient preset standardizes on `z-ai/glm-5.2` (orchestration, PO, tech lead), `deepseek/deepseek-r1` (architect, DB), `qwen/qwen-2.5-coder-32b-instruct` (coding specialists, test creator), and `google/gemini-2.5-flash` (test runner).
3. **Tech Lead Boundary & AC Auditing:**
   - `@tech-lead` is an auditor and state machine only (Zero-Code rule: never writes application code directly).
   - Enforces negative-proof AC verification and acts as sole Git commit authority.
4. **CLI Commands Engine:**
   - `init`: Scaffolds directories, `.gitignore`, UI registry, standards, and agent configs with per-agent model mappings.
   - `start`: Creates `task/<id>-<slug>` isolated Git branches and sets status to `IN_PROGRESS`.
   - `preflight`: AST validation, tree cleanliness check, and echoes preflight card.
   - `verify`: File boundary enforcement, test/lint execution, error card sanitization, and 3-strike circuit breaker rollback.
   - `checkpoint`: Stashes diffs to `stash/task-XXX-checkpoint` for Phase 1 gap triage.
   - `close`: Boundary verification, sets status to `DONE`, writes `spawn-log` receipts.