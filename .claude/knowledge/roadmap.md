# Development roadmap — CFO pages

> **Note 2026-11-12 — sample-data-first direction.** This roadmap was written for the pre-rollback plan (Release 1 production default, Release 2 engine in the page). Release 1 was rolled back and Release 2 is paused; the workspace now runs on the local `CFO_SAMPLE` sample-data layer by default. Items that assume a production default, "Data source not connected", `?mode=demo` or `tests/r2.test.js` are superseded — see `CLAUDE.md`, `architecture.md` and `ux-rules.md`, which take precedence. Any move to live data requires explicit authorization.

Based on `status.md` (2026-11-10). Gap IDs (G#) refer to `status.md` §3; line numbers refer to `cfo-workspace.html` (WS) and `cfo-overview.html` (OV) as of that audit.

**Rules for every item:** design freeze per `CLAUDE.md`. Every item below is **"no visual change"** unless it is marked **DESIGN APPROVAL REQUIRED**, in which case its implementation is not planned here. Everything stays inside the single inline `<script>` of each page. Nothing here invents endpoint URLs or response fields; anything the backend must define is listed as an **OPEN QUESTION**.

---

## Phase 1 — Data integration

### 1.1 `api` module object
- **Touches:** new `var api={…}` and `var USE_MOCK=…` declared next to the placeholders (after WS:613). No other code changes in this item.
- **Shape:**
  - `api.getAgents(category)` → Promise of agent list
  - `api.getModels(provider)` → Promise of model names
  - `api.summarize({agentId, from, to, provider, model, prompt}, signal)` → Promise of result
  - `api.chat({agentId, summaryId, message}, signal)` → Promise of reply
- **Mock fallback:** when `USE_MOCK` is true, each method resolves from the current placeholders (`AGENTS`, `MODELS`, `SECTIONS`/`DATA`, the chat placeholder text). It honours `signal` (rejects with an abort error) and keeps `?demo=` behaviour (WS:740-741).
- **Transport:** `fetch` with `signal`. Base URL, auth and headers are OPEN QUESTIONS (Q1–Q3).
- **How `USE_MOCK` is set** (constant, URL param or host config): OPEN QUESTION Q4.
- **No visual change.**

### 1.2 `summarize()` → `fetch` + `AbortController`
- **Touches:** `summarize()` WS:732-748, `stop()` WS:749-753, `st` declaration WS:615 (replace `timer` with `ctrl`).
- **Change:**
  - `summarize()` creates `st.ctrl = new AbortController()` and calls `api.summarize(req, st.ctrl.signal)`.
  - On resolve it writes `cache[req.agentKey]`, then renders only if `req.agentKey === key()`. This keeps the current guard at WS:744.
  - `stop()` calls `st.ctrl.abort()` instead of `clearTimeout`. An aborted promise is ignored (no toast, no state change), because `stop()` already restores the state.
  - `selectAgent()` and `setCategory()` need no change, because they already call `stop(true)` (WS:688, WS:639).
- **Fixes:** G1, G4.
- **No visual change.**

### 1.3 Map responses onto existing states
- **Touches:** the resolve/reject branches inside `summarize()`.
- **Mapping:**
  - Success with content → `show('success')`.
  - "No data" → `show('empty')`.
  - Any rejection, non-2xx response or malformed body → `show('error')`.
- **Error text:** write the service's error text into the existing `#stError p` (WS:453) with `textContent`. This changes content only, not styling.
- **How the backend signals "empty":** OPEN QUESTION Q6.
- **Toasts:** keep the existing three texts (WS:746).
- **No visual change.**

### 1.4 `SECTIONS` and chart `DATA` from the response
- **Touches:** `renderResult()` WS:762-780 and `drawChart()` WS:840-871. The chart reads `cache[key()].chart` instead of the global `DATA` (WS:834); `dlCsv` handler WS:875-879 and the canvas aria-label WS:869 change the same way.
- **Change:**
  - `SECTIONS` (WS:757-761) stays as the presentation map from section to `icon`/`tone`. Items and sources come from the response.
  - Source links use the response's URL instead of `href="#"` (WS:774).
  - Drop the word "placeholder" from the chart aria-label once real data is shown.
- **Response shape** for sections, items, sources and chart series: OPEN QUESTIONS Q7–Q9.
- **No visual change.**

### 1.5 Agents and models from the API
- **Touches:** `setCategory()` WS:637-651, `renderAgents()` WS:656-670, init WS:937-939, `fillModels()` WS:713, provider `<option>`s WS:399 (these become JS-filled, which is a content change only).
- **Change:**
  - `setCategory()` awaits `api.getAgents(id)` before `renderAgents()`/`restore()`.
  - While waiting, and on failure, set text in the existing `#agentEmpty` status element (WS:420). The wording is OPEN QUESTION Q12.
  - Init resolves the `agent` URL param only after the list loads.
  - `fillModels()` awaits `api.getModels(provider)`.
- **Where the provider list comes from:** OPEN QUESTION Q5.
- **No visual change** (reuses existing element and class).

### 1.6 Mock labels
- The `AI · Mocked` tag (WS:465) and the `Mocked · placeholder data` tag (WS:535) need relabelling or removal when real data is live. This is **DESIGN APPROVAL REQUIRED** and is not planned here.

---

## Phase 2 — Persistence

| Item | Touches | Change | No visual change |
|---|---|---|---|
| 2.1 Pin | `case 'pin'` WS:798 | Call the API, then set `aria-pressed` from the response. On failure, revert and show `toast(…,'error')`. Endpoint: OPEN QUESTION Q13 | ✔ |
| 2.2 Vote + feedback | `case 'like'/'dislike'/'fbSend'` WS:799-805 | Send vote and reason (fixes G10). Keep the current toasts. Endpoint: Q13 | ✔ |
| 2.3 Prompt edits | dialog close handler WS:813-816 | Persist the prompt, then `summarize()`. Scope (user vs global) and versioning: Q14 (fixes G11) | ✔ |
| 2.4 Thread history | `send()` WS:823-826, `renderThread()` WS:827-831, `threads` WS:616 | Key threads by summary id instead of `key()` (fixes G7). Load the thread with the summary. Call `api.chat` with an `AbortController`; abort it in `stop()`/agent switch (G12) | ✔ |
| 2.5 Keep pin/vote across regenerate | `summarize()` resolve WS:742 | Behaviour decision: does a regenerated summary inherit pin/vote? OPEN QUESTION Q15 (G6) | ✔ |
| 2.6 Share link restores summary | `case 'share'` WS:797, init WS:937-940, `popstate` WS:652 | Add the summary id to the URL; init fetches that summary and shows it via `renderResult()`/`show()`. `popstate` also re-applies `agent` (G9). Fetch-by-id endpoint, access rules and expiry: Q16–Q17 (G8) | ✔ |
| 2.7 Cache key | `key()` WS:624 | Whether the key should include dates and model (G5) changes the ux-rules "cached shows instantly" rule. OPEN QUESTION Q18; update `ux-rules.md` if changed | ✔ |

---

## Phase 3 — Export

- **3.1 PDF export** — touches `case 'pdf'` WS:796.
  - **Options:**
    - (a) A backend endpoint renders the summary to PDF; the page downloads it with the existing `dl()` (WS:872).
    - (b) Keep the browser print path, which already uses `@media print` (WS:339-345), and label it as print.
    - (c) A client PDF library. This violates the "no new libraries" rule in `CLAUDE.md` and **NEEDS APPROVAL**.
  - **Recommended:** (a), with the server reusing the existing print CSS for layout. Whether the backend can render it is OPEN QUESTION Q19.
  - **No visual change.** (Renaming the button's aria-label/title to "Print" under option b is a text change; confirm with design.)

---

## Phase 4 — Quality

### 4.1 Request timeout
- **Touches:** `summarize()`, `api.chat` call sites.
- **Change:** a timer calls `st.ctrl.abort('timeout')`. A timeout maps to `show('error')` with a timeout message in `#stError p`. The `?demo=loading` mock path stays unbounded on purpose.
- **Duration:** OPEN QUESTION Q20 (fixes G2).
- **No visual change.**

### 4.2 Retry
- **Touches:** `summarize()`; the existing Retry button `data-act="retry"` WS:454 and WS:532.
- **Change:** manual retry already exists. Automatic retries (count, backoff, which errors qualify) are OPEN QUESTION Q21.
- **No visual change.**

### 4.3 Offline handling
- **Touches:** new `online`/`offline` listeners in the Global keys/Init area (WS:924-941), plus `summarize()`.
- **Change:** if `navigator.onLine === false`, go straight to `show('error')` with an offline message, and toast on `offline`. Do not auto-resume on `online`; the user presses Retry.
- **Fixes:** G3.
- **No visual change.**

### 4.4 Input hardening
- **Touches:** localStorage reads at WS:617-618.
- **Change:** accept only `bar|line|pie` and boolean/known `panels` values.
- **Fixes:** G13.
- **No visual change.**

### 4.5 Test plan (Playwright)
Playwright adds dev tooling outside the pages, so it **NEEDS APPROVAL** (CLAUDE.md "no new libraries"; Q22). It runs against `USE_MOCK=true`, so it does not depend on the backend.
- **States:** idle on load; loading after agent click; success with summary and chart; `?demo=empty`; `?demo=error`; `?demo=loading`; Stop restores the previous state; switching agents mid-load shows only the second result.
- **Cache:** a second click on a cached agent makes no request (spy on `api.summarize`); re-click on the active agent is a no-op; refresh forces a request.
- **Keyboard:** Ctrl+Enter; Esc closes feedback, then exits focus mode; arrows and Home/End on category tabs and agent list move focus without loading; Enter and Space on an agent load; ↑ from first agent → search; ↓ from search → first agent; dialog returns focus to Edit prompt; Summary/Chart tabs ←/→ at < 1280px.
- **Validation:** invalid range shows `#dateErr`, sets `aria-invalid`, focuses `#from`, sends no request.
- **Breakpoints:** 1280 vs 1279px (chart moves into `#chartPane`; right focus becomes center); 768 vs 767px (single column, full-width toolbar); 1023px (sidebar off-canvas, menu button, Esc closes).
- **URLs:** `?category=` (valid and invalid fall back to `credit`); `?category=&agent=`; share link copy → open in a new page → same summary (after 2.6); back/forward.
- **Exports:** PNG/CSV downloads only in success; Copy writes to the clipboard.
- **Hygiene:** fail on any `console.error` or `pageerror`.
- Replace the fixed mock delays (WS:747, WS:825) with a constant that tests can shorten (no visual change).

---

## Phase 5 — Decision: keep plain HTML vs port to the React/Vite/TS/Tailwind admin module — **NEEDS APPROVAL**

The pages already mirror the admin app. Comments reference `ToastProvider` (WS:156), `ModuleTabsLayout / TabStrip` (WS:187), `Modal.tsx` (WS:308) and `lucide-react v0.454` (WS:559).

| Factor | Keep plain HTML | Port to React/Vite/TS/Tailwind |
|---|---|---|
| Effort | Low: Phases 1–4 land in-place | High: rebuild ~380 lines of JS and the panel layout as components, plus the same API work. Size depends on Q23–Q24 |
| Token reuse | Exact: `:root` tokens in use today | Tokens must be mapped to the module's Tailwind theme. Whether its theme already matches these values is unknown (Q24) |
| Shared code | `CATS` and the shell are duplicated per page (G16) | Reuses the app's real shell, toasts, modal, tabs and auth |
| Risk | Grows harder to maintain as features land; no type safety; duplicated shell drifts | Pixel drift during the port breaks the design freeze; regression risk across 5 states, keyboard maps and breakpoints |
| Dependencies | None beyond Google Fonts (G17) | Build pipeline, module routing and auth (Q23) |
| Testing | Playwright against static files | Playwright against the app route; component tests possible |

**Recommendation (not a decision):** finish Phase 1 in plain HTML behind `USE_MOCK`, so the API contract is settled first. Then decide on the port, using the Phase 4 Playwright suite as the parity gate. If the port is approved, port with a visual-diff check against the current pages.

---

## OPEN QUESTIONS (backend / product / design)

| ID | Question |
|---|---|
| Q1 | Base URL and environment configuration for the API? |
| Q2 | Auth mechanism (cookie session, bearer token) and how the page obtains it? |
| Q3 | Required headers (tenant/company id, locale, CSRF)? |
| Q4 | How is `USE_MOCK` controlled (constant, URL param, host config)? |
| Q5 | Is there a provider-list endpoint, or are providers fixed? Model list fields per provider? |
| Q6 | How does the summarize response signal "no data" vs success vs error (status codes, field)? |
| Q7 | Summarize response: summary id, generated time, sections (names, items, order)? |
| Q8 | Source reference fields per item (label, URL, record id)? |
| Q9 | Chart series format (labels, values, units, multiple series)? Does chart type depend on the data? |
| Q10 | Is summarize synchronous, streaming or job-based (poll)? |
| Q11 | Agent fields: id, name, prompt, category, ordering, counts (OV:311 `[#] agents`)? |
| Q12 | Loading/error wording for the agent list in `#agentEmpty` (text only)? |
| Q13 | Pin and feedback endpoints; is pin per user or shared? |
| Q14 | Prompt edit scope (per user or global), versioning and permissions? |
| Q15 | Should a regenerated summary keep the previous pin/vote? |
| Q16 | Endpoint to fetch a summary by id for share links? |
| Q17 | Who may open a shared summary, and do links expire? |
| Q18 | Should the cache/summary identity include date range and model? |
| Q19 | Can the backend render PDF, and from which template/CSS? |
| Q20 | Timeout duration for summarize and chat? |
| Q21 | Automatic retry policy (count, backoff, retriable errors)? |
| Q22 | Approval to add Playwright as dev-only tooling, and where the tests live? |
| Q23 | Target admin module: repo, routing, auth integration, release process? |
| Q24 | Does the module's Tailwind theme already define these tokens/values? |
| Q25 | Are there existing tests elsewhere in the repository (not scanned in this audit)? |
| Q26 | Design: what happens to the "Mocked" tags (WS:465, WS:535) when data is live? |
| Q27 | Chat API: streaming or not, message history format, rate limits? Are `CHIPS` static or served? |

---

## Backlog

| ID | Item | Phase | Files/functions | Size (S/M/L) | Dependency | Open question |
|---|---|---|---|---|---|---|
| B1 | `api` module + `USE_MOCK` mock implementations | 1 | WS script (after WS:613) | M | — | Q1–Q4 |
| B2 | `summarize()` via `api.summarize` + `AbortController`; `stop()` aborts | 1 | `summarize()`, `stop()`, `st` | M | B1 | Q10 |
| B3 | Map response → success/empty/error; service error text | 1 | `summarize()`, `#stError p` | S | B2 | Q6 |
| B4 | Sections, sources, chart from response | 1 | `renderResult()`, `drawChart()`, `dlCsv` handler | M | B2 | Q7–Q9 |
| B5 | Agents from `api.getAgents` | 1 | `setCategory()`, `renderAgents()`, init, `#agentEmpty` | M | B1 | Q11, Q12 |
| B6 | Models from `api.getModels`; providers from source | 1 | `fillModels()`, provider options | S | B1 | Q5 |
| B7 | Mock labels relabel/remove — **DESIGN APPROVAL REQUIRED** | 1 | WS:465, WS:535 | — | B4 | Q26 |
| B8 | Overview agent count | 1 | OV:306-312 | S | B5 | Q11 |
| B9 | Persist pin | 2 | `case 'pin'` | S | B1 | Q13 |
| B10 | Persist vote + feedback text | 2 | `case 'like'/'dislike'/'fbSend'` | S | B1 | Q13 |
| B11 | Persist prompt edits | 2 | `promptDlg` close handler | S | B1 | Q14 |
| B12 | Chat via `api.chat`, threads keyed by summary id, abortable | 2 | `send()`, `renderThread()`, `threads`, `stop()` | M | B2 | Q7, Q27 |
| B13 | Pin/vote across regenerate | 2 | `summarize()` resolve | S | B9, B10 | Q15 |
| B14 | Share link restores summary; `popstate` applies `agent` | 2 | `case 'share'`, init, `popstate` | M | B4 | Q16, Q17 |
| B15 | Cache key includes dates/model (if approved) | 2 | `key()`, `ux-rules.md` | S | — | Q18 |
| B16 | PDF export path | 3 | `case 'pdf'`, `dl()` | M | backend | Q19 |
| B17 | Request timeout → error state | 4 | `summarize()`, chat calls | S | B2, B12 | Q20 |
| B18 | Auto-retry policy | 4 | `summarize()` | S | B17 | Q21 |
| B19 | Offline detection → error state | 4 | new listeners near WS:924, `summarize()` | S | B2 | — |
| B20 | Validate localStorage values | 4 | WS:617-618 | S | — | — |
| B21 | Configurable mock delay for tests | 4 | WS:747, WS:825 (or mock in B1) | S | B1 | — |
| B22 | Playwright suite (states, keyboard, breakpoints, URLs, share) — **NEEDS APPROVAL** | 4 | new test files (outside pages) | L | B1, B21 | Q22, Q25 |
| B23 | Single source for `CATS` (if staying plain HTML) | 5 | WS:598-607, OV:295-304 | S | Decision | Q23 |
| B24 | Plain HTML vs React port decision — **NEEDS APPROVAL** | 5 | — | — | B1–B4, B22 | Q23, Q24 |
| B25 | 44px target debt — **DESIGN APPROVAL REQUIRED** | — | WS:114, WS:125, WS:203, WS:291 | — | Design | — |
