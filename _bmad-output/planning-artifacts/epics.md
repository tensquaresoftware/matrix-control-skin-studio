---
status: final
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-Matrix-Control-Skin-Studio-2026-10-15/prd.md
  - _bmad-output/planning-artifacts/prds/prd-Matrix-Control-Skin-Studio-2026-10-15/addendum.md
  - _bmad-output/planning-artifacts/architecture/architecture-Matrix-Control-Skin-Studio-2026-10-15/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-Matrix-Control-Skin-Studio-2026-10-15/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-Matrix-Control-Skin-Studio-2026-10-15/EXPERIENCE.md
  - _bmad-output/planning-artifacts/briefs/brief-Matrix-Control-Skin-Studio-2026-10-14/brief.md
---

# Matrix-Control-Skin-Studio - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Matrix-Control-Skin-Studio, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**MVP (buildable exit criteria):**

FR-1: Operator can bind Properties only by selecting a Palette id; hex appears only when editing a Palette entry. Persisted Mapping values are Palette ids (or Unbound), never raw hex. Changing a Palette entry’s hex updates every Property mapped to that id on the next preview paint.

FR-2: When the operator switches Skin via the Top bar, Skin Studio preserves Object type selection, State, and pan/zoom (including UI Scale / Zoom). Sticky context does not invent a selection if none existed.

FR-3: Skin Studio surfaces Unbound required Mapping count (and enough detail to locate gaps). JSON export is blocked while any required Mapping for the export target remains Unbound. Until Collect marks optionals, all inventory Properties are required. Interim gate surface = session-loaded inventory (seed-placeholder OK).

FR-4: Rapid consecutive micro-edits on the colour picker / Palette hex controls coalesce into a single undo step. Discrete commits (Skin rename, Mapping change to a different Palette id, Skin CRUD) remain separate undo steps. Coalesce ≈ 400 ms idle or pointer-up (architecture pin).

FR-5: Selecting on the canvas focuses the corresponding Mapping section in the Sidebar; changing Mapping context in the Sidebar reflects selection on the canvas. Mapping change pulses / briefly highlights affected mock region(s). Full where-used browse is Soon (FR-22).

FR-6: Mappings apply per Object type × State × Property only — no per-instance colour overrides. Multiple mock instances of the same Object type always share Mappings.

FR-7: LED Properties always render at their mapped fully-on Palette colour in Skin Studio. No intensity slider or dimmed LED preview mode.

FR-8: Skin Studio presents GUI view (canvas), right Sidebar, and thin Top bar. No left layers tree and no bottom chrome in MVP.

FR-9: Top bar includes a Skin switcher listing available Skins (UX refinement: labeled combo/dropdown right-anchored — not PRD segmented pills). Switch triggers Sticky context (FR-2).

FR-10: Palette swatches, picker, and hex editing live in the right Sidebar in MVP. No left Palette rail in MVP.

FR-11: Operator can set Zoom (UI Scale) to discrete steps `50%`…`200%` (default `100%`) and pan/scroll the GUI view on X-Y (click-drag and arrow keys). Pan/Zoom persist as local prefs; JSON export never includes them.

FR-12: Narrow-viewport inspector drawer — deferred; not an MVP desktop requirement. (Intent note for Soon soft layout only.)

FR-13: Operator can create, rename, recolour (hex/picker), and delete Palette entries. New entries receive a stable Palette id. Deleting a still-referenced Palette id leaves those Mappings Unbound (not silent hex substitute). Colours are opaque `#RRGGBB` only.

FR-14: Operator can create, rename, duplicate, and delete Skins. Duplicate copies Mappings into a new Skin identity. Delete always shows confirmation; cancel leaves Skin unchanged.

FR-15: Skin Studio supports calibration of v1 display names: `Black/Green`, `Cream/Green`, `Black/Duo`, `Cream/Duo`, `Monochrome`. Duo Patch/Master accents simulated as Orchestrator zones on the mock (not frozen into generic Object types). Rejected names (`Black/Two-tone`, `Cream/Two-tone`, `Split`) are not used.

FR-16: Duo Skins use a named Palette entry with baseline hex `#FFCC00` for Header LEDs. Entry remains calibratable. Mappings reference that Palette id, not a raw `#FFCC00` literal on the Mapping path.

FR-17: Operator can start from a Collect / Matrix-Control-derived inventory that seeds Palette and Object types for `Black/Green` and `Cream/Green`. Exact inventory location open; MVP may ship `source: "seed-placeholder"` until Collect replaces it. Do not invent ObjectTypes outside the seed file.

FR-18: Operator can select an Object type (canvas click or Sidebar) and choose a State, then edit Property → Palette id Mappings. Changing State refreshes Property Mappings shown and mock paint for that Object type.

FR-19: Palette and Mapping edits update the GUI view without an explicit refresh action (same interaction turn).

FR-20: Operator can undo and redo edits (subject to FR-4 coalescing). Undo restores project JSON mutations + Object-type / State selection. Undo does not reverse Zoom or pan. Redo until a new branch edit.

FR-21: Project state autosaves in the browser. Operator can export and import JSON files (JSON only; no mandatory Markdown). Export obeys FR-3. Import is version-aware; unknown/newer `formatVersion` fails closed. MVP import = replace-all after strong confirm. Packing MVP = single project JSON document (architecture AD-5).

**Soon — intent-only (not MVP exit criteria; promote before implementation):**

FR-22: Where-used for a Palette id (flash/highlight mock regions) + rename/refactor with reference updates.

FR-23: Side-by-side compare of two Skins (at least Black/Green vs Cream/Green; Duo accent checks).

FR-24: Replace-colour Palette id X → Y for Mappings within a Skin (or scoped set).

FR-25: Search Object types/Properties and zoom GUI view to selection.

FR-26: Skins (or project packages) marked draft vs ready (additional export policy layer on FR-3 when promoted).

FR-27: Simple contrast advisories (not full WCAG productization).

FR-28: Collect re-import merges / re-maps rather than wiping operator work by default.

**V2 / parked (do not pull into MVP without course correction):** layers tree; named history panel; JSON/Dev Mode; comments; object×property matrix; alias tokens; contributor tooling; keyboard-only power modes; optional left Palette rail; external contributor Skin shipping.  
*(Lot B 2026-10-19 delivered denser Photocraft **chrome grammar** via sprint change proposal — not a promotion of Epic 6 / Lot C.)*

### NonFunctional Requirements

NFR-1: Platform — desktop-first evergreen browser SPA (Chromium / Safari / Firefox); mobile not a v1 target; no native shell, plugin-embedded UI, or cloud multi-user in MVP.

NFR-2: Persistence — single-operator local browser storage (`localStorage`) sufficient for autosave; no cloud sync in MVP. Prefs (Zoom/pan/sidebar heights) stored separately from project export payload.

NFR-3: Colour model — opaque `#RRGGBB` only in the studio; true-transparency overlays out of editor; uppercase hex preferred on write, case-insensitive on read.

NFR-4: Export contract — JSON file only with `formatVersion` from day one (writer pin `1`); UI Scale / pan / sidebar layout never appear in export JSON; fail closed on unknown/newer `formatVersion`.

NFR-5: Project boundary — Skin Studio BMad repo separate from Matrix-Control; no C++ Look/Orchestrator implementation from this repo’s MVP; handoff is downloaded JSON as specification.

NFR-6: Aesthetic fidelity — GUI view matches current Figma Matrix-Control composition (readable, not pixel-perfect JUCE clone); final visual sign-off remains in the real plugin.

NFR-7: Performance / lightness — tool effort must not become the sole blocker of the Matrix-Control alpha campaign (qualitative SM-6); prefer boring/simple stack (architecture pins Vite + TS + vanilla DOM).

NFR-8: Accessibility floor — keyboard pan (arrows when canvas focused); focusable chrome/sidebar controls with visible focus ring; contrast advisories (FR-27) Soon only — not MVP WCAG productization.

NFR-9: UI language — English chrome microcopy; product skin names kept as product strings (`Black/Duo`, etc.).

NFR-10: Hosting — static Vite SPA (local or static file host); no server API or accounts in MVP.

### Additional Requirements

**Architecture decisions binding implementation (AD-1…AD-16):**

- AD-1: Document-centric single-writer store — only `model/store` mutates `ProjectDocument` and `SessionUiState`; UI never patches fields in place. Mutation path: UI → `history.execute` → `store.apply`.
- AD-2: Stack pin — Vite `8.3.4` + TypeScript `7.0.2` + vanilla DOM/CSS; no React/Preact/Lit/UI framework in MVP. Node engines `^20.19.0 || >=22.12.0`.
- AD-3: Dependency direction — `model/` and `history/` must not import UI shells; `persist/` and `io/` depend on `model/` only; UI may call `history` undo/redo/execute only — never `store.apply` directly.
- AD-4: Semantic data model — palette/skins as ordered arrays; mappings uniqueness on `(objectTypeId, stateId, propertyId)`; mappings store `paletteEntryId | null` only; final JSON field names freeze post-Collect; prefer `paletteEntryId` over addendum `paletteColorId`.
- AD-5: MVP packing — one JSON document = whole Project for export/import; per-skin multi-file packing Deferred.
- AD-6: `SessionUiState` holds `selectedObjectTypeId`, `selectedStateId`, `activeSkinId` only; Skin switch changes `activeSkinId` only; Zoom/pan are prefs (not session).
- AD-7: Coalesce picker/Palette hex at **400 ms idle or pointer-up**; Zoom/pan never undo steps.
- AD-8: Autosave key `skin-studio:project` = envelope `{ project, session }`; prefs key `skin-studio:prefs` = `{ zoomStep, panXY, sidebarPaneHeights }` with Lot B keys `colorPalette` / `skinMappingsUnbound` (legacy three-key → defaults); first open / New after confirm → seed.
- AD-9: Export disabled while `unboundCount > 0`; export target MVP = all skins; import replace-all after confirm; `io/` asks `model` for unbound count.
- AD-10: Sole `deriveUnbound` in `model/`; required slots = every Inventory Property for each Skin × ObjectType × State in **loaded** inventory; MVP may ship one seed inventory `source: "seed-placeholder"` — builders must not invent ObjectTypes outside that file.
- AD-11: UX chrome contracts (**Lot B 2026-10-19**) — Top bar `[New][Import][Export]` · undo/redo · `Object` · `State` · spacer · `Skin` then `Zoom` (~260px budget); no context strip; sidebar two zones Color\|Palette and Skin→Mappings→Unbound (Unbound tab badge); Color = square+hue+`#`/RGB; Skin buttons Create/Duplicate/Delete; no layers/bottom chrome/left rail.
- AD-12: Hosting envelope — static SPA; Matrix-Control mirror/submodule optional later ops.
- AD-13: Orchestrator zone accents simulated in `canvas/` mock layout metadata only; inventory Object types stay generic; LED fully-on paint.
- AD-14: Runtime collection shapes fixed to AD-4 arrays/nested inventory — no alternate topologies without new AD.
- AD-15: Unbound math and colour resolve owned by `model/` only; canvas never reads hex off a Mapping.
- AD-16: Cross-shell contracts — canvas click selects Object type without resetting State; Mapping change → pulse-outline 1–2× ~400 ms; Unbound row click jumps to Object type + Mapping row; delete Skin always confirm; delete referenced Palette confirm lists n→Unbound; picker commits only with selected Palette entry; New confirms then seed.

**Starter / structural seed (Epic 1 Story 1 impact):**

- Greenfield scaffold: `index.html`, `package.json`, `vite.config.ts`, `src/main.ts`, modules `model/`, `history/`, `persist/`, `io/`, `seed/`, `chrome/`, `canvas/`, `sidebar/`, `styles/`, `public/`.

**Collect-blocked (mark stories; do not invent inventory to fill ACs):**

- Definitive JSON schema field freeze; exact Object types / Properties / States for SM-1 precise slot enumeration; optional Property flags; Black/Green & Cream/Green Header LED green confirmation; alpha/darken/dim → opaque RGB candidates; Collect inventory home location.

**Deferred / Soon (intent labels only in epics):**

- FR-22…FR-28; per-skin packing; IndexedDB; automated test framework/CI (not pinned); narrow drawer / left Palette rail.

### UX Design Requirements

UX-DR1: Implement DESIGN.md chrome design tokens as CSS variables in `styles/` — surfaces, borders, text, accent, warning, destructive, focus-ring, selection/pulse outlines, canvas-veil, scrollbar tokens (exact hex set in DESIGN.md frontmatter).

UX-DR2: Load IBM Plex Sans + IBM Plex Mono; apply typography scale (`ui`, `ui-strong`, `label`, `title-bar`, `mono`, `mono-sm`, `context`) and spacing/radius tokens from DESIGN.md.

UX-DR3: Desktop chrome layout (**Lot B**) — Top bar 40px + body (canvas main + Sidebar default **260px**). **No** context strip. No left rail, layers tree, or bottom chrome.

UX-DR4: Top bar anatomy left→right: `[New][Import][Export]` · undo/redo · `Object` · `State` · spacer · `Skin` then `Zoom` (Skin+Zoom ≈ 260px budget; Zoom combo width unchanged; Skin combo width adapted; scrollable Skin menu for 15–20 skins — not horizontal pills). Export uses enabled accent when unbound=0; `{components.export-disabled}` when unbound>0.

UX-DR5: Object and State live in the top bar (labels + controls); empty Object/State shows explicit empty glyph (e.g. `—`); sticky Skin switch does not invent a selection. No separate context-strip band.

UX-DR6: Sidebar **two** stacked zones with Photocraft gutters + horizontal splitter (blue accent on resize hover) — (1) tabs `Color` \| `Palette`, (2) tabs `Skin` → `Mappings` → `Unbound` with Unbound count badge on the tab; both zones resizable; heights persist in prefs (`colorPalette` / `skinMappingsUnbound`).

UX-DR7: Color tab — SV square ≈200×200 + vertical hue + `#` (6 hex chars, no truncation) + `R:` `G:` `B:` on the same line; no HSV sliders; commits hex only to selected Palette entry; never writes free hex into a Mapping slot.

UX-DR8: Palette swatch rows — chip + optional constant name + hex; selected ring accent; Add/Delete CRUD; referenced delete opens modal-confirm listing n mappings that will become Unbound.

UX-DR9: Mapping rows — Property → Palette id only; bound shows swatch+id; Unbound shows warning marker + `Unbound` label; selected row accent-muted from canvas sync; click Unbound focuses bind path.

UX-DR10: Unbound tab — clickable list (`{Object type} · {Property}`) + **warning count badge on the Unbound tab** (visible when another tab is active); empty success copy `All required mappings bound`; row click jumps to Object type + Mapping row (and State if encoded).

UX-DR11: Modal confirm pattern for Delete Skin, Delete referenced Palette, Import replace-all, and New (seed replace) — scrim + raised surface; destructive primary where applicable; one modal deep.

UX-DR12: Canvas selection outline (2px accent, transparent fill) + Mapping-change pulse-highlight (`pulse-outline`, 1–2× ~400ms ease-out).

UX-DR13: English operational microcopy per EXPERIENCE.md Voice table (unbound count, export blocked tooltip, import fail, import confirm, delete Skin, delete colour, empty unbound success).

UX-DR14: GUI view mock — Figma-like Matrix-Control composition (Header / Body Patch&Master / Footer); Orchestrator zones for Duo accents in canvas metadata; LED fully-on; placeholder Object-type regions only until Collect — do not invent inventory as product truth.

UX-DR15: Accessibility floor — visible `{colors.focus-ring}` on chrome controls; reading-order tabbing; arrow-key pan when canvas focused; disabled Export non-activating.

UX-DR16: Elevation/shapes — tonal stacking (no heavy multi-shadow cards); tight radii (controls 4px, swatches 2px, modals 6px); no pill Skin chips; outline-only selection/pulse (no glow blobs).

### FR Coverage Map

FR-1: Epic 4 — Palette-id-only mappings
FR-2: Epic 2 — Sticky context across Skin switch
FR-3: Epic 5 — Unbound signal and hard export gate
FR-4: Epic 5 — Coalesced undo for picker micro-gestures
FR-5: Epic 4 — Bidirectional canvas ↔ Sidebar selection sync
FR-6: Epic 4 — Type-level mappings only
FR-7: Epic 4 — LED fully-on preview
FR-8: Epic 2 — MVP chrome layout
FR-9: Epic 2 — Skin switcher (UX combo, not PRD pills)
FR-10: Epic 2 — Right-side Palette and picker only
FR-11: Epic 2 — Zoom and pan/scroll local prefs
FR-12: Epic 6 — Narrow-viewport drawer deferred (Soon / not MVP exit)
FR-13: Epic 3 — Palette CRUD
FR-14: Epic 3 — Skins CRUD
FR-15: Epic 3 — v1 Skin set
FR-16: Epic 3 — Duo LED yellow Palette entry
FR-17: Epic 1 — Bootstrap from inventory / seed
FR-18: Epic 4 — Object selection and States
FR-19: Epic 4 — Real-time preview
FR-20: Epic 5 — Undo / redo
FR-21: Epic 1 (autosave envelope foundation) + Epic 5 (import/export complete)
FR-22: Epic 6 — Where-used and rename refactor (Soon intent-only)
FR-23: Epic 6 — Side-by-side compare (Soon intent-only)
FR-24: Epic 6 — Replace-colour (Soon intent-only)
FR-25: Epic 6 — Search and zoom-to-selection (Soon intent-only)
FR-26: Epic 6 — Draft vs ready (Soon intent-only)
FR-27: Epic 6 — Contrast hints (Soon intent-only)
FR-28: Epic 6 — Collect import merge (Soon intent-only)

## Epic List

### Epic 1: Skin Studio Opens with a Seeded Project
Operator can launch the SPA, load a seeded v1 project (five skins, base palette, seed-placeholder inventory), and restore the last autosaved envelope on reopen.
**FRs covered:** FR-17, FR-21 (autosave / reopen foundation)

### Epic 2: Navigate the Calibration Console
Operator works in the locked desktop chrome — top bar, context strip, canvas + four-pane sidebar — with discrete Zoom, pan, and a right-anchored Skin combo that preserves sticky context.
**FRs covered:** FR-2, FR-8, FR-9, FR-10, FR-11

### Epic 3: Manage Palette and Skins
Operator can create, rename, recolour, and delete Palette entries; create, rename, duplicate, and delete Skins; calibrate the five v1 display names including the Duo LED `#FFCC00` Palette entry.
**FRs covered:** FR-13, FR-14, FR-15, FR-16

### Epic 4: Calibrate Mappings with Live Preview
Operator selects Object type and State, binds Properties to Palette ids only, sees live mock updates with LED fully-on and Duo Orchestrator zones, and keeps canvas ↔ sidebar selection in sync (with pulse on mapping change).
**FRs covered:** FR-1, FR-5, FR-6, FR-7, FR-18, FR-19

### Epic 5: Undo Safely and Export a Complete Package
Operator undoes/redoes with coalesced picker edits, sees Unbound count derived from the loaded inventory, and exports a single project JSON only when Unbound is zero; import is replace-all, fail-closed on unknown formatVersion.
**FRs covered:** FR-3, FR-4, FR-20, FR-21 (import/export complete)

### Epic 6: Soon — Post-MVP Calibration Power Tools (Intent-Only)
Intent labels for FR-22…FR-28 and FR-12 soft layout — **not** MVP exit criteria; promote with full consequences before implementation.
**FRs covered:** FR-12, FR-22, FR-23, FR-24, FR-25, FR-26, FR-27, FR-28

## Epic 1: Skin Studio Opens with a Seeded Project

Operator can launch the SPA, load a seeded v1 project (five skins, base palette, seed-placeholder inventory), and restore the last autosaved envelope on reopen.

### Story 1.1: Scaffold Vite TypeScript SPA

As a Skin Studio operator,
I want a Vite + TypeScript vanilla SPA with the architecture module folders,
So that Skin Studio has a buildable desktop shell to extend.

**Acceptance Criteria:**

**Given** a clean repo checkout
**When** I install dependencies and run the Vite dev server
**Then** the app boots in a desktop browser without a UI framework (no React/Preact/Lit)
**And** pins match architecture: Vite `8.3.4`, TypeScript `7.0.2`, Node engines per AD-2
**And** `src/` contains modules `model/`, `history/`, `persist/`, `io/`, `seed/`, `chrome/`, `canvas/`, `sidebar/`, `styles/` (may be stub entry points)
**And** `vite.config.ts` and `index.html` exist at project root

### Story 1.2: Single-Writer Project Store

As a Skin Studio operator,
I want project and session state held in a single-writer store,
So that later chrome and mapping edits cannot diverge into competing copies.

**Acceptance Criteria:**

**Given** the scaffold from 1.1
**When** the app initializes the store
**Then** only `model/store` may mutate `ProjectDocument` and `SessionUiState` (AD-1)
**And** `ProjectDocument` semantics include `formatVersion` (writer pin `1`), ordered `palette[]`, ordered `skins[]`, and `inventory` with nested objectTypes/states/properties (AD-4, AD-14)
**And** `SessionUiState` holds only `selectedObjectTypeId`, `selectedStateId`, `activeSkinId` (AD-6)
**And** Mapping values are typed as `paletteEntryId | null` — never raw hex (FR-1 foundation)

### Story 1.3: Seed v1 Skins, Palette, and Placeholder Inventory

As a Skin Studio operator,
I want a seed project with the five v1 skins, a base palette including Duo LED yellow, and a marked placeholder inventory,
So that I can start calibration before Collect delivers the real inventory.

**Acceptance Criteria:**

**Given** an empty store / first seed load
**When** the seed is applied
**Then** skins exist with display names `Black/Green`, `Cream/Green`, `Black/Duo`, `Cream/Duo`, `Monochrome` only (FR-15) — not rejected names
**And** the palette includes a Duo LED yellow entry whose default hex is `#FFCC00` (FR-16)
**And** inventory is loaded from a single seed file marked `source: "seed-placeholder"` (AD-10, FR-17)
**And** no ObjectType/Property/State is invented in UI code outside that seed file
**And** Green skins may carry bootstrap mappings from seed notes when present — still via the seed file, not ad hoc UI invention

### Story 1.4: Autosave Envelope and Cold Reopen

As a Skin Studio operator,
I want the project and session autosaved in the browser and restored on reopen,
So that closing the tab does not wipe my calibration work.

**Acceptance Criteria:**

**Given** a seeded or edited project in the store
**When** the document or session changes
**Then** `localStorage` key `skin-studio:project` stores envelope `{ project, session }` (AD-8, FR-21)
**And** prefs key `skin-studio:prefs` exists separately for Zoom/pan/sidebar heights and is never mixed into the project export payload shape
**When** I close and reopen the same origin/profile
**Then** the last envelope restores into the store
**And** `formatVersion` remains writer pin `1` on the project document

### Story 1.5: First Open and New Load Seed

As a Skin Studio operator,
I want first open (no prior project) and New (after confirm) to load the seed project,
So that I always start from a known v1 baseline.

**Acceptance Criteria:**

**Given** no prior `skin-studio:project` envelope
**When** I open Skin Studio
**Then** the seed project + default session load without a blocking empty-state wizard (FR-17, EXPERIENCE first-open)
**Given** an existing project
**When** I choose New and confirm
**Then** the store is replaced with the seed project (AD-16)
**And** cancel leaves the current project unchanged
**And** New confirm uses English operational microcopy (UX-DR13 pattern)

## Epic 2: Navigate the Calibration Console

Operator works in the locked desktop chrome — top bar, canvas + sidebar — with discrete Zoom, pan, and a right-anchored Skin combo that preserves sticky context.

> **Lot B (2026-10-19) supersession:** Ongoing chrome SSOT is DESIGN.md / EXPERIENCE.md / AD-11 as updated by sprint-change-proposal-2026-10-19 (260px, no context strip, two tabbed zones, Photocraft picker, Object/State in top bar). Historical Stories 2.1–2.5 remain **done**; do not reopen this epic. Implement Lot B via story `lot-b-photocraft-chrome`.

### Story 2.1: Design Tokens and Typography

As a Skin Studio operator,
I want chrome styled with DESIGN.md tokens and IBM Plex fonts,
So that the calibration console stays dark and quiet while the mock stays readable.

**Acceptance Criteria:**

**Given** Epic 1 scaffold
**When** styles load
**Then** CSS variables cover DESIGN.md color, spacing, radius, and component token roles (UX-DR1, UX-DR16)
**And** IBM Plex Sans + IBM Plex Mono are applied per typography scale (UX-DR2)
**And** project Palette colours (including Duo `#FFCC00`) are **not** added as chrome brand tokens
**And** visible focus ring uses `{colors.focus-ring}` on focusable chrome controls (UX-DR15)

### Story 2.2: Chrome Shell Layout

As a Skin Studio operator,
I want the locked desktop layout (top bar, context strip, canvas, four-pane sidebar),
So that calibration chrome matches the UX contract without layers or bottom chrome.

**Acceptance Criteria:**

**Given** tokens from 2.1
**When** the editor chrome mounts
**Then** layout is Top bar (40px) + Context strip (28px) + body with canvas main and Sidebar default 320px (UX-DR3, FR-8)
**And** Sidebar has four stacked panes: picker (fixed height) → palette → mappings/skin → unbound, with horizontal splitters; panes 2–4 resizable (UX-DR6, FR-10)
**And** no left layers tree, no bottom chrome, no left Palette rail (FR-8, FR-10, AD-11)
**And** pane heights persist in `skin-studio:prefs.sidebarPaneHeights` (AD-8)

### Story 2.3: Top Bar — Ops, Zoom, and Skin Combo

As a Skin Studio operator,
I want the top bar with project ops, Zoom steps, and a right-anchored Skin combo,
So that I can switch skins and scale the view without hunting mode pills.

**Acceptance Criteria:**

**Given** the chrome shell
**When** the top bar renders
**Then** control order is `[New][Import][Export]` · undo/redo · `Zoom` · spacer · `Skin` combo right-anchored (UX-DR4, AD-11)
**And** Skin control is a labeled combo/dropdown (not horizontal mode pills) listing loaded skins and scales via scrollable menu (FR-9)
**And** Zoom combo lists only `50%`, `75%`, `100%`, `125%`, `150%`, `175%`, `200%` with default `100%` on fresh prefs (FR-11)
**And** New works per Story 1.5; Import/Export/Undo/Redo may be disabled stubs until later epics — controls are present and ordered
**And** English chrome labels: `Zoom`, `Skin`, `New`, `Import`, `Export` (NFR-9)

### Story 2.4: Sticky Context Across Skin Switch

As a Skin Studio operator,
I want Skin switch to preserve Object type, State, and pan/Zoom,
So that multi-skin compare does not reset my place (UJ-2).

**Acceptance Criteria:**

**Given** Object type X + State Y selected and non-default pan/Zoom
**When** I switch Skin via the top-bar combo
**Then** only `activeSkinId` changes; Object type, State, pan, and Zoom remain (FR-2, AD-6)
**And** if no Object/State was selected, Skin switch does not invent a selection
**And** context strip readout shows `Object · State · Zoom · Skin` with muted labels / primary values; empty Object/State shows an explicit empty glyph (e.g. `—`) (UX-DR5)
**And** context strip is readout-only (not a second editor)

### Story 2.5: Canvas Pan and Prefs Persistence

As a Skin Studio operator,
I want to pan/scroll the GUI view and keep Zoom/pan as local prefs,
So that view position survives reopen without leaking into JSON export.

**Acceptance Criteria:**

**Given** the canvas region focused
**When** I click-drag or use arrow keys
**Then** the GUI view pans on X-Y (FR-11)
**And** Zoom step and panXY persist in `skin-studio:prefs` (AD-8)
**And** prefs are never written into the project export document shape (FR-11, NFR-4)
**And** changing Zoom updates the context strip Zoom value without mutating project JSON

## Epic 3: Manage Palette and Skins

Operator can create, rename, recolour, and delete Palette entries; create, rename, duplicate, and delete Skins; calibrate the five v1 display names including the Duo LED `#FFCC00` Palette entry.

### Story 3.1: Palette Selection and Picker Recolour

As a Skin Studio operator,
I want to select a Palette entry and edit its opaque hex via picker/sliders,
So that I recalibrate colours without putting free hex on Mapping slots.

**Acceptance Criteria:**

**Given** a seeded palette in the sidebar Palette pane
**When** I select a swatch row
**Then** the picker pane edits that entry only (UX-DR7, FR-13)
**And** hex is opaque `#RRGGBB` only; mono typography on hex field (NFR-3, UX-DR2)
**And** if no Palette entry is selected, picker does not commit hex (AD-16)
**And** Mapping UI paths cannot type free `#RRGGBB` into a Mapping slot (FR-1 guard, UX-DR9 foundation)

### Story 3.2: Palette Create, Rename, and Referenced Delete

As a Skin Studio operator,
I want to create, rename, and delete Palette entries with safe confirms,
So that palette discipline survives edits without silent colour substitution.

**Acceptance Criteria:**

**Given** the Palette pane
**When** I create an entry
**Then** it receives a stable Palette id (FR-13)
**When** I rename an entry
**Then** the id remains stable and display/constant name updates as implemented
**When** I delete an entry still referenced by mappings
**Then** a modal lists *n* mappings that will become Unbound, then apply on confirm (AD-16, UX-DR8, UX-DR11)
**And** after confirm, those mappings become Unbound (`paletteEntryId` null) — no silent hex substitute (FR-13)
**And** cancel leaves palette and mappings unchanged
**And** microcopy follows EXPERIENCE delete-colour pattern (UX-DR13)

### Story 3.3: Skin Tab — Rename, Duplicate, Delete

As a Skin Studio operator,
I want Skin rename / duplicate / delete on the Skin tab,
So that I manage skin identities without a layers tree or mode pills.

**Acceptance Criteria:**

**Given** Sidebar pane 3 segmented `[Mappings | Skin]` (Mappings default) (AD-11, UX-DR6)
**When** I open the Skin tab
**Then** I can rename, duplicate, and delete the active (or selected) Skin only — no per-instance overrides UI (FR-14, FR-6)
**When** I duplicate a Skin
**Then** mappings copy into a new Skin identity (FR-14, AD-4)
**When** I delete a Skin
**Then** confirm always appears; cancel = no change; confirm removes Skin from switcher and project (FR-14, AD-16)
**And** delete microcopy: `Delete skin “{name}”? This cannot be undone.` (UX-DR13)
**And** Skin combo updates to reflect the Skin list after CRUD

### Story 3.4: Create Skin and Preserve v1 Duo LED Entry

As a Skin Studio operator,
I want to create new Skins and keep the v1 set / Duo LED yellow entry available,
So that Matrix-Control’s five-skin family stays calibratable from seed onward.

**Acceptance Criteria:**

**Given** the seeded project
**When** I inspect skins and palette
**Then** the five v1 display names remain available from seed (FR-15); rejected names are not used as display names
**And** Duo LED yellow Palette entry baseline `#FFCC00` remains calibratable; changing its hex updates preview consumers of that id (FR-16)
**When** I create a new Skin
**Then** it appears in the Skin combo with a stable id and empty or default mappings as defined by model rules (FR-14)
**And** Duo Patch/Master accents are **not** baked into generic Object types as frozen colours (FR-15 / AD-13 — zone simulation belongs to canvas Epic 4)

## Epic 4: Calibrate Mappings with Live Preview

Operator selects Object type and State, binds Properties to Palette ids only, sees live mock updates with LED fully-on and Duo Orchestrator zones, and keeps canvas ↔ sidebar selection in sync (with pulse on mapping change).

### Story 4.1: GUI View Mock with Orchestrator Zones

As a Skin Studio operator,
I want a Figma-like Matrix-Control mock with zone metadata for Duo accents,
So that I calibrate against a credible layout without baking zones into generic Object types.

**Acceptance Criteria:**

**Given** chrome from Epic 2 and seed inventory
**When** the canvas mounts
**Then** GUI view shows a readable Matrix-Control composition (Header / Body Patch&Master / Footer) — not a pixel-perfect JUCE clone (UX-DR14, NFR-6)
**And** clickable Object-type regions exist only for types present in the **loaded** seed inventory (AD-10) — no invented Collect inventory
**And** Duo Patch/Master accent simulation uses canvas mock layout metadata, not Inventory ObjectTypes (AD-13, FR-15)
**And** paint colours resolve only via `model` palette/mapping helpers — never hex read off a Mapping (AD-15)

### Story 4.2: Object Type, State, and Palette-Id Mappings

As a Skin Studio operator,
I want to select Object type and State and bind each Property to a Palette id,
So that every painted slot stays Palette-disciplined (type-level only).

**Acceptance Criteria:**

**Given** Mappings tab in pane 3
**When** I choose an Object type and State
**Then** mapping rows list Properties for that Object type × State from loaded inventory (FR-18)
**And** each row binds `paletteEntryId` only — never free `#RRGGBB` (FR-1, UX-DR9)
**And** Unbound rows show warning marker + `Unbound` label (UX-DR9)
**And** mappings are type-level only — no UI path for per-instance overrides (FR-6)
**And** changing State refreshes which Property mappings are shown and how the mock paints that Object type (FR-18)
**And** mapping uniqueness is `(objectTypeId, stateId, propertyId)` per Skin (AD-4)

### Story 4.3: Bidirectional Canvas ↔ Sidebar Selection Sync

As a Skin Studio operator,
I want canvas and sidebar selection to stay in sync,
So that clicking the mock focuses the right mapping rows and sidebar selection outlines the mock.

**Acceptance Criteria:**

**Given** the mock and Mappings tab
**When** I click an Object-type region on the canvas
**Then** that Object type is selected and the corresponding Mapping row(s) highlight/scroll into view **without** resetting State (FR-5, AD-16, UX-DR12)
**When** I choose an Object type in the Sidebar
**Then** the corresponding mock region(s) outline when present (FR-5)
**And** selection outline is 2px accent, transparent fill (UX-DR12)
**And** context strip Object/State values update to match session selection

### Story 4.4: Live Preview, LED Fully-On, and Mapping Pulse

As a Skin Studio operator,
I want mapping and palette edits to update the mock immediately, with LED fully-on and a short pulse on mapping change,
So that calibration feedback is instant and trustworthy.

**Acceptance Criteria:**

**Given** an active Skin and selection
**When** I change a Mapping’s Palette id or a Palette entry’s hex
**Then** the GUI view updates within the same interaction turn without reload (FR-19)
**And** all Properties mapped to that Palette id reflect the new hex on next paint (FR-1)
**And** LED Properties always paint at fully-on Palette colour — no intensity/dim UI (FR-7, AD-13)
**When** a Mapping changes
**Then** affected mock region(s) pulse outline 1–2× ~400ms with chrome `pulse-outline`, then return to steady selection if still selected (FR-5, AD-16, UX-DR12)

## Epic 5: Undo Safely and Export a Complete Package

Operator undoes/redoes with coalesced picker edits, sees Unbound count derived from the loaded inventory, and exports a single project JSON only when Unbound is zero; import is replace-all, fail-closed on unknown formatVersion.

### Story 5.1: History Stack with Coalesced Undo/Redo

As a Skin Studio operator,
I want undo/redo over project and selection edits with coalesced picker micro-gestures,
So that I can reverse mistakes without undoing Zoom/pan or flooding the stack.

**Acceptance Criteria:**

**Given** the single-writer store
**When** UI mutations go through `history.execute` → `store.apply` (AD-1, AD-15)
**Then** undo restores project JSON mutations + Object type / State selection (FR-20)
**And** Zoom and pan are never undo steps (FR-20, AD-7)
**And** rapid picker / Palette hex micro-edits coalesce at **400 ms idle or pointer-up** into one undo step (FR-4, AD-7)
**And** discrete commits (rename, mapping id change, Skin CRUD) remain separate undo steps
**And** redo reapplies until a new branch edit clears the redo stack
**And** top-bar Undo/Redo controls invoke history (stubs from Epic 2 become live)

### Story 5.2: Unbound Derive and Unbound Pane

As a Skin Studio operator,
I want an always-visible Unbound count and clickable list derived from the loaded inventory,
So that I know what still blocks a trustworthy export.

**Acceptance Criteria:**

**Given** loaded inventory (seed-placeholder OK) and skins
**When** `model.deriveUnbound` runs
**Then** required slots = every Inventory Property for each Skin × ObjectType × State in the **loaded** inventory (FR-3, AD-10)
**And** a slot is Unbound if mapping missing, `paletteEntryId` null, or Palette id deleted/unresolvable
**And** Unbound math lives only in `model/` — `io/` and UI ask the derive, do not reimplement (AD-15)
**And** pane 4 shows `{n} unbound` badge + clickable rows `{Object type} · {Property}`; empty success copy `All required mappings bound` (UX-DR10, UX-DR13)
**When** I click an Unbound row
**Then** session jumps to that Object type + Mapping row (and State if encoded) (AD-16)
**And** stories must **not** invent Collect ObjectTypes to “fill” SM-1 — interim gate is loaded inventory only

### Story 5.3: Hard Export Gate and Single Project JSON

As a Skin Studio operator,
I want Export disabled while Unbound > 0 and a single project JSON download when clear,
So that handoff cannot silently ship holes (UJ-1 climax).

**Acceptance Criteria:**

**Given** `unboundCount > 0`
**When** I view Export
**Then** Export is visually disabled / non-activating with English tooltip `Export blocked — {n} unbound mapping(s)` (FR-3, AD-9, UX-DR13)
**Given** `unboundCount = 0`
**When** I Export
**Then** a `.json` file downloads containing **project only** (not session, not prefs) with `formatVersion` writer pin `1` (FR-21, AD-5, AD-9)
**And** packing is one JSON document = whole Project (all skins) — not per-skin files (AD-5)
**And** mappings in export are Palette ids never raw hex (SM-2 / FR-1)
**And** no mandatory Markdown companion is produced

### Story 5.4: Import Replace-All with Fail-Closed formatVersion

As a Skin Studio operator,
I want to import a project JSON with strong replace-all confirm and fail-closed version checks,
So that I can reload work without silent partial loads or accidental wipe.

**Acceptance Criteria:**

**Given** a JSON file with supported `formatVersion` `1`
**When** I Import
**Then** a confirm appears (`Replace the current project with this file?…`) before replace-all (FR-21, AD-9, UX-DR11, UX-DR13)
**And** cancel leaves the current project unchanged
**And** confirm replaces project document; prefs (Zoom/pan) remain unchanged
**Given** unknown or newer `formatVersion`
**When** I Import
**Then** import fails closed with `Import failed — this file uses an unsupported format version.` — no partial silent load (FR-21, AD-9)
**And** merge/re-map import is **not** implemented (Soon FR-28)

## Epic 6: Soon — Post-MVP Calibration Power Tools (Intent-Only)

Intent labels for FR-22…FR-28 and FR-12 soft layout — **not** MVP exit criteria; promote with full consequences before implementation.

### Story 6.1: Where-Used and Rename Refactor `[INTENT-ONLY — Soon]`

As a Skin Studio operator,
I want to see where a Palette id is used and rename/refactor it with reference updates,
So that multi-skin palette cleanup stays safe after MVP.

**Intent (not MVP AC):** Flash/highlight mock regions for a Palette id; rename updates references. Promote with full consequences before build. (FR-22)

### Story 6.2: Side-by-Side Skin Compare `[INTENT-ONLY — Soon]`

As a Skin Studio operator,
I want a dedicated compare mode for at least Black/Green vs Cream/Green and Duo accent checks,
So that sticky single-view switching is complemented by explicit compare later.

**Intent (not MVP AC):** Dedicated compare UI. Not required for UJ-2 MVP. (FR-23)

### Story 6.3: Replace-Colour Within Skin `[INTENT-ONLY — Soon]`

As a Skin Studio operator,
I want to replace Palette id X → Y for mappings within a Skin (or scoped set),
So that accent sweeps become cheap after the calibration loop is solid.

**Intent (not MVP AC):** Scoped replace-colour; paint-bucket accent sweeps deferred with this item. (FR-24)

### Story 6.4: Search and Zoom-to-Selection `[INTENT-ONLY — Soon]`

As a Skin Studio operator,
I want to search Object types/Properties and zoom the GUI view to the selection,
So that large inventories stay navigable after Collect lands.

**Intent (not MVP AC):** Search + zoom-to-selection. Usefulness rises with Collect inventory size. (FR-25)

### Story 6.5: Draft vs Ready `[INTENT-ONLY — Soon]`

As a Skin Studio operator,
I want Skins or packages marked draft vs ready,
So that ready status can layer additional export policy on top of the Unbound hard gate.

**Intent (not MVP AC):** Exact Ready rules deferred to UX when promoted. (FR-26)

### Story 6.6: Contrast Hints `[INTENT-ONLY — Soon]`

As a Skin Studio operator,
I want simple contrast advisories,
So that rough readability checks exist without WCAG productization.

**Intent (not MVP AC):** Not an MVP accessibility exit criterion. (FR-27)

### Story 6.7: Collect Import Merge `[INTENT-ONLY — Soon]`

As a Skin Studio operator,
I want Collect re-import to merge/re-map rather than wipe work,
So that inventory refresh does not destroy calibration by default.

**Intent (not MVP AC):** MVP keeps replace-all (Story 5.4). Merge is FR-28 only.

### Story 6.8: Soft Narrow-Viewport Layout `[INTENT-ONLY — Soon]`

As a Skin Studio operator,
I want a soft narrow layout (e.g. inspector drawer) without expanding MVP desktop chrome exit criteria,
So that occasional narrow windows remain usable later.

**Intent (not MVP AC):** FR-12 deferred; not MVP desktop requirement.
