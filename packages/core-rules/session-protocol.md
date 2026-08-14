# Session Protocol & Context Discipline

> **Applies to:** All agents, editors, and terminal CLI sessions.
> **Default Mode:** On-demand reads (never auto-inject entire directories into context)[cite: 8].

---

## 1. Startup Context Discipline (2-Level Cache)
Never load raw source code or all spec files at session initialization. Drill down in strict order:
1. .harness/spec/app-summary.md          → "What is the system & what features exist?" (≤250 lines)  
2. .harness/spec/features//README  → "What is this feature's index & scope?" (≤250 lines)[cite: 10]
3. .harness/tasks/task-XXX.md            → "What is the active atomic task & allowed file boundary?"  
4. .harness/spec/features// → Load technical/ui/business spec ONLY when implementing[cite: 8, 10]

## 2. Invariant Prompt-Cache Anchoring
- System prompt invariants, global rules, and stack summaries form a static, byte-identical top prefix[cite: 3].
- Dynamic content (active `task-XXX.md`, diffs, test output) is appended strictly at the bottom[cite: 13].
- Do not splice dynamic timestamps or session counters into the top-level prompt.

## 3. Session Compaction & Handoff Beacon
When approaching context window limits or completing a work unit:
1. Run `harness verify <task-id>` to ensure the test gate passes exit 0[cite: 13].
2. Write a spawn receipt to `.harness/memory/spawn-log/<agent>-<task-id>.md` (gitignored)[cite: 12, 13].
3. Drop conversation history and start a fresh session targeting the next unblocked task.