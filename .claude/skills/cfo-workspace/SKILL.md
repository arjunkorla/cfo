---
name: cfo-workspace
description: Use when editing or extending the GLOBALCO CFO overview/workspace HTML pages.
---

# CFO workspace pages

Files: `cfo-overview.html`, `cfo-workspace.html` — single-file pages (inline CSS + vanilla JS).
The workspace is a UI/UX prototype that runs on **local sample data by default** (`CFO_SAMPLE`). Never add a production/"Data source not connected" default, a `?mode=` switch or any live API call without explicit authorization (see CLAUDE.md → *CFO Workspace — data modes*).

## Design freeze (non-negotiable)
- Do not change colors, `:root` tokens, fonts, spacing, radius, shadows, icons, layout, or component styles.
- Do not add, remove, or rename styling classes. Primary `#1E439B` is locked.
- New UI reuses existing classes and tokens only (see design-system.md).
- Change only what the task asks; no refactors, libraries, or frameworks; keep one file per page — except the shared parts in `components/` (left navigation, global header, sample data). Change menus in `emagia-nav.config.js` and header content in `emagia-header.config.js` only; don't copy either back into the pages.
- State the functions/blocks you will touch before editing. If any visual change is needed, stop and ask.

## Patterns

### Add a summary state
- States are switched only by `show(s)`; it toggles `#st<Name>` (summary) and `#ch<Name>` (chart) via `MAP`.
- A new state needs: a `MAP` entry, matching `#st…`/`#ch…` containers built from existing `.state`, `.icon-badge`, `.btn` markup, and the name in `show()`'s list. This is a markup change — confirm with the user first.
- Never toggle state containers' `hidden` directly elsewhere.

### Add an action
- Add a button with `data-act="<name>"` using existing classes (`.icon-btn` + `aria-label`, or `.btn .btn-sm .btn-secondary`).
- Handle it as a new `case` in the delegated `document` click switch. Read the current result with `var r=cache[key()]`.
- Toggle actions use `aria-pressed`; persist per-result flags on the cache entry (like `pinned`, `vote`).
- Confirm with `toast(msg, 'success'|'error'|'info')`.

### Add or change an agent / agent data
- All data lives in `CFO_SAMPLE` in `components/cfo-sample-data.js` (shared by both pages; the header search reads it too). The UI reads it only through `listAgents`, `getSummary` and `answer` (plus `format`); keep those contracts unchanged (architecture.md → *Sample data layer*).
- Add an agent by adding an entry to `CATALOG[catId]` (`id, name, description, prompt, chart, insights×3, risks×2, recommendations×2, chips×3`, items built with `I(title, metric, value, impact, sourceId, record)`) **and** a matching `CHIP_ANSWERS[id]` array with one answer per chip (text, or `'topic:N'`). Use a source id from `SRC`.
- Keep figures consistent: reuse the shared values in `HEAD` / `TOPICS`; if a shared figure changes, change it everywhere and update `tests/workspace.test.js`.
- `AGENTS[catId]` in the UI is `CFO_SAMPLE.listAgents(catId)`; `renderAgents()` shows name + description.
- Results are cached per `key()` = `st.cat + '|' + agent().id`; the cache entry holds `data` (the `getSummary` result). Agent click → `selectAgent(i, true)` auto-loads when uncached; refresh (`data-refresh`) forces `summarize()`.
- New chat topics go in `TOPICS` + `TOPIC_ORDER` (more specific topics first).

### Async work
- Keep the single `st.timer` token pattern: `summarize()` guards with `validDates()` and `st.status==='loading'`, sets `st.timer` to a token and ignores a `getSummary` response whose token no longer matches; `stop(true)` clears it before switching agents or categories; results render only if `req.agentKey===key()`.
- Chat uses `pending[key()]` to block duplicate submissions and `chatCtx[key()]` for follow-up context.

## Do
- Grep first, read only relevant ranges, minimal diff.
- Reuse `$()`, `q()`, `esc()` (for any user/agent text in HTML strings), `ic()`, `toast()`, `tok()`.
- Wrap localStorage in `try/catch`; prefix new keys `erms.cfo.`.
- Keep keyboard and aria behavior from ux-rules.md intact; run `node --test tests/workspace.test.js`, `/verify` and `/ui-review`.

## Don't
- Don't edit `<style>`, add inline `style=`, or hard-code colors (use `tok('--…')` in canvas code).
- Don't add classes, wrappers, or icons; don't move panels.
- Don't auto-load on category tab switch.
- Don't bypass `show()`, `cache`, or `stop()`.
- Don't split files or add dependencies.
- Don't put data inside the UI IIFE, call a network API, or show bracketed placeholders; don't label sample replies as AI.

## Knowledge
- [design-system.md](../../knowledge/design-system.md) — tokens and classes (read-only)
- [architecture.md](../../knowledge/architecture.md) — structure, state, functions, params
- [ux-rules.md](../../knowledge/ux-rules.md) — behavior, keyboard, accessibility
