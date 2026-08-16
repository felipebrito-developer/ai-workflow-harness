# Phase 1: Problem Discovery & Baseline Audit

## 1. Objective
[cite_start]Identify system goals, user personas, problem constraints, and codebase baseline before generating technical solutions[cite: 3754, 3755].

## 2. Interactive Q&A Template
[cite_start]All diagnostic questions must follow one of these three formats[cite: 3007]:

### Format A: Single / Multiple Choice (Strict 3+2 Rule)
[cite_start]Must contain maximum 3 high-priority recommendations [cite: 1898, 3007][cite_start], plus standard options 4 and 5:

### [Q-ID] <Question Title>
[cite_start]**Context:** <1-2 sentences explaining why this architectural decision matters> [cite: 3007]

- [ ] **1)** <Recommendation 1 (Default / Recommended)>
- [ ] **2)** <Recommendation 2>
- [ ] **3)** <Recommendation 3>
- [ ] [cite_start]**4) Other:** <Descriptive input for custom combination or solution> 
- [ ] [cite_start]**5) Explain it better:** <Request agent to supply trade-offs and deeper context> 

### Format B: Descriptive Question
[cite_start]Used only when open-ended domain knowledge or user credentials/keys are needed:

### [Q-ID] <Question Title>
**Context:** <Explanation of need>
**Prompt:** <Clear description of required input>

## 3. Persisted Artifacts
- [cite_start]Save raw transcripts to `.harness/memory/discovery/<feature>.md` (gitignored)[cite: 3756].
- [cite_start]Distill final summary into `.harness/spec/features/<feature>/business/spec.md`[cite: 3757].