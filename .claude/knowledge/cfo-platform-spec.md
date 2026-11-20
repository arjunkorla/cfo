# CFO Intelligence platform — specification for review

Status: **FOR REVIEW — visual direction and integration architecture pending approval. No production implementation.** 2026-11-12.

> **Update 2026-11-12 — sample-data-first direction.** The CFO Workspace prototype (`cfo-workspace.html`) was rolled back to its pre-Release-1 baseline and now runs on local sample data by default through `CFO_SAMPLE` (`listAgents` / `getSummary` / `answer`; see `architecture.md`). Release 1 code and the paused Release 2 regions no longer exist in the page.
>
> **Decision 6 — RESOLVED 2026-11-12:** the React module selects its data mode **by environment** — sample data in local development, UX prototyping and preview; deterministic fixtures in automated tests; **live API data in production**, with no silent fallback to sample data. See **§2.3** for the strategy and **§2.3.5** for how this differs from the standalone workspace, whose behaviour is unchanged.

**Companion documents:**
- `ux-architecture.md`: audit, concepts, evaluation. Concept C was approved with the Briefing home.
- `design/cfo-intelligence-mockups.html`: interactive visual mockups of every screen, at 4 widths, in demo and production states.
- `release2-plan.md` / `release2-handoff.md`: the calculation engine specification and the paused work.

Where this document and `ux-architecture.md` differ, this document wins.

---

## 1. Final information architecture

| Section | Route | Purpose | Primary users |
|---|---|---|---|
| Briefing (module home) | `/cfo/briefing` | Financial health, material movements, decisions needed, outlook, executive summary, since-last-visit | CFO, executives |
| Domains | `/cfo/domains/:domainId` (`credit`, `collections`, `receivables`, `cash-app`, `disputes`, `portal-usage`, `efficiency`, `kpis`) | Domain KPIs, trend + comparison + forecast, contributors, ageing, domain signals, recommendations, agent findings | Managers, analysts |
| Signals | `/cfo/signals` | Triage queue of rule-based anomalies and monitoring alerts; thresholds | Managers, CFO |
| Decisions | `/cfo/decisions` | Recommendation lifecycle; approval inbox; decision history | CFO, approvers |
| Agents | `/cfo/agents` (views: catalog, runs, settings) | Capabilities, dependencies, permissions, runs, failures, retry; LLM / prompt settings (admin) | AI ops, power users |
| Audit | `/cfo/audit` | Session event log, provenance lookup, CSV export | Compliance, AI ops |

**Shared context** (URL search params on every CFO route, so links are shareable): `period`, `compare`, `scope`. The data mode is **not** a URL parameter; it comes from the environment (§2.3). In non-production environments an optional `scenario` parameter (`error | empty | loading | not-connected`) previews non-success states on explicit request; production ignores it. The Investigate panel is addressed by `?investigate=<itemRef>`, so an investigation link reopens the same item.

**Legacy redirects** (applied at cutover):
- `cfo-overview.html` → `/cfo/briefing`.
- `cfo-workspace.html?category=X&agent=Y` → `/cfo/domains/X?agent=Y` (agent findings expanded).

**Shell:** the ERMS sidebar, topbar, breadcrumb and Ctrl+K palette are unchanged. **No compelling reason to change them was found**; the CFO module fits the existing module pattern.

---

## 2. React integration architecture (based on inspecting `D:\erms-admin`)

### 2.1 What exists today (inspected read-only, 2026-11-12)

| Area | Finding | Evidence |
|---|---|---|
| Stack | React 18.3, Vite 5.4, TypeScript 5.6 (strict, `noEmit`), Tailwind 3.4, react-router-dom 6.27, lucide-react 0.454, @fontsource/inter. No other runtime dependencies | `package.json`, `tsconfig.json` |
| Routing | `BrowserRouter` → `AdminLayout` (Sidebar, Topbar, GlobalSearch, `<Outlet/>`). Modules are driven by `src/routes/moduleConfig.ts` (sidebar, tabs, breadcrumbs, search index all read it). General uses `GeneralModuleLayout` (TabStrip with keyboard + overflow); other modules use `ModuleTabsLayout`. Unbuilt tabs render `UncapturedScreen` | `App.tsx`, `layouts/*` |
| Shared components | `ui/`: ActionsMenu, AiTag (`ai`, `mocked`), Badge (5 tones), Button (primary/secondary/ghost/**danger**, sm/md/lg), Card (flat/raised/premium), Checkbox, DatePicker (single + range), Dropdown, EmptyState, FilterPresets, IconBadge, IconBadgeButton, IconButton (tones), Input, Modal (focus trap, `accent`), ModuleCard, Pagination, Radio, Skeleton, StatCard (hero/plain, trend), TabStrip, Textarea, Toast (context), Tooltip, UncapturedScreen. `data-table/`: DataTable (sorting, column visibility, sticky columns, selection, two empty states), TableToolbar, ColumnsToggle, RowActions | `src/components/*` |
| Design system / CSS | Tokens as CSS variables in `src/index.css`, mapped in `tailwind.config.js` (colors incl. `chart.1–5` and 8 `module.*` identity hues, spacing, radius, shadow, control heights, type scale, breakpoints xs 480 / sm 768 / md 1024 / lg 1440). No dark mode | `index.css`, `tailwind.config.js` |
| State | Local component state; one React context (Toast). No global store | grep |
| API integration | **None.** All data is static mock modules (`src/data/*`) and rule helpers (`src/lib/*`). `lib/aiMock.ts` documents the "drop-in fetch replacement" convention | `src/data`, `src/lib` |
| Auth / tenant | **None** (design.md §7: no login, no session; "System Admin" is hardcoded) | — |
| Tests | **None.** No test runner or test files | `package.json` |
| Charts | **None.** No chart library and no chart component | grep |
| Build / deploy | `npm run build` = `tsc -b && vite build` → static `dist/`. **No CI or deployment configuration and no git repository** found. BrowserRouter requires an SPA history fallback on the host | repo root |
| CFO | No CFO module in the React app. `D:\erms-admin` also contains **older copies** of `cfo-overview.html` / `cfo-workspace.html`. The canonical, current copies are in `D:\cfo` | diff |
| Its own governance | `D:\erms-admin\CLAUDE.md` (stale: says the repo contains only `Admin.pdf`) and `.claude/` (design agents, skills, decision log) | — |

### 2.2 Proposed integration (reuse first; no new runtime dependency)

```
src/routes/moduleConfig.ts        + { key:'cfo', label:'CFO', path:'/cfo', iconKey:'cfo', tabs:[briefing, domains, signals, decisions, agents, audit] }
                                    → sidebar item, breadcrumbs and Ctrl+K entries come for free
src/lib/icons.ts                  + 'cfo' → BriefcaseBusiness; 6 tab icons (lucide-react, already installed)
src/App.tsx                       + explicit /cfo route subtree (like /reports): briefing, domains/:domainId, signals, decisions, agents, audit
src/layouts/CfoModuleLayout.tsx   NEW: TabStrip (reused) + ContextBar + <Outlet/> + InvestigatePanel host. Mirrors GeneralModuleLayout without editing it
src/pages/cfo/                    BriefingPage, DomainPage, SignalsPage, DecisionsPage, AgentsPage, AuditPage
src/components/cfo/               ContextBar, OriginLabel, ProvenancePopover, SignalRow, DecisionCard, InvestigatePanel, ScenarioChart, NotConnectedState
src/lib/cfo/engine/               schema.ts, calc.ts, rules.ts, forecast.ts, thresholds.ts, origin.ts  (pure TS, no React; Release 2 plan)
src/lib/cfo/dataSource.ts         CfoDataProvider interface + selectProvider(env) (§2.3); typed errors (NOT_CONNECTED, AUTH, TIMEOUT, INVALID_RESPONSE, SERVER)
src/lib/cfo/providers/sample.ts   sample provider: deterministic, illustrative; same figures as the workspace CFO_SAMPLE; origin 'demo' (shown as "Sample")
src/lib/cfo/providers/live.ts     live provider: fetch to the CFO backend API (same contract); refuses sample/fixture-origin records (MIXED_ORIGIN)
src/lib/cfo/__fixtures__/         test fixtures + fixture provider: deterministic, versioned with the tests, never bundled in production
src/lib/cfo/orchestrator.ts       registry, queue, lifecycle (Idle→Queued→Running→Completed/Failed/Cancelled), retries, history; no agent-to-agent calls
src/lib/cfo/decisions.ts          recommendation state machine; Execute never enabled without a service + authorization
src/lib/cfo/audit.ts              session-only event log + CSV via existing lib/exportCsv.ts (never localStorage)
src/hooks/useCfoContext.ts        period/compare/scope/mode ↔ URL search params
src/hooks/useCfoRequest.ts        AbortController, timeout, duplicate guard, stale-response token (Release 1 semantics)
src/types/cfo.ts                  domain types (Invoice, Receipt, Customer, Dispute, CalcResult, Anomaly, Forecast, Recommendation, AgentRun, AuditEvent)
```

**Reuse map (no duplication):**

| Need | ERMS component |
|---|---|
| Section tabs | `TabStrip` |
| KPI tiles | `StatCard` (`hero` variant, `trend`, `loading`); origin label and provenance trigger added via a wrapper, not a fork |
| Tables | `DataTable` + `TableToolbar` (search, filter chips, column toggle, empty states, sticky header) |
| Status / severity | `Badge` + `IconBadge` tones |
| Origin labels | `AiTag` (see the design-system decision in §6.3) |
| Period / compare | `DatePicker` (`mode="range"`) + `Dropdown` |
| Confirmations (Reject, Approve, Defer) | `Modal` + `Button` (`danger` only inside confirmations) |
| Toasts / announcements | `Toast` context |
| Empty / not built | `EmptyState`, `UncapturedScreen` |
| CSV export | `lib/exportCsv.ts` |
| Fuzzy search | `lib/fuzzy.ts` |
| Tooltips | `Tooltip` |

**New code is limited to the 8 approved components plus pages and logic.** `ScenarioChart` is a small SVG component using existing tokens; no chart library is added. Rationale: the needs are line, band and markers, a library would be the app's first chart dependency, and an SVG component keeps full control of accessibility.

### 2.3 Data access and data-mode strategy (Decision 6 — resolved 2026-11-12)

#### 2.3.1 Mode by environment
The data mode is fixed per environment at build/deploy time (e.g. `VITE_CFO_DATA_MODE`, defaulted from the Vite mode). It is not user-switchable from the URL or UI.

| Environment | Default mode | Provider | Data shown | Indicator |
|---|---|---|---|---|
| Local development | `sample` | `providers/sample.ts` | Deterministic illustrative data | ContextBar "◆ Sample data — not live" + ◆ origin labels |
| UX prototyping / design review | `sample` | same | same | same |
| Preview / staging deployments | `sample` (live only if that environment is separately configured and authorized) | same | same | same |
| Automated tests (engine, UI harness, CI) | `fixture` | `__fixtures__` provider | Deterministic test fixtures owned by the tests | Same sample indicator, so tests also assert labelling |
| Production | `live` | `providers/live.ts` | Live API data from the CFO backend | Origin labels (actual, fx, ≈, ⚙, ✦); no sample indicator |

#### 2.3.2 One contract for every provider
All providers implement the same documented `CfoDataProvider` contract, so the UI never knows which one it is talking to:
```
interface CfoDataProvider {
  readonly mode: 'sample' | 'fixture' | 'live';
  getDataset(req: {scope, from, to}, signal: AbortSignal): Promise<Dataset>;           // engine input
  listAgents(domainId: string): Promise<Agent[]>;                                        // = CFO_SAMPLE.listAgents
  getSummary(req: {domainId, agentId, from, to, ...}, signal): Promise<SummaryResult>;   // = CFO_SAMPLE.getSummary
  answer(req: {domainId, agentId, question, context, periodEnd}, signal): Promise<Answer>; // = CFO_SAMPLE.answer
}
```
- The `listAgents` / `getSummary` / `answer` shapes are the ones documented for the workspace `CFO_SAMPLE` layer (`architecture.md` → *Sample data layer*). The sample provider reuses that content and its figures; the live provider maps backend responses onto the same shapes.
- Every result carries `origin`; sample results are `demo` ◆ (displayed as "Sample"), live results `actual` / `calculated` / `forecast` / `rule` / `ai`.
- Contract tests run every provider against the same schema checks.

#### 2.3.3 Production rules (live)
- **No silent fallback.** When a live request fails or no endpoint is configured, production shows the matching state — `NotConnectedState` ("Data source not connected" + what is missing), timeout, auth or server error with Retry. It **never** substitutes sample or fixture data.
- The sample and fixture providers are excluded from production builds (environment-constant branch, tree-shaken), so a fallback is impossible by construction; the live provider additionally refuses `demo`-origin records (`MIXED_ORIGIN`).
- The `scenario` URL parameter is ignored in production.
- Connecting a specific live endpoint still requires the backend contract (§8) and an authorized environment configuration; until then production honestly shows not-connected states.

#### 2.3.4 Labelling and AI
- Sample data and sample responses are always identified: the persistent ContextBar indicator, ◆ origin labels on values, "Sample" on chat/investigation answers, and "Sample data" in exports.
- **AI/model access only through a secure server-side LLM gateway** (versioned prompts/models). The browser calls the CFO backend; it never holds API keys or calls a model provider directly. In `sample` and `fixture` modes no model is called and answers are labelled ⚙ rule-based. ✦ AI appears only in live mode when the gateway actually produced the answer.

#### 2.3.5 Standalone workspace vs React production module

| | Standalone CFO Workspace (`cfo-workspace.html`) | React CFO module (`D:\erms-admin`) |
|---|---|---|
| Purpose | UI/UX prototype, available until cutover (§9) | The future product |
| Data mode | **Always local sample data** (`CFO_SAMPLE`); no live mode; `?demo=` previews only on request | **By environment** (§2.3.1): sample in dev/prototype/preview, fixtures in tests, **live in production** |
| "Data source not connected" | Never in normal use | Shown in production when the live source is unavailable — never replaced by sample data |
| Contract | `CFO_SAMPLE.listAgents / getSummary / answer` | `CfoDataProvider` — same three shapes + `getDataset` |
| Change control | Behaviour unchanged by this decision; any live mode needs explicit authorization | Live endpoints need the backend contract and an authorized environment configuration |

This decision changes **no** workspace behaviour, file or test.

- **State:**
  - Context in URL params (`useCfoContext`).
  - Derived data in a `CfoDataProvider` context per module session, holding the dataset, engine results, signals and decisions.
  - No global store library. This matches the app's current pattern (Toast context).
- **Requests:** `useCfoRequest` ports the Release 1 behaviour: abort on context change, provisional 30 s timeout, duplicate suppression, stale-response token, and cache keyed by the full context. Background completion never moves focus.

### 2.4 Authentication and tenant context
- **None exists.** The integration defines a `CfoSession` contract, `{ userId?, roles?, tenantId?, entities? }`, whose production provider reports **"identity not connected"**.
- **UI consequences:**
  - The actor is shown as "Current user (identity not connected)".
  - Approve and Execute are not role-enforced in the browser. They are recorded-only or disabled with a reason.
  - Scope lists only what the data source returns.
- **Enforcement** of roles, approval matrix and tenant isolation **must be server-side**. The browser only reflects it.

### 2.5 Testing (no new dependency proposed)
- **Engine:** Node's built-in runner with type stripping, `node --test --experimental-strip-types src/lib/cfo/**/*.test.ts` (Node 22.23 is installed).
  - Engine files use relative `.ts` imports. That needs `allowImportingTsExtensions`, which is compatible with the existing `noEmit: true`.
  - The 57 test cases from `tests/retired/r2-release2-tests.js` (formerly `tests/r2.test.js`) are ported 1:1.
- **UI behaviour:** a headless-browser harness extended from the workspace harness (`tests/workspace.test.js` + `tests/harness/*.harness.js`; Chrome/Edge, no npm dependency), covering states, keyboard, breakpoints, URLs and journeys. The Release 1 request semantics (abort, timeout, settings-keyed cache) are a design input only; they were rolled back from the workspace. Playwright is an option only with separate approval.
- **Fixtures:** all automated tests run in `fixture` mode against deterministic fixtures in `src/lib/cfo/__fixtures__/`. They never call a live API or a model, and they don't depend on the editable sample content. A contract test checks the sample, fixture and live providers against the same schema.
- **Type safety:** `npm run typecheck` (existing).

### 2.6 Build and deployment
Unchanged: `npm run build` produces the same static `dist/`. **Open questions:** hosting, SPA fallback, CI, environments. **Recommendation:** initialize git in `D:\erms-admin` before any change, so the transformation is reviewable and reversible. It isn't under version control today.

---

## 3. Screen specifications (see mockups)

| Screen | Content (top → bottom) | States |
|---|---|---|
| **Briefing** | Context bar · 6 health tiles (DSO, Overdue AR, Ending AR, Unapplied cash, Collection rate, Disputes 61+), each with delta, comparison value, origin labels and a provenance trigger · Material movements (top 4 signals) · Executive summary (template-composed, each sentence linked to its source) · Decisions needed · Outlook (forecast table + method caption) · Since your last visit | Loading (StatCard `loading`, skeletons) · demo · production not connected (tiles "—"; one explanatory panel; nothing fabricated) · partial (some calcs unavailable: tile shows the reason) · error (request failed or timed out: inline error + Retry) |
| **Domain** | Domain switcher · 4 KPI tiles · trend chart with Actual / vs Prior / vs Forecast · contributors DataTable · ageing table · domain signals · recommendations · agent findings | Same as above, plus insufficient history (no forecast) and gap in series |
| **Signals** | Monitoring status line (in-tab only) · Thresholds · DataTable: severity, signal, domain, observed vs threshold, impact, seen (count), status, actions · notes for rules not run | Empty ("no signals" vs "no data checked" are different messages) · paused (tab hidden / not connected) |
| **Decisions** | Local tabs All / Awaiting my approval / Open / Decided · decision cards | Each lifecycle state (§4.5); action failure reverts with an error |
| **Agents** | Catalog DataTable (capabilities, dependencies, permissions, status, last run) · Runs view · Settings (admin) | Proposed-not-connected · simulated (demo) · queued / running / completed / failed / cancelled |
| **Audit** | Session-only disclosure · filters · event DataTable · CSV export | Empty · export failure |

---

## 4. Component specifications (design approved; implementation pending)

### 4.1 ContextBar
- **Anatomy:** Period (`DatePicker` range + presets), Compare (`Dropdown`: prior period, same period last year, forecast, none), Scope (`Dropdown`: entities and currency), as-of/refresh text, data-context indicator (◆ Sample data — not live [sample/fixture modes] / Live — not connected / Live — connected [production]). It is set by the environment (§2.3.1), not a user control.
- **Behaviour:**
  - Changes update URL params and recompute every section.
  - An in-flight request is aborted.
  - Focus stays on the control.
  - A polite announcement such as "Briefing updated for Q4 2025" is made.
- **Validation:** invalid range → `DatePicker` error text plus `aria-invalid`; nothing is requested.
- **< 768px:** the bar collapses to one summary button that opens a sheet with the three fields.
- **A11y:** `role="region"` "Reporting context"; each control labelled; the data-context indicator is `role="status"`.

### 4.2 OriginLabel
- **Kinds:** `actual` (only with a connected live source), `demo` ◆ (displayed as "Sample"; sample/fixture modes only), `calculated` fx, `forecast` ≈, `rule` ⚙, `ai` ✦ (only with a connected model).
- Each kind is a glyph plus a word. The text is part of the value's accessible name, e.g. "42.3 days, calculated from demo data".
- Derived values show both labels.

### 4.3 ProvenancePopover
- **Trigger:** an ⓘ `IconButton` labelled "How <metric> is calculated".
- **Content:** formula, inputs (with values), period and as-of date, origin, assumptions, the "Provisional methodology — not an approved financial KPI" note, and missing fields when unavailable.
- **Behaviour:** non-modal; Esc and outside click close it; focus returns to the trigger.

### 4.4 SignalRow
- **Columns:** severity (word + icon shape + tone), title, rule ref, observed vs threshold, impact (amount or "Not calculable"), seen count, status, actions (Investigate, Acknowledge, Create recommendation).
- **States:** new, acknowledged, resolved, not run (reason).

### 4.5 DecisionCard
- **Fields:** priority, status, origin, ref, title, problem, evidence links, financial impact, proposed action, expected outcome, uncertainty, required authorization, timeline.
- **Lifecycle:** Proposed → Accepted / Rejected / Modified / Deferred → Approval requested → Approved (recorded) → Executed (**only when confirmed by a connected service**) → Verified.
- **Actions:**
  - Accept, Reject…, Modify…, Defer…, Request approval / Approve…
  - Execute is always `aria-disabled` with its reason via `aria-describedby`.
  - Reject and Approve confirmations use `Modal` with a required reason; the `danger` button appears only inside the Reject confirmation.
- Every action creates an audit event.

### 4.6 InvestigatePanel
- **Placement:** non-modal right sheet, 560px at ≥1024; a full-width overlay below 1024.
- **Opens from:** KPI tiles, signals, recommendations, table rows, agent findings.
- **Anatomy:**
  - Header: ref, title, pin, close.
  - Context line: domain, period, scope, origin.
  - Evidence: rule, observed, threshold, inputs.
  - Related signals, across domains.
  - Q&A: each answer carries origin plus Verified / Partial / Not available.
  - Suggested questions.
  - Ask field.
- **Answer rules:**
  - Answers come from engine results only (keyword intents → calculations). They are labelled ⚙ Rule-based.
  - Missing data is stated explicitly.
  - Nothing is presented as AI unless an LLM gateway is connected.
- **A11y:**
  - Focus moves to the heading on open and returns on close; Esc closes.
  - The Q&A list is `aria-live="polite"`.
  - One panel at a time.

### 4.7 ScenarioChart (SVG)
- **Series:**
  - Actual: `primary-500` solid line, circle markers.
  - Prior: `gray-400` thin line, open markers.
  - Forecast expected: `primary-300` dashed line, square markers.
  - Scenario band: `primary-50` fill with a `primary-200` edge.
- Plus a "Forecast →" boundary and a legend whenever there is more than one series.
- **Alternatives:** `<title>`/`<desc>` summarise the trend in words; "Show data table" reveals the full values. The visible table's design is **deferred for separate review**; until then the table is available as a screen-reader table plus CSV.
- **States:** loading, insufficient history, gap, not connected.

### 4.8 NotConnectedState
- **Variants:** tile, table, section. Dashed border and link icon.
- **Content:** what is missing, and what it unlocks.
- **Never** rendered as "empty" or "no anomalies".

---

## 5. Primary user journeys
Walk-throughs with screen links are in the mockup's "User journeys" view.
1. **CFO:** Briefing → since last visit → Investigate DSO → Decisions › Approve REC-0007 (recorded; no execution).
2. **AR / Collections:** Signals (Receivables, Collections) → Domain contributors → Investigate a customer (payment-delay signal) → Accept outreach recommendation (execution needs a collections service).
3. **Credit:** R-CR-01 over-limit signal → Investigate exposure (payment-trend rule not run: insufficient history, shown) → Request approval. **No credit limit is ever changed by the system.**
4. **Cash application:** Unapplied-cash signal → Domain Cash App: receipts unapplied > 5 days → CSV export with origin column → Acknowledge (audited).
5. **Analyst:** Domain → Compare vs Forecast → formula popover → change context to Q4 vs Q3 (shareable URL) → export.

---

## 6. Responsive, accessibility and design-system specifications

### 6.1 Responsive (ERMS breakpoints)

| Width | Behaviour |
|---|---|
| ≥ 1440 | Six tiles in one row; two-column body; 560px Investigate sheet |
| 1024–1439 | Sidebar visible; tiles 3 per row; two-column body with a narrower side column |
| 768–1023 | Sidebar off-canvas; tiles 2 per row; single column; Investigate full-width overlay |
| < 768 | Tabs show icons + counts with a "More" overflow; context bar collapses to a summary button; tables become stacked label/value rows; badges never stretch |

### 6.2 Accessibility (WCAG 2.2 AA; colour-blind safe)
- **Never colour alone:**
  - Severity, status and origin are word plus glyph/shape.
  - Chart series differ by line style and marker shape.
  - Trends carry a direction arrow and a sign.
- **Tabs:** `TabStrip` semantics with roving tabindex and arrows; counts in accessible names ("Signals, 9 new").
- **Tables:** `DataTable` with captions, `scope`, `aria-sort`.
- **Live regions:** polite for updates, monitoring and background completion; alerts only for the user's own failed actions; no duplicate announcements (resolves legacy TD-A11Y-1).
- **Focus:**
  - Never moved by background work.
  - Restored after dialogs, popovers and the sheet.
  - On route change, focus goes to the page `h1` (resolves TD-A11Y-2).
  - During loading the trigger stays focusable or focus moves to the status (resolves TD-A11Y-3).
- **Disabled actions:** `aria-disabled` plus a visible reason.
- **Targets:** ERMS control scale 32–40px, all ≥ 24px (2.5.8). The 44px target remains documented design debt.
- **Reduced motion:** no animation in charts or sheets.
- **Contrast:** only the ERMS token pairs that `tailwind.config.js` documents as verified (≥ 4.5:1 text).

### 6.3 Design-system changes requiring approval

| # | Change | Why | Alternative |
|---|---|---|---|
| DS-1 | Extend `AiTag` kinds with `calculated`, `forecast`, `rule` (and an `actual` variant) | design.md §3.5 makes AiTag "the single consistent marker" for AI/mock surfaces; origin labels belong to that one system | A separate `OriginLabel` composing `Badge`. Avoids touching AiTag, but adds a second marker system |
| DS-2 | Chart series roles (forecast = `primary-300` dashed, prior = `gray-400`, band = `primary-50`) | No chart roles exist; `chart.1–5` are assigned to entity types (customers, statements…) | Use `chart.*` colours, which would conflict with their documented meanings |
| DS-3 | Ninth module-identity colour for CFO (Home quick links, palette rows) | design.md §7: the eight hues are fully assigned, none reserved | No module colour for CFO; the palette rows fall back to the neutral icon colour |
| DS-4 | `InvestigatePanel` as a new container type (side sheet) | No sheet/drawer exists; Modal is centred and modal | — |
| DS-5 | Visible data table under charts | Deferred by decision | — |

`design.md` and `design-system.md` stay unchanged until these are approved.

---

## 7. AI feature → UX mapping

| Capability | Where it appears | Origin label | Real today? |
|---|---|---|---|
| 10 calculations | Tiles, KPIs, tables, popovers | fx (+ ◆ on sample data) | Logic specified and tested in spec; sample data in dev/preview; live data in production once connected |
| 8 anomaly rules | Signals, Briefing movements, Domain side column | ⚙ | Same |
| Forecast F-MA3 / F-LIN | Outlook, Domain trend | ≈ | Same |
| Executive summary | Briefing | ⚙ Template | Template over validated items; no LLM |
| Investigation Q&A | Investigate panel | ⚙ (✦ only with LLM gateway) | Rule-based intents; no LLM |
| Recommendations | Decisions, Briefing, Domain | ⚙ (rule-derived) | Lifecycle is session-only; Execute disabled |
| Orchestration | Agents, agent findings, provenance lines | — | Simulated in sample mode only; in production, agents show not connected until the runtime exists |
| Monitoring | Signals header, toasts | ⚙ | In-tab only, disclosed |
| Audit | Audit, timelines | — | Session-only, disclosed |
| Payment-delay / overdue-invoice prediction | Agents (Future capability) | — | Deferred by decision |

Nothing is added only to increase the feature count. Every entry above serves a journey in §5.

---

## 8. Backend and data dependencies

| Dependency | Needed for | Until available |
|---|---|---|
| Financial data API (invoices, receipts, customers + limits, disputes, period totals) per tenant/entity | Everything in production | Dev/prototype/preview use sample data; production shows not-connected states (never sample data) |
| Identity, roles, approval matrix, tenant isolation (server-enforced) | Attribution, approvals, scope | "Identity not connected"; recorded-only actions |
| Decisions service | Persisting recommendations and approvals | Session-only |
| Orchestration / agent runtime | Real agent runs | Simulated in sample mode only |
| LLM gateway (server-side, versioned prompts/models) | ✦ AI summaries and answers | Rule-based ⚙ only |
| Monitoring scheduler + notifications | Continuous monitoring | In-tab only, disclosed |
| Audit store (immutable) | Compliance-grade audit | Session-only, disclosed |
| PDF rendering | PDF export | CSV only |
| Hosting, SPA fallback, CI, environments | Release | Open question |

---

## 9. Migration strategy (existing experience stays available)

| Stage | What ships | Legacy pages | Exit criteria |
|---|---|---|---|
| 0. Prerequisites | Git in `D:\erms-admin`; decide where CFO governance lives in that repo; design-system decisions DS-1…DS-5 | Live, unchanged | Approvals recorded |
| 1. Foundations | Engine (Release 2 plan, TS, 57 ported tests), data source, request hook, CFO module route + layout + ContextBar + OriginLabel + NotConnectedState | Live | Engine + provider contract tests green (fixture mode); typecheck; sample mode labelled in dev/preview; production build excludes sample/fixture providers and shows honest not-connected states |
| 2. Experience | Briefing, Domains, Signals, Decisions, Agents, Audit, InvestigatePanel, ScenarioChart, ProvenancePopover | Live | All 5 journeys pass in sample and fixture modes; a11y audit; behavioural harness (incl. Release 1 semantics) green |
| 3. Parity and cutover | Legacy URL redirects; sidebar CFO item points to the React module | Redirected, files kept one release | Parity checklist: every legacy capability (summary, chart, CSV/PNG, chat, share, pin/feedback) has a replacement or a documented retirement |
| 4. Retirement | Remove legacy pages from `D:\cfo` and the stale copies in `D:\erms-admin` | Removed | Approval |

The workspace pages remain under the design freeze (no redesign), running on local sample data by default, until stage 3. Parity is measured against the sample-data workspace: all 8 categories, 32 agents, summary, chart, chat, exports.

---

## 10. Open decisions for the reviewer
1. Approve the visual direction (mockups) or request changes.
2. DS-1 to DS-5 (§6.3).
3. Initialize git in `D:\erms-admin` and decide where the CFO governance lives there (its `CLAUDE.md` is stale; amendments there need your authorization).
4. Hosting, CI and SPA-fallback owner.
5. Confirm `D:\cfo` as the canonical location of the legacy pages; the copies in `D:\erms-admin` are older.
6. ~~Default data mode for the React module.~~ **RESOLVED 2026-11-12** — environment-based (§2.3): sample in local development, UX prototyping and preview; deterministic fixtures in automated tests; live API in production with no silent fallback to sample data; one documented contract for all providers; sample always labelled; AI only via a server-side gateway. The standalone workspace is unchanged (§2.3.5).
