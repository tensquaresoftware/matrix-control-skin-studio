---
title: '4-1 GUI View Mock with Orchestrator Zones'
type: 'feature'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '6815f2d053645dc313bb15e6559b67aa4e148af6'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The GUI view is still a pan/zoom placeholder label — operators cannot calibrate against a readable Matrix-Control layout, and Patch/Master decorative accents have nowhere to live without baking them into inventory Object types (FR-15 / AD-13 / UX-DR14).

**Approach:** Replace the placeholder with a Figma-like mock (Header / Body Patch&Master / Footer) whose Orchestrator zones are canvas layout metadata painted from ordinary Palette entries; add Object-type hit regions only for types present in the loaded seed inventory (empty today → zero regions); resolve Palette-backed paint only through model helpers.

## Boundaries & Constraints

**Always:**
- Mount the mock under the existing `[data-canvas-surface]` so Epic 2 pan/Zoom prefs keep working unchanged.
- Composition is a readable Matrix-Control silhouette (Header with title + LEDs, Body with Patch | Master columns + Orchestrator strips, Footer with faders) — structural match to the UX `editor-main.html` mock, not a pixel-perfect JUCE clone (UX-DR14, NFR-6).
- **Decision DUO_ZONE_COLOURS = PALETTE_ENTRIES:** Patch and Master decorative band colours are ordinary seed Palette entries (baseline Blue Patch / Orange Master hexes). Operators recalibrate them via the existing Palette / Picker path on **every** Skin — not mock-only constants, not a Duo-only special colour channel. Zone layout metadata on the canvas references those Palette ids; paint uses `resolvePaletteHex` (AD-15). Inventory ObjectTypes stay generic / seed-placeholder empty — no accent colour fields, no invented Collect types (AD-13).
- **Decision DUO_ZONE_VISIBILITY = ALWAYS_ON:** No Skin-name gate. Patch/Master band paint is always driven by those Palette entries for any active Skin — Duo skins are not a special display case. (They may often keep Blue/Orange in practice; that is operator choice, not a hard-coded exception.)
- Clickable Object-type regions exist only for `project.inventory.objectTypes` ids present in the **loaded** inventory. With today’s empty `SEED_INVENTORY.objectTypes`, ship **zero** Object-type hit targets; do not invent widgets-as-types. Zone bands are **not** Inventory ObjectTypes — they are calibratable Palette-backed layout accents (same colour discipline as other Palette colours; mapping UI for Object types remains 4.2).
- When any mock face paints from a Palette-backed slot, resolve hex only via `resolvePaletteHex` (or equivalent model helper) — never read hex off a Mapping (AD-15). Canvas may subscribe to the store so Palette hex edits to zone entries repaint the bands in the same session (zone faces only — not full inventory-Property live preview, which stays 4.4).
- Keep chrome shell geometry, prefs Zoom/pan, SessionUiState shape, and mutation ownership (UI → history/store) unchanged. Seed Palette grows by the Patch/Master entries only; seed `objectTypes` stay empty.
- Cover composition presence, zone-metadata ownership (not inventory), seed Palette Patch/Master entries, empty-inventory → zero Object-type regions, and palette-helper paint discipline in a canvas matrix test (extend `chrome-shell-matrix` or add `scripts/canvas-mock-matrix.test.mjs`). Keep `npm test` / `npm run build` green. English UI strings.

**Never:**
- Mapping bind UI (4.2), canvas ↔ sidebar selection sync / selection outline behavior as product feature (4.3), full live Mapping/Palette repaint of inventory Object-type Properties, LED fully-on property paint rules beyond zone/LED stubs, or mapping-change pulse (4.4).
- Baking Patch/Master accents into Object types; inventing Collect ObjectTypes for clickable regions or for the decorative bands themselves.
- Free `#RRGGBB` on Mapping path; Skin-name special-casing for Duo zone visibility; changing envelope / prefs schema; undoing Zoom/pan into history.
- Pixel-locking to Figma/JUCE; left layers / bottom chrome; C++ Looks.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Mock mounts | Chrome mounts canvas host | Surface shows Header / Body (Patch\|Master) / Footer composition; placeholder-only “GUI view” label gone | N/A |
| Zone metadata | Seed project | Patch/Master Orchestrator zones exist as canvas layout metadata referencing Palette ids; inventory `objectTypes` still `[]` with no accent fields | N/A |
| Seed Palette bands | Fresh seed | Palette includes calibratable Patch (Blue) and Master (Orange) entries; bands paint via `resolvePaletteHex` | N/A |
| Recolour band | Any active Skin; edit Patch or Master Palette hex via Picker | Band fill updates from new hex; works on Green/Monochrome/Duo alike | N/A |
| Empty inventory hits | `objectTypes: []` | No Object-type clickable regions / hit targets | N/A |
| Loaded inventory hits | Fixture inventory with ≥1 ObjectType | Only those type ids get regions; no extra invented types; bands still not ObjectTypes | Unknown type ids ignored |
| Palette paint discipline | Any Palette-backed zone/LED paint | Hex from `resolvePaletteHex` (or model helper), not Mapping hex | Unresolvable id → unbound/neutral stub, no throw |
| Pan/Zoom intact | Prefs non-default Zoom/pan | Mock rides existing surface transform | N/A |

</frozen-after-approval>

## Code Map

- `src/canvas/index.ts` — `mountCanvas` currently appends placeholder label only; replace with mock render under `[data-canvas-surface]`; keep pan/Zoom wiring and `applyCanvasViewFromPrefs`; accept `store` to resolve Palette-backed zone paint and repaint on Palette hex changes
- `src/canvas/mock-layout.ts` (new) — layout metadata: Header / Body Patch|Master / Footer regions + Orchestrator zone descriptors (ids, roles, `paletteEntryId` for Patch/Master bands and Duo LED if applicable); helpers to list Object-type hit regions from loaded inventory only
- `src/chrome/index.ts` — pass `store` (+ `storage`) into `mountCanvas` for Palette-backed paint
- `src/model/palette-helpers.ts` — reuse `resolvePaletteHex` / unbound helpers; do not add Mapping hex readers
- `src/seed/seed-data.ts` — add Patch Blue + Master Orange seed Palette entries (stable ids + baseline opaque hex + constantNames); keep `objectTypes: []`; do **not** invent ObjectTypes or bake accents into inventory
- `src/seed/index.ts` / seed matrix scripts — extend preserve asserts for the new Palette entries alongside `duoLedYellow`
- `src/styles/base.css` — mock / zone styles inside canvas surface; keep selection CSS variables for later 4.3; do not restyle chrome shell
- UX reference: `_bmad-output/planning-artifacts/ux-designs/ux-Matrix-Control-Skin-Studio-2026-10-15/mockups/editor-main.html` (composition + `.orch` strips) — visual guide only
- `scripts/chrome-shell-matrix.test.mjs` and/or new `scripts/canvas-mock-matrix.test.mjs` — composition, zones-not-in-inventory, Palette band paint + recolour, empty hits, pan/Zoom regression; wire into `package.json` `test` if new file
- Do **not** change: sidebar Mapping UI, SessionUiState keys, envelope/prefs schema, Epic 2 chrome geometry

## Tasks & Acceptance

**Execution:**
- [x] `src/seed/seed-data.ts` (+ seed/matrix asserts) -- Add calibratable Patch Blue and Master Orange Palette entries; keep inventory ObjectTypes empty -- DUO_ZONE_COLOURS / FR-15
- [x] `src/canvas/mock-layout.ts` -- Define mock composition + Orchestrator zone layout metadata referencing those Palette ids; derive Object-type regions only from loaded inventory -- AD-13 / AD-10
- [x] `src/canvas/index.ts` -- Render mock under canvas surface; replace placeholder; keep pan/Zoom; store subscribe for Palette-backed band paint -- FR-15 / UX-DR14 / ALWAYS_ON
- [x] `src/chrome/index.ts` -- Pass `store` into `mountCanvas` -- wiring
- [x] `src/styles/base.css` -- Styles for mock Header/Body/Footer and Orchestrator zones -- UX-DR14
- [x] `scripts/canvas-mock-matrix.test.mjs` (or extend `chrome-shell-matrix`) -- Assert composition, zone metadata ≠ inventory, Palette band paint/recolour on any Skin, empty inventory → zero Object-type regions, pan/Zoom still applied -- I/O matrix
- [x] `package.json` -- Include new matrix script in `test` if a new file is added -- CI

**Acceptance Criteria:**
- Given chrome from Epic 2 and a seeded project, when the canvas mounts, then the GUI view shows a readable Matrix-Control composition (Header / Body Patch&Master / Footer), not a placeholder-only label.
- Given the loaded seed inventory, when Object-type regions are considered, then clickable regions exist only for types present in that inventory (zero regions while `objectTypes` is empty) — no invented Collect inventory.
- Given Patch/Master accent simulation, when inspecting ownership, then accents come from canvas mock layout metadata painted via Palette ids, not from Inventory ObjectTypes — and those Palette colours are editable on every Skin like other Palette entries.
- Given any Palette-backed mock paint, when colour is resolved, then it goes through model palette helpers — never hex read off a Mapping.
- Given existing Zoom/pan prefs, when the mock is present, then the surface transform from prefs still applies.

## Implementation Notes

- Seed Palette ids: `patchZoneBlue` (`#3D7EFF` / `kPatchZoneBlue`), `masterZoneOrange` (`#FF8A1F` / `kMasterZoneOrange`), plus existing `duoLedYellow`.
- Layout metadata in `src/canvas/mock-layout.ts`; paint via `resolvePaletteHex` only; chrome passes `store` into `mountCanvas`.
- Object-type hits use `data-object-type-id`; empty seed inventory → zero hits. Selection sync deferred to 4.3.
- Verified: `npm test` (109 pass) and `npm run build` green.

## Spec Change Log

- 2026-10-17: Implemented story 4.1; tasks checked.

## Review Triage Log

- `medium` patch — Chrome→canvas `store` wiring untested on product path — verified: canvas-mock injects store; chrome-shell never asserted zone fills; omitting store leaves unbound bands — fixed: chrome-shell fresh mount asserts seed zone hexes
- `medium` patch — Object-type hit `<button>`s pan on pointerdown / dead interactive controls — verified: hits were buttons with no handler under host pan listener — fixed: non-interactive `div` with `data-object-type-id`
- `medium` defer — Restored formatVersion-1 envelopes with pre–4.1 one-entry palette leave Patch/Master bands unbound — verified: `bootProjectStore` only `applySeedBaseline` when nothing restored; no palette merge on cold reopen — deferred (pre-existing envelope/seed boundary)
- `low` rejected — `mountCanvas` store subscribe without unsubscribe — same chrome listener pattern; everyday remount uncommon; dispose API would add surface
- `false` — Hit regions under Footer not on knob silhouettes — provisional inventory hit strip; spatial widget overlays are 4.3, not required by frozen intent
- `false` — `.canvas-surface { overflow: hidden }` clips pan — intentional Epic 2 clip; not a new defect
- `false` — “Unknown type ids ignored” unimplemented — matrix Error Handling misread; loaded inventory entries are the known set
- `false` — Hard-coded green LED/knob fills — Design Notes temporary until Collect
- `false` — Identical “Orchestrator zone” labels — matches UX mockup copy
- `low` rejected — Unused `orchestratorZonePaletteIds()` export — no everyday product harm
- `low` rejected — Empty hit-host padding — cosmetic empty flex host
- `low` rejected — Recolour matrix mutates project in place — test hygiene only
- `low` rejected — null/undefined `objectTypes` entry throws — only corrupt hand-edited inventory
- `carried` — Edge remount subscription leak — same claim as subscribe-without-unsub; rejected low above
- `carried` — Edge hit-button pan — same root as button hits; patched via non-interactive divs

## Design Notes

- Layout metadata stays a TypeScript module under `canvas/` (not seed JSON). Structural fidelity to `editor-main.html`. Green Header LED faces may use temporary mock greens until Collect confirms; Duo Header LED may continue to reference `duoLedYellow`.
- Hit-testing for Object types may attach `data-object-type-id` (or equivalent) for later 4.3 without implementing sidebar sync in this story.
- “Like any other object” for Patch/Master bands means **same Palette colour discipline** (pick/edit hex, visible on all Skins) — not inventing Inventory ObjectTypes for the decorative strips (AD-13). Full Property→Palette mapping UI remains story 4.2.
- Baseline Blue/Orange hexes for the new seed entries are agent-chosen opaque `#RRGGBB` aligned with the PRD Duo table wording; operators can recalibrate afterward.
