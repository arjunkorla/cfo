(function(){
  var R=[],errs=[];window.addEventListener('error',function(e){errs.push(String(e.message))});
  var $=function(id){return document.getElementById(id)};
  function ok(n,c,i){R.push({name:'['+innerWidth+'px '+location.pathname.split('/').pop()+'] '+n,pass:!!c,info:i===undefined?'':String(i)})}
  function wait(ms){return new Promise(function(r){setTimeout(r,ms)})}
  var ORDER=['Home','Credit','Collections','Receivables','Cash App','Deductions','Disputes','Reports','Order Entry','GIA Emails','GCC','Emagia Exchange','AP Portals','CFO'];
  async function run(){
    await wait(200);
    var sb=$('sidebar'),items=[].slice.call(sb.querySelectorAll('nav .sb-item'));
    var labels=items.map(function(a){return a.querySelector('.sb-label').textContent});
    ok('14 items in the specified order',JSON.stringify(labels)===JSON.stringify(ORDER),labels.join(' | '));
    ok('Emagia Exchange, AP Portals, CFO directly after GCC',labels.slice(10).join('|')==='GCC|Emagia Exchange|AP Portals|CFO');
    ok('semantic nav with accessible name',sb.tagName==='ASIDE'&&sb.getAttribute('aria-label')==='Primary navigation'&&sb.querySelector('nav[aria-label]'));
    var cur=sb.querySelectorAll('[aria-current="page"]');
    ok('exactly one active item: CFO',cur.length===1&&cur[0].dataset.navKey==='cfo');
    ok('CFO keeps its existing route',items[13].getAttribute('href')==='cfo-overview.html');
    ok('no invented routes (other items have no href)',items.slice(0,13).every(function(a){return !a.hasAttribute('href')&&a.getAttribute('aria-disabled')==='true'&&a.tabIndex===0}));
    ok('every item has an icon',items.every(function(a){return a.querySelector('svg')&&a.querySelector('svg').childNodes.length>0}));
    ok('hamburger at top, footer branding at bottom',sb.firstElementChild.querySelector('.sb-toggle')&&sb.querySelector('.sb-foot img[alt="Powered by Emagia"]')&&sb.querySelectorAll('.sb-sep').length===2);
    var img=sb.querySelector('.sb-foot img');await wait(100);ok('footer image loads',img.complete&&img.naturalWidth>0);
    // unrouted item: click + keyboard announce, no navigation
    var h0=location.href;items[11].dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));await wait(30);
    ok('unrouted item announces instead of navigating',location.href===h0&&/Emagia Exchange isn’t linked/.test($('toasts').textContent));
    items[12].focus();items[12].dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await wait(30);
    ok('Enter on unrouted item announces',/AP Portals isn’t linked/.test($('toasts').textContent));
    items[0].focus();items[0].dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));
    ok('ArrowDown moves focus',document.activeElement===items[1]);
    items[1].dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true}));ok('End moves to last',document.activeElement===items[13]);
    var tg=sb.querySelector('.sb-toggle');
    if(innerWidth>=1024){
      var w0=sb.getBoundingClientRect().width;
      ok('expanded by default',w0===88&&tg.getAttribute('aria-expanded')==='true'&&tg.getAttribute('aria-label')==='Collapse navigation',w0);
      tg.click();await wait(50);
      var w1=sb.getBoundingClientRect().width,lab=items[2].querySelector('.sb-label').getBoundingClientRect().width;
      ok('hamburger collapses to icon rail',w1===64&&tg.getAttribute('aria-expanded')==='false'&&lab<=1,w1+' / label '+lab);
      ok('collapsed: tooltips + accessible names kept',items[2].title==='Collections'&&/Collections/.test(items[2].textContent));
      ok('content offset follows the rail',parseFloat(getComputedStyle(document.querySelector('.content')).paddingLeft)===64);
      var saved=null;try{saved=localStorage.getItem('erms.emagia.sidebar.collapsed')}catch(e){}ok('collapsed state persisted',saved==='1');
      tg.click();await wait(50);ok('hamburger expands again',sb.getBoundingClientRect().width===88&&!items[2].title);
      ok('no horizontal overflow in rail',[].every.call(sb.querySelectorAll('.sb-label'),function(l){return l.scrollWidth<=l.clientWidth+1}));
    }else{
      ok('off-canvas on small screens',sb.getBoundingClientRect().right<=0);
      $('menuBtn').click();await wait(250);
      ok('menu button opens drawer',document.body.classList.contains('nav-open')&&tg.getAttribute('aria-expanded')==='true'&&tg.getAttribute('aria-label')==='Close navigation');
      tg.click();await wait(50);
      ok('sidebar hamburger closes drawer and returns focus',!document.body.classList.contains('nav-open')&&document.activeElement===$('menuBtn'));
    }
    ok('no horizontal page scroll',document.documentElement.scrollWidth<=innerWidth+1,document.documentElement.scrollWidth);
    ok('no JS errors',!errs.length,errs.join(' | '));
    var o=document.createElement('pre');o.id='harnessOut';o.textContent=JSON.stringify(R);document.body.appendChild(o);
  }
  window.addEventListener('load',function(){try{localStorage.removeItem('erms.emagia.sidebar.collapsed')}catch(e){}document.body.classList.remove('sb-collapsed');run().catch(function(e){var o=document.createElement('pre');o.id='harnessOut';o.textContent=JSON.stringify(R.concat([{name:'harness crashed',pass:false,info:e.stack}]));document.body.appendChild(o)})});
})();
