# Release 2 — paused work and what carries over to the React platform

Status: **PAUSED 2026-11-12** by decision. The calculation engine will not be built in `cfo-workspace.html`. It will be implemented as independently testable TypeScript in the ERMS React app (see `cfo-platform-spec.md` §2).

> **Update 2026-11-12 — removed from the workspace.** The rollback to the pre-Release-1 snapshot removed everything in the table below from `cfo-workspace.html` (`==DS==` / `==R2==` regions, `dataSource.production/demo`, `api.getDataset`, `NOT_CONNECTED`, `MIXED_ORIGIN`). The workspace now runs on the `CFO_SAMPLE` sample-data layer (see `architecture.md`); do not re-add this code to it. The code survives only in `backups/2026-11-12_pre-rollback/cfo-workspace.html`, and the tests in `tests/retired/r2-release2-tests.js` (no longer runnable against the workspace). The "carries over to React" section still applies, with the default-mode question open (see `cfo-platform-spec.md`).

## What existed before the rollback (historical)

| Item | Location | State | Isolation |
|---|---|---|---|
| `getDataset` on `dataSource.production` | `cfo-workspace.html`, `==DS:start==` region | Rejects `NOT_CONNECTED` | Not called by any UI path |
| `getDataset` on `dataSource.demo` | same | Would call `demoData.generate` | Guarded: rejects `NOT_IMPLEMENTED` when no generator exists. Not called by any UI path |
| `api.getDataset` | same | Validates request; refuses demo data in production (`MIXED_ORIGIN`) | Not called by any UI path |
| `==R2:start==` / `==R2:end==` region | same | Intentionally empty, comment says PAUSED | — |
| `tests/r2.test.js` | repo | 61 tests: 4 always run (page parses, production not connected, invalid request, Release 1 browser regression); 57 engine tests skipped with reason | Engine tests run automatically if an engine is ever present |

**Verification after isolation (2026-11-12):** `node --check` OK; style and markup lines identical to the Release 1 snapshot; `node --test tests/r2.test.js` → 4 pass, 0 fail, 57 skipped. The Release 1 browser regression (35 cases) passed inside that run.

~~Run with `node --test tests/r2.test.js`~~ — retired. The file is now `tests/retired/r2-release2-tests.js` and fails against the current workspace by design (the regions it checks were removed). Current workspace tests: `node --test tests/workspace.test.js`.

## What carries over to React (reuse, not rewrite)

| Asset | Reuse in React |
|---|---|
| `release2-plan.md` (approved provisionally) | The specification for `src/lib/cfo/engine/*`: 10 calculations, 8 rules, F-MA3 / F-LIN, schema, origin model, thresholds. Unchanged |
| The 57 engine test cases in `tests/retired/r2-release2-tests.js` (formerly `tests/r2.test.js`) | Ported 1:1 to TypeScript tests against the engine modules. Fixtures and hand-computed expectations carry over as-is |
| Data-access contract (`getDataset`, `NOT_CONNECTED`, `MIXED_ORIGIN` guard, `validate.request`) | `src/lib/cfo/dataSource.ts` `CfoDataProvider` with `sample`, `fixture` and `live` providers selected by environment (Decision 6, spec §2.3); the contract includes the `CFO_SAMPLE` shapes (`listAgents`/`getSummary`/`answer`) |
| Release 1 request semantics (abort, 30 s provisional timeout, duplicate guard, stale-response token, settings-keyed cache) | A `useCfoRequest` hook. The 35-case browser harness becomes the behavioural checklist for the new UI |
| Origin labelling rules (`demo`, `calculated`, `forecast`, `rule`, `ai`, `actual`) | `OriginLabel` component + `origin` field on every engine result |

## What does not carry over
- The legacy page's DOM-coupled code (`show()`, `renderResult()`, `drawChart()`, the agent list). The new UI replaces it.
- The empty R2 region and the guard — already removed from the workspace by the 2026-11-12 rollback.
