---
id: {{taskId}}
title: "{{taskTitle}}"
stack: {{stack}}
status: TODO
mode: VARIANT_A
feature_ref: {{featureRef}}
allowedFiles:
  - {{implFile1}}
  - {{implFile2}}
  - {{testFile}}
verificationCommand: {{verificationCommand}}
---

# Task: {{taskTitle}}

## 1. Allowed File Boundaries
- `{{implFile1}}`
- `{{implFile2}}`
- `{{testFile}}`

## 2. Acceptance Criteria
- [ ] AC-1: Verify happy path execution matches executable spec contract
- [ ] AC-2: Verify sad path error handling throws expected exceptions
- [ ] AC-3: Verify edge case boundary invariants hold true

## 3. Verification Commands
```bash
{{verificationCommand}}
```
