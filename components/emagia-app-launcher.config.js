/* Emagia application launcher (right rail) — configuration. Edit the application list here only.
   Order and labels are approved (2026-11-16). No application has a verified destination in this prototype, so every
   href is null: selecting one announces "<App> is not linked in this prototype." and never navigates.
   `current` marks the application these CFO pages belong to; the ERMS reference screen (giaAgentStudioCFO,
   2026-11-16) shows Gia Agent as the active rail item. */
window.EMAGIA_APPS_CONFIG = {
  ariaLabel: 'Applications',
  current: 'gia-agent',
  items: [
    { id: 'gia-agent',         label: 'Gia Agent',         icon: 'sparkles',               href: null },
    { id: 'gia',               label: 'Gia',               icon: 'bot',                    href: null },
    { id: 'gia-gpt',           label: 'Gia GPT',           icon: 'bot-message-square',     href: null },
    { id: 'gia-agent-studio',  label: 'Gia Agent Studio',  icon: 'workflow',               href: null },
    { id: 'gia-alpha-cash',    label: 'Gia Alpha Cash',    icon: 'wallet',                 href: null },
    { id: 'gia-voice',         label: 'Gia Voice',         icon: 'phone',                  href: null },
    { id: 'gia-analytics',     label: 'Gia Analytics',     icon: 'chart-no-axes-combined', href: null },
    { id: 'gia-docs',          label: 'Gia Docs',          icon: 'file-text',              href: null },
    { id: 'gia-drive',         label: 'Gia Drive',         icon: 'hard-drive',             href: null },
    { id: 'graphs',            label: 'Graphs',            icon: 'chart-pie',              href: null },
    { id: 'collaboration',     label: 'Collaboration',     icon: 'users',                  href: null }
  ]
};
