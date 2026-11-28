# Coordination PR comment template

Use one short comment per meaningful event. Omit inapplicable fields. Never invent test results or approval.

```text
TYPE: RESERVE | ALERT | REQUEST | ACK | COUNTERPROPOSAL | REVIEW | RESOLVED | CHECKPOINT
FROM: Agent ID
TO: affected agent IDs (or all)
REF: own development PR, exact commit, issue/dependency
FIELD: path / symbol / schema field / contract version
CHANGE: old -> new; what is implemented vs proposed
IMPACT: compatibility, consumers, ownership, migration/rollback
EVIDENCE: actual test command, environment, result or NOT RUN
ACTION: request / reviewer / next executable task
STATUS: open | in progress | resolved (link evidence)
```

End-of-cycle checkpoint may be as short as commit + actual result + affected field + test + next task. Use explicit references to respond to an earlier comment. Do not use this process as a reason to stop implementation.
