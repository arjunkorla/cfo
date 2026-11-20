(function(){
  // Right application launcher (rail ≥ 768px, header menu < 768px) + agents-panel active state (workspace).
  var R=[],errs=[],net=[],sel=[];
  window.addEventListener('error',function(e){errs.push(String(e.message||e.target&&e.target.src))},true);
  var of=window.fetch;window.fetch=function(u){net.push('fetch '+u);return of.apply(this,arguments)};
  var ox=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){net.push('xhr '+u);return ox.apply(this,arguments)};
  document.addEventListener('emagia-apps:select',function(e){sel.push(e.detail)});
  var $=function(id){return document.getElementById(id)};
  var PAGE=location.pathname.split('/').pop(),WS=PAGE==='cfo-workspace.html';
  function ok(n,c,i){R.push({name:'['+innerWidth+'px '+PAGE+' launcher] '+n,pass:!!c,info:i===undefined?'':String(i)})}
  function wait(ms){return new Promise(function(r){setTimeout(r,ms)})}
  function vis(el){if(typeof el==='string')el=$(el);return !!el&&!el.hidden&&el.getBoundingClientRect().width>0&&getComputedStyle(el).display!=='none'}
  function key(el,k,o){el.dispatchEvent(new KeyboardEvent('keydown',Object.assign({key:k,bubbles:true,cancelable:true},o||{})))}
  function toastText(){return $('toasts').textContent}
  var LABELS=['Gia Agent','Gia','Gia GPT','Gia Agent Studio','Gia Alpha Cash','Gia Voice','Gia Analytics','Gia Docs','Gia Drive','Graphs','Collaboration'];
  async function run(){
    await wait(400);
    var rail=$('ealRail'),btns=[].slice.call(rail.querySelectorAll('.eal-btn')),cw=document.documentElement.clientWidth,h0=location.href;
    ok('rail rendered with 11 applications in the approved order',rail.tagName==='NAV'&&rail.getAttribute('aria-label')==='Applications'&&JSON.stringify(btns.map(function(b){return b.getAttribute('aria-label')}))===JSON.stringify(LABELS)&&btns.every(function(b){return b.querySelector('svg path,svg rect,svg circle')}),btns.map(function(b){return b.getAttribute('aria-label')}).join('|'));
    ok('only Gia Agent is current (aria-current="page")',btns[0].getAttribute('aria-current')==='page'&&btns.filter(function(b){return b.hasAttribute('aria-current')}).length===1);
    ok('unlinked items are described as not linked',btns.slice(1).every(function(b){return b.getAttribute('aria-describedby')==='ealUnlinked'})&&/Not linked in this prototype/.test($('ealUnlinked').textContent));
    if(innerWidth>=768){
      var rr=rail.getBoundingClientRect(),W=innerWidth>=1024?64:56,cs=getComputedStyle(rail);
      ok('fixed rail on the far right below the 56px header, '+W+'px, white, subtle left border',vis(rail)&&cs.position==='fixed'&&Math.round(rr.width)===W&&Math.abs(rr.right-cw)<1&&Math.round(rr.top)===56&&cs.backgroundColor==='rgb(255, 255, 255)'&&cs.borderLeftWidth==='1px',[rr.left,rr.top,rr.width].map(Math.round).join(','));
      var m=document.querySelector('main').getBoundingClientRect();
      ok('page content ends before the rail (no overlap)',m.right<=rr.left+0.5,Math.round(m.right)+' vs '+Math.round(rr.left));
      if(WS){var ws=$('ws').getBoundingClientRect(),tb=$('toolbar').getBoundingClientRect();ok('workspace panels and toolbar clear of the rail',ws.right<=rr.left&&tb.right<=rr.left)}
      ok('toasts sit left of the rail',$('toasts').getBoundingClientRect().right<=rr.left+0.5);
      var a=getComputedStyle(btns[0]),n=getComputedStyle(btns[6]),b0=btns[0].getBoundingClientRect();
      ok('active: light-blue circle + primary icon; inactive: neutral',a.backgroundColor==='rgb(238, 242, 252)'&&a.color==='rgb(30, 67, 155)'&&a.borderTopLeftRadius==='9999px'&&n.backgroundColor==='rgba(0, 0, 0, 0)'&&n.color==='rgb(97, 103, 117)',[a.backgroundColor,a.color,n.color].join(' '));
      var sz=innerWidth>=1024?40:36,svgr=btns[0].querySelector('svg').getBoundingClientRect();
      ok('consistent '+sz+'px targets, 20px icons, centred, evenly spaced',btns.every(function(b){var r=b.getBoundingClientRect();return Math.round(r.width)===sz&&Math.round(r.height)===sz&&Math.abs((r.left+r.right)/2-(rr.left+rr.right)/2)<1})&&Math.round(svgr.width)===20&&btns.slice(1).every(function(b,i){return Math.abs((b.getBoundingClientRect().top-btns[i].getBoundingClientRect().top)-(btns[1].getBoundingClientRect().top-b0.top))<1}));
      // tooltip on keyboard focus and hover; Esc dismisses
      btns[6].focus();await wait(20);var tip=$('ealTip'),tr=tip.getBoundingClientRect(),br=btns[6].getBoundingClientRect();
      ok('tooltip on focus: app name, left of the icon, vertically centred, in the viewport',vis(tip)&&tip.textContent==='Gia Analytics'&&tr.right<=br.left&&Math.abs((tr.top+tr.bottom)/2-(br.top+br.bottom)/2)<1&&tr.left>=0&&tip.getAttribute('aria-hidden')==='true',tip.textContent);
      ok('focus ring visible on rail items',getComputedStyle(btns[6]).boxShadow!=='none');
      key(btns[6],'Escape');ok('Esc dismisses the tooltip',!vis(tip));
      btns[2].dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));ok('tooltip on hover',vis(tip)&&tip.textContent==='Gia GPT');
      rail.dispatchEvent(new MouseEvent('mouseleave'));ok('tooltip hides when the pointer leaves',!vis(tip));
      // keyboard navigation
      btns[0].focus();key(btns[0],'ArrowDown');var k1=document.activeElement===btns[1];key(btns[1],'End');var k2=document.activeElement===btns[10];key(btns[10],'ArrowDown');var k3=document.activeElement===btns[0];key(btns[0],'ArrowUp');
      ok('↑/↓ (wrapping), Home/End move between applications',k1&&k2&&k3&&document.activeElement===btns[10]);key(btns[10],'Home');ok('Home → first',document.activeElement===btns[0]);
      // clicks: no navigation, honest message
      btns[6].click();await wait(30);
      ok('unlinked app: “Gia Analytics is not linked in this prototype.”, no navigation',/Gia Analytics is not linked in this prototype\./.test(toastText())&&location.href===h0&&sel[sel.length-1].id==='gia-analytics'&&sel[sel.length-1].linked===false&&btns[6].getAttribute('aria-current')===null&&btns[0].getAttribute('aria-current')==='page');
      btns[0].click();await wait(30);ok('current app: says it is current, no navigation',/Gia Agent is the current application\./.test(toastText())&&location.href===h0);
      ok('compact header trigger hidden on this width',!vis('ealBtn'));
      // System Admin dropdown still opens over the rail
      $('ehUserBtn').click();await wait(30);var up=$('ehUserPop'),ur=up.getBoundingClientRect(),hit=document.elementFromPoint(Math.min(ur.right-4,cw-4),Math.min(ur.bottom-8,innerHeight-4));
      ok('header menus open above the rail',vis(up)&&up.contains(hit),hit&&(hit.id||hit.className));
      key(document.activeElement,'Escape');await wait(10);
    }else{
      ok('rail hidden on phones; content keeps its full width',!vis(rail)&&parseFloat(getComputedStyle(document.querySelector('main')).marginRight)===0);
      var eb=$('ealBtn');ok('compact “Applications” icon in the header',vis(eb)&&eb.getAttribute('aria-label')==='Applications'&&eb.getAttribute('aria-haspopup')==='menu'&&(eb.compareDocumentPosition($('ehUserBtn'))&4)&&Math.round(document.querySelector('header.topbar').getBoundingClientRect().height)===56);
      eb.click();await wait(30);var items=[].slice.call($('ealMenu').querySelectorAll('[role="menuitem"]')),pr=$('ealPop').getBoundingClientRect();
      ok('menu lists all 11 applications in order, inside the viewport',vis('ealPop')&&JSON.stringify(items.map(function(i){return i.firstChild.nextSibling.firstChild.textContent}))===JSON.stringify(LABELS)&&pr.left>=0&&pr.right<=cw+0.5&&eb.getAttribute('aria-expanded')==='true',items.map(function(i){return i.textContent}).join('|'));
      ok('current marked; others say not linked',items[0].getAttribute('aria-current')==='page'&&/Current application/.test(items[0].textContent)&&items.slice(1).every(function(i){return /Not linked in this prototype/.test(i.textContent)}));
      ok('focus moves into the menu',document.activeElement===items[0]);
      key(items[0],'End');ok('End → last item',document.activeElement===items[10]);
      key(items[10],'Enter');await wait(30);
      ok('choosing an item closes the menu, returns focus, says not linked, no navigation',!vis('ealPop')&&document.activeElement===eb&&/Collaboration is not linked in this prototype\./.test(toastText())&&location.href===h0);
      eb.click();await wait(20);key(document.activeElement,'Escape');await wait(10);ok('Esc closes the menu, focus to the icon',!vis('ealPop')&&document.activeElement===eb);
    }
    // ---- agents panel active state (workspace) ----
    if(WS){
      var rows=[].slice.call(document.querySelectorAll('#agentList .agent-row'));
      rows[1].querySelector('.agent-main').click();await wait(900);
      rows=[].slice.call(document.querySelectorAll('#agentList .agent-row'));
      var act=rows.filter(function(r){return r.classList.contains('active')}),ac=getComputedStyle(act[0]);
      ok('one active agent: selection background kept, no left-border indicator',act.length===1&&act[0]===rows[1]&&ac.backgroundColor==='rgb(238, 242, 252)'&&ac.boxShadow==='none'&&ac.borderLeftWidth==='0px'&&getComputedStyle(rows[0]).backgroundColor!=='rgb(238, 242, 252)',ac.boxShadow);
      ok('active agent name/avatar keep their selection colours; refresh icon kept',getComputedStyle(act[0].querySelector('.agent-name')).color==='rgb(30, 67, 155)'&&act[0].querySelector('[data-refresh]'));
      var mainBtn=act[0].querySelector('.agent-main');mainBtn.focus();var fs=getComputedStyle(mainBtn);
      ok('keyboard focus: inset ring, not a left border',/inset/.test(fs.boxShadow)&&/2px/.test(fs.boxShadow)&&!/^rgb\(30, 67, 155\) 3px 0px 0px 0px inset$/.test(fs.boxShadow),fs.boxShadow);
      rows[2].querySelector('.agent-main').click();await wait(900);
      rows=[].slice.call(document.querySelectorAll('#agentList .agent-row'));
      ok('switching agents moves the active background; summary loads',rows.filter(function(r){return r.classList.contains('active')}).length===1&&rows[2].classList.contains('active')&&getComputedStyle(rows[2]).boxShadow==='none'&&vis('stResult')&&$('sumAgent').textContent===rows[2].querySelector('.agent-name').textContent);
    }
    ok('sidebar unchanged: 14 items, CFO active',document.querySelectorAll('#sidebar nav .sb-item').length===14&&document.querySelector('#sidebar [aria-current="page"]').dataset.navKey==='cfo');
    ok('no horizontal page scroll',document.documentElement.scrollWidth<=innerWidth+1,document.documentElement.scrollWidth);
    ok('no network requests',!net.length&&!performance.getEntriesByType('resource').some(function(e){return !/^file:|^data:|^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(e.name)}),net.join());
    ok('no JS errors',!errs.length,errs.join(' | '));
    var o=document.createElement('pre');o.id='harnessOut';o.textContent=JSON.stringify(R);document.body.appendChild(o);
  }
  window.addEventListener('load',function(){run().catch(function(e){var o=document.createElement('pre');o.id='harnessOut';o.textContent=JSON.stringify(R.concat([{name:'harness crashed',pass:false,info:e.stack}]));document.body.appendChild(o)})});
})();
