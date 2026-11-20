# UX rules

- **Part A** covers the current behaviour of the CFO Workspace prototype (`cfo-workspace.html`), which runs on local sample data by default. Any change to the page must keep these rules true.
- **Part B** covers the rules for the approved CFO Intelligence platform (React), which apply when it is built.
- The accessibility requirements apply to both.

# Part A — CFO Workspace prototype (current behaviour)

## Data and labelling
- A1. **Sample data is the default and only data mode.** Every category (8) and agent (32) produces a summary, chart and chat answers from `CFO_SAMPLE` with no backend, database or model. Normal use never shows "Data source not connected", bracketed placeholders (`[Label 1]`, `[Response placeholder…]`) or "Demo dataset generator not available".
- A2. Non-success states (error, empty, endless loading) appear only in the explicitly requested `?demo=error|empty|loading` previews.
- A3. Sample origin is always visible: "Sample data" tag on the summary card, "Sample data · <chart title>" on the chart, "Model: Not called — local sample data" in the summary meta, "Assistant · sample response" on chat replies, origin column in the CSV. Sample replies are never presented as AI output.
- A4. Every summary has 3 Key Insights, 2 Risks and 2 Recommendations. Each item shows a title, metric, value (`.font-data`), business impact and a source line (sample report, id, record, "period ending <To date>"). Clicking a source explains that the report viewer isn't connected; it does not navigate.
- A5. Summary, chart and chat show the same figures for the same metric.

## Summary generation
1. **Agent click auto-loads, with a cache.** Clicking (or Enter/Space on) an agent row selects it; if no cached result exists for that agent (`category|agent`), `summarize()` runs. A cached result shows instantly with no new request.
2. Re-clicking the active agent that already has a result (or is loading) does nothing.
3. Switching agents mid-load cancels the first request (`stop(true)`) and loads the new agent.
4. **Refresh icon forces regeneration** for that agent, even when cached.
5. Changing category tabs does **not** auto-load; it shows the cached result or idle.
6. Invalid date range: `#dateErr` shows, `#from`/`#to` get `aria-invalid="true"`, focus moves to `#from`, nothing loads.
7. Summary states: idle, loading, success, empty, error — only one visible at a time, driven by `show()`. Chart panel mirrors the same state.
8. Retry / Regenerate re-run `summarize()`. Stop cancels and restores the previous state; a late sample response is ignored.
9. Results finish with a toast: "Summary ready" / "Summary failed" / "No data for this range".
10. Changing the date range does not reload by itself; the next Summarize/Regenerate uses it. Sample figures are a snapshot as of the **To** date; trend charts show the five months ending that month.
11. Editing the prompt saves it, says sample summaries don't change with the prompt, and regenerates.

## Chat
12. Each agent has 3 suggested questions (chips); every chip has a specific answer.
13. Typed questions are answered from the agent's items and shared topics (aging, credit, high-risk customers, customers, collections, cash application, disputes, portal, DSO, bad debt, benchmarks, KPIs); "why/increasing" questions get the causal answer.
14. Follow-ups ("why", "tell me more", "what next"…) continue the previous topic one level deeper. Unrecognized questions get a help reply, never a placeholder.
15. Empty messages are ignored. While a reply is pending, a "Preparing a response…" row shows, Send is disabled and further submissions (typed or chip) are ignored.
16. History and follow-up context are kept per agent; switching agents shows that agent's thread.

## Toolbar controls
- LLM Provider lists exactly OpenAI, Ollama; LLM Model lists exactly the five approved `ollama/…:latest` ids (never clipped). Default Ollama + `ollama/gpt-oss:latest`. Changing either never changes the other and never sends a request; an unsupported pair (OpenAI + an Ollama model) shows an inline message linked to both selects. Both selects say they are local UI settings; the summary meta keeps "Not called — local sample data".
- Date fields stay native date inputs (typing, value, validation); the calendar popup is the shared Emagia calendar (`components/emagia-datepicker.js`, no library): 36px field, 12px text inset, calendar button muted → primary on hover/focus. Popup: month + year heading, previous/next month, Sunday-first grid, today = bold primary number + dot (`aria-current="date"`), selected = filled primary (`aria-selected`), days outside the month muted, dates outside `min`/`max` disabled (muted, struck through), Clear and Today. Keyboard: Alt+↓ opens; arrows, Home/End, PageUp/PageDown (Shift = year), Enter/Space; Tab stays inside; Esc and click outside close. The existing range validation, presets and snapshot-as-of-To behaviour are unchanged.
- Select dropdowns and the calendar share one popup style (white, 1px neutral border, 8px top / 12px bottom corners, floating shadow, 4px below the control, never clipped). Select options: full-width rows, 12px side padding; selected = light blue + 2px primary left indicator + right-aligned check (never colour alone); hover/focus = lighter blue, focus adds a 2px outline; one selected option at a time.

## Chart
17. Bar, line and pie use the summary's dataset with unit-formatted axis ticks; the pie shows a legend with shares. PNG and CSV export the displayed sample data.

## Keyboard
| Key | Where | Action |
|---|---|---|
| Ctrl/Cmd+Enter | anywhere (not in prompt dialog) | Summarize |
| Esc | anywhere | Close feedback → else exit focus mode (toast "Exited focus mode"). Ignored while dialog, fullscreen, or mobile nav is open |
| Esc | mobile nav open | Close nav, focus menu button |
| ←/→, Home/End | category tabs | Move focus (roving tabindex); Enter/Space/click activates |
| ↑/↓, Home/End | agent list | Move focus only (roving tabindex) |
| ↑ on first agent | agent list | Focus `#agentSearch` (when panel expanded) |
| ↓ | `#agentSearch` | Focus first agent |
| Enter/Space | agent row | Select + auto-load (same as click) |
| ←/→ | Summary/Chart tabs (narrow) | Switch tab and focus it |

## Global header (shared component, both pages)
22. One 56px row: logo | breadcrumb on the left; search icon · language · help · System Admin on the right. No permanent search field. Ancestor crumbs link only to real destinations (CFO → overview); Home is plain text. The current crumb truncates with a tooltip.
23. Global Search opens from the search icon ("Open Global Search") or Ctrl/⌘+K as a centred modal (dimmed, inert background; focus in the input; Tab trapped). It covers only verified local content (8 categories, 32 agents, the two CFO pages, Help and Keyboard Shortcuts). With no query it shows Recent (only destinations actually opened; omitted when empty; "Clear recent") and Quick actions (only real destinations). ↑/↓ move the highlighted option (`aria-activedescendant`, `aria-selected`, light-blue tint + a "↵ Open" hint, not colour alone; no left indicator); Enter opens it; the clear button resets the query; Esc, × or a backdrop click close it and return focus to the search icon. No-results and unavailable states are explained; there is no fake loading state. In the workspace a result opens in place (agent → its summary loads); elsewhere it navigates to the workspace.
24. Language: exactly 11 approved languages, English default, one checked (`menuitemradio`), persisted across both pages. Selecting confirms that page content stays in English; the page stays LTR and `<html lang>` is unchanged.
25. Help and System Admin menus list only actions that open a same-page popup. Menus open on click/Enter/Space/↓, close on Esc (focus back to trigger), Tab or click outside; only one is open at a time; they stay inside the viewport.
27. System Admin has exactly 7 items in order (My Activity, Change Password, Notification Preferences, Keyboard Shortcuts, Contact Us, Help, separator, Logout), each a full-width row with a circular icon background (Logout: light-red circle, red icon and label); each opens its own popup in the one shared modal on the current page — no navigation, new tab or redirect, and page state (category, agent, summary, chart, chat) is untouched. Every popup has a visible × button, closes on Esc and Cancel (backdrop click only for informational popups, never for forms), traps Tab, and returns focus to the menu trigger. Only one popup is open at a time.
28. Without a backend, popups never simulate success: no fabricated activity, timestamps, contact details or ticket numbers; Change Password and Contact Us validate inline, then say nothing was sent (password fields are cleared and never stored); Logout needs explicit confirmation and its Logout button stays disabled with a visible reason; notification toggles are UI-only preferences (Cancel discards, Save persists in this browser) and state that nothing is sent.
26. The search modal adapts to tablet and phone widths (16px side margins, internal scrolling, close button always visible, no horizontal scroll); the sidebar menu button keeps working.

## CFO Executive Overview
32. Page (final refinement 2026-11-18) has exactly four sections: **Welcome banner** → **O2C Intelligence Categories** (primary navigation, a `<nav>`) → **CFO Executive Overview** (h1, reporting context + remaining KPIs, separated by a rule) → **Executive Attention Center**. No GIA Executive Briefing or Management Action Tracker on this page. The overview header states the snapshot date, the five trend months and "Local sample data · not live"; no period selector, entity filter or refresh until the data supports them.
32a. Welcome banner (`--g-hero`, white text, `--r-lg`, `--shadow-md`): date ("Wednesday, November 18"), "Welcome back, System Admin" (hardcoded name per design.md §5.1), "Sample data · as of <snapshot>", and the decorative sparkle at the far right. It shows the 4 key KPIs (Total AR, Overdue AR, Cash Received, DSO; chosen by id from `CFO_OVERVIEW.kpis`, never hardcoded) in one translucent strip with dividers: label + info tooltip, value (links to the source agent), and the existing comparison where a sample trend exists, else the existing context line. ≥ 1280px one row (greeting | metrics | sparkle); below that the metrics move under the greeting; phones 2 × 2. Each KPI appears once on the page — banner KPIs are not repeated in the overview section.
33. KPIs are compact: label + info button, value in JetBrains Mono, one context line, and one comparison line only where a sample trend exists (direction in words: Better/Worse). No sparklines or target line — the info tooltip carries definition (banner: plus the context line when a comparison replaces it), formula, comparison (or "No prior period in the sample"), sample target, five-month trend and source (hover/focus/click, Esc). Overview-section cards (2 columns) end with "View details" to the source agent.
34. Alerts: severity as text + icon (Critical/High/Medium/Informational), only critical uses red. Default view = critical and high alerts (top 3 if none), "Show all N alerts" reveals the rest. Each row: title, impact, owner/due only when the sample states them, category, one action to the source agent; the explanation and scope sit behind a per-alert "Why it’s flagged" disclosure. Ranking rule disclosed; empty state. Rule-based on sample data, never described as live monitoring.
35. Category cards keep their 8 ids and routes and are whole-card links: icon tile, name, short description, the CFO_SAMPLE agent count and one status (icon + text), chevron top-right. No financial metrics on the cards. 4 columns ≥1024px, 2 at 768–1023px, 1 on phones. The section head shows "8 categories · N AI agents" summed from CFO_SAMPLE.
36–37. (Retired 2026-11-18: the GIA briefing and action tracker were removed from the overview. If they return, they must keep their former rules: "rule-based, no AI model called", typed items linked to agents, stated assumptions; recommendations verbatim, status Open, no simulated workflow.)

## Right application launcher (shared component, both pages)
29. Exactly 11 applications in fixed order (Gia Agent … Collaboration). ≥ 768px: a fixed rail on the far right below the header (64px; 56px below 1024px) that never covers page content, toasts or header menus; < 768px: an "Applications" icon in the header opens the same list as a menu.
30. The current application (Gia Agent) has `aria-current="page"` and a light-blue filled circle with a primary icon; others are neutral. A tooltip names each item on hover and keyboard focus (Esc dismisses). ↑/↓/Home/End move between items.
31. No application has a verified destination: selecting one says "<App> is not linked in this prototype." and never navigates or claims success.

## Left navigation (shared component, both pages)
18. 14 items in fixed order (Home … GCC, Emagia Exchange, AP Portals, CFO); CFO is active on both CFO pages (`aria-current="page"` + white pill, a filled shape, not colour alone).
19. Items without a route stay focusable; click/Enter/Space announces "<label> isn't linked in this prototype" and does not navigate.
20. Desktop (≥ 1024px): the hamburger collapses to a 64px icon rail (labels kept as accessible names, tooltips shown) and expands back; the state persists. Below 1024px the topbar menu button opens the drawer and the sidebar hamburger closes it, returning focus to the menu button.
21. Keyboard: Tab reaches every item; ↑/↓/Home/End move focus between items; focus ring visible on items and the hamburger.

## Layout
- **Under 1280px the chart moves into a tab**: right panel hidden, `#chartContent` moved into `#chartPane`, Summary | Chart tabs shown; right focus mode becomes center.
- Under 1024px the sidebar is off-canvas (menu button + scrim).
- Under 768px: single column, agents panel max 320px high, full-width toolbar controls.
- Left/right panels collapse (64px / 48px); focus mode shows a single panel. Panel state persists in localStorage.

## Accessibility (target: WCAG 2.2 AA)
- **Patterns in use**
  - Tabs: `role="tablist"`/`"tab"`/`"tabpanel"`, `aria-selected`, `aria-controls`, roving `tabindex`.
  - Toggles: `aria-pressed` on presets, chart type, pin, like/dislike, focus buttons.
  - Disclosure: `aria-expanded` + `aria-controls` on panel toggles, dislike → feedback, menu button.
  - Current item: `aria-current="true"` on active agent (selection background, no left-border indicator); `aria-current="page"` in nav/breadcrumb.
  - Live regions: `role="status"` (toasts, gen-bar, empty list), `role="alert"` (date error, error state), `aria-busy` on chart while loading.
  - Labels: `aria-label` on all icon-only buttons; decorative icons `aria-hidden="true"`.
  - Chart: canvas has `role="img"` + generated `aria-label`, plus a data table (`#chartTable`).
  - Dialog: native `<dialog>` with `showModal()`, focus returns to Edit prompt on close.
  - Skip link to `#main`; `prefers-reduced-motion` disables animation.
- **Focus**: visible ring via `--ring` or inset 2px `--primary-500`; never remove it.
  - Chat: `#thread` is `aria-live="polite"`; the pending row carries `aria-busy="true"`.
- **Targets**: aim for 44×44px on new touch targets; never go below the WCAG 2.2 AA minimum of 24×24px. (Existing controls are 28–36px high; do not resize them — design freeze.)
- **Contrast**: text ≥ 4.5:1, large text and UI boundaries ≥ 3:1, using existing tokens only.
- Every new interactive element must be keyboard-reachable, labelled, and follow the patterns above.

## Known design debt
- Existing controls are 28–36px, below the 44px target. Resizing them needs design approval.

# Part B — CFO Intelligence platform (approved direction; applies when built)

## Structure
1. Navigation is Briefing · Domains · Signals · Decisions · Agents · Audit, inside the unchanged ERMS shell. Briefing is the module home.
2. One shared context bar (period, comparison, scope, data context) applies to every section and lives in the URL, so links reproduce the view.
3. Users start from metrics, signals and decisions, not agent names. Agents appear as provenance ("Produced by …") and in the Agents section.
4. Cross-domain investigation: the Investigate panel opens from any KPI, signal, recommendation, table row or agent finding, and shows related signals from other domains.

## Data honesty in the UI
5. *(React platform only; never the workspace prototype. Decision 6, spec §2.3.)* The data mode follows the environment: sample data in local development, UX prototyping and preview (with a persistent "◆ Sample data — not live" indicator and ◆ labels); fixtures in automated tests; live data in production. In production, when the live source is unavailable or a request fails, every affected area shows a "not connected" or error state that says what is missing and what it unlocks; **sample data is never shown in its place**.
6. "Not connected / not checked" is never presented as "empty" or "no anomalies".
7. Every value carries its origin label: actual, ◆ demo, fx calculated, ≈ forecast (provisional), ⚙ rule-based, ✦ AI. Use ✦ AI only for output from a connected model. Rule-based answers and summaries are labelled ⚙.
8. Every calculated value offers a provenance popover: formula, inputs, period, assumptions, origin, and the "Provisional methodology" note.
9. Forecasts are visually distinct from actuals (dashed line, square markers, scenario band, "Forecast →" boundary). Best/expected/worst are labelled scenarios, not confidence intervals.
10. Investigation answers state Verified, Partial or Not available. Missing data is named, never guessed.

## Human control
11. Recommendations follow Proposed → Accepted / Rejected / Modified / Deferred → Approval requested → Approved. Reject and Approve require a reason in a confirmation dialog.
12. Execute is always disabled, with a visible reason, until an authorized service is connected. "Executed" appears only when that service confirms it.
13. The system never changes credit limits, payment records, customer accounts or customer communications on its own.
14. Every decision action creates an audit event. Audit is labelled "session only" until an audit service exists.

## Behaviour
15. Changing the context recalculates all sections, aborts in-flight requests, keeps focus on the control, and announces the update politely.
16. Background work (monitoring, agent completion) never moves focus. Monitoring states that it runs only while the page is open.
17. Duplicate detections are merged and counted, never repeated as new.

## Keyboard
| Key | Where | Action |
|---|---|---|
| Ctrl/Cmd+K | anywhere | ERMS command palette, including CFO sections, domains and signals |
| ←/→, Home/End | section tabs | Move between sections (ERMS TabStrip) |
| Enter/Space | KPI tile ⓘ, row action, signal | Open provenance popover / Investigate |
| Esc | popover → Investigate panel → dialog | Close the topmost layer; focus returns to its trigger |

## Accessibility additions
- Status, severity, origin and trend are always word + glyph/shape; chart series differ by line style and marker shape.
- On route change, focus moves to the page heading. Dialogs and the Investigate panel restore focus on close.
- Disabled actions use `aria-disabled` plus a visible, programmatically linked reason.
- Use ERMS control sizes (32–40px, all ≥ 24px). The 44px target remains design debt.
