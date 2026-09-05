# Skill: Zero-Noise Test Diagnostic Reporting

## Objective
Format test failures into concise, 5-10 line actionable diagnostic cards to prevent LLM prompt context window pollution.

## Diagnostic Card Format
```
┌────────────────────────────────────────────────────────┐
│ ✖ TEST FAILURE: [Suite Name]                           │
├────────────────────────────────────────────────────────┤
│ Target File: <file-path>:<line-number>                  │
│ Expected:    <expected-value>                          │
│ Received:    <actual-value>                            │
└────────────────────────────────────────────────────────┘
```

## Rules
1. Strip ANSI escape codes.
2. Filter out `node_modules/` and runtime internal stack frames.
3. Compress output to <= 10 lines containing only failing file, line, expected, and received values.
