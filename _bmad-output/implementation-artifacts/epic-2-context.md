# Epic 2 Context: Navigate the Calibration Console

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Epic 2 turns the Epic 1 bootable SPA into the locked desktop calibration console: dark quiet chrome around a bright GUI view, with top bar ops, context strip readout, canvas + four-pane sidebar, discrete Zoom, pan, and a right-anchored Skin combo. Operators can switch skins and scale/pan the mock without losing Object type, State, or view position — sticky context for multi-skin compare — while Zoom/pan/sidebar layout stay local prefs and never enter the export JSON.

## Stories

- Story 2.1: Design Tokens and Typography
- Story 2.2: Chrome Shell Layout
- Story 2.3: Top Bar — Ops, Zoom, and Skin Combo
- Story 2.4: Sticky Context Across Skin Switch
- Story 2.5: Canvas Pan and Prefs Persistence

## Requirements & Constraints

- Desktop chrome is canvas (GUI view) + right Sidebar + thin Top bar + context strip under the top bar. MVP forbids a left layers tree, bottom chrome, and left Palette rail.
- Skin switcher is a labeled combo/dropdown listing loaded skins, right-anchored above the sidebar, scrollable for many skins — not horizontal mode pills (UX refinement over the older segmented-pills wording).
- Sticky context: switching Skin changes only the active skin; Object type, State, pan, and Zoom stay as they were. Do not invent a selection when none existed.
- Zoom (product label for discrete UI Scale) steps only: `50%`, `75%`, `100%` (default on fresh prefs), `125%`, `150%`, `175%`, `200%`. Pan/scroll the GUI view on X-Y via click-drag and arrow keys when the canvas is focused.
- Zoom, pan, and sidebar pane heights persist as local preferences; they must never appear in the project export document. Undo/redo must not reverse Zoom or pan.
- Chrome UI language is English operational microcopy; labels include `Zoom`, `Skin`, `New`, `Import`, `Export`. Product skin names stay as product strings.
- Visual system: DESIGN.md tokens as CSS variables (color, spacing, radius, component roles); IBM Plex Sans + IBM Plex Mono per the typography scale; visible focus ring on focusable chrome controls. Project Palette colours (including Duo `#FFCC00`) are not chrome brand tokens.
- Form factor remains desktop-first browser SPA; narrow/mobile soft layouts are Soon, not MVP exit.

## Technical Decisions

- **UI shells:** `chrome/` (top bar + context strip), `canvas/` (GUI view + pan/zoom), `sidebar/` (four panes), `styles/` (DESIGN.md → CSS variables). Shells depend inward on `model/` / `history/`; they never own persistence or invent schema.
- **Session vs prefs:** `SessionUiState` holds only `selectedObjectTypeId`, `selectedStateId`, `activeSkinId`. Skin switch mutates `activeSkinId` only. Zoom / pan / sidebar heights live exclusively in prefs — not in session, not in export.
- **Prefs key:** `skin-studio:prefs` stores `{ zoomStep, panXY, sidebarPaneHeights }` only. Project envelope remains `skin-studio:project` = `{ project, session }`. Reopen restores envelope + prefs.
- **Chrome contract:** Top bar order `[New][Import][Export]` · undo/redo · `Zoom` · spacer · `Skin` combo right-anchored. Sidebar: fixed-height picker → palette → mappings/skin → unbound, with horizontal splitters; panes 2–4 resizable; pane heights persist in prefs. Import/Export/Undo/Redo may be present as ordered stubs until later epics wire behavior; New follows Epic 1 confirm-then-seed.
- **Context strip:** Reads session + prefs; readout-only — not a second editor.

## UX & Interaction Patterns

- Visual hierarchy: dark graphite chrome; the Matrix-Control mock is the bright focus. Dense console radii; no pill clusters for Skin switching.
- Layout heights: top bar 40px, context strip 28px, sidebar default width 320px. Context strip shows `Object · State · Zoom · Skin` with muted labels / primary values; empty Object/State uses an explicit empty glyph (e.g. `—`).
- Skin switch updates the strip’s Skin value and keeps place (UJ-2). Zoom changes update the strip Zoom value without mutating project JSON.
- Canonical chrome composition reference: `mockups/editor-main.html` under the UX design package. Sidebar pane-3 IA (`[Mappings | Skin]`) and unbound/export wiring belong to later epics; this epic mounts the four-pane shell and persistence for heights.

## Cross-Story Dependencies

- 2.1 tokens/typography → 2.2 shell layout → 2.3 top-bar controls; 2.4 sticky context and 2.5 pan/prefs assume the shell and Skin/Zoom controls exist.
- Depends on Epic 1: Vite/TS SPA, single-writer store, seed project, autosave envelope, prefs key shape, and New confirm path.
- Later epics (Palette/Skin CRUD, mapping/preview sync, export gate) assume this locked chrome, sticky context, and prefs/export split.
