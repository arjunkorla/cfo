/* Emagia O2C left navigation — central menu configuration.
   Edit menu labels, order, icons and route targets here only; the component (emagia-sidebar.js) renders whatever this lists.

   Item fields:
     key    unique id (also used by data-active="<key>" on the <aside> to force the active item)
     label  visible label (rendered uppercase by the shared .sb-item style)
     icon   Lucide icon name; must exist in the ICONS map in emagia-sidebar.js
     href   route target, relative to the hosting page — or null when no destination exists yet.
            null items stay focusable/clickable but are marked "not linked in this prototype"; never invent URLs.
     match  optional list of page file names / paths that make this item active (defaults to [href])

   Paths (href, footer.src) are relative to the page that includes the component. */
window.EMAGIA_NAV_CONFIG = {
  ariaLabel: 'Primary navigation',
  navLabel: 'Modules',
  storageKey: 'erms.emagia.sidebar.collapsed',
  footer: { src: 'components/assets/powered-by-emagia.png', alt: 'Powered by Emagia', width: 60 },
  items: [
    { key: 'home',            label: 'Home',            icon: 'house',                  href: null },
    { key: 'credit',          label: 'Credit',          icon: 'credit-card',            href: null },
    { key: 'collections',     label: 'Collections',     icon: 'files',                  href: null },
    { key: 'receivables',     label: 'Receivables',     icon: 'receipt-text',           href: null },
    { key: 'cash-app',        label: 'Cash App',        icon: 'wallet',                 href: null },
    { key: 'deductions',      label: 'Deductions',      icon: 'scissors',               href: null },
    { key: 'disputes',        label: 'Disputes',        icon: 'message-square-warning', href: null },
    { key: 'reports',         label: 'Reports',         icon: 'chart-column',           href: null },
    { key: 'order-entry',     label: 'Order Entry',     icon: 'shopping-cart',          href: null },
    { key: 'gia-emails',      label: 'GIA Emails',      icon: 'mail',                   href: null },
    { key: 'gcc',             label: 'GCC',             icon: 'network',                href: null },
    { key: 'emagia-exchange', label: 'Emagia Exchange', icon: 'arrow-left-right',       href: null },
    { key: 'ap-portals',      label: 'AP Portals',      icon: 'building-2',             href: null },
    { key: 'cfo',             label: 'CFO',             icon: 'briefcase-business',     href: 'cfo-overview.html', match: ['cfo-overview.html', 'cfo-workspace.html'] }
  ]
};
