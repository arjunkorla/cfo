---
description: Run the CFO workspace verification checklist and output a pass/fail table.
argument-hint: "[optional: file or area to focus on]"
---

Verify the current changes against the checklist below. Focus: $ARGUMENTS

Use `.claude/knowledge/ux-rules.md` and `.claude/knowledge/architecture.md` as the expected behavior. Check by reading the changed code paths (and running the page in a browser if a browser tool is available). Mark an item **N/A** only if the change cannot affect it, and **UNVERIFIED** if you could not check it — never mark PASS without checking.

## Checklist
1. **Design unchanged** — no edits to `<style>`, `:root` tokens, classes, inline styles, icons, or layout.
2. **No console errors** — no undefined references, null element lookups, or syntax errors in touched code; page init path (`fillModels`, `setPreset`, `applyNarrow`, `setCategory`, `setFocus`) still runs.
3. **Summary states** — all 5 reachable and mutually exclusive via `show()`:
   - idle (category switch / no cache), loading (agent click or Summarize), success, empty (`?demo=empty`), error (`?demo=error`); chart panel mirrors each.
4. **Keyboard paths** — Ctrl+Enter summarizes; Esc closes feedback then exits focus mode; arrows move focus in category tabs and agent list without loading; Enter/Space on an agent loads; ↑ from first agent → search; ↓ from search → first agent; dialog returns focus.
5. **Responsive 1280px** — below 1280px the right panel hides, chart moves into the Chart tab, tabs switch correctly; above, chart returns to the right panel.
6. **Responsive 768px** — below 768px single column, full-width toolbar, agents panel limited height; sidebar off-canvas below 1024px.
7. **Sample data default** — without `?demo=`, every agent reaches success from `CFO_SAMPLE`; no "Data source not connected", bracketed placeholders or live API calls; sample labels present; `CFO_SAMPLE` contract unchanged.
8. **Regression tests** — `node --test tests/workspace.test.js` actually run; report pass/fail/skipped counts as printed.

## Output
| # | Check | Result (PASS/FAIL/N/A/UNVERIFIED) | Evidence (file:line or step) |
|---|---|---|---|

End with one line: `OVERALL: PASS` or `OVERALL: FAIL`.
