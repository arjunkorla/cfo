# Release 2 implementation plan — calculations, anomaly rules, provisional forecasting

> **Note 2026-11-12 — sample-data-first direction.** Release 2 is paused and its in-page scaffolding (`dataSource.production/demo`, `getDataset`, `NOT_CONNECTED`, `==DS==`/`==R2==` regions) was removed from the workspace by the rollback. This plan remains the specification for the React engine only. `tests/r2.test.js` is now `tests/retired/r2-release2-tests.js`. Do not implement any of this in `cfo-workspace.html`.

Status: **PLAN — NOT APPROVED. Not implemented.** Prepared 2026-11-11.

## Scope and boundaries
- Release 2 adds **logic only**, with no rendering. Nothing new appears on screen until Release 4. Visible effect: **none**. CSS, markup, classes, tokens and icons are untouched.
- Every function returns its formula, inputs, period and assumptions with the value (D3).
- Every methodology carries `status: 'provisional'` and the text "Provisional methodology — not an approved financial KPI".
- **No missing input is ever invented or silently substituted.** A calculation that lacks a required input returns `unavailable` with the missing field names.
- Approval conditions covered: 5 (explainable calculations), 6 (deterministic anomaly rules), 7 (provisional forecasting).

## Code blocks (all inside the existing IIFE in `cfo-workspace.html`)
Each block is delimited by comment markers so tests can load it (see "Unit tests").

| Block | Purpose | Touches existing code? |
|---|---|---|
| `/* ==R2:schema== */ schema` | Field definitions and input validation | No |
| `/* ==R2:calc== */ calc` | Pure financial calculations | No |
| `/* ==R2:detect== */ detect` | Rule registry and evaluator | No |
| `/* ==R2:forecast== */ forecast` | Provisional forecasting | No |
| `/* ==R2:demo== */ demoData` | Seeded synthetic dataset, demo mode only | No |
| `dataSource.demo` / `dataSource.production` | Add `getDataset(category, from, to, signal)`. Production rejects with `NOT_CONNECTED`, like summarize | Adds a method to the Release 1 block |

No other function changes. `renderResult()`, `drawChart()` and `send()` are Release 4.

## Data origin and separation

Every value object carries `origin`:

| `origin` | Meaning | Allowed in production | Display rule (Release 4) |
|---|---|---|---|
| `actual` | From a connected production source | Yes, when a source exists (none today) | Plain |
| `demo` | Seeded synthetic record | **No**: only with `?mode=demo` / `?demo=` | Existing `Mocked` tag |
| `calculated` | Derived by `calc` | Yes | Inherits input origin, e.g. "Calculated from demo data". Formula always available |
| `forecast` | Produced by `forecast` | Yes | "Forecast (provisional) — not actuals" |
| `rule` | Produced by `detect` | Yes | "(rule-based, not AI)" |
| `ai` | Produced by a connected LLM service | Not in this release (none connected) | Existing `AI` tag |

- **Origin of derived values:**
  - Inherits the weakest input origin (`demo` beats `actual`). An input carrying `demo` makes every derived value `calculated` with `inputOrigin: 'demo'`.
  - Mixing `demo` and `actual` inputs is rejected with `MIXED_ORIGIN`.
- **The demo dataset is synthetic.** It is generated deterministically from a fixed seed so tests are reproducible. Its records carry `origin:'demo'`, and its customer names are generic ("Customer 001"). It is never shown or exported without the mocked label.

## Input schema (provisional — needs data-owner confirmation)
All amounts are numbers in one currency per dataset, and dates are ISO `YYYY-MM-DD`.

| Entity | Fields | Used by |
|---|---|---|
| `invoice` | `id, customerId, issueDate, dueDate, amount, openAmount, currency, paidDate?` | Ageing, overdue %, DSO, payment delay, collections |
| `receipt` | `id, customerId, receivedDate, amount, appliedAmount, currency` | Unapplied cash %, collections |
| `customer` | `id, name, creditLimit?, currency` | Exposure |
| `dispute` | `id, customerId, invoiceId?, openedDate, closedDate?, amount, reasonCode?` | Dispute ageing |
| `periodTotals` | `period{from,to}, creditSales, endingAR` | DSO when invoice-level data is absent |

**Validation (`schema.validate`).** Each failure returns `{ok:false, errors:[{record, field, rule}]}`. Records that fail are excluded and counted, and the count is reported with the result: "3 records excluded: invalid dueDate". They are never silently dropped. The checks:
- Required fields present.
- Amounts finite and ≥ 0; `openAmount ≤ amount`; `appliedAmount ≤ amount`.
- Dates valid; `dueDate ≥ issueDate`.
- One currency per dataset. **Multiple currencies return `unavailable: MULTI_CURRENCY`**, because conversion isn't defined (open question R2-Q1).
- Period `from ≤ to`.

**As-of date.** All point-in-time measures use **`asOf = period.to`** (provisional; R2-Q2).

**Rounding.** Full precision internally; display rounding (Release 4) is 2 dp for amounts, 1 dp for percentages and days.

## Calculations (`calc`) — provisional

Every function returns:
```
{ id, value|null, unit, status:'ok'|'unavailable', missing:[], formula, inputs:{…}, period, asOf,
  assumptions:[…], methodology:'provisional', origin:'calculated', inputOrigin }
```

| ID | Calculation | Formula | Required inputs | Assumptions / edge cases |
|---|---|---|---|---|
| C-DSO | Days Sales Outstanding (period method) | `endingAR ÷ creditSales × daysInPeriod` | `endingAR`, `creditSales`, `period` (`daysInPeriod = to − from + 1`) | `creditSales = 0` → `unavailable: ZERO_DENOMINATOR`. If `periodTotals` is absent, derive `endingAR = Σ openAmount at asOf` and `creditSales = Σ amount of invoices issued in period`, and list that derivation in `assumptions`. Count-back DSO is not used (R2-Q3) |
| C-AGE | AR ageing buckets | `daysPastDue = asOf − dueDate`; buckets **Current (≤0), 1–30, 31–60, 61–90, 91+**; amount and count per bucket; share = bucket ÷ total open | `invoice.dueDate, openAmount` | Only `openAmount > 0` counted. Bucket edges are provisional (R2-Q4) |
| C-OD | Overdue percentage | `Σ openAmount where daysPastDue > 0 ÷ Σ openAmount × 100` | `invoice.dueDate, openAmount` | Total open = 0 → `unavailable` |
| C-VAR | Variance | `abs = current − prior`; `pct = (current − prior) ÷ |prior| × 100` | `current`, `prior` (same calc ID, prior period of equal length immediately before) | `prior = 0` → `pct = null` with reason `ZERO_BASE`; `abs` still returned |
| C-CON | Contribution analysis | `share_i = value_i ÷ Σ value × 100`, sorted descending; cumulative share; `topN` reaching ≥ 80% | A measure per group (e.g. overdue amount per customer) | Negative values excluded and reported. Ties sorted by id for determinism |
| C-UNAP | Unapplied cash percentage | `Σ (amount − appliedAmount) ÷ Σ amount × 100` for receipts received in period | `receipt.amount, appliedAmount, receivedDate` | No receipts → `unavailable` |
| C-DSPA | Dispute ageing | Open at asOf: `age = asOf − openedDate`; buckets **0–30, 31–60, 61–90, 91+**; count, amount, mean, median | `dispute.openedDate, closedDate, amount` | Closed before asOf excluded. Median of an even count = mean of the middle two |
| C-EXP | Credit exposure | Per customer: `exposure = Σ openAmount`; `utilisation = exposure ÷ creditLimit × 100` | `invoice.openAmount, customer.creditLimit` | `creditLimit` missing → utilisation `unavailable` for that customer (exposure still shown). Never defaulted |
| C-PDL | Payment delay | Per customer: amount-weighted `Σ (paidDate − dueDate) × amount ÷ Σ amount` over invoices paid in period | `invoice.paidDate, dueDate, amount` | Early payment counts as negative delay. Unpaid invoices excluded |
| C-COL | Collection rate | `Σ receipts applied in period ÷ (openingAR + creditSales) × 100` | `receipt.appliedAmount`, `openingAR`, `creditSales` | Provisional proxy, not CEI (R2-Q5) |

## Anomaly detection (`detect`) — deterministic, provisional thresholds

**Rule registry entry:**
```
{ id, domain, title, calcs:[…], evaluate(ctx) → anomaly[] }
```

**Anomaly object (the fields required by D2):**
```
{ ref:'ANOM-<ruleId>-<subject>-<period.to>', domain, ruleId, detectedAt, period, severity:'high'|'medium'|'low',
  observed, threshold, impact:{amount,currency}|null, impactNote, evidence:[{entity,id,field}], method,
  confidence:{type:'z-score', value, n}|null, confidenceNote, recommendedAction, origin:'rule', inputOrigin }
```

- **`ref` is deterministic**, so re-running a rule on the same data produces the same reference. This is the basis for duplicate suppression in Release 5.
- **Confidence** applies only to statistical rules with enough history. Threshold rules set `confidenceNote: "Deterministic threshold — confidence not statistically meaningful"`.

| Rule | Domain | Detects | Logic (provisional thresholds) | Impact |
|---|---|---|---|---|
| R-AR-01 | Receivables | Unusual AR balance movement | `|C-VAR(endingAR).pct|` ≥ 15% → medium; ≥ 30% → high | `abs` variance |
| R-DSO-01 | Receivables | DSO increase | `C-DSO − prior C-DSO` ≥ 5 days → medium; ≥ 10 → high | Not calculable (impactNote) |
| R-OD-01 | Receivables | Overdue receivables | `C-OD` ≥ 20% → medium; ≥ 35% → high; **or** 91+ bucket share ≥ 10% → high | Overdue open amount |
| R-PAY-01 | Collections | Unusual customer payment pattern | Customer's C-PDL this period vs that customer's trailing mean/std of prior periods: `z ≥ 2` → medium, `z ≥ 3` → high. **Needs ≥ 6 prior paid invoices**; otherwise not evaluated, reported as "insufficient history" | Open amount of that customer |
| R-CASH-01 | Cash App | Cash application exceptions | `C-UNAP` ≥ 5% → medium; ≥ 10% → high; plus count of receipts unapplied > 5 days after `receivedDate` | Unapplied amount |
| R-CR-01 | Credit | Credit exposure change | Utilisation ≥ 90% → medium; ≥ 100% → high; **or** utilisation up ≥ 20 points vs prior → medium | Exposure over limit (if > 100%) |
| R-DSP-01 | Disputes | Dispute ageing anomaly | Share of open disputes aged 61+ days ≥ 25% → medium; median age up ≥ 10 days vs prior → medium; both → high | Amount of disputes aged 61+ |
| R-COL-01 | Collections | Collection performance deviation | `C-COL` down ≥ 10 points vs prior → medium; ≥ 20 → high | Not calculable (impactNote) |

**Evaluation rules:**
- A rule whose calcs are `unavailable` produces **no anomaly** and records `{ruleId, skipped:true, missing:[…]}`, so the UI can say which rules didn't run (proposal P2 "error" state).
- Rules are pure: same inputs give the same outputs.
- No rule calls another rule or an agent (no unrestricted agent-to-agent execution).
- Thresholds live in one `THRESHOLDS` object, which Release 5 monitoring reads. Each carries `status:'provisional'`.

## Provisional forecasting (`forecast`)

Input: a time series `[{period, value, origin}]` of one calculated measure (e.g. monthly collections, DSO). Output:
```
{ id, method, status:'ok'|'insufficient_history', minPeriods, used, horizon,
  points:[{period, expected, best, worst}], assumptions:[…], methodology:'provisional',
  origin:'forecast', inputOrigin, disclaimer:'Forecast (provisional) — not actuals' }
```

| Method | When used | Expected | Best / worst | Assumptions recorded |
|---|---|---|---|---|
| F-MA3 — 3-period moving average | 3–5 historical periods | Mean of last 3 values, held flat over the horizon | Expected ± 1 × std dev of last 3 values | "Assumes no trend; seasonality ignored" |
| F-LIN — linear trend (least squares) | ≥ 6 historical periods | `a + b·t` extrapolated | Expected ± 1 × residual std dev × `√(1 + h/n)` (widens with horizon h) | "Assumes trend continues linearly; seasonality ignored; residuals assumed symmetric" |

- **Polarity:** "best" and "worst" depend on the measure. For DSO, overdue % and unapplied % lower is better, so best is the lower bound. For collections, higher is better. Each measure declares `betterWhen:'lower'|'higher'`.
- **Insufficient data:**
  - Fewer than 3 periods: `insufficient_history`, no numbers.
  - Gaps in the series: `insufficient_history` with a `gap` reason. Gaps are never interpolated.
- **Bounds:** values are not clipped except where the measure is a percentage (clip to 0–100) or non-negative (clip at 0). Clipping is listed in `assumptions`.
- **Horizon:** default 3 periods, maximum 6 (provisional).
- **Out of scope for Release 2:** customer-level payment-delay prediction and overdue-invoice prediction (§4B). They need a model choice and an accuracy-validation method that can't be honestly approximated with these methods. Proposed for a later release (R2-Q6).

## Unit tests
**Proposed approach (needs approval: new files):**
- `tests/r2.test.js`, run with Node's **built-in** test runner (`node --test`), with no new dependency.
- The test reads `cfo-workspace.html`, extracts the `/* ==R2:*== */` blocks and evaluates them in `node:vm`, so the page stays single-file.
- Fallback if test files in the repo are not approved: keep the same script in the session scratchpad, as in Release 1.

| Area | Test cases |
|---|---|
| Schema | Valid dataset passes. Missing required field → excluded + reported. `openAmount > amount` rejected. Invalid date rejected. Multi-currency → `MULTI_CURRENCY`. Mixed demo + actual origin → `MIXED_ORIGIN` |
| C-DSO | Known value: AR 500,000 ÷ sales 1,500,000 × 30 = 10.0 days. `creditSales = 0` → unavailable. Derived-inputs path lists its assumption |
| C-AGE | Boundary days −1, 0, 1, 30, 31, 60, 61, 90, 91 fall in the correct buckets. Shares sum to 100 (±0.01). Zero-open invoices ignored |
| C-OD | Hand-computed fixture. Total open 0 → unavailable |
| C-VAR | Positive, negative and zero change. `prior = 0` → `pct null`, `ZERO_BASE` |
| C-CON | Ordering. Cumulative share ends at 100. Top-N at 80%. Ties broken by id. Negatives excluded and reported |
| C-UNAP | Fully applied → 0%. Partially applied fixture. No receipts → unavailable |
| C-DSPA | Even and odd median. Closed disputes excluded. Bucket boundaries |
| C-EXP | Missing creditLimit → utilisation unavailable, exposure present (never defaulted) |
| C-PDL | Early payment negative. Weighting by amount. Unpaid excluded |
| Rules | Each rule: just-below threshold → none; at threshold → medium; at high threshold → high. Missing calc → skipped with `missing`. Deterministic `ref`. R-PAY-01 with 5 prior invoices → insufficient history, with 6 → evaluated. Confidence null for threshold rules |
| Forecast | Constant series → expected constant, zero spread. Perfect linear series → exact extrapolation, zero residual. 2 periods → insufficient. Gap → insufficient. Percentage clipping. Polarity of best/worst for `lower` vs `higher` measures. Interval widens with horizon |
| Origins | Demo input → `inputOrigin:'demo'` on every calc, anomaly and forecast. Production `getDataset` → `NOT_CONNECTED`, and no calc runs |
| Determinism | Demo dataset with the same seed is byte-identical across runs. Whole pipeline gives identical output on repeat |
| Regression | Release 1 browser harness (35 cases) still passes. `node --check`. `/verify`. `ui-guardian` (expect no style/markup diff) |

## Open questions for Release 2

| ID | Question | Default until answered |
|---|---|---|
| R2-Q1 | Currency handling: single reporting currency? Conversion source and date? | Multi-currency → `unavailable` |
| R2-Q2 | As-of convention: period end, or report run date? | `asOf = period.to` |
| R2-Q3 | DSO method: period method, count-back, or both? Period length convention (calendar days)? | Period method, calendar days |
| R2-Q4 | Ageing bucket edges, and whether ageing is by due date or invoice date? | By due date: Current, 1–30, 31–60, 61–90, 91+ |
| R2-Q5 | Collection performance definition (CEI, collection rate, other)? | C-COL proxy, labelled provisional |
| R2-Q6 | Approve deferring customer-level payment-delay and overdue-invoice prediction to a later release? | Deferred |
| R2-Q7 | Who approves thresholds (D3 owner)? | Provisional values above, labelled |
| R2-Q8 | Approve adding `tests/r2.test.js` (built-in Node runner, no dependency) to the repo? | Scratchpad tests |
