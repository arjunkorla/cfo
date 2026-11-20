# Emagia CFO UX Transformation: executive presentation

A self-contained HTML presentation for the Vice President and senior management. It runs in any modern browser with no backend, build step or connection to the CFO application.

## Contents

```
presentation/
├── emagia-cfo-ux-transformation.html   ← open this file
├── README.md
└── assets/
    ├── emagia-logo-white.png           Emagia wordmark for dark backgrounds (from Gia Agent Studio/source/emagia_white.png)
    ├── before-cfo-categories.png       Previous CFO category screen (ERMS demo, captured 18 Nov 2026)
    ├── before-cfo-workspace.png        Previous CFO agent workspace (ERMS demo, captured 18 Nov 2026)
    └── after/                          New prototypes rendered in Chrome on 19 Nov 2026 (local sample data)
        ├── after-overview-top.jpg      Overview, 1440 px, first screen
        ├── after-overview-full.jpg     Overview, 1440 px, all four sections
        ├── after-overview-1024.jpg     Overview, 1024 px
        ├── after-overview-390.jpg      Overview, 390 px
        ├── after-workspace-idle.jpg    Workspace, Cash App, before an agent runs
        ├── after-workspace-summary.jpg Workspace, AR Aging Analyst summary + bar chart
        ├── after-workspace-chat.jpg    Same, with a suggested-question reply (not used in the deck)
        ├── after-workspace-pie.jpg     Same, pie chart
        ├── after-workspace-focus.jpg   Summary in focus mode with a follow-up reply
        ├── after-workspace-1024.jpg    Workspace, 1024 px (chart in a tab)
        └── after-workspace-390.jpg     Workspace, 390 px
```

The HTML references images with relative paths (`assets/...`). Always keep the HTML file and the `assets/` folder together.

The only external request is Google Fonts (Inter, JetBrains Mono), which the CFO prototype also uses. Without internet access, the page falls back to system fonts and everything else still works.

## Preview locally

- Double-click `emagia-cfo-ux-transformation.html`, or
- serve the folder: `cd presentation` then `python -m http.server 8080` (or `npx serve .`) and open `http://localhost:8080/emagia-cfo-ux-transformation.html`.

Controls: ← / → move between sections. The top bar has Previous/Next, Full screen and Print. Click any screenshot to enlarge it (← / → to browse, Esc to close).

## Publish to an approved internal host

1. Copy the whole `presentation/` folder, unchanged, to an approved internal static web location (for example an internal web server, an intranet site that serves HTML, or an internal static-hosting bucket).
2. Check that `.html`, `.png` and `.jpg` files are served with the right content types (the defaults on most servers).
3. Open `https://<internal-host>/<path>/emagia-cfo-ux-transformation.html` and check that all screenshots load.
4. Restrict access to the intended audience with the host's normal authentication.

Do **not** upload this material to an external or public hosting provider without approval. It contains screenshots of Emagia product screens.

## Share with management

Send the internal URL. Optionally, link straight to a section by adding its anchor:
`#s1` Vision · `#s2` Root cause · `#s3` CFO pilot · `#s4` Design guide · `#s5` AI experience · `#s6` Strategy · `#s7` Measurement · `#s8` Decision.

For offline reading, use the Print button, then "Save as PDF" (A4 landscape, one section per page). The browser version is the primary format.

## Regenerating the "after" screenshots

The screenshots are static copies. If the prototypes change, re-render them from `cfo-overview.html` and `cfo-workspace.html` at the same widths and replace the files in `assets/after/` under the same names. The deck's numbered markers are positioned for the current images, so check them after replacing.
