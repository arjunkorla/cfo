(function(){
  // CFO overview page, in order: welcome banner (greeting + 4 key KPIs), O2C category launcher, CFO Executive Overview (remaining KPIs), Attention Center.
  var R=[],errs=[],net=[];
  window.addEventListener('error',function(e){errs.push(String(e.message||e.target&&e.target.src))},true);
  var of=window.fetch;window.fetch=function(u){net.push('fetch '+u);return of.apply(this,arguments)};
  var ox=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){net.push('xhr '+u);return ox.apply(this,arguments)};
  var $=function(id){return document.getElementById(id)};
  function ok(n,c,i){R.push({name:'['+innerWidth+'px overview] '+n,pass:!!c,info:i===undefined?'':String(i)})}
  function wait(ms){return new Promise(function(r){setTimeout(r,ms)})}
  function vis(el){if(typeof el==='string')el=$(el);return !!el&&!el.hidden&&el.getBoundingClientRect().width>0&&getComputedStyle(el).display!=='none'}
  function key(el,k){el.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true}))}
  function overlap(a,b){a=a.getBoundingClientRect();b=b.getBoundingClientRect();return a.left<b.right-0.5&&b.left<a.right-0.5&&a.top<b.bottom-0.5&&b.top<a.bottom-0.5}
  function cols(el){return getComputedStyle(el).gridTemplateColumns.split(' ').length}
  var CATS=['credit','collections','receivables','cash-app','disputes','portal-usage','efficiency','kpis'];
  var D_ALERTS=CFO_OVERVIEW.alerts;
  var AGENTS={};CFO_SAMPLE.listCategories().forEach(function(c){AGENTS[c.id]=CFO_SAMPLE.listAgents(c.id).map(function(a){return a.id})});
  function validRoute(href,needAgent){var m=/^cfo-workspace\.html\?category=([a-z-]+)(?:&agent=([a-z0-9-]+))?$/.exec(href);return !!m&&!!AGENTS[m[1]]&&(m[2]?AGENTS[m[1]].indexOf(m[2])>=0:!needAgent)}
  async function run(){
    await wait(300);
    var W=innerWidth,cw=document.documentElement.clientWidth,main=document.querySelector('main').getBoundingClientRect();
    // ---- page order: exactly four sections ----
    var order=[].map.call(document.querySelector('main').children,function(e){return e.id});
    ok('section order: welcome banner → categories → executive overview → attention center (only these four)',JSON.stringify(order)===JSON.stringify(['welcome','categories','executive','attention']),order.join());
    ok('GIA Executive Briefing and Management Action Tracker are removed',!$('briefing')&&!$('actions')&&!$('briefTag')&&!$('actionsTable')&&!/GIA Executive Briefing|Management Action Tracker/.test(document.querySelector('main').textContent)&&!document.querySelector('a[href="#actions"],a[href="#briefing"]'));
    // ---- welcome banner: greeting + 4 key KPIs ----
    var wb=$('welcome'),wbr=wb.getBoundingClientRect(),wcs=getComputedStyle(wb),sp=wb.querySelector('.wb-spark svg');
    ok('welcome banner: today’s date (weekday, month, day) and greeting',$('wbDate').textContent===new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})&&/^[A-Z][a-z]+day, [A-Z][a-z]+ \d{1,2}$/.test($('wbDate').textContent)&&$('wbGreet').textContent==='Welcome back, System Admin'&&wb.getAttribute('aria-labelledby')==='wbGreet',$('wbDate').textContent);
    ok('welcome banner: hero gradient, white text, rounded, shadow',/linear-gradient/.test(wcs.backgroundImage)&&getComputedStyle($('wbGreet')).color==='rgb(255, 255, 255)'&&parseFloat(wcs.borderTopLeftRadius)>=12&&wcs.boxShadow!=='none');
    ok('sparkle icon renders at the right, decorative (aria-hidden)',!!sp&&sp.querySelector('path')&&sp.getBoundingClientRect().width>0&&sp.getBoundingClientRect().right>wbr.left+wbr.width*0.8&&wb.querySelector('.wb-spark').getAttribute('aria-hidden')==='true');
    var bm=[].slice.call(document.querySelectorAll('#wbMetrics .wb-m'));
    ok('banner metrics: Total AR, Overdue AR, Cash Received, DSO with their CFO_OVERVIEW values',JSON.stringify(bm.map(function(m){return m.querySelector('.kpi-label').textContent+'='+m.querySelector('.kpi-value').textContent}))===JSON.stringify(CFO_OVERVIEW.kpis.filter(function(k){return ['total-ar','overdue-ar','cash-received','dso'].indexOf(k.id)>=0}).map(function(k){return k.label+'='+k.display}))&&bm.map(function(m){return m.querySelector('.kpi-value').textContent}).join()==='$8.6M,$2.4M,$5.2M,48 days'&&/JetBrains Mono/.test(getComputedStyle(bm[0].querySelector('.kpi-value')).fontFamily));
    ok('banner metrics: existing comparison where a sample trend exists (words, not colour alone), else the existing context line',bm[1].querySelector('.wb-cmp').textContent==='+$0.12M (+5.3%) vs prior month · Worse'&&bm[1].querySelector('.wb-cmp svg')&&bm[3].querySelector('.wb-cmp').textContent==='+1 day vs prior month · Worse'&&bm[0].querySelector('.wb-cmp.none').textContent===CFO_OVERVIEW.kpis[0].sub&&bm[2].querySelector('.wb-cmp.none').textContent===CFO_OVERVIEW.kpis[2].sub);
    ok('banner metrics are labelled sample data with the same snapshot date as the KPI section',/^Sample data · as of /.test($('wbNote').textContent)&&$('wbAsOf').textContent===$('asOf').textContent&&$('wbMetrics').getAttribute('aria-labelledby')==='wbMetricsTitle');
    ok('banner metric values link to their source agents',bm.every(function(m){var a=m.querySelector('a.wb-val');return a&&validRoute(a.getAttribute('href'),true)&&/view details for/.test(a.textContent)}));
    var mc=cols($('wbMetrics'));
    ok('banner metrics: 4 in a row, 2 × 2 on phones',mc===(W<768?2:4),mc);
    var hello=wb.querySelector('.wb-hello');
    ok('greeting, metrics and sparkle never overlap; nothing clipped',!overlap(hello,$('wbMetrics'))&&!overlap(hello,wb.querySelector('.wb-spark'))&&!overlap($('wbMetrics'),wb.querySelector('.wb-spark'))&&bm.every(function(m){return m.scrollWidth<=m.clientWidth+1&&m.querySelector('.wb-val').getBoundingClientRect().right<=m.getBoundingClientRect().right+0.5}));
    var maxH=W>=1280?150:W>=768?240:380;
    ok('banner is not excessively tall (≤ '+maxH+'px)',wbr.height<=maxH&&wbr.height>=100,Math.round(wbr.height));
    var bi=bm[1].querySelector('.kpi-info'),btip=$(bi.getAttribute('aria-describedby'));
    ok('banner tooltip keeps definition, context, formula, comparison, target, trend and source',bi.getAttribute('aria-label')==='About Overdue AR'&&btip.getAttribute('role')==='tooltip'&&/Context: 28% of total AR/.test(btip.textContent)&&/Overdue AR ÷ Total AR × 100/.test(btip.textContent)&&/vs prior month \(\$2\.28M\)/.test(btip.textContent)&&/Sample target: \$2\.0M · \$0\.4M above sample target/.test(btip.textContent)&&/Five-month trend: .*\$1\.92M, \$2\.05M, \$2\.14M, \$2\.28M, \$2\.40M/.test(btip.textContent)&&/SMP-KPI-01/.test(btip.textContent)&&btip.hidden);
    bi.focus();await wait(20);var br=btip.getBoundingClientRect();
    ok('banner tooltip shows on keyboard focus, inside the viewport',!btip.hidden&&bi.getAttribute('aria-expanded')==='true'&&br.left>=0&&br.right<=cw,Math.round(br.left)+'–'+Math.round(br.right));
    key(bi,'Escape');await wait(20);ok('Esc hides the tooltip',btip.hidden&&bi.getAttribute('aria-expanded')==='false');
    bi.click();await wait(20);var shownByClick=!btip.hidden;bi.click();await wait(20);
    ok('click toggles the tooltip (touch)',shownByClick&&btip.hidden);bi.blur();
    ok('DSO tooltip states the DSO method is not defined in the sample',/does not define the DSO method/.test($('tip-dso').textContent));
    ok('categories are a navigation landmark, directly below the welcome banner',$('categories').tagName==='NAV'&&$('categories').getAttribute('aria-labelledby')==='catTitle'&&$('catTitle').textContent==='O2C Intelligence Categories');
    if(W>=1024){var fc=document.querySelector('#cards .mcard').getBoundingClientRect();ok('desktop: the first row of category cards is visible without scrolling',fc.bottom<=innerHeight,Math.round(fc.bottom)+' / '+innerHeight)}
    // ---- executive overview: reporting context + remaining KPIs ----
    var eh=document.querySelector('.exec-head');
    ok('executive header: title, subtitle, snapshot date, trend months, sample-data label',$('pageTitle').textContent==='CFO Executive Overview'&&$('pageTitle').closest('section')===$('executive')&&/Order-to-Cash Financial Intelligence/.test(eh.textContent)&&$('asOf').textContent===new Date().toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric'})&&/^[A-Z][a-z]{2} \d{4} – [A-Z][a-z]{2} \d{4}$/.test($('trendRange').textContent)&&/Local sample data · not live/.test($('dataChip').textContent));
    ok('no period selector, entity filter or refresh control (not supported by the sample data)',!document.querySelector('main select, main input[type="date"], main [data-refresh]')&&!/refresh/i.test(eh.textContent));
    var kp=[].slice.call(document.querySelectorAll('#kpis .kpi'));
    ok('remaining KPIs: Unapplied Cash and Dispute Exposure with their values',JSON.stringify(kp.map(function(k){return k.querySelector('.kpi-label').textContent+'='+k.querySelector('.kpi-value').textContent}))===JSON.stringify(['Unapplied Cash=$500K','Dispute Exposure=$1.25M']));
    var allLabels=bm.concat(kp).map(function(k){return k.querySelector('.kpi-label').textContent});
    ok('all six KPIs shown exactly once (no duplicates between banner and section)',allLabels.length===6&&allLabels.slice().sort().join()===CFO_OVERVIEW.kpis.map(function(k){return k.label}).sort().join()&&document.querySelectorAll('.kpi-tip').length===6);
    ok('KPI grid: 2 columns',cols($('kpis'))===2,cols($('kpis')));
    ok('KPI values and text never clipped',kp.every(function(k){var v=k.querySelector('.kpi-value');return v.scrollWidth<=v.clientWidth+1&&k.scrollWidth<=k.clientWidth+1}));
    ok('no invented comparison: the 4 KPIs without a prior period say so in their tooltip',[].filter.call(document.querySelectorAll('.kpi-tip'),function(t){return /Comparison: No prior period in the sample/.test(t.textContent)}).length===4);
    ok('no decorative charts (only icon SVGs)',[].every.call(document.querySelectorAll('#kpis svg, #wbMetrics svg'),function(g){return g.parentNode.classList.contains('ic')}));
    ok('KPI “View details” links go to existing workspace routes',kp.every(function(k){return validRoute(k.querySelector('.kpi-foot a').getAttribute('href'),true)}));
    var ib=kp[0].querySelector('.kpi-info'),tip=$(ib.getAttribute('aria-describedby'));
    ib.focus();await wait(20);var tr=tip.getBoundingClientRect();
    ok('section KPI tooltip on focus, inside the viewport',!tip.hidden&&/\$0\.07M over 30 days|Unapplied/.test(tip.textContent)&&tr.left>=0&&tr.right<=cw);
    key(ib,'Escape');await wait(20);ib.blur();
    // ---- Attention Center ----
    var rows=function(){return [].slice.call(document.querySelectorAll('#alerts .al-row'))};
    var r0=rows();
    ok('Attention Center: critical and high alerts first (4 by default), ranked',r0.length===4&&JSON.stringify(r0.map(function(r){return r.querySelector('.sev').textContent}))===JSON.stringify(['Critical','High','High','High']));
    ok('severity shown with text + icon (not colour alone); summary counts',r0.every(function(r){return r.querySelector('.sev svg')})&&/1 critical/.test($('alSum').textContent)&&/3 high/.test($('alSum').textContent)&&/2 medium/.test($('alSum').textContent)&&/2 informational/.test($('alSum').textContent));
    ok('each alert: title, impact, category and a contextual action to an existing route',r0.every(function(r){var a=r.querySelector('a.al-act');return r.querySelector('.al-title').textContent&&/Impact/.test(r.querySelector('.al-meta').textContent)&&a&&validRoute(a.getAttribute('href'),true)}));
    var why=r0[0].querySelector('details.al-why');
    function shown(el){return el.checkVisibility({contentVisibilityAuto:true,visibilityProperty:true})&&el.getBoundingClientRect().width>0}
    ok('explanation collapsed by default behind a labelled disclosure',r0.every(function(r){var d=r.querySelector('details.al-why');return d&&!d.open&&d.querySelector('.al-text').textContent&&!shown(d.querySelector('.al-text'))&&d.querySelector('summary').textContent==='Why it’s flagged: '+r.querySelector('.al-title').textContent}),why.querySelector('summary').textContent);
    var closedH=why.getBoundingClientRect().height;
    why.querySelector('summary').click();await wait(20);
    ok('disclosure opens the explanation and scope',why.open&&why.getBoundingClientRect().height>closedH+20&&why.querySelector('.al-text').getBoundingClientRect().height>0&&why.querySelector('.al-scope').getBoundingClientRect().height>0,closedH+' → '+why.getBoundingClientRect().height);
    why.querySelector('summary').click();await wait(10);
    ok('owner / due shown only where the sample states them',/Owner: Collectors/.test(r0[0].querySelector('.al-meta').textContent)&&!/Owner/.test(r0[3].querySelector('.al-meta').textContent));
    ok('only one red (critical) alert; no warning banners',document.querySelectorAll('#alerts .sev.critical').length===1&&!document.querySelector('[role="alert"]'));
    var more=$('alMore');
    ok('“Show all 8 alerts” toggle',vis(more)&&more.textContent==='Show all 8 alerts'&&more.getAttribute('aria-expanded')==='false');
    more.click();await wait(20);
    ok('expanded: 8 alerts incl. informational; focus moves to the first new alert',rows().length===8&&rows()[7].querySelector('.sev').textContent==='Informational'&&more.getAttribute('aria-expanded')==='true'&&more.textContent==='Show critical and high only'&&document.activeElement===rows()[4].querySelector('a.al-act'));
    ok('medium alert keeps its sample due date',/Due: This month/.test(rows()[4].querySelector('.al-meta').textContent));
    more.click();await wait(20);ok('collapse back to critical and high',rows().length===4);
    ok('ranking rule disclosed (rule-based, not live monitoring)',/Rule-based on sample data — not live monitoring/.test(document.querySelector('.al-rule summary').textContent)&&/\$0\.5M or more at stake/.test(document.querySelector('.al-rule').textContent));
    CFOOverview.renderAlerts([]);await wait(10);
    ok('empty state when no alert matches',/No alerts need attention/.test($('alerts').textContent)&&!rows().length&&$('alMore').hidden&&$('alSum').textContent==='');
    CFOOverview.renderAlerts(D_ALERTS.filter(function(a){return a.severity==='medium'||a.severity==='info'}));await wait(10);
    ok('no critical/high alerts: top 3 shown, toggle labelled accordingly',rows().length===3&&$('alMore').textContent==='Show all 4 alerts');
    CFOOverview.renderAlerts();await wait(10);ok('alerts restored',rows().length===4);
    // ---- category cards ----
    var cards=[].slice.call(document.querySelectorAll('#cards .mcard'));
    ok('8 category cards keep their ids and workspace routes, in order',JSON.stringify(cards.map(function(a){return a.getAttribute('href')}))===JSON.stringify(CATS.map(function(c){return 'cfo-workspace.html?category='+c})));
    var agentTotal=CFO_SAMPLE.listCategories().reduce(function(t,c){return t+c.agentCount},0);
    ok('each card: icon, name, description, one status (icon + text), agent count from CFO_SAMPLE; no metrics',cards.every(function(a){var c=CFO_SAMPLE.listCategories().filter(function(x){return x.id===a.getAttribute('data-cat')})[0];return a.querySelector('.tile svg')&&a.querySelector('.title').textContent&&a.querySelector('.desc').textContent&&a.querySelectorAll('.status').length===1&&a.querySelector('.status svg')&&/^(Needs attention|Watch|No major alerts)$/.test(a.querySelector('.status').textContent)&&a.querySelector('.ai-tag').textContent===c.agentCount+' AI agents'&&!a.querySelector('dl, .font-data')}));
    ok('category count and agent total come from CFO_SAMPLE',$('catCount').textContent==='8 categories · '+agentTotal+' AI agents',$('catCount').textContent);
    ok('statuses follow the documented rule',JSON.stringify(cards.map(function(a){return a.querySelector('.status').textContent}))===JSON.stringify(['Needs attention','Needs attention','Needs attention','Needs attention','Needs attention','No major alerts','No major alerts','Needs attention']));
    ok('card footer: status on one line, nothing overlaps (status, agent count, chevron, title)',cards.every(function(a){var s=a.querySelector('.status'),t=a.querySelector('.ai-tag'),c=a.querySelector('.chev'),r=a.getBoundingClientRect(),sr=s.getBoundingClientRect();return sr.height<=16&&sr.right<=r.right&&!overlap(s,t)&&!overlap(s,c)&&!overlap(c,a.querySelector('.title'))&&!overlap(c,a.querySelector('.desc'))}),cards.filter(function(a){var s=a.querySelector('.status');return s.getBoundingClientRect().height>16||overlap(s,a.querySelector('.chev'))||overlap(a.querySelector('.chev'),a.querySelector('.title'))}).map(function(a){return a.getAttribute('data-cat')}).join());
    ok('card text never clipped',cards.every(function(a){return a.scrollWidth<=a.clientWidth+1&&a.scrollHeight<=a.clientHeight+1}));
    ok('category grid: 4 columns ≥1024px, 2 at 768–1023px, 1 on phones',cols($('cards'))===(W>=1024?4:W>=768?2:1),cols($('cards')));
    var hs=cards.slice(0,cols($('cards'))).map(function(a){return Math.round(a.getBoundingClientRect().height)});
    ok('consistent card heights in a row',hs.every(function(h){return h===hs[0]}),hs.join());
    cards[0].focus();ok('cards are keyboard-focusable with a visible focus ring',document.activeElement===cards[0]&&getComputedStyle(cards[0]).boxShadow!=='none');cards[0].blur();
    // ---- page-wide ----
    var txt=document.querySelector('main').textContent;
    ok('no AI-generation, live or real-time claims',!/AI[- ]generated|generated by (the )?(AI|model|LLM)|real[- ]time|live monitoring(?! )/.test(txt.replace('not live monitoring','')));
    ok('heading structure: one h1, h2s for banner metrics, categories, KPIs, alerts',document.querySelectorAll('h1').length===1&&document.querySelectorAll('main h2').length===4);
    var rail=$('ealRail');
    ok('content clear of the right launcher rail',!rail||!vis(rail)||main.right<=rail.getBoundingClientRect().left+0.5);
    // ---- navigation targets work (agent deep link uses the existing ?agent= parameter) ----
    if(W===1440){
      var fr=document.createElement('iframe');fr.style.cssText='position:absolute;left:-9999px;width:1400px;height:800px';fr.src='cfo-workspace.html?category=disputes&agent=dsp-priority';document.body.appendChild(fr);
      await wait(2500);var d=fr.contentDocument,act=d&&d.querySelector('.agent-row.active');
      ok('alert/action deep link opens the right category and agent in the workspace',!!act&&/High-Priority Disputes/.test(act.textContent)&&/disputes/i.test(d.querySelector('[role="tab"][aria-selected="true"]').textContent),act&&act.textContent);
      fr.remove();
    }
    ok('no network requests',!net.length&&!performance.getEntriesByType('resource').some(function(e){return !/^file:|^data:|^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(e.name)}),net.join());
    ok('no horizontal page scroll',document.documentElement.scrollWidth<=innerWidth+1,document.documentElement.scrollWidth);
    ok('no JS errors',!errs.length,errs.join(' | '));
    var o=document.createElement('pre');o.id='harnessOut';o.textContent=JSON.stringify(R);document.body.appendChild(o);
  }
  window.addEventListener('load',function(){run().catch(function(e){var o=document.createElement('pre');o.id='harnessOut';o.textContent=JSON.stringify(R.concat([{name:'harness crashed',pass:false,info:e.stack}]));document.body.appendChild(o)})});
})();
