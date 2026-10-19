# Epic 2 Context: Navigate the Calibration Console

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->
<!-- Lot B 2026-10-19: chrome SSOT superseded — see DESIGN.md / EXPERIENCE.md / AD-11 and sprint-change-proposal-2026-10-19.md. Epic 2 stories remain done; implement Lot B via lot-b-photocraft-chrome. -->

## Goal

Epic 2 turned the Epic 1 bootable SPA into the desktop calibration console: dark quiet chrome around a bright GUI view, with top bar ops, canvas + sidebar, discrete Zoom, pan, and a right-anchored Skin combo. Operators can switch skins and scale/pan the mock without losing Object type, State, or view position — sticky context for multi-skin compare — while Zoom/pan/sidebar layout stay local prefs and never enter the export JSON.

**Ongoing chrome (Lot B):** no context strip; sidebar **260px**; two tabbed zones (`Color`|`Palette` and `Skin`→`Mappings`→`Unbound` with Unbound badge); Photoshop Color picker (square + hue + `#`/RGB); Object/State in the top bar; Skin then Zoom in ~260px budget. Lot A / Lot C remain separate.

## Stories

- Story 2.1: Design Tokens and Typography — **done** (historical; tokens retuned by Lot B)
- Story 2.2: Chrome Shell Layout — **done** (historical four-pane / 320 / strip superseded by Lot B)
- Story 2.3: Top Bar — Ops, Zoom, and Skin Combo — **done** (historical order superseded by Lot B)
- Story 2.4: Sticky Context Across Skin Switch — **done** (semantics unchanged; readout now top-bar controls)
- Story 2.5: Canvas Pan and Prefs Persistence — **done**
- **Lot B:** `lot-b-photocraft-chrome` — implement Photocraft chrome per accepted sprint change proposal

## Requirements & Constraints

- Desktop chrome is canvas (GUI view) + right Sidebar + thin Top bar. **No context strip.** MVP forbids a left layers tree, bottom chrome, and left Palette rail.
- Skin switcher is a labeled combo/dropdown listing loaded skins, right-anchored with Zoom after Skin (~260px Skin+Zoom budget), scrollable for many skins — not horizontal mode pills.
- Sticky context: switching Skin changes only the active skin; Object type, State, pan, and Zoom stay as they were. Do not invent a selection when none existed.
- Zoom (product label for discrete UI Scale) steps only: `50%`, `75%`, `100%` (default on fresh prefs), `125%`, `150%`, `175%`, `200%`. Pan/scroll the GUI view on X-Y via click-drag and arrow keys when the canvas is focused.
- Zoom, pan, and sidebar zone heights persist as local preferences; they must never appear in the project export document. Undo/redo must not reverse Zoom or pan. Prefs heights keys: `colorPalette` / `skinMappingsUnbound` (legacy three-key → defaults).
- Chrome UI language is English operational microcopy; labels include `Zoom`, `Skin`, `New`, `Import`, `Export`, `Object`, `State`, `Color`, `Palette`, `Create`, `Duplicate`, `Delete`. Product skin names stay as product strings.
- Visual system: DESIGN.md tokens as CSS variables (Photocraft-aligned greys); IBM Plex Sans + IBM Plex Mono; visible focus ring on focusable chrome controls. Project Palette colours (including Duo `#FFCC00`) are not chrome brand tokens.
- Form factor remains desktop-first browser SPA; narrow/mobile soft layouts are Soon, not MVP exit.

## Technical Decisions

- **UI shells:** `chrome/` (top bar only), `canvas/` (GUI view + pan/zoom), `sidebar/` (two tabbed zones), `styles/` (DESIGN.md → CSS variables). Shells depend inward on `model/` / `history/`; they never own persistence or invent schema.
- **Session vs prefs:** `SessionUiState` holds only `selectedObjectTypeId`, `selectedStateId`, `activeSkinId`. Skin switch mutates `activeSkinId` only. Zoom / pan / sidebar heights live exclusively in prefs — not in session, not in export.
- **Prefs key:** `skin-studio:prefs` stores `{ zoomStep, panXY, sidebarPaneHeights }` only. Project envelope remains `skin-studio:project` = `{ project, session }`. Reopen restores envelope + prefs.
- **Chrome contract (AD-11 Lot B):** Top bar order `[New][Import][Export]` · undo/redo · `Object` · `State` · spacer · `Skin` then `Zoom`. Sidebar: Color|Palette zone + Skin|Mappings|Unbound zone; Unbound tab badge; Color = square+hue+`#`/RGB.

## UX & Interaction Patterns

- Visual hierarchy: dark Photocraft-distinct graphite chrome; the Matrix-Control mock is the bright focus. Dense console radii; no pill clusters for Skin switching.
- Layout: top bar 40px, sidebar default width **260px**. Object/State live in the top bar; empty uses `—`.
- Skin switch updates active skin and keeps place (UJ-2). Zoom changes update the Zoom combo without mutating project JSON.
- Canonical chrome: DESIGN.md / EXPERIENCE.md Lot B. HTML mockups under the UX package may be **stale** until regenerated.

## Cross-Story Dependencies

- Historical: 2.1 → 2.2 → 2.3; 2.4 and 2.5 assumed shell + Skin/Zoom.
- Lot B Build depends on Epic 1–5 done baseline; must not invent Lot A inventory or Lot C mock redraw.
- Later Epic 6 / Lot C assume chrome SSOT stays Lot B until another course correction.
