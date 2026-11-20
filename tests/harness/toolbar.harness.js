(function(){
  // Workspace toolbar: date fields (native picker, refined styling) and LLM Provider / Model selects (approved lists).
  var R=[],errs=[],net=[];
  window.addEventListener('error',function(e){errs.push(String(e.message||e.target&&e.target.src))},true);
  var of=window.fetch;window.fetch=function(u){net.push('fetch '+u);return of.apply(this,arguments)};
  var ox=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){net.push('xhr '+u);return ox.apply(this,arguments)};
  var $=function(id){return document.getElementById(id)};
  function ok(n,c,i){R.push({name:'['+innerWidth+'px toolbar] '+n,pass:!!c,info:i===undefined?'':String(i)})}
  function wait(ms){return new Promise(function(r){setTimeout(r,ms)})}
  function vis(el){if(typeof el==='string')el=$(el);return !!el&&!el.hidden&&el.getBoundingClientRect().width>0}
  function change(el,v){el.value=v;el.dispatchEvent(new Event('change',{bubbles:true}))}
  function textW(el,t){var c=document.createElement('canvas').getContext('2d'),cs=getComputedStyle(el);c.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;return c.measureText(t).width}
  var PROVIDERS=['OpenAI','Ollama'];
  var MODELS=['ollama/gpt-oss:latest','ollama/gemma3:latest','ollama/llama3.2:latest','ollama/deepseek-r1:latest','ollama/qwen2.5-coder:latest'];
  function optsOf(id){return [].map.call($(id).options,function(o){return o.value+'|'+o.textContent})}
  async function run(){
    await wait(300);
    var pv=$('provider'),md=$('model'),from=$('from'),to=$('to');
    // ---- LLM Provider / Model ----
    ok('Provider: exactly OpenAI, Ollama (in order)',JSON.stringify(optsOf('provider'))===JSON.stringify(PROVIDERS.map(function(p){return p+'|'+p})),optsOf('provider').join());
    ok('Model: exactly the 5 approved ids, in order, unchanged',JSON.stringify(optsOf('model'))===JSON.stringify(MODELS.map(function(m){return m+'|'+m})),optsOf('model').join());
    ok('no placeholder options remain',!/\[Provider|\[Model/.test(pv.innerHTML+md.innerHTML));
    ok('documented default: Ollama + ollama/gpt-oss:latest, valid, no message',pv.value==='Ollama'&&md.value==='ollama/gpt-oss:latest'&&!vis('llmErr')&&pv.getAttribute('aria-invalid')==='false');
    ok('selects labelled and say they are local UI settings',document.querySelector('label[for="provider"]').textContent==='LLM Provider'&&document.querySelector('label[for="model"]').textContent==='LLM Model'&&/no model is called/.test(pv.title)&&/no model is called/.test(md.title));
    var longest=MODELS.reduce(function(a,b){return textW(md,b)>textW(md,a)?b:a});
    change(md,longest);
    var avail=md.clientWidth-parseFloat(getComputedStyle(md).paddingLeft)-parseFloat(getComputedStyle(md).paddingRight);
    ok('longest model id is not clipped',textW(md,longest)<=avail+0.5,Math.round(textW(md,longest))+' / '+Math.round(avail));
    ok('model selection updates and stays valid with Ollama',md.value===longest&&!vis('llmErr'));
    var ps=getComputedStyle(pv),ms=getComputedStyle(md),fs=getComputedStyle(from);
    ok('selects match the design system: 36px, 8px radius, surface, chevron, same font as other controls',[ps,ms].every(function(c){return c.height==='36px'&&c.borderTopLeftRadius==='8px'&&c.backgroundColor==='rgb(255, 255, 255)'&&/svg/.test(c.backgroundImage)&&(c.appearance==='base-select'||c.appearance==='none')})&&ps.fontFamily===ms.fontFamily,[ps.height,ps.borderTopLeftRadius,ps.fontFamily].join(' '));
    var reqs=net.length;
    change(pv,'OpenAI');await wait(10);
    ok('provider change updates state, keeps the model (no silent switch), no request',pv.value==='OpenAI'&&md.value===longest&&net.length===reqs);
    ok('unsupported OpenAI + Ollama model: clear message, aria-invalid + described, no fake success',vis('llmErr')&&/OpenAI can’t run ollama\//.test($('llmErr').textContent)&&/no OpenAI models are configured/.test($('llmErr').textContent)&&/No model is called/.test($('llmErr').textContent)&&pv.getAttribute('aria-invalid')==='true'&&md.getAttribute('aria-describedby')==='llmErr'&&!/connected|success|available now/i.test($('llmErr').textContent),$('llmErr').textContent);
    change(md,MODELS[1]);ok('still unsupported for any listed model with OpenAI',vis('llmErr')&&/ollama\/gemma3:latest/.test($('llmErr').textContent));
    change(pv,'Ollama');ok('back to Ollama: valid, message cleared, model kept',!vis('llmErr')&&md.value===MODELS[1]&&pv.getAttribute('aria-invalid')==='false'&&!md.hasAttribute('aria-describedby'));
    // ---- date fields ----
    ok('date fields: native date inputs, labelled, default 30-day range',from.type==='date'&&to.type==='date'&&document.querySelector('label[for="from"]')&&from.value&&to.value&&document.querySelector('#presets [aria-pressed="true"]').dataset.p==='30');
    var fr=from.getBoundingClientRect(),tr=to.getBoundingClientRect(),pr=pv.getBoundingClientRect();
    ok('date fields: 36px, 8px radius, surface, aligned with the selects',fs.height==='36px'&&fs.borderTopLeftRadius==='8px'&&fs.backgroundColor==='rgb(255, 255, 255)'&&(innerWidth<768||Math.abs(fr.top-pr.top)<1&&Math.abs(tr.top-fr.top)<1||Math.abs(fr.bottom-tr.bottom)<1),[fs.height,Math.round(fr.top),Math.round(pr.top)].join(' '));
    ok('date padding refined (text 12px from the left edge; room for the calendar button)',fs.paddingLeft==='12px'&&fs.paddingRight==='40px'&&fs.fontSize==='13px');
    var tb=$('toolbar').getBoundingClientRect(),ws=$('ws').getBoundingClientRect();
    change(from,'2026-11-01');change(to,'2026-11-10');await wait(10);
    ok('selected dates reflected in the inputs; preset becomes Custom; valid',from.value==='2026-11-01'&&to.value==='2026-11-10'&&document.querySelector('#presets [aria-pressed="true"]').dataset.p==='custom'&&!vis('dateErr'));
    ok('no layout shift from a valid date change',Math.round($('toolbar').getBoundingClientRect().height)===Math.round(tb.height)&&Math.round($('ws').getBoundingClientRect().top)===Math.round(ws.top));
    change(from,'2026-11-12');await wait(10);
    ok('invalid range still reported as before',vis('dateErr')&&from.getAttribute('aria-invalid')==='true');
    change(from,'2026-11-01');
    ok('valid again',!vis('dateErr'));
    // Summarize still works with the chosen dates and selections; summary uses local sample data (model not called)
    var a=document.querySelector('#agentList .agent-main');a.click();await wait(1000);
    ok('summary loads; range from the inputs; model not called',vis('stResult')&&/Nov 01, 2026 – Nov 10, 2026/.test($('mRange').textContent)&&$('mModel').textContent==='Not called — local sample data',$('mRange').textContent);
    ok('no network requests',!net.length&&!performance.getEntriesByType('resource').some(function(e){return !/^file:|^data:|^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(e.name)}),net.join());
    ok('no horizontal page scroll',document.documentElement.scrollWidth<=innerWidth+1,document.documentElement.scrollWidth);
    ok('no JS errors',!errs.length,errs.join(' | '));
    var o=document.createElement('pre');o.id='harnessOut';o.textContent=JSON.stringify(R);document.body.appendChild(o);
  }
  window.addEventListener('load',function(){run().catch(function(e){var o=document.createElement('pre');o.id='harnessOut';o.textContent=JSON.stringify(R.concat([{name:'harness crashed',pass:false,info:e.stack}]));document.body.appendChild(o)})});
})();
