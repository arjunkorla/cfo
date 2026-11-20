---
description: Plan a feature using only existing tokens and classes, wait for approval, then implement it.
argument-hint: <feature spec>
---

Feature request for the GLOBALCO CFO pages: $ARGUMENTS

Follow `CLAUDE.md` (DESIGN FREEZE) and the `cfo-workspace` skill.

## Step 1 — Plan (then STOP)
Output a plan and wait for explicit approval before editing anything:
- **Functions/blocks to touch** — exact names (e.g. `selectAgent`, `show`, the `data-act` switch) and file.
- **New functions** (if any) — name and one-line purpose.
- **Reused classes** — every class the new UI uses, each one listed in `.claude/knowledge/design-system.md`.
- **Reused tokens** — any token referenced (e.g. via `tok('--primary-500')`).
- **State/cache impact** — new `st` fields, `cache` result fields, `show()` states, localStorage keys, URL params.
- **UX/a11y** — which `ux-rules.md` rules apply; keyboard and aria for any new control.
- **Visual change?** — if the spec needs any new style, class, token, icon, or layout change, say so and ask instead of planning around it.

## Step 2 — Implement (only after approval)
- Implement exactly the approved plan with existing tokens and classes only.
- Minimal diff; no refactors; keep the page single-file.
- Run `/verify`, then `/ui-review`.
- Summarize in 5 bullets or fewer.
