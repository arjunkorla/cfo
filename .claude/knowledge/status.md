# Status audit — CFO pages

Audit of `cfo-overview.html` and `cfo-workspace.html` as of 2026-11-10. Line numbers refer to the current files and will drift after edits.
Only the two pages, `CLAUDE.md` and `.claude/knowledge/*` were read. The rest of the repository was not scanned.

Abbreviations: **WS** = `cfo-workspace.html`, **OV** = `cfo-overview.html`.

> **CURRENT STATUS — 2026-11-12 (supersedes the Release 1 notes below for the workspace).**
> - **Release 1 was rolled back** on 2026-11-12. `cfo-workspace.html` was restored to the 2026-11-10 pre-Release-1 snapshot (original page + agent-click auto-load fix) and then given the local `CFO_SAMPLE` sample-data layer. Backups: `backups/2026-11-12_pre-rollback/`.
> - **Mode:** local sample data is the default and only mode. There is no production default, no "Data source not connected", no `?mode=demo`. `?demo=error|empty|loading` previews remain, on explicit request only. See `CLAUDE.md` → *CFO Workspace — data modes*.
> - **Release 1 gaps reopened by the rollback:** G2 (no timeout), G4 (requests not abortable; a stopped sample response is ignored by token), G5 (cache key is `category|agent` again), G6 (regenerate drops pin/vote), G7 (threads are per agent, not per summary), G9 (back/forward doesn't restore the agent), G18 (`DEMO` comment). G1 is moot while there is no backend.
> - **Resolved by the sample layer:** placeholder agents, chart data, summary items and chat replies (§2 below) are replaced by `CFO_SAMPLE` data; the missing `database` icon is fixed; the "AI · Mocked" / "Mocked · placeholder data" tags are now "Sample data".
> - **Accessibility debt:** TD-A11Y-1 (repeated "not connected" error) and TD-A11Y-4 (`send()` early return) no longer apply to the current code. TD-A11Y-2 (popstate focus) and TD-A11Y-3 (focus while loading, now ~700 ms) still apply and need re-checking.
> - **Tests:** `node --test tests/workspace.test.js`. The old `tests/r2.test.js` is retired to `tests/retired/r2-release2-tests.js`.
> - Section-level detail below is the **historical 2026-11-10 audit**; line numbers are stale.

> **Release 1 — COMPLETE (accepted 2026-11-11).** No further Release 1 changes unless a critical defect is found.
> Line numbers below predate Release 1, which inserted ~50 lines after WS:613; search by function name.
>
> **Known technical debt from Release 1 accessibility review (accepted, not fixed):**
> - **TD-A11Y-1 (WCAG 4.1.3):** a repeated "Data source not connected" error is not re-announced in full. Only the short toast is heard, because `#stError` text and visibility don't change between requests. On the first error, the alert and the toast are both announced (duplicate). Area: `show()`, `settle()`, `#stError`.
> - **TD-A11Y-2 (WCAG 2.4.3 / 4.1.3):** back/forward (`popstate`) doesn't manage focus. Re-rendering the agent list can drop focus to `<body>`, and a request in flight is cancelled silently. Area: `popstate` handler, `setCategory()`.
> - **TD-A11Y-3 (WCAG 2.4.3):** focus is lost while loading. Summarize is disabled and Retry/Regenerate are hidden, and focus isn't returned when the result or error appears. This predates Release 1; the 30s timeout makes it last longer. Area: `show('loading')`, `summarize()`, `settle()`.
> - **TD-A11Y-4 (WCAG 3.3.1, latent):** `send()` returns early when there is no successful summary, and the submit handler still clears the input without feedback. Not reachable with today's UI. Area: `send()`, `#chatForm` submit handler.
>
> **Release 1 changes:**
> - **Resolved:** G2 (timeout), G4 (abortable requests), G5 (cache key now `category|agent|from|to|provider|model|promptVersion`), G6 (regenerate keeps pin, vote, revision), G7 (threads per summary id), G9 (back/forward restores agent), G18 (`DEMO` comment).
> - **Partly resolved:** G1. Real error paths now exist (not connected, timeout, invalid request/response), but there is still no backend to fail.
> - **Still open:** G3 (offline), G8 (share link doesn't restore a summary), G10–G17, G19.
> - **Modes:** production is the default, and the summarize data source reports "Data source not connected". Demo mode (`?mode=demo`, or any `?demo=` preview) is the existing simulation, still labelled with the existing `AI · Mocked` / `Mocked · placeholder data` tags.

---

## 1. Implemented

### Shared shell (both pages)
| Feature | Description | Implemented by |
|---|---|---|
| Icons | Inline Lucide SVG paths rendered at runtime | `ic()` WS:561, `hydrateIcons()` WS:565 (same in OV) |
| Mobile nav | Off-canvas sidebar < 1024px with scrim, Esc closes | IIFE WS:575-580 / OV:274-279 |
| Toasts | Bottom-right `role="status"` toasts, auto-dismiss 3.88s, dismiss button | `toast()` WS:582-593 / OV:281-292 |
| Skip link | Jumps to `#main` | `.skip` OV:208 (and WS markup) |

### Overview (OV)
| Feature | Description | Implemented by |
|---|---|---|
| Today's date | Eyebrow shows the current date | OV:305 |
| Category cards | 8 cards linking to `cfo-workspace.html?category=<id>` | `CATS` OV:295-304, render OV:306-312 |

### Workspace (WS)
| Feature | Description | Implemented by |
|---|---|---|
| Category tabs | Roving-tabindex tablist, URL `category` param, back/forward | tab build WS:629, keydown WS:631-636, `setCategory()` WS:637, `popstate` WS:652 |
| Agent list | Renders agents with avatar, name, prompt preview, active state | `renderAgents()` WS:656 |
| Agent search | Filters by name and prompt; ↓ to list, ↑ from first row back to search | WS:671-672, list keydown WS:677-684 |
| Agent select + auto-load | Click/Enter loads uncached agent; cached shows instantly; re-click no-op | `selectAgent()` WS:685-693 |
| Agent refresh | Forces regeneration for a row | `data-refresh` handler WS:674 |
| Date range | From/To inputs, Today/7D/30D/Custom presets, validation with `aria-invalid` | `setPreset()` WS:698, `validDates()` WS:706 |
| Provider/model | Model list follows provider | `fillModels()` WS:713, WS:714 |
| Summarize | Ctrl+Enter or button; loading → result | `summarize()` WS:732, keydown WS:926 |
| Stop | Cancels pending generation, restores previous state | `stop()` WS:749, `#stopBtn` WS:754 |
| 5 summary states | idle, loading, success, empty, error; chart panel mirrors | `show()` WS:719, markup WS:438-493, WS:530-539 |
| Result cache | Per `category|agent` result held in memory | `cache` WS:616, `key()` WS:624 |
| Result render | Meta (range, model, time), sections, empty text | `renderResult()` WS:762 |
| Regenerate / Retry | Re-run summarize | `case 'retry'/'regen'` WS:789 |
| Adjust / Try another agent | Focus date or next agent from empty/error | WS:790-794 |
| Copy summary | Clipboard with `execCommand` fallback | `copy()` WS:809-812, WS:795 |
| Share link | Copies URL with `category` + `agent` | WS:797 |
| Pin, like, dislike + feedback | Toggle state on cache entry; feedback form | WS:798-805, `syncVote()`/`closeFeedback()` WS:783-784 |
| Edit prompt | Modal dialog, Save & regenerate | `case 'edit'` WS:806, dialog close WS:813-816 |
| Follow-up chat | Suggested chips + free text, per-agent thread | `renderChips()` WS:820, `send()` WS:823, `renderThread()` WS:827 |
| Chart | Canvas bar/line/pie using tokens, legend, sr-only data table | `drawChart()` WS:840-871 |
| Chart type | Persisted in localStorage | WS:838-839, WS:618 |
| Chart export | PNG and CSV download | `dl()`/`base()` WS:872-873, WS:874-879 |
| Chart fullscreen | Fullscreen API on `#chartContent` | WS:880-881 |
| Chart resize | Redraws on container resize | ResizeObserver WS:882 |
| Panel collapse | Left/right panels, persisted | `setLeft()` WS:886, `setRight()` WS:887, `save()` WS:619 |
| Focus mode | Single-panel view, Esc exits | `setFocus()` WS:888, Esc WS:927-931 |
| Narrow layout | < 1280px chart moves into Summary/Chart tabs | `applyNarrow()` WS:906, `setCenterTab()` WS:912, keydown WS:921 |
| Demo states | `?demo=error|empty|loading` preview | `DEMO` WS:613, WS:740-741, WS:940 |
| Deep link | `?category=&agent=` preselects category and agent | WS:937-939 |

---

## 2. Mocked or placeholder

| Placeholder | Location | Real data or service needed |
|---|---|---|
| `AGENTS` | WS:609-611 (generated, `AGENT_COUNT=4`, bracketed names/prompts) | Agent catalog per category: id, name, prompt (OPEN QUESTION: fields) |
| `MODELS` | WS:608; provider `<option>`s hard-coded in markup WS:399 | Provider list and model list per provider |
| `DATA` | WS:834 (fixed labels/values); chart aria-label says "placeholder data" WS:869 | Chart series returned with each summary |
| `SECTIONS` | WS:757-761; items are bracketed text built in `renderResult()` WS:771-776; source links `href="#"` WS:774 | Summary sections, items, and source references from the summarize response |
| `CHIPS` | WS:819 | Suggested follow-ups (static list or from service — OPEN QUESTION) |
| Summarize `setTimeout` | WS:738-747 (1600ms, status from `DEMO` only) | Summarize API call, cancellable |
| Chat replies | `send()` WS:825 (700ms `setTimeout`, placeholder text) | Chat API tied to a summary |
| PDF export | `case 'pdf': window.print()` WS:796 | Real PDF output (see roadmap Phase 3) |
| Pin | `r.pinned` on in-memory cache entry WS:798 | Persisted pin per summary/user |
| Like/dislike + feedback | `r.vote` in memory WS:799-803; `fbSend` clears text and toasts without sending WS:805 | Feedback endpoint (vote + reason) |
| Prompt edit | `agent().prompt=v` mutates in-memory agent WS:814 | Persisted prompt per agent (scope: user or global — OPEN QUESTION) |
| Thread history | `threads` in memory WS:616, WS:824 | Persisted conversation per summary |
| Error message | Static `[Error message from service]` WS:453 | Error text from the service |
| "Mocked" labels | `AI · Mocked` tag WS:465; `Mocked · placeholder data` tag WS:535 | Removal/relabel when real data lands — **DESIGN APPROVAL REQUIRED** (visible change) |
| Overview agent count | `[#] agents` OV:311 | Agent count per category |
| Shell controls | Sidebar links `href="#"` WS:353-361 / OV:212-220; Search (Ctrl+K), Language, Help, User buttons with no handlers WS:375-378 / OV:234-237 | Host app navigation/menus (out of scope for these pages) |

---

## 3. Gaps and risks

| # | Gap / risk | Evidence |
|---|---|---|
| G1 | **No error path.** The only way to reach `error` is `?demo=error`; there is no request, so no failure, exception or HTTP-status handling exists. | WS:741 |
| G2 | **No timeout.** Generation always resolves after a fixed 1600ms; a real request has no deadline. `?demo=loading` stays in loading forever. | WS:738-747, WS:740 |
| G3 | **No offline handling.** No `online`/`offline` listeners or `navigator.onLine` check anywhere in the script. | WS:596-941 (absence) |
| G4 | **Cancellation is timer-only.** `stop()` only clears `st.timer`; nothing aborts network work. | WS:750 |
| G5 | **Cache ignores date range and model.** `key()` is `category|agent`; after changing dates or model, clicking a cached agent shows the old result. | WS:624, WS:727-731, WS:692 |
| G6 | **Regenerate drops pin and vote.** A new result object replaces the cache entry. | WS:742-743 |
| G7 | **Threads keyed by agent, not summary.** A regenerated summary keeps the previous conversation. | WS:824, WS:828 |
| G8 | **Share link does not restore the summary.** URL carries only `category` + `agent` (no dates, model or summary id); on open, init preselects the agent but shows idle because the cache is in memory. | WS:797, WS:937-939 |
| G9 | **Back/forward ignores `agent`.** `popstate` re-applies category only. | WS:652 |
| G10 | **Feedback text discarded.** | WS:805 |
| G11 | **Prompt edits lost on reload and not scoped.** | WS:814 |
| G12 | **Chat reply not cancellable**; no loading or error state for chat. | WS:823-826 |
| G13 | **Unvalidated localStorage.** Any stored `chartType` string is accepted (non-`bar`/`pie` draws as line); `panels` merged without checks. | WS:617-618, WS:860-866 |
| G14 | **44px design debt.** Interactive controls are 28–36px: `.btn-sm` 32px, `.icon-btn` 32px, `.pill` 32px, `.chip` 28px. Resizing needs design approval. | WS:114, WS:125, WS:203, WS:291 |
| G15 | **No tests.** Neither page has test hooks, and timing is hard-coded (1600ms / 700ms), so tests would depend on wall-clock waits. The repository was not scanned, so tests elsewhere cannot be ruled out (OPEN QUESTION). | WS:747, WS:825 |
| G16 | **Duplicated category list.** `CATS` is defined separately in each page and can drift. | WS:598-607, OV:295-304 |
| G17 | **External font dependency.** Fonts load from Google Fonts; offline or CSP-restricted hosts fall back to system fonts. | WS:7-9 |
| G18 | **Comment/behavior mismatch.** `DEMO` comment lists `'error' | 'empty'`, but `'loading'` is also handled. | WS:613, WS:740, WS:940 |
| G19 | **Deprecated copy fallback.** Uses `document.execCommand('copy')`. | WS:810 |
