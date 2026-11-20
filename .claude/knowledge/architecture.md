# Architecture

Two parts:
- **Part A** describes the **CFO Workspace prototype** as it is today: sample-data-first, working, design-frozen.
- **Part B** summarises the **approved target architecture** (React). Its details live in `cfo-platform-spec.md`.

Reference only, written from the current code (2026-11-12, after the rollback to the pre-Release-1 baseline plus the `CFO_SAMPLE` layer). Line numbers drift; locate things with Grep.

# Part A — `cfo-workspace.html` (current, sample-data-first)

## Script layout
1. In `<head>`: page `<style>` (unchanged), then `components/emagia-sidebar.css` and `components/emagia-header.css`.
2. `<aside data-emagia-sidebar>` + nav config/component scripts; `<header class="topbar" data-emagia-header data-page="…">` + header config/component scripts (both render synchronously, so `#menuBtn` and `#crumbCat` exist before the page script runs).
3. `<script src="components/cfo-sample-data.js">` — **`var CFO_SAMPLE=(function(){…})();`**, the sample data layer (no DOM access). Loaded by both pages.
4. Inline page script: shared shell (`ICONS`, `ic()`, `hydrateIcons()`, mobile nav, `toast()`), then the UI IIFE — reads data only through `CFO_SAMPLE`.

## Shared global header (`components/`, both pages)
- `emagia-header.config.js` → `window.EMAGIA_HEADER_CONFIG`: `branding` (mode `emagia|client`; Emagia uses `assets/emagia-gia-logo.png` — the same file as ERMS `src/img/gia.png`; `client` is null until an approved client asset exists; `href` null), `languages` (11 approved items, `defaultCode:'en'`, `flagPath`, `storageKey:'erms.emagia.language'`), `search` (`placeholder`, `maxResults`, `workspaceHref`, `pages`), `pages.{overview,workspace}` (`crumbs`, `helpTitle`, `help` sections), `shortcuts` (groups `{heading, page?, items:[{keys, or?, description}]}`; only implemented keys; `or` = alternative keys), `user` (`name`, `initial`, `note`, `menu` = the 7 System Admin items `{id, label, icon, separatorBefore?}`), `modals` (title, description, icon and notice text per popup id), `notifications` (`storageKey:'erms.emagia.notifications'`, 5 UI-only items with `default:false`), `about`.
- `emagia-header.js` renders into the `<header>` and keeps `#menuBtn` (page mobile nav) and `#crumbCat` (updated by the workspace's `setCategory`). Sections: Brand (image → text fallback on error) · Breadcrumbs (links only for real destinations; current label truncates with a `title`) · Global Search (header icon `#ehSearchBtn` "Open Global Search" → the `search` popup: `role="combobox"` input `#ehSearch` + one `role="listbox"` `#ehResults` with `role="group"` sections Recent / Quick actions / Results, `aria-activedescendant`, polite status `#ehStatus`) · Menus (one controller for Language `menuitemradio`, Help and System Admin `menuitem`; one open at a time; click-outside, Esc, Tab, arrows, Home/End; focus returns to the trigger) · Modal (one shared native `<dialog id="ehModal">` opened with `showModal()`, `role="dialog"` + `aria-modal="true"`, title/description labelled; `MODALS` registry of render functions keyed by id: `search`, `my-activity`, `change-password`, `notification-preferences`, `keyboard-shortcuts`, `contact-us`, `help`, `about`, `logout`; opening another replaces the content, never stacks; closes on ×, Esc, Cancel or — informational popups only — a backdrop click; Tab is trapped; keydown never reaches page shortcuts; on close all fields are cleared and focus returns to the menu trigger). Embeds Lucide 0.454 icon paths. API `window.EmagiaHeader.{getLanguage, setLanguage, openSearch, openModal, closeModal, navigate}`; event `emagia:languagechange` on `document`; listens for `cfo:agentopen` `{category, agentId}` (dispatched by the workspace's `selectAgent`) to record Recent.
- **Search source:** `CFO_SAMPLE.listCategories()` (8) + `listAgents()` (32) + `config.search.pages` (CFO Overview, CFO Workspace) + quick actions that open header popups (Help, Keyboard Shortcuts). Matching is synchronous (no debounce, no loading state): accent-insensitive, all words must match title/type/description; ranked by title prefix → word start → title contains, then Category › Agent › Page › Action; max 12. Empty query: Recent (`erms.emagia.search.recent`, max 5, entries resolved against the index — unknown ones dropped; "Clear recent") then Quick actions (`config.search.quickActions`: the other CFO page, "Open <category>" × 8, Open Help, View Keyboard Shortcuts). The first option is highlighted; ↑/↓ wrap; Enter (unmodified) opens; Esc / × / backdrop close and return focus to the search icon. A page result for the current page just closes. Selecting: in the workspace, `window.CFO_WORKSPACE.open(category, agent?)` (existing `setCategory` + `selectAgent`, so the agent's summary auto-loads as on click); elsewhere `EmagiaHeader.navigate('cfo-workspace.html?category=…&agent=…')` (parameters already supported by the workspace init). Sample report names are not searchable (no viewer). If `CFO_SAMPLE` is missing, the panel says search is temporarily unavailable.
- **Language:** stored in localStorage `erms.emagia.language` (default `en`), applied on load on both pages and synced across open tabs via the `storage` event. It changes only the trigger, the checked item and a confirmation toast ("Page content stays in English in this prototype"); `<html lang>` and direction are never changed. Flags: `components/assets/flags/` (copied from ERMS `node_modules/flag-icons/flags/4x3/`, flag-icons 7.2.3, MIT — `D:\cfo` has no `node_modules`, so the spec's `/node_modules/flag-icons/flags/4x3/` path does not exist here).
- **Help menu:** page guide (`help` popup), keyboard shortcuts, about — all in the shared modal. No Help Center or external links (no verified destination).
- **System Admin menu:** (reference design: 36px circular icon backgrounds, 60px rows, Logout separated with danger colours; the "Prototype identity — no sign-in, roles or permissions" note is the trigger's `title`) My Activity · Change Password · Notification Preferences · Keyboard Shortcuts · Contact Us · Help · separator · Logout. No authentication, account, activity, notification or support service exists, so: My Activity = "No recent activity available." empty state; Change Password = 3 password fields with show/hide (`aria-pressed`), required + match validation, then a notice that nothing was sent or changed and the fields are cleared; Notification Preferences = 5 `role="switch"` toggles (thumb + On/Off text), Cancel discards, Save stores them in `erms.emagia.notifications` (in-memory fallback) and toasts that no notifications are sent; Keyboard Shortcuts = the implemented groups for this page; Contact Us = notice that no support details are configured + Subject/Message form whose submit says the request wasn't sent; Help = the page's contextual help; Logout = confirmation with Cancel (focused) and Logout `aria-disabled` + `aria-describedby` reason (no redirect, nothing cleared). Popups reuse the page `.btn`, `.btn-primary`, `.btn-secondary`, `.field`, `.ctl`, `.t-label` classes plus `eh-` component classes.
- **Responsive:** ≥ 1280px full; < 1280px the user name hides; < 1024px the breadcrumb (page CSS) and divider hide. The search popup is centred, ≤ 720px wide and ≤ 78vh high, with the input fixed and results scrolling inside; < 768px it uses the width minus 16px margins and up to the viewport height minus 32px, and the keyboard hints hide. Popovers are positioned inside the sticky `.topbar` (z-index 20) and shifted to stay in the viewport.
- **Workspace hook:** `window.CFO_WORKSPACE.open(catId, agentId?)` at the end of the UI IIFE — exits focus mode, expands the agents panel, `setCategory(cat, true)` (pushState), then `selectAgent(i, true)` or focuses the category tab.

## CFO Executive Overview (`cfo-overview.html` + `components/cfo-overview-data.js`)
- Load order: `cfo-sample-data.js` → `cfo-overview-data.js` → page script (`window.CFOOverview` with `renderAlerts(list)` for the empty state).
- DOM order (`main` children, 2026-11-18): `section#welcome` (`#wbDate`, `#wbGreet`, `#wbNote`/`#wbAsOf`, sr-only h2 `#wbMetricsTitle`, `#wbMetrics`) → `nav#categories` (`#catCount`, `#cards`) → `section#executive` (h1 `#pageTitle`, `#asOf`, `#trendRange`, `#dataChip`, sr-only h2 `#kpiTitle`, `#kpis`) → `#attention`. Rendering targets elements by id.
- Page script: `header()` (dates; `#wbAsOf` copies `#asOf`), `renderKpis()` (splits `CFO_OVERVIEW.kpis` by `BANNER_IDS` = total-ar, overdue-ar, cash-received, dso → `#wbMetrics`; the rest → `#kpis`; one shared tooltip controller), `renderCards()`, `renderAlerts(list)`. `renderBriefing` / `renderActions` were removed with their sections.
- `categories[].metrics` / `count`, `actions` and `briefing` are still in the view model and checked by the node test, but the page no longer displays them.
- `CFO_OVERVIEW.{kpis, alerts, categories, actions, briefing, sortedAlerts(list), categoryStatus(catId, list), workspaceUrl(cat, agent)}`. Every item cites `src`/`c,a` (CFO_SAMPLE category + agent) and `find` strings that must appear in that agent's sample summary; trend `series` equal the agent's chart values; "prior month" = 4th series value. No period, entity, forecast, cost-per-invoice or over-limit data exists in the sample, so none is shown.
- Rules (prototype): alert severity critical = off sample target and worse every month of its trend; high ≥ $0.5M at stake; medium < $0.5M; informational = no value at stake; order severity then stake. Category status = worst alert touching it (critical/high → Needs attention, medium → Watch, else No major alerts). Action priority high ≥ $0.5M.
- Links only use existing routes: `cfo-workspace.html?category=<id>` (cards) and `&agent=<id>` (KPIs, alerts, briefing, actions; the workspace already reads `agent`).
- Tests: node "overview data" test (traceability + rules) and `tests/harness/overview.harness.js` at 1440/1280/1024/768/390/360.

## Pickers: Select dropdown + Calendar date picker (`components/`)
- `emagia-pickers.css`: `@supports (appearance: base-select)` styles `select.ctl` and `::picker(select)` (panel ≥ input width, 4px below, `--r-control` top / `--r-md` bottom corners, `--shadow-float`, 1px `--border`, `padding:4px 0`, `max-block-size` 20rem, fade + 4px slide via `@starting-style`); options 12px side padding, ≥ 36px rows; `option:checked` = `--primary-50` + `inset 2px 0 0 --primary-500` + `::checkmark` (Lucide check mask, `order:1`, right); hover/focus = 60% `--primary-50`; focus adds a 2px inset outline. The page `select.ctl` chevron stays (`::picker-icon` hidden). Same surface for `.edp-pop`.
- `emagia-datepicker.js` enhances `input[type=date][data-emagia-datepicker]` (`#from`, `#to`): wraps it in `.edp-wrap`, adds `.edp-btn` ("Choose From date", `aria-haspopup="dialog"`, `aria-expanded`), hides only that input's native indicator. One shared `#edpPop` (`popover="auto"`, `role="dialog"`, labelled by the month heading `#edpTitle`, `aria-live`): 6×7 `role="grid"` of `td.edp-day` (roving tabindex, `aria-selected`, `aria-current="date"` for today, `aria-disabled` outside `min`/`max`), prev/next month, Clear, Today. Selecting sets `input.value` (YYYY-MM-DD) and dispatches `input` + `change`, closes and focuses the button — the page's existing date listeners do the rest. Placement: fixed below the input (flip above if no room), clamped to the viewport. API `window.EmagiaDatePicker.{enhance, open, close}`.

## Right application launcher (`components/`, both pages)
- `emagia-app-launcher.config.js` → `window.EMAGIA_APPS_CONFIG = {ariaLabel, current, items:[{id, label, icon, href:null}]}` — 11 items: Gia Agent (sparkles, current), Gia (bot), Gia GPT (bot-message-square), Gia Agent Studio (workflow), Gia Alpha Cash (wallet), Gia Voice (phone), Gia Analytics (chart-no-axes-combined), Gia Docs (file-text), Gia Drive (hard-drive), Graphs (chart-pie), Collaboration (users).
- `emagia-app-launcher.js` (Lucide 0.454 paths embedded) appends `nav#ealRail.eal-rail` (buttons with `aria-label`; current `aria-current="page"`; others `aria-describedby` "Not linked in this prototype"), one fixed tooltip `#ealTip` (hover/focus; Esc hides; `aria-hidden`), ↑/↓/Home/End between items, and sets `body.eal-on`. Selecting: current → "… is the current application."; unlinked → page `toast()` "<App> is not linked in this prototype." + event `emagia-apps:select {id, linked:false, current}`; an approved `href` would navigate (none exist). Below 768px it inserts `#ealBtn` + `#ealPop` into the header `.tb-right` and registers them with `EmagiaHeader.registerMenu` (shared controller). API `window.EmagiaAppLauncher.{items, current}`.
- Stacking: rail z 15 (under the sticky header z 20, so header menus open over it), tooltip z 40, toasts z 60 at `right: rail + 24px`. Hidden in print.
- Header API additions: `EmagiaHeader.registerMenu(trigger, pop, onSelect)` and `EmagiaHeader.closeMenu(m, focusTrigger)`.

## Shared left navigation (`components/`, both pages)
- Markup in each page: `<aside class="sidebar" id="sidebar" data-emagia-sidebar></aside>` followed by `<script src="components/emagia-nav.config.js">` and `<script src="components/emagia-sidebar.js">`; `<link rel="stylesheet" href="components/emagia-sidebar.css">` after the page `<style>`. The page `<style>` is unchanged; the component reuses `.sidebar`, `.sb-nav`, `.sb-item`, `.sb-foot` from it (`.sb-logo` is now unused).
- `emagia-nav.config.js` → `window.EMAGIA_NAV_CONFIG = {ariaLabel, navLabel, storageKey, footer:{src, alt, width}, items:[{key, label, icon, href|null, match?}]}`. Only CFO has a route (`cfo-overview.html`, active on both CFO pages).
- `emagia-sidebar.js` → renders hamburger (`.sb-toggle`), separators (`.sb-sep`), items (`a.sb-item` with `.sb-label`; unrouted items are `role="link" tabindex="0" aria-disabled="true"` and announce "<label> isn't linked in this prototype" via the page `toast()` and an `emagia-nav:unavailable` event), and the footer. Embeds Lucide 0.454 icon paths. Active item: `data-active` on the aside, else the current file name vs `match`/`href` → `aria-current="page"`. API `window.EmagiaSidebar.{mount, setCollapsed, setActive}`.
- Collapse (≥ 1024px): `body.sb-collapsed` sets `--sidebar-w:64px` (icon rail, labels visually hidden but kept as accessible names, `title` tooltips); persisted in localStorage `erms.emagia.sidebar.collapsed`. Below 1024px the page's off-canvas drawer applies; the sidebar hamburger closes it via `#menuBtn`.

## Page structure
```
aside.sidebar#sidebar            shared Emagia nav component (88px, 64px collapsed; off-canvas < 1024px, #menuBtn + #sbScrim)
div.content
  header.topbar                  breadcrumb (#crumbCat), language, user
  main#main
    h1#pageTitle
    div.tabstrip#catTabs         role=tablist, category tabs (built from CATS)
    form.toolbar.card#toolbar    #presets pills, #from/#to dates, #provider/#model, #summarizeBtn, #dateErr
    div.ws#ws (role=tabpanel)    3-panel grid
      section#leftPanel          agents: #agentSearch, #agentList, #agentEmpty, #leftToggle
      section#centerPanel        #centerTabs (narrow only), #centerFocus
        #sumPane                 #stIdle/#stLoading/#stError/#stEmpty/#stResult, #feedback, #chatWrap
        #chartPane               receives #chartContent when narrow
      section#rightPanel         #rightBody holds #chartContent (#chIdle..#chResult, #chart canvas, #legend, #chartTable), #rightToggle, #rightFocus
dialog#promptDlg                 edit prompt
div.toasts#toasts
```

## Sample data layer — `CFO_SAMPLE` (the only data source)
Local, deterministic, illustrative data. No network, database, auth or LLM. The UI calls only these functions; a backend replaces them with API calls returning the **same shapes** (contract documented in the block's header comment).

| Function | Returns | Future endpoint |
|---|---|---|
| `listAgents(categoryId)` | `[{id, name, description, prompt, chips:[question×3]}]` | `GET /cfo/categories/{categoryId}/agents` |
| `getSummary({categoryId, agentId, from, to, provider, model, prompt})` | `Promise<{origin:'sample', categoryId, agentId, from, to, sections:[{key:'insights'\|'risks'\|'recommendations', items:[{title, metric, value, impact, source:{id, report, record}}]}], chart:{title, unit:'usdM'\|'usdK'\|'pct'\|'days'\|'count', labels, values}}>` after ~700 ms. Unknown agent → rejects. | `POST /cfo/summaries` |
| `answer({categoryId, agentId, question, context, periodEnd})` | `Promise<{origin:'sample', text, context}>` after ~600 ms. `context` is opaque; pass the previous reply's back for follow-ups. | `POST /cfo/summaries/{id}/messages` via a server-side LLM gateway |
| `format(value, unit)` | display string (`$6.20M`, `$420K`, `86%`, `48 days`, `1,840`) | helper, stays client-side |

Internals (data, not API): `SRC` (sample report ids, e.g. `SMP-AR-01`), `HEAD` (shared figures per category), `CATALOG` (8 categories × 4 agents: description, prompt, chart, 3 insights, 2 risks, 2 recommendations, 3 chips), `TOPICS` + `TOPIC_ORDER` (shared chat topics, each `[answer, deeper answer]`), `CHIP_ANSWERS` (answer per suggested question; `'topic:N'` reuses a shared topic). Charts with `months:true` label the five months ending at the selected **To** date.

**Chat resolution order (`answer`)**: 1) the agent's suggested question → `CHIP_ANSWERS`; 2) section intents (insights, risks, recommendations, chart) from the agent's own items; 3) shared topics in `TOPIC_ORDER` ("why / increasing" questions start one level deeper; repeating a topic goes deeper); 4) explicit follow-ups ("why", "tell me more", "what next"…) continue the previous topic; 5) a help reply with the category headline and example questions. Replies are rule-based and labelled "Assistant · sample response".

**Shared figures (must agree everywhere):** total AR $8.6M = current $6.20M + 1–30 $1.05M + 31–60 $0.62M + 61–90 $0.43M + 90+ $0.30M; overdue $2.4M (28%); credit exposure $12.8M = AR + $4.2M open orders, limits $16.0M, 80% utilized, $3.2M available, overdue exposure $2.1M, 18 high-risk customers; CEI 86%, PTP $1.15M, 24 Priority 1 accounts ($1.12M); receipts $5.2M = $4.21M auto + $0.49M manual + $0.50M unapplied, auto-match 91% (3,212/3,530), 146 reconciliation items; 342 disputes / $1.25M, 38 high priority, 12 days, 184 resolved; portal 2,450 registered / 1,840 active (75%), $3.4M online, 126 pending actions; DSO 48 days (44 five months ago), process efficiency 82%; bad-debt exposure $420K = 100%×$300K + 25%×$0.43M + 2%×$0.62M (illustrative rates).

## State (UI)
- `st` — `{cat, agentIdx:{[cat]:index}, status, chartType, narrow, centerTab, timer, panels:{left, right, focus}}`.
  - `status`: `'idle' | 'loading' | 'success' | 'empty' | 'error'`.
  - `timer`: token of the in-flight `getSummary` call, or `null`. A response whose token no longer matches (stopped or superseded) is ignored.
- `cache` — `{[key()]: result}`, `key()` = `category|agentId`. Result = `{status, time, data, agent, agentKey, from, to, provider, model, pinned?, vote?}`; `data` is the `getSummary` result. Regenerate replaces the entry.
- `threads` — `{[key()]: [{role:'user'|'ai', text}]}`: chat history per agent. `chatCtx[key()]` holds the follow-up context; `pending[key()]` is true while a reply is being prepared.
- `AGENTS` — `{[categoryId]: CFO_SAMPLE.listAgents(categoryId)}` (UI copies; Edit prompt changes only the copy).
- `DEMO` — `?demo=` preview value (`error | empty | loading`) or `null`.
- Helpers: `cat()`, `agent()`, `key()`, `$()` (by id), `q()` (querySelector), `esc()`, `ic()`, `chartData()`, `fmtVal` (= `CFO_SAMPLE.format`), `fmtTick()`, `niceTop()`.

## Key functions (UI)
- `setCategory(id, push)` — stops any load, sets `st.cat`, updates tabs/breadcrumb/title, optional `history.pushState` (drops `agent`), clears search, `renderAgents()` + `restore()`. Does **not** auto-summarize.
- `renderAgents()` — rows show name + description; search matches name, description and prompt.
- `selectAgent(i, keepFocus)` — no-op if `i` is the active agent and it is cached or loading; else `stop(true)` if loading, sets index, `renderAgents()`, optional focus, `restore()`, then `summarize()` when `!cache[key()]`.
- `restore()` — sets idle text, shows cached result (`renderResult` + `show(c.status)`) or `show('idle')`, hides feedback, `renderThread()`.
- `summarize()` — `validDates()` guard (focuses `#from`); ignored while loading; `show('loading')`; calls `CFO_SAMPLE.getSummary`; on resolve caches the result, renders it if still current, toasts "Summary ready" / "Summary failed" / "No data for this range". `?demo=` previews override the status.
- `stop(silent)` — clears `st.timer` (the pending response is ignored), restores the cached result or idle, toast "Generation stopped" unless silent.
- `show(s)` — single source of truth for state visibility: toggles `#st*`/`#ch*`, `aria-busy`, `#chatWrap`, disables `#summarizeBtn` while loading, draws chart on success.
- `renderResult(r)` — meta (range, "Not called — local sample data", time), empty text, sections from `r.data.sections` (title, metric, `.font-data` value, impact, source line), pin/vote, chips.
- `renderChips()` / `send(text)` / `renderThread()` — per-agent chips; `send` blocks empty and duplicate submissions while `pending`, calls `CFO_SAMPLE.answer`, shows a "Preparing a response…" row and disables Send while waiting.
- `drawChart()` — canvas bar/line/pie from `chartData()` using token colors, nice axis scale and unit-formatted ticks; only when `status==='success'`; sets `#chTagText`, canvas `aria-label`, `#chartTable` caption and rows.
- `setLeft(c)` / `setRight(c)` — collapse agents/chart panels, persist, redraw.
- `setFocus(which)` — `'center' | 'right' | null`; single-panel focus mode (`.has-focus`, `.is-focused`).
- `applyNarrow()` — `(max-width:1279px)` media query; moves `#chartContent` between `#rightBody` and `#chartPane`.

## Status flow
```
idle ──summarize()──▶ loading ──CFO_SAMPLE.getSummary() (~700 ms)──▶ success
  ▲                     │                     (?demo=error|empty → error|empty; ?demo=loading stays loading)
  └──── stop() ─────────┘
```

## Actions
- Delegated `document` click handler: `a[data-src]` source links → toast "Sample reference … — the report viewer isn't connected in this prototype" (no navigation); then `data-act`: `retry`, `regen`, `adjust`, `other`, `copy`, `pdf`, `share`, `pin`, `like`, `dislike`, `fbCancel`, `fbSend`, `edit`. Saving an edited prompt toasts that sample summaries don't change with the prompt.
- Agent refresh icon (`data-refresh`) → `selectAgent` + `summarize()` (forces regeneration).
- Exports: `#dlPng` (canvas PNG), `#dlCsv` (`<chart title>,Value,Unit,Origin` rows with origin "Sample data (illustrative)").

## localStorage keys
- `erms.emagia.language` — selected header language code (default `en`), shared by both pages.
- `erms.emagia.search.recent` — Global Search recent destinations `[{type, cat?, agent?, href?}]` (max 5), shared by both pages; only destinations actually opened.
- `erms.emagia.notifications` — UI-only notification preferences `{email, inApp, reports, agents, announcements}` (booleans), shared by both pages. Nothing is sent. Passwords and contact form text are never stored.
- `erms.emagia.sidebar.collapsed` — `'1'` when the shared sidebar is collapsed (both pages).
- `erms.cfo.ws.panels` — `st.panels` (`left`, `right`, `focus`).
- `erms.cfo.chartType` — `'bar' | 'line' | 'pie'`.
- All access wrapped in `try/catch`.

## URL params
- `category` — initial category id (falls back to `credit`); updated by tab clicks via `pushState`; `popstate` re-applies.
- `agent` — initial agent id within the category (e.g. `ar-aging`); written by the Share action.
- `demo` — optional, explicitly requested preview of non-success states: `error`, `empty`, `loading`. Without it, the page always runs on sample data.
- There is **no** `mode` parameter and no live/production mode.

## Remaining placeholders
- (Resolved 2026-11-16) The toolbar provider/model placeholders were replaced by `LLM` = `{providers:[OpenAI, Ollama], models:[5 ollama/* ids], defaults:{provider:'Ollama', model:'ollama/gpt-oss:latest'}, supports(p, m)}`. `fillModels()` fills both selects once; `validLlm()` (on change of either) shows `#llmErr` + `aria-invalid` for unsupported pairs (OpenAI + an Ollama model). Provider and model are independent — neither changes the other. Values still pass to `getSummary` unchanged; no model is called.
- `#stError` markup text "[Error message from service]" — visible only in the `?demo=error` preview.

## Tests
- `node --test tests/workspace.test.js` — Node-only `CFO_SAMPLE` contract, 32-agent coverage and figure-consistency tests, plus (when Chrome/Edge is found) the browser regression harness `tests/harness/workspace.harness.js` (1600px) and `tests/harness/narrow.harness.js` (1024/768/390px).
- `tests/retired/r2-release2-tests.js` — the old `tests/r2.test.js`, retired: it targets the rolled-back data-access and Release 2 code. Kept only as the source of the 57 engine test cases to port to the React engine (`cfo-platform-spec.md`). Do not run it against the workspace.

## `cfo-overview.html`
- Same shell (shared sidebar component, topbar, toasts, `ic()`, `hydrateIcons()`, `toast()`), plus `CATS` with descriptions rendered as `.mcard` links to `cfo-workspace.html?category=<id>`. Only the sidebar changed since 2026-11-06.

## Tests (sidebar, header)
- `tests/workspace.test.js` also checks the nav config (order, routes, icons) and runs `tests/harness/sidebar.harness.js` on both pages at 1600px and 390px.
- Header: config test (11 languages in order, flag files present, no external links/emails, route targets exist, no network/lang/dir code) and `tests/harness/header.harness.js` on both pages at 1600 / 1440 / 1024 / 768 / 390px.
- Widths under 600px run inside an iframe of exactly that width (headless Chrome can't size a window below ~500px).

## Resolved defect
- The `database` icon is now in `ICONS`, so the "Sample data" tags render with their icon.

# Part B — Target architecture (approved direction; implementation pending visual approval)

- **Where:** a `cfo` module in the ERMS React app (`D:\erms-admin`: React 18 · Vite 5 · TypeScript · Tailwind 3 · react-router 6 · lucide-react), registered in `src/routes/moduleConfig.ts`, so the sidebar, breadcrumbs and Ctrl+K palette pick it up.
- **Routes:** `/cfo/briefing` (home) · `/cfo/domains/:domainId` · `/cfo/signals` · `/cfo/decisions` · `/cfo/agents` · `/cfo/audit`.
- **Shared context** in URL params: `period`, `compare`, `scope`, `mode`, `investigate`.
- **Layout:** `CfoModuleLayout` = ERMS `TabStrip` + `ContextBar` + page outlet + `InvestigatePanel` host. ERMS sidebar, topbar and palette unchanged.
- **Code boundaries:**
  - `src/lib/cfo/engine/*`: pure financial logic (calculations, rules, forecasts, schema, origin).
  - `src/lib/cfo/dataSource.ts` + `providers/sample.ts`, `providers/live.ts`, `__fixtures__/`: one `CfoDataProvider` contract, selected by environment (Decision 6, spec §2.3): `sample` in dev/prototype/preview, `fixture` in tests, `live` in production with no silent fallback to sample data; sample/fixture providers are excluded from production builds.
  - `orchestrator.ts`, `decisions.ts`, `audit.ts` (session-only).
  - Hooks `useCfoContext` / `useCfoRequest`.
  - `src/components/cfo/*`: the 8 approved new components.
  - `src/pages/cfo/*`.
- **Reuse, never duplicate:** TabStrip, StatCard, DataTable/TableToolbar, Badge, AiTag, Dropdown, DatePicker, Modal, Button, Toast, Tooltip, EmptyState, `lib/exportCsv`, `lib/fuzzy`.
- **Not present in the React app today:** API layer, auth/tenant, tests, charts, CI, git. See `cfo-platform-spec.md` §2 and §8.
