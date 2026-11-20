/* Emagia application launcher — reusable right-side rail (vanilla JS, no dependencies, no network calls).

   Usage (after the shared header, so the compact trigger can join its right-hand group):
     <link rel="stylesheet" href="components/emagia-app-launcher.css">
     <script src="components/emagia-app-launcher.config.js"></script>
     <script src="components/emagia-app-launcher.js"></script>

   ≥ 768px: a fixed vertical rail on the far right, below the header (body.eal-on reserves its width on <main>).
   < 768px: the rail is hidden and an "Applications" icon in the header opens the same 11 items as a menu, using the
   header's shared menu controller (EmagiaHeader.registerMenu) — one menu behaviour, not a copy.
   Items: config order; the current application has aria-current="page" (light-blue circle + primary icon). Items
   without an approved href never navigate: they announce "<App> is not linked in this prototype." (page toast) and
   fire 'emagia-apps:select' {id, linked:false}. Tooltips show the name on hover and keyboard focus (Esc hides).
   API: window.EmagiaAppLauncher.{items, current}. */
(function () {
  'use strict';
  var ICONS = {
    'sparkles': '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
    'bot': '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
    'bot-message-square': '<path d="M12 6V2H8"/><path d="m8 18-4 4V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z"/><path d="M2 12h2"/><path d="M9 11v2"/><path d="M15 11v2"/><path d="M20 12h2"/>',
    'workflow': '<rect width="8" height="8" x="3" y="3" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect width="8" height="8" x="13" y="13" rx="2"/>',
    'wallet': '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    'phone': '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    'chart-no-axes-combined': '<path d="M12 16v5"/><path d="M16 14v7"/><path d="M20 10v11"/><path d="m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15"/><path d="M4 18v3"/><path d="M8 14v7"/>',
    'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    'hard-drive': '<line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" x2="6.01" y1="16" y2="16"/><line x1="10" x2="10.01" y1="16" y2="16"/>',
    'chart-pie': '<path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"/><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>',
    'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    'layout-grid': '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>'
  };
  var cfg = window.EMAGIA_APPS_CONFIG, api = window.EmagiaAppLauncher = { items: [], current: null };
  if (!cfg || !cfg.items || !cfg.items.length) return;
  api.items = cfg.items.map(function (a) { return a.id; }); api.current = cfg.current || null;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function svg(name, size) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>';
  }
  function byId(id) { for (var i = 0; i < cfg.items.length; i++) if (cfg.items[i].id === id) return cfg.items[i]; return null; }
  function select(app) {
    if (!app) return;
    var cur = app.id === cfg.current, msg;
    if (cur) msg = app.label + ' is the current application.';
    else if (app.href) { location.href = app.href; return; } // only approved destinations (none in this prototype)
    else msg = app.label + ' is not linked in this prototype.';
    if (typeof window.toast === 'function') window.toast(msg);
    document.dispatchEvent(new CustomEvent('emagia-apps:select', { detail: { id: app.id, linked: false, current: cur } }));
  }

  /* ---------------- Rail (≥ 768px) ---------------- */
  var rail = document.createElement('nav');
  rail.className = 'eal-rail'; rail.id = 'ealRail'; rail.setAttribute('aria-label', cfg.ariaLabel || 'Applications');
  rail.innerHTML = '<ul class="eal-list">' + cfg.items.map(function (a) {
    var cur = a.id === cfg.current;
    return '<li><button type="button" class="eal-btn" data-app="' + esc(a.id) + '" aria-label="' + esc(a.label) + '"' +
      (cur ? ' aria-current="page"' : (a.href ? '' : ' aria-describedby="ealUnlinked"')) + '>' + svg(a.icon, 20) + '</button></li>';
  }).join('') + '</ul><span class="sr-only" id="ealUnlinked">Not linked in this prototype</span>';
  document.body.appendChild(rail);
  document.body.classList.add('eal-on');
  var btns = [].slice.call(rail.querySelectorAll('.eal-btn'));

  // one shared tooltip, fixed-positioned so the rail can scroll on short screens without clipping it
  var tip = document.createElement('div');
  tip.className = 'eal-tip'; tip.id = 'ealTip'; tip.setAttribute('aria-hidden', 'true'); tip.hidden = true;
  document.body.appendChild(tip);
  function showTip(b) {
    var r = b.getBoundingClientRect(), app = byId(b.getAttribute('data-app'));
    tip.textContent = app.label; tip.hidden = false;
    tip.style.top = (r.top + r.height / 2) + 'px';
    tip.style.right = (document.documentElement.clientWidth - r.left + 8) + 'px';
  }
  function hideTip() { tip.hidden = true; }
  rail.addEventListener('mouseover', function (e) { var b = e.target.closest('.eal-btn'); if (b) showTip(b); });
  rail.addEventListener('mouseleave', hideTip);
  rail.addEventListener('focusin', function (e) { var b = e.target.closest('.eal-btn'); if (b) showTip(b); });
  rail.addEventListener('focusout', hideTip);
  rail.addEventListener('scroll', hideTip, { passive: true });
  rail.addEventListener('click', function (e) { var b = e.target.closest('.eal-btn'); if (b) select(byId(b.getAttribute('data-app'))); });
  rail.addEventListener('keydown', function (e) {
    var i = btns.indexOf(document.activeElement), n = -1;
    if (e.key === 'Escape') { if (!tip.hidden) { e.stopPropagation(); hideTip(); } return; } // dismiss the tooltip only
    if (i < 0) return;
    if (e.key === 'ArrowDown') n = (i + 1) % btns.length; else if (e.key === 'ArrowUp') n = i <= 0 ? btns.length - 1 : i - 1;
    else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = btns.length - 1;
    if (n >= 0) { e.preventDefault(); btns[n].focus(); }
  });

  /* ---------------- Compact menu in the header (< 768px) ---------------- */
  var H = window.EmagiaHeader, right = document.querySelector('[data-emagia-header] .tb-right');
  if (H && typeof H.registerMenu === 'function' && right) {
    var wrap = document.createElement('div');
    wrap.className = 'eh-menu-wrap eal-menu-wrap';
    wrap.innerHTML = '<button class="icon-btn" type="button" id="ealBtn" aria-label="' + esc(cfg.ariaLabel || 'Applications') + '" title="' + esc(cfg.ariaLabel || 'Applications') + '" aria-haspopup="menu" aria-expanded="false" aria-controls="ealMenu">' + svg('layout-grid', 18) + '</button>' +
      '<div class="eh-pop eh-menu eal-menu" id="ealPop" hidden><div role="menu" id="ealMenu" aria-label="' + esc(cfg.ariaLabel || 'Applications') + '">' +
      cfg.items.map(function (a) {
        var cur = a.id === cfg.current;
        return '<button type="button" class="eh-item" role="menuitem" tabindex="-1" data-app="' + esc(a.id) + '"' + (cur ? ' aria-current="page"' : '') + '>' +
          '<span class="eal-mi" aria-hidden="true">' + svg(a.icon, 16) + '</span><span class="eh-item-text">' + esc(a.label) +
          '<span class="eh-item-sub">' + (cur ? 'Current application' : (a.href ? '' : 'Not linked in this prototype')) + '</span></span></button>';
      }).join('') + '</div></div>';
    right.insertBefore(wrap, right.querySelector('.tb-div'));
    H.registerMenu(document.getElementById('ealBtn'), document.getElementById('ealPop'), function (it, m) {
      H.closeMenu(m, true); select(byId(it.getAttribute('data-app')));
    });
  }
})();
