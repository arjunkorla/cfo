# ERMS Admin — Design Specification for Figma Make

**Prepared:** 2026-08-31 · **Audience:** Figma Make (AI design-generation tool) · **Status:** Documents the application exactly as currently implemented in code — not a wishlist, not a proposed next pass.

---

## 1. Product Context

ERMS Admin is the administration module of Emagia's order-to-cash (O2C) enterprise SaaS platform, built for client **GLOBALCO**. It is used by internal system administrators, credit analysts, collectors, and AR operations staff to configure and monitor the platform: holidays and business calendars, companies, security/permissions, customer profiles, batch job monitoring, collector/representative setup, lookup and credit-configuration codes, collections strategy, dunning and general letter templates, marketing/dunning campaigns, dynamic reporting, and bulk data upload.

This is not a consumer-facing or first-touch marketing product — it is a **daily power-user tool**, opened repeatedly by trained operators who scan dense multi-column tables, run bulk actions, and work inside audit-conscious workflows. The design direction, stated in the codebase as **"Structured Clarity,"** is deliberately built for that usage pattern rather than for first-time discovery or visual warmth.

**Design personality:** an elevated-neutral, high-density enterprise operating system — a confident navy-anchored (`#1E439B`) palette with a restrained teal accent, precise crisp-cornered controls (not soft/pill), border-first depth (flat cards with hairline borders, not heavy shadows), tabular-numeric fidelity for financial data, a small and disciplined set of gradient accents used only in a few high-impact places, and fast/purposeful (not decorative) motion. The explicit reference class the product models itself on is Linear, GitHub, Vercel's dashboard, and Stripe's own merchant dashboard — compact controls and scan speed prioritized over decorative softness.

The interface ships in **one theme only** — dark mode was built in an earlier pass and has since been fully and deliberately removed (see § 2.7).

---

## 2. Foundational Design Tokens

### 2.1 Color system

**Primary — locked brand color.** `#1E439B` (HSL 222.2°, 67.6%, 36.3%) is the one hard-locked constant in the entire system; every other token below has been redesigned at least once across this project's history. The primary ramp holds hue/saturation constant and varies only lightness, so every step is mathematically traceable back to the fixed hex:

| Step | Hex | Typical role |
|---|---|---|
| `primary-50` | `#EEF2FC` | selected-row tint, sidebar active-item background, lightest gradient stops |
| `primary-100` | `#D9E2F8` | hover tint, icon-badge background |
| `primary-200` | `#AABEEE` | tint border |
| `primary-300` | `#6E90E3` | hover-state border tint on Card/StatCard |
| `primary-400` | `#2E60D6` | secondary interactive tint |
| **`primary-500`** | **`#1E439B`** | **the fixed brand primary — sidebar fill base, focus rings, links, primary button base** |
| `primary-600` | `#193780` | button hover fill |
| `primary-700` | `#12295E` | button active fill; sidebar's active-pill text color |
| `primary-800` | `#0C1C40` | heading text color |
| `primary-900` | `#071126` | reserved, unused |

Interactive semantic aliases (`primary` / `primary-hover` / `primary-active`) resolve through CSS custom properties; for solid fills that must hold white text on top (buttons, sidebar, checkbox fill), the numbered fixed ramp steps are used directly rather than the alias, since the alias was historically tuned for a now-removed dark theme's needs.

**Accent — teal/cyan, one restrained role.** A single accent hue (`#128091`, hue ≈188°) is used exclusively to mark AI-assisted/generated content (the Sparkle icon convention, § 2.5 and § 6) and a handful of matching icon badges. It was deliberately chosen for maximum hue separation from both primary (222°) and every semantic tone, so it can never be visually mistaken for a status color.

| Token | Hex | Use |
|---|---|---|
| `accent-light` | `#EBF7F9` | AiTag "ai" chip background |
| `accent` | `#128091` | Sparkle icons, AiTag icon |
| `accent-text` | `#117A8A` | AiTag "ai" chip **text** (a separately tuned darker step — the base accent color alone is too light against its own tint for real text) |
| `accent-hover` | `#0D606D` | hover state |
| `accent-vivid` | `#18A8BF` | decorative-only pop tier — never used for text |

**Neutral ramp — cool slate.** Hue 224°, low saturation — chosen to echo the primary's own cool hue family (a "precise technical instrument" read, matching Linear/GitHub/Vercel/Stripe's own cool-neutral convention), deliberately reversing an earlier pass's warm-stone ramp.

| Token | Hex | Typical use |
|---|---|---|
| `gray-50` | `#F9FAFA` | app background (page canvas) |
| `gray-100` | `#F2F3F5` | hover surface, neutral badge background |
| `gray-200` | `#E6E7EA` | decorative border (card outline, table row divider) |
| `gray-300` | `#D3D4DA` | resting-state border on form controls (a light hairline) |
| `gray-400` | `#A6AAB5` | hover-state form-control border; decorative "strong" border |
| `gray-500` | `#7F8594` | reserved, not directly used as text |
| `gray-600` | `#616775` | secondary text |
| `gray-700` | `#4A4E59` | strong text, neutral badge text |
| `gray-800` | `#31333A` | (unused directly) |
| `gray-900` | `#1E2024` | primary body text color |

Card/table surface color is **pure white `#FFFFFF`** (not an off-white) against the `gray-50` page background — this pairing is deliberate: a true-white card against a pale cool-gray canvas gives clear plane separation without needing a heavy shadow, matching the border-first elevation model (§ 2.4).

**Semantic colors.** Four tones, each with a `base` (icon/border use), a pale `bg` tint, and a separately-tuned darker `text` shade for text sitting on that tint (the base tone alone is often too light for text-on-tint contrast):

| Tone | Base | Tint background | Text-on-tint |
|---|---|---|---|
| Success | `#08853F` | `#E7F9EE` | `#07753A` |
| Warning | `#A65807` | `#FBF0DF` | `#8F4F06` |
| Error | `#DC2626` | `#FDEAEA` | `#C81E1E` |
| Info | `#1D74D6` | `#E8F1FC` | `#1A65BD` |

These are deliberately "vivid, modern, well-differentiated" — more saturated than a conservative enterprise palette default — while holding their hue families apart from primary, accent, and the module-identity colors below, so no two systems can be visually confused.

**Module identity colors — a colored-icon system, eight curated hues, one per functional module**, each individually chosen outside the success/warning/error/info/accent hue bands so a module icon can never be misread as a status indicator or an AI marker:

| Module | Hex |
|---|---|
| General | `#4F46E5` (indigo) |
| User Config | `#7C3AED` (violet) |
| Codes | `#A821B8` (fuchsia) |
| Credit Configs | `#DB2777` (rose) |
| Strategy | `#A16207` (gold) |
| Letters | `#0F766E` (deep teal — deliberately more muted/darker than the `accent` teal so the two are never confused) |
| Reports | `#86198F` (plum) |
| Mass Upload | `#334E7A` (steel blue) |

These colors are consumed **only** by Home's "Frequently Needed" quick-links tiles and the command palette's (Ctrl+K search) result rows — they are deliberately **not** used in the Sidebar (every sidebar icon stays solid white regardless of module) and **not** used for status/semantic icons.

**Chart palette** (used only in the Dynamic Reports workbench bar chart/legend): success-green `#08853F` (Customers), magenta `#C5478A` (Statements), amber-orange `#C56A1F` (Letters), accent-teal `#128091` (Invoices), info-blue `#1D74D6` (Contacts).

**No ad hoc color.** Every color anywhere in the application resolves through one of the named tokens above — there are no hardcoded hex/rgb values in any screen or component.

### 2.2 Dark mode — REMOVED. Do not generate dark variants.

An earlier design pass built and fully specified a complete independent dark theme (its own near-black neutral ramp, dark-mode-safe primary/error steps, a theme toggle in the Topbar, a "Toggle dark mode" command-palette action). **All of it was subsequently removed outright** — the dark CSS block, the toggle button, the theme hook, and every `dark:`-prefixed utility class in every component were deleted, and Tailwind's own `darkMode` config key was removed so that a stray `dark:` class would render as inert/unrecognized rather than silently reactivating theming. The application ships with **exactly one visual theme** — the light theme fully described in this document. Figma Make should generate only light-mode screens; no dark-mode artboards are part of the current, real product.

### 2.3 Typography

**Typeface:** Inter (self-hosted, four weights: 400/500/600/700), falling back to `"Segoe UI", system-ui, -apple-system, sans-serif`. Chosen for strong x-height/legibility at small sizes and as the de facto grotesque of the product's reference class (Linear, GitHub, Vercel, Stripe Dashboard).

**A dedicated numeric/tabular typeface** is layered on top for data-dense contexts: `"JetBrains Mono", ui-monospace, "Cascadia Code", "Roboto Mono", Consolas, monospace`, applied selectively (never globally) via a `font-data` utility that also turns on tabular-figure alignment. Used for: StatCard's big KPI figures, table numeric/ID/date columns (e.g. Dunning Letters' Amount Due), and Pagination's "Showing 1–10 of 42" range text — the established fintech-product convention (Stripe, Mercury, Ramp, GitHub) for keeping columns of numbers visually comparable, since digit widths align in a mono face in a way proportional Inter numerals don't reinforce as strongly even with tabular-figures enabled.

**Full type scale:**

| Token | Size / line-height | Weight | Role |
|---|---|---|---|
| `h1` | 32px / 40px | 700 | page-level headline (reserved, not currently used on a built screen) |
| `h2` | 28px / 36px | 700 | section headline (reserved) |
| `h3` | 22px / 28px | 600 | page title (e.g. "Mass Upload") |
| `h4` | 16px / 22px | 700 | card title |
| `h5` | 14px / 20px | 600 | sub-card / tab-section title |
| `h6` | 12px / 16px | 600, 0.03em tracking, uppercase | table-**section** sub-header (a rare, short glanceable label — not a column header) |
| `display` | 22px / 28px | 600, mono | StatCard KPI figures |
| `body` | 14px / 20px | 400 | **comfortable** body copy — form field content, card content, Home widgets, anywhere density isn't the binding constraint |
| `body-dense` | 13px / 18px | 400 | **dense** body copy — DataTable per-row cell content specifically, the one context that can run to hundreds/thousands of rows |
| `body-sm` | 13px / 18px | 500 | dropdown selected-values, secondary card text — a distinct "value/emphasis" role, not just a smaller body |
| `caption` | 12px / 16px | 400 | timestamps, helper text, **and DataTable column headers** (sentence case, not uppercase) |
| `micro` | 10px / 12px | 600, 0.04em tracking, uppercase | badge/chip labels, keyboard-shortcut hints |
| `sidebar-label` | 9px / 11px | 600, 0.02em tracking, uppercase | sidebar nav-item labels only |
| `label` | 12px / 16px | 600, 0.02em tracking, **sentence case** | form-field labels above every Input/Dropdown/Textarea |
| `button` | 13px / 16px | 600 | button label text |

**Comfortable vs. dense — where each applies:** `body` (14px) is the floor for anything read continuously in paragraph form or typed into a form field. `body-dense` (13px) is used specifically and only for DataTable's per-row cell content (which cascades to every screen built on the shared table, including Security's Access Matrix and Mass Upload's error-results table) — the one place row-count density genuinely matters. Filter/toolbar label text stays on the `label` token rather than shrinking with cell content.

**Case conventions, deliberately mixed by role, not a single global rule:** table column headers and form-field labels are **sentence case, not uppercase** — established readability guidance treats all-caps as measurably slower for continuous reading, and these are the two highest-frequency-read small-text elements in the app. Uppercase is reserved for genuinely short, glanceable, infrequently-read labels: badges/status chips, the sidebar's nav labels, and `h6` table-section headers.

**Font-weight system:**

| Role | Weight | Applies to |
|---|---|---|
| Headings / section titles | 600 or 700 | `h1`–`h6` tokens |
| Emphasized / key data | 600 | StatCard figures, a table row's primary/key field, active nav or tab labels |
| Body text / table cell content | 400 | `body` / `body-dense` uniformly |
| Muted / secondary text | 400 | `caption`, muted/secondary color tokens |
| Buttons | 600 | every Button variant |

### 2.4 Spacing, sizing & layout grid

**Base unit:** 4px. Named scale: `space-1` 4px · `space-2` 8px · `space-3` 12px · `space-4` 16px · `space-5` 20px · `space-6` 24px · `space-7` 32px · `space-8` 40px · `space-10` 48px · `space-14` 64px · `space-18` 80px.

**Important implementation quirk to carry into any generated spec:** this project deliberately **remaps several of Tailwind's default numeric spacing keys** to non-default pixel values — e.g. the `7`/`8`/`10`/`14`/`18` steps resolve to 32/40/48/64/80px here, not Tailwind's stock 28/32/40/56/72px. This has caused real, documented bugs in the actual build (a sidebar logo sized via a numeric class rendering at the wrong pixel size) and every control-height/logo-size value in this document was deliberately expressed as an explicit pixel value for exactly that reason. Figma Make does not need to reproduce this Tailwind-specific quirk mechanically — just use the literal pixel values given throughout this document, not a generic "Tailwind default" assumption.

**Control height scale:** `control-sm` 32px · `control-md` 36px · `control-lg` 40px — a deliberately tight, dense scale (one notch tighter than a typical 36/40/44 default), matching the reference class's own control heights.

**Card padding:** 24px (`space-6`) outer padding is standard; inter-card gaps are typically 16px (`space-4`).

**Breakpoints:** `xs` 480px · `sm` 768px · `md` 1024px · `lg` 1440px.

**Shell dimensions (verified against live code, not documentation prose — see § 8 for a flagged discrepancy):** Sidebar is a **fixed-width, non-collapsible 88px** icon rail (there is no expand/collapse toggle anywhere in the app). Topbar is a fixed **56px** tall sticky header with a bottom border. Content area fills the remaining width at the page gutter.

### 2.5 Radius system

| Token | Value | Applies to |
|---|---|---|
| `radius-control` | **8px** | Button, Input, Dropdown, Textarea, DatePicker trigger, search fields, FileDropzone's Browse button |
| `radius-xs` | 6px | Checkbox (a softly-rounded square, deliberately distinct from Radio's true circle) |
| `radius-sm` | 10px | popover/menu panels (Dropdown, ActionsMenu, LanguageSwitcher, FilterPresets), Toast, small standalone chips |
| `radius-md` | 12px | Card, ModuleCard, StatCard, DataTable container |
| `radius-lg` | 16px | Modal, FileDropzone's drop target and selected-file row |
| `radius-full` | 9999px (pill/circle) | Badge, status/trend pills, IconButton, Radio, avatar circles, Pagination controls |

**The controls-vs-chips split is a deliberate, current rule, not an inconsistency:** every actionable control (button, input, dropdown, search field) uses the crisp 8px `control` radius; only non-actionable, glanceable status elements (badges, tags, trend pills) keep a full pill shape. This is the current, verified state of the codebase — an earlier design pass had made *everything* pill-shaped (including buttons and inputs) and a 4px control radius existed even earlier than that; both have been superseded. Figma Make should use **8px** for buttons/inputs/dropdowns, not 4px and not a full pill.

### 2.6 Elevation / shadow scale

The governing model is **border-first, not shadow-first**: an ordinary card's primary depth cue is a 1px neutral border, not a shadow. Real shadow weight is reserved for elements that are *literally* floating above page content in the z-axis — a popover, a toast, a modal. Every shadow is primary-hue-tinted (a very subtle navy tint, not pure black) at low opacity.

| Tier | CSS (approximate) | Plain-language description | Used for |
|---|---|---|---|
| `xs` | `0 1px 2px rgba(30,67,155,.04)` | Barely-there contact shadow — an optional accent, not load-bearing | Default/`flat` Card elevation (most cards) |
| `sm` | `0 2px 4px + 0 1px 2px rgba(30,67,155,~.05)` | A light, non-interactive lift | `raised` Card elevation (SystemHealthCard, NeedsAttentionCard — cards that matter slightly more but aren't themselves clickable) |
| `md` | `0 4px 10px + 0 2px 4px rgba(30,67,155,~.07)` | A moderate, clearly-visible lift | `premium` Card elevation (DailySummaryCard), Toast, active horizontal-tab-strip chip |
| `lg` | `0 16px 32px + 0 4px 8px rgba(30,67,155,~.09)` | The heaviest "grounded" tier — a genuinely floating layer, but still page-adjacent | Modal, HomeHero banner |
| `float` | `0 24px 48px + 0 8px 16px + 0 2px 4px rgba(30,67,155,~.10)` — three stacked layers | The newest, top tier — "lifting off the page," a premium/floating feel one step beyond even Modal's weight, deliberately given one extra shadow layer and more spread | Every dropdown/listbox/popover panel: Dropdown, DatePicker, ActionsMenu, LanguageSwitcher, FilterPresets, DataTable's Columns menu, TabStrip's overflow menu |

Cards never stack a heavy shadow on top of their own border — the border does that job, so `xs` is intentionally subtle rather than a second depth cue fighting the first.

### 2.7 Gradients

Gradients are a **small, deliberately governed catalog**, not a decorative default — every stop is a color already on the app's own fixed ramp (primary or accent), and placement is limited to specific, high-impact surfaces rather than applied broadly to cards/inputs/tables.

| Token | Stops | Where it's used |
|---|---|---|
| `gradient-hero` | `#1E439B → #4338CA` (primary → indigo-violet), 135° diagonal | HomeHero's welcome banner only |
| `gradient-sidebar` | `#1E439B → #12295E` (primary-500 → primary-700), 180° vertical, top→bottom | Sidebar's full-height background fill |
| `gradient-primary` / `-hover` / `-active` | `#1E439B→#193780` / `#193780→#12295E` / `#12295E→#0C1C40`, 135° | Button `primary` variant, resting/hover/active |
| `gradient-secondary` / `-hover` / `-active` | `#FFFFFF→#EEF2FC` / `#EEF2FC→#D9E2F8` / `#D9E2F8→#AABEEE`, 135° | Button `secondary` variant (a subtle near-white primary-tinted sheen), resting/hover/active — this is the variant every Export button and every dropdown-menu trigger button renders through |
| `gradient-accent` | `#128091 → #0D606D`, 135° | DailySummaryCard's Sparkles icon badge only |
| `gradient-surface-primary` | `#EEF2FC → #FFFFFF`, 135° | DailySummaryCard's whole-card background wash (a near-white tint, body text stays fully readable on top) |

**A second, formula-based gradient pattern — "icon-container-gradient":** any icon sitting inside a background shape (IconBadge's five tones, ModuleCard's icon circle, IconBadgeButton, DataTable's scroll-right button) uses a computed two-stop gradient of its own tone at 10%→20% opacity (`from-{tone}/10 to-{tone}/20`), rather than a flat tint — every stop's icon-color contrast against the gradient's darkest point has been verified to clear the WCAG non-text 3:1 minimum. This is deliberately **not** applied to icons with no background shape (inline row-action icons, breadcrumb icons, sidebar icons) — those stay flat-colored.

### 2.8 Iconography

**Library:** Lucide (`lucide-react`), self-hosted as a real npm dependency — not a CDN script.

**Size steps (role-based, not a single fixed size):** 10–12px for badge/chip/inline-muted glyphs, 14px for table/tab/menu-item icons, 16px as the standalone-control default, 18px for icon-buttons/header/nav icons, 20px for sidebar nav-item icons, 22px for empty-state/large accent icons, 28px for hero/decorative icons.

**The colored-icon system, described by logic, not just a color list:**
- **Module-identity color** (§ 2.1's eight hues) — applied only where an icon represents "which functional module does this belong to," currently just Home's quick-links tiles and command-palette result rows.
- **Semantic tone color** (success/warning/error/info) — applied only where an icon represents a status or outcome (Badge, IconBadge, Toast, StatCard trend chips). Status icons always use the semantic palette regardless of what module they appear in — this is enforced by construction (module colors and semantic colors occupy entirely separate hue bands, so the two systems can never visually collide).
- **Accent teal** — reserved exclusively for AI-assisted/generated content markers (the Sparkle icon, AiTag's "ai" kind).
- **`tone`-colored row-action icons** — a flat (no background container) colored icon used for direct per-row actions in a table (View/Edit/Duplicate/Delete), each a distinct tone (info/primary/accent/danger) reinforced by a distinct glyph shape so color is never the sole distinguishing cue.
- **Icon-in-a-container** (IconBadge and its relatives) always uses the icon-container-gradient formula (§ 2.7) rather than a flat tint.
- **Sidebar icons are the one deliberate exception to all of the above** — every sidebar icon renders solid white regardless of which module it represents, by explicit design rule (a colored-icon sidebar and this app's "brand color as a solid rail fill" decision are treated as mutually exclusive).

---

## 3. Component Library

Every component below was verified directly against its source. Font sizes/weights, colors, radii, and shadows all resolve to the tokens in § 2.

### 3.1 Buttons

**Button** — the app's one general-purpose button, `rounded-control` (8px, crisp not pill), `inline-flex` layout with an 8px icon gap, label set in the `button` type token (13px/600). Three sizes: `sm` 32px, `md` 36px (default), `lg` 40px (note: `lg` also switches its label to the slightly larger `body` size, not just taller padding).

- **`primary`** (the one primary action in a given context): a subtle diagonal navy gradient fill (`gradient-primary`, `#1E439B → #193780`) with white text, stepping to a darker gradient on hover (`#193780 → #12295E`) and darker still on press (`#12295E → #0C1C40`). Disabled: flat mid-gray fill, muted text, gradient explicitly cleared (not just covered).
- **`secondary`** (routine, non-destructive actions — every Export button and every dropdown-menu trigger renders through this variant): a barely-there white-to-pale-blue diagonal sheen (`gradient-secondary`, white → `primary-50`) with a hairline neutral border and secondary-gray text; hover deepens the sheen one ramp step and darkens the text to full primary-dark; press deepens it once more.
- **`ghost`** (low-emphasis actions): fully transparent, secondary-gray text that darkens on hover, with a light neutral hover fill.
- **`danger`** (irreversible/consequential actions only): a solid saturated red fill with white text; hover/press are simple opacity steps on the same fill.

Focus state (all variants): a 2px primary-blue ring with a 2px offset so the ring doesn't get visually absorbed into an adjacent filled background.

### 3.2 Icon Buttons & Icon Containers

**IconButton** — a small circular (fully round, not the crisp control radius) icon-only control, sized to the same 32/36px height scale as Button. `ghost` (default, transparent, muted icon, light hover fill), `outline` (hairline border + white fill), `danger` (transparent at rest, tints to a soft red fill + red icon on hover). A separate **`tone`** prop (`primary`/`info`/`success`/`warning`/`danger`/`accent`) colors the glyph itself at rest (not just on hover) with a matching soft-tint hover background — this is the pattern used for per-row table actions (View/Edit/Duplicate/Delete), always flat/no-background-shape at rest. Every IconButton requires an accessible label since it carries no visible text.

**IconBadge** — a static, non-interactive circular badge for "an icon sitting inside a colored container." Two sizes: 28px (small, 14px icon) and 40px (default, 18px icon). Fill is always the icon-container-gradient formula (§ 2.7) — a soft 10%→20%-opacity two-stop gradient of whatever tone it's given, with the same tone's darker shade used for the icon itself, so the icon always reads clearly against its own gently-tinted backdrop. The `neutral` tone (the default) uses a pale blue-to-slightly-deeper-blue gradient rather than an opacity trick, for a technical reason (the primary color token can't reliably take an opacity modifier). Used inside StatCard's hero variant, and inside dropdown-menu rows when a menu opts into the richer "badge" icon style (see ActionsMenu below).

**IconBadgeButton** — the clickable sibling of IconBadge: the same gradient-circle look, but a real focusable button with a hairline border, a subtle resting shadow, and a hover state where the tone's gradient steps up one notch of opacity. Sizes are 28px and 36px (note: this is 36px at its default size, 4px smaller than IconBadge's own 40px default — the two are visually paired but not pixel-identical, worth normalizing if a design system audit ever tightens this). Used for the DataTable's "Customize Columns" trigger.

### 3.3 Forms & Inputs

`Input`, `Textarea`, and `Dropdown` all share one visual language: a crisp 8px-radius rectangle, white fill, a `label`-token caption directly above (12px/600, sentence case, not shouted), and on error a small red caption line below plus a solid red border (skipping the normal hover step). Sizes match the 32/36/40px control-height scale.

**The shared 3-state border convention** (applies to Input, Textarea, Dropdown, DatePicker's trigger, Checkbox, and Radio): at rest the border is a very light hairline (pale gray, `border-control`) — deliberately understated. On hover it steps one shade darker (`border-strong`) as a "waking up" cue before the user has even focused it. On focus it turns the full primary blue *and* a 2px primary-blue glow ring appears around the whole control — two reinforcing cues together, not one.

- **Checkbox** — a 16px square with a softly-rounded corner (6px, distinct from Radio's true circle). Checked state fills solid primary blue with a bold white checkmark.
- **Radio** — a 16px true circle. Checked state replaces the border with a thick 5px primary-blue ring, producing a dot-in-circle look without a separate inner element.
- **FileDropzone** (used by Mass Upload and the Customer Profile document flows) — an empty state is a large dashed-border rounded rectangle (16px radius) with a centered 48px solid-primary circular upload icon, helper copy, and a "Browse Files" button; dragging a file over it turns the border and a faint background tint solid primary. Once a file is chosen, the dropzone becomes a compact single row (icon, filename, size, a remove button) or, during upload, an animated primary-filled progress bar with a percentage label.
- **DatePicker** — shares the Input/Dropdown border convention on its trigger, with a leading calendar icon. Its open panel is a 280px-wide popover (floating shadow tier, § 2.6) containing a weekday header row and a 6-week day grid. Today's date gets a thin ring outline; a selected date or range endpoint fills solid primary blue with white text; an in-progress date-range preview shows as a soft blue band (the one place in this app a "day cell" isn't circular/individually shaped — the band is continuous); out-of-range or disabled dates fade to low-opacity muted text and are genuinely unclickable. Supports both single-date and two-click range selection, with full arrow-key/Enter/Escape keyboard control.
- **Dropdown** — visually a bordered trigger with a chevron that flips 180° when open, and — critically — is a fully custom-built option list, not a native browser `<select>` (a native select's open list can't be styled at all in any browser, which is why this was rebuilt). Its open panel uses the app's heaviest "floating" shadow tier plus a quick scale/fade entrance. Each option row has a 2px accent bar on its left edge that's invisible at rest and turns solid primary blue (paired with a soft blue background tint) on hover or keyboard focus — mouse and keyboard render through the identical visual state, since opening the list moves real focus onto the highlighted option rather than faking it. The selected option keeps that accent treatment permanently, plus a trailing checkmark.

### 3.4 Cards & Containers

**Card** — the base surface for nearly every content block: 12px radius, white fill, a hairline neutral border, 24px internal padding by default. Three elevation tiers control shadow + border strength together (never independently, to avoid an accidental double-border collision): `flat` (default — the barely-there shadow tier, used almost everywhere), `raised` (one shadow step up, no hover response — used for System Health and Needs Attention, cards that matter slightly more but aren't themselves clickable), and `premium` (a further shadow step up plus a faint primary-blue-tinted border — reserved for the Daily Summary card specifically). `CardHeader`/`CardTitle` give a standard title row.

**ModuleCard** — a clickable tile: icon in a soft rounded-square container on the left, title + one-line description to the right, an optional small meta caption, and a trailing chevron that nudges right on hover while the whole tile's border tints primary and gains a touch of shadow. Its icon container can be recolored per-instance (used by the Home page's module-colored quick-links grid).

**StatCard** — the KPI display card, in two flavors. `hero` (Home's four top-line KPI cards): an icon badge top-left, a tonal trend pill top-right ("+12.5%"-style, colored by whether the trend is favorable/unfavorable/flat — not by raw arithmetic sign), a muted label, and a large bold monospace figure — a flat bordered card (deliberately not gradient-treated, to keep the KPI row reading as one even flat set rather than singling one metric out). `plain` (Mass Upload's Total/Successful/Failed result cards): a simpler centered card with no icon, just a big monospace number and a label — used for transient, in-page result numbers rather than persistent top-line KPIs. Both support a skeleton-loading state that swaps in placeholder bars.

**UncapturedScreen** — the deliberate "honesty" placeholder used for any nav destination this build doesn't actually have a real screen for (see § 7 for the full list): a dashed-border rounded panel (16px radius — notably the same radius as Modal, larger than an ordinary card) with a question-mark-file icon, a bold "not captured" label, and an explanatory muted note. It never fabricates a plausible-looking fake table.

**EmptyState** — the simplest primitive: a centered icon (inbox by default) plus one line of muted message text, generously top/bottom padded. No call-to-action slot — genuinely just a message.

### 3.5 Status, Tags & Badges

**Badge** — the one status-pill primitive: full pill shape, small pale tinted background with matching darker text, five tones (`success`/`warning`/`error`/`info`, plus a `neutral` default that uses plain gray rather than a semantic tint). Purely a static label, no interaction.

**AiTag** — the single, deliberately consistent marker for "this surface is AI-touched" or "this surface shows sample/mock data" anywhere in the app (it replaced five previously inconsistent ad hoc chips). Small pill, two visually distinct kinds: **`ai`** (a small sparkle icon on a pale teal-accent background — used when the surface's *content* is generated/interpreted by an AI-shaped feature, even though every such feature today is a deterministic mock, not a live model) and **`mocked`** (a small database icon on plain neutral gray — used when the surface shows sample/placeholder *data*, independent of any AI framing). Genuinely rule-based, non-AI features (Mass Upload's error clustering, the dunning-bucket comparison, campaign duplicate detection) deliberately do **not** carry this tag — they use a plain inline caption like "(rule-based, not AI)" instead, so the AI marker itself stays trustworthy.

### 3.6 Overlays: Modal, Toast, Tooltip, Popovers

**Modal** — 16px-radius white panel (the largest radius in the system, appropriate to its literal top-of-stack floating role), hairline border, the heaviest "grounded" shadow tier, capped width, centered over a half-opacity dark scrim. A short fade/scale-in on open and matching fade/shrink on close (~120–160ms), respecting reduced-motion preferences. Full keyboard trap (Tab cycles only within the dialog), Escape closes, focus returns to whatever opened it. An optional thin gradient accent bar can run just inside the top edge — currently used only on the global command-palette (Ctrl+K) modal, the app's single highest-frequency dialog.

**Toast** — small notification cards that stack bottom-right, 10px radius, hairline border, a moderate shadow, auto-dismissing after four seconds (with a manual close × always available). Three tones: success (green check), error (red alert), info (blue info) — there is currently no dedicated warning-toned toast, an asymmetry against the rest of the system's four-tone semantic model.

**Tooltip** — a small dark rounded label (10px radius, near-black fill, white text) that appears directly above or below its trigger on hover *and* keyboard focus (never hover-only, since that would be invisible to keyboard users). No arrow/caret, opacity-only fade, no directional variants beyond top/bottom (every real consumer is a small fixed icon control, so that's sufficient).

**The shared "popover" family** (Dropdown's option panel, the user-profile and language dropdowns, the Actions/bulk-action menus, saved-filter presets, DataTable's column-visibility panel, and a horizontal tab strip's overflow "More" menu) all render with the same visual formula: 10px radius, hairline border, the app's heaviest "floating" shadow tier (three stacked shadow layers — see § 2.6), and a quick 160ms scale/fade entrance. Menu item rows all share the same left-edge accent-bar hover/focus convention as Dropdown's own options. Destructive items (e.g. "Delete," "Log Out") get a red-tinted version of that same hover treatment instead, with a divider line placed just above them to set them apart from routine actions.

**ActionsMenu** — the underlying dropdown-menu primitive behind most of the above. Its trigger defaults to a "secondary"-style button reading "Actions ▾" but can be fully replaced by a custom trigger element (used by the user-profile menu's avatar/name button). Menu items can render as a compact flat row (colored icon glyph only — the default, used by most per-page action menus, which are intentionally short and dense) or, opted into per-menu, a taller "badge" row where each item's icon sits inside a small IconBadge gradient circle — currently used only by the user-profile dropdown, giving its 7 items a slightly richer, more spacious treatment than the app's other, higher-frequency menus.

### 3.7 Data Table System

**DataTable + TableToolbar** — the single shared implementation behind every list screen in the app (12+ screens).

*Toolbar,* laid out as one wrapping row of three logical groups (search, then a visually-grouped cluster of filter controls behind a hairline divider, then action buttons pushed to the far right): a search input on the left, filter dropdowns/checkboxes grouped together, and Export/New/bulk-action buttons on the right. When any filter is active, a second row of small removable pill chips appears underneath ("Customer Group: Enterprise ×"), with a "Clear all" text action.

*Table shell:* a white rounded rectangle (12px radius) with a single hairline border — no drop shadow (this is the border-first model in practice: a table doesn't need a shadow on top of its own border). The header row is sticky, has a pale gray-tinted background, and its labels are sentence case at the compact "caption" size (not shouted uppercase) — sortable columns show a faint up/down arrow that brightens once actually sorted. Body rows use the app's "dense" 13px body text (rather than the 14px used elsewhere) specifically because a table is the one place row counts can run into the hundreds or thousands; each row gets a bottom hairline divider and a pale hover tint. A row-selection column (checkbox for multi-select, radio for single-select) can pin to the sticky first column, and selecting any rows surfaces a pale-blue bulk-action bar above the table showing the count plus caller-defined bulk buttons.

*Column visibility:* an optional, per-screen "Customize Columns" trigger (a small gradient icon-button, tooltip-labeled) opens a checklist panel to show/hide columns, persisted per browser via local storage.

*Row-level actions* come in one of two deliberately different patterns depending on the screen: most screens use a compact dropdown ("Actions ▾" or icon-triggered) listing 1+ bulk/page-level actions; a couple of screens (Campaign List, and Mass Upload's error table) instead use a fixed-width inline row of small tone-colored icon buttons — one icon per direct action (e.g. View=info-blue, Edit=primary-blue, Duplicate=teal-accent, Delete=red), each with its own hover tooltip, executing immediately with no extra menu step. This icon-row pattern exists specifically for screens where a dropdown-per-row would either add too much friction for very common single-click actions or (on very wide tables) reintroduce horizontal scrolling.

*States:* a shimmering skeleton-row placeholder while loading; two genuinely distinct empty states (one for "no rows exist yet / a required filter hasn't been chosen," a different one for "rows exist but nothing matches the current search," so the two situations are never confused); bottom-aligned pagination showing a monospace "Showing 1–10 of 42" range plus circular Prev/Next controls.

**FilterPresets** — a small "Presets" dropdown button that lets a user save the current combination of filters under a name and re-apply it later (persisted per-screen via local storage) — available on several of the richer-filtered screens.

**Pagination** — bottom-of-table row: a monospace range label on the left, circular Prev/Next icon controls plus a "Page N of M" label on the right; disabled/greyed at either boundary; disappears entirely (not just disabled) when there's only one page.

**Skeleton** — a pulsing pill-shaped gray bar used as a loading placeholder, either standalone or tiled into a full skeleton table-row grid.

---

## 4. Layout Shell

### 4.1 Sidebar

**A fixed-width, 88px, non-collapsible vertical icon rail** — there is no expand/collapse affordance anywhere in the current build (an earlier design pass explored a wider, collapsible, labeled rail; that direction was reversed and the collapse toggle code was deleted outright, not just hidden). The rail's fill is a **subtle vertical gradient** running from the brand primary blue at the top to a darker navy at the bottom (not a flat solid fill, despite that being how it's sometimes described in older planning notes — verified directly in code).

Top-to-bottom structure:
1. **Brand mark** — the client's circular logo badge (a photo-in-ring mark reading "AUTONOMOUS FINANCE WITH GIA" curved around the rim, 40px, centered with breathing room on both sides), linking back to Home.
2. **Navigation items** — one per module (Home, General, User Config, Codes, Credit Configs, Strategy, Letters, Reports, Mass Upload), each a stacked icon-over-label tile: a 20px icon on top, an all-caps micro-label (9px) below, centered, wrapping to two lines for longer labels like "CREDIT CONFIGS."
3. **Footer wordmark** — the "Powered by Emagia" wordmark image (60px wide, auto height, 90% opacity so it reads as secondary to the main brand mark above) — a white/light-colored asset specifically meant to sit on the rail's dark fill (it appears blank on a plain white background).

**Nav-item states:** default is a white icon + white label directly on the gradient fill, no background. Hover adds a very subtle translucent white overlay tint. The active module gets an **inverted solid white pill** behind its icon+label (the strongest, most unambiguous "you are here" signal available on a colored rail) with dark-navy text/icon color and a semibold weight bump — active-module detection is computed from the current URL's path prefix (so the correct sidebar item stays highlighted even when the user is on a module's second, third, etc. sub-tab, not just its first). Keyboard focus shows a white ring offset from the fill.

### 4.2 Topbar

A fixed 56px-tall sticky header with a hairline bottom border, white background, no shadow (consistent with the border-first depth model). Left side holds a styled **Breadcrumb** trail — up to three segments (Home → Module → current tab, each with its own small icon reused from the sidebar/search system) sitting inside a soft pale-gray rounded rectangle (not a pill), with the current page bolded in primary blue and every earlier segment a clickable muted link. Right side holds, in order: an icon-only search trigger (tooltip: "Search (Ctrl+K)," opens the global command palette), a flag-and-language dropdown (**LanguageSwitcher** — 11 languages, native-script names, each with its own flag icon; UI-only, does not actually translate any content), an icon-only Help trigger, and — behind a hairline divider — the **user profile menu** (avatar circle + "System Admin" name + chevron, opening a 7-item dropdown: My Activity, Change Password, Notification Preferences, Keyboard Shortcuts, Contact Us, Help, then a divider, then a red-toned Log Out).

### 4.3 Horizontal Sub-Module Tab Strip

Every multi-tab module renders a horizontal row of tabs directly below the Topbar, before the page content. The active tab combines **three simultaneous cues** so it's never distinguished by color alone: a pale primary-blue background block behind the label, a bold 3px primary-blue underline beneath it, and a semibold weight bump — plus a supplementary shadow that lifts the active tab's block slightly. An inactive-but-hovered tab gets a light neutral background tint distinct from both the active and plain-default look. Tab labels are uppercase with loose letter-spacing, matching the app's short-label uppercase convention.

There are, in the current build, **two separate implementations of this same visual pattern used on different modules** — visually matched but behaviorally different: the General module uses a more sophisticated version with real keyboard tab-list semantics and a measured "More ▾" overflow menu for tabs that don't fit; every other tabbed module (User Config, Codes, Credit Configs, Strategy, Letters) uses a simpler version that just horizontally scrolls when tabs overrun the available width, with plain-link (not full tab-list) keyboard semantics. This is a documented, intentional (not yet unified) implementation gap — see § 7.

---

## 5. Screen-by-Screen Specification

Every screen renders inside the shared shell (Sidebar + Topbar); tabbed modules additionally render the horizontal sub-tab strip (§ 4.3) above their page content. Component descriptions below reference the primitives in § 3 rather than redescribing them.

### 5.1 Home

**Purpose:** the landing dashboard — orientation, top-line KPIs, shortcuts to common tasks, and cross-module status/alerts.

**Layout, top to bottom:**
1. **Hero banner** — full-width gradient band (primary-blue → indigo-violet), white text: today's date, then "Welcome back, **System Admin**" (a hardcoded name — there is no real logged-in-user identity anywhere in this app), a large faint decorative sparkle icon on the right (hidden on small screens).
2. **"Frequently Needed" quick-links grid** — a heading followed by a responsive 1/2/3-column grid of six ModuleCard tiles, each colored with its destination module's identity color: Upload a File, Add a Company, Run a Report, View Batch Job Status, View Dunning Letters, Create a Campaign.
3. **KPI stat row** — four hero-variant StatCards in a 2-then-4-column responsive grid: Companies, Letter Templates, Report Groups, and Last Upload Success % (this last card's tone/trend flips between success and warning depending on the real computed failure rate).
4. **A 2-column widget grid** containing, in order: **Daily Summary** (the one other gradient-treated card on the page — a soft near-white primary wash, a teal gradient sparkle badge, one AI-generated-style narrative sentence tagged "AI · Mocked," and three inline stat figures below a divider), **System Health** (a single alert strip, warning or success toned, driven by a real threshold check against the mock upload data — explicitly not AI), **Needs Attention** (a list of cross-module alert rows, each severity-colored info/warning/error, computed by real rule-based checks spanning General Letters, Mass Upload, Batch Job Status, Security, and Campaign List — the highest-severity rows get a subtle red-tinted background block), and **Recent Activity** (a plain flat card, tagged "Mocked," listing recent actions as clock-icon rows linking back to their source records).

### 5.2 General Module

Tabs: Holidays, Companies, Security, Customer Profile, Batch Job Status (all built).

**Holidays.** Toolbar with Company and Codes(holiday-type) filters plus a year stepper (prev-arrow / year dropdown / next-arrow). Below, the **Holiday Calendar Assistant** — a raised card tagged "AI · Mocked" listing computed suggestion rows (gap/suggest/conflict, each with its own icon+tone) and three quick-action buttons (Copy last year's calendar, Auto-apply US national holidays, Bulk-import from template) that genuinely recompute and write into the in-memory calendar state. Below that, a 12-tile responsive grid of month cards, each with a consistent soft primary-tinted gradient wash and a hover lift; each tile shows a 7-column weekday header, a day grid with holiday dates picked out in a blue info-tinted pill, and a small legend list of that month's holiday names beneath.

**Companies.** Standard search + Export/New-Company toolbar, plus a distinct "try a phrase" natural-language filter row (tagged "AI Preview," keyword-matching only, not a live model) beneath the main toolbar. Table columns: Company Number, Company Name, Created By, Created Date, Last Updated By, Last Updated Date, Set Of Books, plus a trailing History icon column opening an audit-trail modal. Row selection enables Export Selected / Deactivate Selected bulk actions.

**Security.** Two sub-tabs (Screen Access / Functionality Access), each a search toolbar over a two-column table: a name column and a "User Groups" column that renders as an expand/collapse summary ("N of M groups") revealing a wrapped row of green/gray status-badge chips per group when opened — chosen over a fixed per-group column grid since the functionality list can run to dozens or hundreds of rows.

**Customer Profile.** A single "Customer" selector drives six sub-tabs: Customer Info, Credit Info, Collection Info, Settings (each a simple two-column form card with a Save action), Address, and Contacts (each a responsive card grid — one card per address/contact, IconBadge header, Edit/Delete icon actions, and a dashed-border "Add" tile as the trailing grid cell, matching FileDropzone's dashed-tile language rather than a separate button above the grid).

**Batch Job Status.** Toolbar with search, Company and Module dropdown filters, and a date-range picker ("Job Date Range," shown as a removable chip once set) plus Export. Table columns: Batch Job Name, Batch Job Status (a color-coded badge — success/failed/running/pending), Batch Job Date, Batch Job Message, Created By, Created Date (both hidden by default), Last Updated By, Last Updated Date.

### 5.3 User Config Module

Tab: Representative Profile (built; Representative Group and User Profile are unbuilt placeholders).

Company + Functional Code filters gate the table (disabled until both are chosen). Toolbar also carries a saved-filter-presets control and an actions menu (Add Representative, Deactivate Selected — both unwired). Table columns: Name, Title, Representative Number, Reporting To, Source, Associate Companies, Primary Company, Created By/Date (hidden by default), Last Updated By (hidden by default)/Date.

### 5.4 Codes Module

Tab: Lookup Codes (built; Dispute Codes, Dispute Stage Codes, Preferences, Time Zone are unbuilt placeholders).

Company + Lookup-Type filters (disabled search/export until chosen) plus a standalone "Allow Override By Local Super User" checkbox. Table columns: Code, Created By, Created Date, Last Updated By, Last Updated Date, Description.

### 5.5 Credit Configs Module

Tab: User Defined Attributes (built; Matrics Definition, Data Checklists, Score Cards, Auto Decision are unbuilt placeholders).

A Company filter gates the table; toolbar actions are three standalone tooltip-icon buttons (Copy, History, Add) rather than a menu. Table columns: User Defined Attributes (the attribute name), Display Name, DB Field Name, Visibility (a badge), Data Field Mapped To (hidden by default), Data Type, Created By/Date (Created By hidden by default), Last Updated By (hidden by default)/Date, Comments.

### 5.6 Strategy Module

Tab: Strategy (built; Collector Assignment Strategy, Task Master, Credit Memo Rule are unbuilt placeholders).

Company filter gates the table; presets + New Strategy + Export in the toolbar. Table columns: Strategy Name, Internal, External, Sequence Number, Default (Yes/No badge), Comments (hidden by default), Assigned Group Name, Auto Dispute (Yes/No badge), Credit (Yes/No badge), Created/Last Updated By+Date (several hidden by default).

### 5.7 Letters Module

Tabs: General Letters, Dunning Letters, Campaign List (all built).

**General Letters.** Company + Letter Group filters; a rule-based (explicitly "not AI," despite the sparkle icon) template suggestion line above the table. Table columns: Template Name, Language, Description, Created/Last Updated By+Date. Row selection enables Export Selected.

**Dunning Letters.** The richest filter set in the app — Company, Customer Group, Dunning Bucket, and Language dropdowns plus saved presets, all with removable active-filter chips. Table columns: Customer Name, Customer Group, Dunning Bucket (shows an inline warning-toned "Suggested: {bucket}" hint when a mocked smart-suggestion is more severe than the current bucket), Language (shows a sparkle "Suggested: English" hint when unset), Letter Status (badge), Last Sent Date, Amount Due (right-aligned monospace currency), and a "Preview" link column opening a read-only letter-preview modal.

**Campaign List.** Company filter, plus a duplicate-subject warning banner when applicable. Table columns (tuned to avoid horizontal scroll — several are truncated and/or hidden by default): Campaign Description, From Address, To Address, Subject (shows an inline "Dup" chip on subject collisions), Status (badge), Template Name (hidden by default), Created/Last Updated By+Date (mostly hidden by default, dates shown in a compact "Jan 5, '26" form). The trailing actions column uses the icon-row pattern (View/Edit/Duplicate/Delete) rather than a dropdown, specifically to keep this wide table from needing horizontal scroll. Delete is confirmation-gated and genuinely removes the row from state.

### 5.8 Reports (standalone, no tabs)

**Dynamic Reports.** A computed (non-AI) summary banner ("N report groups, spanning {date} to {date}. User {X} created the most.") above a search + New Report Group + Export toolbar. Table columns: Group Name, Group Description, Reports Source, Created By/Date, Last Updated By/Date (the last two hidden by default).

### 5.9 Mass Upload (standalone, no tabs)

**The one screen that deliberately breaks the app's usual full-width layout.** A page heading and "Download Template" action, then a **centered** upload card (a Card capped to a narrow max-width, unlike every other screen's full-bleed content) containing a FileDropzone and Upload/Clear buttons. Once a file is processed, a sticky summary bar (pinned just below the Topbar) shows the filename/timestamp and three plain-variant StatCards (Total, Successful, Failed — Failed gets an inline warning line if the failure rate exceeds a 1% threshold). Below that, an **Error Records** section: a row of count-by-type badge chips (real aggregation), an optional sparkle-icon "cluster insight" callout when one column/error-type pattern dominates the failures (explicitly rule-based, not AI, despite the sparkle icon), Export Errors / Retry Failed Rows buttons, and a full error-detail DataTable (Row No, Column Name, Type badge, Error Message, plus a "View error details" row action opening a modal). If any errors exist, a second centered upload card appears below for re-uploading a corrected file.

---

## 6. Autonomous / AI-Assisted Features Inventory

Every feature below is marked with its verified real-vs-mocked status, cross-checked directly against its implementing code (not assumed from a label). **"Real logic, mocked data"** means the computation itself is genuine (aggregation, threshold comparison, set-difference, grouping) but runs against this app's static sample data rather than a live backend. **"Mocked"** means the output itself is a deterministic stand-in for what a real AI/LLM call would produce.

| Feature | Screen(s) | Status | AiTag shown? |
|---|---|---|---|
| Daily Summary narrative | Home | Mocked (template string, not a model call) — the three numbers it references are real | `ai` |
| Natural-language company filter | Companies | Mocked (keyword/regex matching, explicitly not a language model) | `ai` (labeled "AI Preview") |
| System Health anomaly check | Home | Real threshold logic, mocked underlying data | none (correctly — not AI) |
| Recent Activity feed | Home, "My Activity" (profile menu) | Mocked data, no AI involved; "My Activity" reuses the same org-wide feed rather than a per-user one (disclosed in-UI) | `mocked` |
| Needs Attention (7 cross-module checks) | Home | Real rule-based aggregation across 5 modules, mocked underlying data | none (correctly — not AI) |
| Holiday Calendar Assistant (gap/suggest/conflict detection + 3 quick actions) | Holidays | Real computed logic (real date math, real set-difference), writes genuinely into in-memory state; nothing persisted | `ai` |
| Error-type summary | Mass Upload | Real aggregation | none |
| Error-pattern clustering | Mass Upload, Needs Attention | Real (column, type) grouping/ranking | sparkle icon used but explicitly captioned "rule-based, not AI" |
| Error-fix suggestions | Mass Upload | Mocked (static lookup table) | inline caption "(rule-based, not AI)" |
| Template suggestion | General Letters | Real rule-based lookup | none (captioned "not AI") |
| Dunning bucket escalation hint | Dunning Letters | Real severity comparison; the suggested-bucket input itself is mocked | sparkle-styled inline hint, no formal tag |
| Language auto-detect fallback | Dunning Letters | Mocked (always suggests "English") | sparkle-styled inline hint |
| Campaign duplicate-subject detection | Campaign List, CampaignFormModal, Needs Attention | Real case-insensitive grouping | inline "Dup" chip, no AiTag |
| Reports summary line | Dynamic Reports | Real aggregation | none (explicitly captioned as not AI) |
| Smart defaults / auto-fill (remembers each admin's most-picked filter value per screen) | Customer Profile, Strategy, Lookup Codes, Representative Profile, User Defined Attributes | **Real, fully live** (localStorage-backed) — not mocked | none (deliberately — it's real personalization, not AI) |
| Command palette recent/search | Global (Ctrl+K) | Real, working (localStorage-backed visit tracking + real fuzzy search) | none |

**Governing convention:** the `AiTag` component (§ 3.5) is the one visual marker for either "AI-shaped content" (`ai` kind, sparkle icon) or "sample/mock data" (`mocked` kind, database icon) anywhere in the app. Several features use a sparkle icon or AI-adjacent visual language *without* the formal tag, specifically because their own code and on-screen captions insist they are rule-based, not AI — Figma Make should treat a bare sparkle icon plus a "(rule-based, not AI)" caption as a **visually distinct, deliberately less prominent** treatment from a full `AiTag kind="ai"` badge, not an equivalent one.

---

## 7. Known Gaps & Open Assumptions

**Systemic, applies everywhere:** there is no backend anywhere in this application. Every create/edit/delete flow (Companies, Campaign List, Customer Profile's every tab, Customer Address/Contact lists, Holidays' AI quick-actions) writes to real in-memory React state — visibly working within a session — but nothing persists across a page reload, and every such flow shows a toast disclosing this. There is also no authentication/session system at all (no login screen, no session storage) — "Log Out" is fully mocked and deliberately does not navigate anywhere, so the app can't be left in a broken "nowhere to go" state. There is no i18n/localization system — the Language dropdown is UI-only and does not translate any content.

**Placeholder ("uncaptured") screens — render a generic "not yet built" panel, not a real design.** These tab labels exist in the navigation because they appear in the app's source requirements document, but no screen was ever specified/built for them: User Config's Representative Group and User Profile; Codes' Dispute Codes, Dispute Stage Codes, Preferences, and Time Zone; Credit Configs' Matrics Definition, Data Checklists, Score Cards, and Auto Decision; Strategy's Collector Assignment Strategy, Task Master, and Credit Memo Rule. Figma Make should not generate real designs for these unless separately briefed — they are explicitly out of scope today.

**Screens/fields with no source-of-truth evidence — every field, column, or option list was inferred from context and should be confirmed before being treated as final:**
- **Dunning Letters** has no original reference evidence at all — every column, filter, status value, and the smart-suggestion behaviors are inferred.
- **Security** and **Holidays** have no original reference evidence at all — both are new screens built from a task description alone.
- **Customer Profile's** Customer Info / Credit Info / Collection Info / Settings tabs — every field on all four is inferred purely from the tab's name.
- **Customer Profile's** "Customer" selector reuses the Companies list, since no distinct Customer entity exists in the data model — an inferred mapping, not a confirmed one.
- **Customer Address / Customer Contact** records have no "default/primary" flag in the data model, so no default-marking UI exists on their cards — flagged as a real next step if that field is ever added, not silently invented.
- **Campaign List's** column set was the one thing given precisely; its statuses, per-row actions, and "New Campaign" creation flow are all inferred.
- **Representative Profile, Lookup Codes, User Defined Attributes, Strategy** — each screen's column headers/filters are sourced, but the source only ever showed each in its empty state, so the sample row data shown is invented-but-plausible, not sourced content.
- **Mass Upload's** accepted file types (.csv/.xlsx) and 10MB size limit are explicitly marked as assumed pending a real upload-endpoint contract; its progress bar is a simulated timer, not real upload-progress events.

**Open product questions, not yet resolved either way:**
- Whether "Settings" should become its own real screen or stay folded into the profile menu — the Topbar's old Settings gear icon was removed (it had no working destination), and this is flagged in the codebase as an explicit open question rather than answered.
- The module-identity color system (§ 2.1) has exactly eight curated hues, one per today's module, with none held in reserve — a ninth module would need a new color decision.

**Implementation inconsistencies worth flagging (verified in code, not editorial opinion):**
- The two horizontal tab-strip implementations (§ 4.3) are visually matched but not behaviorally equivalent — only the General module gets full keyboard tab-list semantics and overflow collapse; the other five tabbed modules fall back to horizontal scrolling with plainer keyboard behavior. Documented in-code as intentional-for-now, not accidental.
- `Toast` supports only success/error/info tones, not the fourth `warning` tone the rest of the system (Badge, IconBadge, IconButton) carries.
- `IconBadge`'s default/medium size (40px) and `IconBadgeButton`'s default/medium size (36px) don't match despite being visually paired components with the same size-prop name.
- The Batch Job Status page's Company filter is present and stateful in the UI but is not actually wired into the row-filtering logic (only Module and Date Range genuinely filter the table) — a live functional gap, not just a visual one.
- The Help modal's four topic buttons render with full hover/focus affordances but have no click handler wired — they look interactive but do nothing.
- Most mocked/AI surfaces carry a visible `AiTag`; a couple of mocked surfaces (the letter-preview modal's rendered content, the password-change and logout confirmations) disclose their mocked nature only via toast text or code comments, not a visible in-UI tag — an inconsistency in how transparently "this isn't real" is communicated to an end user.
- The user-profile menu's avatar circle (the "S" initial) is styled using the semantic **warning** color pair (amber background/text) rather than a neutral or primary tone — visually it just reads as an amber circle, but it's a slightly unusual token choice worth a second look (a user avatar semantically inheriting a "warning" meaning).

---

## 8. Documentation vs. Code — Discrepancies Resolved for This Spec

Per this audit's own instructions, every value in this document was verified against the live source (`tailwind.config.js`, `src/index.css`, and every component/page file), not taken from `design-guide.md`'s prose at face value. Two real, current drift points were found and are resolved here in favor of the code:

1. **Sidebar shell dimensions.** `design-guide.md` § 6 ("Spacing & Layout") still describes the sidebar as "collapsible 240px ↔ 72px," a description of an earlier design pass. The detailed, per-component § 4.9 of the same document — and the actual `Sidebar.tsx`/`AdminLayout.tsx` source — agree the sidebar is a **fixed 88px, non-collapsible** rail; there is no toggle anywhere in the codebase. This document uses the verified 88px/no-collapse description throughout (§ 2.4, § 4.1).
2. **The most recent documented design round's own body sections lag its summary.** `design-guide.md`'s "LATEST PASS (fix round 11)" summary at the top of the file accurately describes six changes (a Modal focus-management bug fix, Customer Profile's Address/Contacts card-grid rebuild, further Breadcrumb polish, gradient-icon treatment on the user-profile and language dropdowns, a strengthened active-tab shadow, and a TableToolbar alignment fix) — all six were independently confirmed present in the live source during this audit. However, the corresponding **numbered body sections** below that summary (§ 4.2, § 4.4, § 4.7a, § 4.8, § 4.14, § 4.16) were not updated to reflect those same six changes — they still describe the prior round's state in places. This document's component and layout descriptions (§ 3, § 4) reflect the verified current code, not the stale numbered sections.

No other conflicts between documentation and implementation were found to be currently live — the radius (8px control radius, not the historical 4px or "everything is a pill" values), the dark-mode removal, and the sidebar's gradient (not flat) fill are all consistently confirmed across both the documentation and the source.

---



