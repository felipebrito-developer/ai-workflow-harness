# Skill: DynamoDB Single-Table Design

## Rules & Invariants
- Model access patterns before defining Partition (`PK`) and Sort (`SK`) keys.
- Use composite sort keys with delimiters (e.g. `USER#123#METADATA`).