---
description: Review the current changes with the ui-guardian and a11y-auditor subagents.
argument-hint: "[optional: files or functions changed]"
---

Review the current changes to the GLOBALCO CFO pages. Scope: $ARGUMENTS

1. Identify what changed (files, functions, line ranges). If the scope is unclear, list the functions edited in this session; ask if still unclear.
2. Run the `ui-guardian` subagent on those changes, passing the files, line ranges, and the original task.
3. Run the `a11y-auditor` subagent on the same changes.
4. Report:

| Reviewer | Result | Findings |
|---|---|---|
| ui-guardian | PASS/FAIL | file:line list |
| a11y-auditor | issues count | file:line list with severity |

Do not fix anything in this command.
