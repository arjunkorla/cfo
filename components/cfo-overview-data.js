/* =====================================================================================
   CFO OVERVIEW — executive view model (UI/UX prototype). No backend, no LLM, no network.
   -------------------------------------------------------------------------------------
   Everything here is ILLUSTRATIVE SAMPLE DATA, restated from components/cfo-sample-data.js
   (CFO_SAMPLE) for the overview page. Nothing new is invented:
     - every displayed figure cites the CFO_SAMPLE agent it comes from (src: [categoryId, agentId])
       and its sample report id; tests/workspace.test.js checks each `find` string appears in that
       agent's sample summary and each `series` equals that agent's chart values;
     - derived figures state their formula (`calc`) and are recomputed by the same test;
     - targets are the sample targets in SMP-KPI-01 ("Targets"); they are illustrative, not approved.
   The CFO_SAMPLE contract (listCategories, listAgents, getSummary, answer, format) is unchanged.

   PERIOD: the sample figures are a snapshot as of the reporting date (the same convention as the
   workspace: "as of the To date"); `series` are the five months ending that month, oldest first.
   "Prior month" = the fourth value of the same series. There is no other period in the sample.

   RULES (prototype, deterministic — need Finance sign-off before production use):
     Alert severity  critical: off its sample target AND worse in every month of its five-month trend
                     high:     ≥ $0.5M at stake
                     medium:   < $0.5M at stake
                     info:     no direct value at stake
     Order           severity, then value at stake (largest first)
     Category status worst alert severity touching the category: critical/high → "Needs attention",
                     medium → "Watch", info only or none → "No major alerts"
     Action priority high: ≥ $0.5M at stake, otherwise medium
   ===================================================================================== */
var CFO_OVERVIEW = (function () {
  'use strict';
  function ws(c, a) { return 'cfo-workspace.html?category=' + c + (a ? '&agent=' + a : ''); }

  /* ---- Executive KPI snapshot (6) ---- */
  var KPIS = [
    { id: 'total-ar', label: 'Total AR', display: '$8.6M', value: 8.6, unit: 'usdM',
      sub: '72% within terms ($6.20M current)', compare: null,
      def: 'Open receivables across all aging buckets (current + overdue).',
      calc: null, src: ['receivables', 'ar-aging'], find: ['$6.20M of $8.6M', '72% of receivables are current'], report: 'SMP-AR-01 · Aging summary' },
    { id: 'overdue-ar', label: 'Overdue AR', display: '$2.4M', value: 2.4, unit: 'usdM',
      sub: '28% of total AR', calc: 'Overdue AR ÷ Total AR × 100 = $2.4M ÷ $8.6M = 27.9% ≈ 28%',
      compare: { prior: 2.28, delta: '+$0.12M (+5.3%)', dir: 'up', good: false, text: 'vs prior month ($2.28M)' },
      target: { display: '$2.0M', note: '$0.4M above sample target' },
      series: [1.92, 2.05, 2.14, 2.28, 2.40], seriesUnit: 'usdM',
      def: 'Receivables past their due date.',
      src: ['kpis', 'kpi-overdue'], find: ['$2.40M (from $1.92M)', '$2.4M vs $2.0M'], report: 'SMP-KPI-01 · Overdue trend' },
    { id: 'cash-received', label: 'Cash Received', display: '$5.2M', value: 5.2, unit: 'usdM',
      sub: 'This month · $4.7M applied (90%)', compare: null,
      def: 'Payments received in the sample month (cash application register). Shown as received, not as “collected against target”: the sample has no collection target or prior-month receipts.',
      calc: 'Applied share = $4.7M ÷ $5.2M = 90.4% ≈ 90%', src: ['cash-app', 'ca-monitor'], find: ['$4.7M of $5.2M'], report: 'SMP-CA-01 · Application summary' },
    { id: 'dso', label: 'DSO', display: '48 days', value: 48, unit: 'days',
      sub: '3 days better than prior year (51)',
      compare: { prior: 47, delta: '+1 day', dir: 'up', good: false, text: 'vs prior month (47 days)' },
      target: { display: '45 days', note: '3 days above sample target' },
      series: [44, 45, 46, 47, 48], seriesUnit: 'days',
      def: 'Days sales outstanding as reported in the sample KPI scorecard. The sample does not define the DSO method or its revenue inputs: confirm the organisation’s DSO definition before production use.',
      calc: null, src: ['receivables', 'ar-dso'], find: ['48 days (from 44)'], report: 'SMP-KPI-01 · DSO trend',
      also: [['efficiency', 'bm-dso', '48 vs 51 days'], ['kpis', 'kpi-scorecard', '48 vs 45 days']] },
    { id: 'unapplied', label: 'Unapplied Cash', display: '$500K', value: 0.5, unit: 'usdM',
      sub: '10% of receipts · $0.07M over 30 days', compare: null,
      def: 'Payments received but not yet applied to open invoices.',
      calc: '$500K ÷ $5.2M = 9.6% ≈ 10%', src: ['cash-app', 'ca-unapplied'], find: ['$500K (10% of receipts)', '$0.07M'], report: 'SMP-CA-01 · Unapplied aging' },
    { id: 'disputes', label: 'Dispute Exposure', display: '$1.25M', value: 1.25, unit: 'usdM',
      sub: '342 open · 38 high priority ($0.54M)', compare: null,
      def: 'Value of open customer disputes and deductions (cash blocked until they close).',
      calc: null, src: ['disputes', 'dsp-triage'], find: ['342 worth $1.25M'], report: 'SMP-DSP-01 · Dispute register',
      also: [['disputes', 'dsp-priority', '$0.54M (43% of disputed value)']] }
  ];

  /* ---- Executive Attention Center (rule-based on the sample data; not live monitoring) ---- */
  var ALERTS = [
    { id: 'overdue-dso', severity: 'critical', stake: 2.4,
      title: 'Overdue AR and DSO are above target and rising',
      text: 'Overdue AR rose in each of the last five months to $2.4M (sample target $2.0M) and DSO from 44 to 48 days (target 45).',
      impact: '$0.4M above target', scope: 'Portfolio · 24 high-priority accounts hold $1.12M', owner: 'Collectors', due: null,
      categories: ['collections', 'receivables', 'kpis'], href: ws('kpis', 'kpi-overdue'), action: 'Review overdue AR',
      src: ['kpis', 'kpi-overdue'], find: ['$2.4M vs $2.0M', '$1.12M'], report: 'SMP-KPI-01 · Targets' },
    { id: 'high-risk-credit', severity: 'high', stake: 1.3,
      title: '18 high-risk customers hold $1.3M of credit exposure',
      text: '5 of them also have an overdue credit review. Shipping to Band E without review increases potential losses.',
      impact: '$1.3M exposure', scope: '18 Band E customers', owner: 'Credit manager', due: null,
      categories: ['credit'], href: ws('credit', 'credit-risk'), action: 'Review high-risk customers',
      src: ['credit', 'credit-review'], find: ['5 of 18'], report: 'SMP-CR-02 · Band E list' },
    { id: 'priority-disputes', severity: 'high', stake: 0.54,
      title: '38 high-priority disputes block $0.54M',
      text: '9 of them have been open more than 20 days; long-open disputes are more likely to be written off.',
      impact: '$0.54M disputed', scope: 'High-priority dispute queue', owner: 'Dispute team', due: null,
      categories: ['disputes'], href: ws('disputes', 'dsp-priority'), action: 'Review dispute queue',
      src: ['disputes', 'dsp-priority'], find: ['$0.54M (43% of disputed value)', 'High-priority disputes open over 20 days'], report: 'SMP-DSP-01 · Priority view' },
    { id: 'unapplied-cash', severity: 'high', stake: 0.5,
      title: '$500K of received cash is unapplied',
      text: '$0.07M is older than 30 days and 146 items await reconciliation; customers may be chased for invoices they have paid.',
      impact: '$500K unapplied', scope: '146 reconciliation items', owner: null, due: null,
      categories: ['cash-app'], href: ws('cash-app', 'ca-unapplied'), action: 'Resolve unapplied cash',
      src: ['cash-app', 'ca-unapplied'], find: ['$500K (10% of receipts)', 'Over 30 days'], report: 'SMP-CA-01 · Unapplied aging' },
    { id: 'bad-debt', severity: 'medium', stake: 0.42,
      title: 'Bad-debt exposure is above tolerance',
      text: '$420K against a $350K sample target, driven by $0.30M more than 90 days past due. Loss rates are illustrative assumptions.',
      impact: '$70K above target', scope: '90+ day accounts', owner: null, due: 'This month',
      categories: ['kpis', 'receivables'], href: ws('kpis', 'kpi-baddebt'), action: 'Review bad-debt drivers',
      src: ['kpis', 'kpi-baddebt'], find: ['$420K vs $350K', 'Escalate 90+ day accounts this month'], report: 'SMP-KPI-01 · Exposure estimate' },
    { id: 'broken-promises', severity: 'medium', stake: 0.1,
      title: '$0.10M of promises to pay were broken',
      text: 'Escalating within 48 hours recovers more than waiting for the next dunning cycle; a further $0.31M is due in the next 7 days.',
      impact: '$0.10M broken', scope: 'Promise-to-pay log', owner: 'Collectors', due: 'Within 48 hours',
      categories: ['collections'], href: ws('collections', 'coll-ptp'), action: 'Review promises to pay',
      src: ['collections', 'coll-ptp'], find: ['Escalate broken promises within 48 hours', '$0.31M'], report: 'SMP-COL-02 · Broken promises' },
    { id: 'invoice-holds', severity: 'info', stake: 0,
      title: '158 invoices are on hold',
      text: '58 are held for pricing mismatches. Held invoices cannot be paid and feed overdue AR and DSO.',
      impact: null, scope: 'Invoice exception log', owner: null, due: null,
      categories: ['receivables'], href: ws('receivables', 'ar-exceptions'), action: 'Review invoice exceptions',
      src: ['receivables', 'ar-exceptions'], find: ['158', '58 (37% of holds)'], report: 'SMP-AR-03 · Exception log' },
    { id: 'cei-gap', severity: 'info', stake: 0,
      title: 'CEI is 4 points below target, but improving',
      text: 'Collection effectiveness is 86% against a 90% sample target, up from 82% five months ago.',
      impact: null, scope: 'Portfolio', owner: null, due: null,
      categories: ['collections', 'kpis'], href: ws('collections', 'coll-cei'), action: 'Review CEI trend',
      src: ['collections', 'coll-cei'], find: ['86% (from 82% five months ago)', 'Gap to the 90% target'], report: 'SMP-KPI-01 · CEI trend' }
  ];

  /* ---- Category cards: three metrics + one actionable count, all from the category's agents ---- */
  var CATEGORIES = [
    { id: 'credit', name: 'Credit', icon: 'shield-check', desc: 'Credit risk, limits and exposure',
      metrics: [['Credit exposure', '$12.8M', 'credit-exposure', '$3.2M of $16.0M limits'], ['Limit utilization', '80%', 'credit-utilization', 'Portfolio utilization is 80%'], ['High-risk customers', '18', 'credit-risk', '18 of 854 (2.1%)']],
      count: ['12', 'overdue credit reviews', 'credit-review', 'Overdue reviews'] },
    { id: 'collections', name: 'Collections', icon: 'hand-coins', desc: 'Collection activity and follow-up',
      metrics: [['Overdue AR', '$2.4M', 'coll-priority', '$2.4M / $8.6M'], ['CEI', '86%', 'coll-cei', '86% (from 82% five months ago)'], ['Promised value kept', '54%', 'coll-ptp', '$0.62M (54%)']],
      count: ['24', 'high-priority accounts', 'coll-priority', '24 high-priority accounts'] },
    { id: 'receivables', name: 'Receivables', icon: 'receipt-text', desc: 'Open receivables and aging',
      metrics: [['Total AR', '$8.6M', 'ar-aging', '$6.20M of $8.6M'], ['DSO', '48 days', 'ar-dso', '48 days (from 44)'], ['Over 60 days', '$0.73M', 'ar-aging', '$0.73M is more than 60 days past due']],
      count: ['158', 'invoices on hold', 'ar-exceptions', '158 invoices are on hold'] },
    { id: 'cash-app', name: 'Cash App', icon: 'banknote', desc: 'Cash application and payment matching',
      metrics: [['Auto-match rate', '91%', 'ca-monitor', 'Auto-match rate is 91%'], ['Unapplied cash', '$500K', 'ca-unapplied', 'Unapplied cash totals $500K'], ['Manual matches', '318', 'ca-matching', '318 of 3,530']],
      count: ['146', 'items to reconcile', 'ca-recon', '146 items await reconciliation'] },
    { id: 'disputes', name: 'Disputes', icon: 'message-square-warning', desc: 'Dispute and deduction resolution',
      metrics: [['Open value', '$1.25M', 'dsp-triage', '342 worth $1.25M'], ['Open disputes', '342', 'dsp-triage', '342 disputes are open'], ['Avg. resolution', '12 days', 'dsp-resolution', 'Disputes take 12 days to resolve on average']],
      count: ['38', 'high-priority disputes', 'dsp-priority', '38 high-priority disputes hold $0.54M'] },
    { id: 'portal-usage', name: 'Portal Usage (EIPP)', icon: 'monitor-smartphone', desc: 'Customer portal adoption and usage',
      metrics: [['Active customers', '1,840', 'eipp-engagement', 'Active customers reached 1,840'], ['Adoption', '75%', 'eipp-adoption', 'Portal adoption is 75%'], ['Online payments', '$3.4M', 'eipp-payments', '$3.4M this month']],
      count: ['126', 'pending customer actions', 'eipp-actions', '126 customer actions are pending'] },
    { id: 'efficiency', name: 'Efficiency & Benchmarking', icon: 'gauge', desc: 'Process efficiency against benchmarks',
      metrics: [['Process efficiency', '82%', 'bm-process', 'Overall process efficiency is 82%'], ['DSO vs peer median', '+6 days', 'bm-dso', 'DSO is 6 days above the peer median'], ['Collector time on disputes', '19%', 'bm-effort', '19% of time goes to dispute follow-up']],
      count: null, note: 'Peer benchmarks are illustrative' },
    { id: 'kpis', name: 'KPIs', icon: 'target', desc: 'Key performance indicators across O2C',
      metrics: [['Bad-debt exposure', '$420K', 'kpi-baddebt', 'Estimated bad-debt exposure is $420K'], ['Auto-match (target 93%)', '91%', 'kpi-cashapp', '91% (from 87%)'], ['Overdue AR over target', '$0.4M', 'kpi-scorecard', 'Excess overdue AR']],
      count: ['5 of 5', 'KPIs below sample target', 'kpi-scorecard', 'KPI attainment vs target'] }
  ];

  /* ---- Management Action Tracker: sample recommendations, unchanged wording ---- */
  var ACTIONS = [
    { id: 'p1-accounts', priority: 'high', stake: 1.12, action: 'Contact all 24 Priority 1 accounts this week', category: 'collections', agent: 'coll-priority',
      impact: '$1.12M overdue', owner: 'Collectors', due: 'This week', find: 'Contact all 24 Priority 1 accounts this week' },
    { id: 'band-e-limits', priority: 'high', stake: 1.3, action: 'Review limits for the 18 high-risk customers', category: 'credit', agent: 'credit-exposure',
      impact: '$1.3M exposure', owner: 'Credit manager', due: null, find: 'Review limits for the 18 high-risk customers' },
    { id: 'dispute-queue', priority: 'high', stake: 0.54, action: 'Hold a daily review of the high-priority queue', category: 'disputes', agent: 'dsp-priority',
      impact: '$0.54M disputed', owner: 'Dispute team', due: 'Daily', find: 'Hold a daily review of the high-priority queue' },
    { id: 'baddebt-90', priority: 'medium', stake: 0.3, action: 'Escalate 90+ day accounts this month', category: 'kpis', agent: 'kpi-baddebt',
      impact: '$0.30M past due 90+ days', owner: null, due: 'This month', find: 'Escalate 90+ day accounts this month' },
    { id: 'unapplied-15', priority: 'medium', stake: 0.16, action: 'Clear unapplied cash older than 15 days first', category: 'cash-app', agent: 'ca-monitor',
      impact: '$0.16M unapplied', owner: null, due: null, find: 'Clear unapplied cash older than 15 days first' },
    { id: 'broken-ptp', priority: 'medium', stake: 0.1, action: 'Escalate broken promises within 48 hours', category: 'collections', agent: 'coll-ptp',
      impact: '$0.10M broken promises', owner: 'Collectors', due: 'Within 48 hours', find: 'Escalate broken promises within 48 hours' }
  ];

  /* ---- GIA Executive Briefing: fixed rules over the sample facts above (no model is called) ---- */
  var BRIEFING = {
    summary: 'Collection effectiveness and cash automation improved over the last five months, but overdue AR ($2.4M, 28% of $8.6M) and DSO (48 days) rose in every month and remain above their sample targets. Credit risk is concentrated: 18 high-risk customers hold $1.3M of exposure.',
    positives: [
      { kind: 'Trend', text: 'CEI improved from 82% to 86%', c: 'collections', a: 'coll-cei', find: '86% (from 82% five months ago)' },
      { kind: 'Trend', text: 'Auto-match rate rose from 87% to 91%', c: 'kpis', a: 'kpi-cashapp', find: '91% (from 87%)' },
      { kind: 'Trend', text: 'Disputes resolved per month rose from 151 to 184 (+22%)', c: 'disputes', a: 'dsp-trend', find: '151 → 184 (+22%)' }
    ],
    risks: [
      { kind: 'Fact', text: '$0.73M of AR is more than 60 days past due', c: 'receivables', a: 'ar-aging', find: '$0.73M is more than 60 days past due' },
      { kind: 'Fact', text: 'The top five customers hold 40% of AR ($3.46M)', c: 'receivables', a: 'ar-concentration', find: '$3.46M of $8.6M' },
      { kind: 'Fact', text: '$4.2M of open orders add credit exposure before billing', c: 'credit', a: 'credit-exposure', find: 'Open orders not yet invoiced' }
    ],
    actions: [
      { kind: 'Recommendation', text: 'Clear invoice exceptions that delay payment (158 on hold)', c: 'receivables', a: 'ar-dso', find: 'Clear invoice exceptions that delay payment' },
      { kind: 'Recommendation', text: 'Target a 2-day DSO reduction this quarter (≈ $358K released)', c: 'receivables', a: 'ar-dso', find: 'Target a 2-day DSO reduction this quarter' },
      { kind: 'Recommendation', text: 'Move Priority 3–4 accounts to automated reminders ($0.57M)', c: 'collections', a: 'coll-priority', find: 'Move Priority 3–4 accounts to automated reminders' }
    ],
    assumptions: 'Targets, peer benchmarks and bad-debt loss rates are illustrative sample values. DSO and CEI are as reported in the sample KPI scorecard; their calculation methods are not defined in the sample data.'
  };

  var SEV = { critical: 0, high: 1, medium: 2, info: 3 };
  function sortedAlerts(list) {
    return (list || ALERTS).slice().sort(function (a, b) { return SEV[a.severity] - SEV[b.severity] || b.stake - a.stake; });
  }
  function categoryStatus(catId, list) {
    var worst = 4;
    (list || ALERTS).forEach(function (al) { if (al.categories.indexOf(catId) >= 0) worst = Math.min(worst, SEV[al.severity]); });
    var n = (list || ALERTS).filter(function (al) { return al.categories.indexOf(catId) >= 0 && al.severity !== 'info'; }).length;
    return { level: worst <= 1 ? 'attention' : worst === 2 ? 'watch' : 'ok', label: worst <= 1 ? 'Needs attention' : worst === 2 ? 'Watch' : 'No major alerts', alerts: n };
  }
  return { kpis: KPIS, alerts: ALERTS, categories: CATEGORIES, actions: ACTIONS, briefing: BRIEFING,
    sortedAlerts: sortedAlerts, categoryStatus: categoryStatus, workspaceUrl: ws };
})();
