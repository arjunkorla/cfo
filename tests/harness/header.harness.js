(function(){
  var R=[],errs=[],net=[],nav=[];
  window.addEventListener('error',function(e){errs.push(String(e.message||e.target&&e.target.src))},true);
  // record any script-initiated network use (none is allowed)
  var of=window.fetch;window.fetch=function(u){net.push('fetch '+u);return of.apply(this,arguments)};
  var ox=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){net.push('xhr '+u);return ox.apply(this,arguments)};
  if(navigator.sendBeacon){var ob=navigator.sendBeacon.bind(navigator);navigator.sendBeacon=function(u){net.push('beacon '+u);return ob.apply(null,arguments)}}
  var $=function(id){return document.getElementById(id)};
  var PAGE=location.pathname.split('/').pop(),WS=PAGE==='cfo-workspace.html';
  function ok(n,c,i){R.push({name:'['+innerWidth+'px '+PAGE+'] '+n,pass:!!c,info:i===undefined?'':String(i)})}
  function wait(ms){return new Promise(function(r){setTimeout(r,ms)})}
  function vis(el){if(typeof el==='string')el=$(el);return !!el&&!el.hidden&&!el.closest('[hidden]')&&el.getBoundingClientRect().width>0}
  function key(el,k,o){el.dispatchEvent(new KeyboardEvent('keydown',Object.assign({key:k,bubbles:true,cancelable:true},o||{})))}
  function inView(el){var r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+0.5&&r.top>=0&&r.bottom<=innerHeight+0.5}
  function toastText(){return $('toasts').textContent}
  async function type(v){var i=$('ehSearch');i.focus();i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}));await wait(20)}
  var LANGS=['English','Español','Português','Italiano','Français','中文','日本語','한국어','Deutsch','Polski','Català'];
  var FLAGS=['gb','es','pt','it','fr','cn','jp','kr','de','pl','es-ct'];
  async function run(){
    await wait(300);
    var hdr=document.querySelector('header.topbar[data-emagia-header]'),desk=innerWidth>=1024;
    ok('shared header rendered',hdr&&hdr.children.length===2&&$('menuBtn'));
    ok('header height unchanged (56px)',Math.round(hdr.getBoundingClientRect().height)===56,hdr.getBoundingClientRect().height);
    // ---- branding ----
    var logo=hdr.querySelector('.eh-logo');
    ok('brand logo before breadcrumbs, loaded, with alt text',logo&&logo.complete&&logo.naturalWidth>0&&/Emagia/.test(logo.alt)&&(logo.compareDocumentPosition(hdr.querySelector('.crumb'))&4));
    ok('logo keeps its aspect ratio',Math.abs(logo.getBoundingClientRect().width-logo.getBoundingClientRect().height)<1);
    // ---- breadcrumbs ----
    var crumbs=[].slice.call(hdr.querySelectorAll('.crumb li'));
    ok('Home crumb is not a fake link',crumbs[0]&&!crumbs[0].querySelector('a')&&/Home/.test(crumbs[0].textContent));
    if(WS){
      ok('workspace crumbs: Home › CFO (link) › category (current)',crumbs.length===3&&crumbs[1].querySelector('a[href="cfo-overview.html"]')&&crumbs[2].querySelector('[aria-current="page"] #crumbCat'));
      ok('category crumb follows the active tab',$('crumbCat').textContent===document.querySelector('#catTabs .tab[aria-selected="true"]').textContent.trim());
    }else ok('overview crumbs: Home › CFO (current)',crumbs.length===2&&crumbs[1].querySelector('[aria-current="page"]')&&/CFO/.test(crumbs[1].textContent));
    var sb=$('ehSearchBtn'),right=hdr.querySelector('.tb-right');
    ok('no permanent search field in the header; search icon only',!hdr.querySelector('input')&&!$('ehSearch')&&vis(sb)&&sb.getAttribute('aria-label')==='Open Global Search'&&sb.getAttribute('aria-haspopup')==='dialog'&&sb.querySelector('svg'));
    ok('right group order: search · language · help · System Admin',right.firstElementChild===sb&&(sb.compareDocumentPosition($('ehLangBtn'))&4)&&($('ehLangBtn').compareDocumentPosition($('ehHelpBtn'))&4)&&($('ehHelpBtn').compareDocumentPosition($('ehUserBtn'))&4));
    var sbr=sb.getBoundingClientRect(),hbr=$('ehHelpBtn').getBoundingClientRect();
    ok('search icon matches the help icon button (size, alignment)',Math.round(sbr.width)===Math.round(hbr.width)&&Math.round(sbr.height)===Math.round(hbr.height)&&Math.abs(sbr.top-hbr.top)<1&&sbr.width>=24);
    if(desk){
      var L=[hdr.querySelector('.eh-brand'),hdr.querySelector('.crumb'),right].map(function(e){return e.getBoundingClientRect()});
      ok('single row, no overlap: logo | breadcrumb … actions',L[0].right<=L[1].left&&L[1].right<=L[2].left+0.5&&L.every(function(r){return r.top>=0&&r.bottom<=56}),L.map(function(r){return Math.round(r.left)+'-'+Math.round(r.right)}).join(' '));
    }
    // ---- Global Search modal ----
    var ALLOWED={},S=window.CFO_SAMPLE;
    S.listCategories().forEach(function(c){ALLOWED[c.name]=1;ALLOWED['Open '+c.name]=1;S.listAgents(c.id).forEach(function(a){ALLOWED[a.name]=1})});
    ['CFO Overview','CFO Workspace','Open CFO Overview','Open CFO Workspace','Open Help','View Keyboard Shortcuts'].forEach(function(t){ALLOWED[t]=1});
    function titles(){return [].map.call($('ehResults').querySelectorAll('.eh-sr-opt-title'),function(t){return t.textContent})}
    function groupsOf(){return [].map.call($('ehResults').querySelectorAll('[role="group"]'),function(g){return $(g.getAttribute('aria-labelledby')).textContent})}
    sb.click();await wait(40);dlg=D();var inp=$('ehSearch');
    var dr=dlg.getBoundingClientRect(),dcs=getComputedStyle(dlg);
    ok('icon opens the centred Search modal on this page with focus in the input',dlg.open&&dlg.dataset.modal==='search'&&dlg.matches(':modal')&&$('ehDlgTitle').textContent==='Search'&&document.activeElement===inp&&openCount()===1&&location.href.indexOf(PAGE)>=0);
    ok('dialog semantics: role, aria-modal, labelled; × has a label',dlg.getAttribute('role')==='dialog'&&dlg.getAttribute('aria-modal')==='true'&&dlg.getAttribute('aria-labelledby')==='ehDlgTitle'&&!dlg.hasAttribute('aria-describedby')&&dlg.querySelector('.eh-dlg-close').getAttribute('aria-label')==='Close'&&vis(dlg.querySelector('.eh-dlg-close')));
    ok('≤720px wide, centred, inside the viewport; no top accent, subtle 1px border',dr.width<=720.5&&Math.abs((dr.left+dr.right)/2-document.documentElement.clientWidth/2)<2&&fits(dlg)&&dcs.borderTopColor==="rgb(230, 231, 234)"&&dcs.borderTopWidth==="1px"&&dcs.borderLeftWidth==="1px"&&(innerWidth<768||dr.height<=innerHeight*0.8+1),[Math.round(dr.left),Math.round(dr.top),Math.round(dr.width),Math.round(dr.height)].join(','));
    ok('combobox + listbox pattern',inp.getAttribute('role')==='combobox'&&inp.getAttribute('aria-controls')==='ehResults'&&$('ehResults').getAttribute('role')==='listbox'&&inp.getAttribute('aria-label')&&/run an action/.test(inp.placeholder)&&!/compan|letter|module/i.test(inp.placeholder));
    ok('no recent history yet: Recent omitted, Quick actions shown',JSON.stringify(groupsOf())==='["Quick actions"]',groupsOf().join());
    var qa=titles();
    ok('quick actions: only real destinations/actions for this page',qa.every(function(t){return ALLOWED[t]})&&qa.indexOf(WS?'Open CFO Overview':'Open CFO Workspace')===0&&qa.indexOf(WS?'Open CFO Workspace':'Open CFO Overview')<0&&qa.filter(function(t){return /^Open /.test(t)&&!/CFO|Help/.test(t)}).length===8&&qa.indexOf('Open Help')>=0&&!/Upload|Add company|Holiday|Security|Customer profile/i.test(qa.join()),qa.join('|'));
    ok('first option highlighted (aria-activedescendant + aria-selected)',$(inp.getAttribute('aria-activedescendant'))===$('ehResults').querySelector('[role="option"]')&&$('ehResults').querySelector('[aria-selected="true"]')&&/quick actions/.test($('ehStatus').textContent));
    var scl=dlg.querySelector('.eh-sr-scroll');
    ok('results scroll inside the modal; input stays visible',getComputedStyle(scl).overflowY==='auto'&&fits(inp)&&scl.scrollWidth<=scl.clientWidth+1&&document.documentElement.scrollWidth<=innerWidth+1);
    await type('collect');
    var opts=[].slice.call($('ehResults').querySelectorAll('[role="option"]'));
    ok('typing filters actual CFO data (dynamic, no reload)',opts.length>0&&opts.every(function(o){return /collect/i.test(o.textContent)})&&titles().every(function(t){return ALLOWED[t]})&&inp.getAttribute('aria-expanded')==='true'&&JSON.stringify(groupsOf())==='["Results"]',titles().join('|'));
    ok('result shows icon, title, type/context and description',opts.some(function(o){return o.querySelector('svg')&&o.querySelector('.eh-sr-opt-title').textContent==='Collections Prioritization'&&o.querySelector('.eh-sr-opt-sub').textContent==='Agent · Collections'&&o.querySelector('.eh-sr-opt-desc')}));
    var o0=getComputedStyle(opts[0]),o0r=opts[0].querySelector('.eh-sr-opt-title').getBoundingClientRect(),o1r=opts[1].querySelector('.eh-sr-opt-title').getBoundingClientRect();
    ok('highlighted result: light-blue background, no left-border indicator, “↵ Open” cue (not colour alone)',o0.backgroundColor==='rgb(238, 242, 252)'&&o0.boxShadow==='none'&&o0.borderLeftWidth==='0px'&&getComputedStyle(opts[0].querySelector('.eh-sr-enter')).visibility==='visible'&&getComputedStyle(opts[1].querySelector('.eh-sr-enter')).visibility==='hidden'&&opts[0].querySelector('.eh-sr-enter').getAttribute('aria-hidden')==='true',o0.boxShadow);
    ok('highlight causes no shift (titles aligned across rows)',Math.abs(o0r.left-o1r.left)<0.5);
    key(inp,'ArrowDown');var act=$(inp.getAttribute('aria-activedescendant'));
    ok('ArrowDown moves to the next result',act===opts[1]&&opts[1].getAttribute('aria-selected')==='true'&&opts[0].getAttribute('aria-selected')==='false');
    key(inp,'ArrowUp');key(inp,'ArrowUp');ok('ArrowUp moves back and wraps to the last',$(inp.getAttribute('aria-activedescendant'))===opts[opts.length-1]);
    ok('results announced politely',/results/.test($('ehStatus').textContent)&&$('ehStatus').getAttribute('aria-live')==='polite');
    await type('zzqx');ok('no-results state',vis('ehNote')&&/No agents, categories, pages or actions match/.test($('ehNote').textContent)&&!$('ehResults').children.length&&inp.getAttribute('aria-expanded')==='false'&&$('ehStatus').textContent==='No results');
    ok('clear control appears with text',vis('ehSearchClear'));
    $('ehSearchClear').click();await wait(20);ok('clear resets the query, keeps focus, back to suggestions',inp.value===''&&document.activeElement===inp&&!vis('ehSearchClear')&&groupsOf().indexOf('Quick actions')>=0);
    insideClick();await wait(20);ok('click inside keeps the modal open',dlg.open);
    var fo=[].filter.call(dlg.querySelectorAll('button, input'),function(e){return !e.disabled&&e.getClientRects().length});
    fo[fo.length-1].focus();key(fo[fo.length-1],'Tab');var t1=document.activeElement===fo[0];key(fo[0],'Tab',{shiftKey:true});
    ok('Tab stays inside the modal',t1&&document.activeElement===fo[fo.length-1]);
    if(WS){inp.focus();key(inp,'Enter',{ctrlKey:true});await wait(30);ok('page shortcuts don’t fire behind the modal',!vis('stLoading')&&dlg.open)}
    inp.focus();key(inp,'Escape');await wait(30);ok('Escape closes; focus returns to the search icon',!dlg.open&&document.activeElement===sb);
    sb.click();await wait(30);dlg.querySelector('.eh-dlg-close').click();await wait(30);ok('× closes; focus returns to the search icon',!dlg.open&&document.activeElement===sb);
    sb.click();await wait(30);backdropClick();await wait(30);ok('backdrop click closes; focus returns to the search icon',!dlg.open&&document.activeElement===sb);
    key(document.body,'k',{ctrlKey:true});await wait(30);ok('Ctrl+K opens Global Search',dlg.open&&dlg.dataset.modal==='search'&&document.activeElement===$('ehSearch'));
    // selection performs the real navigation/action and closes the modal
    EmagiaHeader.navigate=function(u){nav.push(u)};
    await type('dispute triage');key($('ehSearch'),'Enter');await wait(60);
    if(WS){
      await wait(950);
      ok('Enter opens the agent in place via existing selection (tab, agent, summary); modal closed',!dlg.open&&document.querySelector('#catTabs .tab[aria-selected="true"]').dataset.cat==='disputes'&&$('crumbCat').textContent==='Disputes'&&document.querySelector('#agentList .agent-main[aria-current="true"] .agent-name').textContent==='Dispute Triage'&&$('sumAgent').textContent==='Dispute Triage'&&!nav.length,nav.join());
      ok('focus goes to the opened agent',document.activeElement&&document.activeElement.closest('#agentList'));
      // an agent opened directly in the workspace is a real visit
      var rows=document.querySelectorAll('#agentList .agent-main');rows[1].click();await wait(950);
    }else ok('Enter on an agent navigates to the workspace with category + agent; modal closed',!dlg.open&&nav[0]==='cfo-workspace.html?category=disputes&agent=dsp-triage',nav.join());
    sb.click();await wait(40);
    var rec=[].slice.call($('ehResults').querySelectorAll('.eh-sr-opt.is-recent'));
    var expectRecent=WS?[document.querySelectorAll('#agentList .agent-main .agent-name')[1].textContent,'Dispute Triage']:['Dispute Triage'];
    ok('Recent shows actual visits only, newest first, labelled “Recently visited”',groupsOf()[0]==='Recent'&&JSON.stringify(rec.map(function(o){return o.querySelector('.eh-sr-opt-title').textContent}))===JSON.stringify(expectRecent)&&rec.every(function(o){return /^Recently visited/.test(o.querySelector('.eh-sr-opt-sub').textContent)})&&rec[0].getAttribute('aria-selected')==='true',rec.map(function(o){return o.textContent}).join('|'));
    var stored=null;try{stored=JSON.parse(localStorage.getItem('erms.emagia.search.recent'))}catch(e){}
    ok('Recent stored as a small preference list (no fabricated entries)',Array.isArray(stored)&&stored.length===expectRecent.length&&stored.every(function(e){return e.type==='Agent'&&e.cat&&e.agent}),JSON.stringify(stored));
    // quick action: open a category
    var kp=[].filter.call($('ehResults').querySelectorAll('[role="option"]'),function(o){return o.querySelector('.eh-sr-opt-title').textContent==='Open KPIs'})[0];
    kp.click();await wait(80);
    if(WS)ok('quick action “Open KPIs” switches the category in place; modal closed',!dlg.open&&document.querySelector('#catTabs .tab[aria-selected="true"]').dataset.cat==='kpis'&&nav.length===0);
    else ok('quick action “Open KPIs” navigates to the workspace category; modal closed',!dlg.open&&nav[nav.length-1]==='cfo-workspace.html?category=kpis',nav.join());
    // recent item opens its destination
    sb.click();await wait(40);
    var r0=$('ehResults').querySelector('.eh-sr-opt.is-recent');
    ok('category visit recorded first in Recent',r0&&r0.querySelector('.eh-sr-opt-title').textContent==='KPIs');
    var dRec=[].filter.call($('ehResults').querySelectorAll('.eh-sr-opt.is-recent'),function(o){return o.querySelector('.eh-sr-opt-title').textContent==='Dispute Triage'})[0];
    dRec.click();await wait(WS?1000:60);
    if(WS)ok('recent item opens its real destination in place',!dlg.open&&document.querySelector('#catTabs .tab[aria-selected="true"]').dataset.cat==='disputes'&&$('sumAgent').textContent==='Dispute Triage');
    else ok('recent item navigates to its real destination',!dlg.open&&nav[nav.length-1]==='cfo-workspace.html?category=disputes&agent=dsp-triage',nav.join());
    // quick action that opens a header popup (replaces the search popup; focus still returns to the search icon)
    sb.click();await wait(40);
    var hq=[].filter.call($('ehResults').querySelectorAll('[role="option"]'),function(o){return o.querySelector('.eh-sr-opt-title').textContent==='Open Help'})[0];
    hq.click();await wait(40);ok('“Open Help” replaces the search modal with Help (one modal)',dlg.open&&dlg.dataset.modal==='help'&&openCount()===1);
    key(document.activeElement,'Escape');await wait(30);ok('closing it returns focus to the search icon',!dlg.open&&document.activeElement===sb);
    // page result on its own page does not reload
    var navN=nav.length;sb.click();await wait(30);await type(WS?'cfo workspace':'cfo overview');key($('ehSearch'),'Enter');await wait(40);
    ok('page result for the current page just closes (no reload)',!dlg.open&&nav.length===navN&&document.activeElement===sb);
    // clear recent
    sb.click();await wait(40);ok('Clear recent control shown with history',vis('ehRecentClear')||innerWidth<768&&!!$('ehRecentClear')&&!$('ehRecentClear').hidden);
    $('ehRecentClear').click();await wait(20);
    var st2=null;try{st2=localStorage.getItem('erms.emagia.search.recent')}catch(e){}
    ok('Clear recent empties history and hides Recent',groupsOf()[0]==='Quick actions'&&st2==='[]'&&/cleared/.test($('ehStatus').textContent)&&document.activeElement===$('ehSearch'));
    // stale entries are dropped, never shown
    try{localStorage.setItem('erms.emagia.search.recent',JSON.stringify([{type:'Agent',cat:'credit',agent:'no-such-agent'}]))}catch(e){}
    await type('x');await type('');ok('unknown stored entries are not shown',groupsOf()[0]==='Quick actions');
    try{localStorage.removeItem('erms.emagia.search.recent')}catch(e){}
    key($('ehSearch'),'Escape');await wait(30);
    // ---- language ----
    var lb=$('ehLangBtn');
    ok('English by default with GB flag',/English/.test(lb.getAttribute('aria-label'))&&/gb\.svg$/.test(lb.querySelector('img').src)&&(!desk||lb.querySelector('.lang-label').textContent==='English'));
    lb.click();await wait(30);
    var pop=$('ehLangPop'),items=[].slice.call(pop.querySelectorAll('[role="menuitemradio"]'));
    ok('menu opens with exactly 11 languages in order',vis(pop)&&JSON.stringify(items.map(function(i){return i.textContent.trim()}))===JSON.stringify(LANGS),items.map(function(i){return i.textContent.trim()}).join('|'));
    var fl=items.map(function(i){return i.querySelector('img')});
    ok('flags: correct files, decorative, loaded',fl.every(function(im,i){return im.src.split('/').pop()===FLAGS[i]+'.svg'&&im.alt===''&&im.getAttribute('aria-hidden')==='true'&&im.complete&&im.naturalWidth>0}));
    ok('only English checked; focus on it',items.filter(function(i){return i.getAttribute('aria-checked')==='true'}).length===1&&items[0].getAttribute('aria-checked')==='true'&&document.activeElement===items[0]);
    var cs=getComputedStyle(pop),c0=getComputedStyle(items[0]),c1=getComputedStyle(items[1]),fr=fl[0].getBoundingClientRect();
    ok('reference styling: w-52, max-h-80, rounded-sm, shadow, py-1',Math.round(pop.getBoundingClientRect().width)===208&&parseFloat(cs.maxHeight)<=320&&cs.borderTopLeftRadius==='10px'&&cs.boxShadow!=='none'&&cs.paddingTop==='4px',[pop.getBoundingClientRect().width,cs.maxHeight,cs.borderTopLeftRadius,cs.paddingTop].join(' '));
    ok('item: py-2.5, flag 16×12, selected border/background/text/weight',c0.paddingTop==='10px'&&Math.round(fr.width)===16&&Math.round(fr.height)===12&&c0.borderLeftColor==='rgb(30, 67, 155)'&&c0.backgroundColor==='rgb(238, 242, 252)'&&c0.color==='rgb(18, 41, 94)'&&c0.fontWeight==='500'&&c1.borderLeftColor==='rgba(0, 0, 0, 0)',[c0.paddingTop,fr.width,fr.height,c0.borderLeftColor,c0.backgroundColor,c0.color,c0.fontWeight].join(' '));
    ok('menu inside the viewport',inView(pop));
    key(items[0],'ArrowDown');ok('ArrowDown moves focus',document.activeElement===items[1]);
    key(items[1],'End');ok('End moves to last',document.activeElement===items[10]);
    key(items[10],'Escape');await wait(10);ok('Escape closes and returns focus to the trigger',!vis(pop)&&document.activeElement===lb&&lb.getAttribute('aria-expanded')==='false');
    key(lb,'ArrowDown');await wait(20);var it=[].slice.call(pop.querySelectorAll('[role="menuitemradio"]'));
    for(var n=0;n<8;n++)key(document.activeElement,'ArrowDown');
    ok('keyboard reaches Deutsch',document.activeElement===it[8]);
    key(it[8],'Enter');await wait(30);
    var saved=null;try{saved=localStorage.getItem('erms.emagia.language')}catch(e){}
    ok('selecting updates trigger, closes menu, persists, focus back',!vis(pop)&&/Deutsch/.test(lb.getAttribute('aria-label'))&&/de\.svg$/.test(lb.querySelector('img').src)&&saved==='de'&&document.activeElement===lb&&it[8].getAttribute('aria-checked')==='true'&&it[0].getAttribute('aria-checked')==='false');
    ok('LTR and page language unchanged',document.documentElement.getAttribute('lang')==='en'&&(document.documentElement.getAttribute('dir')||'ltr')==='ltr'&&getComputedStyle(document.body).direction==='ltr'&&getComputedStyle(hdr).direction==='ltr');
    ok('honest confirmation (not translated)',/Language set to Deutsch\. Page content stays in English/.test(toastText()));
    lb.click();await wait(20);it[9].click();await wait(20);ok('mouse selection works (Polski)',/Polski/.test(lb.getAttribute('aria-label'))&&!vis(pop));
    // persistence across pages
    var fr2=document.createElement('iframe');fr2.style.cssText='position:absolute;left:-9999px;width:1200px;height:600px';fr2.src=WS?'cfo-overview.html':'cfo-workspace.html';document.body.appendChild(fr2);
    await wait(1200);var other=null;try{other=fr2.contentDocument.getElementById('ehLangBtn').getAttribute('aria-label')}catch(e){other='blocked: '+e.message}
    ok('language persists on the other CFO page',/Polski/.test(other||''),other);fr2.remove();
    lb.click();await wait(20);pop.querySelectorAll('[role="menuitemradio"]')[0].click();await wait(20);
    // ---- shared modal helpers ----
    var dlg=null;
    function D(){return document.getElementById('ehModal')}
    function openCount(){return document.querySelectorAll('dialog[open]').length}
    function storageSnap(){var o={};try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);o[k]=localStorage.getItem(k)}}catch(e){}var s={};try{for(var j=0;j<sessionStorage.length;j++){var q=sessionStorage.key(j);s[q]=sessionStorage.getItem(q)}}catch(e){}return JSON.stringify([o,s])}
    function pageState(){
      if(!WS)return location.href+'|'+document.title;
      var t=document.querySelector('#catTabs .tab[aria-selected="true"]'),a=document.querySelector('#agentList .agent-main[aria-current="true"]');
      return [location.href,t&&t.dataset.cat,a&&a.textContent.trim(),$('sumAgent').textContent,$('thread').children.length,vis('stResult'),document.querySelector('#chartType [aria-pressed="true"]')&&document.querySelector('#chartType [aria-pressed="true"]').textContent.trim()].join('|');
    }
    function inDlg(){var d=D();return !!d&&d.contains(document.activeElement)}
    function backdropClick(){var d=D();d.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));d.dispatchEvent(new MouseEvent('click',{bubbles:true}))}
    function insideClick(){var b=$('ehDlgBody');b.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));b.dispatchEvent(new MouseEvent('click',{bubbles:true}))}
    function fits(el){var r=el.getBoundingClientRect();return r.left>=-0.5&&r.right<=innerWidth+0.5&&r.top>=-0.5&&r.bottom<=innerHeight+0.5}
    async function openFromUser(i,viaKey){
      var ub=$('ehUserBtn');
      if(viaKey){key(ub,'ArrowDown');await wait(20);var its=[].slice.call($('ehUserMenu').querySelectorAll('[role="menuitem"]'));for(var n=0;n<i;n++)key(document.activeElement,'ArrowDown');key(its[i],'Enter')}
      else{ub.click();await wait(20);$('ehUserMenu').querySelectorAll('[role="menuitem"]')[i].click()}
      await wait(40);return D();
    }
    // ---- help menu (opens the same shared modal) ----
    var hb=$('ehHelpBtn');hb.click();await wait(20);
    var hi=[].slice.call($('ehHelpMenu').querySelectorAll('[role="menuitem"]'));
    ok('help menu: guide, shortcuts, about; no invented links',hi.length===3&&!$('ehHelpPop').querySelector('a[href]')&&/guide/.test(hi[0].textContent)&&inView($('ehHelpPop')));
    ok('only one menu open at a time',!vis('ehLangPop')&&!vis('ehUserPop'));
    key(hi[0],'Enter');await wait(40);dlg=D();
    ok('help menu guide opens the shared Help popup with this page’s content',dlg&&dlg.open&&dlg.dataset.modal==='help'&&$('ehDlgTitle').textContent==='Help'&&(WS?/Selecting an agent[\s\S]*Summary insights[\s\S]*Reading the chart[\s\S]*Chat and suggested questions[\s\S]*Export/:/CFO categories[\s\S]*32 agents[\s\S]*Selecting an agent[\s\S]*Opening the CFO Workspace/).test($('ehDlgBody').textContent)&&/sample data/i.test($('ehDlgBody').textContent));
    key(document.activeElement,'Escape');await wait(30);
    var ae=document.activeElement;
    ok('Esc closes the popup, focus returns to Help, page Esc handlers untouched',!dlg.open&&ae===hb&&!/Exited focus mode/.test(toastText()),'open='+dlg.open+' focus='+(ae&&(ae.id||ae.className||ae.tagName)));
    hb.click();await wait(20);$('ehHelpMenu').querySelectorAll('[role="menuitem"]')[2].click();await wait(30);
    ok('about states prototype limits',dlg.dataset.modal==='about'&&/sample data/.test($('ehDlgBody').textContent)&&/not available/.test($('ehDlgBody').textContent));
    dlg.querySelector('.eh-dlg-close').click();await wait(30);ok('× closes about, focus back to Help',!dlg.open&&document.activeElement===hb);
    // ---- System Admin dropdown ----
    var ITEMS=['My Activity','Change Password','Notification Preferences','Keyboard Shortcuts','Contact Us','Help','Logout'];
    var IDS=['my-activity','change-password','notification-preferences','keyboard-shortcuts','contact-us','help','logout'];
    var ub=$('ehUserBtn');ub.click();await wait(20);var up=$('ehUserPop');
    var ui=[].slice.call($('ehUserMenu').querySelectorAll('[role="menuitem"]'));
    ok('System Admin menu: exactly 7 items in the approved order',ui.length===7&&JSON.stringify(ui.map(function(i){return i.textContent.trim()}))===JSON.stringify(ITEMS),ui.map(function(i){return i.textContent.trim()}).join('|'));
    var circ=ui.map(function(i){return i.querySelector('.eh-av-ic')});
    ok('each row: 28px circular icon background with a 16px Lucide icon, vertically centred with the label',circ.every(function(c,k){if(!c)return false;var r=c.getBoundingClientRect(),cs=getComputedStyle(c),sv=c.querySelector('svg'),sr=sv.getBoundingClientRect(),lr=ui[k].querySelector('.eh-item-text').getBoundingClientRect();return Math.round(r.width)===28&&Math.round(r.height)===28&&cs.borderTopLeftRadius==='9999px'&&sv.getAttribute('width')==='16'&&Math.abs((sr.left+sr.right)/2-(r.left+r.right)/2)<1&&Math.abs((sr.top+sr.bottom)/2-(r.top+r.bottom)/2)<1&&Math.abs((lr.top+lr.bottom)/2-(r.top+r.bottom)/2)<2})&&ui.every(function(i){return i.getAttribute('aria-haspopup')==='dialog'}));
    var c0=getComputedStyle(circ[1]),cL=getComputedStyle(circ[6]);
    ok('normal items: light-blue circle (--primary-50) with primary-blue icon',circ.slice(0,6).every(function(c,k){var cs=getComputedStyle(c);return (ui[k]===document.activeElement||cs.backgroundColor==='rgb(238, 242, 252)')&&cs.color==='rgb(30, 67, 155)'})&&circ.slice(1,6).every(function(c,k){return ui[k+1]===document.activeElement||getComputedStyle(c).backgroundColor==='rgb(238, 242, 252)'})&&getComputedStyle(ui[0]).color==='rgb(30, 32, 36)',c0.backgroundColor+' '+c0.color);
    ok('Logout: light-red circle, red icon and red label; row not filled red',ui[6].classList.contains('is-danger')&&cL.backgroundColor==='rgb(253, 234, 234)'&&cL.color==='rgb(200, 30, 30)'&&getComputedStyle(ui[6]).color==='rgb(200, 30, 30)'&&getComputedStyle(ui[6]).backgroundColor==='rgba(0, 0, 0, 0)',cL.backgroundColor+' '+cL.color);
    var ir=ui.map(function(i){return i.getBoundingClientRect()});
    var u0=getComputedStyle(ui[0]);ok('13px text; 10px padding on all sides; 48px rows; no wrapping; full-width (whole row clickable)',u0.fontSize==='13px'&&u0.paddingTop==='10px'&&u0.paddingBottom==='10px'&&u0.paddingLeft==='10px'&&u0.paddingRight==='10px'&&ir.every(function(r){return Math.round(r.height)===48})&&ui.every(function(i){return getComputedStyle(i).whiteSpace==='nowrap'&&i.scrollWidth<=i.clientWidth})&&ir.every(function(r){return Math.abs(r.width-ir[0].width)<1})&&Math.abs(ir[0].width-$('ehUserMenu').getBoundingClientRect().width)<1,ir.map(function(r){return Math.round(r.height)}).join());
    var sep=ui[6].previousElementSibling;
    ok('separator only before Logout',sep&&sep.classList.contains('eh-sep')&&sep.getAttribute('role')==='separator'&&$('ehUserMenu').querySelectorAll('.eh-sep').length===1);
    var ups=getComputedStyle(up);
    ok('container: surface, 12px radius, border, floating shadow, right-aligned under System Admin, inside the viewport',vis(up)&&ups.backgroundColor==='rgb(255, 255, 255)'&&ups.borderTopLeftRadius==='12px'&&ups.borderTopWidth==='1px'&&/rgba\(30, 67, 155/.test(ups.boxShadow)&&Math.abs(up.getBoundingClientRect().right-$('ehUserBtn').closest('.eh-menu-wrap').getBoundingClientRect().right)<1&&up.getBoundingClientRect().top>=$('ehUserBtn').getBoundingClientRect().bottom&&inView(up),[ups.borderTopLeftRadius,ups.boxShadow.slice(0,40)].join(' '));
    ok('no identity block in the menu; prototype identity stays in the trigger tooltip',!up.querySelector('.eh-identity')&&/no sign-in, roles or permissions/.test($('ehUserBtn').title));
    ok('no fabricated admin actions',!/User Management|Roles|Permissions & |System Administration|My Profile|Account Settings/.test($('ehUserMenu').textContent));
    var ui0=getComputedStyle(ui[0]);function rule(sel){var out=null;[].forEach.call(document.styleSheets,function(sh){var rs;try{rs=sh.cssRules}catch(e){return}[].forEach.call(rs,function(r){if(r.selectorText&&r.selectorText.split(',').map(function(x){return x.trim()}).indexOf(sel)>=0)out=r.style})});return out}
    var hv=rule('.eh-menu-user .eh-item:hover'),hd=rule('.eh-menu-user .eh-item.is-danger:hover');
    ok('hover: #EEF2FC (--primary-50) background + 3px primary left bar (inset, no shift)',hv&&hv.getPropertyValue('background').trim()==='var(--primary-50)'&&getComputedStyle(document.documentElement).getPropertyValue('--primary-50').trim().toUpperCase()==='#EEF2FC'&&/inset 3px 0(px)? 0(px)? var\(--primary-500\)/.test(hv.getPropertyValue('box-shadow')),hv&&hv.cssText);
    ok('Logout hover: its own text colour at reduced opacity + 3px bar in the same red',hd&&/color-mix\(in srgb, ?var\(--error-text\) 10%, ?transparent\)/.test(hd.getPropertyValue('background'))&&/inset 3px 0(px)? 0(px)? var\(--error-text\)/.test(hd.getPropertyValue('box-shadow')),hd&&hd.cssText);
    var b0=ui[1].getBoundingClientRect(),t0=ui[1].querySelector('.eh-item-text').getBoundingClientRect(),c0r=ui[1].querySelector('.eh-av-ic').getBoundingClientRect();
    key(ui[0],'ArrowDown');var fz=getComputedStyle(ui[1]),b1=ui[1].getBoundingClientRect(),t1=ui[1].querySelector('.eh-item-text').getBoundingClientRect(),c1r=ui[1].querySelector('.eh-av-ic').getBoundingClientRect();
    ok('keyboard focus = hover treatment + visible 2px outline; circle stays visible (white on the tint)',document.activeElement===ui[1]&&fz.backgroundColor==='rgb(238, 242, 252)'&&/rgb\(30, 67, 155\) 3px 0px 0px 0px inset/.test(fz.boxShadow)&&fz.outlineStyle==='solid'&&fz.outlineWidth==='2px'&&getComputedStyle(ui[1].querySelector('.eh-av-ic')).backgroundColor==='rgb(255, 255, 255)',[fz.backgroundColor,fz.boxShadow,fz.outlineStyle].join(' '));
    ok('no layout shift on focus (row, icon and label stay put)',b0.left===b1.left&&b0.height===b1.height&&t0.left===t1.left&&c0r.left===c1r.left);
    ui[6].focus();key(ui[6],'End');var lz=getComputedStyle(ui[6]),lm=/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+) \/ ([\d.]+)\)|rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/.exec(lz.backgroundColor);
    var lr=lm&&(lm[1]?[lm[1]*255,lm[2]*255,lm[3]*255,+lm[4]]:[+lm[5],+lm[6],+lm[7],+lm[8]]);
    ok('Logout focus: red tint (10% of rgb(200,30,30)), red 3px bar, red label/icon, no blue treatment',lr&&Math.abs(lr[0]-200)<2&&Math.abs(lr[1]-30)<2&&Math.abs(lr[2]-30)<2&&Math.abs(lr[3]-0.1)<0.01&&/rgb\(200, 30, 30\) 3px 0px 0px 0px inset/.test(lz.boxShadow)&&lz.color==='rgb(200, 30, 30)'&&lz.outlineColor==='rgb(200, 30, 30)',lz.backgroundColor+' | '+lz.boxShadow);
    ui[0].focus();
    key(ui[0],'Escape');await wait(10);ok('Esc closes the dropdown, focus to System Admin',!vis(up)&&document.activeElement===ub);
    ub.click();await wait(20);document.body.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));await wait(10);ok('click outside closes the dropdown',!vis(up)&&ub.getAttribute('aria-expanded')==='false');
    var before=pageState(),href0=location.href;
    // per item: opens its own popup on this page; × visible; semantics; menu closed; focus inside
    for(var k=0;k<7;k++){
      dlg=await openFromUser(k,k%2===1);
      var cb=dlg&&dlg.querySelector('.eh-dlg-close'),r=dlg&&dlg.getBoundingClientRect();
      ok('“'+ITEMS[k]+'” opens its popup on the same page',dlg&&dlg.open&&dlg.dataset.modal===IDS[k]&&$('ehDlgTitle').textContent===ITEMS[k]&&location.href===href0&&openCount()===1&&!vis(up)&&ub.getAttribute('aria-expanded')==='false',dlg&&dlg.dataset.modal);
      ok('“'+ITEMS[k]+'”: dialog semantics, visible × button, focus inside, fits the viewport',dlg.getAttribute('role')==='dialog'&&dlg.getAttribute('aria-modal')==='true'&&dlg.getAttribute('aria-labelledby')==='ehDlgTitle'&&$('ehDlgDesc').textContent.length>0&&cb&&vis(cb)&&cb.getAttribute('aria-label')==='Close'&&fits(cb)&&inDlg()&&fits(dlg),[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)].join(','));
      var body=$('ehDlgBody');ok('“'+ITEMS[k]+'”: content scrolls inside the popup',getComputedStyle(body).overflowY==='auto'&&body.scrollWidth<=body.clientWidth+1);
      insideClick();await wait(20);ok('“'+ITEMS[k]+'”: click inside keeps it open',dlg.open);
      // focus trap
      var fo=[].filter.call(dlg.querySelectorAll('button, input, textarea'),function(e){return !e.disabled&&e.getClientRects().length});
      fo[fo.length-1].focus();key(fo[fo.length-1],'Tab');var w1=document.activeElement===fo[0];
      key(fo[0],'Tab',{shiftKey:true});var w2=document.activeElement===fo[fo.length-1];
      ok('“'+ITEMS[k]+'”: Tab / Shift+Tab stay inside the popup',w1&&w2);
      if(WS){fo[0].focus();key(fo[0],'Enter',{ctrlKey:true});await wait(30);ok('“'+ITEMS[k]+'”: page shortcuts (Ctrl+Enter) don’t fire behind the popup',!vis('stLoading')&&dlg.open)}
      // close by a different method each time
      var how=['×','Esc','backdrop','×','Esc','backdrop','×'][k];
      if(how==='×')cb.click();else if(how==='Esc')key(document.activeElement,'Escape');
      else{backdropClick();await wait(20);var info=['my-activity','keyboard-shortcuts','help','logout'].indexOf(IDS[k])>=0;
        if(!info){ok('“'+ITEMS[k]+'”: backdrop click doesn’t discard the form',dlg.open);cb.click()}}
      await wait(40);
      ok('“'+ITEMS[k]+'”: closes ('+how+'), focus back to System Admin, page state preserved',!dlg.open&&openCount()===0&&document.activeElement===ub&&pageState()===before&&!$('ehDlgBody').children.length,pageState()===before?'':before+' -> '+pageState());
    }
    // ---- My Activity: honest empty state ----
    dlg=await openFromUser(0);
    ok('My Activity: honest empty state, no fabricated history or timestamps',/No recent activity available\./.test($('ehDlgBody').textContent)&&/isn’t connected/.test($('ehDlgBody').textContent)&&!$('ehDlgBody').querySelector('li,time,table')&&!/\d{1,2}:\d{2}|\d{4}-\d{2}/.test($('ehDlgBody').textContent)&&$('ehDlgFoot').hidden,$('ehDlgBody').textContent);
    ok('description shown',$('ehDlgDesc').textContent==='Review your recent activity across the CFO workspace.');
    dlg.querySelector('.eh-dlg-close').click();await wait(30);
    // ---- Change Password: validation, show/hide, no simulated success, nothing stored ----
    var st0=storageSnap();dlg=await openFromUser(1);
    var cur=$('ehPwCurrent'),nw=$('ehPwNew'),cf=$('ehPwConfirm');
    ok('Change Password: 3 labelled password fields, prototype notice, Cancel + Update Password',cur&&nw&&cf&&[cur,nw,cf].every(function(i){return i.type==='password'&&document.querySelector('label[for="'+i.id+'"]')&&i.getAttribute('aria-required')==='true'})&&/no account or authentication service/.test($('ehDlgBody').textContent)&&JSON.stringify([].map.call($('ehDlgFoot').querySelectorAll('button'),function(b){return b.textContent}))==='["Cancel","Update Password"]'&&document.activeElement===cur);
    $('ehPwSubmit').click();await wait(20);
    ok('empty submit: inline required errors, aria-invalid, focus on first',[cur,nw,cf].every(function(i){var e=$(i.id+'Err');return i.getAttribute('aria-invalid')==='true'&&!e.hidden&&e.textContent&&i.getAttribute('aria-describedby')===e.id})&&document.activeElement===cur);
    cur.value='Old-pass-1';cur.dispatchEvent(new Event('input',{bubbles:true}));nw.value='New-pass-2';nw.dispatchEvent(new Event('input',{bubbles:true}));cf.value='New-pass-3';cf.dispatchEvent(new Event('input',{bubbles:true}));
    ok('errors clear as fields are fixed',!cur.hasAttribute('aria-invalid')&&!nw.hasAttribute('aria-invalid'));
    $('ehPwSubmit').click();await wait(20);
    ok('mismatch error on Confirm only',cf.getAttribute('aria-invalid')==='true'&&/don’t match/.test($('ehPwConfirmErr').textContent)&&!cur.hasAttribute('aria-invalid')&&document.activeElement===cf);
    var tg=nw.parentNode.querySelector('.eh-pw-toggle');tg.click();await wait(10);
    ok('show/hide password toggle (aria-pressed)',nw.type==='text'&&tg.getAttribute('aria-pressed')==='true'&&tg.getAttribute('aria-label')==='Show password');
    tg.click();await wait(10);ok('hidden again',nw.type==='password'&&tg.getAttribute('aria-pressed')==='false');
    cf.value='New-pass-2';$('ehPwSubmit').click();await wait(20);
    var bt=$('ehDlgBody').textContent;
    ok('valid submit does not simulate success; fields cleared',/isn’t available in this prototype/.test($('ehDlgStatus').textContent)&&!/success|updated|changed successfully/i.test(bt.replace(/Nothing was sent or changed/,''))&&!cur.value&&!nw.value&&!cf.value&&dlg.open,$('ehDlgStatus').textContent);
    ok('no password stored or exposed (storage unchanged, not in the DOM)',storageSnap()===st0&&!/pass-[123]/.test(D().outerHTML+document.body.innerText+storageSnap()));
    cur.value='Kept?';$('ehDlgFoot').querySelector('[data-close]').click();await wait(30);
    ok('Cancel closes, values not retained',!dlg.open&&!document.querySelector('#ehModal input')&&document.activeElement===ub);
    // ---- Notification Preferences: toggles, cancel discards, save persists (both pages) ----
    try{localStorage.removeItem('erms.emagia.notifications')}catch(e){}
    var NL=['Email Notifications','In-App Notifications','Report Completion Alerts','Agent Activity Updates','Important System Announcements'];
    dlg=await openFromUser(2);var sws=[].slice.call(dlg.querySelectorAll('[role="switch"]'));
    function lbl(s){return $(s.getAttribute('aria-labelledby')).textContent}
    ok('Notification Preferences: 5 labelled switches in order, all Off, UI-only notice',sws.length===5&&JSON.stringify(sws.map(lbl))===JSON.stringify(NL)&&sws.every(function(s){return s.getAttribute('aria-checked')==='false'&&s.textContent.trim()==='Off'&&s.getAttribute('aria-describedby')})&&/No email, in-app or other notifications are configured or sent/.test($('ehDlgBody').textContent)&&document.activeElement===sws[0]);
    sws[0].click();await wait(10);
    var tr=getComputedStyle(sws[0].querySelector('.eh-switch-thumb')).transform;
    ok('toggle updates immediately: aria-checked, On text and thumb position (not colour alone)',sws[0].getAttribute('aria-checked')==='true'&&sws[0].textContent.trim()==='On'&&tr!=='none',tr);
    $('ehDlgFoot').querySelector('[data-close]').click();await wait(30);
    var savedN=null;try{savedN=localStorage.getItem('erms.emagia.notifications')}catch(e){}
    dlg=await openFromUser(2);sws=[].slice.call(dlg.querySelectorAll('[role="switch"]'));
    ok('Cancel discards unsaved changes',savedN===null&&sws[0].getAttribute('aria-checked')==='false');
    sws[1].click();sws[4].click();sws[2].click();await wait(10);
    $('ehNSave').click();await wait(40);try{savedN=JSON.parse(localStorage.getItem('erms.emagia.notifications'))}catch(e){savedN=null}
    ok('Save persists preferences and closes; honest confirmation',!dlg.open&&savedN&&savedN.inApp===true&&savedN.announcements===true&&savedN.reports===true&&savedN.email===false&&savedN.agents===false&&/No notifications are sent/.test(toastText())&&document.activeElement===ub,JSON.stringify(savedN));
    dlg=await openFromUser(2);sws=[].slice.call(dlg.querySelectorAll('[role="switch"]'));
    ok('reopened popup shows saved values',sws.map(function(s){return s.getAttribute('aria-checked')}).join()==='false,true,true,false,true');
    key(document.activeElement,'Escape');await wait(30);
    var fr3=document.createElement('iframe');fr3.style.cssText='position:absolute;left:-9999px;width:1200px;height:700px';fr3.src=WS?'cfo-overview.html':'cfo-workspace.html';document.body.appendChild(fr3);
    await wait(1200);var oth='';try{fr3.contentWindow.EmagiaHeader.openModal('notification-preferences');oth=[].map.call(fr3.contentDocument.querySelectorAll('[role="switch"]'),function(s){return s.getAttribute('aria-checked')}).join()}catch(e){oth='blocked: '+e.message}
    ok('preferences shared with the other CFO page',oth==='false,true,true,false,true',oth);fr3.remove();
    try{localStorage.removeItem('erms.emagia.notifications')}catch(e){}
    // ---- Keyboard Shortcuts: only implemented keys ----
    dlg=await openFromUser(3);var sk=$('ehDlgBody').textContent;
    ok("Keyboard Shortcuts: implemented keys only, grouped, compact key styling; alternatives shown as ↑ / ↓",/↑\s*\/\s*↓/.test(sk)&&!/↑\s*\+\s*↓/.test(sk)&&/Global search/.test(sk)&&/Ctrl\s*\+\s*K/.test(sk)&&/Close search/.test(sk)&&/Close the open menu or popup/.test(sk)&&(WS?/CFO Workspace[\s\S]*Ctrl\s*\+\s*Enter/.test(sk):!/Ctrl\s*\+\s*Enter/.test(sk))&&dlg.querySelectorAll('kbd.eh-key').length>=8&&$('ehDlgFoot').hidden);
    key(document.activeElement,'Escape');await wait(30);
    // ---- Contact Us: no fabricated details, no fake submission ----
    st0=storageSnap();dlg=await openFromUser(4);var cb4=$('ehDlgBody');
    ok('Contact Us: no invented email/phone/URL/hours; states details aren’t configured',/aren’t configured/.test(cb4.textContent)&&!cb4.querySelector('a[href]')&&!/@|\+?\d[\d\s().-]{6,}\d|https?:|www\./.test(cb4.textContent)&&$('ehCuSubject')&&$('ehCuMessage')&&/Prototype form/.test(cb4.textContent)&&document.activeElement===$('ehCuSubject'));
    $('ehCuSubmit').click();await wait(20);
    ok('required validation on Subject and Message',$('ehCuSubject').getAttribute('aria-invalid')==='true'&&$('ehCuMessage').getAttribute('aria-invalid')==='true'&&!$('ehCuSubjectErr').hidden);
    $('ehCuSubject').value='Question';$('ehCuMessage').value='Hello';$('ehCuSubmit').click();await wait(20);
    ok('submit says nothing was sent; no ticket number; nothing stored',/wasn’t sent/.test($('ehDlgStatus').textContent)&&!/ticket|#\d|submitted successfully|thank you/i.test(cb4.textContent)&&storageSnap()===st0&&!net.length&&dlg.open);
    backdropClick();await wait(20);ok('backdrop click keeps the form open',dlg.open);
    $('ehDlgFoot').querySelector('[data-close]').click();await wait(30);ok('Cancel closes Contact Us',!dlg.open&&document.activeElement===ub);
    // ---- Help (from System Admin): contextual ----
    dlg=await openFromUser(5);
    ok('Help from System Admin: same contextual help, no external links',dlg.dataset.modal==='help'&&$('ehDlgDesc').textContent==='Find guidance for using the Emagia CFO application.'&&(WS?/Summary insights/:/CFO categories/).test($('ehDlgBody').textContent)&&!$('ehDlgBody').querySelector('a[href]'));
    // only one popup: opening another replaces the content
    EmagiaHeader.openModal('keyboard-shortcuts');await wait(20);
    ok('only one popup at a time (opening another replaces it)',openCount()===1&&document.querySelectorAll('#ehModal').length===1&&dlg.dataset.modal==='keyboard-shortcuts');
    key(document.activeElement,'Escape');await wait(30);ok('focus still returns to the original trigger',document.activeElement===ub);
    // ---- Logout: confirmation only, never executes ----
    st0=storageSnap();dlg=await openFromUser(6);
    var lo=$('ehLogoutBtn'),lc=$('ehDlgFoot').querySelector('[data-close]');
    ok('Logout: confirmation message, Cancel focused, Logout disabled with linked reason',$('ehDlgDesc').textContent==='Are you sure you want to log out?'&&document.activeElement===lc&&lc.textContent==='Cancel'&&lo&&lo.textContent==='Logout'&&lo.getAttribute('aria-disabled')==='true'&&$(lo.getAttribute('aria-describedby'))&&/isn’t available/.test($(lo.getAttribute('aria-describedby')).textContent)&&$('ehDlgIcon').querySelector('svg'));
    lo.click();await wait(30);
    ok('Logout click: no redirect, no storage cleared, no network',location.href===href0&&storageSnap()===st0&&dlg.open&&!net.length);
    lc.click();await wait(30);ok('Cancel returns to the same page with focus on System Admin',!dlg.open&&document.activeElement===ub&&pageState()===before);
    // ---- fallback + regressions ----
    var errsBefore=errs.slice();logo.dispatchEvent(new Event('error'));await wait(10);errs=errsBefore; // simulated failure is not a page error
    ok('logo failure shows text fallback without layout break',logo.hidden&&vis(hdr.querySelector('.eh-brand-text'))&&Math.round(hdr.getBoundingClientRect().height)===56);
    ok('sidebar unchanged: 14 items, CFO active',document.querySelectorAll('#sidebar nav .sb-item').length===14&&document.querySelector('#sidebar [aria-current="page"]').dataset.navKey==='cfo');
    if(!desk){$('menuBtn').click();await wait(250);ok('mobile nav button still opens the sidebar',document.body.classList.contains('nav-open'));$('menuBtn').click();await wait(250)}
    ok('no horizontal page scroll',document.documentElement.scrollWidth<=innerWidth+1,document.documentElement.scrollWidth);
    var res=performance.getEntriesByType('resource').map(function(e){return e.name}).filter(function(u){return !/^file:|^data:|^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u)});
    ok('no network requests (only local files + existing Google Fonts)',!net.length&&!res.length,net.concat(res).join(' | '));
    ok('no JS errors',!errs.length,errs.join(' | '));
    var o=document.createElement('pre');o.id='harnessOut';o.textContent=JSON.stringify(R);document.body.appendChild(o);
  }
  window.addEventListener('load',function(){try{localStorage.removeItem('erms.emagia.language');localStorage.removeItem('erms.emagia.search.recent')}catch(e){}run().catch(function(e){var o=document.createElement('pre');o.id='harnessOut';o.textContent=JSON.stringify(R.concat([{name:'harness crashed',pass:false,info:e.stack}]));document.body.appendChild(o)})});
})();
