/* Emagia O2C left navigation — reusable sidebar component (vanilla JS, no dependencies).

   Usage (in any page that has the shared Emagia shell styles: .sidebar / .sb-nav / .sb-item / .sb-foot):
     <link rel="stylesheet" href="components/emagia-sidebar.css">
     <aside class="sidebar" id="sidebar" data-emagia-sidebar></aside>       optional: data-active="<item key>"
     <script src="components/emagia-nav.config.js"></script>
     <script src="components/emagia-sidebar.js"></script>

   Responsibilities: renders items from window.EMAGIA_NAV_CONFIG (config is separate from markup), icons (Lucide 0.454
   paths below), active-item detection (data-active, else the current page file name vs item.match/href), expand/collapse
   via the hamburger (desktop; persisted), drawer close on < 1024px (reuses the page's #menuBtn), keyboard support, footer.
   Items without a route are focusable and announce "not linked in this prototype" when activated; no URLs are invented.

   API: window.EmagiaSidebar.mount(asideEl, config?) · .setCollapsed(bool) · .setActive(key) */
(function () {
  'use strict';
  var ICONS = {
    "menu": "<line x1=\"4\" x2=\"20\" y1=\"12\" y2=\"12\"/><line x1=\"4\" x2=\"20\" y1=\"6\" y2=\"6\"/><line x1=\"4\" x2=\"20\" y1=\"18\" y2=\"18\"/>",
    "house": "<path d=\"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8\"/><path d=\"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"/>",
    "credit-card": "<rect width=\"20\" height=\"14\" x=\"2\" y=\"5\" rx=\"2\"/><line x1=\"2\" x2=\"22\" y1=\"10\" y2=\"10\"/>",
    "files": "<path d=\"M20 7h-3a2 2 0 0 1-2-2V2\"/><path d=\"M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z\"/><path d=\"M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8\"/>",
    "receipt-text": "<path d=\"M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z\"/><path d=\"M14 8H8\"/><path d=\"M16 12H8\"/><path d=\"M13 16H8\"/>",
    "wallet": "<path d=\"M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1\"/><path d=\"M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4\"/>",
    "scissors": "<circle cx=\"6\" cy=\"6\" r=\"3\"/><path d=\"M8.12 8.12 12 12\"/><path d=\"M20 4 8.12 15.88\"/><circle cx=\"6\" cy=\"18\" r=\"3\"/><path d=\"M14.8 14.8 20 20\"/>",
    "message-square-warning": "<path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\"/><path d=\"M12 7v2\"/><path d=\"M12 13h.01\"/>",
    "chart-column": "<path d=\"M3 3v16a2 2 0 0 0 2 2h16\"/><path d=\"M18 17V9\"/><path d=\"M13 17V5\"/><path d=\"M8 17v-3\"/>",
    "shopping-cart": "<circle cx=\"8\" cy=\"21\" r=\"1\"/><circle cx=\"19\" cy=\"21\" r=\"1\"/><path d=\"M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12\"/>",
    "mail": "<rect width=\"20\" height=\"16\" x=\"2\" y=\"4\" rx=\"2\"/><path d=\"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7\"/>",
    "network": "<rect x=\"16\" y=\"16\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"2\" y=\"16\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"9\" y=\"2\" width=\"6\" height=\"6\" rx=\"1\"/><path d=\"M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3\"/><path d=\"M12 12V8\"/>",
    "arrow-left-right": "<path d=\"M8 3 4 7l4 4\"/><path d=\"M4 7h16\"/><path d=\"m16 21 4-4-4-4\"/><path d=\"M20 17H4\"/>",
    "building-2": "<path d=\"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z\"/><path d=\"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2\"/><path d=\"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2\"/><path d=\"M10 6h4\"/><path d=\"M10 10h4\"/><path d=\"M10 14h4\"/><path d=\"M10 18h4\"/>",
    "briefcase-business": "<path d=\"M12 12h.01\"/><path d=\"M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2\"/><path d=\"M22 13a18.15 18.15 0 0 1-20 0\"/><rect width=\"20\" height=\"14\" x=\"2\" y=\"6\" rx=\"2\"/>"
  };
  var DESKTOP = window.matchMedia ? window.matchMedia('(min-width:1024px)') : { matches: true };
  var root = null, cfg = null;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function svg(name, size) {
    return '<span class="ic" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false">' +
      (ICONS[name] || '') + '</svg></span>';
  }
  function pageName() { var p = location.pathname.split('/'); return decodeURIComponent(p[p.length - 1] || ''); }
  function activeKey() {
    var forced = root.getAttribute('data-active');
    if (forced) return forced;
    var page = pageName();
    for (var i = 0; i < cfg.items.length; i++) {
      var it = cfg.items[i], m = it.match || (it.href ? [it.href] : []);
      for (var j = 0; j < m.length; j++) if (m[j] && m[j].split('/').pop() === page) return it.key;
    }
    return null;
  }
  function itemHtml(it, active) {
    var on = it.key === active, label = '<span class="sb-label">' + esc(it.label) + '</span>';
    var common = ' class="sb-item" data-nav-key="' + esc(it.key) + '"' + (on ? ' aria-current="page"' : '');
    if (it.href) return '<a' + common + ' href="' + esc(it.href) + '">' + svg(it.icon, 20) + label + '</a>';
    return '<a' + common + ' role="link" tabindex="0" aria-disabled="true">' + svg(it.icon, 20) + label +
      '<span class="sb-sr">, not linked in this prototype</span></a>';
  }

  function isCollapsed() { return document.body.classList.contains('sb-collapsed'); }
  function syncToggle() {
    var b = root.querySelector('.sb-toggle'), desk = DESKTOP.matches, col = isCollapsed();
    var label = desk ? (col ? 'Expand navigation' : 'Collapse navigation') : 'Close navigation';
    b.setAttribute('aria-label', label); b.title = label;
    b.setAttribute('aria-expanded', String(desk ? !col : document.body.classList.contains('nav-open')));
    [].forEach.call(root.querySelectorAll('.sb-item'), function (a) {
      // Tooltips only when labels are hidden (collapsed desktop rail); the accessible name always includes the label.
      if (desk && col) a.title = a.querySelector('.sb-label').textContent; else a.removeAttribute('title');
    });
  }
  function setCollapsed(c) {
    document.body.classList.toggle('sb-collapsed', !!c);
    try { localStorage.setItem(cfg.storageKey, c ? '1' : '0'); } catch (e) {}
    syncToggle();
  }
  function onToggle() {
    if (DESKTOP.matches) { setCollapsed(!isCollapsed()); return; }
    var mb = document.getElementById('menuBtn'); // mobile drawer: let the page's own menu button close it
    if (mb && document.body.classList.contains('nav-open')) { mb.click(); mb.focus(); }
  }
  function unavailable(el) {
    var it = null; for (var i = 0; i < cfg.items.length; i++) if (cfg.items[i].key === el.getAttribute('data-nav-key')) it = cfg.items[i];
    var msg = (it ? it.label : 'This item') + ' isn’t linked in this prototype.';
    if (typeof cfg.onUnavailable === 'function') cfg.onUnavailable(it, msg);
    else if (typeof window.toast === 'function') window.toast(msg);
    root.dispatchEvent(new CustomEvent('emagia-nav:unavailable', { bubbles: true, detail: { key: it && it.key, message: msg } }));
  }
  function setActive(key) {
    [].forEach.call(root.querySelectorAll('.sb-item'), function (a) {
      if (a.getAttribute('data-nav-key') === key) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  function mount(el, config) {
    root = el; cfg = config || window.EMAGIA_NAV_CONFIG;
    if (!root || !cfg || !cfg.items) return;
    if (!root.getAttribute('aria-label')) root.setAttribute('aria-label', cfg.ariaLabel || 'Primary navigation');
    var act = activeKey(), f = cfg.footer;
    root.innerHTML =
      '<div class="sb-top"><button type="button" class="sb-toggle" aria-controls="' + esc(root.id || 'sidebar') + '">' + svg('menu', 22) + '</button></div>' +
      '<div class="sb-sep" role="presentation"></div>' +
      '<nav class="sb-nav" aria-label="' + esc(cfg.navLabel || 'Modules') + '">' + cfg.items.map(function (it) { return itemHtml(it, act); }).join('') + '</nav>' +
      (f ? '<div class="sb-sep sb-sep-foot" role="presentation"></div><div class="sb-foot"><img src="' + esc(f.src) + '" alt="' + esc(f.alt || '') + '" width="' + (f.width || 60) + '"></div>' : '');

    root.querySelector('.sb-toggle').addEventListener('click', onToggle);
    var nav = root.querySelector('.sb-nav');
    nav.addEventListener('click', function (e) {
      var a = e.target.closest('.sb-item'); if (!a) return;
      if (a.getAttribute('aria-disabled') === 'true') { e.preventDefault(); unavailable(a); }
    });
    nav.addEventListener('keydown', function (e) {
      var items = [].slice.call(nav.querySelectorAll('.sb-item')), i = items.indexOf(document.activeElement);
      if (i < 0) return;
      if ((e.key === 'Enter' || e.key === ' ') && items[i].getAttribute('aria-disabled') === 'true') { e.preventDefault(); unavailable(items[i]); return; }
      var n = e.key === 'ArrowDown' ? Math.min(i + 1, items.length - 1) : e.key === 'ArrowUp' ? Math.max(i - 1, 0) : e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : -1;
      if (n >= 0) { e.preventDefault(); items[n].focus(); }
    });

    var saved = null; try { saved = localStorage.getItem(cfg.storageKey); } catch (e) {}
    document.body.classList.toggle('sb-collapsed', saved === '1');
    syncToggle();
    if (DESKTOP.addEventListener) DESKTOP.addEventListener('change', syncToggle);
    // keep aria-expanded right when the page opens/closes the mobile drawer
    if (window.MutationObserver) new MutationObserver(syncToggle).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  window.EmagiaSidebar = { mount: mount, setCollapsed: setCollapsed, setActive: setActive };
  var auto = document.querySelector('[data-emagia-sidebar]');
  if (auto) mount(auto);
})();
