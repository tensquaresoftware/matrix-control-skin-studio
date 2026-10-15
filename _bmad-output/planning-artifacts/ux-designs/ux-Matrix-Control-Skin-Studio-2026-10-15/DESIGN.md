---
name: Matrix-Control Skin Studio
description: Dark calibration console chrome for an internal browser skin editor; the GUI view mock is the bright visual focus.
status: final
updated: 2026-10-15
colors:
  surface-app: '#1A1B1E'
  surface-chrome: '#222326'
  surface-panel: '#2A2B30'
  surface-raised: '#32333A'
  surface-sunken: '#141518'
  border-subtle: '#3A3B42'
  border-strong: '#52545C'
  text-primary: '#E8E9ED'
  text-secondary: '#A8AAB4'
  text-muted: '#6E707A'
  text-on-accent: '#0E0F12'
  accent: '#4C8DFF'
  accent-muted: '#2A4A8A'
  warning: '#E0A020'
  warning-muted: '#5C4510'
  destructive: '#E05555'
  destructive-muted: '#5C2020'
  focus-ring: '#7AA8FF'
  selection-outline: '#4C8DFF'
  pulse-outline: '#4C8DFF'
  canvas-veil: '#0E0F12'
  scrollbar: '#3A3B42'
  scrollbar-thumb: '#5A5C66'
typography:
  ui:
    fontFamily: IBM Plex Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.35'
  ui-strong:
    fontFamily: IBM Plex Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: '1.35'
  label:
    fontFamily: IBM Plex Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: 0.04em
  title-bar:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.3'
  mono:
    fontFamily: IBM Plex Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.35'
  mono-sm:
    fontFamily: IBM Plex Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: '1.3'
  context:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.3'
rounded:
  none: 0
  sm: 2px
  DEFAULT: 4px
  md: 6px
  lg: 8px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 20px
  '6': 24px
  unit: 4px
  chrome-pad-x: 12px
  chrome-pad-y: 8px
  top-bar-height: 40px
  context-strip-height: 28px
  sidebar-width: 320px
  splitter-hit: 6px
  pane-gap: 0px
  control-gap: 8px
  section-gap: 12px
components:
  top-bar:
    background: '{colors.surface-chrome}'
    border-bottom: '{colors.border-subtle}'
    height: '{spacing.top-bar-height}'
    padding-x: '{spacing.chrome-pad-x}'
    text: '{colors.text-primary}'
    control-gap: '{spacing.control-gap}'
    group-separator: '{colors.border-strong}'
  context-strip:
    background: '{colors.surface-sunken}'
    border-bottom: '{colors.border-subtle}'
    height: '{spacing.context-strip-height}'
    text: '{colors.text-secondary}'
    label: '{colors.text-muted}'
    value: '{colors.text-primary}'
    typography: '{typography.context}'
  canvas-selection:
    outline: '{colors.selection-outline}'
    outline-width: 2px
    outline-offset: 1px
    fill: transparent
  sidebar-splitter:
    track: '{colors.border-subtle}'
    hover: '{colors.accent-muted}'
    active: '{colors.accent}'
    hit-height: '{spacing.splitter-hit}'
  picker-pane:
    background: '{colors.surface-panel}'
    padding: '{spacing.3}'
    slider-track: '{colors.surface-sunken}'
    slider-fill: '{colors.accent}'
    hex-field-bg: '{colors.surface-sunken}'
    hex-text: '{colors.text-primary}'
    typography-hex: '{typography.mono}'
  palette-swatch:
    size: 20px
    radius: '{rounded.sm}'
    border: '{colors.border-strong}'
    selected-ring: '{colors.accent}'
    label: '{colors.text-secondary}'
    hex: '{colors.text-muted}'
    row-hover: '{colors.surface-raised}'
    typography-label: '{typography.ui}'
    typography-hex: '{typography.mono-sm}'
  mapping-row:
    background: transparent
    hover: '{colors.surface-raised}'
    selected: '{colors.accent-muted}'
    unbound-marker: '{colors.warning}'
    property-text: '{colors.text-primary}'
    palette-text: '{colors.text-secondary}'
    typography: '{typography.ui}'
  unbound-pane:
    background: '{colors.surface-panel}'
    count-color: '{colors.warning}'
    count-bg: '{colors.warning-muted}'
    row-text: '{colors.text-primary}'
    empty-text: '{colors.text-secondary}'
    border-top: '{colors.border-subtle}'
  export-disabled:
    background: '{colors.surface-raised}'
    text: '{colors.text-muted}'
    border: '{colors.border-subtle}'
    opacity: 0.55
  modal-confirm:
    scrim: 'rgba(14, 15, 18, 0.72)'
    surface: '{colors.surface-raised}'
    border: '{colors.border-strong}'
    title: '{colors.text-primary}'
    body: '{colors.text-secondary}'
    primary-destructive-bg: '{colors.destructive}'
    primary-destructive-text: '{colors.text-on-accent}'
    secondary-bg: '{colors.surface-panel}'
    secondary-text: '{colors.text-primary}'
    radius: '{rounded.md}'
  pulse-highlight:
    outline: '{colors.pulse-outline}'
    outline-width: 2px
    duration: 400ms
    repeats: '1–2'
    easing: ease-out
---

## Brand & Style

Skin Studio is a **dark calibration console** — Figma- and DAW-adjacent chrome that stays quiet so the **GUI view** (the Matrix-Control mock) can stay bright and readable. The product job is disciplined colour binding, not illustration theatre. English UI labels throughout. Product names stay as product names: Skin Studio, Matrix-Control, skins `Black/Green`, `Cream/Green`, `Black/Duo`, `Cream/Duo`, `Monochrome`.

Visual hierarchy: chrome is low-contrast graphite; the mock carries brand and skin colour. Selection, focus, Unbound warning, and destructive actions use chrome tokens only. Project skin colours (including Duo LED baseline `#FFCC00`) live in the product **Palette**, not in this brand colour set.

No left rail, no layers tree, no bottom chrome, no Auto Layout, no overlay editing language. Dense but scannable — Photoshop-like stacked sidebar panes, not a marketing shell.

## Colors

All chrome hex values below are **[ASSUMPTION]** invented dark-theme tokens for draft UX; they may shift at implementation without reopening product scope. Project Palette colours are out of band.

| Token | Hex | Role |
|---|---|---|
| `{colors.surface-app}` | `#1A1B1E` | App shell behind canvas and sidebar |
| `{colors.surface-chrome}` | `#222326` | Top bar |
| `{colors.surface-panel}` | `#2A2B30` | Sidebar panes |
| `{colors.surface-raised}` | `#32333A` | Hover rows, modal surface, raised controls |
| `{colors.surface-sunken}` | `#141518` | Context strip, input wells, slider tracks |
| `{colors.border-subtle}` / `{colors.border-strong}` | `#3A3B42` / `#52545C` | Pane edges vs control outlines |
| `{colors.text-primary}` / `{colors.text-secondary}` / `{colors.text-muted}` | `#E8E9ED` / `#A8AAB4` / `#6E707A` | Primary labels, secondary readout, disabled/hint |
| `{colors.accent}` | `#4C8DFF` | Selection outline, active Skin/Zoom focus, pulse stroke, primary non-destructive emphasis |
| `{colors.warning}` | `#E0A020` | Unbound count badge and unbound mapping marker (chrome warning — not Duo LED yellow) |
| `{colors.destructive}` | `#E05555` | Delete confirms, destructive primary buttons |
| `{colors.focus-ring}` | `#7AA8FF` | Keyboard focus ring on chrome controls |

**Not chrome tokens:** Duo LED `#FFCC00`, Black/Cream bases, Patch/Master Orchestrator accents, Green/Grey control colours — these are Palette entries or mock paint only.

## Typography

- **IBM Plex Sans** for chrome UI (`{typography.ui}`, `{typography.label}`, `{typography.context}`, `{typography.title-bar}`). Dense 11–13px scale; labels slightly tracked.
- **IBM Plex Mono** for hex fields and Palette hex readouts (`{typography.mono}`, `{typography.mono-sm}`).
- English microcopy uses sentence case for buttons and titles; Palette constant names may show `k…` style when present in data.
- Do not introduce display/serif faces in chrome. The mock may use Matrix-Control composition typography independent of chrome tokens.

## Layout & Spacing

Desktop-first single window:

1. **Top bar** — `{spacing.top-bar-height}` (40px), full width.
2. **Context strip** — `{spacing.context-strip-height}` (28px), full width under top bar.
3. **Body** — GUI view (canvas) left/main + right **Sidebar** default `{spacing.sidebar-width}` (320px) [ASSUMPTION default width; user-resizable later is Soon/parked unless trivial].

Sidebar = four stacked panes separated by horizontal drag splitters (`{spacing.splitter-hit}` hit target):

1. **Picker** — fixed height (colour picker + sliders + hex).
2. **Palette** — scrollable, height via splitter.
3. **Object / State / Mappings** — scrollable, height via splitter; IA = segmented `[Mappings | Skin]`.
4. **Unbound** — scrollable, height via splitter; always visible.

Spacing unit `{spacing.unit}` = 4px. Chrome padding `{spacing.chrome-pad-x}` / `{spacing.chrome-pad-y}`. No inter-pane decorative gaps (`{spacing.pane-gap}` = 0) — splitters carry the seam.

Zoom control (chrome label **Zoom**) uses discrete PRD UI Scale steps: `50%`, `75%`, `100%` (default), `125%`, `150%`, `175%`, `200%`.

Canonical chrome mock: [`mockups/editor-main.html`](mockups/editor-main.html). Composition reference (ASCII chrome): [`.working/ascii-chrome-simulations.md`](.working/ascii-chrome-simulations.md). GUI view mock fidelity is Figma composition intent; no Collect Object-type inventory invented here.

## Elevation & Depth

Depth is **tonal stacking**, not heavy multi-layer shadows:

- App → chrome → panel → raised/sunken wells.
- Modal uses a dark scrim `{components.modal-confirm.scrim}` and a single raised surface; no glassmorphism.
- Canvas selection and pulse are **outline-only** — no drop-shadow glow blobs on the mock.
- Optional 1px inset borders on sunken fields; avoid stacked card shadows inside the sidebar.

## Shapes

Tight console radii: controls `{rounded.DEFAULT}` (4px), swatches `{rounded.sm}` (2px), modals `{rounded.md}` (6px). No pill clusters, no fully rounded mode chips for Skin switching (Skin is a labeled combo/dropdown). Splitters are flat 1px tracks with a taller hit area.

## Components

### top-bar

Anatomy left→right:

`[New] [Import] [Export]` · separator · `[Undo] [Redo]` · `Zoom: [100% ▾]` · flexible spacer · `Skin: [Black/Green ▾]`

- Background `{colors.surface-chrome}`; bottom border `{colors.border-subtle}`.
- **Export** uses enabled primary accent styling when unbound count = 0; when unbound > 0, use `{components.export-disabled}` (visually disabled, not clickable).
- **Skin** combo anchored right above the sidebar; must scale to 15–20 skins (scrollable menu). Not horizontal mode pills.
- Zoom combo lists the discrete step set only.

### context-strip

Readout under top bar: `Object · State · Zoom · Skin` with muted labels and primary values. Reflects sticky context; not a second set of editors. Empty Object/State shows an explicit empty readout (e.g. `—`) rather than inventing a selection [ASSUMPTION exact empty glyph].

### canvas-selection

On the GUI view mock: 2px `{colors.selection-outline}` outline around the active Object-type region(s). Transparent fill. Not a JUCE pixel clone — Figma-like Matrix-Control composition.

### sidebar-splitter

Horizontal drag handles between the four panes. Default track `{colors.border-subtle}`; hover `{colors.accent-muted}`; dragging `{colors.accent}`. Pane 1 (picker) height is fixed — its bottom splitter moves panes 2–4 only [ASSUMPTION: picker fixed height ≈ 200–240px].

### picker-pane

Fixed-height top sidebar pane: hue / saturation / value (or RGB) sliders, copyable hex field in `{typography.mono}`, apply commits to the **selected Palette entry** only. Never writes free hex into a Mapping slot.

### palette-swatch

Row: swatch chip + optional constant name + hex. Selected row ring `{colors.accent}`. Hover `{colors.surface-raised}`. CRUD affordances: Add / Delete (delete may open `{components.modal-confirm}` when referenced).

### mapping-row

Property → Palette id. Bound rows show swatch + id; Unbound rows show `{colors.warning}` marker and empty/Unbound label. Selected/highlighted row (from canvas sync) uses `{colors.accent-muted}` background. Clicking Unbound focuses picker + Palette for binding.

### unbound-pane

Always-visible fourth pane: warning count badge (`{colors.warning}` on `{colors.warning-muted}`) + clickable list of unbound required mappings (Object · Property…). Scrollable; height via splitter. Empty success copy uses secondary text (see EXPERIENCE.md microcopy).

### export-disabled

Muted filled control: `{colors.text-muted}` on `{colors.surface-raised}`, opacity ~0.55, no pointer activation. Tooltip or title may restate unbound count; the unbound pane remains the authoritative list. Visual: [`mockups/export-blocked.html`](mockups/export-blocked.html).

### modal-confirm

Centered dialog on scrim for: Delete Skin; Delete Palette id still referenced (body lists *n* mappings that will become Unbound); Import replace-all. Destructive primary = `{colors.destructive}`. Cancel = secondary surface button. One modal deep — no stacked overlays as product metaphor. Referenced Palette delete visual: [`mockups/delete-palette-modal.html`](mockups/delete-palette-modal.html).

### pulse-highlight

On Mapping change: discrete outline pulse on affected mock region(s) using `{colors.pulse-outline}` (same family as selection accent — **not** a new Palette colour). Duration ~`400ms`, **1–2** repeats, ease-out, then return to steady selection outline if still selected.

## Do's and Don'ts

**Do**

- Keep chrome dark and quiet; let the GUI view carry skin colour.
- Bind Mappings to Palette ids only; edit hex only on Palette entries.
- Pulse with the chrome accent outline; keep motion short and discrete.
- Show Unbound count + list permanently in pane 4; keep Export disabled while count > 0.
- Use the Skin combo on the right; preserve sticky context on Skin change.
- Label view scale as **Zoom** in chrome (steps match PRD UI Scale).

**Don't**

- Don't put project skin colours (including Duo `#FFCC00`) into DESIGN.md brand tokens.
- Don't add left rails, layers, bottom chrome, Auto Layout, or true overlay editing UI.
- Don't use horizontal Skin mode pills that break at 15–20 skins.
- Don't soft-allow Export with Unbound remaining.
- Don't chase pixel-perfect JUCE parity on the mock.
- Don't invent Collect inventory Object types / Properties / States in visual specs — placeholder labels in mocks only.
