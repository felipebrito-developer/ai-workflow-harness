# Skill: Wayfinder Planning (Harness-Adapted)

## Objective
Chart large planning efforts that exceed a single session by creating a shared discovery Map, then resolving decision tickets one at a time until the way to the destination is clear.

## Core Principle: Plan, Don't Do
Wayfinder is planning by default. Each ticket resolves a DECISION, not a deliverable. The map is done when all decisions are made and no tickets remain. Produce decisions and specifications, not code.

## The Map
The map is a single markdown file at `.harness/memory/discovery/<feature>-map.md`. It is the canonical planning artifact.

### Map Structure
```
## Destination
<What reaching the end of this map looks like: the spec, decision, or change this effort produces. 1-2 lines.>

## Notes
<Domain context; skills to consult; standing preferences for this effort.>

## Decisions So Far
- [<closed ticket title>]: <one-line gist of the answer>

## Not Yet Specified (Fog of War)
<In-scope areas you can see coming but cannot yet pin down. Graduates to tickets as the frontier advances.>

## Out of Scope
<Work ruled beyond the destination. Never graduates.>
```

## Ticket Types
Each ticket maps to a task manifest in `.harness/tasks/`:

| Wayfinder Type | Harness Manifest | Constraints | Mode |
|:---|:---|:---|:---|
| **Research** (AFK) | `type: research` | No allowedFiles, no verificationCommands | Agent reads docs/APIs alone |
| **Prototype** (HITL) | `type: spike` | allowedFiles max 5, relaxed boundaries | Rapid artifact creation with human |
| **Grilling** (HITL) | No manifest | Interactive Q&A session (3+2 choice rule) | Human in the loop |
| **Task** (standard) | `type: task` | allowedFiles max 2, full verification | Standard boundary-locked execution |

## Fog of War Rules
- The map is deliberately incomplete. Do NOT chart what you cannot yet see.
- **Ticket when**: You can state the question precisely now (even if blocked).
- **Fog when**: You cannot yet phrase it sharply. Do NOT pre-slice fog into ticket-sized pieces.
- Resolving a ticket clears the fog ahead of it, graduating new items into tickets.

## Dependency Frontier
- Use `depends_on` arrays in task manifest frontmatter to model blocking relationships.
- The **frontier** is the set of open, unblocked, unclaimed tasks — the edge of the known.
- A task is unblocked when every task in its `depends_on` array has status `DONE`.

## Workflow
1. Create the Map at `.harness/memory/discovery/<feature>-map.md`
2. Identify the first decisions needed (the initial frontier)
3. Create task manifests for each (research, spike, or standard)
4. Resolve tickets one at a time: update Map's "Decisions So Far" with the answer
5. After each resolution, check if fog has cleared — graduate new tickets if so
6. Repeat until no tickets remain and the way to the destination is clear
7. Hand off the completed spec to the execution phase

## Integration with Harness
- Maps are stored in `.harness/memory/discovery/` (persisted, not gitignored)
- Grilling sessions are logged to `.harness/memory/discovery/<feature>.md`
- Research findings become chunks in the SpecDatabase via `harness feature`
- The PO Agent uses this skill in Phase 2 (epics) and Phase 5 (slicing)
- The Architect Agent uses this skill in Phase 1 (discovery) and Phase 4 (ADRs)
