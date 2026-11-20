/* =====================================================================================
   SAMPLE DATA LAYER (UI/UX prototype) — no backend, no database, no LLM, no network.
   -------------------------------------------------------------------------------------
   Everything in this block is ILLUSTRATIVE SAMPLE DATA. It is not Emagia or customer
   financial data. Values are deterministic and internally consistent: a metric that
   appears in several agents (e.g. Overdue AR $2.4M, DSO 48 days) has the same value
   everywhere. The UI (below) only talks to the three functions in the public contract,
   so a real service can replace this block without changing the UI.

   Shared file (components/cfo-sample-data.js), loaded by cfo-workspace.html and cfo-overview.html before their scripts.

   PUBLIC CONTRACT (window.CFO_SAMPLE) — replace each with an API call returning the same shape:
     listCategories()        -> [{id, name, agentCount}]   (used by the header search; future: GET /cfo/categories)
     listAgents(categoryId)  -> [{id, name, description, prompt, chips:[question]}]
                                future: GET /cfo/categories/{categoryId}/agents
     getSummary(request)     -> Promise<SummaryResult>
                                request: {categoryId, agentId, from, to, provider, model, prompt}
                                SummaryResult: {origin:'sample', categoryId, agentId, from, to,
                                  sections:[{key:'insights'|'risks'|'recommendations',
                                    items:[{title, metric, value, impact,
                                            source:{id, report, record}}]}],
                                  chart:{title, unit:'usdM'|'usdK'|'pct'|'days'|'count',
                                         labels:[string], values:[number]}}
                                future: POST /cfo/summaries
     answer(request)         -> Promise<{origin:'sample', text, context}>
                                request: {categoryId, agentId, question, context, periodEnd}
                                context is opaque: pass back the previous reply's context so
                                follow-ups ("why?", "tell me more") continue the same topic.
                                future: POST /cfo/summaries/{id}/messages (server-side LLM gateway)

   HOW CHAT IS RESOLVED (answer): 1) a suggested-question chip of the agent, 2) the agent's own
   keyword answers, 3) shared topic intents (aging, credit, disputes, …), 4) a follow-up on the
   previous topic one level deeper, 5) a help message listing what can be asked. No model is called.
   ===================================================================================== */
var CFO_SAMPLE=(function(){
  'use strict';
  var LATENCY_MS=700,CHAT_LATENCY_MS=600; // short simulated latency so loading states are visible

  /* ---- Sample sources (mock reports / record sets cited by every insight) ---- */
  var SRC={
    'SMP-CR-01':'Sample Credit Exposure Report','SMP-CR-02':'Sample Risk Scoring Run','SMP-CR-03':'Sample Credit Review Calendar',
    'SMP-AR-01':'Sample AR Aging Report','SMP-AR-02':'Sample Top Debtors Ledger','SMP-AR-03':'Sample Invoice Exception Log',
    'SMP-COL-01':'Sample Collections Worklist','SMP-COL-02':'Sample Promise-to-Pay Log','SMP-COL-03':'Sample Collector Activity Report',
    'SMP-CA-01':'Sample Cash Application Register','SMP-CA-02':'Sample Reconciliation Queue',
    'SMP-DSP-01':'Sample Dispute Register','SMP-EIPP-01':'Sample Portal Activity Log',
    'SMP-BM-01':'Sample Benchmark Pack (illustrative peers)','SMP-KPI-01':'Sample KPI Scorecard'
  };
  function I(title,metric,value,impact,src,record){return{title:title,metric:metric,value:value,impact:impact,source:{id:src,report:SRC[src],record:record||''}}}

  /* ---- Category headlines: the shared figures every agent in the category agrees with ---- */
  var HEAD={
    credit:'Total credit exposure is $12.8M against $16.0M of approved limits (80% utilization), leaving $3.2M of available credit. Overdue exposure is $2.1M and 18 customers are rated high risk.',
    collections:'Outstanding AR is $8.6M, of which $2.4M (28%) is overdue. Collection effectiveness (CEI) is 86%, promises to pay cover $1.15M and 24 accounts are flagged high priority.',
    receivables:'Open invoices total $8.6M: $6.20M current, $1.05M 1–30 days, $0.62M 31–60 days, $0.43M 61–90 days and $0.30M over 90 days past due — $2.4M overdue in total.',
    'cash-app':'Payments received total $5.2M: $4.7M is applied (90% of value) and $500K is unapplied. The auto-match rate is 91% (3,212 of 3,530 payments) and 146 items await reconciliation.',
    disputes:'There are 342 open disputes worth $1.25M, 38 of them high priority. Average resolution time is 12 days and 184 disputes were resolved this month.',
    'portal-usage':'2,450 customers are registered on the portal and 1,840 are active (75% adoption). Online payments total $3.4M and 126 customer actions are pending.',
    efficiency:'Average DSO is 48 days, collection productivity 86%, cash application automation 91%, average dispute resolution 12 days and overall process efficiency 82%.',
    kpis:'DSO is 48 days, CEI 86%, overdue AR $2.4M, the cash application (auto-match) rate 91% and estimated bad-debt exposure $420K.'
  };

  /* ---- Agent catalog + per-agent datasets (summary items, chart, suggested questions) ----
     chart.months:true → labels are the five calendar months ending with the selected "To" date. */
  var CATALOG={
    credit:[
      {id:'credit-exposure',name:'Credit Exposure Monitor',description:'Tracks total exposure against approved limits by risk tier.',
       prompt:'Summarize total credit exposure, available credit and overdue exposure by risk tier.',
       chart:{title:'Exposure by risk tier',unit:'usdM',labels:['Low risk','Moderate','Elevated','High risk'],values:[5.9,3.6,2.0,1.3]},
       insights:[I('Exposure is concentrated in the low and moderate tiers','Low + moderate exposure','$9.5M of $12.8M (74%)','Most exposure sits with customers paying within terms, which limits near-term loss risk','SMP-CR-01','Tier summary'),
         I('Credit headroom is thin','Available credit','$3.2M of $16.0M limits (80% utilized)','Peak-season orders could trigger credit holds','SMP-CR-01','Limit utilization'),
         I('Overdue exposure is material','Overdue exposure','$2.1M (16% of exposure)','One in six exposure dollars is past due and ties up working capital','SMP-CR-01','Overdue by tier')],
       risks:[I('The high-risk tier carries significant exposure','High-risk exposure','$1.3M across 18 customers','A default in this tier would add directly to bad-debt exposure (currently $420K)','SMP-CR-02','Band E list'),
         I('Open orders add exposure before billing','Open orders not yet invoiced','$4.2M','Exposure rises before invoices are issued, so limits can be exceeded at shipment','SMP-CR-01','Order book')],
       recommendations:[I('Review limits for the 18 high-risk customers','Accounts to review','18','Reduce or secure limits before new orders ship; each change needs credit-manager approval','SMP-CR-02','Band E list'),
         I('Restore headroom by collecting overdue exposure','Recoverable headroom','Up to $2.1M','Every overdue dollar collected restores available credit','SMP-COL-01','Priority worklist')],
       chips:['Which risk tier carries the most exposure?','How much credit headroom is left?','Who are the high-risk customers?']},
      {id:'credit-risk',name:'Credit Risk Scoring',description:'Scores customers into risk bands and flags likely downgrades.',
       prompt:'Summarize the distribution of customers by risk band and highlight likely downgrades.',
       chart:{title:'Customers by risk band',unit:'count',labels:['Band A','Band B','Band C','Band D','Band E (high)'],values:[412,286,97,41,18]},
       insights:[I('18 customers are rated high risk','Band E customers','18 of 854 (2.1%)','Few in number, but they hold $1.3M of exposure','SMP-CR-02','Band distribution'),
         I('Most customers score in the top two bands','Bands A–B','698 of 854 (82%)','Risk is concentrated in a small group rather than spread across the portfolio','SMP-CR-02','Band distribution'),
         I('41 customers sit one band above high risk','Band D customers','41','These are the most likely next downgrades if payment behaviour slips','SMP-CR-02','Watchlist candidates')],
       risks:[I('Slower payments are pushing scores down','DSO','48 days, up from 44 in five months','Payment timeliness is the main input to score downgrades','SMP-KPI-01','DSO trend'),
         I('High-risk customers still have open orders','High-risk exposure','$1.3M','Shipping to Band E without review increases potential losses','SMP-CR-01','Band E exposure')],
       recommendations:[I('Move Band E accounts to prepayment or secured terms','Accounts','18','Protects against losses; each change requires credit-manager approval','SMP-CR-02','Band E list'),
         I('Put Band D customers on a 30-day watchlist','Accounts','41','Earlier review catches deterioration before limits are breached','SMP-CR-02','Watchlist candidates')],
       chips:['Why are 18 customers high risk?','Which customers are close to a downgrade?','What should we do with Band E accounts?']},
      {id:'credit-utilization',name:'Credit Limit Utilization',description:'Shows how much of each segment’s approved limits is in use.',
       prompt:'Summarize credit limit utilization by customer segment and identify segments at risk of order holds.',
       chart:{title:'Limit utilization by segment',unit:'pct',labels:['Enterprise','Distribution','Mid-market','SMB','Public sector'],values:[86,83,79,71,64]},
       insights:[I('Portfolio utilization is 80%','Exposure / approved limits','$12.8M / $16.0M','Above a typical 70–75% comfort range, leaving limited room for growth','SMP-CR-01','Limit utilization'),
         I('Enterprise is the most stretched segment','Enterprise utilization','86%','Large enterprise orders are the most likely to hit credit holds','SMP-CR-01','Segment view'),
         I('Public sector has the most headroom','Public sector utilization','64%','Low risk of order holds; unused limits could be rebalanced','SMP-CR-01','Segment view')],
       risks:[I('Order holds in peak periods','Available credit','$3.2M','Holds delay shipments and revenue and frustrate customers','SMP-CR-01','Limit utilization'),
         I('Over-limit shipments','Overdue exposure','$2.1M','Customers near their limit with overdue balances are the likeliest to breach it','SMP-CR-01','Overdue by tier')],
       recommendations:[I('Pre-approve temporary increases for strong Enterprise payers','Enterprise utilization','86%','Avoids order holds without raising risk; each increase needs approval','SMP-CR-01','Segment view'),
         I('Rebalance unused Public sector limits','Public sector utilization','64%','Frees approved capacity without increasing total limits','SMP-CR-01','Segment view')],
       chips:['Which segments are close to their limits?','How much headroom does Enterprise have?','How can we free up credit headroom?']},
      {id:'credit-review',name:'Credit Review Scheduler',description:'Tracks periodic credit reviews that are overdue, due or on hold.',
       prompt:'Summarize credit reviews by status and highlight overdue reviews on high-risk accounts.',
       chart:{title:'Credit reviews by status',unit:'count',labels:['Overdue','Due ≤30 days','Due 31–60 days','Due 61–90 days','On hold'],values:[12,26,31,24,9]},
       insights:[I('12 credit reviews are overdue','Overdue reviews','12','These limits rely on financials older than policy allows','SMP-CR-03','Review calendar'),
         I('26 reviews fall due within 30 days','Due ≤30 days','26','Together with overdue reviews, 38 need attention this month','SMP-CR-03','Review calendar'),
         I('9 reviews are on hold','On hold for missing financials','9','These reviews cannot finish until customers send statements','SMP-CR-03','On-hold list')],
       risks:[I('Overdue reviews overlap the high-risk list','High-risk customers with an overdue review','5 of 18','Stale reviews on risky accounts compound potential losses','SMP-CR-02','Band E list'),
         I('Review workload peaks next month','Reviews due in the next 60 days','57','Analyst capacity may not cover the peak','SMP-CR-03','Review calendar')],
       recommendations:[I('Clear the 5 high-risk overdue reviews first','Reviews','5','Addresses the largest exposure risk with the least effort','SMP-CR-03','Overdue list'),
         I('Request missing financials through the customer portal','On-hold reviews','9','Portal requests are tracked and reduce email follow-up','SMP-EIPP-01','Pending customer actions')],
       chips:['Which reviews are overdue?','How many reviews are due this month?','What is blocking the on-hold reviews?']}
    ],
    collections:[
      {id:'coll-priority',name:'Collections Prioritization',description:'Ranks overdue accounts by value, age and risk for collector worklists.',
       prompt:'Summarize overdue AR by priority tier and recommend which accounts collectors should contact first.',
       chart:{title:'Overdue AR by priority tier',unit:'usdM',labels:['Priority 1','Priority 2','Priority 3','Priority 4'],values:[1.12,0.71,0.38,0.19]},
       insights:[I('24 high-priority accounts hold nearly half of overdue AR','Priority 1 overdue','$1.12M of $2.4M (47%)','Focusing collectors on 24 accounts addresses almost half the overdue balance','SMP-COL-01','Priority worklist'),
         I('Overdue AR is 28% of outstanding','Overdue / total AR','$2.4M / $8.6M','Above a typical 20–25% range: cash is arriving later than terms','SMP-AR-01','Aging summary'),
         I('Priority 3–4 accounts are numerous but small','Priority 3–4 overdue','$0.57M','Better suited to automated reminders than collector calls','SMP-COL-01','Priority worklist')],
       risks:[I('Older balances are building up','AR more than 60 days past due','$0.73M','Older balances are harder to recover and raise bad-debt exposure','SMP-AR-01','Aging summary'),
         I('Collector coverage is uneven','Lowest team worklist completion','79% (West)','Accounts in under-covered portfolios slip further behind','SMP-COL-03','Team productivity')],
       recommendations:[I('Contact all 24 Priority 1 accounts this week','Overdue at stake','$1.12M','Secure dated promises to pay and log them','SMP-COL-01','Priority worklist'),
         I('Move Priority 3–4 accounts to automated reminders','Overdue in scope','$0.57M','Frees collector time for high-value accounts','SMP-COL-01','Priority worklist')],
       chips:['Why is overdue AR increasing?','Which accounts should we call first?','How much overdue AR can automation handle?']},
      {id:'coll-ptp',name:'Promise-to-Pay Tracker',description:'Follows customer payment commitments from promise to cash.',
       prompt:'Summarize promises to pay by status, cash due this week and broken promises.',
       chart:{title:'Promises to pay by status',unit:'usdM',labels:['Kept','Due in 7 days','Due in 8–30 days','Broken'],values:[0.62,0.31,0.12,0.10]},
       insights:[I('Promises to pay cover $1.15M','Promised amount','$1.15M (48% of overdue AR)','Nearly half the overdue balance has a customer commitment','SMP-COL-02','Promise log'),
         I('Most promised value has been kept','Kept promises','$0.62M (54%)','Customers are largely honouring their commitments','SMP-COL-02','Promise log'),
         I('$0.31M is due within 7 days','Due in 7 days','$0.31M','Near-term cash that should be confirmed with customers now','SMP-COL-02','Upcoming promises')],
       risks:[I('Some promises have been broken','Broken promises','$0.10M','Broken promises often lead to disputes or escalation','SMP-COL-02','Broken promises'),
         I('Half of overdue AR has no commitment','Overdue AR without a promise','$1.25M','These balances have no expected payment date','SMP-COL-01','Priority worklist')],
       recommendations:[I('Escalate broken promises within 48 hours','Broken promises','$0.10M','Quick follow-up recovers more than waiting for the next dunning cycle','SMP-COL-02','Broken promises'),
         I('Seek dated promises on uncommitted balances','Overdue AR without a promise','$1.25M','Start with Priority 1 accounts, where the value is highest','SMP-COL-01','Priority worklist')],
       chips:['How reliable are customer promises?','What cash is due this week?','What should we do about broken promises?']},
      {id:'coll-productivity',name:'Collector Productivity',description:'Compares worklist completion and workload across collection teams.',
       prompt:'Summarize collector worklist completion by team and where capacity is constrained.',
       chart:{title:'Worklist completion by team',unit:'pct',labels:['North','Strategic','East','South','West'],values:[91,89,88,84,79]},
       insights:[I('Collection productivity averages 86%','Worklist completion','86% across five teams','Most planned contacts are being completed','SMP-COL-03','Team productivity'),
         I('West trails the other teams','West completion','79%','Seven points below the average; its accounts are contacted less often','SMP-COL-03','Team productivity'),
         I('North leads','North completion','91%','Shows what is achievable with the current process','SMP-COL-03','Team productivity')],
       risks:[I('West’s overdue balances may grow','West completion','79%','Missed contacts delay promises to pay and cash','SMP-COL-03','Team productivity'),
         I('Dispute follow-up takes collector time','Share of collector hours on disputes','19%','Time spent on disputes is time not spent collecting','SMP-BM-01','Effort analysis')],
       recommendations:[I('Rebalance 10–15% of West’s accounts to North','West completion','79%','Evens out workload without adding headcount','SMP-COL-03','Team productivity'),
         I('Route disputes directly to the dispute team','Collector hours on disputes','19%','Gives collectors back time for high-value accounts','SMP-BM-01','Effort analysis')],
       chips:['Which team needs support?','Why is West below the others?','How can we raise productivity?']},
      {id:'coll-cei',name:'Collection Effectiveness',description:'Tracks the collection effectiveness index (CEI) against target.',
       prompt:'Summarize the CEI trend over the last five months and the gap to target.',
       chart:{title:'CEI trend',unit:'pct',months:true,values:[82,83,85,84,86]},
       insights:[I('CEI improved to 86%','CEI','86% (from 82% five months ago)','Collections are converting more of the collectible balance into cash','SMP-KPI-01','CEI trend'),
         I('CEI dipped once during the period','CEI in month four','84%','The dip recovered the following month','SMP-KPI-01','CEI trend'),
         I('CEI is still below target','Gap to the 90% target','4 points','More of the collectible balance needs to be converted each month','SMP-KPI-01','Targets')],
       risks:[I('Rising DSO may cap further CEI gains','DSO','48 days, up from 44','Slower payment offsets collection effort','SMP-KPI-01','DSO trend'),
         I('Older balances resist collection','AR more than 60 days past due','$0.73M','Older balances are the hardest to convert','SMP-AR-01','Aging summary')],
       recommendations:[I('Target older balances to lift CEI','AR more than 60 days past due','$0.73M','Recovering older balances has the largest effect on CEI','SMP-AR-01','Aging summary'),
         I('Review CEI weekly against the 90% target','Gap to target','4 points','Earlier visibility allows mid-month corrections','SMP-KPI-01','Targets')],
       chips:['Is collection effectiveness improving?','What is holding CEI below target?','How do we reach 90% CEI?']}
    ],
    receivables:[
      {id:'ar-aging',name:'AR Aging Analyst',description:'Breaks open receivables into aging buckets and flags roll-forward risk.',
       prompt:'Summarize open receivables by aging bucket and identify balances at risk of ageing further.',
       chart:{title:'AR aging buckets',unit:'usdM',labels:['Current','1–30 days','31–60 days','61–90 days','90+ days'],values:[6.20,1.05,0.62,0.43,0.30]},
       insights:[I('72% of receivables are current','Current (not yet due)','$6.20M of $8.6M','Most of the ledger is within payment terms','SMP-AR-01','Aging summary'),
         I('Overdue AR is $2.4M, mostly early-stage','1–30 days past due','$1.05M (44% of overdue)','Early-stage balances respond well to prompt follow-up','SMP-AR-01','Aging summary'),
         I('$0.73M is more than 60 days past due','61–90 + 90+ days','$0.43M + $0.30M','These balances drive bad-debt exposure','SMP-AR-01','Aging summary')],
       risks:[I('90+ day balances are fully at risk','90+ days past due','$0.30M','Included at 100% in the $420K bad-debt exposure estimate','SMP-KPI-01','Bad-debt exposure'),
         I('The 31–60 day bucket could roll forward','31–60 days past due','$0.62M','If unpaid, it moves into buckets with higher loss rates next month','SMP-AR-01','Aging summary')],
       recommendations:[I('Work the 31–60 day bucket before it ages','31–60 days past due','$0.62M','Prevents roll-forward into higher-risk buckets','SMP-AR-01','Aging summary'),
         I('Review 90+ day accounts for escalation or write-off','90+ days past due','$0.30M','A decision is needed on each account; write-offs require approval','SMP-AR-01','90+ list')],
       chips:['Why is overdue AR increasing?','Show the aging breakdown','Which bucket should we prioritize?']},
      {id:'ar-concentration',name:'Top Debtor Concentration',description:'Measures how much of AR sits with the largest customers.',
       prompt:'Summarize AR concentration among the top five customers and any overdue balances among them.',
       chart:{title:'Top 5 customers by open AR',unit:'usdM',labels:['Alder Industrial','Brightline Retail','Cobalt Health','Delmar Logistics','Evergreen Foods'],values:[0.94,0.81,0.66,0.58,0.47]},
       insights:[I('The top five customers hold 40% of AR','Top 5 open AR','$3.46M of $8.6M','Payment delays at a few customers would move overall DSO','SMP-AR-02','Top debtors'),
         I('Alder Industrial is the largest debtor','Open AR','$0.94M (11% of AR)','The single largest concentration in the ledger','SMP-AR-02','Top debtors'),
         I('Two of the top five have overdue balances','Brightline Retail / Delmar Logistics overdue','$0.22M / $0.17M','$0.39M of overdue AR sits with key accounts','SMP-AR-02','Top debtors')],
       risks:[I('Single-customer concentration','Largest customer share','11% of AR','A slowdown at Alder Industrial would be felt across cash flow','SMP-AR-02','Top debtors'),
         I('A key account has an open pricing dispute','Brightline Retail disputed amount','$0.08M','Unresolved disputes delay payment of the undisputed balance too','SMP-DSP-01','Dispute register')],
       recommendations:[I('Set a concentration alert at 10% of AR per customer','Customers above 10%','1 (Alder Industrial)','Gives early warning before concentration grows','SMP-AR-02','Top debtors'),
         I('Schedule account reviews with Brightline and Delmar','Overdue at stake','$0.39M','Resolves overdue balances and the open dispute together','SMP-AR-02','Top debtors')],
       chips:['Who are our largest debtors?','Which top customers are overdue?','How risky is our AR concentration?']},
      {id:'ar-dso',name:'DSO Trend Analyst',description:'Explains days sales outstanding (DSO) movement and its cash impact.',
       prompt:'Summarize the DSO trend over the last five months and the cash tied up by the change.',
       chart:{title:'DSO trend (days)',unit:'days',months:true,values:[44,45,46,47,48]},
       insights:[I('DSO rose 4 days in five months','DSO','48 days (from 44)','Customers are taking longer to pay','SMP-KPI-01','DSO trend'),
         I('Each DSO day ties up about $179K','AR per DSO day','$8.6M ÷ 48 ≈ $179K','Small DSO changes have a large cash effect','SMP-KPI-01','Calculated from AR and DSO'),
         I('DSO is above the peer median','Illustrative peer median','42 days','A 6-day gap to comparable companies','SMP-BM-01','Peer benchmark')],
       risks:[I('Working capital pressure','Cash tied up by the 4-day rise','≈ $0.72M','Less cash available for operations','SMP-KPI-01','Calculated from AR and DSO'),
         I('The trend may continue','31–60 days past due','$0.62M','Ageing balances would push DSO higher','SMP-AR-01','Aging summary')],
       recommendations:[I('Target a 2-day DSO reduction this quarter','Cash released','≈ $358K','A realistic first step toward the peer median','SMP-KPI-01','Calculated from AR and DSO'),
         I('Clear invoice exceptions that delay payment','Invoices on hold','158','Held invoices are not paid until fixed','SMP-AR-03','Exception log')],
       chips:['Why is DSO rising?','How much cash does DSO tie up?','How do we bring DSO down?']},
      {id:'ar-exceptions',name:'Invoice Exceptions Monitor',description:'Tracks invoices held for pricing, PO, delivery or tax issues.',
       prompt:'Summarize invoices on hold by exception reason and their effect on payment timing.',
       chart:{title:'Invoices on hold by reason',unit:'count',labels:['Pricing mismatch','Missing PO','Delivery unconfirmed','Tax / VAT issue','Duplicate'],values:[58,41,33,17,9]},
       insights:[I('158 invoices are on hold','Invoices on hold','158','Held invoices cannot be paid until the exception is cleared','SMP-AR-03','Exception log'),
         I('Pricing mismatches are the top reason','Pricing mismatch','58 (37% of holds)','Points to price master data issues','SMP-AR-03','Exception log'),
         I('Missing purchase orders block 41 invoices','Missing PO','41 (26%)','A process gap at order entry','SMP-AR-03','Exception log')],
       risks:[I('Held invoices keep ageing','Invoices on hold','158','They feed the overdue buckets and DSO','SMP-AR-03','Exception log'),
         I('Pricing holds turn into disputes','Open pricing disputes','118','Unresolved pricing holds escalate into the dispute queue','SMP-DSP-01','Dispute register')],
       recommendations:[I('Correct price master data for the most affected customers','Pricing mismatch','58','Removes the largest single exception source','SMP-AR-03','Exception log'),
         I('Require PO numbers at order entry','Missing PO','41','Prevents the exception instead of fixing it later','SMP-AR-03','Exception log')],
       chips:['Why are invoices on hold?','Which exception should we fix first?','How do exceptions affect DSO?']}
    ],
    'cash-app':[
      {id:'ca-monitor',name:'Cash Application Monitor',description:'Tracks how received payments are applied to open invoices.',
       prompt:'Summarize payments received, applied and unapplied, and the auto-match rate.',
       chart:{title:'Payments by application status',unit:'usdM',labels:['Auto-applied','Manually applied','Unapplied'],values:[4.21,0.49,0.50]},
       insights:[I('90% of received value is applied','Applied / received','$4.7M of $5.2M','Most cash is posted to invoices promptly','SMP-CA-01','Application summary'),
         I('Auto-match rate is 91%','Payments auto-matched','3,212 of 3,530','Automation handles the bulk of volume','SMP-CA-01','Application summary'),
         I('Manual application handles $0.49M','Manually applied','$0.49M','Staff time goes to the most complex payments','SMP-CA-01','Application summary')],
       risks:[I('Unapplied cash overstates customer balances','Unapplied cash','$500K','Customers may receive dunning for invoices they have already paid','SMP-CA-01','Unapplied list'),
         I('The reconciliation backlog delays posting','Pending reconciliation items','146','Delays distort AR and DSO reporting','SMP-CA-02','Reconciliation queue')],
       recommendations:[I('Clear unapplied cash older than 15 days first','Unapplied over 15 days','$0.16M','Older items are the hardest to match later','SMP-CA-01','Unapplied aging'),
         I('Add remittance rules for wire payments','Wire match rate','82%','Wires have the lowest automated match rate after checks','SMP-CA-01','Channel match rates')],
       chips:['How much cash is unapplied?','What is the auto-match rate?','How can we reduce manual application?']},
      {id:'ca-unapplied',name:'Unapplied Cash Resolver',description:'Ages unapplied payments and suggests how to resolve them.',
       prompt:'Summarize unapplied cash by age and recommend resolution priorities.',
       chart:{title:'Unapplied cash by age',unit:'usdM',labels:['0–7 days','8–15 days','16–30 days','Over 30 days'],values:[0.21,0.13,0.09,0.07]},
       insights:[I('Unapplied cash totals $500K','Unapplied cash','$500K (10% of receipts)','Paid invoices still show as open','SMP-CA-01','Unapplied aging'),
         I('Most unapplied cash is recent','0–7 days','$0.21M (42%)','Recent items are usually resolved by routine matching','SMP-CA-01','Unapplied aging'),
         I('$0.07M is older than 30 days','Over 30 days','$0.07M','These items need customer contact to identify','SMP-CA-01','Unapplied aging')],
       risks:[I('Customers may be chased for paid invoices','Unapplied cash','$500K','Erroneous dunning damages customer relationships','SMP-CA-01','Unapplied list'),
         I('Payments without remittance are hard to match','Items with no remittance','38','Without remittance details, matching needs manual research','SMP-CA-02','Reconciliation queue')],
       recommendations:[I('Contact payers for items older than 30 days','Over 30 days','$0.07M','Customer confirmation is the fastest way to match these','SMP-CA-01','Unapplied aging'),
         I('Ask customers to upload remittances in the portal','Items with no remittance','38','Portal remittances can be matched automatically','SMP-EIPP-01','Portal activity')],
       chips:['How old is our unapplied cash?','Why is cash unapplied?','How do we resolve unapplied cash faster?']},
      {id:'ca-matching',name:'Remittance Matching',description:'Compares automated match rates across payment channels.',
       prompt:'Summarize remittance auto-match rates by payment channel and where matching fails.',
       chart:{title:'Auto-match rate by channel',unit:'pct',labels:['Card (portal)','Lockbox','ACH / EFT','Wire','Check'],values:[98,94,93,82,76]},
       insights:[I('The overall auto-match rate is 91%','Payments auto-matched','3,212 of 3,530','Automation handles most volume','SMP-CA-01','Channel match rates'),
         I('Portal card payments match best','Card (portal) match rate','98%','Structured portal data removes most manual work','SMP-CA-01','Channel match rates'),
         I('Checks match worst','Check match rate','76%','Paper remittances need manual keying','SMP-CA-01','Channel match rates')],
       risks:[I('Wire payments often lack invoice references','Wire match rate','82%','Unmatched wires add to unapplied cash','SMP-CA-01','Channel match rates'),
         I('Manual matching effort','Payments needing manual work','318 of 3,530','Staff time that could go to exceptions','SMP-CA-01','Application summary')],
       recommendations:[I('Encourage check payers to move to the portal','Check vs portal match rate','76% vs 98%','Each shift improves match rates and speeds posting','SMP-EIPP-01','Portal activity'),
         I('Add reference rules for wire payments','Wire match rate','82%','Raises matching on the second-weakest channel','SMP-CA-01','Channel match rates')],
       chips:['Which payment channel matches worst?','Why do wires fail to match?','How do we raise the auto-match rate?']},
      {id:'ca-recon',name:'Reconciliation Queue',description:'Breaks the reconciliation backlog down by exception type.',
       prompt:'Summarize pending reconciliation items by type and recommend how to clear the queue.',
       chart:{title:'Pending reconciliation items',unit:'count',labels:['Short payment','No remittance','Multiple invoices','Overpayment','Bank fee'],values:[52,38,27,17,12]},
       insights:[I('146 items await reconciliation','Pending items','146','Each item holds cash out of correct posting','SMP-CA-02','Reconciliation queue'),
         I('Short payments are the largest group','Short payments','52 (36%)','Often a sign of deductions or disputes','SMP-CA-02','Reconciliation queue'),
         I('38 payments arrived without remittance','No remittance','38 (26%)','These need customer contact to identify','SMP-CA-02','Reconciliation queue')],
       risks:[I('Short payments may be hidden disputes','Short payments','52','Unrecorded deductions understate the dispute backlog','SMP-DSP-01','Dispute register'),
         I('The backlog affects AR accuracy','Unapplied cash','$500K','Reported AR and DSO are overstated until items clear','SMP-CA-01','Unapplied list')],
       recommendations:[I('Convert short payments into recorded deductions','Short payments','52','Routes them to the dispute team with a clear owner','SMP-CA-02','Reconciliation queue'),
         I('Auto-write-off bank fees under a small tolerance','Bank fee items','12','Clears low-value noise; the tolerance needs Finance approval','SMP-CA-02','Reconciliation queue')],
       chips:['What is in the reconciliation queue?','Why are there so many short payments?','How do we clear the queue faster?']}
    ],
    disputes:[
      {id:'dsp-triage',name:'Dispute Triage',description:'Classifies open disputes by reason to route them to the right team.',
       prompt:'Summarize open disputes by reason and value, and where they should be routed.',
       chart:{title:'Open disputes by reason',unit:'count',labels:['Pricing','Short shipment','Damaged goods','Promotion / deduction','Billing error'],values:[118,74,61,56,33]},
       insights:[I('342 disputes are open','Open disputes','342 worth $1.25M','About 15% of AR is under dispute','SMP-DSP-01','Dispute register'),
         I('Pricing is the top dispute reason','Pricing disputes','118 (35%)','Linked to the 58 invoices held for pricing mismatches','SMP-DSP-01','Dispute register'),
         I('Logistics causes 135 disputes','Short shipment + damaged goods','74 + 61','Root causes sit with fulfilment, not finance','SMP-DSP-01','Dispute register')],
       risks:[I('Disputed invoices are excluded from collection','Disputed amount','$1.25M','Cash stays blocked until disputes close','SMP-DSP-01','Dispute register'),
         I('Promotion deductions take the longest','Average resolution, promotions','16 days','Slow resolution delays cash and ties up staff','SMP-DSP-01','Resolution times')],
       recommendations:[I('Route logistics disputes to fulfilment automatically','Logistics disputes','135','Puts disputes with the team that can fix them','SMP-DSP-01','Dispute register'),
         I('Fix pricing master data at the source','Pricing disputes','118','Prevents repeat disputes and invoice holds','SMP-AR-03','Exception log')],
       chips:['What are the main dispute reasons?','How much cash is blocked by disputes?','Where should disputes be routed?']},
      {id:'dsp-resolution',name:'Dispute Resolution Tracker',description:'Measures how long disputes take to resolve, by reason.',
       prompt:'Summarize average dispute resolution time by reason and the slowest dispute types.',
       chart:{title:'Average resolution time by reason (days)',unit:'days',labels:['Billing error','Pricing','Short shipment','Damaged goods','Promotion / deduction'],values:[7,9,13,15,16]},
       insights:[I('Disputes take 12 days to resolve on average','Average resolution time','12 days','Weighted across all 342 open disputes','SMP-DSP-01','Resolution times'),
         I('Billing errors are resolved fastest','Billing errors','7 days','Internal fixes resolve quickly','SMP-DSP-01','Resolution times'),
         I('Promotion deductions are the slowest','Promotions / deductions','16 days','They need sales confirmation before closing','SMP-DSP-01','Resolution times')],
       risks:[I('Slow disputes delay cash','Disputed amount','$1.25M','Every extra day keeps cash blocked','SMP-DSP-01','Dispute register'),
         I('Damaged-goods disputes depend on carrier claims','Damaged goods','15 days','External parties slow resolution','SMP-DSP-01','Resolution times')],
       recommendations:[I('Pre-approve promotion validation with Sales','Promotion disputes','56','Could bring the slowest category closer to the 12-day average','SMP-DSP-01','Dispute register'),
         I('Set a 10-day resolution target for pricing disputes','Pricing disputes','9 days today','Locks in the current pace for the largest category','SMP-DSP-01','Resolution times')],
       chips:['How long do disputes take to resolve?','Which dispute types are slowest?','How can we resolve disputes faster?']},
      {id:'dsp-priority',name:'High-Priority Disputes',description:'Focuses on high-value disputes that block the most cash.',
       prompt:'Summarize disputes by priority and value, with focus on the high-priority queue.',
       chart:{title:'Disputed amount by priority',unit:'usdM',labels:['High (38)','Medium (121)','Low (183)'],values:[0.54,0.46,0.25]},
       insights:[I('38 high-priority disputes hold $0.54M','High-priority disputed amount','$0.54M (43% of disputed value)','A small queue blocks a large share of disputed cash','SMP-DSP-01','Priority view'),
         I('Low-priority disputes are many but small','Low-priority disputes','183 worth $0.25M','Suited to fast-track or tolerance-based closure','SMP-DSP-01','Priority view'),
         I('Medium priority holds $0.46M','Medium-priority disputes','121','The next queue to watch','SMP-DSP-01','Priority view')],
       risks:[I('High-priority disputes involve key accounts','Brightline Retail pricing dispute','$0.08M','Affects relationships with top customers','SMP-DSP-01','Dispute register'),
         I('Disputes approaching 30 days','High-priority disputes open over 20 days','9','Long-open disputes are more likely to be written off','SMP-DSP-01','Priority view')],
       recommendations:[I('Hold a daily review of the high-priority queue','High-priority disputes','38','Concentrates effort where the value is','SMP-DSP-01','Priority view'),
         I('Fast-track low-value disputes under tolerance','Low-priority disputes','183','A tolerance policy needs Finance approval before use','SMP-DSP-01','Priority view')],
       chips:['Which disputes block the most cash?','What is in the high-priority queue?','How should we handle low-value disputes?']},
      {id:'dsp-trend',name:'Dispute Resolution Trend',description:'Tracks disputes resolved per month and the backlog trend.',
       prompt:'Summarize the monthly trend in resolved disputes and what it means for the backlog.',
       chart:{title:'Disputes resolved per month',unit:'count',months:true,values:[151,162,170,177,184]},
       insights:[I('184 disputes were resolved this month','Resolved this month','184','The highest monthly total in the period','SMP-DSP-01','Monthly trend'),
         I('Resolutions rose for five straight months','Resolved per month','151 → 184 (+22%)','Team throughput is improving steadily','SMP-DSP-01','Monthly trend'),
         I('The open backlog remains large','Open disputes','342','At the current pace the backlog is under two months of work','SMP-DSP-01','Dispute register')],
       risks:[I('New disputes may outpace resolutions','Pricing disputes','118 open','Pricing issues keep generating new disputes','SMP-DSP-01','Dispute register'),
         I('Throughput depends on a few specialists','Average resolution time','12 days','Absences would slow resolution noticeably','SMP-DSP-01','Resolution times')],
       recommendations:[I('Track disputes opened versus resolved each month','Resolved this month','184','Shows whether the backlog is really shrinking','SMP-DSP-01','Monthly trend'),
         I('Cross-train collectors on simple dispute types','Billing-error disputes','33','Adds capacity for the fastest-to-resolve disputes','SMP-DSP-01','Dispute register')],
       chips:['Is dispute resolution improving?','How long will the backlog take to clear?','What would speed up resolution?']}
    ],
    'portal-usage':[
      {id:'eipp-adoption',name:'Portal Adoption Analyst',description:'Measures customer registration and active use of the EIPP portal.',
       prompt:'Summarize portal adoption overall and by customer segment.',
       chart:{title:'Portal adoption by segment',unit:'pct',labels:['Enterprise','Mid-market','Distribution','SMB','Public sector'],values:[84,77,72,68,61]},
       insights:[I('Portal adoption is 75%','Active / registered customers','1,840 of 2,450','Three in four registered customers use the portal','SMP-EIPP-01','Adoption summary'),
         I('Enterprise customers adopt most','Enterprise adoption','84%','Large customers value self-service invoicing','SMP-EIPP-01','Segment adoption'),
         I('Public sector adoption lags','Public sector adoption','61%','Procurement rules often require paper processes','SMP-EIPP-01','Segment adoption')],
       risks:[I('610 registered customers are inactive','Inactive registered customers','610','They still need manual invoices and statements','SMP-EIPP-01','Adoption summary'),
         I('Low adoption keeps check payments high','Check auto-match rate','76%','Non-portal payers create more manual cash application','SMP-CA-01','Channel match rates')],
       recommendations:[I('Run an activation campaign for inactive customers','Inactive registered customers','610','Start with SMB, where the gap is largest by count','SMP-EIPP-01','Adoption summary'),
         I('Offer guided onboarding for public sector customers','Public sector adoption','61%','Addresses procurement-specific questions','SMP-EIPP-01','Segment adoption')],
       chips:['How many customers use the portal?','Which segments lag in adoption?','How do we increase adoption?']},
      {id:'eipp-payments',name:'Online Payments Monitor',description:'Tracks payment volume made through the customer portal.',
       prompt:'Summarize the online payment volume trend and its share of total receipts.',
       chart:{title:'Online payment volume',unit:'usdM',months:true,values:[2.7,2.9,3.0,3.2,3.4]},
       insights:[I('Online payments reached $3.4M','Online payment volume','$3.4M this month','The highest month in the period','SMP-EIPP-01','Payment trend'),
         I('The portal carries most receipts','Online share of receipts','$3.4M of $5.2M (65%)','Most cash now arrives through a channel that auto-matches well','SMP-EIPP-01','Payment trend'),
         I('Volume grew 26% in five months','Online payment volume','$2.7M → $3.4M','Steady migration from checks and wires','SMP-EIPP-01','Payment trend')],
       risks:[I('Card fees rise with volume','Card share of online payments','Not tracked in the sample','Fee exposure should be monitored as volume grows','SMP-EIPP-01','Payment trend'),
         I('$1.8M still arrives offline','Offline receipts','$1.8M','Offline channels have lower match rates','SMP-CA-01','Channel match rates')],
       recommendations:[I('Promote ACH in the portal for large payments','Online payment volume','$3.4M','Keeps the benefits of portal matching at lower fees','SMP-EIPP-01','Payment trend'),
         I('Target the top offline payers for migration','Offline receipts','$1.8M','Each migrated payer improves matching','SMP-CA-01','Channel match rates')],
       chips:['How fast are online payments growing?','What share of cash comes through the portal?','How do we move more payers online?']},
      {id:'eipp-actions',name:'Customer Self-Service',description:'Tracks customer actions waiting in the portal (approvals, responses, uploads).',
       prompt:'Summarize pending customer actions in the portal and their effect on cash.',
       chart:{title:'Pending customer actions',unit:'count',labels:['Invoice approval','Dispute response','Remittance upload','Bank / profile update','Statement request'],values:[48,31,22,15,10]},
       insights:[I('126 customer actions are pending','Pending actions','126','Each pending action can delay payment','SMP-EIPP-01','Pending actions'),
         I('Invoice approvals are the largest group','Invoice approvals','48 (38%)','Unapproved invoices are not scheduled for payment','SMP-EIPP-01','Pending actions'),
         I('31 dispute responses await customers','Dispute responses','31','Disputes cannot close until customers reply','SMP-EIPP-01','Pending actions')],
       risks:[I('Pending approvals delay cash','Invoice approvals','48','Payment timing slips while invoices wait','SMP-EIPP-01','Pending actions'),
         I('Missing remittances add to unapplied cash','Remittance uploads','22','Linked to the 38 payments without remittance','SMP-CA-02','Reconciliation queue')],
       recommendations:[I('Send automated reminders for approvals older than 5 days','Invoice approvals','48','Prompts customers without collector effort','SMP-EIPP-01','Pending actions'),
         I('Ask for remittances when unmatched payments arrive','Remittance uploads','22','Speeds up cash application','SMP-CA-02','Reconciliation queue')],
       chips:['What actions are customers holding up?','How do pending approvals affect cash?','How do we get customers to respond faster?']},
      {id:'eipp-engagement',name:'Portal Engagement',description:'Tracks active portal users month over month.',
       prompt:'Summarize the trend in active portal customers and engagement.',
       chart:{title:'Active portal customers',unit:'count',months:true,values:[1610,1680,1730,1790,1840]},
       insights:[I('Active customers reached 1,840','Active customers','1,840','The highest level in the period','SMP-EIPP-01','Engagement trend'),
         I('230 customers became active in five months','Growth','1,610 → 1,840 (+14%)','Adoption is rising steadily','SMP-EIPP-01','Engagement trend'),
         I('Active users are 75% of registered','Adoption','1,840 of 2,450','Room to activate a further 610','SMP-EIPP-01','Adoption summary')],
       risks:[I('Growth is slowing slightly','Monthly increase','+50 to +70 per month','Organic growth may plateau without campaigns','SMP-EIPP-01','Engagement trend'),
         I('Inactive customers rely on manual work','Inactive registered customers','610','Higher service cost per customer','SMP-EIPP-01','Adoption summary')],
       recommendations:[I('Set a target of 80% adoption','Active customers needed','≈ 1,960','About 120 more active customers','SMP-EIPP-01','Adoption summary'),
         I('Track logins and payments per active customer','Active customers','1,840','Shows depth of engagement, not just activation','SMP-EIPP-01','Engagement trend')],
       chips:['Is portal engagement growing?','How far are we from 80% adoption?','How do we keep growth going?']}
    ],
    efficiency:[
      {id:'bm-dso',name:'DSO Benchmarking',description:'Compares DSO with prior year and illustrative peer benchmarks.',
       prompt:'Summarize DSO compared with prior year, peer median and top quartile.',
       chart:{title:'DSO vs benchmarks (days)',unit:'days',labels:['Our DSO','Prior year','Peer median','Top quartile'],values:[48,51,42,35]},
       insights:[I('DSO is 3 days better than last year','DSO vs prior year','48 vs 51 days','Year-over-year improvement despite the recent rise','SMP-BM-01','Benchmark pack'),
         I('DSO is 6 days above the peer median','Illustrative peer median','42 days','About $1.07M more cash tied up than at the median','SMP-BM-01','Benchmark pack'),
         I('The top-quartile gap is 13 days','Illustrative top quartile','35 days','Shows the size of the long-term opportunity','SMP-BM-01','Benchmark pack')],
       risks:[I('The recent trend is upward','DSO','44 → 48 days in five months','Year-over-year gains could be lost','SMP-KPI-01','DSO trend'),
         I('Benchmarks are illustrative','Peer data source','Sample benchmark pack','Replace with a validated benchmark before external use','SMP-BM-01','Benchmark pack')],
       recommendations:[I('Set a 12-month DSO target of 44 days','Cash released','≈ $0.72M','Brings DSO back to its level five months ago','SMP-KPI-01','Calculated from AR and DSO'),
         I('Focus on invoice exceptions and disputes','Invoices on hold / open disputes','158 / 342','The two largest controllable DSO drivers','SMP-AR-03','Exception log')],
       chips:['How does our DSO compare with peers?','How much cash would peer-median DSO release?','What is a realistic DSO target?']},
      {id:'bm-process',name:'Process Efficiency Scorecard',description:'Scores efficiency across the order-to-cash processes.',
       prompt:'Summarize process efficiency by order-to-cash process and the weakest areas.',
       chart:{title:'Process efficiency by area',unit:'pct',labels:['Cash application','Collections','Credit','Billing','Disputes'],values:[91,86,84,75,74]},
       insights:[I('Overall process efficiency is 82%','Average across five processes','82%','Solid, with clear gaps in billing and disputes','SMP-BM-01','Efficiency scorecard'),
         I('Cash application is the most efficient','Cash application','91%','Driven by the 91% auto-match rate','SMP-CA-01','Application summary'),
         I('Disputes and billing trail','Disputes / billing','74% / 75%','Both feed each other through pricing issues','SMP-BM-01','Efficiency scorecard')],
       risks:[I('Billing errors create downstream work','Invoices on hold','158','Every billing exception creates collection and dispute effort','SMP-AR-03','Exception log'),
         I('Dispute effort reduces collector capacity','Collector hours on disputes','19%','Time diverted from collections','SMP-BM-01','Effort analysis')],
       recommendations:[I('Prioritize billing accuracy improvements','Billing efficiency','75%','Fixes the source of many disputes','SMP-BM-01','Efficiency scorecard'),
         I('Automate dispute routing','Dispute efficiency','74%','Moves disputes to the right owner faster','SMP-BM-01','Efficiency scorecard')],
       chips:['Which process is least efficient?','Why is billing efficiency low?','Where should we invest first?']},
      {id:'bm-automation',name:'Automation Benchmark',description:'Compares automation rates across order-to-cash activities.',
       prompt:'Summarize automation rates by activity and the biggest automation opportunities.',
       chart:{title:'Automation rate by activity',unit:'pct',labels:['Cash application','Invoice delivery','Dunning','Dispute routing','Credit reviews'],values:[91,88,78,69,62]},
       insights:[I('Cash application automation is 91%','Auto-matched payments','3,212 of 3,530','The most automated activity','SMP-CA-01','Application summary'),
         I('Invoice delivery is largely automated','Invoice delivery','88%','Most invoices go out electronically','SMP-BM-01','Automation benchmark'),
         I('Credit reviews are the least automated','Credit reviews','62%','Reviews still depend on manual financial analysis','SMP-BM-01','Automation benchmark')],
       risks:[I('Manual credit reviews create backlogs','Overdue credit reviews','12','Manual effort cannot keep pace with the review calendar','SMP-CR-03','Review calendar'),
         I('Manual dispute routing slows resolution','Dispute routing automation','69%','Disputes wait in shared queues','SMP-BM-01','Automation benchmark')],
       recommendations:[I('Automate data collection for credit reviews','Credit review automation','62%','Reduces the overdue review backlog; decisions stay with analysts','SMP-BM-01','Automation benchmark'),
         I('Add reason-based dispute routing','Dispute routing automation','69%','Sends disputes straight to the owning team','SMP-BM-01','Automation benchmark')],
       chips:['Which activities are least automated?','How automated is cash application?','What should we automate next?']},
      {id:'bm-effort',name:'Collector Effort Analyst',description:'Shows how collector time is spent across activities.',
       prompt:'Summarize how collector hours are spent and where time could be released.',
       chart:{title:'Share of collector hours',unit:'pct',labels:['Calls','Emails','Dispute follow-up','Cash research','Reporting'],values:[34,22,19,15,10]},
       insights:[I('Calls take a third of collector time','Calls','34% of hours','Direct contact remains the main activity','SMP-BM-01','Effort analysis'),
         I('19% of time goes to dispute follow-up','Dispute follow-up','19%','Work that belongs with the dispute team','SMP-BM-01','Effort analysis'),
         I('Cash research takes 15%','Cash research','15%','Linked to $500K of unapplied cash','SMP-CA-01','Unapplied list')],
       risks:[I('Non-collection work limits productivity','Disputes + cash research + reporting','44% of hours','Less time for high-priority accounts','SMP-BM-01','Effort analysis'),
         I('Reporting effort is manual','Reporting','10%','Time spent compiling instead of collecting','SMP-BM-01','Effort analysis')],
       recommendations:[I('Move dispute follow-up to the dispute team','Dispute follow-up','19%','Could lift productivity above the current 86%','SMP-BM-01','Effort analysis'),
         I('Automate standard collector reports','Reporting','10%','Returns time to customer contact','SMP-BM-01','Effort analysis')],
       chips:['Where does collector time go?','How much time is spent on disputes?','How can collectors spend more time collecting?']}
    ],
    kpis:[
      {id:'kpi-scorecard',name:'KPI Scorecard',description:'Compares the core order-to-cash KPIs with their targets.',
       prompt:'Summarize core KPIs against target: DSO, CEI, overdue AR, cash application and bad-debt exposure.',
       chart:{title:'KPI attainment vs target',unit:'pct',labels:['DSO','CEI','Cash application','Overdue AR','Bad-debt exposure'],values:[94,96,98,83,83]},
       insights:[I('Cash application is closest to target','Auto-match rate vs target','91% vs 93% (98% attained)','Near target, with the remaining gap in wires and checks','SMP-KPI-01','Targets'),
         I('DSO is 3 days above target','DSO vs target','48 vs 45 days (94% attained)','Customers pay slower than planned','SMP-KPI-01','Targets'),
         I('CEI is 4 points below target','CEI vs target','86% vs 90% (96% attained)','Collections are improving but not yet at goal','SMP-KPI-01','Targets')],
       risks:[I('Overdue AR is furthest from target','Overdue AR vs target','$2.4M vs $2.0M (83% attained)','$0.4M above plan','SMP-KPI-01','Targets'),
         I('Bad-debt exposure exceeds tolerance','Bad-debt exposure vs target','$420K vs $350K (83% attained)','$70K above the planned level','SMP-KPI-01','Targets')],
       recommendations:[I('Focus on reducing overdue AR first','Excess overdue AR','$0.4M','Improves overdue AR, DSO and bad-debt exposure together','SMP-KPI-01','Targets'),
         I('Review the 90+ day accounts that drive bad-debt exposure','90+ days past due','$0.30M','The largest component of bad-debt exposure','SMP-AR-01','90+ list')],
       chips:['Which KPIs are off target?','How far is DSO from target?','What should we fix first?']},
      {id:'kpi-overdue',name:'Overdue AR Trend',description:'Tracks the overdue receivables balance month by month.',
       prompt:'Summarize the overdue AR trend over the last five months and its drivers.',
       chart:{title:'Overdue AR trend',unit:'usdM',months:true,values:[1.92,2.05,2.14,2.28,2.40]},
       insights:[I('Overdue AR rose to $2.4M','Overdue AR','$2.40M (from $1.92M)','Up 25% in five months','SMP-KPI-01','Overdue trend'),
         I('Overdue AR is 28% of outstanding','Overdue / total AR','$2.4M / $8.6M','Above a typical 20–25% range','SMP-AR-01','Aging summary'),
         I('Growth has been steady, not sudden','Monthly increase','$0.09M–$0.14M','Points to process causes rather than one large customer','SMP-KPI-01','Overdue trend')],
       risks:[I('Overdue AR is above target','Overdue AR vs target','$2.4M vs $2.0M','Pressure on cash flow and bad-debt exposure','SMP-KPI-01','Targets'),
         I('Balances are ageing into older buckets','AR more than 60 days past due','$0.73M','Older balances carry higher loss rates','SMP-AR-01','Aging summary')],
       recommendations:[I('Prioritize the 24 high-priority accounts','Priority 1 overdue','$1.12M','The fastest way to reverse the trend','SMP-COL-01','Priority worklist'),
         I('Clear invoice exceptions blocking payment','Invoices on hold','158','Removes a steady source of new overdue balances','SMP-AR-03','Exception log')],
       chips:['Why is overdue AR increasing?','How fast is overdue AR growing?','How do we reverse the trend?']},
      {id:'kpi-baddebt',name:'Bad-Debt Exposure',description:'Estimates bad-debt exposure from aged receivables.',
       prompt:'Summarize estimated bad-debt exposure by aging bucket and the assumptions behind it.',
       chart:{title:'Bad-debt exposure by bucket',unit:'usdK',labels:['90+ days (100%)','61–90 days (25%)','31–60 days (2%)'],values:[300,108,12]},
       insights:[I('Estimated bad-debt exposure is $420K','Bad-debt exposure','$420K','About 5% of open AR','SMP-KPI-01','Exposure estimate'),
         I('90+ day balances drive most of the exposure','90+ days at 100%','$300K (71%)','Resolving these accounts has the largest effect','SMP-AR-01','90+ list'),
         I('The 61–90 day bucket adds $108K','61–90 days at 25%','$0.43M × 25%','The next bucket to stop from ageing','SMP-AR-01','Aging summary')],
       risks:[I('Exposure is above tolerance','Exposure vs target','$420K vs $350K','$70K above the planned level','SMP-KPI-01','Targets'),
         I('Loss rates are illustrative assumptions','Rates used','100% / 25% / 2%','Not an approved reserve methodology; Finance must validate them','SMP-KPI-01','Assumptions')],
       recommendations:[I('Escalate 90+ day accounts this month','90+ days past due','$0.30M','Each recovery reduces exposure dollar for dollar','SMP-AR-01','90+ list'),
         I('Stop 61–90 day balances from ageing','61–90 days past due','$0.43M','Prevents them from moving to the 100% bucket','SMP-AR-01','Aging summary')],
       chips:['How is bad-debt exposure calculated?','Which balances drive bad-debt exposure?','How do we reduce bad-debt exposure?']},
      {id:'kpi-cashapp',name:'Cash Application KPI',description:'Tracks the cash application (auto-match) rate over time.',
       prompt:'Summarize the cash application rate trend and the gap to target.',
       chart:{title:'Cash application rate trend',unit:'pct',months:true,values:[87,88,89,90,91]},
       insights:[I('The cash application rate reached 91%','Auto-match rate','91% (from 87%)','Four points of improvement in five months','SMP-KPI-01','Cash application trend'),
         I('Improvement has been steady','Monthly gain','About 1 point','Consistent gains from portal adoption','SMP-EIPP-01','Payment trend'),
         I('The rate is 2 points from target','Gap to the 93% target','2 points','Within reach this quarter','SMP-KPI-01','Targets')],
       risks:[I('Unapplied cash remains','Unapplied cash','$500K','Rate gains do not yet clear older items','SMP-CA-01','Unapplied list'),
         I('Checks hold the rate back','Check match rate','76%','The weakest channel limits further gains','SMP-CA-01','Channel match rates')],
       recommendations:[I('Close the gap with wire reference rules','Wire match rate','82%','The quickest route to 93%','SMP-CA-01','Channel match rates'),
         I('Migrate check payers to the portal','Portal card match rate','98%','Removes the lowest-matching channel','SMP-EIPP-01','Portal activity')],
       chips:['Is cash application improving?','How far are we from target?','What would get us to 93%?']}
    ]
  };

  /* ---- Shared chat topics: [first answer, deeper follow-up]. Same figures as the summaries. ---- */
  var TOPICS={
    aging:{re:/aging|ageing|bucket|overdue|past due|90\+|days past/,
      a:['Overdue AR is $2.4M, about 28% of the $8.6M outstanding. By bucket: 1–30 days $1.05M, 31–60 days $0.62M, 61–90 days $0.43M and over 90 days $0.30M, so $1.35M is more than 30 days past due. Current (not yet due) balances are $6.20M.',
         'Overdue AR rose from $1.92M to $2.40M over the last five months while DSO moved from 44 to 48 days. Three drivers stand out: 158 invoices are on hold (58 for pricing mismatches), $0.10M of promises to pay were broken, and $0.62M in the 31–60 day bucket is at risk of rolling into 61–90 days. Prioritize the 24 high-priority accounts ($1.12M overdue) and follow up on unresolved promises.']},
    highrisk:{re:/high[- ]?risk|band e|band d|downgrade|risky customer/,
      a:['18 customers are rated Band E (high risk) and hold $1.3M of exposure. 5 of them also have an overdue credit review, and another 41 customers sit in Band D, one band above high risk.',
         'Suggested handling: move Band E accounts to prepayment or secured terms, clear the 5 overdue reviews first, and put the 41 Band D customers on a 30-day watchlist. Any limit change needs credit-manager approval; nothing is changed automatically.']},
    credit:{re:/credit|exposure|limit|utili[sz]|headroom/,
      a:['Credit exposure is $12.8M against $16.0M of approved limits (80% utilization), leaving $3.2M available. By tier: low risk $5.9M, moderate $3.6M, elevated $2.0M and high risk $1.3M. Overdue exposure is $2.1M.',
         'Utilization by segment: Enterprise 86%, Distribution 83%, Mid-market 79%, SMB 71% and Public sector 64%. Enterprise is closest to its limits, so large orders there are the most likely to hit credit holds.']},
    customers:{re:/customer|debtor|account|top|concentrat|largest/,
      a:['The five largest debtors hold $3.46M (40% of AR): Alder Industrial $0.94M, Brightline Retail $0.81M, Cobalt Health $0.66M, Delmar Logistics $0.58M and Evergreen Foods $0.47M. These are fictional sample customers.',
         'Two of them are overdue: Brightline Retail ($0.22M, with a $0.08M pricing dispute) and Delmar Logistics ($0.17M). Separately, 24 accounts are flagged high priority for collections with $1.12M overdue.']},
    collections:{re:/collect|cei|effectiveness|promise|ptp|dunning|collector|productiv/,
      a:['Collection effectiveness (CEI) is 86%, up from 82% five months ago but 4 points below the 90% target. Promises to pay cover $1.15M and 24 accounts are flagged high priority, holding $1.12M of the $2.4M overdue.',
         'Of the $1.15M under promise, $0.62M has been kept, $0.43M is due in the next 30 days and $0.10M is broken. Team worklist completion ranges from 79% (West) to 91% (North), averaging 86%.']},
    cashapp:{re:/cash app|application|payment|unapplied|remittance|match|reconcil/,
      a:['Payments received total $5.2M: $4.21M auto-applied, $0.49M applied manually and $500K unapplied. The auto-match rate is 91% (3,212 of 3,530 payments) and 146 items await reconciliation.',
         'Unapplied cash by age: 0–7 days $0.21M, 8–15 days $0.13M, 16–30 days $0.09M and over 30 days $0.07M. The 146 reconciliation items are mainly short payments (52) and payments without remittance (38). Wires (82%) and checks (76%) have the lowest match rates.']},
    disputes:{re:/dispute|deduction|resolution|claim|resolve/,
      a:['There are 342 open disputes worth $1.25M, 38 of them high priority ($0.54M). Average resolution time is 12 days and 184 disputes were resolved this month, up from 151 five months ago.',
         'By reason: pricing 118 (9 days to resolve), short shipment 74 (13 days), damaged goods 61 (15 days), promotions/deductions 56 (16 days) and billing errors 33 (7 days). Promotions are the slowest because they need sales confirmation.']},
    portal:{re:/portal|eipp|adoption|online|self-service|registered|active/,
      a:['2,450 customers are registered on the portal and 1,840 are active (75% adoption). Online payments reached $3.4M this month — 65% of the $5.2M received — and 126 customer actions are pending.',
         'Adoption by segment: Enterprise 84%, Mid-market 77%, Distribution 72%, SMB 68% and Public sector 61%. Pending actions are mostly invoice approvals (48) and dispute responses (31).']},
    baddebt:{re:/bad[- ]?debt|write[- ]?off|reserve|provision|loss/,
      a:['Estimated bad-debt exposure is $420K: 100% of 90+ day balances ($300K) + 25% of 61–90 day balances ($108K) + 2% of 31–60 day balances ($12K). The rates are illustrative assumptions, not an approved reserve methodology.',
         'Exposure is $70K above the $350K target. The fastest reduction comes from the $0.30M of 90+ day balances; stopping the $0.43M in 61–90 days from ageing prevents it moving into the 100% bucket.']},
    dso:{re:/\bdso\b|days sales|working capital/,
      a:['DSO is 48 days, up from 44 five months ago. At $8.6M of AR, each DSO day represents about $179K, so the 4-day rise ties up roughly $0.72M of cash. The illustrative peer median is 42 days.',
         'Main drivers are invoice exceptions (158 on hold), disputes (342 open, 12 days to resolve) and balances ageing in the 31–60 day bucket ($0.62M). A 2-day reduction would release about $358K.']},
    benchmark:{re:/benchmark|peer|efficien|automation|compare/,
      a:['Against the illustrative benchmark pack: DSO 48 days vs a peer median of 42 and top quartile of 35; cash application automation 91%; collection productivity 86%; dispute resolution 12 days; overall process efficiency 82%.',
         'The weakest processes are disputes (74%) and billing (75%); both are linked through pricing errors. The least automated activity is credit reviews (62%). Benchmarks are sample values and should be validated before external use.']},
    kpi:{re:/kpi|metric|target|scorecard|trend|performance|perform|health|overall|how are we/,
      a:['Core KPIs: DSO 48 days (target 45), CEI 86% (target 90%), overdue AR $2.4M (target $2.0M), cash application rate 91% (target 93%) and bad-debt exposure $420K (target $350K).',
         'Five-month trends: DSO 44 → 48 days (worse), CEI 82% → 86% (better), overdue AR $1.92M → $2.40M (worse), cash application 87% → 91% (better). Overdue AR and bad-debt exposure are furthest from target.']}
  };
  var TOPIC_ORDER=['baddebt','highrisk','dso','aging','customers','disputes','cashapp','portal','collections','credit','benchmark','kpi'];

  /* ---- Agent-specific answers for the suggested questions (keyed by agent id, same order as chips).
     A string is the answer; 'topic:N' reuses a shared topic at depth N. ---- */
  var CHIP_ANSWERS={
    'credit-exposure':['High risk is not the largest tier by value: low risk carries $5.9M, moderate $3.6M, elevated $2.0M and high risk $1.3M of the $12.8M exposure. The high-risk tier matters most per dollar because it sits with 18 Band E customers.','$3.2M of credit remains available out of $16.0M of approved limits — 80% is in use. Open orders not yet invoiced add $4.2M of exposure, so headroom can disappear quickly at shipment.','highrisk:0'],
    'credit-risk':['They fall into Band E mainly because of slow or irregular payment: DSO across the portfolio rose from 44 to 48 days, and these customers hold $1.3M of exposure. 5 of the 18 also have an overdue credit review, so their scores rest on stale financials.','41 customers are in Band D, one band above high risk. They are the most likely next downgrades if payment behaviour slips; a 30-day watchlist is recommended.','highrisk:1'],
    'credit-utilization':['Enterprise (86%) and Distribution (83%) are closest to their limits. Mid-market is at 79%, SMB 71% and Public sector 64%. Portfolio utilization is 80%.','Enterprise is 86% utilized, so roughly 14% of its approved limits remain. Pre-approved temporary increases for strong payers would avoid order holds; each increase still needs approval.','Two levers: collect overdue exposure ($2.1M) to restore headroom, and rebalance unused Public sector limits (64% utilized) toward segments that need them. Total approved limits stay at $16.0M.'],
    'credit-review':['12 reviews are overdue. 5 of them belong to high-risk (Band E) customers, so those should be completed first.','26 reviews are due within 30 days; with the 12 overdue reviews, 38 need attention this month. A further 57 fall due within 60 days.','9 reviews are on hold because customers have not sent financial statements. Requesting them through the portal makes the request trackable.'],
    'coll-priority':['aging:1','Start with the 24 Priority 1 accounts: they hold $1.12M of the $2.4M overdue (47%). Priority 2 follows with $0.71M.','Priority 3–4 accounts hold $0.57M of overdue AR. Their balances are small enough for automated reminders, freeing collectors for Priority 1–2.'],
    'coll-ptp':['Fairly reliable: of $1.15M promised, $0.62M (54%) has been kept and only $0.10M has been broken. The remaining $0.43M is due within 30 days.','$0.31M of promised payments is due within the next 7 days. Confirming these with customers now protects near-term cash.','Escalate the $0.10M of broken promises within 48 hours and check whether any have turned into disputes. Then seek dated promises on the $1.25M of overdue AR that has none.'],
    'coll-productivity':['West needs support: worklist completion is 79%, against an 86% average and 91% for North.','West completes 79% of planned contacts. Across teams, 19% of collector hours go to dispute follow-up, which hits teams with dispute-heavy portfolios hardest.','Two steps: rebalance 10–15% of West’s accounts to North, and route disputes directly to the dispute team to return up to 19% of collector time.'],
    'coll-cei':['Yes. CEI rose from 82% to 86% over five months, with one dip to 84% that recovered the following month.','The gap is 4 points to the 90% target. Older balances ($0.73M more than 60 days past due) and rising DSO (44 → 48 days) are holding it back.','Concentrate on older balances, which move CEI the most, and review CEI weekly against the 90% target so corrections happen mid-month.'],
    'ar-aging':['aging:1','aging:0','Prioritize the 31–60 day bucket ($0.62M): it is still recoverable but at risk of rolling into 61–90 days, where the bad-debt assumption rises from 2% to 25%.'],
    'ar-concentration':['customers:0','Brightline Retail ($0.22M overdue, with a $0.08M pricing dispute) and Delmar Logistics ($0.17M overdue) — $0.39M in total.','Moderate: the top five hold 40% of AR and the largest, Alder Industrial, holds 11%. A 10% per-customer alert would currently flag only Alder Industrial.'],
    'ar-dso':['dso:1','Each DSO day is about $179K at $8.6M of AR. The 4-day rise from 44 to 48 days ties up roughly $0.72M of cash.','Target 2 days this quarter (≈ $358K released) by clearing the 158 held invoices and working the 31–60 day bucket before it ages.'],
    'ar-exceptions':['158 invoices are on hold: pricing mismatch 58, missing PO 41, delivery unconfirmed 33, tax/VAT issue 17 and duplicates 9.','Pricing mismatches (58): they are the largest group and they also feed the 118 open pricing disputes.','Held invoices are not paid until fixed, so they age into overdue buckets and push DSO up. They are one of the main reasons DSO rose from 44 to 48 days.'],
    'ca-monitor':['$500K is unapplied — about 10% of the $5.2M received. $0.16M of it is older than 15 days.','The auto-match rate is 91%: 3,212 of 3,530 payments matched automatically. Portal card payments match best (98%), checks worst (76%).','Add remittance reference rules for wires (82% match rate) and move check payers to the portal, where matching reaches 98%.'],
    'ca-unapplied':['0–7 days $0.21M, 8–15 days $0.13M, 16–30 days $0.09M and over 30 days $0.07M — $500K in total.','Mostly missing information: 38 payments arrived without remittance and 52 were short payments that need investigation.','Contact payers for items older than 30 days ($0.07M) and ask customers to upload remittances in the portal, where they can be matched automatically.'],
    'ca-matching':['Checks match worst at 76%, followed by wires at 82%. Portal card payments match best at 98%.','Wires often arrive without invoice numbers in the payment reference, so they cannot be matched automatically.','Add reference rules for wires and encourage check payers to use the portal. Both target the two weakest channels.'],
    'ca-recon':['146 items: short payments 52, no remittance 38, payments covering multiple invoices 27, overpayments 17 and bank fees 12.','Short payments usually mean the customer deducted something — a price difference, damage or a promotion. They should be recorded as deductions so the dispute team owns them.','Convert the 52 short payments into recorded deductions, request the 38 missing remittances, and agree a small bank-fee tolerance with Finance to clear the 12 fee items.'],
    'dsp-triage':['disputes:1','$1.25M is under dispute across 342 cases, and it cannot be collected until the disputes close. High-priority disputes alone hold $0.54M.','Logistics disputes (short shipment 74, damaged goods 61) should go to fulfilment; pricing disputes (118) to pricing or sales operations; billing errors (33) stay with finance.'],
    'dsp-resolution':['12 days on average. Billing errors take 7 days, pricing 9, short shipment 13, damaged goods 15 and promotions 16.','Promotions/deductions (16 days) and damaged goods (15 days) are slowest — they depend on sales confirmation and carrier claims.','Pre-agree promotion validation with Sales and set a 10-day target for pricing disputes, the largest category.'],
    'dsp-priority':['The 38 high-priority disputes hold $0.54M — 43% of the $1.25M disputed.','38 disputes worth $0.54M, including a $0.08M pricing dispute with Brightline Retail. 9 have been open for more than 20 days.','183 low-priority disputes total $0.25M. A tolerance-based fast-track would clear many of them, but the tolerance needs Finance approval first.'],
    'dsp-trend':['Yes. Resolved disputes rose every month, from 151 to 184 (+22%) over five months.','At 184 resolutions a month, the 342 open disputes represent just under two months of work — assuming new disputes do not outpace resolutions.','Cross-train collectors on simple types such as billing errors (7 days to resolve) and track opened versus resolved each month.'],
    'eipp-adoption':['portal:0','Public sector (61%) and SMB (68%) lag; Enterprise leads at 84%.','Run an activation campaign for the 610 inactive registered customers and offer guided onboarding to public sector customers.'],
    'eipp-payments':['Online payments grew from $2.7M to $3.4M in five months (+26%).','$3.4M of $5.2M received this month (65%) came through the portal.','Target the largest offline payers ($1.8M still arrives offline) and promote ACH in the portal for large payments to keep fees down.'],
    'eipp-actions':['126 actions are pending: invoice approvals 48, dispute responses 31, remittance uploads 22, bank/profile updates 15 and statement requests 10.','Unapproved invoices are not scheduled for payment, so the 48 pending approvals push payment dates out.','Send automated reminders for approvals older than 5 days and request remittances as soon as unmatched payments arrive.'],
    'eipp-engagement':['Yes. Active customers rose from 1,610 to 1,840 in five months (+14%), adding 50–70 each month.','80% adoption means about 1,960 active customers — roughly 120 more than today.','Combine activation campaigns for the 610 inactive customers with tracking of logins and payments per active customer.'],
    'bm-dso':['DSO is 48 days against an illustrative peer median of 42 and top quartile of 35 — but 3 days better than last year (51).','At about $179K per day, reaching the peer median (6 days) would release roughly $1.07M.','A 12-month target of 44 days (≈ $0.72M released) is realistic: it returns DSO to its level five months ago.'],
    'bm-process':['Disputes (74%) and billing (75%) are the least efficient processes; cash application leads at 91%.','Billing efficiency suffers from invoice exceptions: 158 invoices are on hold, mostly for pricing mismatches (58) and missing POs (41).','Billing accuracy first: it is the source of many disputes, so fixing it improves two processes at once.'],
    'bm-automation':['Credit reviews (62%) and dispute routing (69%) are the least automated activities.','Cash application is 91% automated: 3,212 of 3,530 payments auto-matched.','Automate data collection for credit reviews (decisions stay with analysts) and add reason-based dispute routing.'],
    'bm-effort':['Calls 34%, emails 22%, dispute follow-up 19%, cash research 15% and reporting 10%.','19% of collector hours go to dispute follow-up — work that belongs with the dispute team.','Move dispute follow-up to the dispute team and automate standard reports; together that frees up to 29% of collector time.'],
    'kpi-scorecard':['Overdue AR ($2.4M vs $2.0M) and bad-debt exposure ($420K vs $350K) are furthest from target, both at 83% attainment. DSO is at 94%, CEI 96% and cash application 98%.','DSO is 48 days against a 45-day target — 3 days, or about $0.54M of cash at $179K per day.','Reduce overdue AR first: it improves DSO and bad-debt exposure at the same time.'],
    'kpi-overdue':['aging:1','Overdue AR grew by $0.09M–$0.14M each month, from $1.92M to $2.40M (+25%) in five months.','Prioritize the 24 high-priority accounts ($1.12M overdue) and clear the 158 held invoices that keep creating new overdue balances.'],
    'kpi-baddebt':['baddebt:0','90+ day balances drive $300K (71%) of the $420K. The 61–90 day bucket adds $108K and the 31–60 day bucket $12K.','baddebt:1'],
    'kpi-cashapp':['Yes. The cash application rate rose from 87% to 91% over five months, about a point a month.','2 points: the rate is 91% against a 93% target.','Wire reference rules (wires match 82%) and moving check payers to the portal (checks match 76%) are the quickest routes to 93%.']
  };

  /* ---- helpers ---- */
  var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function monthLabels(to,n){var d=to?new Date(to+'T00:00:00'):new Date(),y=d.getFullYear(),m=d.getMonth(),out=[];for(var i=n-1;i>=0;i--){var k=m-i,yy=y+Math.floor(k/12);k=((k%12)+12)%12;out.push(MON[k]+' '+String(yy).slice(2))}return out}
  function findAgent(catId,agentId){var l=CATALOG[catId]||[];for(var i=0;i<l.length;i++)if(l[i].id===agentId)return l[i];return null}
  function later(v,ms){return new Promise(function(res){setTimeout(function(){res(v)},ms)})}
  function copyItems(a){return a.map(function(x){return{title:x.title,metric:x.metric,value:x.value,impact:x.impact,source:{id:x.source.id,report:x.source.report,record:x.source.record}}})}
  var CAT_NAME={credit:'Credit',collections:'Collections',receivables:'Receivables','cash-app':'Cash App',disputes:'Disputes','portal-usage':'Portal Usage (EIPP)',efficiency:'Efficiency & Benchmarking',kpis:'KPIs'};
  function recsText(a){return 'Recommended next steps: '+a.recommendations.map(function(r){return r.title+' ('+r.metric.toLowerCase()+': '+r.value+')'}).join('; ')+'.'}
  function listText(label,items){return label+': '+items.map(function(x,i){return (i+1)+') '+x.title+' — '+x.metric.toLowerCase()+' '+x.value}).join('; ')+'.'}

  /* ---- public contract ---- */
  function listAgents(catId){
    return (CATALOG[catId]||[]).map(function(a){return{id:a.id,name:a.name,description:a.description,prompt:a.prompt,chips:a.chips.slice()}});
  }
  function getSummary(req){
    var a=findAgent(req.categoryId,req.agentId);
    if(!a)return Promise.reject(new Error('Unknown sample agent: '+req.agentId));
    var c=a.chart;
    var out={origin:'sample',categoryId:req.categoryId,agentId:a.id,from:req.from,to:req.to,
      sections:[{key:'insights',items:copyItems(a.insights)},{key:'risks',items:copyItems(a.risks)},{key:'recommendations',items:copyItems(a.recommendations)}],
      chart:{title:c.title,unit:c.unit,labels:c.months?monthLabels(req.to,c.values.length):c.labels.slice(),values:c.values.slice()}};
    return later(out,LATENCY_MS);
  }
  function answer(req){
    var a=findAgent(req.categoryId,req.agentId),q=String(req.question||'').trim(),ql=q.toLowerCase(),ctx=req.context||{};
    if(!a)return Promise.reject(new Error('Unknown sample agent: '+req.agentId));
    var topic=null,depth=0,text='';
    function useTopic(t,d){var list=TOPICS[t].a.concat([recsText(a)]);topic=t;depth=d;text=list[Math.min(d,list.length-1)]}
    // 1) suggested question for this agent
    var ci=a.chips.indexOf(q);
    if(ci>=0){
      var ans=CHIP_ANSWERS[a.id][ci],m=/^([a-z]+):(\d)$/.exec(ans);
      if(m)useTopic(m[1],+m[2]);else{topic='agent';depth=0;text=ans}
    }
    // 2) summary sections of this agent
    if(!text&&/insight|finding|highlight|summar|key point/.test(ql)){topic='agent';text=listText('Key insights for '+a.name,a.insights)}
    if(!text&&/\brisk|concern|threat|worr/.test(ql)&&!/high[- ]?risk/.test(ql)){topic='agent';text=listText('Main risks for '+a.name,a.risks)}
    if(!text&&/recommend|next step|act on|what should|what do we do|action/.test(ql)&&!TOPIC_ORDER.some(function(t){return TOPICS[t].re.test(ql)})){topic='recs';text=recsText(a)}
    if(!text&&/chart|graph|visual|plot/.test(ql)){
      var c=a.chart,lb=c.months?monthLabels(req.periodEnd,c.values.length):c.labels;topic='agent';
      text='The chart shows '+c.title.toLowerCase()+': '+lb.map(function(l,i){return l+' '+fmt(c.values[i],c.unit)}).join(', ')+'. It uses the same sample dataset as the summary.';
    }
    // 3) shared topics; "why / increasing" questions go one level deeper
    if(!text){
      for(var i=0;i<TOPIC_ORDER.length;i++){var t=TOPIC_ORDER[i];if(TOPICS[t].re.test(ql)){var d=/\bwhy\b|increas|rising|grow|worse|cause|driv/.test(ql)?1:0;if(ctx.topic===t)d=Math.max(d,ctx.depth+1);useTopic(t,d);break}}
    }
    // 4) follow-up on the previous topic
    if(!text&&ctx.topic&&(/^(why|and|so|then|what about|how|tell me more|more|explain|elaborate|details?|go on|ok|okay|what next|next)\b/.test(ql))){
      if(TOPICS[ctx.topic])useTopic(ctx.topic,ctx.depth+1);else{topic='recs';text=recsText(a)}
    }
    // 5) help
    if(!text){topic=null;text=HEAD[req.categoryId]+' I can answer from the '+a.name+' sample data — for example “'+a.chips[0]+'” or “'+a.chips[1]+'”. You can also ask about key insights, risks, recommendations, aging, high-risk customers, collections, cash application, disputes, portal usage, DSO or KPIs.'}
    var prefix=topic&&topic!=='agent'&&topic!=='recs'?'Based on the sample '+CAT_NAME[req.categoryId]+' data: ':'';
    return later({origin:'sample',text:prefix+text,context:{topic:topic,depth:depth}},CHAT_LATENCY_MS);
  }
  function fmt(v,unit){
    if(unit==='usdM')return '$'+v.toFixed(2)+'M';
    if(unit==='usdK')return '$'+v+'K';
    if(unit==='pct')return v+'%';
    if(unit==='days')return v+' days';
    return v.toLocaleString('en-US');
  }
  function listCategories(){return Object.keys(CATALOG).map(function(id){return{id:id,name:CAT_NAME[id],agentCount:CATALOG[id].length}})}
  return {listAgents:listAgents,listCategories:listCategories,getSummary:getSummary,answer:answer,format:fmt};
})();
