/* Emagia global header — configuration (kept separate from the component markup/behaviour in emagia-header.js).
   Only verified content belongs here: no invented routes, support addresses, help URLs, users, roles or translations.
   Paths are relative to the page that includes the header. */
window.EMAGIA_HEADER_CONFIG = {

  /* Branding. mode 'emagia' | 'client'. A client entry may only reference an approved client asset; none exists yet,
     so 'client' falls back to Emagia. href: approved destination or null (no link). If the image fails, `name` shows as text. */
  branding: {
    mode: 'emagia',
    emagia: { logo: 'components/assets/emagia-gia-logo.png', name: 'Emagia', alt: 'Emagia — Autonomous Finance with GIA', href: null },
    client: null // e.g. { logo: 'components/assets/<approved-client-logo>.png', name: '<client name>', href: null }
  },

  /* Approved language list for the CFO prototype — exact order, no additions, LTR only.
     Flags: flag-icons 7.2.3 (MIT) 4x3 SVGs, copied from D:\erms-admin\node_modules\flag-icons\flags\4x3\ (see assets/flags/LICENSE).
     Selection is a stored preference only: page content is not translated and <html lang/dir> are not changed. */
  languages: {
    storageKey: 'erms.emagia.language',
    defaultCode: 'en',
    flagPath: 'components/assets/flags/',
    items: [
      { code: 'en', name: 'English',   flag: 'gb.svg' },
      { code: 'es', name: 'Español',   flag: 'es.svg' },
      { code: 'pt', name: 'Português', flag: 'pt.svg' },
      { code: 'it', name: 'Italiano',  flag: 'it.svg' },
      { code: 'fr', name: 'Français',  flag: 'fr.svg' },
      { code: 'zh', name: '中文',       flag: 'cn.svg' },
      { code: 'ja', name: '日本語',     flag: 'jp.svg' },
      { code: 'ko', name: '한국어',     flag: 'kr.svg' },
      { code: 'de', name: 'Deutsch',   flag: 'de.svg' },
      { code: 'pl', name: 'Polski',    flag: 'pl.svg' },
      { code: 'ca', name: 'Català',    flag: 'es-ct.svg' }
    ]
  },

  /* Global search (header icon → 'search' popup) over verified local content only: CFO categories and agents (from
     CFO_SAMPLE in components/cfo-sample-data.js), the pages below and the quick actions. There are no modules,
     companies, letters or a report viewer in this prototype, so none are searchable (sample report names excluded). */
  search: {
    placeholder: 'Search agents, categories, pages, or run an action…',
    label: 'Search agents, categories, pages and actions',
    maxResults: 12,
    workspaceHref: 'cfo-workspace.html', // supports ?category=<id>&agent=<id> (verified in the workspace init code)
    pages: [
      { title: 'CFO Overview', href: 'cfo-overview.html', description: 'All CFO categories' },
      { title: 'CFO Workspace', href: 'cfo-workspace.html', description: 'Agents, summaries, charts and chat' }
    ],
    /* Recent: destinations actually opened (search selections; agents opened in the workspace). Preference storage,
       like the language; entries no longer in the catalog are dropped. "Clear recent" empties it. */
    recent: { storageKey: 'erms.emagia.search.recent', max: 5 },
    /* Quick actions: only real destinations/actions. hideOn: page key where the action would be the current page.
       { categories: true } expands to "Open <category>" for every CFO category (opens that category in the workspace). */
    quickActions: [
      { label: 'Open CFO Overview', description: 'Go to CFO Overview', icon: 'layout-grid', href: 'cfo-overview.html', hideOn: 'overview' },
      { label: 'Open CFO Workspace', description: 'Go to CFO Workspace', icon: 'layout-grid', href: 'cfo-workspace.html', hideOn: 'workspace' },
      { categories: true, icon: 'bot' },
      { label: 'Open Help', description: 'Guide for this page', icon: 'life-buoy', modal: 'help' },
      { label: 'View Keyboard Shortcuts', description: 'Shortcuts that work on this page', icon: 'keyboard', modal: 'keyboard-shortcuts' }
    ]
  },

  /* Breadcrumbs and contextual help per page. href only for real destinations; `id` keeps an element the page updates
     itself (#crumbCat). Help documents only features that exist on that page. */
  pages: {
    overview: {
      crumbs: [
        { label: 'Home', icon: 'house', href: null },
        { label: 'CFO', icon: 'briefcase-business', current: true }
      ],
      helpTitle: 'CFO Overview guide',
      help: [
        { heading: 'CFO categories', items: [
          'Each card is a CFO category: Credit, Collections, Receivables, Cash App, Disputes, Portal Usage (EIPP), Efficiency & Benchmarking and KPIs.' ] },
        { heading: 'Exploring the 32 agents', items: [
          'Every category has four agents (32 in total). Use Global Search (the search icon, or Ctrl+K) to find an agent or category by name or topic.' ] },
        { heading: 'Selecting an agent', items: [
          'Choose an agent in Global Search to open it in the CFO Workspace, where its summary loads automatically.' ] },
        { heading: 'Opening the CFO Workspace', items: [
          'Select a category card to open the CFO Workspace on that category, then pick one of its agents.' ] },
        { heading: 'Sample data', items: [
          'The CFO Workspace runs on local, illustrative sample data. Its summaries and charts are labelled “Sample data”, and chat replies “Assistant · sample response”.',
          'No backend, database or AI model is connected, and figures are not real Emagia or customer data.' ] }
      ]
    },
    workspace: {
      crumbs: [
        { label: 'Home', icon: 'house', href: null },
        { label: 'CFO', icon: 'briefcase-business', href: 'cfo-overview.html' },
        { label: 'Category', id: 'crumbCat', current: true }
      ],
      helpTitle: 'CFO Workspace guide',
      help: [
        { heading: 'Selecting an agent', items: [
          'Pick a category tab, then select an agent to load its summary. A loaded summary stays cached for that agent.',
          'The refresh icon on an agent regenerates its summary. Use “Search agents” to filter the list.' ] },
        { heading: 'Summary insights', items: [
          'Each summary has Key Insights, Risks and Recommendations. Every item shows a metric, value, business impact and a sample source reference.',
          'Choose a date range and press Summarize (Ctrl+Enter) to regenerate with that range.' ] },
        { heading: 'Reading the chart', items: [
          'The chart uses the same dataset as the summary. Switch between Bar, Line and Pie, or open it full screen.',
          'Below 1280px wide, the chart moves into a Chart tab next to Summary.' ] },
        { heading: 'Chat and suggested questions', items: [
          'Ask a follow-up in the chat, or pick one of the three suggested questions under the summary.',
          'Follow-ups such as “why?” or “tell me more” continue the previous topic. Each agent keeps its own conversation.' ] },
        { heading: 'Export and share', items: [
          'Summary actions: Copy, Download PDF (print), Share link, Pin, and Helpful / Not helpful feedback.',
          'Chart exports: PNG image and CSV of the displayed sample values.' ] },
        { heading: 'Panels', items: [
          'Collapse the Agents or Chart panel, or focus one panel; press Esc to exit focus mode.' ] },
        { heading: 'Sample data', items: [
          'All figures are local, illustrative sample data, labelled “Sample data”. Chat replies are rule-based and labelled “Assistant · sample response”. No backend, database or AI model is connected.' ] }
      ]
    }
  },

  /* Keyboard shortcuts that are actually implemented, grouped. `page` limits a group to one page key; `or`: alternative keys (↑ / ↓), otherwise a combination (Ctrl + K). */
  shortcuts: [
    { heading: 'Global search', items: [
      { keys: ['Ctrl', 'K'], description: 'Open Global Search (⌘ K on Mac)' },
      { keys: ['↑', '↓'], or: true, description: 'Move through recent items, quick actions and results' },
      { keys: ['Enter'], description: 'Open the highlighted (or first) result' },
      { keys: ['Esc'], description: 'Close search' } ] },
    { heading: 'Menus, navigation and popups', items: [
      { keys: ['↑', '↓'], or: true, description: 'Move through menu items and the left navigation' },
      { keys: ['Home', 'End'], or: true, description: 'First / last menu or navigation item' },
      { keys: ['Enter'], description: 'Choose the focused menu item' },
      { keys: ['Esc'], description: 'Close the open menu or popup' } ] },
    { heading: 'CFO Workspace', page: 'workspace', items: [
      { keys: ['Ctrl', 'Enter'], description: 'Summarize' },
      { keys: ['Esc'], description: 'Close feedback, then exit focus mode' },
      { keys: ['←', '→'], or: true, description: 'Move between category tabs (Home / End: first / last)' },
      { keys: ['↑', '↓'], or: true, description: 'Move through the agent list; ↑ on the first agent goes to agent search' },
      { keys: ['Enter'], description: 'Select the focused agent and load its summary' } ] }
  ],

  /* System Admin (user) menu (reference: circular icon backgrounds; Logout separated, danger styling). There is no authentication, account, activity, notification or support service in this
     prototype (verified in D:\cfo and D:\erms-admin). Every item opens a same-page popup that states what is and isn't
     connected; nothing simulates a successful backend operation. Order is fixed; a separator precedes Logout. */
  user: {
    name: 'System Admin',
    initial: 'S',
    note: 'Prototype identity — no sign-in, roles or permissions',
    menu: [
      { id: 'my-activity', label: 'My Activity', icon: 'activity' },
      { id: 'change-password', label: 'Change Password', icon: 'key-round' },
      { id: 'notification-preferences', label: 'Notification Preferences', icon: 'bell' },
      { id: 'keyboard-shortcuts', label: 'Keyboard Shortcuts', icon: 'keyboard' },
      { id: 'contact-us', label: 'Contact Us', icon: 'mail' },
      { id: 'help', label: 'Help', icon: 'life-buoy' },
      { id: 'logout', label: 'Logout', icon: 'log-out', separatorBefore: true, danger: true }
    ]
  },

  /* Popup text for the one shared modal (behaviour in emagia-header.js). */
  modals: {
    'my-activity': { title: 'My Activity', description: 'Review your recent activity across the CFO workspace.', icon: 'activity',
      empty: 'No recent activity available.',
      emptyDetail: 'Activity tracking isn’t connected in this prototype, so no activity history is recorded or shown.' },
    'change-password': { title: 'Change Password', description: 'Update your account password.', icon: 'key-round',
      notice: 'Prototype only: no account or authentication service is connected. Passwords are never sent, saved or logged.',
      unavailable: 'Password change isn’t available in this prototype. Nothing was sent or changed, and the fields have been cleared.' },
    'notification-preferences': { title: 'Notification Preferences', description: 'Manage how you receive application notifications.', icon: 'bell',
      notice: 'Prototype settings: saved in this browser only and shared by the CFO pages. No email, in-app or other notifications are configured or sent.' },
    'keyboard-shortcuts': { title: 'Keyboard Shortcuts', description: 'Quick actions to help you navigate the CFO workspace.', icon: 'keyboard' },
    'contact-us': { title: 'Contact Us', description: 'Get assistance with the Emagia CFO application.', icon: 'mail',
      notice: 'Support contact details aren’t configured for this prototype: no verified support team, email, phone number, hours or documentation link exists.',
      formNote: 'Prototype form: no support service is connected, so requests can’t be sent.',
      unavailable: 'Your request wasn’t sent: no support service is connected in this prototype. Nothing was stored.' },
    help: { title: 'Help', description: 'Find guidance for using the Emagia CFO application.', icon: 'life-buoy' },
    search: { title: 'Search', description: '', icon: 'search' },
    about: { title: 'About this prototype', description: 'What this prototype does and doesn’t connect to.', icon: 'info' },
    logout: { title: 'Logout', description: 'Are you sure you want to log out?', icon: 'log-out',
      notice: 'Logout isn’t available in this prototype: there is no sign-in session. Nothing is cleared and you stay on this page.' }
  },

  /* Notification preferences: proposed prototype settings, UI only. Stored as a preference in localStorage (like the
     language), shared by both CFO pages. Nothing is sent. */
  notifications: {
    storageKey: 'erms.emagia.notifications',
    items: [
      { id: 'email', label: 'Email Notifications', description: 'Receive application updates by email.', default: false },
      { id: 'inApp', label: 'In-App Notifications', description: 'Show updates inside the application.', default: false },
      { id: 'reports', label: 'Report Completion Alerts', description: 'When a requested report is ready.', default: false },
      { id: 'agents', label: 'Agent Activity Updates', description: 'When CFO agents produce new summaries.', default: false },
      { id: 'announcements', label: 'Important System Announcements', description: 'Planned maintenance and important changes.', default: false }
    ]
  },

  /* Verified support contact details. None exist for this prototype; keep null until approved details are provided. */
  support: null,

  about: {
    title: 'About this prototype',
    paragraphs: [
      'CFO Workspace prototype for the Emagia Order-to-Cash application. It runs entirely on local, illustrative sample data: no backend API, database, authentication or AI model is connected.',
      'Language and notification selections are stored as preferences in this browser; page content is not translated and no notifications are sent.',
      'A Help Center and support contact details are not available in this prototype.'
    ]
  }
};
