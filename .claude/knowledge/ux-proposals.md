# UX proposals — awaiting approval (D2)

> **Note 2026-11-12 — sample-data-first direction.** Superseded twice: by `ux-architecture.md` / `cfo-platform-spec.md`, and for the workspace by the sample-data-first direction. "Not connected" wording below (e.g. "Proposed capability — not connected", "Monitoring paused — data source not connected") must not be applied to the workspace, which runs on local sample data by default.

Status: **PROPOSED — NOT APPROVED. Nothing in this file is implemented.** Prepared 2026-11-11 for review before Release 2.

Scope: `cfo-workspace.html` (WS). References are to existing element ids and classes, and every class named as "reused" is in `design-system.md`. Icons are limited to the 50 already defined in the page's `ICONS` map, and any icon outside that set is listed as **new icon**.

How to read each proposal:
- **Exists today** is what the code does now.
- **Proposed** is new behaviour.
- **Design impact** gives one verdict:
  - **None**: existing markup, classes and tokens only.
  - **Markup only**: new elements built from existing classes, with no CSS change.
  - **New CSS / icon / component**: needs design approval.
- Options are ordered from least to most visual change. The recommended option is marked.

Cross-cutting rules for all six proposals:
- Status is never shown by colour alone. Every status pairs a word with an icon or tone.
- Every synthetic value is labelled with the existing `Mocked` convention (design.md §3.5). Rule-based output is captioned "(rule-based, not AI)" (design.md §6).
- Nothing is labelled as executed, persisted or continuous unless a connected service confirms it.
- Background updates never move focus. Status changes are announced with the existing `toast()` (`role="status"`) or an existing `role="status"`/`role="alert"` region.

---

## P1 — Agent execution status and history

**UX problem and impact.** The left panel shows each agent's name and prompt preview, but not whether it has run, is running, failed or is queued. Once orchestration lands (Release 3), a CFO can't tell which agents produced the summary in front of them, or why one failed.

**Exists today:**
- `#agentList` rows (`.agent-row` > `.agent-main` + refresh `.icon-btn`).
- The active row is shown with `.active` and `aria-current`.
- The `.agent-prev` line shows the prompt; per D6 it will read "Proposed capability — not connected".
- No status, no history.

**Proposed behaviour:**
- Each row shows its lifecycle state: Idle, Queued, Running, Completed, Failed or Cancelled, with the time of the last run.
- A "History" action per agent opens its last runs. For each run: state, time, period, provider/model, prompt version, attempts, and the error message if any.
- The dependencies the agent waits on are listed in the same view, e.g. "Waits for: AR Ageing Agent".

**Information hierarchy:**
1. Agent name.
2. State word and relative time, e.g. "Failed · 2 min ago".
3. Capability and connection notice.
4. Behind the History action: run list (newest first), dependencies, permissions (read scopes, allowed actions).

**States:**

| State | Row | History view |
|---|---|---|
| Loading | "Running…" | Skeleton (`.sk`) |
| Success | "Completed · time" | Run list |
| Empty | "Not run yet" | "No runs in this session" |
| Error | "Failed · time" | Run list with the error message |
| Unavailable | "Not connected" (production) | "History is kept for this browser session only. No persistent history service is connected." |

**Accessibility:**
- The state goes into the row button's `aria-label`, e.g. "Collection Prioritization Agent, failed 2 minutes ago, selected".
- State changes of the selected agent are announced via `toast()`. Changes of other agents are not announced, to avoid noise.
- History uses the native `<dialog>` pattern: focus trap, Esc closes, focus returns to the trigger.
- Arrow-key navigation of the list is unchanged; the History button is reached with Tab.

**Options:**
- **P1-a (Design impact: None).** Put the state in the existing `.agent-prev` line as text, e.g. "Failed · 2 min ago — Proposed capability — not connected", and in `aria-label`. No history view. The cost is that state and notice compete on one truncated line.
- **P1-b (recommended; Design impact: Markup only + new icon).** P1-a, plus a "History" `.icon-btn` per row next to the refresh button, opening a new `<dialog>` built with `.dlg-head` / `.dlg-body` / `.dlg-foot`. The run list uses the `.sec ul li` pattern with `.icon-badge.sm` tones (success/error/warning/info). A History icon is needed: **new icon** `history` (Lucide), or reuse the existing `info` icon.
  - The row then has 3 controls in 280px; in the 64px collapsed panel the extra button must be hidden like the refresh button, which needs **one new CSS rule** in the existing collapsed-panel selector list.
- **P1-c (Design impact: New CSS / component).** A status Badge pill on each row (design.md §3.5 Badge, which isn't in these pages' CSS), plus P1-b.

**UI areas affected:** `#agentList` rows (built by `renderAgents()`), new `<dialog>` after `#promptDlg`, and the `.ws.left-collapsed` rule (P1-b/c only).

---

## P2 — Financial anomaly presentation

**UX problem and impact.** Release 2 produces anomalies, each with: reference, domain, timestamp, period, severity, impact, evidence, method, confidence and recommended action. The summary has nowhere to show them. If they were merged into "Risks", users couldn't tell a rule-based detection from generated text.

**Exists today:**
- `#sumSections` renders `SECTIONS` (Key Insights, Risks, Recommendations) as `.sec` > `h3` > `ul` > `li` with an `.icon-badge.sm` tone and a `.src` source line.
- All content is placeholder text.

**Proposed behaviour:**
- A new first section "Anomalies (rule-based, not AI)", listed by severity (High → Medium → Low), then by financial impact.
- Each item shows:
  - A headline, e.g. "DSO increased 12 days vs prior period".
  - Severity as a word.
  - Impact (amount, or "Impact not calculable").
  - Reference id, and period.
- A "Details" disclosure per item reveals the method and rule id, threshold vs observed value, inputs and evidence references, confidence (or "Not statistically meaningful — deterministic threshold"), and the recommended investigation.
- Investigation hand-off: "Ask about this" puts a follow-up question about the anomaly into the existing chat input. It doesn't send it.

**Information hierarchy:**
1. Severity word plus tone icon.
2. Headline with the observed value.
3. Impact.
4. Reference · period · detection time.
5. Details.

**States:**

| State | What shows |
|---|---|
| Loading | Existing `#stLoading` skeleton |
| Success | Section listed |
| Empty | "No anomalies detected for this period using N provisional rules." Lists the rules evaluated; this is not hidden, because "none found" is information |
| Error | One rule failed: "Rule R-xx could not run: missing field(s) …". Other rules still show |
| Unavailable | Production: the existing not-connected error state |

**Accessibility:**
- Section heading `h3` (existing pattern).
- Severity in text, never colour only: "High severity" is spoken before the headline.
- Details uses a `button` with `aria-expanded`/`aria-controls`, the existing disclosure pattern.
- Amounts in `.font-data`, with currency spoken in full in an `.sr-only` span where needed.

**Options:**
- **P2-a (Design impact: None).** Render through the existing `.sec` list, with severity as a text prefix and `.icon-badge.sm` `error`/`warning`/`info` tones. Details shown inline in the `.src` line (no disclosure). Dense but no new UI.
- **P2-b (recommended; Design impact: Markup only).** P2-a, plus a "Details" `.btn.btn-ghost.btn-sm` disclosure and an "Ask about this" `.btn.btn-ghost.btn-sm` per item. The details list reuses `dl.meta`. Uses existing icons only (`triangle-alert`, `circle-alert`, `info`).
- **P2-c (Design impact: New CSS / component).** Severity Badge pills and a sortable anomaly table (design.md §3.7 DataTable, not in these pages).

**UI areas affected:** `#sumSections` (built by `renderResult()`), `SECTIONS` map, `#chatInput` (P2-b hand-off). The chart panel is not affected.

---

## P3 — Forecast visualization and comparison

**UX problem and impact.** Forecasts must never read as fact. The chart today draws one series of fixed placeholder values, so it can't show actual vs previous period vs forecast, or a best/expected/worst range.

**Exists today:**
- `#chartContent`: chart-type pills (Bar/Line/Pie), canvas drawn by `drawChart()` with token colours, legend for Pie only, `.sr-only` `#chartTable` (Label/Value), PNG/CSV export, fullscreen, and the `Mocked · placeholder data` tag.

**Proposed behaviour:**
- A comparison selector with options None, vs previous period, and vs forecast.
- **vs previous:** two series (current, previous) with a variance value per label.
- **vs forecast:**
  - Actuals are drawn as a solid line.
  - The expected forecast is drawn as a dashed line.
  - The best–worst range is drawn as a light band.
  - The boundary between actual and forecast periods is marked with a vertical rule labelled "Forecast →".
- Caption under the chart: "Forecast is provisional (method: …). Not actuals." It is always visible when a forecast is shown.
- Drill-down: activating a bar/point (click, or Enter on its table row) filters the summary to that label's contributors. This depends on Release 4 data.
- The table and CSV gain columns for previous value, variance (abs, %) and type (Actual / Forecast-expected / Forecast-best / Forecast-worst), plus a data-origin column.

**Information hierarchy:**
1. Comparison selector.
2. Chart.
3. Legend, always shown when there is more than one series.
4. Provisional caption.
5. Table alternative.

**States:**

| State | What shows |
|---|---|
| Loading | Existing `#chLoading` |
| Success | Chart |
| Empty | Existing `#chEmpty` |
| Error | Existing `#chError` |
| Insufficient history | "Forecast needs at least N periods of history; M available." The comparison option is disabled, with the reason shown as text |
| Unavailable | Production: existing error state |

**Accessibility:**
- Series differ by line style and marker shape as well as colour (solid/dashed; circle/square).
- The canvas `aria-label` summarises the trend and the forecast range in words.
- `#chartTable` becomes the full alternative: actual, previous, variance and forecast columns with a caption naming the method.
- Optional: make the table visible on demand ("Show data table" toggle). Drill-down is reachable from the table, not only the canvas.
- Reduced motion: no animation.

**Options:**
- **P3-a (Design impact: None).** Variance and forecast only in `#chartTable` (screen-reader) and the CSV; the visible chart stays single-series. Low value to sighted users.
- **P3-b (recommended; Design impact: New CSS + canvas styling).**
  - The comparison selector reuses `.pills` / `.pill` in `.chart-tools`, which is markup only.
  - The second-series colour comes from existing tokens: previous period uses `--gray-400`; forecast uses `--primary-300` dashed; the range band is `--primary-50`. These are new colour roles for existing tokens, so they need **design approval**.
  - Legend shown for bar/line (CSS currently shows it for pie only; the JS toggles `hidden`, so markup only).
  - The caption uses `.t-caption.c-muted`.
  - The visible data-table toggle would need a new style for a visible table (**new CSS**).
- **P3-c.** P3-b plus a visible drill-down cue (hover state on bars, selected-bar outline): **new canvas styling**.

**UI areas affected:** `.chart-tools`, `drawChart()`, `#legend`, `#chartTable`, the `dlCsv` handler, the `.chart-result` caption, and the `Mocked` tag at `#chResult`.

---

## P4 — Recommendation approval and execution controls

**UX problem and impact.** Recommendations will carry evidence, impact, priority, confidence, required authorization and status (Release 4). Without controls a CFO can't accept, reject, modify, defer or route one for approval, and nothing records the decision. Execution must stay impossible until an authorised service exists (approval condition 12).

**Exists today:** the "Recommendations" `.sec` list with placeholder text. No controls, statuses or roles.

**Proposed behaviour:**
- **Lifecycle:** Proposed → Accepted / Rejected / Modified / Deferred → Approval requested → Approved → Execution requested → Executed (confirmed by service) → Verified.
- **Actions by state:**

| State | Actions |
|---|---|
| Proposed | Accept · Reject · Modify · Defer |
| Accepted | Request approval (if the required authorization is above the user's) or Execute |
| Execute | **Always disabled now**, with the visible reason "Execution unavailable — no connected service and no authorization configured." |

- Reject and Modify open a dialog requiring a reason or edited text. Defer asks for a date.
- **Every action:**
  - creates an audit event (P6);
  - is labelled "Recorded in this session only" until a decision service exists;
  - never shows "Executed" or "Approved" unless a service confirms it.
- **Item layout:**
  - Priority, title and status in text, e.g. "High priority · Proposed".
  - Problem statement, proposed action and expected outcome.
  - Financial impact, or "not calculable".
  - Confidence or uncertainty statement.
  - Required authorization, e.g. "Requires: Credit Manager approval".
  - Evidence links.
  - Action row.

**States:**

| State | What shows |
|---|---|
| Loading | Skeleton |
| Success | List |
| Empty | "No recommendations for this period." |
| Error | Action failed: the status is reverted and the error is shown via toast and inline text |
| Unavailable | Execute and Request approval disabled with the reason as text, not just a disabled look |

**Accessibility:**
- The action row is a `role="group"` labelled by the recommendation title.
- Disabled actions use `aria-disabled="true"` (still focusable) with the reason in `aria-describedby`, so keyboard and screen-reader users learn why.
- Status changes are announced via `toast()`.
- Dialogs follow the native `<dialog>` pattern, with focus returning to the action button.
- Consequential actions (Reject, Execute) need an explicit confirmation step.

**Options:**
- **P4-a (Design impact: Markup only).**
  - Actions as `.btn.btn-secondary.btn-sm` / `.btn.btn-ghost.btn-sm` in a row under each item.
  - Status and priority as text in `.src`.
  - Reject/Modify/Defer dialogs built from `.dlg-*` + `.field` + `.ctl` (incl. `input[type=date]`).
  - Existing icons only (`circle-check`, `x`, `pencil`, `pin`).
- **P4-b (recommended; Design impact: New CSS / component).** P4-a plus a status Badge (design.md §3.5) and the `danger` button variant for Reject/Execute confirmation (design.md §3.1). Neither exists in these pages' CSS, so this needs **new CSS** ported from design.md tokens (no new tokens).
- **Open product questions:** role model and approval matrix; whether Defer needs a date; whether Modify creates a new recommendation version.

**UI areas affected:** the Recommendations `.sec` in `#sumSections`, new `<dialog>`s, `case` handlers in the `data-act` switch.

---

## P5 — Monitoring alerts and history

**UX problem and impact.** Monitoring (Release 5) evaluates thresholds on a schedule and raises alerts. There is no backend scheduler, so monitoring can only run while the tab is open. The UI must say so, or users will assume continuous coverage. There is also nowhere to see past alerts or change thresholds.

**Exists today:** `toast()` notifications (auto-dismiss ~3.9s); topbar right-hand buttons (Search, Language, Help, User), none of which have handlers.

**Proposed behaviour:**
- **New alert:** a toast with severity in text, e.g. "High: Unapplied cash 11.2% (threshold 10%)".
- **Duplicate alerts** (same rule + subject + period) are suppressed. The history row shows "seen N times, last at …".
- **Alert history**, newest first, with:
  - Filters: severity, category, acknowledged.
  - Per alert: rule, observed vs threshold, first/last seen, count, link to open the agent's summary, Acknowledge.
- **Thresholds view:** each rule's provisional threshold, editable within allowed bounds, labelled "Provisional — not approved KPI thresholds". Changes are audited (P6) and stored only for this browser.
- **Persistent disclosure:** "Monitoring runs only while this page is open. Last check: time. Next check: time."

**States:**

| State | What shows |
|---|---|
| Loading | Check running |
| Success | Alerts list |
| Empty | "No alerts since time" |
| Error | A rule failed, with the missing inputs named |
| Paused / unavailable | Tab hidden, or production with no data: "Monitoring paused — data source not connected" |

**Accessibility:**
- New alerts use the polite toast. High severity may use the existing `role="alert"` pattern only if design agrees; otherwise polite.
- Alerts must not auto-dismiss before they can be read. WCAG 2.2.1 applies to the history view, not the toast; the toast stays informational.
- The history dialog uses list semantics, and filter controls are labelled.
- The unread count is announced in the button label, e.g. "Alerts, 3 unread".

**Options:**
- **P5-a (Design impact: Markup only).** Alerts as toasts only. History and thresholds are reached through a text button (`.btn.btn-ghost.btn-sm`, "Alerts") in the existing `.tb-right` group, opening a `<dialog>`. There is no unread count; the count lives only in the `aria-label`. No new icon or CSS.
- **P5-b (recommended; Design impact: New icon + markup + new CSS).**
  - A new topbar `.icon-btn` "Alerts" with **new icon** `bell` (Lucide).
  - The unread count needs a count badge (**new CSS**). Without it, the count lives only in the `aria-label` and the dialog.
  - History and thresholds in a `<dialog>` with two `.tab` tabs (`role="tablist"`, existing pattern).
  - Lists use the `.sec` pattern; threshold fields use `.field` + `.ctl`.

**UI areas affected:** topbar `.tb-right`, `toast()`, new `<dialog>`, Global keys block (Esc handling already defers to an open dialog).

---

## P6 — Audit history and decision traceability

**UX problem and impact.** Users and reviewers need to know who generated or decided what, when, with which data, prompt version and model, and whether the data was actual, demo, calculated or forecast. Release 1 now tracks request ids, prompt version and revision internally, but none of it is visible, and there's no event log.

**Exists today:**
- The summary card `dl.meta` shows Date range, Model and Generated time.
- The cache entry holds `origin`, `promptVersion`, `revision` and `id` (Release 1), but they aren't displayed.
- No audit events.

**Proposed behaviour:**
- **Per summary**, add meta rows: Data origin (Demo — synthetic / Production / Calculated from demo data), Prompt version, Revision, Summary id. Add a "Provenance" disclosure listing the inputs used and the calculations with their formula ids.
- **Session audit log** (newest first). For each event: time, actor ("Current user — identity not connected"), event type (generate, cancel, timeout, prompt edit, pin, vote, feedback, recommendation action, threshold change, export), agent, summary id, origin, outcome.
  - Filters: event type, agent.
  - Export: CSV via the existing `dl()` helper, labelled "Session audit export — not an enterprise audit record".
- **Persistent disclosure:** "Audit events are held in this browser tab only and are lost on reload. No audit service is connected." Events are never written to localStorage (approval condition 11).

**States:**

| State | What shows |
|---|---|
| Loading | n/a (synchronous) |
| Success | Event list |
| Empty | "No events in this session yet" |
| Error | Export failed (toast) |
| Unavailable | The disclosure above, always visible |

**Accessibility:**
- Meta rows are `dt`/`dd` pairs (existing semantics).
- The log is a list with each event's time as `<time datetime>`.
- The dialog follows the native pattern.
- The export button has a full `aria-label`.

**Options:**
- **P6-a (Design impact: Markup only).** Extra `dl.meta` rows inside `.sum-card`, using the existing `.meta div` / `dt` / `dd` styles (rows wrap). No log UI; the audit export is reached from the command or action bar as a CSV only.
- **P6-b (recommended; Design impact: Markup only + new icon).**
  - P6-a, plus an "Audit log" `.icon-btn` in the summary `.actionbar`, opening a `<dialog>` with the event list (`.sec` pattern), filter `.pill`s, and an Export `.btn.btn-secondary.btn-sm`.
  - Needs a **new icon** `scroll-text` or `history` (Lucide), or reuse the existing `file-spreadsheet`/`info` icon.
  - The action bar already hides labels under 480px container width, so no CSS change.

**UI areas affected:** `.sum-card` `dl.meta`, `.actionbar`, new `<dialog>`, the `renderResult()` meta block.

---

## Approval summary

| Proposal | Recommended option | New CSS | New markup | New component | New icon | New tokens |
|---|---|---|---|---|---|---|
| P1 Agent status and history | P1-b | 1 rule (collapsed panel) | Yes | Dialog instance (existing pattern) | `history` (or reuse `info`) | No |
| P2 Anomalies | P2-b | No | Yes | No | No | No |
| P3 Forecast and comparison | P3-b | Visible table toggle only | Yes | No | No | No — **new colour roles** for existing tokens on canvas |
| P4 Recommendations | P4-b | Badge + danger button (ported from design.md) | Yes | Badge, danger button | No | No |
| P5 Monitoring | P5-b | Count badge | Yes | Dialog instance | `bell` | No |
| P6 Audit | P6-b | No | Yes | Dialog instance | `scroll-text` (or reuse) | No |

Please approve, reject or choose a different option for each proposal. Any proposal not approved ships only as logic (no UI) in its release.
