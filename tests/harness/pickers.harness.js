(function(){
  // Select dropdowns (customizable <select>) + Calendar date picker (components/emagia-datepicker.js): one popup style.
  // Real-pointer behaviour (click to open a <select>, click outside) is covered by the CDP test in workspace.test.js.
  var R=[],errs=[],net=[];
  window.addEventListener('error',function(e){errs.push(String(e.message||e.target&&e.target.src))},true);
  var of=window.fetch;window.fetch=function(u){net.push('fetch '+u);return of.apply(this,arguments)};
  var ox=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){net.push('xhr '+u);return ox.apply(this,arguments)};
  var $=function(id){return document.getElementById(id)};
  function ok(n,c,i){R.push({name:'['+innerWidth+'px pickers] '+n,pass:!!c,info:i===undefined?'':String(i)})}
  function wait(ms){return new Promise(function(r){setTimeout(r,ms)})}
  function vis(el){if(typeof el==='string')el=$(el);return !!el&&!el.hidden&&el.getBoundingClientRect().width>0}
  function key(el,k,o){el.dispatchEvent(new KeyboardEvent('keydown',Object.assign({key:k,bubbles:true,cancelable:true},o||{})))}
  function pad(n){return (n<10?'0':'')+n}
  function iso(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
  var SHADOW='rgba(30, 67, 155, 0.16) 0px 24px 48px 0px, rgba(30, 67, 155, 0.08) 0px 8px 16px 0px, rgba(30, 67, 155, 0.05) 0px 2px 4px 0px';
  var PRIMARY='rgb(30, 67, 155)',P50='rgb(238, 242, 252)',BORDER='rgb(230, 231, 234)';
  async function run(){
    await wait(300);
    var cw=document.documentElement.clientWidth;
    // ---------------- Select dropdowns ----------------
    var sels=[].slice.call(document.querySelectorAll('select.ctl'));
    ok('both Select controls use the customizable select (native behaviour, values and keyboard kept)',sels.length===2&&sels.every(function(s){return getComputedStyle(s).appearance==='base-select'&&getComputedStyle(s,'::picker(select)').appearance==='base-select'}),sels.map(function(s){return s.id+':'+getComputedStyle(s).appearance}).join());
    sels.forEach(function(s){
      var p=getComputedStyle(s,'::picker(select)');
      ok(s.id+' panel: white, 1px neutral border, 8px top / 12px bottom corners, floating shadow, 4px gap and padding',p.backgroundColor==='rgb(255, 255, 255)'&&p.borderTopColor===BORDER&&p.borderTopWidth==='1px'&&p.borderBottomLeftRadius==='12px'&&p.borderBottomRightRadius==='12px'&&p.borderTopLeftRadius==='8px'&&p.boxShadow===SHADOW&&p.marginTop==='4px'&&p.paddingTop==='4px'&&p.overflowY==='auto',[p.borderBottomLeftRadius,p.borderTopLeftRadius,p.boxShadow].join(' | '));
      var opts=[].slice.call(s.options),chk=opts.filter(function(o){return o.selected});
      ok(s.id+': exactly one selected option (the current value)',chk.length===1&&chk[0].value===s.value);
      var c=getComputedStyle(chk[0]),k=getComputedStyle(chk[0],'::checkmark');
      ok(s.id+' selected option: light-blue background + 2px primary left indicator + right-aligned Lucide check (not colour alone)',c.backgroundColor===P50&&c.boxShadow===PRIMARY+' 2px 0px 0px 0px inset'&&k.visibility==='visible'&&k.order==='1'&&k.width==='16px'&&/M20 6 9 17l-5-5/.test(decodeURIComponent(k.maskImage||k.webkitMaskImage)),[c.backgroundColor,c.boxShadow,k.visibility,k.order].join(' | '));
      var others=opts.filter(function(o){return !o.selected});
      ok(s.id+' other options: no background, no indicator, check hidden',others.every(function(o){var oc=getComputedStyle(o);return oc.backgroundColor==='rgba(0, 0, 0, 0)'&&oc.boxShadow==='none'&&getComputedStyle(o,'::checkmark').visibility==='hidden'}));
      var oc0=getComputedStyle(opts[0]);
      ok(s.id+' options: 12px horizontal padding, ≥36px rows, left-aligned, same font as the control, no separators',oc0.paddingLeft==='12px'&&oc0.paddingRight==='12px'&&parseFloat(oc0.minHeight)>=36&&oc0.textAlign==='left'&&oc0.fontFamily===getComputedStyle(s).fontFamily&&oc0.fontSize===getComputedStyle(s).fontSize&&opts.every(function(o){var x=getComputedStyle(o);return x.borderTopWidth==='0px'&&x.borderBottomWidth==='0px'}));
    });
    // hover / focus rules (pseudo-classes cannot be forced from script: read the shipped rules)
    var rules=[];[].forEach.call(document.styleSheets,function(sh){try{(function walk(list){[].forEach.call(list,function(r){if(r.cssRules&&!r.selectorText)walk(r.cssRules);else if(r.selectorText)rules.push(r)})})(sh.cssRules)}catch(e){}});
    function rule(sel){return rules.filter(function(r){return r.selectorText.replace(/\s+/g,' ')===sel})[0]}
    var hv=rule('select.ctl option:hover, select.ctl option:focus-visible'),fv=rule('select.ctl option:focus-visible');
    ok('option hover/focus: subtle light-blue background (lighter than selected), no shift',hv&&/color-mix\(in srgb, var\(--primary-50\) 60%, var\(--surface\)\)/.test(hv.style.getPropertyValue('background'))&&!hv.style.getPropertyValue('padding')&&!hv.style.getPropertyValue('border'));
    ok('option keyboard focus: visible 2px inset outline',fv&&fv.style.getPropertyValue('outline').indexOf('2px solid')===0&&fv.style.getPropertyValue('outline-offset')==='-2px');
    var ck=rule('select.ctl option:checked');
    ok('selected rule comes after hover (selected stays primary-50 when hovered)',ck&&rules.indexOf(ck)>rules.indexOf(hv));
    var rm=rules.filter(function(r){return r.parentRule&&/prefers-reduced-motion/.test(r.parentRule.conditionText||r.parentRule.media&&r.parentRule.media.mediaText||'')});
    var tr=rule('select.ctl::picker(select)'),tr2=rule('select.ctl:not(:open)::picker(select)');
    ok('open/close transition (fade + 4px slide), reduced-motion respected',tr&&/opacity/.test(tr.style.getPropertyValue('transition'))&&tr2&&tr2.style.getPropertyValue('opacity')==='0'&&tr2.style.getPropertyValue('translate')==='0px -4px'&&rm.some(function(r){return /::picker\(select\)/.test(r.selectorText)&&/\.edp-pop/.test(r.selectorText)&&r.style.getPropertyValue('transition')==='none'}),getComputedStyle(sels[0],'::picker(select)').transitionProperty+' | '+rm.map(function(r){return r.selectorText}).join(';'));
    // control itself unchanged
    sels.forEach(function(s){var cs=getComputedStyle(s);ok(s.id+' control unchanged: 36px, 8px radius, white, existing chevron, no extra picker icon',cs.height==='36px'&&cs.borderTopLeftRadius==='8px'&&cs.backgroundColor==='rgb(255, 255, 255)'&&/svg/.test(cs.backgroundImage)&&getComputedStyle(s,'::picker-icon').display==='none')});
    var mv=$('model').value;$('model').value='ollama/llama3.2:latest';$('model').dispatchEvent(new Event('change',{bubbles:true}));
    var nowSel=[].filter.call($('model').options,function(o){return o.selected});
    ok('changing the value moves the single selected state (and its check)',nowSel.length===1&&nowSel[0].value==='ollama/llama3.2:latest'&&getComputedStyle(nowSel[0]).backgroundColor===P50&&getComputedStyle($('model').options[0]).backgroundColor==='rgba(0, 0, 0, 0)'&&!vis('llmErr'));
    $('model').value=mv;$('model').dispatchEvent(new Event('change',{bubbles:true}));

    // ---------------- Calendar date picker ----------------
    var from=$('from'),to=$('to'),fb=from.parentNode.querySelector('.edp-btn'),tb=to.parentNode.querySelector('.edp-btn');
    ok('date inputs stay native (typing, value, min/max) and gain a calendar button',from.type==='date'&&to.type==='date'&&from.parentNode.classList.contains('edp-wrap')&&fb&&tb&&fb.getAttribute('aria-label')==='Choose From date'&&tb.getAttribute('aria-label')==='Choose To date'&&fb.getAttribute('aria-haspopup')==='dialog'&&fb.getAttribute('aria-expanded')==='false'&&fb.getAttribute('aria-controls')==='edpPop');
    var ind=rule('input[type="date"].ctl.edp-input::-webkit-calendar-picker-indicator');
    ok('native calendar indicator replaced (hidden only on enhanced inputs); button sits inside the field',ind&&ind.style.getPropertyValue('display')==='none'&&(function(){var a=from.getBoundingClientRect(),b=fb.getBoundingClientRect();return b.left>=a.left&&b.right<=a.right&&b.top>=a.top&&b.bottom<=a.bottom&&Math.round(b.width)===28})());
    ok('field keeps its size and padding for the text',getComputedStyle(from).height==='36px'&&getComputedStyle(from).paddingLeft==='12px'&&getComputedStyle(from).paddingRight==='40px');
    var tbr=$('toolbar').getBoundingClientRect();
    var f0=from.value,t0=to.value,chg=0;from.addEventListener('change',function(){chg++});
    fb.click();await wait(200);
    var pop=$('edpPop'),pr=pop.getBoundingClientRect(),fr=from.getBoundingClientRect();
    ok('calendar opens from the button: dialog, labelled by the month heading, aria-expanded',pop.matches(':popover-open')&&pop.getAttribute('role')==='dialog'&&pop.getAttribute('aria-labelledby')==='edpTitle'&&fb.getAttribute('aria-expanded')==='true');
    var selCell=pop.querySelector('[aria-selected="true"]');
    ok('focus lands on the selected date; it matches the input value',selCell&&document.activeElement===selCell&&selCell.getAttribute('data-date')===f0);
    var mt=new Date(f0+'T00:00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'});
    ok('month and year header matches the value',$('edpTitle').textContent===mt,$('edpTitle').textContent);
    ok('placed directly below the input (4px gap), left-aligned, fully inside the viewport',Math.abs(pr.top-fr.bottom-4)<1.5&&(Math.abs(pr.left-fr.left)<1||pr.right<=cw-7)&&pr.left>=7&&pr.right<=cw-7&&pr.bottom<=innerHeight,[Math.round(pr.left),Math.round(pr.top),Math.round(pr.right),Math.round(pr.bottom)].join());
    var mid=document.elementFromPoint(pr.left+pr.width/2,pr.top+pr.height/2),edge=document.elementFromPoint(pr.left+10,pr.bottom-10);
    ok('not clipped or hidden behind panels (top layer: it is the topmost element)',pop.contains(mid)&&pop.contains(edge)&&pr.bottom>tbr.bottom);
    var ps=getComputedStyle(pop),sp=getComputedStyle($('model'),'::picker(select)');
    ok('same surface as the Select dropdown: background, border, radii, shadow',['backgroundColor','borderTopColor','borderTopWidth','borderTopLeftRadius','borderBottomLeftRadius','boxShadow'].every(function(p){return ps[p]===sp[p]}),['backgroundColor','borderTopLeftRadius','borderBottomLeftRadius'].map(function(p){return ps[p]+'/'+sp[p]}).join(' '));
    ok('same typography as the controls',ps.fontFamily===getComputedStyle($('provider')).fontFamily);
    var heads=[].map.call(pop.querySelectorAll('thead th'),function(t){return t.getAttribute('abbr')});
    ok('weekday header row (Sunday first) with full names for screen readers',heads.join()==='Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'&&pop.querySelectorAll('tbody td').length===42);
    var cells=[].slice.call(pop.querySelectorAll('tbody td')),cr=cells.map(function(c){return c.getBoundingClientRect()});
    ok('balanced grid: equal cells, 36px tall, evenly spaced',cr.every(function(r){return Math.abs(r.width-cr[0].width)<0.6&&Math.round(r.height)===36})&&Math.abs((cr[1].left-cr[0].right)-(cr[8].top-cr[1].bottom))<1.5);
    var sc=getComputedStyle(selCell);
    ok('selected date: filled Emagia primary, white bold number, aria-selected',sc.backgroundColor===PRIMARY&&sc.color==='rgb(255, 255, 255)'&&+sc.fontWeight>=600);
    var other=cells.filter(function(c){return c.classList.contains('is-other')})[0];
    ok('days outside the month are muted',other&&getComputedStyle(other).color==='rgb(107, 112, 128)');
    // keyboard
    key(selCell,'ArrowRight');var c1=document.activeElement,d0=new Date(f0+'T00:00:00');
    ok('→ moves one day',c1.getAttribute('data-date')===iso(new Date(d0.getFullYear(),d0.getMonth(),d0.getDate()+1)));
    key(c1,'ArrowDown');ok('↓ moves one week',document.activeElement.getAttribute('data-date')===iso(new Date(d0.getFullYear(),d0.getMonth(),d0.getDate()+8)));
    key(document.activeElement,'Home');ok('Home = start of week (Sunday)',new Date(document.activeElement.getAttribute('data-date')+'T00:00:00').getDay()===0);
    key(document.activeElement,'End');ok('End = end of week (Saturday)',new Date(document.activeElement.getAttribute('data-date')+'T00:00:00').getDay()===6);
    var t1=$('edpTitle').textContent;key(document.activeElement,'PageDown');
    ok('PageDown = next month (heading updates, focus kept in the grid)',$('edpTitle').textContent!==t1&&document.activeElement.classList.contains('edp-day')&&$('edpTitle').getAttribute('aria-live')==='polite');
    key(document.activeElement,'PageUp');ok('PageUp = previous month',$('edpTitle').textContent===t1);
    var nav=pop.querySelectorAll('.edp-nav');
    ok('previous / next month buttons labelled',nav[0].getAttribute('aria-label')==='Previous month'&&nav[1].getAttribute('aria-label')==='Next month');
    nav[1].click();var t2=$('edpTitle').textContent;nav[0].click();
    ok('previous / next buttons navigate months',t2!==t1&&$('edpTitle').textContent===t1);
    var fcs=[].slice.call(pop.querySelectorAll('button:not(:disabled),[tabindex="0"]'));fcs[fcs.length-1].focus();key(document.activeElement,'Tab');
    ok('Tab stays inside the popup (wraps)',document.activeElement===fcs[0]&&pop.matches(':popover-open'));
    key(document.activeElement,'Escape');await wait(50);
    ok('Esc closes, value unchanged, focus back on the calendar button',!pop.matches(':popover-open')&&from.value===f0&&chg===0&&document.activeElement===fb&&fb.getAttribute('aria-expanded')==='false');
    // select a date with the keyboard
    key(from,'ArrowDown',{altKey:true});await wait(150);
    ok('Alt+↓ in the input opens the calendar',pop.matches(':popover-open')&&document.activeElement.getAttribute('data-date')===f0);
    key(document.activeElement,'ArrowRight');var pickD=document.activeElement.getAttribute('data-date');key(document.activeElement,'Enter');await wait(50);
    ok('Enter selects: input updated, change fired, popup closed, focus returned',from.value===pickD&&chg===1&&!pop.matches(':popover-open')&&document.activeElement===fb);
    ok('existing date behaviour runs: preset becomes Custom, range valid',document.querySelector('#presets [aria-pressed="true"]').dataset.p==='custom'&&!vis('dateErr')&&from.getAttribute('aria-invalid')==='false');
    ok('no layout shift from opening/selecting',Math.round($('toolbar').getBoundingClientRect().height)===Math.round(tbr.height));
    // To calendar: today marker vs selected; click selection; existing validation
    tb.click();await wait(150);
    var today=iso(new Date()),tc=pop.querySelector('[data-date="'+today+'"]'),tcs=tc&&getComputedStyle(tc);
    ok('today is marked (aria-current="date", bold primary + dot) and differs from a selected date',tc&&tc.getAttribute('aria-current')==='date'&&/today/.test(tc.getAttribute('aria-label'))&&+tcs.fontWeight>=600&&/radial-gradient/.test(tcs.backgroundImage)&&(tc.getAttribute('aria-selected')==='true'?tcs.backgroundColor===PRIMARY:tcs.backgroundColor!==PRIMARY),tc&&[tc.getAttribute('aria-current'),tc.getAttribute('aria-label'),tcs.fontWeight,tcs.backgroundImage.slice(0,30),tcs.backgroundColor,tc.getAttribute('aria-selected')].join(' | '));
    key(document.activeElement,'PageUp',{shiftKey:true});
    var early=pop.querySelector('tbody td:not(.is-other)');
    ok('Shift+PageUp = previous year',early&&early.getAttribute('data-date')<from.value);
    early.click();await wait(50);ok('click selects; From after To still reported by the existing validation',to.value===early.getAttribute('data-date')&&vis('dateErr')&&to.getAttribute('aria-invalid')==='true'&&!pop.matches(':popover-open'));
    tb.click();await wait(100);pop.querySelector('[data-act="clear"]').click();await wait(50);
    ok('Clear empties the field; existing “select both dates” message',to.value===''&&vis('dateErr')&&/both/.test($('dateErr').textContent));
    tb.click();await wait(100);
    ok('empty field opens on today\'s month',$('edpTitle').textContent===new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'}));
    pop.querySelector('[data-act="today"]').click();await wait(50);
    ok('Today selects today',to.value===today&&!pop.matches(':popover-open'));
    // disabled dates (only when an input declares min/max — none do today)
    from.min=from.value;fb.click();await wait(100);
    var dis=[].filter.call(pop.querySelectorAll('tbody td'),function(c){return c.getAttribute('data-date')<from.min}),dv=from.value;
    ok('dates outside min/max are disabled: aria-disabled, muted + struck through, not selectable',dis.length>0&&dis.every(function(c){return c.getAttribute('aria-disabled')==='true'})&&getComputedStyle(dis[0]).textDecorationLine==='line-through'&&getComputedStyle(dis[0]).cursor==='not-allowed');
    dis[0].click();await wait(30);ok('clicking a disabled date does nothing',from.value===dv&&pop.matches(':popover-open'));
    key(document.activeElement,'Escape');from.removeAttribute('min');await wait(30);
    ok('no min/max on the CFO date fields (nothing disabled by default)',!from.min&&!from.max&&!to.min&&!to.max);
    // only one popup at a time: opening the other closes the first
    fb.click();await wait(80);tb.click();await wait(80);
    ok('one calendar at a time (switching fields reuses the popup)',pop.matches(':popover-open')&&tb.getAttribute('aria-expanded')==='true'&&fb.getAttribute('aria-expanded')==='false'&&document.querySelectorAll('.edp-pop').length===1);
    key(document.activeElement,'Escape');
    // restore + summary still uses the input range
    var fc=from.value,tcv=to.value;
    $('to').value=iso(new Date());$('to').dispatchEvent(new Event('change',{bubbles:true}));
    var a=document.querySelector('#agentList .agent-main');a.click();await wait(1000);
    var exp=new Date(from.value+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric'});
    ok('summary loads with the picked range (local sample data)',vis('stResult')&&$('mRange').textContent.indexOf(exp)===0,$('mRange').textContent);
    ok('no network requests',!net.length&&!performance.getEntriesByType('resource').some(function(e){return !/^file:|^data:|^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(e.name)}),net.join());
    ok('no horizontal page scroll',document.documentElement.scrollWidth<=innerWidth+1,document.documentElement.scrollWidth);
    ok('no JS errors',!errs.length,errs.join(' | '));
    var o=document.createElement('pre');o.id='harnessOut';o.textContent=JSON.stringify(R);document.body.appendChild(o);
  }
  window.addEventListener('load',function(){run().catch(function(e){var o=document.createElement('pre');o.id='harnessOut';o.textContent=JSON.stringify(R.concat([{name:'harness crashed',pass:false,info:e.stack}]));document.body.appendChild(o)})});
})();
