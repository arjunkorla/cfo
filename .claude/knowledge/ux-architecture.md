# CFO Intelligence — UX architecture proposal

> **Note 2026-11-12 — sample-data-first direction.** Findings that describe the workspace as production-default with "Data source not connected" (e.g. U13) reflect the Release 1 code, which was rolled back. The workspace now runs on the local `CFO_SAMPLE` sample-data layer by default. "Not connected" states and the `?mode=demo` data indicator in the concepts below apply only to the React platform, as defined by the environment-based data-mode strategy (Decision 6, resolved — `cfo-platform-spec.md` §2.3): sample in dev/preview, live with honest not-connected states in production.

Status: **Concept C APPROVED 2026-11-12** (with Briefing as home). §1–§3 (audit, concepts, evaluation) remain the reference. **§4–§12 are superseded by `cfo-platform-spec.md`**, which reflects the React integration and the final decisions.

**Supersedes:** `ux-proposals.md` (P1–P6). Those were designed inside the frozen 3-panel layout; their content is folded into the new architecture below (§6–§7).

**Grounding.** This proposal is based on the current `cfo-overview.html` / `cfo-workspace.html` code, `status.md`, and `design.md`. `design.md` documents the wider ERMS Admin application: its shell, tab strip, DataTable, StatCard, Badge, Tooltip, Modal, command palette, and the Home screen's Daily Summary and Needs Attention cards. Nothing below assumes a backend that doesn't exist; §9 lists every dependency.

---

## 1. UX audit of the existing workspace

### 1.1 Structural problems (all roles)

| # | Finding | Evidence | Impact |
|---|---|---|---|
| U1 | **The page is agent-first.** Nothing appears until the user picks one of 4 agents per category (32 in total once the D6 agents land). Finance users think in metrics, exceptions and questions, not in agent names. | `#stIdle` "Select an agent…"; `renderAgents()` | The user has to know which agent answers their question. Discovery cost grows with every agent added |
| U2 | **The overview page is a menu, not a home.** Eight category cards with `[#] agents` and no health signal, change or alert. | OV:306-312 | Two clicks before any information. Nothing answers "what needs me today?" |
| U3 | **One category at a time.** Every view is scoped to one tab. CFO questions cross domains: DSO is driven by disputes and cash-application delays. | `setCategory()` scopes everything | Cross-domain root causes can't be investigated in one place |
| U4 | **Engineering controls on the main toolbar.** "LLM Provider" and "LLM Model" selects sit next to the date range for every user. | WS toolbar `#provider`, `#model` | Cognitive load for executives. Model choice is a governance and admin setting; the user should see it only as provenance |
| U5 | **No numbers.** The summary is prose sections. There are no KPIs, no prior-period comparison, no "what changed". | `SECTIONS`, `renderResult()` | Executives scan numbers first. Prose-only output is slow to verify and easy to distrust |
| U6 | **The chart is detached from the question.** One chart per agent result, with placeholder data. Pie is offered for any data, including trends. No comparison, no drill-down. | `drawChart()`, `#chartType` | Weak analytical value. The choice of chart type is pushed onto the user |
| U7 | **Housekeeping is emphasised over decisions.** The action bar has Regenerate, Edit prompt, Copy, PDF, Share, Pin, Like, Dislike. There is no Accept, Assign or Approve, and no decision trail. | `.actionbar` | The product helps people read, not act. There is no human-in-the-loop workflow |
| U8 | **Chat is ephemeral and tied to one summary.** It isn't reachable from a metric or an exception. | `send()`, `threads` | Investigation can't start from where the problem is seen |
| U9 | **There's no notion of "since last visit", alerts, or ownership.** | absent | Nothing to triage. Users must re-run agents to find out whether anything changed |
| U10 | **The layout fights density.** Three fixed panels: below 1280px the chart moves into a tab, and the agents panel uses 280px permanently for navigation. | `.ws` grid, `applyNarrow()` | The analysis area is the narrowest part of the screen on common 1366–1440px laptops |
| U11 | **Mostly icon-only actions** (copy, pdf, share, pin, focus, collapse) at 32px. | `.actionbar`, panel heads | Low discoverability. Below the 44px target (accepted design debt) |
| U12 | **Inconsistent with the rest of ERMS.** The CFO pages use a bespoke panel layout. They don't use ERMS's sub-module tab strip, DataTable, StatCard, Badge or Tooltip (design.md §3–§4). The page breakpoint is 1280px; design.md defines 480/768/1024/1440. | WS CSS vs design.md §2.4, §3 | Feels like a separate product inside the admin app |
| U13 | **Production honesty is correct but bleak.** Since Release 1, production shows "Data source not connected" after every click. | `dataSource.production` | Any redesign must make "not connected" a designed, first-class state, not a dead end |

### 1.2 By role

| Role | Primary jobs | Friction today | Missing |
|---|---|---|---|
| **CFO / finance executive** | Know financial health in 2 minutes; spot risks early; decide; approve | U1, U2, U4, U5, U7 | Cross-domain briefing, what changed, pending approvals, decisions needed |
| **AR / collections manager** | Prioritise the worklist; track promises-to-pay and collection rate; find overdue drivers | U1, U3, U6 | Customer-level contribution tables, ageing view, rule-based exceptions with owners |
| **Credit / risk manager** | Watch exposure vs limits; investigate deteriorating customers; propose limit changes for approval | U3, U7 | Exposure table, utilisation alerts, a recommendation-to-approval flow (no autonomous limit change) |
| **Cash application / reconciliation** | Clear unapplied cash; resolve remittance exceptions | U1, U5, U9 | Exception queue with age, amount and reason; unapplied % trend |
| **Financial analyst** | Compare periods; forecast; export verified data with provenance | U5, U6 | Variance/compare, provisional forecast with scenarios, provenance-stamped exports |
| **Platform / AI operations** (secondary) | Know which agents ran, failed or are queued; retry; audit | Agents only visible as a list | Run history, dependencies, permissions, audit log |

---

## 2. Information architecture concepts

### Concept A — Executive Intelligence Workspace
**Organising idea:** a decision brief. Home is a single long-form briefing: health scorecard → material movements → risks → outlook → decisions required. Domains are reachable only as drill-downs from briefing items. Agents are invisible apart from provenance lines.
- **Strengths:** fastest for the CFO; very low navigation complexity; strong narrative.
- **Weaknesses:**
  - Operational roles (collections, cash app) have no home.
  - Domain analysis feels secondary.
  - Agent transparency is low: who produced this, did it fail?
  - Weak for scaling to new domains.

### Concept B — AI Agent Operations Workspace
**Organising idea:** a mission control for agents. Home is an agent board (Idle/Queued/Running/Completed/Failed), task queue, orchestration graph, run history. Outputs open from agent runs.
- **Strengths:** maximum AI transparency and control; scales to many agents; good for platform operators.
- **Weaknesses:**
  - Still agent-first (U1), but amplified.
  - CFO task efficiency is poor: they must interpret agent states to reach a number.
  - It leads with machinery whose outputs are, today, mostly mocked or "not connected", which risks a product that looks busier than it is.

### Concept C — Unified CFO Intelligence Platform
**Organising idea:** the CFO decision loop **Brief → Detect → Investigate → Decide → Monitor → Trace**. Each stage is a section of one module, sharing one context bar (period, comparison, scope) and one provenance model.
- **Briefing:** cross-domain home.
- **Domains:** eight analytical workspaces with KPIs, trends, contributors.
- **Signals:** anomalies and monitoring alerts in one triage queue.
- **Decisions:** recommendations and approvals.
- **Agents:** catalog, runs, orchestration.
- **Audit:** traceability.
- **Investigate:** an investigation panel that opens from any number, signal or recommendation.
- **Strengths:**
  - Serves all roles: executives start at Briefing, operators at Signals or a Domain, AI ops at Agents.
  - Agents become producers with visible provenance, not the entry point.
  - Uses ERMS's existing module/tab pattern.
- **Weaknesses:**
  - The most components to build.
  - Needs discipline so six sections don't become six dashboards. Mitigation: one shared context bar, one item model (§6), cross-links everywhere.

### Concept D — Investigation-first (considered, not recommended)
**Organising idea:** a single canvas where the user asks a question and the system assembles metrics, charts and evidence ("ask anything" first).
- **Strengths:** modern feel; flexible.
- **Why rejected:**
  - There is **no connected LLM**. Today's "chat" is placeholder, and Release 4 contextual chat will be keyword-matched rules (approval condition 10). A question-first product would overstate AI capability, which conflicts with governance.
  - It also hides structure that regulated finance work depends on: worklists, approvals, audit.
- Its best idea, investigation launched in context, is kept inside Concept C as the Investigate panel.

---

## 3. Evaluation and recommendation

Scores are 1–5, where 5 is best. For complexity rows, 5 means simplest.

| Criterion | A Executive | B Agent ops | C Unified | D Investigation |
|---|---|---|---|---|
| CFO task efficiency | **5** | 2 | 4 | 3 |
| Information discoverability | 3 | 2 | **5** | 2 |
| Financial decision-making (incl. approvals) | 4 | 2 | **5** | 2 |
| AI transparency & explainability | 2 | **5** | 4 | 2 |
| Enterprise scalability (roles, domains, agents) | 2 | 4 | **5** | 3 |
| Navigation complexity (5 = simplest) | **5** | 3 | 3 | 4 |
| Accessibility (predictable structure, keyboard, SR) | 4 | 3 | **4** | 2 |
| Responsive behaviour | **5** | 2 | 4 | 3 |
| Implementation complexity (5 = simplest) | **4** | 2 | 2 | 2 |
| Governance fit (honesty, human approval) | 4 | 3 | **5** | 1 |
| **Total (of 50)** | 38 | 28 | **41** | 24 |

**Recommendation: Concept C, with Concept A's Briefing as its home.**

**Why C is superior:**
- It is the only concept that serves the CFO and the operational teams without a second product.
- It turns the AI from a menu (agent-first) into a provenance layer: every number, signal and recommendation says what produced it, how, and from which data origin.
- It puts the human-approval workflow at the centre (Decisions), not at the edge.
- It also maps directly onto ERMS's existing module pattern: one sidebar item ("CFO") with a sub-module tab strip (design.md §4.3). That keeps the whole application consistent instead of creating a new layout language.

**Its cost** is implementation size (§9–§10). It is phased so each phase ships a coherent, usable section.

---

## 4. Recommended navigation structure

The **ERMS shell is kept** unchanged: 88px sidebar, 56px topbar, breadcrumb, Ctrl+K. This is the "design consistency across the entire application" requirement. The CFO sidebar item opens a **module with six sub-tabs**, using design.md §4.3's full-keyboard tab strip with "More ▾" overflow.

```
ERMS shell ─ Sidebar: … Reports · Mass Upload · CFO ◀ (active)
             Topbar:  Home › CFO › <section>                         [Search Ctrl+K] [Lang] [Help] [User]
CFO module tab strip:  BRIEFING | DOMAINS ▾ | SIGNALS | DECISIONS | AGENTS | AUDIT
Context bar (shared, sticky under the tab strip):
             Period [Last 30 days ▾  01 Jan – 31 Jan 2026]  Compare [Prior period ▾]  Scope [All entities ▾]
             Data: ● Production — not connected   |  or  ◆ Demo — synthetic data (?mode=demo)
```

| Section | Route (proposed) | Contains | Primary users |
|---|---|---|---|
| Briefing | `cfo/briefing` (module home) | Cross-domain scorecard, material movements, top signals, outlook, decisions needed, what changed since last visit | CFO, executives |
| Domains | `cfo/domain/<credit\|collections\|receivables\|cash-app\|disputes\|portal\|efficiency\|kpis>` | Per-domain KPIs, trend + comparison, contributors table, domain signals and recommendations, agent findings | Managers, analysts |
| Signals | `cfo/signals` | Unified triage queue of anomalies (rule-based) and monitoring alerts; filter by domain, severity, status, owner | Managers, CFO |
| Decisions | `cfo/decisions` | Recommendations by lifecycle; approval inbox ("Awaiting my approval"); decision history | CFO, approvers, managers |
| Agents | `cfo/agents` | Agent catalog (32, "Proposed capability — not connected"), runs, queue, dependencies, permissions, failures, retry | AI ops, power users |
| Audit | `cfo/audit` | Event log (session-only until a service exists), provenance lookup by item id, export | Compliance, AI ops |

Global, not a tab:
- **Investigate panel.** Opens from any item.
- **Ctrl+K palette.** Already the ERMS pattern. CFO entries are added: domains, metrics, signals by ref, agents, actions.

**Removed from the main toolbar:** LLM provider/model. It moves to *Agents › Settings* (admin) and is shown as provenance on every generated item (U4).

**URL migration:**
- `cfo-workspace.html?category=X&agent=Y` → `cfo/domain/X` with that agent's findings expanded.
- `cfo-overview.html` → `cfo/briefing`.

---

## 5. Layouts

Wireframes use lg (≥1440px) unless stated. `[Badge]` = design.md Badge; `{Stat}` = StatCard; `▦` = DataTable; `◆ Demo` / `fx` / `≈ Forecast` / `⚙ Rule-based` / `✦ AI` = origin labels (§7.2).

### 5.1 Briefing (module home)

```
┌ CFO ─ BRIEFING | DOMAINS▾ | SIGNALS (7) | DECISIONS (2) | AGENTS | AUDIT ────────────────────────────┐
│ Period [Jan 2026 ▾]  Compare [Prior period ▾]  Scope [All ▾]          ◆ Demo — synthetic data      │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Financial health                                                       Since your last visit (2) │
│ {DSO 42.3 d ▲10.4 fx} {Overdue 23.4% ▲3.2pp fx} {Unapplied 6.1% ▼0.4pp fx} {Collected 61% ▼5pp fx}│
│ {Exposure >90%: 4 customers fx} {Open disputes 38 · 61+d 26% fx}                                  │
├───────────────────────────────────────────────┬──────────────────────────────────────────────────┤
│ Material movements                     ⚙       │ Decisions needed                                │
│ • Receivables  DSO +10.4 d vs Dec  [High]       │ ▢ Review credit limit — Customer 014  [Awaiting │
│   driven by: 3 customers = 68% of overdue      │    my approval]  Requires: Credit Manager        │
│   [Investigate] [Open domain]                  │ ▢ Escalate unapplied receipts > 5 days [Proposed]│
│ • Cash App  Unapplied 6.1% ≥ 5% threshold [Med]│ [Open Decisions]                                │
│ • Disputes  26% aged 61+ ≥ 25% [Med]           ├──────────────────────────────────────────────────┤
│ [All signals (7)]                              │ Outlook (next 3 periods)           ≈ Forecast    │
├───────────────────────────────────────────────┤ Collections: expected 1.82M  (scenarios 1.61–2.03)│
│ Executive summary                     ✦ / ⚙    │ "Provisional scenarios, not confidence intervals"│
│ Composed only from the validated items above;  │ [View forecast]                                 │
│ each sentence links to its source item.        │                                                  │
└───────────────────────────────────────────────┴──────────────────────────────────────────────────┘
```

All figures shown are illustrative placeholders for the layout only. Real values come from the calculation engine (Release 2) over demo or connected data.

**Production with no data source:**
- The scorecard tiles render the designed **Not connected** state: label, "—", "Data source not connected".
- The sections collapse to one EmptyState explaining what connects them, with a link to *Agents › Data sources*.
- No numbers or sentences are fabricated.

### 5.2 Domain workspace (e.g. Receivables)

```
┌ … | DOMAINS: Receivables ▾ | …  ─ context bar ──────────────────────────────────────────────────┐
│ {DSO 42.3 d fx ⓘ} {Overdue % 23.4 fx ⓘ} {91+ share 7.9% fx ⓘ} {Ending AR 4.82M fx ⓘ}            │
├──────────────────────────────────────────────────────────────┬───────────────────────────────────┤
│ Trend  [Actual][vs Prior][vs Forecast]   [Bar|Line]  ⤓CSV ⤢   │ Signals in Receivables (3)        │
│  ───────●──────●─────●- - - -◌- - -◌   ▒▒ scenario band       │ [High] DSO +10.4 d R-DSO-01  ⚙    │
│  Legend: ● Actual  ◌ Forecast (provisional)  ▒ Best–worst     │ [Med]  Overdue 23.4% R-OD-01 ⚙    │
│  ≈ Forecast (provisional) — not actuals · method F-LIN        │ [Investigate] each                │
├──────────────────────────────────────────────────────────────┼───────────────────────────────────┤
│ Ageing  ▦ Current | 1–30 | 31–60 | 61–90 | 91+  (amount, %)   │ Recommendations (1)               │
│ Top contributors to overdue  ▦ Customer · Overdue · Share ·   │ Prioritise 3 customers… [Proposed]│
│   Cumulative · Δ vs prior  [row → Investigate]                │ [Accept][Reject][Modify][Defer]   │
├──────────────────────────────────────────────────────────────┴───────────────────────────────────┤
│ Agent findings  ▸ DSO Analysis Agent — Completed 09:14 · ◆ Demo · prompt v3 · [History] [Re-run]  │
│                 ▸ AR Ageing Agent — Not connected (Proposed capability — not connected)          │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- `ⓘ` on every KPI opens a provenance popover: formula, inputs, period, as-of, assumptions, origin, "Provisional methodology".
- The DataTable carries the table alternative for the chart. A row action drills down to the customer list.

### 5.3 Investigate panel (opens from any item; side sheet over the right half)

```
┌ Investigate: DSO +10.4 days (Receivables, Jan 2026)            [Pin to Briefing] [×] ┐
│ Context: Receivables · 01–31 Jan 2026 · vs Dec 2025 · ◆ Demo data                  │
│ Evidence  ⚙  R-DSO-01 · observed 42.3 vs 31.9 · threshold +5 / +10 days            │
│   inputs: endingAR 4.82M, creditSales 3.53M, 31 days  [formula]                    │
│ Related: Overdue 23.4% (R-OD-01) · Disputes 61+ 26% (R-DSP-01)                     │
├────────────────────────────────────────────────────────────────────────────────────┤
│ Q  Which customers contribute most to overdue AR?                                  │
│ A  ⚙ Rule-based answer from C-CON: Customer 014 (31%), 022 (21%), 007 (16%).       │
│    Verified from calculated data · [show table]                                    │
│ Q  Why did DSO increase?                                                           │
│ A  ⚙ Partial: ending AR rose 9.6% while credit sales were flat. Root cause beyond  │
│    these inputs is not available — no connected data for payment terms changes.    │
│ Suggested: [Explain overdue drivers] [Compare with Disputes] [Forecast next month] │
│ [ Ask a question about this item…                                     ] [Send]     │
└────────────────────────────────────────────────────────────────────────────────────┘
```

- Every answer is labelled with its origin, `⚙ Rule-based` or `✦ AI` (the latter only once an LLM service is connected), and "Verified" or "Assumption/Partial".
- When the needed data isn't available, the panel says so, and shows no fabricated answer.

### 5.4 Signals (triage queue)

```
Filters: Domain [All▾] Severity [High][Med][Low] Status [New][Acknowledged][Resolved] Owner [Anyone▾]  🔍
▦ Severity | Signal                         | Domain   | Observed vs threshold | Impact | First/last seen | Status | ⋯
  [High]   | DSO +10.4 d                    | Receiv.  | +10.4 d ≥ +10 d (High) |  —     | 09:14 / 09:14   | New    | Investigate · Acknowledge · Create recommendation
Monitoring: "Checks run only while this page is open · Last 09:14 · Next 09:29"   [Thresholds]  ⚙ Provisional
```

### 5.5 Decisions

```
Tabs (local): Awaiting my approval (1) | Open (4) | Decided | All
Card per recommendation:
  [High priority] [Awaiting approval]   Review credit limit — Customer 014            REC-…  ⚙ / ✦
  Problem · Evidence (links) · Impact (or "not calculable") · Confidence/uncertainty · Expected outcome
  Requires: Credit Manager approval — you: Analyst (role not connected)
  [Accept] [Reject…] [Modify…] [Defer…] [Request approval]  [Execute — unavailable ⓘ]
  "Execution unavailable: no connected service and no authorization configured."
  Timeline: Proposed 09:14 (rule R-CR-01) → Accepted 09:20 by Current user (identity not connected)
```

### 5.6 Agents

```
Catalog ▦ Agent | Domain | Capabilities | Depends on | Status | Last run | Permissions | ⋯
  DSO Analysis Agent | Receivables | DSO, variance | AR Ageing Agent | Proposed capability — not connected | — | read: invoices
Runs   ▦ Run id | Agent | State (Idle→Queued→Running→Completed/Failed/Cancelled) | Attempts | Started | Duration | Error
Settings (admin): LLM provider/model, prompt versions, request timeout (provisional 30 s)
```

### 5.7 Responsive behaviour (design.md breakpoints)

| Width | Behaviour |
|---|---|
| ≥ 1440 (lg) | As drawn: 2-column Briefing and Domain; Investigate is a side sheet (≈ 560px) |
| 1024–1439 (md) | Same structure; side columns stack below the main column; Investigate sheet ≈ 480px |
| 768–1023 (sm) | Sidebar off-canvas (existing ERMS behaviour); scorecard 2-up; tab strip "More ▾" overflow; Investigate becomes full-height overlay |
| < 768 (xs) | Single column; context bar collapses to a "Period · Compare · Scope" summary button opening a sheet; DataTables switch to stacked rows; charts keep the table alternative |

---

## 6. Important user journeys

1. **CFO morning brief (≤ 2 minutes).**
   - Open CFO → Briefing.
   - Scan the scorecard (delta vs prior on each tile).
   - Read "Since your last visit": new signals and decisions.
   - Open the top movement → Investigate panel.
   - Check evidence and related signals.
   - Go to Decisions → Awaiting my approval → approve or reject with a reason. This is recorded; no execution.
2. **AR manager — overdue spike.**
   - Signals filter Receivables, then New.
   - Open "Overdue 23.4%", go to the Domain contributors table, sorted by share.
   - Row → Investigate a customer.
   - Create a recommendation: "Prioritise collection". The recommendation is proposed; its owner is assigned once identity exists.
3. **Credit manager — exposure over limit.**
   - Signal R-CR-01 (utilisation ≥ 100%).
   - Investigate the exposure history.
   - Recommendation "Review credit limit" → Request approval.
   - **No credit limit is changed by the system**; Execute stays disabled.
4. **Cash application lead — unapplied cash.**
   - Domain Cash App: unapplied % trend, plus a table of receipts unapplied for more than 5 days (age, amount, customer).
   - Export CSV with an origin column.
   - Acknowledge the signal.
5. **Analyst — period comparison and outlook.**
   - Domain KPIs: choose Compare "vs Forecast".
   - Read the provisional method and scenarios.
   - Open formula popovers.
   - Export the provenance-stamped CSV.
6. **AI operations — failed agent.**
   - Agents › Runs filter Failed.
   - Open the run: error, attempts, inputs, prompt version.
   - Retry, which is queued. Dependent agents show "Waiting".
   - The audit log records retry, actor and outcome.

---

## 7. AI feature placement and interaction behaviour

### 7.1 Placement

| Capability | Where | Behaviour | Release dependency |
|---|---|---|---|
| Calculations (10) | Scorecard tiles, Domain KPIs, tables | Value + delta; `ⓘ` provenance popover | R2 (engine) |
| Anomaly rules (8) | Signals queue; Briefing "Material movements"; Domain side column | Severity word + Badge; observed vs threshold; Investigate; Acknowledge | R2 |
| Forecast | Domain trend "vs Forecast"; Briefing Outlook | Dashed line + scenario band; insufficient-history state; disclaimer always visible | R2 |
| Agent orchestration | Agents section; Domain "Agent findings"; provenance lines everywhere | Lifecycle states in words; run history; retry; dependencies | R3 |
| Executive summary | Briefing | Composed **only** from validated items. Each sentence links to its source item. Labelled ⚙ (template) or ✦ (once an LLM is connected) | R4–R5 |
| Investigation chat | Investigate panel | Context-scoped. Rule-based answers labelled ⚙. Verified vs assumption. "Not available" when the data isn't | R4 |
| Recommendations | Decisions; Domain side column; Briefing "Decisions needed" | Lifecycle; Accept/Reject/Modify/Defer/Request approval; Execute always disabled | R4 + backend |
| Monitoring | Signals header; toasts | In-tab schedule disclosed; duplicate suppression ("seen N×") | R5 |
| Audit | Audit section; item timelines | Session-only disclosure; CSV export | R5 |

### 7.2 Origin labelling (one system everywhere)

| Origin | Label | Rule |
|---|---|---|
| Actual (connected source) | none (default) | Only when a production source is connected |
| Demo — synthetic | `◆ Demo` (AiTag `mocked` kind) | On every value, chart and export from demo data. A global context-bar indicator too |
| Calculated | `fx` + `ⓘ` popover | Inherits input origin: "fx · from demo data" |
| Forecast | `≈ Forecast (provisional)` | Never mixed visually with actuals: dashed + caption |
| Rule-based | `⚙ Rule-based` (design.md §6 "(rule-based, not AI)") | Anomalies, template summaries, keyword chat |
| AI-generated | `✦ AI` (AiTag `ai` kind) | Only when output comes from a connected model; never for rules |

### 7.3 Interaction rules
- **Nothing runs because the user clicked a tab.** Runs are triggered by the user, or by the disclosed in-tab monitor.
- Background completions never move focus. They're announced politely.
- Every generated item shows "Produced by <agent/rule> · <time> · <origin> · prompt v<n> · <model>".
- Consequential actions (Reject, Request approval, anything labelled Execute) need a confirmation dialog with a reason field.
- Approve/Execute are role-gated by the backend, not the browser.

---

## 8. Component and design-system changes

### 8.1 Reused from the ERMS design system (already specified in design.md; no new tokens)
These exist in the React application but **not** in the CFO HTML pages today:
- Sub-module TabStrip (the full-keyboard + overflow version, §4.3)
- StatCard (hero variant, with tonal trend pill)
- DataTable + TableToolbar (sticky header, filter chips, pagination, skeleton rows, two empty states)
- Badge (5 tones)
- AiTag (`ai`, `mocked`)
- Tooltip
- Dropdown (custom listbox)
- DatePicker
- Modal (incl. the command-palette accent bar)
- ActionsMenu / popover family
- Button `danger`
- IconButton `tone` variants
- EmptyState
- UncapturedScreen (for sections not yet built — honest placeholder)
- Card elevations (flat/raised/premium)
- Toast

### 8.2 New components (need design approval)

| Component | Purpose | Built from |
|---|---|---|
| **Context bar** | Shared period / compare / scope / data-origin indicator, sticky under the tab strip | Dropdown, DatePicker, Badge |
| **Origin label set** | Extends AiTag with `calculated`, `forecast` and `rule` kinds (§7.2) | AiTag pill geometry; existing accent/neutral/info tones |
| **Provenance popover** | Formula, inputs, period, as-of, assumptions, origin, methodology status | Popover family |
| **Signal row / severity cell** | Severity word + Badge + icon (never colour alone) | Badge, IconBadge |
| **Decision card + lifecycle timeline** | Recommendation fields, action group, timeline | Card, Button variants, Badge |
| **Investigate side sheet** | Non-modal right sheet with context header, evidence, Q&A, suggested questions | **New container**: Modal tokens (radius-lg, shadow-lg), anchored right |
| **Scenario chart** | Actual (solid) / prior (muted) / forecast (dashed) / best–worst band, legend, boundary marker | Canvas or SVG with existing chart/primary tokens |
| **Not-connected state** | Designed placeholder for tiles, tables and sections in production with no source | EmptyState / UncapturedScreen tone |

### 8.3 Token changes
**None proposed.** Two points need a design decision:
1. **Chart series roles.** Forecast = `--primary-300` dashed; prior period = `--gray-400`; band = `--primary-50`. These are new uses of existing tokens.
2. **Domain colours.** design.md §2.1 has exactly eight module-identity hues with none reserved. The eight CFO domains must **not** reuse them, or they'd collide with module identity. Domains get icons only, with no per-domain colour.

### 8.4 Retired from the CFO pages
- The bespoke 3-panel `.ws` layout, panel collapse and focus mode.
- The `.agent-*` list as primary navigation.
- The toolbar LLM selects.
- The pie chart for trends.
- The like/dislike-first action bar. Feedback moves into item overflow menus.

---

## 9. Accessibility considerations (WCAG 2.2 AA)
- **Landmarks:** shell nav, `main`, a `region` per section, `complementary` for side columns, a labelled dialog/region for the Investigate sheet.
- **Tabs:** CFO module tabs use the full tablist pattern (roving tabindex, ←/→, Home/End). This fixes the inconsistency design.md §7 flags.
- **Tables:** real `<table>` with `scope`, `aria-sort`, captions; every chart has a table alternative and a text summary (the canvas `aria-label` is generated from the data).
- **Status:**
  - Severity, lifecycle and origin are always text plus icon, never colour only.
  - Counts appear in tab labels: "Signals, 7 new".
- **Live regions:** polite for background completion, monitoring and stale data; assertive only for errors caused by the user's own action. Avoid duplicate announcements (fixes TD-A11Y-1).
- **Focus:**
  - Investigate is a non-modal sheet: focus moves into it on open and returns on close; Esc closes.
  - Dialogs trap focus.
  - Background updates never move focus.
  - Loading keeps focus on a stable control (fixes TD-A11Y-3). History navigation restores focus to the section heading (fixes TD-A11Y-2).
- **Disabled-with-reason:** Execute uses `aria-disabled` + `aria-describedby` so the reason is discoverable.
- **Targets:** new controls at the design.md control scale (32/36/40px), with ≥ 24px guaranteed (AA 2.5.8). The 44px target remains design debt unless design approves a touch-density mode.
- **Reduced motion:** no animated charts; sheet/dialog transitions are disabled when reduced motion is requested.
- **Contrast:** use only verified token pairs (design.md §2.7 notes icon-container contrast already verified).

---

## 10. Technical and backend dependencies

| Area | Need | Status |
|---|---|---|
| Metrics data | Invoices, receipts, customers, credit limits, disputes, period totals per tenant/entity | **Not connected** (production) |
| Calculation engine | 10 calcs, 8 rules, forecasts (approved R2 plan) | Interrupted: tests written; engine not yet implemented |
| Orchestration | Agent registry, queue, lifecycle, retries, history | R3 (frontend foundation); real execution needs a backend |
| LLM gateway | Server-side proxy; no browser keys; prompt/model versioning | Not connected |
| Identity & roles | Current user, roles, approval matrix, tenant/company isolation | Not connected (design.md §7: no auth anywhere) |
| Decisions service | Persist recommendation lifecycle, approvals, comments | Not connected |
| Monitoring scheduler | Server-side checks, notifications, suppression | Not connected; in-tab only |
| Audit store | Immutable event log | Not connected; session-only |
| Export | PDF rendering service; CSV is client-side | PDF not connected |
| **Frontend platform** | Charts, DataTable, Dropdown, DatePicker, Tooltip, Modal, TabStrip, command palette | **Exist in the ERMS React/Vite/TS/Tailwind app**; not in these HTML pages |

**Platform decision (needs approval; this is roadmap Phase 5 / B24).**
- **Option 1, build in the ERMS React module (recommended).** This reuses the real components and tokens, the existing shell, the Ctrl+K palette and routing. It avoids duplicating them, which the "avoid duplicated code" requirement asks for, and delivers genuine app-wide consistency.
- **Option 2, plain HTML.** This would mean re-implementing DataTable, Dropdown, DatePicker, Tooltip, TabStrip, popovers and the palette by hand inside single files. That duplicates the React library and is already strained at 144 KB. It is feasible, but it contradicts the duplication and consistency requirements.

**Governance conflict to resolve before implementation.** `CLAUDE.md` (protected) states the DESIGN FREEZE: "no layout changes", "keep each page a single self-contained file", "no frameworks". `architecture.md` and `ux-rules.md` describe the 3-panel layout. Implementing this redesign needs your explicit authorization to amend those files, or to replace them with a new governance set for the CFO module. I won't edit them without that.

---

## 11. Migration approach

| Phase | Deliverable | Old UI | Exit criteria |
|---|---|---|---|
| **0 — Engine** | Finish Release 2 logic (calc, rules, forecast, demo data, tests). It is layout-independent and reused as is | Unchanged | `node --test` green; R1 regression green |
| **1 — Shell & Briefing** | CFO module with tab strip, context bar, origin labels, Briefing (demo + not-connected states), Ctrl+K entries. Behind a flag (`?ui=next` or a separate route) | Live, default | Design review; a11y audit; parity of Briefing ≥ overview page |
| **2 — Domains + Investigate** | 8 domain workspaces, scenario chart, DataTables, provenance popovers, Investigate sheet (rule-based answers) | Live | Every capability of the old workspace (summary, chart, export, chat) available in the new UI |
| **3 — Signals & Decisions** | Triage queue, in-tab monitoring, recommendation lifecycle, approval inbox (Execute disabled) | Live | Journeys 1–4 pass usability walk-through |
| **4 — Agents & Audit** | Catalog, runs, dependencies, retry, session audit log, exports | Live | Journey 6 passes; audit covers all events |
| **5 — Cutover** | New UI becomes default. Old URLs redirect (`category`/`agent` → domain + findings). Old pages are removed after one release | Redirected | No regression in the acceptance list; governance docs updated |

**Testing per phase:**
- Unit (`node --test`) for engine and view-models.
- Browser harness, extended from the R1 harness, for states, keyboard, breakpoints and URLs.
- `ui-guardian`, rewritten against the new design-system document, and `a11y-auditor`.

---

## 12. Decisions requested
1. Approve **Concept C with Briefing home**, or choose another concept.
2. Approve the **navigation** (six tabs, shared context bar, Investigate sheet, LLM settings moved to Agents).
3. Approve the **new components** in §8.2 and the chart-role and domain-colour decisions in §8.3, or ask for visual mockups first.
4. **Platform:** build in the ERMS React module (recommended) or in plain HTML.
5. **Governance:** authorize amending or replacing `CLAUDE.md`'s design freeze, `architecture.md` and `ux-rules.md` for the new architecture.
6. **Sequencing:** finish the interrupted Release 2 engine first (Phase 0, layout-independent), or pause it.
