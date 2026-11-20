'use strict';
// Release 2 automated tests — run with: node --test tests/
// Uses only Node built-ins (node:test, node:assert, node:vm, node:fs, node:child_process). No dependencies.
// The page stays a single self-contained file: this test extracts the marked script regions from
// cfo-workspace.html and evaluates them in an isolated vm context.
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const PAGE = path.join(__dirname, '..', 'cfo-workspace.html');
const html = fs.readFileSync(PAGE, 'utf8');

function region(name) {
  const s = html.indexOf('/* ==' + name + ':start==');
  const e = html.indexOf('/* ==' + name + ':end== */');
  assert.ok(s >= 0 && e > s, 'region ' + name + ' markers not found in cfo-workspace.html');
  return html.slice(s, e);
}
function load(search) {
  const ctx = vm.createContext({ URLSearchParams, Promise, setTimeout, clearTimeout, Error, JSON, Math, Date });
  ctx.params = new URLSearchParams(search || '');
  ctx.DEMO = ctx.params.get('demo');
  vm.runInContext(region('R2'), ctx, { filename: 'R2' });
  vm.runInContext(region('DS'), ctx, { filename: 'DS' });
  return ctx;
}
const R = load('');
// Release 2 is PAUSED (2026-11-12): the calculation engine was never added to cfo-workspace.html and will be
// implemented in the ERMS React app (see .claude/knowledge/release2-handoff.md). Engine tests stay here as the
// executable specification and are skipped, with a reason, until an engine is present.
const ENGINE = typeof R.calc !== 'undefined';
const PAUSED = 'Release 2 engine paused — moving to ERMS React (see .claude/knowledge/release2-handoff.md)';
function etest(name, fn) { return test(name, ENGINE ? {} : { skip: PAUSED }, fn); }
const P = { from: '2026-01-01', to: '2026-01-31' };

/* ---------- fixtures (test-only values, hand-computed) ---------- */
function ds(over) {
  return Object.assign({ origin: 'actual', currency: 'USD', period: P, invoices: [], receipts: [], customers: [], disputes: [] }, over);
}
function inv(id, customerId, issueDate, dueDate, amount, openAmount, paidDate) {
  const r = { id, customerId, issueDate, dueDate, amount, openAmount, currency: 'USD' };
  if (paidDate) r.paidDate = paidDate;
  return r;
}
function rec(id, customerId, receivedDate, amount, appliedAmount) {
  return { id, customerId, receivedDate, amount, appliedAmount, currency: 'USD' };
}
function V(over) { return R.schema.validate(ds(over)); }
function rule(v, id) { return R.detect.run(v, null, { detectedAt: '2026-02-01T00:00:00.000Z' }).anomalies.filter(a => a.ruleId === id); }
function assertEnvelope(r) {
  for (const k of ['id', 'status', 'formula', 'inputs', 'period', 'asOf', 'assumptions', 'methodology', 'origin', 'inputOrigin']) assert.ok(k in r, 'missing ' + k + ' on ' + r.id);
  assert.equal(r.methodology, 'provisional');
  assert.equal(r.origin, 'calculated');
}

/* ---------- page integrity ---------- */
test('page script parses (node --check equivalent)', () => {
  const s = html.indexOf('<script>', html.indexOf('</style>'));
  const js = html.slice(s + 8, html.indexOf('</script>', s));
  assert.doesNotThrow(() => new vm.Script(js, { filename: 'cfo-workspace.inline.js' }));
});

/* ---------- schema / validation ---------- */
etest('schema: valid dataset passes', () => {
  const v = V({ invoices: [inv('I1', 'C1', '2026-01-01', '2026-01-31', 100, 100)] });
  assert.equal(v.ok, true); assert.equal(v.excluded.length, 0); assert.equal(v.origin, 'actual'); assert.equal(v.currency, 'USD');
});
etest('schema: missing required field → record excluded and reported', () => {
  const bad = inv('I2', 'C1', '2026-01-01', '2026-01-31', 100, 100); delete bad.dueDate;
  const v = V({ invoices: [inv('I1', 'C1', '2026-01-01', '2026-01-31', 100, 100), bad] });
  assert.equal(v.ok, true); assert.equal(v.data.invoices.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(v.excluded)), [{ entity: 'invoice', id: 'I2', field: 'dueDate', rule: 'required' }]);
});
etest('schema: openAmount > amount rejected', () => {
  const v = V({ invoices: [inv('I1', 'C1', '2026-01-01', '2026-01-31', 100, 150)] });
  assert.equal(v.data.invoices.length, 0); assert.equal(v.excluded[0].rule, 'openAmount<=amount');
});
etest('schema: invalid calendar date rejected', () => {
  const v = V({ invoices: [inv('I1', 'C1', '2026-01-01', '2026-02-30', 100, 100)] });
  assert.equal(v.excluded[0].field, 'dueDate'); assert.equal(v.excluded[0].rule, 'date');
});
etest('schema: negative / non-finite amount rejected', () => {
  const v = V({ invoices: [inv('I1', 'C1', '2026-01-01', '2026-01-31', -1, 0), inv('I2', 'C1', '2026-01-01', '2026-01-31', NaN, 0)] });
  assert.equal(v.data.invoices.length, 0); assert.equal(v.excluded.length, 2);
});
etest('currency: multiple currencies → MULTI_CURRENCY, calculations unavailable', () => {
  const e = inv('I2', 'C1', '2026-01-01', '2026-01-31', 100, 100); e.currency = 'EUR';
  const v = V({ invoices: [inv('I1', 'C1', '2026-01-01', '2026-01-31', 100, 100), e] });
  assert.equal(v.ok, false); assert.equal(v.error.code, 'MULTI_CURRENCY');
  const d = R.calc.dso(v); assert.equal(d.status, 'unavailable'); assert.equal(d.reason, 'MULTI_CURRENCY'); assert.equal(d.value, null);
});
etest('origin: mixed demo and actual records → MIXED_ORIGIN', () => {
  const d = inv('I2', 'C1', '2026-01-01', '2026-01-31', 100, 100); d.origin = 'demo';
  const v = V({ invoices: [inv('I1', 'C1', '2026-01-01', '2026-01-31', 100, 100), d] });
  assert.equal(v.ok, false); assert.equal(v.error.code, 'MIXED_ORIGIN');
});
etest('schema: invalid period → INVALID_PERIOD', () => {
  const v = R.schema.validate(ds({ period: { from: '2026-02-01', to: '2026-01-01' } }));
  assert.equal(v.ok, false); assert.equal(v.error.code, 'INVALID_PERIOD');
});

/* ---------- calculations ---------- */
etest('C-DSO: period method, known value 500,000 / 1,500,000 × 30 = 10.0 days', () => {
  const p = { from: '2026-01-01', to: '2026-01-30' };
  const v = R.schema.validate(ds({ period: p, periodTotals: [{ period: p, creditSales: 1500000, endingAR: 500000 }] }));
  const r = R.calc.dso(v); assertEnvelope(r);
  assert.equal(r.value, 10); assert.equal(r.unit, 'days'); assert.equal(r.inputs.daysInPeriod, 30); assert.equal(r.inputs.source, 'periodTotals');
  assert.equal(r.asOf, '2026-01-30'); assert.match(r.formula, /endingAR/);
});
etest('C-DSO: zero credit sales → unavailable ZERO_DENOMINATOR', () => {
  const v = R.schema.validate(ds({ periodTotals: [{ period: P, creditSales: 0, endingAR: 10 }] }));
  const r = R.calc.dso(v); assert.equal(r.status, 'unavailable'); assert.equal(r.reason, 'ZERO_DENOMINATOR'); assert.equal(r.value, null);
});
etest('C-DSO: derived inputs path records its assumption', () => {
  const v = V({ invoices: [inv('I1', 'C1', '2026-01-10', '2026-02-09', 3100, 3100)] });
  const r = R.calc.dso(v);
  assert.equal(r.inputs.source, 'derived'); assert.equal(r.value, 31);
  assert.ok(r.assumptions.some(a => /derived/i.test(a)));
});
etest('C-DSO: no invoice data at all → unavailable with missing entity', () => {
  const v = R.schema.validate({ origin: 'actual', currency: 'USD', period: P });
  const r = R.calc.dso(v); assert.equal(r.status, 'unavailable'); assert.ok(r.missing.includes('invoice'));
});
const AGE_DUES = ['2026-02-01', '2026-01-31', '2026-01-30', '2026-01-01', '2025-12-31', '2025-12-02', '2025-12-01', '2025-11-02', '2025-11-01']; // dpd -1,0,1,30,31,60,61,90,91
etest('C-AGE: bucket boundaries -1,0,1,30,31,60,61,90,91', () => {
  const v = V({ invoices: AGE_DUES.map((d, i) => inv('I' + i, 'C1', '2025-10-01', d, 100, 100)) });
  const r = R.calc.ageing(v); assertEnvelope(r);
  assert.deepEqual(r.value.buckets.map(b => b.id), ['current', '1-30', '31-60', '61-90', '91+']);
  assert.deepEqual(r.value.buckets.map(b => b.count), [2, 2, 2, 2, 1]);
  const sum = r.value.buckets.reduce((s, b) => s + b.share, 0); assert.ok(Math.abs(sum - 100) < 0.01);
});
etest('C-AGE: zero-open and later-issued invoices ignored; nothing open → unavailable', () => {
  const v = V({ invoices: [inv('I1', 'C1', '2025-10-01', '2026-01-01', 100, 0), inv('I2', 'C1', '2026-02-05', '2026-03-01', 100, 100)] });
  assert.equal(R.calc.ageing(v).status, 'unavailable');
});
etest('C-AGE: invoice paid after as-of date counts as open at as-of (point-in-time)', () => {
  const v = V({ invoices: [inv('I1', 'C1', '2026-01-01', '2026-01-15', 100, 0, '2026-02-10')] });
  const r = R.calc.ageing(v); assert.equal(r.value.totalOpen, 100); assert.ok(r.assumptions.some(a => /paid after/i.test(a)));
});
etest('C-OD: overdue percentage 700/900', () => {
  const v = V({ invoices: AGE_DUES.map((d, i) => inv('I' + i, 'C1', '2025-10-01', d, 100, 100)) });
  const r = R.calc.overdue(v); assertEnvelope(r);
  assert.ok(Math.abs(r.value - 77.7777) < 0.001); assert.equal(r.inputs.overdueAmount, 700); assert.equal(r.inputs.totalOpen, 900);
});
etest('C-OD: total open 0 → unavailable', () => {
  assert.equal(R.calc.overdue(V({ invoices: [] })).status, 'unavailable');
});
etest('C-VAR: positive, negative, zero, and zero base', () => {
  assert.deepEqual({ ...R.calc.variance('X', 120, 100).value }, { abs: 20, pct: 20 });
  assert.deepEqual({ ...R.calc.variance('X', 80, 100).value }, { abs: -20, pct: -20 });
  assert.deepEqual({ ...R.calc.variance('X', 100, 100).value }, { abs: 0, pct: 0 });
  const z = R.calc.variance('X', 50, 0); assert.equal(z.status, 'ok'); assert.equal(z.value.abs, 50); assert.equal(z.value.pct, null); assert.equal(z.reason, 'ZERO_BASE');
  const n = R.calc.variance('X', 1, -50); assert.equal(n.value.pct, 102);
});
etest('C-VAR: unavailable input → unavailable', () => {
  const u = R.calc.dso(V({}));
  assert.equal(R.calc.variance('X', u, 10).status, 'unavailable');
});
etest('C-CON: ordering, cumulative, top-N at 80%, ties by key, negatives excluded', () => {
  const r = R.calc.contribution([{ key: 'b', value: 30 }, { key: 'a', value: 30 }, { key: 'c', value: 40 }, { key: 'd', value: -5 }], { inputOrigin: 'actual', period: P });
  assertEnvelope(r);
  assert.deepEqual(r.value.items.map(i => i.key), ['c', 'a', 'b']);
  assert.equal(r.value.items[2].cumulative, 100); assert.equal(r.value.topN, 3);
  assert.deepEqual([...r.inputs.excluded], ['d']);
  const r2 = R.calc.contribution([{ key: 'x', value: 85 }, { key: 'y', value: 15 }], { inputOrigin: 'actual', period: P });
  assert.equal(r2.value.topN, 1);
});
etest('C-CON: total 0 → unavailable', () => {
  assert.equal(R.calc.contribution([{ key: 'a', value: 0 }], { inputOrigin: 'actual', period: P }).status, 'unavailable');
});
etest('C-UNAP: fully applied 0%, partial, none → unavailable', () => {
  assert.equal(R.calc.unapplied(V({ receipts: [rec('R1', 'C1', '2026-01-10', 100, 100)] })).value, 0);
  const r = R.calc.unapplied(V({ receipts: [rec('R1', 'C1', '2026-01-10', 100, 90), rec('R2', 'C1', '2026-01-11', 100, 100), rec('R3', 'C1', '2025-12-31', 100, 0)] }));
  assertEnvelope(r); assert.equal(r.value, 5); assert.equal(r.inputs.receiptCount, 2);
  assert.equal(R.calc.unapplied(V({ receipts: [] })).status, 'unavailable');
});
etest('C-DSPA: medians (odd/even), closed excluded, buckets', () => {
  const d = (id, o, c, amt) => Object.assign({ id, customerId: 'C1', openedDate: o, amount: amt || 10 }, c ? { closedDate: c } : {});
  const odd = R.calc.disputeAgeing(V({ disputes: [d('D1', '2026-01-21'), d('D2', '2026-01-11'), d('D3', '2025-11-01'), d('D4', '2025-11-01', '2026-01-05')] }));
  assertEnvelope(odd);
  assert.equal(odd.value.count, 3); assert.equal(odd.value.median, 20); // ages 10, 20, 91
  assert.deepEqual(odd.value.buckets.map(b => b.count), [2, 0, 0, 1]);
  const even = R.calc.disputeAgeing(V({ disputes: [d('D1', '2026-01-21'), d('D2', '2026-01-11')] }));
  assert.equal(even.value.median, 15);
  const none = R.calc.disputeAgeing(V({ disputes: [] })); assert.equal(none.status, 'ok'); assert.equal(none.value.count, 0); assert.equal(none.value.median, null);
});
etest('C-EXP: missing credit limit → utilisation unavailable, exposure still present, never defaulted', () => {
  const v = V({ customers: [{ id: 'C1', name: 'A', currency: 'USD', creditLimit: 1000 }, { id: 'C2', name: 'B', currency: 'USD' }],
    invoices: [inv('I1', 'C1', '2026-01-01', '2026-02-01', 900, 900), inv('I2', 'C2', '2026-01-01', '2026-02-01', 500, 500)] });
  const r = R.calc.exposure(v); assertEnvelope(r);
  const c1 = r.value.customers.find(c => c.customerId === 'C1'), c2 = r.value.customers.find(c => c.customerId === 'C2');
  assert.equal(c1.utilisation, 90); assert.equal(c2.exposure, 500); assert.equal(c2.utilisation, null); assert.equal(c2.utilisationStatus, 'unavailable');
  assert.equal(c2.creditLimit, null);
});
etest('C-PDL: amount-weighted, early payment negative, unpaid excluded', () => {
  const v = V({ invoices: [inv('I1', 'C1', '2025-12-01', '2026-01-05', 100, 0, '2026-01-15'), inv('I2', 'C1', '2025-12-01', '2026-01-12', 300, 0, '2026-01-10'), inv('I3', 'C1', '2025-12-01', '2026-01-10', 999, 999)] });
  const r = R.calc.paymentDelay(v); assertEnvelope(r);
  assert.equal(r.value.customers[0].delayDays, 1); assert.equal(r.value.customers[0].invoices, 2);
});
etest('C-COL: collection rate = applied / (openingAR + credit sales)', () => {
  const v = V({ invoices: [inv('I1', 'C1', '2025-12-01', '2025-12-31', 1000, 500), inv('I2', 'C1', '2026-01-01', '2026-01-31', 500, 500)], receipts: [rec('R1', 'C1', '2026-01-15', 400, 400)] });
  const r = R.calc.collectionRate(v); assertEnvelope(r);
  assert.equal(r.inputs.openingAR, 500); assert.equal(r.inputs.creditSales, 500); assert.equal(r.value, 40);
});
etest('every calculation exposes formula, inputs, period, assumptions and origin', () => {
  const v = V({ invoices: [inv('I1', 'C1', '2026-01-01', '2026-01-31', 100, 100)], receipts: [rec('R1', 'C1', '2026-01-10', 100, 100)], customers: [{ id: 'C1', name: 'A', currency: 'USD', creditLimit: 100 }] });
  for (const f of ['dso', 'endingAR', 'ageing', 'overdue', 'unapplied', 'disputeAgeing', 'exposure', 'paymentDelay', 'collectionRate']) {
    const r = R.calc[f](v); assertEnvelope(r);
    assert.ok(r.formula.length > 0, f + ' formula'); assert.equal(r.period.to, '2026-01-31'); assert.equal(r.inputOrigin, 'actual');
    assert.match(r.methodologyNote, /Provisional/);
  }
});

/* ---------- anomaly rules ---------- */
function od(overdue, notOverdue) {
  return V({ invoices: [inv('A', 'C1', '2026-01-01', '2026-02-15', notOverdue, notOverdue), inv('B', 'C1', '2026-01-01', '2026-01-26', overdue, overdue)] });
}
etest('R-OD-01: below, at medium, at high threshold', () => {
  assert.equal(rule(od(19.99, 80.01), 'R-OD-01').length, 0);
  const m = rule(od(20, 80), 'R-OD-01'); assert.equal(m.length, 1); assert.equal(m[0].severity, 'medium');
  assert.equal(rule(od(35, 65), 'R-OD-01')[0].severity, 'high');
  assert.equal(m[0].impact.amount, 20); assert.equal(m[0].impact.currency, 'USD');
});
etest('R-OD-01: 91+ bucket share ≥ 10% → high', () => {
  const v = V({ invoices: [inv('A', 'C1', '2025-09-01', '2026-02-15', 90, 90), inv('B', 'C1', '2025-09-01', '2025-11-01', 10, 10)] });
  assert.equal(rule(v, 'R-OD-01')[0].severity, 'high');
});
etest('anomaly exposes rule, observed, threshold, period, inputs, method, confidence note, action', () => {
  const a = rule(od(20, 80), 'R-OD-01')[0];
  for (const k of ['ref', 'domain', 'ruleId', 'detectedAt', 'period', 'severity', 'observed', 'threshold', 'impact', 'evidence', 'method', 'calcs', 'confidence', 'confidenceNote', 'recommendedAction', 'origin', 'inputOrigin', 'methodology']) assert.ok(k in a, 'missing ' + k);
  assert.equal(a.origin, 'rule'); assert.equal(a.observed.value, 20); assert.equal(a.threshold.medium, 20); assert.equal(a.period.to, '2026-01-31');
  assert.equal(a.confidence, null); assert.match(a.confidenceNote, /not statistically meaningful/i);
  assert.ok(a.evidence.some(e => e.id === 'B')); assert.ok(a.calcs.length >= 1 && a.calcs[0].formula);
  assert.equal(a.ref, 'ANOM-R-OD-01-all-2026-01-31');
});
etest('anomaly refs are deterministic', () => {
  assert.deepEqual(JSON.stringify(rule(od(35, 65), 'R-OD-01')), JSON.stringify(rule(od(35, 65), 'R-OD-01')));
});
function dsoSet(endingAR) {
  return V({ periodTotals: [{ period: { from: '2025-12-01', to: '2025-12-31' }, creditSales: 3100, endingAR: 1000 }, { period: P, creditSales: 3100, endingAR }] });
}
etest('R-DSO-01: DSO +4.99 none, +5 medium, +10 high', () => {
  assert.equal(rule(dsoSet(1499), 'R-DSO-01').length, 0);
  assert.equal(rule(dsoSet(1500), 'R-DSO-01')[0].severity, 'medium');
  const h = rule(dsoSet(2000), 'R-DSO-01')[0]; assert.equal(h.severity, 'high'); assert.equal(h.impact, null); assert.ok(h.impactNote);
});
etest('R-AR-01: AR movement 14.9% none, 15% medium, 30% high', () => {
  assert.equal(rule(dsoSet(1149), 'R-AR-01').length, 0);
  assert.equal(rule(dsoSet(1150), 'R-AR-01')[0].severity, 'medium');
  const h = rule(dsoSet(1300), 'R-AR-01')[0]; assert.equal(h.severity, 'high'); assert.equal(h.impact.amount, 300);
});
function paySet(historyDelays, currentDelay) {
  const invs = historyDelays.map((d, i) => { const due = '2025-0' + (i + 2) + '-10'; return inv('H' + i, 'C1', '2025-01-01', due, 100, 0, R.r2u.iso(R.r2u.dnum(due) + d)); });
  invs.push(inv('N1', 'C1', '2025-12-01', '2026-01-05', 100, 0, R.r2u.iso(R.r2u.dnum('2026-01-05') + currentDelay)));
  return V({ invoices: invs });
}
etest('R-PAY-01: needs ≥ 6 prior payments; 5 → not evaluated (insufficient history)', () => {
  const res = R.detect.run(paySet([0, 2, 4, 6, 8], 13), null, { detectedAt: 'x' });
  assert.equal(res.anomalies.filter(a => a.ruleId === 'R-PAY-01').length, 0);
  assert.ok(res.notes.some(n => n.ruleId === 'R-PAY-01' && n.reason === 'INSUFFICIENT_HISTORY'));
});
etest('R-PAY-01: z < 2 none, z ≥ 2 medium, z ≥ 3 high, with z-score confidence', () => {
  const H = [0, 2, 4, 6, 8, 10]; // mean 5, sample sd √14
  assert.equal(rule(paySet(H, 12), 'R-PAY-01').length, 0);
  const m = rule(paySet(H, 13), 'R-PAY-01')[0]; assert.equal(m.severity, 'medium');
  assert.equal(m.confidence.type, 'z-score'); assert.equal(m.confidence.n, 6); assert.ok(Math.abs(m.confidence.value - 8 / Math.sqrt(14)) < 1e-9);
  assert.equal(rule(paySet(H, 17), 'R-PAY-01')[0].severity, 'high');
});
function cashSet(applied) { return V({ receipts: [rec('R1', 'C1', '2026-01-10', 100, applied)] }); }
etest('R-CASH-01: unapplied 4.99% none, 5% medium, 10% high', () => {
  assert.equal(rule(cashSet(95.01), 'R-CASH-01').length, 0);
  const m = rule(cashSet(95), 'R-CASH-01')[0]; assert.equal(m.severity, 'medium'); assert.equal(m.observed.lateUnappliedCount, 1);
  assert.equal(rule(cashSet(90), 'R-CASH-01')[0].severity, 'high');
});
function crSet(open, limit) {
  const c = { id: 'C1', name: 'A', currency: 'USD' }; if (limit != null) c.creditLimit = limit;
  return V({ customers: [c], invoices: [inv('I1', 'C1', '2025-12-05', '2026-02-05', open, open)] }); // issued before prior as-of, so no utilisation jump
}
etest('R-CR-01: utilisation 89% none, 90% medium, 100% high, missing limit noted', () => {
  assert.equal(rule(crSet(890, 1000), 'R-CR-01').length, 0);
  assert.equal(rule(crSet(900, 1000), 'R-CR-01')[0].severity, 'medium');
  const h = rule(crSet(1100, 1000), 'R-CR-01')[0]; assert.equal(h.severity, 'high'); assert.equal(h.impact.amount, 100);
  const res = R.detect.run(crSet(1100, null), null, { detectedAt: 'x' });
  assert.equal(res.anomalies.filter(a => a.ruleId === 'R-CR-01').length, 0);
  assert.ok(res.notes.some(n => n.ruleId === 'R-CR-01' && n.reason === 'MISSING_CREDIT_LIMIT'));
});
etest('R-CR-01: utilisation up ≥ 20 points vs prior → medium', () => {
  const v = V({ customers: [{ id: 'C1', name: 'A', currency: 'USD', creditLimit: 1000 }],
    invoices: [inv('X', 'C1', '2025-12-01', '2026-02-01', 500, 500), inv('Y', 'C1', '2026-01-05', '2026-02-05', 200, 200)] });
  const a = rule(v, 'R-CR-01'); assert.equal(a.length, 1); assert.equal(a[0].severity, 'medium');
});
etest('R-DSP-01: share aged 61+ = 25% → medium; prior median rise below 10 days ignored', () => {
  const d = (id, o) => ({ id, customerId: 'C1', openedDate: o, amount: 10 });
  const v = V({ disputes: [d('D1', '2025-12-01'), d('D2', '2026-01-10'), d('D3', '2026-01-11'), d('D4', '2026-01-12')] });
  const a = rule(v, 'R-DSP-01'); assert.equal(a.length, 1); assert.equal(a[0].severity, 'medium'); assert.equal(a[0].impact.amount, 10);
  const below = V({ disputes: [d('D1', '2025-12-01'), d('D2', '2026-01-10'), d('D3', '2026-01-11'), d('D4', '2026-01-12'), d('D5', '2026-01-13')] });
  assert.equal(rule(below, 'R-DSP-01').length, 0);
});
function colSet(applied) {
  return V({ invoices: [inv('I1', 'C1', '2025-12-01', '2025-12-31', 1000, 500), inv('I2', 'C1', '2026-01-01', '2026-01-31', 500, 500)],
    receipts: [rec('R0', 'C1', '2025-12-15', 500, 500), rec('R1', 'C1', '2026-01-15', applied, applied)] });
}
etest('R-COL-01: collection rate drop 9.9 none, 10 medium, 20 high', () => {
  assert.equal(rule(colSet(401), 'R-COL-01').length, 0);
  assert.equal(rule(colSet(400), 'R-COL-01')[0].severity, 'medium');
  assert.equal(rule(colSet(300), 'R-COL-01')[0].severity, 'high');
});
etest('rules with unavailable calculations are skipped with the missing inputs, not guessed', () => {
  const res = R.detect.run(R.schema.validate({ origin: 'actual', currency: 'USD', period: P }), null, { detectedAt: 'x' });
  assert.equal(res.anomalies.length, 0);
  assert.equal(res.evaluated.length + res.skipped.length, 8);
  assert.ok(res.skipped.every(s => s.reason && Array.isArray(s.missing)));
});
etest('thresholds are provisional', () => {
  for (const k of Object.keys(R.THRESHOLDS)) assert.equal(R.THRESHOLDS[k].status, 'provisional', k);
});

/* ---------- forecasting ---------- */
function months(vals, origin) {
  return vals.map((v, i) => { const m = i + 1; const mm = String(m).padStart(2, '0'); const last = new Date(Date.UTC(2025, m, 0)).getUTCDate();
    return { period: { from: '2025-' + mm + '-01', to: '2025-' + mm + '-' + last }, value: v, origin: origin || 'actual' }; });
}
etest('forecast: constant series → MA3, expected constant, zero spread', () => {
  const f = R.forecast.run(months([5, 5, 5]), { id: 'X', betterWhen: 'lower', kind: 'any' });
  assert.equal(f.status, 'ok'); assert.equal(f.method, 'F-MA3'); assert.equal(f.points.length, 3);
  f.points.forEach(p => { assert.equal(p.expected, 5); assert.equal(p.best, 5); assert.equal(p.worst, 5); });
});
etest('forecast: perfect linear series → F-LIN exact extrapolation, zero residual', () => {
  const f = R.forecast.run(months([1, 2, 3, 4, 5, 6]), { id: 'X', betterWhen: 'higher', kind: 'any' });
  assert.equal(f.method, 'F-LIN'); assert.ok(Math.abs(f.points[0].expected - 7) < 1e-9); assert.ok(Math.abs(f.points[2].expected - 9) < 1e-9);
  assert.ok(Math.abs(f.points[0].best - f.points[0].worst) < 1e-9);
});
etest('forecast: < 3 periods → insufficient_history, no numbers', () => {
  const f = R.forecast.run(months([1, 2]), { id: 'X', betterWhen: 'higher', kind: 'any' });
  assert.equal(f.status, 'insufficient_history'); assert.equal(f.reason, 'min_periods'); assert.equal(f.points.length, 0);
});
etest('forecast: gap in series → insufficient_history (gap), never interpolated', () => {
  const s = months([1, 2, 3, 4]); s.splice(1, 1);
  const f = R.forecast.run(s, { id: 'X', betterWhen: 'higher', kind: 'any' });
  assert.equal(f.status, 'insufficient_history'); assert.equal(f.reason, 'gap');
});
etest('forecast: missing value → insufficient_history (missing_values)', () => {
  const f = R.forecast.run(months([1, null, 3]), { id: 'X', betterWhen: 'higher', kind: 'any' });
  assert.equal(f.reason, 'missing_values');
});
etest('forecast: percentage clipping recorded as an assumption', () => {
  const f = R.forecast.run(months([90, 92, 94, 96, 98, 100]), { id: 'X', betterWhen: 'lower', kind: 'percent' });
  assert.equal(f.points[0].expected, 100); assert.ok(f.assumptions.some(a => /clipped/i.test(a)));
});
etest('forecast: polarity — best is lower for lower-is-better, higher for higher-is-better', () => {
  const s = months([10, 12, 11, 14, 13, 15]);
  const lo = R.forecast.run(s, { id: 'X', betterWhen: 'lower', kind: 'any' }).points[0];
  const hi = R.forecast.run(s, { id: 'X', betterWhen: 'higher', kind: 'any' }).points[0];
  assert.ok(lo.best < lo.expected && lo.expected < lo.worst); assert.ok(hi.best > hi.expected && hi.expected > hi.worst);
});
etest('forecast: scenario spread widens with horizon (F-LIN)', () => {
  const p = R.forecast.run(months([10, 12, 11, 14, 13, 15]), { id: 'X', betterWhen: 'higher', kind: 'any', horizon: 6 }).points;
  assert.equal(p.length, 6);
  for (let i = 1; i < p.length; i++) assert.ok(p[i].best - p[i].worst > p[i - 1].best - p[i - 1].worst);
});
etest('forecast: labelled as provisional scenarios, not confidence intervals; horizon capped at 6', () => {
  const f = R.forecast.run(months([1, 2, 3]), { id: 'X', betterWhen: 'higher', kind: 'any', horizon: 12 });
  assert.equal(f.origin, 'forecast'); assert.equal(f.methodology, 'provisional'); assert.equal(f.horizon, 6);
  assert.match(f.disclaimer, /Forecast \(provisional\) — not actuals/);
  assert.match(f.scenarioNote, /scenarios/i); assert.match(f.scenarioNote, /not statistically validated confidence intervals/i);
});
etest('forecast: mixed demo/actual series → MIXED_ORIGIN', () => {
  const s = months([1, 2, 3]); s[1].origin = 'demo';
  const f = R.forecast.run(s, { id: 'X', betterWhen: 'higher', kind: 'any' });
  assert.equal(f.status, 'error'); assert.equal(f.reason, 'MIXED_ORIGIN');
});

/* ---------- demo data & origin separation ---------- */
etest('demo data: deterministic, synthetic, labelled demo', () => {
  const a = R.demoData.generate({ seed: R.DEMO_SEED, from: '2026-01-01', to: '2026-01-31' });
  const b = R.demoData.generate({ seed: R.DEMO_SEED, from: '2026-01-01', to: '2026-01-31' });
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  assert.equal(a.origin, 'demo'); assert.match(a.label, /synthetic/i);
  for (const k of ['invoices', 'receipts', 'customers', 'disputes']) { assert.ok(a[k].length > 0, k); assert.ok(a[k].every(r => r.origin === 'demo'), k + ' origin'); }
  assert.ok(a.customers.every(c => /^Customer \d{3}$/.test(c.name)));
  const v = R.schema.validate(a); assert.equal(v.ok, true); assert.equal(v.excluded.length, 0);
});
etest('demo data: different seed → different data', () => {
  const a = R.demoData.generate({ seed: 'a', from: '2026-01-01', to: '2026-01-31' }), b = R.demoData.generate({ seed: 'b', from: '2026-01-01', to: '2026-01-31' });
  assert.notEqual(JSON.stringify(a), JSON.stringify(b));
});
etest('demo pipeline: every calc, anomaly and forecast carries inputOrigin demo; repeatable', () => {
  const v = R.schema.validate(R.demoData.generate({ seed: R.DEMO_SEED, from: '2026-01-01', to: '2026-01-31' }));
  for (const f of ['dso', 'ageing', 'overdue', 'unapplied', 'disputeAgeing', 'exposure', 'paymentDelay', 'collectionRate']) assert.equal(R.calc[f](v).inputOrigin, 'demo', f);
  const r1 = R.detect.run(v, null, { detectedAt: '2026-02-01T00:00:00.000Z' }), r2 = R.detect.run(v, null, { detectedAt: '2026-02-01T00:00:00.000Z' });
  assert.equal(JSON.stringify(r1), JSON.stringify(r2));
  r1.anomalies.forEach(a => { assert.equal(a.origin, 'rule'); assert.equal(a.inputOrigin, 'demo'); });
  assert.equal(r1.inputOrigin, 'demo');
});
const REQ = { agentId: 'credit-agent-1', from: '2026-01-01', to: '2026-01-31', provider: 'p', model: 'm' };
test('production mode: getDataset → NOT_CONNECTED, no data returned', async () => {
  const c = load('');
  assert.equal(c.MODE, 'production');
  await assert.rejects(c.api.getDataset(REQ), e => e.code === 'NOT_CONNECTED');
});
etest('production mode: a demo dataset is refused even if a source returned one', async () => {
  const c = load('');
  c.dataSource.production.getDataset = () => Promise.resolve(c.demoData.generate({ seed: 's', from: REQ.from, to: REQ.to }));
  await assert.rejects(c.api.getDataset(REQ), e => e.code === 'MIXED_ORIGIN');
});
etest('demo mode only on explicit request: ?mode=demo returns labelled synthetic data', async () => {
  const c = load('?mode=demo');
  assert.equal(c.MODE, 'demo');
  const d = await c.api.getDataset(REQ); assert.equal(d.origin, 'demo');
});
test('invalid request is rejected before any data access', async () => {
  const c = load('?mode=demo');
  await assert.rejects(c.api.getDataset({ ...REQ, from: '2026-02-01' }), e => e.code === 'INVALID_REQUEST');
});

/* ---------- Release 1 regression (headless browser) ---------- */
const HARNESS = "<!doctype html>\n<html><head><meta charset=\"utf-8\"><title>R1 harness</title></head>\n<body><pre id=\"out\"></pre>\n<iframe id=\"f\" style=\"width:1440px;height:900px\"></iframe>\n<script>\nvar PAGE=(location.search.match(/page=([^&]+)/)||[])[1];PAGE=decodeURIComponent(PAGE);\nvar out=[],F=document.getElementById('f');\nfunction log(ok,name,detail){out.push((ok?'PASS ':'FAIL ')+name+(detail?' — '+detail:''))}\nfunction wait(ms){return new Promise(function(r){setTimeout(r,ms)})}\nfunction load(qs){return new Promise(function(res){F.onload=function(){var w=F.contentWindow;w.__errs=[];w.addEventListener('error',function(e){w.__errs.push(e.message)});res(w)};F.src=PAGE+qs})}\nfunction D(){return F.contentDocument}\nfunction vis(id){var e=D().getElementById(id);return e&&!e.hidden}\nfunction state(){return ['stIdle','stLoading','stError','stEmpty','stResult'].filter(vis).join(',')}\nfunction agentBtn(i){return D().querySelector('.agent-main[data-i=\"'+i+'\"]')}\nfunction toasts(){return [].map.call(D().querySelectorAll('.toast span:not(.ic)'),function(s){return s.textContent})}\nfunction count(arr,t){return arr.filter(function(x){return x===t}).length}\nfunction setVal(id,v){var e=D().getElementById(id);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}))}\nasync function run(){\n  var w;\n  // T1 production default\n  w=await load('?category=credit');\n  log(state()==='stIdle','T1a production: idle on load',state());\n  agentBtn(1).click();\n  log(state()==='stLoading','T1b production: agent click → loading',state());\n  await wait(100);\n  log(state()==='stError','T1c production: not-connected error state',state());\n  var msg=D().querySelector('#stError p').textContent;\n  log(/Data source not connected/.test(msg),'T1d production: honest message',msg);\n  log(toasts().indexOf('Data source not connected')>=0,'T1e production: toast',toasts().join('|'));\n  log(D().getElementById('chatWrap').hidden,'T1f production: chat hidden');\n  log(vis('chError'),'T1g production: chart mirrors error');\n\n  // T2 demo: load + cache\n  w=await load('?mode=demo&category=credit');\n  agentBtn(1).click();await wait(1700);\n  log(state()==='stResult','T2a demo: success after load',state());\n  agentBtn(2).click();await wait(1700);\n  agentBtn(1).click();\n  log(state()==='stResult','T2b demo: cached agent shows instantly (no loading)',state());\n  var n=count(toasts(),'Summary ready');\n  agentBtn(1).click();await wait(1700);\n  log(count(toasts(),'Summary ready')===n&&state()==='stResult','T2c demo: re-click active cached agent makes no request');\n\n  // T3 switch mid-load\n  w=await load('?mode=demo&category=credit');\n  agentBtn(1).click();await wait(300);agentBtn(2).click();await wait(1800);\n  log(state()==='stResult'&&/agent 3/.test(D().getElementById('sumAgent').textContent),'T3a mid-load switch shows 2nd agent',D().getElementById('sumAgent').textContent);\n  await wait(1700);\n  log(count(toasts(),'Summary ready')===1,'T3b first request cancelled (one completion)',toasts().join('|'));\n\n  // T4 settings change hides old result; cache keyed by settings\n  w=await load('?mode=demo&category=credit');\n  agentBtn(1).click();await wait(1700);\n  D().querySelector('#presets [data-p=\"7\"]').click();\n  log(state()==='stIdle','T4a range change → old result not shown as current',state());\n  D().querySelector('#presets [data-p=\"30\"]').click();\n  log(state()==='stResult','T4b back to original range → cached result instantly',state());\n  setVal('model',D().getElementById('model').options[1].value);\n  log(state()==='stIdle','T4c model change → idle',state());\n\n  // T5 settings change mid-load → cancel; late response ignored\n  w=await load('?mode=demo&category=credit');\n  agentBtn(1).click();await wait(300);\n  D().querySelector('#presets [data-p=\"7\"]').click();\n  log(state()==='stIdle','T5a settings change mid-load cancels',state());\n  await wait(1800);\n  log(state()==='stIdle'&&count(toasts(),'Summary ready')===0,'T5b late response ignored',state()+' '+toasts().join('|'));\n\n  log(toasts().indexOf(\"Settings changed — generation cancelled\")>=0,\"T5c cancellation announced\",toasts().join(\"|\"));\n  w=await load(\"?mode=demo&category=credit\");agentBtn(1).click();await wait(1700);D().querySelector(\"#presets [data-p=\\\"7\\\"]\").click();log(toasts().indexOf(\"Settings changed — summary cleared\")>=0,\"T4d clear announced\");D().querySelector(\"#presets [data-p=\\\"30\\\"]\").click();log(toasts().indexOf(\"Settings changed — showing the earlier summary for these settings\")>=0,\"T4e cached swap announced\");\n  // T6 regenerate keeps pin and vote\n  w=await load('?mode=demo&category=credit');\n  agentBtn(1).click();await wait(1700);\n  D().querySelector('[data-act=\"pin\"]').click();D().querySelector('[data-act=\"like\"]').click();\n  var t1=D().getElementById('mTime').getAttribute('datetime');\n  await wait(50);\n  D().querySelector('[data-act=\"regen\"]').click();await wait(1700);\n  log(D().querySelector('[data-act=\"pin\"]').getAttribute('aria-pressed')==='true','T6a regenerate keeps pin');\n  log(D().querySelector('[data-act=\"like\"]').getAttribute('aria-pressed')==='true','T6b regenerate keeps vote');\n  log(D().getElementById('mTime').getAttribute('datetime')!==t1,'T6c new generation time');\n\n  // T7 thread per summary\n  D().getElementById('chatInput').value='hello';D().getElementById('chatForm').dispatchEvent(new Event('submit',{cancelable:true}));\n  await wait(800);\n  log(D().querySelectorAll('#thread li').length===2,'T7a chat thread has 2 messages',D().querySelectorAll('#thread li').length);\n  D().querySelector('[data-act=\"regen\"]').click();await wait(1700);\n  log(D().querySelectorAll('#thread li').length===0,'T7b regenerated summary starts its own thread');\n\n  // T8 invalid dates\n  w=await load('?mode=demo&category=credit');\n  setVal('from','2026-12-31');setVal('to','2026-01-01');\n  agentBtn(1).click();await wait(1700);\n  log(!D().getElementById('dateErr').hidden&&state()==='stIdle','T8 invalid dates: error shown, nothing loads',state());\n\n  // T9 duplicate protection\n  w=await load('?mode=demo&category=credit');\n  D().getElementById('summarizeBtn').click();\n  D().dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',ctrlKey:true,bubbles:true}));\n  D().querySelector('[data-refresh=\"0\"]').click();\n  await wait(1800);\n  log(count(toasts(),'Summary ready')===1,'T9 duplicate requests suppressed',toasts().join('|'));\n\n  // T10 stop\n  w=await load('?mode=demo&category=credit');\n  agentBtn(1).click();await wait(200);D().getElementById('stopBtn').click();\n  log(state()==='stIdle'&&toasts().indexOf('Generation stopped')>=0,'T10a stop → idle');\n  await wait(1800);\n  log(state()==='stIdle','T10b stopped request never renders');\n\n  // T11 demo previews\n  w=await load('?demo=empty');await wait(1700);log(state()==='stEmpty','T11a ?demo=empty',state());\n  w=await load('?demo=error');await wait(1700);log(state()==='stError'&&/Simulated error/.test(D().querySelector('#stError p').textContent),'T11b ?demo=error',state());\n  w=await load('?demo=loading');await wait(40000);log(state()==='stLoading','T11c ?demo=loading stays loading (no timeout)',state());\n\n  // T12 history restores category + agent\n  w=await load('?mode=demo&category=credit');\n  D().getElementById('tab-collections').click();agentBtn(2).click();await wait(1700);\n  D().getElementById('tab-credit').click();\n  w.history.back();await wait(300);\n  var act=D().querySelector('.agent-main[aria-current]');\n  log(D().getElementById('tab-collections').getAttribute('aria-selected')==='true'&&act&&act.dataset.i==='2','T12 back restores category and agent',act&&act.dataset.i);\n\n  // T13 prompt edit → new version → new key\n  w=await load('?mode=demo&category=credit');\n  agentBtn(1).click();await wait(1700);\n  D().querySelector('[data-act=\"edit\"]').click();D().getElementById('promptText').value='changed prompt';\n  D().getElementById('promptDlg').close('save');await wait(100);\n  log(state()==='stLoading','T13a edited prompt regenerates',state());\n  await wait(1700);log(state()==='stResult','T13b new version result',state());\n\n  // errors\n  log(true,'console/page errors: '+(F.contentWindow.__errs.length?F.contentWindow.__errs.join(';'):'none (last page)'));\n  document.getElementById('out').textContent=out.join('\\n')+'\\nDONE';\n}\nrun().catch(function(e){document.getElementById('out').textContent=out.join('\\n')+'\\nHARNESS ERROR '+e.message+'\\n'+e.stack});\n</script></body></html>\n";
function findChrome() {
  const c = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  return c.find(p => p && fs.existsSync(p));
}
const CHROME = findChrome();
test('Release 1 regression: browser harness (35 cases)', { skip: CHROME ? false : 'No Chrome/Edge found (set CHROME_PATH)', timeout: 300000 }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cfo-r1-'));
  const h = path.join(dir, 'harness.html'); fs.writeFileSync(h, HARNESS);
  const url = 'file:///' + h.replace(/\\/g, '/') + '?page=' + encodeURIComponent('file:///' + PAGE.replace(/\\/g, '/'));
  const r = spawnSync(CHROME, ['--headless=new', '--disable-gpu', '--allow-file-access-from-files', '--disable-web-security', '--user-data-dir=' + path.join(dir, 'prof'),
    '--virtual-time-budget=200000', '--window-size=1600,1000', '--dump-dom', url], { encoding: 'utf8', timeout: 280000, maxBuffer: 64 * 1024 * 1024 });
  const m = /<pre id="out">([\s\S]*?)<\/pre>/.exec(r.stdout || '');
  assert.ok(m, 'harness produced no output');
  const out = m[1];
  assert.match(out, /DONE/, 'harness did not finish: ' + out.slice(-300));
  const lines = out.split('\n').filter(l => /^(PASS|FAIL) /.test(l));
  const fails = lines.filter(l => l.startsWith('FAIL'));
  assert.deepEqual(fails, []);
  assert.ok(lines.length >= 35, 'expected ≥ 35 cases, got ' + lines.length);
  assert.match(out, /console\/page errors: none/);
});
