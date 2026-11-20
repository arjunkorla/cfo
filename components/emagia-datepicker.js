/* Emagia calendar date picker — enhances native <input type="date" data-emagia-datepicker> (vanilla JS, no dependencies,
   no network calls). Styles: components/emagia-pickers.css (shared surface with the Select dropdown).

   The native input stays the source of truth: typing in its segments, its value (YYYY-MM-DD), min/max and every
   existing 'change' listener are unchanged. Only the native calendar popup (which cannot be styled) is replaced by a
   calendar button that opens one shared popover (top layer: never clipped by panels).
   Picking a date sets input.value and dispatches 'input' + 'change' (bubbling), then closes and returns focus to the
   calendar button — the same as the native picker. No date maths beyond building the visible month.

   Keyboard: Alt+↓ in the input or Enter/Space on the button opens. In the grid: ←/→ day, ↑/↓ week, Home/End week
   start/end, PageUp/PageDown month (Shift: year), Enter/Space select. Tab cycles inside the popup; Esc closes.
   Click outside closes (popover light dismiss). Dates outside min/max are disabled (none are set today).
   API: window.EmagiaDatePicker.{enhance(input), open(input), close()} */
(function () {
  'use strict';
  var P = {
    cal: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>'
  };
  function svg(n, s) { return '<svg xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + P[n] + '</svg>'; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function toIso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(v) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function addMonths(d, n) { var t = new Date(d.getFullYear(), d.getMonth() + n, 1), last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate(); return new Date(t.getFullYear(), t.getMonth(), Math.min(d.getDate(), last)); }
  var fmtMonth = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
  var fmtLong = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  var DAYS = [['Su', 'Sunday'], ['Mo', 'Monday'], ['Tu', 'Tuesday'], ['We', 'Wednesday'], ['Th', 'Thursday'], ['Fr', 'Friday'], ['Sa', 'Saturday']];

  var pop, title, body, cur = null, focusD = null;
  function build() {
    pop = document.createElement('div');
    pop.className = 'edp-pop'; pop.id = 'edpPop'; pop.setAttribute('popover', 'auto');
    pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-modal', 'false'); pop.setAttribute('aria-labelledby', 'edpTitle');
    pop.innerHTML = '<div class="edp-head"><button type="button" class="edp-nav" data-nav="-1" aria-label="Previous month">' + svg('left', 16) + '</button>' +
      '<h2 class="edp-title" id="edpTitle" aria-live="polite"></h2>' +
      '<button type="button" class="edp-nav" data-nav="1" aria-label="Next month">' + svg('right', 16) + '</button></div>' +
      '<table class="edp-grid" role="grid" aria-labelledby="edpTitle"><thead><tr>' +
      DAYS.map(function (d) { return '<th scope="col" abbr="' + d[1] + '"><span aria-hidden="true">' + d[0] + '</span><span class="sr-only">' + d[1] + '</span></th>'; }).join('') +
      '</tr></thead><tbody></tbody></table>' +
      '<div class="edp-foot"><button type="button" class="edp-link" data-act="clear">Clear</button><button type="button" class="edp-link" data-act="today">Today</button></div>';
    document.body.appendChild(pop);
    title = pop.querySelector('.edp-title'); body = pop.querySelector('tbody');
    pop.addEventListener('click', function (e) {
      var nav = e.target.closest('[data-nav]'), day = e.target.closest('.edp-day'), act = e.target.closest('[data-act]');
      if (nav) { focusD = addMonths(focusD, +nav.getAttribute('data-nav')); render(false); }
      else if (day) { if (!day.classList.contains('is-disabled')) pick(parse(day.getAttribute('data-date'))); }
      else if (act && !act.disabled) { if (act.getAttribute('data-act') === 'today') pick(today()); else pick(null); }
    });
    pop.addEventListener('keydown', onKey);
    // 'beforetoggle' fires synchronously for every close (Esc, selection, click outside), so state never lags
    pop.addEventListener('beforetoggle', function (e) {
      if (e.newState !== 'closed' || !cur) return;
      cur.btn.setAttribute('aria-expanded', 'false'); cur.wrap.classList.remove('is-open');
      window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true);
      cur = null;
    });
  }
  function today() { var t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); }
  function bounds() { return { min: parse(cur.input.min), max: parse(cur.input.max) }; }
  function allowed(d) { var b = bounds(); return !(b.min && d < b.min) && !(b.max && d > b.max); }

  function render(focusCell) {
    var sel = parse(cur.input.value), t = toIso(today()), y = focusD.getFullYear(), m = focusD.getMonth();
    var first = new Date(y, m, 1), start = addDays(first, -first.getDay()), html = '';
    title.textContent = fmtMonth.format(first);
    for (var w = 0; w < 6; w++) {
      html += '<tr>';
      for (var i = 0; i < 7; i++) {
        var d = addDays(start, w * 7 + i), iso = toIso(d), isSel = sel && iso === toIso(sel), isFocus = iso === toIso(focusD), ok = allowed(d);
        html += '<td role="gridcell" class="edp-day' + (d.getMonth() !== m ? ' is-other' : '') + (iso === t ? ' is-today' : '') + (isSel ? ' is-selected' : '') + (ok ? '' : ' is-disabled') + '"' +
          ' data-date="' + iso + '" tabindex="' + (isFocus ? '0' : '-1') + '" aria-selected="' + (isSel ? 'true' : 'false') + '"' +
          (iso === t ? ' aria-current="date"' : '') + (ok ? '' : ' aria-disabled="true"') + ' aria-label="' + fmtLong.format(d) + (iso === t ? ', today' : '') + '">' + d.getDate() + '</td>';
      }
      html += '</tr>';
    }
    body.innerHTML = html;
    pop.querySelector('[data-act="today"]').disabled = !allowed(today());
    if (focusCell) { var c = body.querySelector('[tabindex="0"]'); if (c) c.focus(); }
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); return; }
    if (e.key === 'Tab') { // keep focus inside the popup while it is open
      var f = [].slice.call(pop.querySelectorAll('button:not(:disabled),[tabindex="0"]')), i = f.indexOf(document.activeElement);
      e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); return;
    }
    var cell = e.target.closest && e.target.closest('.edp-day'); if (!cell) return;
    var d = focusD, n = null;
    switch (e.key) {
      case 'ArrowLeft': n = addDays(d, -1); break; case 'ArrowRight': n = addDays(d, 1); break;
      case 'ArrowUp': n = addDays(d, -7); break; case 'ArrowDown': n = addDays(d, 7); break;
      case 'Home': n = addDays(d, -d.getDay()); break; case 'End': n = addDays(d, 6 - d.getDay()); break;
      case 'PageUp': n = addMonths(d, e.shiftKey ? -12 : -1); break; case 'PageDown': n = addMonths(d, e.shiftKey ? 12 : 1); break;
      case 'Enter': case ' ': e.preventDefault(); if (!cell.classList.contains('is-disabled')) pick(d); return;
      default: return;
    }
    e.preventDefault(); focusD = n; render(true);
  }
  function place() {
    if (!cur) return;
    var r = cur.input.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight, cw = document.documentElement.clientWidth, vh = window.innerHeight;
    var left = Math.max(8, Math.min(r.left, cw - w - 8)), top = r.bottom + 4;
    if (top + h > vh - 8 && r.top - h - 4 >= 8) top = r.top - h - 4; // flip above when there is no room below
    pop.style.left = Math.round(left) + 'px'; pop.style.top = Math.round(Math.max(8, top)) + 'px';
  }
  function open(input) {
    var s = input && input._edp; if (!s || input.disabled) return;
    if (!pop) build();
    if (cur && cur.input === input) return;
    if (cur) close(false);
    cur = s; focusD = parse(input.value) || today();
    render(false);
    pop.showPopover(); place();
    s.btn.setAttribute('aria-expanded', 'true'); s.wrap.classList.add('is-open');
    window.addEventListener('resize', place); window.addEventListener('scroll', place, true);
    var c = body.querySelector('[tabindex="0"]'); if (c) c.focus();
  }
  function close(returnFocus) {
    if (!cur) return;
    var btn = cur.btn;
    try { pop.hidePopover(); } catch (x) { }
    if (returnFocus) btn.focus();
  }
  function pick(d) {
    var input = cur.input;
    input.value = d ? toIso(d) : '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    close(true);
  }
  function enhance(input) {
    if (!input || input._edp || input.type !== 'date') return;
    var wrap = document.createElement('span'), btn = document.createElement('button');
    wrap.className = 'edp-wrap';
    input.parentNode.insertBefore(wrap, input); wrap.appendChild(input);
    input.classList.add('edp-input');
    var lbl = input.id && document.querySelector('label[for="' + input.id + '"]'), name = lbl ? lbl.textContent.trim() : 'date';
    btn.type = 'button'; btn.className = 'edp-btn';
    btn.setAttribute('aria-label', 'Choose ' + name + ' date'); btn.setAttribute('title', 'Choose ' + name + ' date');
    btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'edpPop');
    btn.innerHTML = svg('cal', 16);
    wrap.appendChild(btn);
    input._edp = { input: input, btn: btn, wrap: wrap };
    // The button sits outside the popover, so pressing it while open light-dismisses the popup before 'click':
    // remember whether it was open at pointerdown so the click acts as a toggle instead of reopening.
    var wasOpen = false;
    btn.addEventListener('pointerdown', function () { wasOpen = !!(cur && cur.input === input); });
    btn.addEventListener('click', function () {
      var was = wasOpen || !!(cur && cur.input === input); wasOpen = false;
      if (was) close(true); else open(input);
    });
    input.addEventListener('keydown', function (e) { if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); open(input); } });
  }
  function init() { [].forEach.call(document.querySelectorAll('input[type="date"][data-emagia-datepicker]'), enhance); }
  window.EmagiaDatePicker = { enhance: enhance, open: open, close: function () { close(false); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
