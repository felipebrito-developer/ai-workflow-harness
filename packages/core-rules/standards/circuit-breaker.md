# Circuit Breaker Standard

## 1. The Infinite Loop Problem
Without intervention, AI agents will repeatedly attempt to fix failing tests by making random guesses, eventually corrupting the Git tree and burning massive amounts of tokens.

## 2. 3-Strike Rollback Policy
The `harness verify` command implements a deterministic 3-strike circuit breaker:

1. **Attempt 1 & 2:** If verification commands (tests/linters) fail, the error output is sanitized and fed back to the agent for another attempt.
2. **Attempt 3:** If the task fails 3 consecutive times, the Circuit Breaker trips.
3. **Rollback:** 
   - The current broken state is patched/stashed to `.harness/memory/attempts/`.
   - The working directory is automatically rolled back via `git reset --hard` to the clean Preflight state.
4. **Intervention:** The task is marked as BLOCKED and returned to the Tech Lead for manual triage or re-slicing.
