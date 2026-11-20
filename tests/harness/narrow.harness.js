(function(){
  var R=[],errs=[];window.addEventListener('error',function(e){errs.push(e.message)});
  var $=function(id){return document.getElementById(id)};
  function ok(n,c,i){R.push({name:'['+innerWidth+'px] '+n,pass:!!c,info:i===undefined?'':String(i)})}
  function wait(ms){return new Promise(function(r){setTimeout(r,ms)})}
  function vis(id){var e=$(id);return e&&!e.hidden&&!e.closest('[hidden]')}
  async function run(){
    await wait(300);
    document.querySelector('#catTabs .tab[data-cat="kpis"]').click();await wait(50);
    document.querySelectorAll('#agentList .agent-main')[0].click();await wait(950);
    ok('summary loads',vis('stResult')&&$('sumAgent').textContent==='KPI Scorecard');
    if(innerWidth<1280)ok('chart moved into center tab',$('chartPane').contains($('chartContent'))&&getComputedStyle($('centerTabs')).display!=='none');
    else ok('chart stays in right panel',$('rightBody').contains($('chartContent')));
    $('ctabChart').click();await wait(100);
    ok('chart tab draws sample chart',/sample data, KPI attainment vs target/.test($('chart').getAttribute('aria-label'))&&$('chartTable').tBodies[0].rows.length===5,$('chart').getAttribute('aria-label'));
    $('ctabSummary').click();await wait(30);
    document.querySelectorAll('#chips .chip')[0].click();await wait(900);
    var m=document.querySelectorAll('#thread .msg.ai');ok('chat works',m.length===1&&/Overdue AR/.test(m[0].textContent));
    ok('no horizontal page scroll',document.documentElement.scrollWidth<=innerWidth+1,document.documentElement.scrollWidth);
    ok('no JS errors',!errs.length,errs.join('|'));
    var o=document.createElement('pre');o.id='harnessOut';o.textContent=JSON.stringify(R);document.body.appendChild(o);
  }
  window.addEventListener('load',function(){run()});
})();
