---
name: Matrix-Control Skin Studio
status: final
sources:
  - _bmad-output/planning-artifacts/prds/prd-Matrix-Control-Skin-Studio-2026-10-15/prd.md
  - _bmad-output/planning-artifacts/prds/prd-Matrix-Control-Skin-Studio-2026-10-15/addendum.md
  - _bmad-output/planning-artifacts/briefs/brief-Matrix-Control-Skin-Studio-2026-10-14/brief.md
  - _bmad-output/brainstorming/brainstorm-skin-studio-outils-ux-2026-10-14/brainstorm-intent.md
  - docs/2026-10-14-Matrix-Control-Skin-Studio-Brief.md
  - _bmad-output/planning-artifacts/ux-designs/ux-Matrix-Control-Skin-Studio-2026-10-15/.working/extract-prd.md
  - _bmad-output/planning-artifacts/ux-designs/ux-Matrix-Control-Skin-Studio-2026-10-15/.working/extract-brief-brainstorm.md
  - _bmad-output/planning-artifacts/ux-designs/ux-Matrix-Control-Skin-Studio-2026-10-15/.working/ascii-chrome-simulations.md
  - _bmad-output/planning-artifacts/ux-designs/ux-Matrix-Control-Skin-Studio-2026-10-15/.memlog.md
updated: 2026-10-19
---

# Matrix-Control Skin Studio — Experience Spine

> Status: **final**. Paired with `DESIGN.md`. Spines (`DESIGN.md` + this file) win on conflict with any mock, wireframe, ASCII simulation, or import.  
> **Lot B (2026-10-19):** Photocraft/Photoshop chrome IA — no context strip; two tabbed sidebar zones; Object/State in top bar; Color square+hue picker. Lot A / Lot C out of this course.

## Foundation

Internal, single-operator, **desktop-first** browser editor for calibrating Matrix-Control skins. Not a second Matrix-Control host, not live in-plugin editing, not a full design-system or typography tool. End users never open Skin Studio. Possible later handoff to a small set of graphic-designer contributors is V2 / horizon — not MVP exit.

Core loop: see Figma-like GUI view → select Object type → choose State → map Property → Palette id → real-time preview → switch Skin without losing place → undo/redo → autosave + JSON import/export. Final aesthetic sign-off always happens in the real plugin after integration.

Aesthetic bar: GUI view matches the **current Figma mock** composition of Matrix-Control — readable rectangles, contours, Header / Body (Patch & Master) / Footer, recognizable widgets. **Not** a pixel-perfect JUCE clone. Chrome is a dark console (`DESIGN.md`); the mock is the bright focus.

Colour discipline: opaque `#RRGGBB` only. Hex edited only on Palette entries. Mappings bind Palette ids only. Type-level mappings only (no per-instance overrides). LED preview always fully-on. Patch/Master Duo accents via **Orchestrator zones on the mock**, not frozen into generic Object types. True overlays out.

v1 seed skins: `Black/Green`, `Cream/Green`, `Black/Duo`, `Cream/Duo`, `Monochrome`. Duo LED Palette entry baseline `#FFCC00` (calibratable).

## Information Architecture

| Region | Purpose |
|---|---|
| Top bar | Project ops, history, **Object**, **State**, Skin, Zoom |
| GUI view (canvas) | Interactive Matrix-Control mock — select, pan, zoom |
| Sidebar zone 1 | Tabs **`Color` \| `Palette`** (Color = square+hue+`#`/RGB; Palette = swatches) |
| Sidebar zone 2 | Tabs **`Skin` → `Mappings` → `Unbound`** (Unbound badge on tab) |

**Absent in MVP:** context strip; left layers tree; bottom chrome; left Palette rail; Auto Layout; overlays; named history panel; JSON Dev Mode; side-by-side compare. **Lot C** mock fidelity ↔ Matrix-Control is a separate course.

### Top bar (left → right)

`[New] [Import] [Export]` | `[Undo] [Redo]` | `Object: […]` | `State: […]` …… `Skin: [Black/Green ▾]` | `Zoom: [100% ▾]`

- **Object** and **State** live in the top bar (labels + controls). Empty = `—`; sticky Skin switch does not invent a selection.
- Right block: **Skin then Zoom**, fitted to ~260px (sidebar width) with a few px safety. Adapt Skin combo width only; **do not** change Zoom combo width. Skin = labeled **combo/dropdown**; scales to 15–20 skins. **Not** horizontal mode pills.
- Zoom label in chrome = **Zoom**; discrete steps match PRD UI Scale: `50%` / `75%` / `100%` / `125%` / `150%` / `175%` / `200%` (default `100%`). Local preference — never in JSON export.
- Export uses hard Unbound gate (see State Patterns).
- **No context strip** under the top bar.

### Sidebar zone 1 — Color | Palette

Real Photocraft-style tabs.

**Color tab**

- Photoshop grammar: SV square ≈ 200×200 + vertical hue strip; `#` (6 hex chars, no truncation) + `R:` `G:` `B:` on the same line to the right of `#`. No Hue/Sat/Val sliders.
- Commits only to selected Palette entry; micro-gestures coalesce for undo.

**Palette tab**

- Swatch CRUD list; select → Color tab edits that entry.

### Sidebar zone 2 — Skin → Mappings → Unbound

Real tabs in that order. **No** redundant panel titles above content.

**Skin tab**

- Buttons: **`Create`**, **`Duplicate`**, **`Delete`** (not “Create Skin”, not “…”). Rename field may remain as a non-button control.
- Do **not** show the sentence “Type-level only — no per-instance colour overrides.”

**Mappings tab**

- Mapping rows for the active Object type + State (Property → Palette id).
- Object/State controls are **not** duplicated here (they live in the top bar).
- Canvas sync highlights the corresponding mapping row; does **not** reset State.

**Unbound tab**

- Clickable list + empty success copy. **Count badge on the Unbound tab** remains visible when another tab is active. Export stays disabled while count > 0. No soft allow.

Zones are separated by a marked gutter; drag splitter resizes both; blue line on resize hover. Heights persist in prefs.

### Visual references

Canonical chrome mock [`mockups/editor-main.html`](mockups/editor-main.html) is **stale vs Lot B** (pre-Lot-B composition). ASCII: [`.working/ascii-chrome-simulations.md`](.working/ascii-chrome-simulations.md).

| Coverage | Surfaces |
|---|---|
| **Mocked (pre-Lot-B)** | Editor main; export blocked; delete Palette modal |
| **Spine-only** | Lot B tabbed chrome; Skin Create/Duplicate/Delete; All required mappings bound empty Unbound; import `formatVersion` error; first-open seed |

## Voice and Tone

Chrome microcopy is English, short, operational — a calibration console, not a playful illustration app. Brand aesthetic posture lives in `DESIGN.md`.

| Situation | Copy |
|---|---|
| Unbound count (n > 0) | `{n} unbound` |
| Unbound list row | `{Object type} · {Property}` [ASSUMPTION separator middot] |
| Empty unbound (success) | `All required mappings bound` |
| Export disabled (tooltip / title) | `Export blocked — {n} unbound mapping(s)` |
| Export enabled | `Export` |
| Import fail (unknown/newer formatVersion) | `Import failed — this file uses an unsupported format version.` |
| Import replace-all confirm | `Replace the current project with this file? Unsaved browser state will be overwritten.` [ASSUMPTION exact wording] |
| Delete Skin confirm | `Delete skin “{name}”? This cannot be undone.` |
| Delete referenced Palette id | Title: `Delete colour “{name}”?` Body: `{n} mapping(s) will become Unbound:` + list. Primary: `Delete and unbind`. Cancel: `Cancel`. |
| Mapping unbound marker | `Unbound` |
| First open / no prior project | Seeded skins + base palette ready to calibrate — no blocking empty-state wizard [ASSUMPTION]. |

| Do | Don't |
|---|---|
| “Export blocked — 3 unbound mapping(s)” | “Oops! Almost ready 🎉” |
| “All required mappings bound” | “You're all set!” |
| “Import failed — unsupported format version.” | Silent partial load |
| Skin names exactly as product: `Black/Duo` | `Two-tone`, `Split` |

## Component Patterns

Behavioral rules. Visual specs: `DESIGN.md` → Components (`{components.*}`).

| Component | Use | Behavioral rules |
|---|---|---|
| `{components.top-bar}` | Global ops | New / Import / Export / Undo / Redo / **Object** / **State** / spacer / **Skin then Zoom**. Skin+Zoom ≈ 260px budget. No context strip. |
| `{components.canvas-selection}` | GUI view | Click selects Object type + highlights Mapping row; does **not** reset State. |
| `{components.sidebar-splitter}` | Between two zones | Horizontal drag; thick gutter; blue accent line on hover/drag. Both zones resizable; heights in prefs. |
| `{components.sidebar-tab}` | Zone tabs | Color\|Palette and Skin\|Mappings\|Unbound. Photocraft inactive/active. Unbound tab badge when count > 0. Focus ring (NFR-8). |
| `{components.picker-pane}` | Color tab | Square + hue + `#`/RGB text. Commits only to selected Palette entry. Micro-gestures coalesce for undo. |
| `{components.palette-swatch}` | Palette tab | Select → Color tab edits that entry. Delete may open confirm if referenced. |
| `{components.mapping-row}` | Property → Palette id | Commit Palette id only — never free hex. Unbound rows clickable → focus bind path. |
| `{components.unbound-pane}` | Unbound tab | List + tab badge; click row jumps to Object type + Mapping row [ASSUMPTION also sets State if encoded in list]. |
| `{components.export-disabled}` | Hard gate | Disabled while unbound count > 0; no click-to-reject soft path in MVP. |
| `{components.modal-confirm}` | Destructive | Skin delete always; referenced Palette delete lists n→Unbound then apply; Import replace-all. Visual: [`mockups/delete-palette-modal.html`](mockups/delete-palette-modal.html). |
| `{components.pulse-highlight}` | Mapping change cue | Discrete outline pulse 1–2× ~400ms with chrome accent `{colors.pulse-outline}`. |

## State Patterns

| State | Treatment |
|---|---|
| **Sticky context on Skin change** | Preserve Object type, State, pan/zoom. Do **not** invent a selection if none existed (empty Object/State stay empty). |
| **Canvas ↔ Sidebar sync** | Canvas click → Object type + scroll/highlight Mapping row; State unchanged. Sidebar Object type → outline mock region when present. |
| **Mapping change** | Preview paints immediately; pulse affected mock region(s). |
| **Unbound > 0** | Unbound tab list + **tab badge**; Export disabled (`{components.export-disabled}`). Visual: [`mockups/export-blocked.html`](mockups/export-blocked.html). |
| **Unbound = 0** | Empty success copy; badge clear; Export enabled. Spine-only (no dedicated mock). |
| **No Palette entry selected** | Color tab shows last values or idle wells but does not commit hex until a Palette row is selected [ASSUMPTION idle wells]. |
| **LED preview** | Fully-on Palette colour; no intensity/dim slider. |
| **Palette hex edit** | All Properties mapped to that id update on next preview paint. |
| **Delete Skin** | Always confirm; cancel = no change. |
| **Delete referenced Palette id** | Confirm **first** listing n mappings that will become Unbound, then apply (no silent hex substitute). Visual: [`mockups/delete-palette-modal.html`](mockups/delete-palette-modal.html). |
| **Import unknown/newer formatVersion** | Fail closed with clear error. |
| **MVP Import success path** | **[ASSUMPTION]** Replace-all after strong confirm; backup/merge = Soon (FR-28). |
| **Autosave / cold reopen** | Browser local persistence; reopen restores last project (Figma-like). |
| **First open (no prior project)** | **[ASSUMPTION]** Seed v1 skins + base palette ready to calibrate. |
| **Undo / Redo** | Restores project JSON mutations + Object type / State selection. Does **not** reverse Zoom or pan. |
| **Coalesced undo** | Rapid picker / Palette hex micro-gestures collapse to one step. **[ASSUMPTION]** coalesce window ~300–500 ms idle or until pointer-up. Discrete commits (rename, mapping id change, Skin CRUD) stay separate. |
| **Focus (chrome)** | Visible `{colors.focus-ring}` on focused controls; reading order top bar → sidebar → canvas when tabbing [ASSUMPTION exact order]. |

## Interaction Primitives

- **Select:** canvas click or top-bar Object control.
- **State:** top-bar State control; changing State refreshes Property mappings + mock paint for that Object type.
- **Map:** Mapping row → Palette id only.
- **Pan:** click-drag on GUI view; arrow keys when canvas focused.
- **Zoom:** discrete combo steps only (local pref).
- **Skin switch:** top-bar combo; sticky context applies.
- **Pulse:** outline only; chrome accent; 1–2× ~400ms.
- **Banned in MVP:** free hex on Mapping path; soft Export with Unbound; left rail / layers / bottom chrome; Auto Layout; true overlay editing; inventing Collect inventory in UI as product truth.

## Accessibility Floor

Internal tool floor — not a WCAG productization pass.

- Keyboard: arrow keys pan when GUI view focused; all top-bar and sidebar controls focusable in reading order.
- Visible focus ring using `{colors.focus-ring}` / accent family.
- Disabled Export remains in tab order but non-activating (or skipped consistently — pick one at implementation) [ASSUMPTION].
- Contrast advisories (FR-27) = **Soon**, not MVP exit.
- Keyboard-only power modes = V2 parked.

## Inspiration & Anti-patterns

- **Lifted from Figma:** selection outline; type = edit once for all instances; palette ≈ variables; skin switch ≈ mode; click-to-map; reopen last file.
- **Lifted from Photoshop:** SV square + vertical hue + numeric `#`/RGB; constrained Color tab above Palette.
- **Lifted from Photocraft:** tabbed inspector zones; marked gutters + blue resize hover; inactive grey / active light tabs.
- **Lifted from DAW consoles:** dark dense chrome; bright content stage.
- **Rejected — Soft export with warnings:** hard Unbound gate only for MVP.
- **Rejected — Horizontal Skin pills:** breaks at 15–20 skins; combo/dropdown instead.
- **Rejected — JUCE pixel clone / Matrix-Control host:** mock fidelity is Figma composition, not plugin reimplementation.
- **Rejected — Auto Layout, vectors, effects, true overlays, free hex mappings.**

## Responsive & Platform

Desktop browser first. Local persistence + file import/export. Not native shell, not plugin-embedded, not mobile-first, not cloud multi-user.

**Soon (intent only):** soft narrow layout (e.g. inspector drawer) without expanding MVP desktop chrome. Not an MVP exit criterion.

## Key Flows

### UJ-1 — Export gate (Guillaume calibrates and exports)

**Protagonist:** Guillaume, single operator, preparing five v1 skins before plugin alpha.  
**Climax:** Export enables only when required mappings are bound.

1. Opens Skin Studio → last project restores (or seeded v1 skins + base palette if none) [ASSUMPTION first-open seed].
2. GUI view shows Figma-like Matrix-Control mock; chrome stays dark.
3. Clicks a control region on the mock → Object type selected; Mapping row highlights; State unchanged.
4. Chooses State if needed; binds Unbound properties to Palette ids via mapping rows + picker (hex only on Palette entries).
5. Edits Duo LED Palette entry (baseline `#FFCC00`); LEDs preview fully-on; Patch/Master accents show via Orchestrator zones on the mock.
6. Switches Skin via right combo → Object type, State, pan/zoom preserved (sticky context); top-bar Object/State/Skin/Zoom prove place was kept.
7. Mapping change pulses affected mock regions (discrete outline).
8. Unbound tab badge / list still show gaps → Export remains disabled (`{components.export-disabled}`). Visual: [`mockups/export-blocked.html`](mockups/export-blocked.html).
9. Clears remaining unbound rows until Unbound tab shows `All required mappings bound` (spine-only — no dedicated empty-Unbound mock).
10. **Climax:** Export enables; Guillaume exports JSON. Unbound never soft-allowed.

**Failure path:** Tries Export while unbound remain → control stays disabled; Unbound tab badge + list show why ([`mockups/export-blocked.html`](mockups/export-blocked.html)); maps gaps and retries. Import of newer/unknown `formatVersion` → fail closed with clear error (spine-only; Zoom/pan prefs unchanged).

### UJ-2 — Sticky Skin switch (Alex explores looks)

**Protagonist:** Alex, graphic designer (future / light path — not MVP staffing assumption). Helps compare looks without fighting the chrome.  
**Climax:** Skin switch feels instantaneous — sticky context holds place; Duo accents stay zone-orchestrated on the mock (side-by-side compare is Soon, not this journey).

1. Opens a shared project JSON via Import → strong replace-all confirm [ASSUMPTION MVP import].
2. Uses Skin combo (right) to move among `Black/Green` → `Cream/Duo` without hunting pills.
3. Selects Object type from canvas; State stays put while checking Hover vs Normal mappings.
4. On `Black/Duo` / `Cream/Duo`, Patch/Master accents read via Orchestrator zones on the mock — not frozen into generic Object types.
5. **Climax:** Skin switch keeps the same Object type, State, Zoom, and pan; top-bar controls prove place was kept; no invented selection when none existed.
6. May Create / Duplicate / Delete via Skin tab; Delete Skin always confirms. Does not need layers, compare mode, or where-used (Soon).

**Failure path:** Deletes a Palette colour still in use → confirm lists n mappings that will become Unbound ([`mockups/delete-palette-modal.html`](mockups/delete-palette-modal.html)) → after confirm, Export disables until rebound. Cancels delete → no change.

## Horizon

Intent only — **not** MVP exit criteria.

### Soon (FR-22…FR-28)

- **FR-22:** Where-used for a Palette id (flash/highlight mock regions) + rename/refactor with reference updates.
- **FR-23:** Side-by-side compare (at least Black/Green vs Cream/Green; Duo accent checks).
- **FR-24:** Replace-colour Palette id X → Y within a Skin (or scoped set).
- **FR-25:** Search Object types/Properties + zoom GUI view to selection.
- **FR-26:** Draft vs ready for Skins/packages (exact Ready export policy when promoted).
- **FR-27:** Simple contrast advisories (not full WCAG productization).
- **FR-28:** Collect re-import merges / re-maps (safer than replace-all).
- Paint-bucket accent sweeps; optional soft narrow layout (FR-12 NOTE).

### V2 / parked

Layers tree; named history panel; JSON/Dev Mode inspect; comments; object×property matrix; alias tokens; contributor tooling; keyboard-only power modes; optional left Palette rail; external contributors shipping non-Black/Cream-derived Skins once Matrix-Control import is stable.  
*(Note: denser Photocraft **grammar** for chrome shipped as **Lot B** 2026-10-19 — not a promotion of Epic 6 / Lot C.)*

## Open for architecture / Collect

UX does **not** decide these:

| Topic | Owner |
|---|---|
| JSON packing (one global vs one file per Skin) | Architecture after Collect |
| Web stack (vanilla vs light framework) | Architecture |
| Collect inventory home (`docs/` vs shared MC note) | Collect / ops |
| Exact Object types / Properties / States inventory | Collect |
| Alpha/darken/dim → solid opaque RGB candidates | Collect |
| Black/Green & Cream/Green Header LED greens confirmation | Collect |
| Tool hosting (mirror / submodule into Matrix-Control) | Architecture / ops |
| Final JSON field names | Architecture |
| Orchestrator zone rules storage | Architecture / MC |
| Exact coalesce timing (with UX assumption 300–500 ms) | UX + Architecture |
