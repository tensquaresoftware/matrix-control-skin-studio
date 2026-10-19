---
title: 'Lot A — Seed inventory, clickable mock sync, neutral palette names'
type: 'feature'
created: '2026-10-18'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '114169af303584f15ff693facfb805bae8853c30'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Skin Studio looks mappable but isn’t — seed inventory is empty, painted Orchestrator bands are not selectable, Object / State / Mappings stay dead, and Unbound claims “All required mappings bound” by vacuity. Palette seed ids still encode UI roles (`duoLedYellow`, `patchZoneBlue`, …).

**Approach:** Ship a clearly provisional seed-placeholder inventory (few ObjectTypes / States / Properties aligned with the current mock), wire click → session → sidebar sync end-to-end, rename seed Palette entries to colour-only names, and show an honest empty-inventory message so vacuous “all bound” cannot return.

## Boundaries & Constraints

**Always:**
- Keep `inventory.source: "seed-placeholder"`. Document in seed comments that Collect (or a later fixture) replaces this content — never present it as Collect-final.
- Palette `id` / `constantName` = colour names only (e.g. yellow / blue / orange). Usage roles live on ObjectType **properties**, never on Palette names.
- Hit / selection targets exist only for ObjectType ids present in the **loaded** inventory (AD-10). Empty inventory → zero useful hits + honest empty copy (not `All required mappings bound`).
- Orchestrator zone **paint** stays canvas mock metadata (AD-13): bands resolve colour via Palette ids + `resolvePaletteHex`. Do not bake Patch/Master into Inventory as product Collect truth — seed ObjectTypes are an explicit provisional fixture.
- Reuse existing Epic 4 sync (`applyObjectTypeHitSelection` → `CanvasSelectionSync` → mappings pane / context strip). Mutations only via `history.execute` → `store.apply`.
- Update all in-repo references after Palette id rename (Orchestrator constants, seed mappings, matrix tests).
- With non-empty inventory: `deriveUnbound` / Unbound pane / Export gate reflect real missing slots (no vacuous success when slots exist).
- **Decision CLICK_SURFACE = A:** Painted Orchestrator bands are clickable and select matching seed ObjectTypes (visual = selectable). Bands remain paint metadata (AD-13); selection uses inventory ObjectType ids.
- **Decision SEED_BINDINGS = B:** Pre-bind each ObjectType’s primary property `fill` at state `default` to the matching colour Palette id on all five Skins so preview paints; Unbound only for any remaining unbound slots.
- **Decision FIXTURE_SHAPE = B:** Three provisional ObjectTypes `headerLed`, `patchBand`, `masterBand`; each has states `["default"]` and properties `["fill"]`.
- **Decision PALETTE_COLOUR_IDS:** Rename seed Palette to colour-only tokens — ids `yellow` / `blue` / `orange` (hexes unchanged `#FFCC00` / `#3D7EFF` / `#FF8A1F`); `constantName` `kYellow` / `kBlue` / `kOrange`. Map: headerLed→yellow, patchBand→blue, masterBand→orange.

**Never:**
- Lot B chrome (Photocraft / Photoshop restyle, sidebar 260px, Color/Palette tabs, square picker, HSV removal, context-strip relocation, Create/Duplicate/Delete microcopy).
- Lot C mock fidelity (redraw widgets to match real Matrix-Control).
- Epic 6 / Collect import-merge / where-used / skin compare.
- Mass invent ObjectTypes “to look complete”; invent Collect; reshape store types; bypass single-writer / history.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Cold open / New | Seed project | 3 ObjectTypes; colour Palette ids; bands clickable; each Skin has 3 pre-bound `fill` mappings | N/A |
| Canvas click band | Click painted Patch / Master / Header Duo band | Session Object+State (`default`); context strip + Mappings pane populate for that ObjectType | N/A |
| Empty inventory (guard) | Project with `objectTypes: []` | Zero hits; Unbound shows honest empty copy (not success “all bound”) | N/A |
| Unbound honesty | Seed with all `fill` slots bound | Unbound success copy; Export clear (no vacuous empty-inventory lie) | N/A |
| Palette rename | Inspect seed Palette + Orchestrator palette refs | Colour-only ids/constantNames; zone paint still resolves hex | N/A |
| Mapping change | Rebind `fill` → another Palette id | Preview / pulse behaviour from Epic 4 unchanged | N/A |

</frozen-after-approval>

## Code Map

- `src/seed/seed-data.ts` — `SEED_PALETTE` (rename colour-only), `SEED_INVENTORY` (fill provisional `objectTypes`), `SEED_SKINS` mappings if SEED_BINDINGS = B; comment that Collect replaces inventory later
- `src/seed/index.ts` — `createSeedProject` / `applySeedBaseline` (unchanged API; shape changes flow through)
- `src/canvas/mock-layout.ts` — `PALETTE_ID_*` / `ORCHESTRATOR_ZONES.paletteEntryId` → new colour ids; `listObjectTypeHitRegions` stays inventory-driven; if CLICK_SURFACE = A, expose zone→objectType bridge helpers without inventing Collect types
- `src/canvas/index.ts` — hit build + selection; if CLICK_SURFACE = A, make zone elements invoke `applyObjectTypeHitSelection` for matching inventory ids; keep pulse / hit-fill paint
- `src/styles/base.css` — only if needed for selectable zone affordance (cursor/outline); no Photocraft restyle
- `src/sidebar/canvas-selection-sync.ts`, `src/sidebar/mappings-pane.ts`, `src/sidebar/mapping-focus.ts` — reuse; touch only if empty-inventory UX needs a mappings-pane hint
- `src/sidebar/unbound-pane.ts` — split empty-inventory copy vs `UNBOUND_SUCCESS_COPY` when `projectTotal === 0`
- `src/chrome/index.ts` — context strip already syncs Object/State from session; verify after seed; no Lot B chrome moves
- `src/model/palette-helpers.ts` — `deriveUnbound` already Cartesian; no invent slots; confirm behaviour with new inventory
- `src/io/index.ts` — Export gate follows unbound; empty inventory remains “no required slots” (clear) while Unbound pane tells the truth
- Tests to update: `scripts/seed-matrix.test.mjs`, `scripts/canvas-mock-matrix.test.mjs`, `scripts/selection-sync-matrix.test.mjs`, `scripts/unbound-pane-matrix.test.mjs`, `scripts/chrome-shell-matrix.test.mjs`, plus any hard-coded `duoLedYellow` / `patchZoneBlue` / `masterZoneOrange` in matrix suites touched by rename
- Continuity: `spec-1-3` emptied inventory on purpose; this Lot A revises that seed decision under the same `seed-placeholder` marker. `spec-4-1` / `spec-4-3` sync paths stay the consumers.

## Tasks & Acceptance

**Execution:**
- [x] `src/seed/seed-data.ts` — Provisional inventory (3 OTs / `default` / `fill`) + colour Palette rename + pre-bound mappings on all Skins — Lot A seed truth
- [x] `src/canvas/mock-layout.ts` (+ `src/canvas/index.ts`, CSS only if needed) — Zone click → matching ObjectType selection; retarget Orchestrator Palette ids — clickable mock
- [x] `src/sidebar/unbound-pane.ts` — Honest empty-inventory copy when no ObjectTypes / no required slots — stop vacuous success
- [x] Matrix tests (`scripts/seed-matrix.test.mjs`, canvas/selection/unbound/chrome + Palette id refs) — Lock I/O matrix; fix rename fallout in touched suites
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` — Note Lot A post-MVP seed fixture (optional tracking line); do not reopen Epic 6

**Acceptance Criteria:**
- Given New / cold open on seed, when the project loads, then inventory has `headerLed` / `patchBand` / `masterBand` and Palette ids are colour-only (`yellow` / `blue` / `orange`).
- Given a click on a painted Orchestrator band, when selection runs, then Object / State (`default`) / Mappings (and context strip) populate for that ObjectType.
- Given `objectTypes: []`, when Unbound renders, then the empty copy is honest (not “All required mappings bound”).
- Given seed with all `fill` slots pre-bound, when Unbound / Export are inspected, then success / Export clear; removing a bind resurfaces Unbound and blocks Export.
- Given `npm test` and `npm run build`, when they finish, then both exit 0.
- Given the Lot A diff, when reviewed, then Lot B chrome redesign and Lot C mock-fidelity work are absent.

## Implementation Notes

- Seed: colour Palette `yellow`/`blue`/`orange`; inventory `headerLed`/`patchBand`/`masterBand` (`default`/`fill`); each Skin pre-binds the three fills.
- Canvas: `resolveZoneSelectableObjectTypeId` bridges Orchestrator roles → inventory ids; zone DOM uses `applyObjectTypeHitSelection` when present.
- Unbound: `UNBOUND_EMPTY_INVENTORY_COPY` when no required slots; success copy only when slots exist and all bound.
- Autosave migration of old Palette ids intentionally out of scope (New / Import to refresh).
- Matrix gap closed: selection-sync test clicks painted `zone-patch` → `patchBand` / `default` / Mappings / context strip.
- Verification: `npm test` 227 pass; `npm run build` exit 0.

## Spec Change Log

## Review Triage Log

- blind: AC remove-bind → Unbound+Export untested — `false` — unbound-pane matrix already clears a binding and asserts badge return; chrome-shell Export gate covers unbound>0 blocked.
- blind: only zone-patch click covered not Master/Header — `false` — same `buildZoneElement` / `resolveZoneSelectableObjectTypeId` path; role→id map is total for three roles.
- blind: Header Duo accessible name missing — `medium` → **patch** — selectable zones now set `aria-label` to `zone.label`.
- blind: zone keyboard untested — `low` → **defer** — click is Lot A primary path; hit-chip Enter/Space already covers shared selection helper.
- blind: zone is-selected/is-pulsing unasserted — `medium` → **patch** (is-selected) — selection-sync asserts patch `is-selected` after band click; pulse left as existing Epic 4 coverage on hits.
- blind: zone paint not driven by fill mappings — `false` — AD-13 ALWAYS_ON Palette metadata by design; fill mappings drive hit chips / preview path.
- blind: mappings-matrix KEEP_EMPTY + old palette ids — `false` — local fixtures, not seed truth; seed/zone paths use colour ids.
- blind: epic context still KEEP_EMPTY — `low` → **defer** — agent-context doc hygiene outside Lot A code surface.
- blind: chrome Export comment weak vs vacuous-clear — `false` — unbound-pane + seed-matrix lock bound seed success; Export clear follows unbound 0.
- blind: spec status done / empty triage — `false` — process noise; triage filled this pass; status managed by workflow.
- blind: empty copy mislabels OT-without-slots — `medium` → **patch** — `emptyUnboundCopy` distinguishes empty OTs vs no bindable slots.
- edge: empty skins + required slots → vacuous success — `medium` → **patch** — `No skins — nothing to bind` copy.
- edge: OT without slots dishonest empty copy — `medium` → **patch** — same `emptyUnboundCopy` branch.
- edge: OT empty states still selectable — `medium` → **patch** — `resolveZoneSelectableObjectTypeId` requires states+properties.
- verify-gap: zone is-selected after click unasserted — `medium` → **patch** — assertion added in selection-sync matrix.
- verify-gap: Enter/Space on zones untested — `low` → **defer** — same as blind keyboard defer.

## Design Notes

**AD-13 coexistence:** Orchestrator bands remain mock layout metadata for ALWAYS_ON Palette paint. Provisional seed ObjectTypes are a separate inventory fixture for mapping practice. Zone DOM calls the same selection path as hit chips — it does not merge zone descriptors into `Inventory.objectTypes`.

**Palette rename (frozen):** hexes `#FFCC00` / `#3D7EFF` / `#FF8A1F`; ids `yellow` / `blue` / `orange`; `constantName` `kYellow` / `kBlue` / `kOrange`. Update `PALETTE_ID_*` accordingly. No usage words in names.

**Empty inventory vs Export:** Prefer Unbound honesty message without newly blocking Export solely because inventory is empty (no required slots ⇒ gate clear). Blocking Export for empty inventory would be a product change beyond “stop the lie.”

**Autosave:** Existing browser envelopes may still hold old Palette ids until New / Import; Lot A does not migrate old autosaves.

## Verification

**Commands:**
- `npm test` -- expected: exit 0 (updated matrices green)
- `npm run build` -- expected: exit 0

**Manual checks (if no CLI):**
- New / cold open → seed loaded; Palette shows colour names
- Click selectable mock surface → Object / State / Mappings live; context strip updates
- Change a mapping → preview / pulse as already shipped
- Force or simulate empty inventory → honest Unbound copy, not vacuous success
- Confirm no Lot B / Lot C chrome or fidelity edits in the diff
