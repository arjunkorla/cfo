/* Emagia global header — reusable component (vanilla JS, no dependencies, no network calls).

   Usage (pages with the shared Emagia shell styles: .topbar / .tb-left / .tb-right / .crumb / .lang-btn / .user-btn / .icon-btn / .btn):
     <link rel="stylesheet" href="components/emagia-header.css">
     <header class="topbar" data-emagia-header data-page="overview|workspace"></header>
     <script src="components/emagia-header.config.js"></script>
     <script src="components/emagia-header.js"></script>
   Search reads window.CFO_SAMPLE (components/cfo-sample-data.js) lazily, on first use.

   Parts (separate sections below): Brand · Breadcrumbs · Global Search (header icon → 'search' popup with a
   combobox/listbox: Recent, Quick actions, Results) · Menus (shared controller for Language / Help / System Admin) ·
   Modal (one shared same-page popup: search, my-activity, change-password, notification-preferences,
   keyboard-shortcuts, contact-us, help, about, logout).
   Keeps #menuBtn (page mobile nav) and #crumbCat (updated by the workspace) as before.
   Events: 'emagia:languagechange' {code, name} on document (emitted); 'cfo:agentopen' {category, agentId} (listened, for Recent). API: window.EmagiaHeader.{getLanguage, setLanguage, openSearch, openModal, closeModal, registerMenu, closeMenu, navigate}. */
(function () {
  'use strict';
  var ICONS = {
    'key-round': '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>',
    'mail': '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    'life-buoy': '<circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/>',
    'activity': '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
    'lock-keyhole': '<circle cx="12" cy="16" r="1"/><rect x="3" y="10" width="18" height="12" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/>',
    'bell': '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    'headset': '<path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z"/><path d="M21 16v2a4 4 0 0 1-4 4h-5"/>',
    'eye': '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>',
    'inbox': '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    "search": "<circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"m21 21-4.3-4.3\"/>",
    "x": "<path d=\"M18 6 6 18\"/><path d=\"m6 6 12 12\"/>",
    "chevron-down": "<path d=\"m6 9 6 6 6-6\"/>",
    "chevron-right": "<path d=\"m9 18 6-6-6-6\"/>",
    "circle-help": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3\"/><path d=\"M12 17h.01\"/>",
    "house": "<path d=\"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8\"/><path d=\"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"/>",
    "briefcase-business": "<path d=\"M12 12h.01\"/><path d=\"M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2\"/><path d=\"M22 13a18.15 18.15 0 0 1-20 0\"/><rect width=\"20\" height=\"14\" x=\"2\" y=\"6\" rx=\"2\"/>",
    "menu": "<line x1=\"4\" x2=\"20\" y1=\"12\" y2=\"12\"/><line x1=\"4\" x2=\"20\" y1=\"6\" y2=\"6\"/><line x1=\"4\" x2=\"20\" y1=\"18\" y2=\"18\"/>",
    "keyboard": "<path d=\"M10 8h.01\"/><path d=\"M12 12h.01\"/><path d=\"M14 8h.01\"/><path d=\"M16 12h.01\"/><path d=\"M18 8h.01\"/><path d=\"M6 8h.01\"/><path d=\"M7 16h10\"/><path d=\"M8 12h.01\"/><rect width=\"20\" height=\"16\" x=\"2\" y=\"4\" rx=\"2\"/>",
    "info": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 16v-4\"/><path d=\"M12 8h.01\"/>",
    "book-open": "<path d=\"M12 7v14\"/><path d=\"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z\"/>",
    "log-out": "<path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\"/><polyline points=\"16 17 21 12 16 7\"/><line x1=\"21\" x2=\"9\" y1=\"12\" y2=\"12\"/>",
    "layout-grid": "<rect width=\"7\" height=\"7\" x=\"3\" y=\"3\" rx=\"1\"/><rect width=\"7\" height=\"7\" x=\"14\" y=\"3\" rx=\"1\"/><rect width=\"7\" height=\"7\" x=\"14\" y=\"14\" rx=\"1\"/><rect width=\"7\" height=\"7\" x=\"3\" y=\"14\" rx=\"1\"/>",
    "bot": "<path d=\"M12 8V4H8\"/><rect width=\"16\" height=\"12\" x=\"4\" y=\"8\" rx=\"2\"/><path d=\"M2 14h2\"/><path d=\"M20 14h2\"/><path d=\"M15 13v2\"/><path d=\"M9 13v2\"/>",
    "file-text": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\"/><path d=\"M14 2v4a2 2 0 0 0 2 2h4\"/><path d=\"M10 9H8\"/><path d=\"M16 13H8\"/><path d=\"M16 17H8\"/>",
    "languages": "<path d=\"m5 8 6 6\"/><path d=\"m4 14 6-6 2-3\"/><path d=\"M2 5h12\"/><path d=\"M7 2h1\"/><path d=\"m22 22-5-10-5 10\"/><path d=\"M14 18h6\"/>"
  };
  var cfg = window.EMAGIA_HEADER_CONFIG, root = document.querySelector('[data-emagia-header]');
  // Public API. navigate(url) is the single navigation point (a host app may replace it with its router).
  var api = window.EmagiaHeader = { navigate: function (url) { location.href = url; } };
  if (!cfg || !root) return;
  var pageKey = root.getAttribute('data-page') || 'overview', page = cfg.pages[pageKey] || cfg.pages.overview;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function svg(name, size, cls) {
    return '<span class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false">' + (ICONS[name] || '') + '</svg></span>';
  }
  function $(id) { return document.getElementById(id); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function notify(msg) { if (typeof window.toast === 'function') window.toast(msg); }

  /* ---------------- Brand ---------------- */
  function brandHtml() {
    var b = cfg.branding || {}, use = (b.mode === 'client' && b.client && b.client.logo) ? b.client : b.emagia;
    if (!use) return '';
    var img = use.logo ? '<img class="eh-logo" src="' + esc(use.logo) + '" alt="' + esc(use.alt || use.name) + '" width="32" height="32">' : '';
    var txt = '<span class="eh-brand-text"' + (use.logo ? ' hidden' : '') + '>' + esc(use.name) + '</span>';
    return use.href ? '<a class="eh-brand eh-brand-link" href="' + esc(use.href) + '">' + img + txt + '</a>'
                    : '<span class="eh-brand">' + img + txt + '</span>';
  }
  function wireBrand() {
    var img = root.querySelector('.eh-logo');
    if (!img) return;
    function fallback() { img.hidden = true; root.querySelector('.eh-brand-text').hidden = false; }
    img.addEventListener('error', fallback);
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fallback();
  }

  /* ---------------- Breadcrumbs ---------------- */
  function crumbsHtml() {
    return '<nav class="crumb" aria-label="Breadcrumb"><ol>' + page.crumbs.map(function (c, i) {
      var sep = i ? svg('chevron-right', 13, 'sep') : '', icon = c.icon ? svg(c.icon, 14) : '';
      if (c.current) {
        var label = '<span class="eh-trunc"' + (c.id ? ' id="' + esc(c.id) + '"' : '') + ' title="' + esc(c.label) + '">' + esc(c.label) + '</span>';
        return '<li>' + sep + '<span aria-current="page">' + icon + label + '</span></li>';
      }
      if (c.href) return '<li>' + sep + '<a href="' + esc(c.href) + '">' + icon + esc(c.label) + '</a></li>';
      return '<li>' + sep + '<span class="eh-crumb-text">' + icon + esc(c.label) + '</span></li>'; // no real destination: not a link
    }).join('') + '</ol></nav>';
  }
  function wireCrumbs() {
    var cur = root.querySelector('.crumb .eh-trunc[id]');
    if (cur && window.MutationObserver) new MutationObserver(function () { cur.title = cur.textContent; }).observe(cur, { childList: true, characterData: true, subtree: true });
  }

  /* ---------------- Global Search (header icon → the shared modal; combobox + grouped listbox) ----------------
     Sources (verified local content only): CFO_SAMPLE categories + agents, config.search.pages, and quick actions that
     open existing header popups. Filtering is synchronous (≈45 items), so there is no debounce and no loading state.
     Recent = destinations actually opened (from search, or agents opened in the workspace via the 'cfo:agentopen'
     event), stored like the language preference and resolved against the live catalog on every render. */
  var SC = cfg.search, index = null, optData = [], active = -1;
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function buildIndex() {
    var S = window.CFO_SAMPLE, out = [];
    if (!S || typeof S.listCategories !== 'function' || typeof S.listAgents !== 'function') return null;
    S.listCategories().forEach(function (c) {
      out.push({ type: 'Category', icon: 'layout-grid', title: c.name, meta: 'Category · CFO', description: c.agentCount + ' agents', cat: c.id });
      S.listAgents(c.id).forEach(function (a) {
        out.push({ type: 'Agent', icon: 'bot', title: a.name, meta: 'Agent · ' + c.name, description: a.description, cat: c.id, agent: a.id });
      });
    });
    (SC.pages || []).forEach(function (p) { out.push({ type: 'Page', icon: 'file-text', title: p.title, meta: 'Page', description: p.description, href: p.href }); });
    (SC.quickActions || []).forEach(function (a) { if (a.modal) out.push({ type: 'Action', icon: a.icon, title: a.label, meta: 'Action', description: a.description, modal: a.modal }); });
    out.forEach(function (r) { r.hayTitle = norm(r.title); r.hay = norm(r.title + ' ' + r.meta + ' ' + r.description); });
    return out;
  }
  function ensureIndex() { if (index === null) index = buildIndex(); return index; }
  var TYPE_ORDER = { Category: 0, Agent: 1, Page: 2, Action: 3 };
  function search(q) {
    var nq = norm(q).trim(), toks = nq.split(/\s+/).filter(Boolean);
    if (!toks.length) return [];
    return index.filter(function (r) { return toks.every(function (t) { return r.hay.indexOf(t) >= 0; }); })
      .map(function (r) {
        var s = r.hayTitle.indexOf(nq) === 0 ? 0 : (' ' + r.hayTitle).indexOf(' ' + toks[0]) >= 0 ? 1 : r.hayTitle.indexOf(toks[0]) >= 0 ? 2 : 3;
        return { r: r, s: s };
      })
      .sort(function (a, b) { return a.s - b.s || TYPE_ORDER[a.r.type] - TYPE_ORDER[b.r.type] || a.r.title.localeCompare(b.r.title); })
      .slice(0, SC.maxResults || 12).map(function (x) { return x.r; });
  }
  function mark(title, q) {
    var t = norm(title), first = norm(q).trim().split(/\s+/)[0], i = first ? t.indexOf(first) : -1;
    if (i < 0) return esc(title);
    return esc(title.slice(0, i)) + '<mark>' + esc(title.slice(i, i + first.length)) + '</mark>' + esc(title.slice(i + first.length));
  }
  /* Recent destinations (max SC.recent.max). Entries are {type, cat?, agent?, href?}; unknown entries are dropped. */
  function loadRecent() { var v = null; try { v = JSON.parse(store(SC.recent.storageKey) || '[]'); } catch (e) { v = null; } return Array.isArray(v) ? v : []; }
  function rKey(e) { return [e.type, e.cat || '', e.agent || '', e.href || ''].join('|'); }
  function addRecent(r) {
    if (!r || r.type === 'Action') return;
    var e = { type: r.type }; if (r.cat) e.cat = r.cat; if (r.agent) e.agent = r.agent; if (r.href) e.href = r.href;
    var l = loadRecent().filter(function (x) { return rKey(x) !== rKey(e); }); l.unshift(e);
    store(SC.recent.storageKey, JSON.stringify(l.slice(0, SC.recent.max)));
  }
  function recentItems() {
    if (!ensureIndex()) return [];
    return loadRecent().map(function (e) {
      for (var i = 0; i < index.length; i++) { var r = index[i]; if (rKey(r) === rKey(e)) return r; }
      return null;
    }).filter(Boolean);
  }
  function quickActions() {
    var out = [];
    (SC.quickActions || []).forEach(function (a) {
      if (a.hideOn === pageKey) return;
      if (a.categories) {
        index.filter(function (r) { return r.type === 'Category'; }).forEach(function (c) {
          out.push({ type: 'Category', icon: a.icon, title: 'Open ' + c.title, description: 'Go to ' + c.title + ' agents', cat: c.cat });
        });
      } else if (a.href) out.push({ type: 'Page', icon: a.icon, title: a.label, description: a.description, href: a.href });
      else out.push({ type: 'Action', icon: a.icon, title: a.label, description: a.description, modal: a.modal });
    });
    return out;
  }
  function setActive(i) {
    var input = $('ehSearch'), opts = $('ehResults').querySelectorAll('[role="option"]');
    active = i;
    [].forEach.call(opts, function (o, j) { o.setAttribute('aria-selected', String(j === i)); });
    if (i >= 0 && opts[i]) { input.setAttribute('aria-activedescendant', opts[i].id); opts[i].scrollIntoView({ block: 'nearest' }); }
    else input.removeAttribute('aria-activedescendant');
  }
  function renderSearch() {
    var input = $('ehSearch'), q = input.value, list = $('ehResults'), note = $('ehNote'), status = $('ehStatus'), groups = [], recent = [];
    $('ehSearchClear').hidden = !q;
    if (!ensureIndex()) {
      optData = []; list.innerHTML = ''; note.hidden = false; $('ehRecentClear').hidden = true;
      note.textContent = 'Search is temporarily unavailable: the CFO agent catalog didn’t load. Reload the page to try again.';
      status.textContent = 'Search unavailable'; input.setAttribute('aria-expanded', 'false'); setActive(-1); return;
    }
    if (!q.trim()) {
      recent = recentItems();
      if (recent.length) groups.push({ id: 'recent', label: 'Recent', items: recent.map(function (r) { return { r: r, recent: true }; }) });
      groups.push({ id: 'actions', label: 'Quick actions', items: quickActions().map(function (r) { return { r: r, action: true }; }) });
    } else {
      var res = search(q);
      if (res.length) groups.push({ id: 'results', label: 'Results', items: res.map(function (r) { return { r: r }; }) });
    }
    optData = []; var n = 0;
    list.innerHTML = groups.map(function (g) {
      return '<div role="group" class="eh-sr-group" aria-labelledby="ehGrp-' + g.id + '"><div class="eh-sr-head" id="ehGrp-' + g.id + '">' + esc(g.label) + '</div>' +
        g.items.map(function (o) {
          var r = o.r, i = n++; optData.push(r);
          var sub = o.recent ? 'Recently visited · ' + r.meta : (o.action ? r.description : r.meta);
          return '<div role="option" id="ehOpt' + i + '" class="eh-sr-opt' + (o.recent ? ' is-recent' : '') + '" aria-selected="false" data-i="' + i + '">' +
            (o.recent ? '' : '<span class="eh-sr-opt-ic">' + svg(r.icon, 16) + '</span>') +
            '<span class="eh-sr-opt-text"><span class="eh-sr-opt-title">' + (q.trim() ? mark(r.title, q) : esc(r.title)) + '</span>' +
            '<span class="eh-sr-opt-sub">' + esc(sub) + '</span>' +
            (!o.recent && !o.action && r.description ? '<span class="eh-sr-opt-desc">' + esc(r.description) + '</span>' : '') + '</span>' +
            '<span class="eh-sr-enter" aria-hidden="true">↵ Open</span></div>';
        }).join('') + '</div>';
    }).join('');
    note.hidden = optData.length > 0;
    if (!optData.length) note.textContent = 'No agents, categories, pages or actions match “' + q.trim() + '”.';
    $('ehRecentClear').hidden = !(!q.trim() && recent.length);
    status.textContent = q.trim()
      ? (optData.length ? optData.length + (optData.length === 1 ? ' result' : ' results') + '. Use up and down arrows to review, Enter to open.' : 'No results')
      : (recent.length ? recent.length + ' recent, ' : '') + (optData.length - recent.length) + ' quick actions available.';
    input.setAttribute('aria-expanded', String(optData.length > 0));
    setActive(optData.length ? 0 : -1);
  }
  function choose(r) {
    if (!r) return;
    if (r.modal) { openModal(r.modal); return; } // replaces the search popup; focus still returns to the search icon
    addRecent(r);
    var btn = $('ehSearchBtn');
    dlgReturn = null; closeModal(); // focus goes to the destination, not back to the icon
    if (r.href) { if (location.pathname.split('/').pop() !== r.href) api.navigate(r.href); btn.focus(); return; }
    if (window.CFO_WORKSPACE && window.CFO_WORKSPACE.open(r.cat, r.agent)) return; // in-page: existing selection logic
    btn.focus();
    api.navigate(SC.workspaceHref + '?category=' + encodeURIComponent(r.cat) + (r.agent ? '&agent=' + encodeURIComponent(r.agent) : ''));
  }
  function renderSearchModal(b) {
    b.innerHTML = '<div class="eh-sr-box">' + svg('search', 18, 'eh-sr-ic') +
        '<input id="ehSearch" class="eh-sr-input" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="ehResults" autocomplete="off" spellcheck="false" placeholder="' + esc(SC.placeholder) + '" aria-label="' + esc(SC.label) + '">' +
        '<button class="icon-btn eh-sr-clear" type="button" id="ehSearchClear" aria-label="Clear search" hidden>' + svg('x', 16) + '</button></div>' +
      '<div class="eh-sr-scroll"><div role="listbox" id="ehResults" aria-label="Search suggestions and results"></div><p class="eh-sr-note" id="ehNote" hidden></p></div>' +
      '<div class="eh-sr-foot"><span class="eh-sr-hints" aria-hidden="true"><kbd class="eh-key">↑</kbd> <kbd class="eh-key">↓</kbd> navigate <kbd class="eh-key">Enter</kbd> open <kbd class="eh-key">Esc</kbd> close</span>' +
        '<button type="button" class="btn btn-ghost btn-sm" id="ehRecentClear" hidden>Clear recent</button></div>' +
      '<p class="sr-only" role="status" aria-live="polite" id="ehStatus"></p>';
    var input = $('ehSearch'), list = $('ehResults');
    input.addEventListener('input', renderSearch);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); if (!optData.length) return;
        setActive(e.key === 'ArrowDown' ? (active + 1) % optData.length : (active <= 0 ? optData.length - 1 : active - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault(); // modified Enter (e.g. Ctrl+Enter = page Summarize) has no meaning here: never act on it
        if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && optData.length) choose(optData[active >= 0 ? active : 0]);
      }
    });
    list.addEventListener('mousedown', function (e) { e.preventDefault(); }); // keep focus in the input
    list.addEventListener('click', function (e) { var o = e.target.closest('[role="option"]'); if (o) choose(optData[+o.getAttribute('data-i')]); });
    list.addEventListener('mousemove', function (e) { var o = e.target.closest('[role="option"]'); if (o && +o.getAttribute('data-i') !== active) setActive(+o.getAttribute('data-i')); });
    $('ehSearchClear').addEventListener('click', function () { input.value = ''; renderSearch(); input.focus(); });
    $('ehRecentClear').addEventListener('click', function () {
      store(SC.recent.storageKey, '[]'); renderSearch(); input.focus(); $('ehStatus').textContent = 'Recent history cleared.';
    });
    renderSearch();
  }
  function openSearch() { return openModal('search', $('ehSearchBtn')); }
  function wireSearch() {
    $('ehSearchBtn').addEventListener('click', openSearch);
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        if (document.querySelector('dialog[open]')) return;
        e.preventDefault(); openSearch();
      }
    });
    // agents opened in the workspace (click, keyboard, search, ?agent=) are real visits
    document.addEventListener('cfo:agentopen', function (e) {
      var d = e.detail || {}; if (d.category && d.agentId) addRecent({ type: 'Agent', cat: d.category, agent: d.agentId });
    });
  }

  /* ---------------- Menus (shared controller: Language, Help, User) ---------------- */
  var menus = [], openMenu = null;
  function itemsOf(m) { return [].slice.call(m.menu.querySelectorAll('[role^="menuitem"]')); }
  function closeMenus(except) { menus.forEach(function (m) { if (m !== except && !m.pop.hidden) close(m, false); }); }
  function place(pop) {
    pop.style.right = ''; pop.style.left = '';
    var r = pop.getBoundingClientRect();
    if (r.left < 8) pop.style.right = (r.left - 8) + 'px';
  }
  function open(m, focusIdx) {
    closeMenus(m);
    m.pop.hidden = false; m.trigger.setAttribute('aria-expanded', 'true'); openMenu = m; place(m.pop);
    var items = itemsOf(m), sel = m.menu.querySelector('[aria-checked="true"]');
    var t = focusIdx === 'last' ? items[items.length - 1] : (sel || items[0]);
    if (t) t.focus();
  }
  function close(m, focusTrigger) {
    m.pop.hidden = true; m.trigger.setAttribute('aria-expanded', 'false'); if (openMenu === m) openMenu = null;
    if (focusTrigger) m.trigger.focus();
  }
  function menu(trigger, pop, onSelect) {
    var m = { trigger: trigger, pop: pop, menu: pop.querySelector('[role="menu"]'), onSelect: onSelect };
    menus.push(m);
    trigger.addEventListener('click', function () { if (pop.hidden) open(m); else close(m, false); });
    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); open(m); } else if (e.key === 'ArrowUp') { e.preventDefault(); open(m, 'last'); }
    });
    m.menu.addEventListener('click', function (e) {
      var it = e.target.closest('[role^="menuitem"]'); if (!it) return;
      if (it.getAttribute('aria-disabled') === 'true') return; // explained in its own visible text
      onSelect(it, m);
    });
    pop.addEventListener('keydown', function (e) {
      var items = itemsOf(m), i = items.indexOf(document.activeElement), n = -1;
      if (e.key === 'ArrowDown') n = (i + 1) % items.length; else if (e.key === 'ArrowUp') n = i <= 0 ? items.length - 1 : i - 1;
      else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = items.length - 1;
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(m, true); return; }
      else if (e.key === 'Tab') { close(m, false); return; }
      else if ((e.key === ' ' || e.key === 'Enter') && i >= 0) { e.preventDefault(); items[i].click(); return; }
      if (n >= 0) { e.preventDefault(); items[n].focus(); }
    });
    return m;
  }
  document.addEventListener('mousedown', function (e) {
    if (openMenu && !openMenu.pop.contains(e.target) && !openMenu.trigger.contains(e.target)) close(openMenu, false);
  });
  function itemHtml(o) {
    return '<button type="button" class="eh-item' + (o.cls ? ' ' + o.cls : '') + '" role="' + (o.role || 'menuitem') + '"' + (o.attrs || '') + (o.disabled ? ' aria-disabled="true"' : '') +
      ' tabindex="-1"' + (o.act ? ' data-act-h="' + esc(o.act) + '"' : '') + '>' + (o.lead || '') +
      '<span class="eh-item-text">' + esc(o.label) + (o.sub !== undefined ? '<span class="eh-item-sub">' + esc(o.sub) + '</span>' : '') + '</span></button>';
  }

  /* Language */
  var L = cfg.languages, current = null;
  function langByCode(c) { for (var i = 0; i < L.items.length; i++) if (L.items[i].code === c) return L.items[i]; return null; }
  function flag(l, cls) { return '<img class="' + cls + '" src="' + esc(L.flagPath + l.flag) + '" alt="" aria-hidden="true" width="16" height="12">'; }
  function langHtml() {
    return '<div class="eh-menu-wrap">' +
      '<button class="lang-btn" type="button" id="ehLangBtn" aria-haspopup="menu" aria-expanded="false" aria-controls="ehLangMenu"></button>' +
      '<div class="eh-pop eh-menu eh-menu-lang" id="ehLangPop" hidden><div role="menu" id="ehLangMenu" aria-label="Select language">' +
      L.items.map(function (l) { return itemHtml({ role: 'menuitemradio', attrs: ' aria-checked="false" data-code="' + esc(l.code) + '" lang="' + esc(l.code) + '"', lead: flag(l, 'eh-flag'), label: l.name }); }).join('') +
      '</div></div></div>';
  }
  function applyLanguage(code, announce) {
    var l = langByCode(code) || langByCode(L.defaultCode) || L.items[0];
    current = l;
    var b = $('ehLangBtn');
    b.innerHTML = '<img src="' + esc(L.flagPath + l.flag) + '" alt="" aria-hidden="true"><span class="lang-label">' + esc(l.name) + '</span>' + svg('chevron-down', 14, 'c-muted eh-chev');
    b.setAttribute('aria-label', 'Language: ' + l.name + '. Page content is not translated in this prototype.');
    [].forEach.call($('ehLangMenu').querySelectorAll('[data-code]'), function (it) { it.setAttribute('aria-checked', String(it.getAttribute('data-code') === l.code)); });
    if (announce) {
      notify('Language set to ' + l.name + '. Page content stays in English in this prototype.');
      document.dispatchEvent(new CustomEvent('emagia:languagechange', { detail: { code: l.code, name: l.name } }));
    }
  }
  function setLanguage(code) { if (!langByCode(code)) return false; store(L.storageKey, code); applyLanguage(code, true); return true; }

  /* Help + User (System Admin) menus */
  function helpHtml() {
    return '<div class="eh-menu-wrap">' +
      '<button class="icon-btn" type="button" id="ehHelpBtn" aria-label="Help" title="Help" aria-haspopup="menu" aria-expanded="false" aria-controls="ehHelpMenu">' + svg('circle-help', 18) + '</button>' +
      '<div class="eh-pop eh-menu eh-menu-help" id="ehHelpPop" hidden><div role="menu" id="ehHelpMenu" aria-label="Help">' +
      itemHtml({ act: 'help', attrs: ' aria-haspopup="dialog"', lead: svg('book-open', 16, 'eh-item-ic'), label: page.helpTitle, sub: 'How this page works' }) +
      itemHtml({ act: 'keyboard-shortcuts', attrs: ' aria-haspopup="dialog"', lead: svg('keyboard', 16, 'eh-item-ic'), label: 'Keyboard shortcuts' }) +
      itemHtml({ act: 'about', attrs: ' aria-haspopup="dialog"', lead: svg('info', 16, 'eh-item-ic'), label: cfg.about.title }) +
      '</div></div></div>';
  }
  function userHtml() {
    var u = cfg.user;
    return '<div class="tb-div"><div class="eh-menu-wrap">' +
      '<button class="user-btn" type="button" id="ehUserBtn" aria-haspopup="menu" aria-expanded="false" aria-controls="ehUserMenu" aria-label="System Admin menu: ' + esc(u.name) + '" title="' + esc(u.name + ' — ' + u.note) + '">' +
        '<span class="user-name t-body-sm">' + esc(u.name) + '</span><span class="user-av" aria-hidden="true">' + esc(u.initial) + '</span>' + svg('chevron-down', 14, 'c-muted eh-chev') + '</button>' +
      '<div class="eh-pop eh-menu eh-menu-user" id="ehUserPop" hidden>' +
        '<div role="menu" id="ehUserMenu" aria-label="System Admin">' +
        u.menu.map(function (it) {
          return (it.separatorBefore ? '<div class="eh-sep" role="separator"></div>' : '') +
            itemHtml({ act: it.id, cls: it.danger ? 'is-danger' : '', attrs: ' aria-haspopup="dialog"', lead: '<span class="eh-av-ic" aria-hidden="true">' + svg(it.icon, 16) + '</span>', label: it.label });
        }).join('') +
      '</div></div></div></div>';
  }

  /* ---------------- Modal (one shared popup: System Admin items, Help menu items) ----------------
     Native <dialog> + showModal(): same page, background inert, one popup at a time (content is replaced, never
     stacked). Close: × button, Esc, Cancel, or backdrop click (informational popups only). Focus is trapped inside and
     returns to the menu trigger on close. On close every field is cleared, so no typed value is kept. */
  var MT = cfg.modals, dlg = null, dlgReturn = null, activeModal = null, notifMem = null;
  function ensureDialog() {
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.className = 'eh-dialog'; dlg.id = 'ehModal';
    dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true');
    dlg.setAttribute('aria-labelledby', 'ehDlgTitle'); dlg.setAttribute('aria-describedby', 'ehDlgDesc');
    dlg.innerHTML = '<div class="eh-dlg-head"><span class="eh-dlg-icon" id="ehDlgIcon"></span>' +
      '<div class="eh-dlg-titles"><h2 id="ehDlgTitle"></h2><p class="eh-dlg-desc" id="ehDlgDesc"></p></div>' +
      '<button class="icon-btn eh-dlg-close" type="button" data-close aria-label="Close">' + svg('x', 18) + '</button></div>' +
      '<div class="eh-dlg-body" id="ehDlgBody"></div><div class="eh-dlg-foot" id="ehDlgFoot" hidden></div>';
    document.body.appendChild(dlg);
    var downOnBackdrop = false;
    dlg.addEventListener('mousedown', function (e) { downOnBackdrop = e.target === dlg; });
    dlg.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) { closeModal(); return; }
      // the backdrop is the <dialog> itself (its content fills the box); a drag that starts inside never closes it
      if (e.target === dlg && downOnBackdrop && activeModal && activeModal.backdrop) closeModal();
    });
    dlg.addEventListener('keydown', function (e) {
      e.stopPropagation(); // keys typed in a popup never reach page shortcuts (Ctrl+Enter, Esc, Ctrl+K)
      if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
      else if (e.key === 'Tab') trap(e);
    });
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); closeModal(); });
    // Clean up and return focus as soon as the dialog closes: the 'open' attribute change is observed before any timer
    // runs; the 'close' event (a separate task) is the fallback.
    function restore() {
      if (dlg.open) return;
      if (activeModal) {
        [].forEach.call(dlg.querySelectorAll('input, textarea'), function (f) { f.value = ''; });
        $('ehDlgBody').innerHTML = ''; $('ehDlgFoot').innerHTML = ''; dlg.removeAttribute('data-modal'); activeModal = null;
      }
      if (dlgReturn) { var r = dlgReturn; dlgReturn = null; if (document.contains(r)) r.focus(); }
    }
    if (window.MutationObserver) new MutationObserver(restore).observe(dlg, { attributes: true, attributeFilter: ['open'] });
    dlg.addEventListener('close', restore);
    return dlg;
  }
  function focusables() {
    return [].filter.call(dlg.querySelectorAll('button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'),
      function (el) { return !el.disabled && el.getClientRects().length > 0; });
  }
  function trap(e) {
    var f = focusables(); if (!f.length) return;
    var first = f[0], last = f[f.length - 1], a = document.activeElement;
    if (e.shiftKey && (a === first || !dlg.contains(a))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (a === last || !dlg.contains(a))) { e.preventDefault(); first.focus(); }
  }
  function closeModal() { if (dlg && dlg.open) dlg.close(); }
  function openModal(id, returnTo) {
    var def = MODALS[id], t = MT[id];
    if (!def || !t) return false;
    closeMenus();
    var d = ensureDialog(), body = $('ehDlgBody'), foot = $('ehDlgFoot');
    if (d.open) [].forEach.call(d.querySelectorAll('input, textarea'), function (f) { f.value = ''; }); // replace, never stack
    activeModal = { id: id, backdrop: def.backdrop !== false };
    d.setAttribute('data-modal', id); d.className = 'eh-dialog eh-dlg-' + (def.size || 'md');
    $('ehDlgIcon').innerHTML = svg(t.icon, 20); $('ehDlgTitle').textContent = t.title; $('ehDlgDesc').textContent = t.description || '';
    if (t.description) d.setAttribute('aria-describedby', 'ehDlgDesc'); else d.removeAttribute('aria-describedby');
    body.innerHTML = ''; foot.innerHTML = ''; body.scrollTop = 0;
    def.render(body, foot, t);
    foot.hidden = !foot.children.length;
    if (!d.open) { dlgReturn = returnTo || document.activeElement; d.showModal(); }
    var first = def.focus && d.querySelector(def.focus);
    (first || d.querySelector('.eh-dlg-close')).focus();
    return true;
  }

  /* Popup building blocks (existing page classes .btn / .btn-primary / .btn-secondary / .field / .ctl / .t-label) */
  function noticeHtml(text, id) { return '<p class="eh-notice"' + (id ? ' id="' + id + '"' : '') + '>' + svg('info', 16, 'eh-notice-ic') + '<span>' + esc(text) + '</span></p>'; }
  function btnHtml(label, o) {
    o = o || {};
    return '<button class="btn ' + (o.primary ? 'btn-primary' : 'btn-secondary') + '" type="' + (o.form ? 'submit' : 'button') + '"' +
      (o.form ? ' form="' + o.form + '"' : '') + (o.close ? ' data-close' : '') + (o.id ? ' id="' + o.id + '"' : '') + (o.attrs || '') + '>' + esc(label) + '</button>';
  }
  function statusHtml() { return '<p class="eh-status" id="ehDlgStatus" role="status" aria-live="polite"></p>'; }
  function setStatus(msg) { var s = $('ehDlgStatus'); s.innerHTML = msg ? svg('info', 16, 'eh-notice-ic') + '<span>' + esc(msg) + '</span>' : ''; s.classList.toggle('is-shown', !!msg); }
  function fieldErr(input, msg) {
    var e = $(input.id + 'Err');
    e.textContent = msg || ''; e.hidden = !msg;
    if (msg) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', e.id); }
    else { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); }
  }
  function errHtml(id) { return '<p class="eh-field-err" id="' + id + 'Err" hidden></p>'; }
  function wireForm(form, rules, onValid) {
    function check(f) { for (var i = 0; i < rules.length; i++) if (rules[i][0] === f) { var m = rules[i][1](); fieldErr(f, m); return m; } }
    rules.forEach(function (r) { r[0].addEventListener('input', function () { if (r[0].getAttribute('aria-invalid') === 'true') check(r[0]); }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); setStatus('');
      var bad = rules.map(function (r) { return check(r[0]) ? r[0] : null; }).filter(Boolean);
      if (bad.length) { bad[0].focus(); return; }
      onValid();
    });
  }
  function keysHtml(list) {
    return '<table class="eh-keys"><tbody>' + list.map(function (s) {
      return '<tr><td>' + s.keys.map(function (k) { return '<kbd class="eh-key">' + esc(k) + '</kbd>'; }).join(s.or ? ' / ' : ' + ') + '</td><td>' + esc(s.description) + '</td></tr>';
    }).join('') + '</tbody></table>';
  }

  /* Notification preferences: UI-only prototype settings, stored like the language preference (in-memory fallback). */
  var N = cfg.notifications;
  function loadNotif() {
    var v = null; try { v = JSON.parse(store(N.storageKey) || 'null'); } catch (e) { v = null; }
    v = v || notifMem || {};
    var o = {}; N.items.forEach(function (i) { o[i.id] = typeof v[i.id] === 'boolean' ? v[i.id] : !!i.default; });
    return o;
  }
  function saveNotif(o) {
    notifMem = o; var s = JSON.stringify(o);
    try { localStorage.setItem(N.storageKey, s); return localStorage.getItem(N.storageKey) === s; } catch (e) { return false; }
  }
  function setSwitch(b, on) { b.setAttribute('aria-checked', String(on)); b.querySelector('.eh-switch-state').textContent = on ? 'On' : 'Off'; }

  var MODALS = {
    search: { size: 'search', focus: '#ehSearch', render: function (b) { renderSearchModal(b); } },
    'my-activity': { size: 'md', render: function (b, f, t) {
      b.innerHTML = '<div class="eh-empty">' + svg('inbox', 24, 'eh-empty-ic') + '<p class="eh-empty-title">' + esc(t.empty) + '</p><p class="eh-empty-text">' + esc(t.emptyDetail) + '</p></div>';
    } },
    'change-password': { size: 'md', backdrop: false, focus: '#ehPwCurrent', render: function (b, f, t) {
      function pw(id, label, ac) {
        return '<div class="field eh-field"><label class="t-label" for="' + id + '">' + esc(label) + '</label><div class="eh-pw">' +
          '<input class="ctl eh-ctl" type="password" id="' + id + '" autocomplete="' + ac + '" required aria-required="true" spellcheck="false" autocapitalize="off">' +
          '<button class="icon-btn eh-pw-toggle" type="button" aria-controls="' + id + '" aria-pressed="false" aria-label="Show password" title="Show password">' + svg('eye', 16) + '</button>' +
          '</div>' + errHtml(id) + '</div>';
      }
      b.innerHTML = noticeHtml(t.notice) + '<form class="eh-form" id="ehPwForm" novalidate>' +
        pw('ehPwCurrent', 'Current Password', 'current-password') + pw('ehPwNew', 'New Password', 'new-password') + pw('ehPwConfirm', 'Confirm New Password', 'new-password') +
        '</form>' + statusHtml();
      f.innerHTML = btnHtml('Cancel', { close: true }) + btnHtml('Update Password', { primary: true, form: 'ehPwForm', id: 'ehPwSubmit' });
      [].forEach.call(b.querySelectorAll('.eh-pw-toggle'), function (tg) {
        tg.addEventListener('click', function () {
          var inp = $(tg.getAttribute('aria-controls')), show = inp.type === 'password';
          inp.type = show ? 'text' : 'password'; tg.setAttribute('aria-pressed', String(show));
          tg.innerHTML = svg(show ? 'eye-off' : 'eye', 16);
        });
      });
      var cur = $('ehPwCurrent'), nw = $('ehPwNew'), cf = $('ehPwConfirm');
      wireForm($('ehPwForm'), [
        [cur, function () { return cur.value ? '' : 'Enter your current password.'; }],
        [nw, function () { return nw.value ? '' : 'Enter a new password.'; }],
        [cf, function () { return !cf.value ? 'Confirm your new password.' : (cf.value !== nw.value ? 'The new password and confirmation don’t match.' : ''); }]
      ], function () {
        // No authentication service exists: never simulate success, never keep the values.
        cur.value = nw.value = cf.value = '';
        [].forEach.call(b.querySelectorAll('.eh-pw input'), function (i) { i.type = 'password'; });
        [].forEach.call(b.querySelectorAll('.eh-pw-toggle'), function (tg) { tg.setAttribute('aria-pressed', 'false'); tg.innerHTML = svg('eye', 16); });
        setStatus(t.unavailable);
      });
    } },
    'notification-preferences': { size: 'md', backdrop: false, focus: '.eh-switch', render: function (b, f, t) {
      var draft = loadNotif();
      b.innerHTML = noticeHtml(t.notice) + '<ul class="eh-switches">' + N.items.map(function (i) {
        var id = 'ehN-' + i.id;
        return '<li class="eh-sw-row"><div class="eh-sw-text"><span class="eh-sw-label" id="' + id + '-l">' + esc(i.label) + '</span>' +
          '<span class="eh-sw-desc" id="' + id + '-d">' + esc(i.description) + '</span></div>' +
          '<button type="button" class="eh-switch" role="switch" id="' + id + '" data-n="' + esc(i.id) + '" aria-checked="false" aria-labelledby="' + id + '-l" aria-describedby="' + id + '-d">' +
          '<span class="eh-switch-track" aria-hidden="true"><span class="eh-switch-thumb"></span></span><span class="eh-switch-state" aria-hidden="true">Off</span></button></li>';
      }).join('') + '</ul>';
      f.innerHTML = btnHtml('Cancel', { close: true }) + btnHtml('Save Preferences', { primary: true, id: 'ehNSave' });
      [].forEach.call(b.querySelectorAll('.eh-switch'), function (sw) {
        setSwitch(sw, draft[sw.getAttribute('data-n')]);
        sw.addEventListener('click', function () { var k = sw.getAttribute('data-n'); draft[k] = !draft[k]; setSwitch(sw, draft[k]); });
      });
      $('ehNSave').addEventListener('click', function () {
        var ok = saveNotif(draft);
        closeModal();
        notify(ok ? 'Notification preferences saved in this browser. No notifications are sent in this prototype.'
                  : 'Notification preferences kept for this page only (browser storage is unavailable). No notifications are sent.');
      });
    } },
    'keyboard-shortcuts': { size: 'lg', render: function (b) {
      b.innerHTML = cfg.shortcuts.filter(function (g) { return !g.page || g.page === pageKey; })
        .map(function (g) { return '<h3>' + esc(g.heading) + '</h3>' + keysHtml(g.items); }).join('');
    } },
    'contact-us': { size: 'md', backdrop: false, focus: '#ehCuSubject', render: function (b, f, t) {
      b.innerHTML = noticeHtml(t.notice) + '<form class="eh-form" id="ehCuForm" novalidate><p class="eh-form-note">' + esc(t.formNote) + '</p>' +
        '<div class="field eh-field"><label class="t-label" for="ehCuSubject">Subject</label><input class="ctl eh-ctl" type="text" id="ehCuSubject" maxlength="150" required aria-required="true" autocomplete="off">' + errHtml('ehCuSubject') + '</div>' +
        '<div class="field eh-field"><label class="t-label" for="ehCuMessage">Message</label><textarea class="ctl eh-ctl" id="ehCuMessage" rows="5" maxlength="2000" required aria-required="true"></textarea>' + errHtml('ehCuMessage') + '</div>' +
        '</form>' + statusHtml();
      f.innerHTML = btnHtml('Cancel', { close: true }) + btnHtml('Submit Request', { primary: true, form: 'ehCuForm', id: 'ehCuSubmit' });
      var sub = $('ehCuSubject'), msg = $('ehCuMessage');
      wireForm($('ehCuForm'), [
        [sub, function () { return sub.value.trim() ? '' : 'Enter a subject.'; }],
        [msg, function () { return msg.value.trim() ? '' : 'Enter a message.'; }]
      ], function () { setStatus(t.unavailable); }); // no support service: nothing is sent or stored, no ticket number
    } },
    help: { size: 'lg', render: function (b) {
      b.innerHTML = page.help.map(function (s) { return '<h3>' + esc(s.heading) + '</h3><ul>' + s.items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; }).join('');
    } },
    about: { size: 'md', render: function (b) {
      b.innerHTML = cfg.about.paragraphs.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
    } },
    logout: { size: 'sm', focus: '[data-close].btn', render: function (b, f, t) {
      b.innerHTML = noticeHtml(t.notice, 'ehLogoutReason');
      f.innerHTML = btnHtml('Cancel', { close: true }) +
        btnHtml('Logout', { primary: true, id: 'ehLogoutBtn', attrs: ' aria-disabled="true" aria-describedby="ehLogoutReason"' });
      // No authentication exists: the button explains itself and does nothing (no redirect, no storage cleared).
      $('ehLogoutBtn').addEventListener('click', function (e) { e.preventDefault(); });
    } }
  };

  /* ---------------- Render + wire ---------------- */
  root.innerHTML =
    '<div class="tb-left">' +
      '<button class="icon-btn md menu-btn" type="button" id="menuBtn" aria-label="Toggle navigation" aria-controls="sidebar" aria-expanded="false">' + svg('menu', 20) + '</button>' +
      brandHtml() + '<span class="eh-div" aria-hidden="true"></span>' + crumbsHtml() +
    '</div>' +
    '<div class="tb-right">' +
      '<button class="icon-btn" type="button" id="ehSearchBtn" aria-label="Open Global Search" title="Search (Ctrl+K)" aria-haspopup="dialog" aria-keyshortcuts="Control+K">' + svg('search', 18) + '</button>' +
      langHtml() + helpHtml() + userHtml() +
    '</div>';

  wireBrand(); wireCrumbs(); wireSearch();
  menu($('ehLangBtn'), $('ehLangPop'), function (it, m) { close(m, true); setLanguage(it.getAttribute('data-code')); });
  // Selecting an item closes its menu and opens the popup on this page; focus returns to the menu's trigger on close.
  function toModal(it, m) { close(m, false); openModal(it.getAttribute('data-act-h'), m.trigger); }
  menu($('ehHelpBtn'), $('ehHelpPop'), toModal);
  menu($('ehUserBtn'), $('ehUserPop'), toModal);

  var saved = store(L.storageKey);
  applyLanguage(langByCode(saved) ? saved : L.defaultCode, false);
  window.addEventListener('storage', function (e) { if (e.key === L.storageKey && langByCode(e.newValue)) applyLanguage(e.newValue, false); }); // other open CFO pages

  api.getLanguage = function () { return current && current.code; }; api.setLanguage = setLanguage; api.openSearch = openSearch;
  api.openModal = function (id) { return openModal(id, document.activeElement); }; api.closeModal = closeModal;
  // Shared menu controller for header-mounted menus from other components (e.g. the compact app launcher):
  // same keyboard, Esc, Tab, click-outside and one-open-at-a-time behaviour as Language / Help / System Admin.
  api.registerMenu = function (trigger, pop, onSelect) { return menu(trigger, pop, onSelect); };
  api.closeMenu = function (m, focusTrigger) { close(m, !!focusTrigger); };
})();
