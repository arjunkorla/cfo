---
description: Reproduce a bug, find the root cause, apply a minimal JS-only fix, verify, and hand off to ui-guardian.
argument-hint: <issue description>
---

Fix this issue in the GLOBALCO CFO pages: $ARGUMENTS

Follow `CLAUDE.md` (DESIGN FREEZE) strictly.

1. **Reproduce**: describe the exact steps (page, URL params, clicks/keys) and the observed vs expected behavior, using `.claude/knowledge/ux-rules.md` as the expected behavior.
2. **Locate root cause**: Grep for the relevant functions (see `.claude/knowledge/architecture.md`), read only those ranges, and state the root cause in one sentence.
3. **State scope**: list the exact functions/blocks you will touch before editing.
4. **Fix**: apply a minimal JS-only diff inside the inline `<script>` (delegate to the `js-bugfixer` subagent if useful). No `<style>`, class, markup, or layout changes. If the fix needs a visual change, stop and ask.
5. **Verify**: run the `/verify` checklist.
6. **Hand off**: run the `ui-guardian` subagent on the change and include its PASS/FAIL result.
7. Summarize in 5 bullets or fewer.
