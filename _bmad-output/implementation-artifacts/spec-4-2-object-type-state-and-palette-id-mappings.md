---
title: '4-2 Object Type, State, and Palette-Id Mappings'
type: 'feature'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '36ea7d137ed908dfb4c8be589159e05bbd2f1eba'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Pane 3’s Mappings tab is still an empty stub — operators cannot pick Object type and State or bind Properties to Palette ids, so calibration stays Palette-disciplined only on paper.

**Approach:** Fill the Mappings tab with Object type + State controls and Property → Palette-id rows for the active Skin, writing type-level `Mapping` entries (`paletteEntryId | null` only) through the store, with Unbound rows marked per UX-DR9.

## Boundaries & Constraints

**Always:**
- Mount the editor inside the existing Mappings segment of pane 3 (`[data-mappings-tab]`); keep Skin tab CRUD unchanged.
- Object type and State controls are always visible; Property rows list inventory Properties for the selected Object type × State (FR-18).
- Each row commits `paletteEntryId` only — never free `#RRGGBB` on the Mapping path (FR-1, UX-DR9). Persist `null` for Unbound; reject hex-shaped ids via opaque-hex guards.
- Mappings are type-level only: uniqueness `(objectTypeId, stateId, propertyId)` per Skin (AD-4). No per-instance override UI (FR-6).
- Selecting Object type / State writes `SessionUiState` via `store.apply` so the chrome context strip stays in sync. Changing State refreshes Property rows.
- **Decision INVENTORY_FOR_MAPPINGS = KEEP_EMPTY:** seed `objectTypes` stay `[]`; editor works when inventory is loaded; matrix tests inject fixture ObjectTypes. No provisional Collect-like seed types.
- **Decision BIND_GESTURE = ROW_THEN_PALETTE:** focus a Mapping row (Unbound click focuses Palette/Picker bind path); clicking a Palette entry binds that Property’s `paletteEntryId`.
- **Decision CLEAR_BINDING = ALLOW_UNBIND:** operator can return a row to Unbound (`paletteEntryId: null`) via an explicit clear control on the focused/bound row.
- Unbound rows show warning marker + `Unbound` using `--comp-mapping-row-*` tokens (UX-DR9). Reuse `isMappingUnbound` / `resolvePaletteHex`; add find/upsert Mapping helpers if needed.
- Cover empty inventory, fixture happy bind/unbind, State switch row refresh, and no free-hex Mapping path in a matrix test; `npm test` / `npm run build` green. English UI strings.

**Never:**
- Invent Collect ObjectTypes in seed; canvas ↔ Sidebar selection sync / outline (4.3); live Object-type mock paint, LED fully-on, or mapping pulse (4.4).
- Free `#RRGGBB` on Mapping rows; per-instance overrides; Unbound export gate / Unbound pane list (Epic 5).
- Changing envelope / prefs schema, history coalescing (Epic 5), or Orchestrator zone ownership (4.1 canvas metadata).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Empty inventory | Seed (`objectTypes: []`) | No selectable Object types; empty Property list; no invented types | N/A |
| Happy bind | Fixture inventory; focus row → click Palette entry | Mapping upserted with that `paletteEntryId`; row shows swatch + id | N/A |
| Unbind | Focused bound row; clear | `paletteEntryId` → `null`; row shows Unbound marker + label | N/A |
| Unbound display | Missing mapping or null / dangling id | Warning marker + `Unbound` | N/A |
| State switch | Object type selected; change State | Property rows refresh; session `selectedStateId` updates | N/A |
| No free hex | Mapping value treated as `#RRGGBB` | UI offers Palette ids only; model stays id-or-null | Reject / ignore |

</frozen-after-approval>

## Code Map

- `src/sidebar/skin-pane.ts` — `[data-mappings-tab]` empty stub; mount mappings editor; keep Skin segment
- `src/sidebar/mappings-pane.ts` (new) — Object type, State, Property rows; session + mapping writes via `store.apply`
- `src/sidebar/palette-pane.ts` / selection controller — on Palette click, if a Mapping row is focused, upsert bind; do not move Palette CRUD
- `src/model/types.ts` — `Mapping` / inventory / session already correct; do not reshape
- `src/model/palette-helpers.ts` — reuse Unbound helpers; add `findMapping` / `upsertMapping` (pure)
- `src/model/opaque-hex.ts` — keep blocking hex-shaped mapping ids
- `src/chrome/index.ts` — context strip already reads Object/State; lights up from session writes
- `src/styles/base.css` — mapping-row / unbound / Object+State styles from existing tokens
- `src/seed/seed-data.ts` — leave `objectTypes: []` / empty mappings (KEEP_EMPTY)
- `scripts/skin-tab-matrix.test.mjs` — stop asserting empty mappings panel
- `scripts/mappings-matrix.test.mjs` (new) — I/O matrix with fixture inventory; wire in `package.json` `test`
- Do **not** change: canvas sync (4.3), live paint/pulse (4.4), envelope, history

## Tasks & Acceptance

**Execution:**
- [x] `src/model/palette-helpers.ts` (or sibling) -- find/upsert Mapping by `(objectTypeId, stateId, propertyId)` per Skin; Unbound = null -- AD-4 / FR-1
- [x] `src/sidebar/mappings-pane.ts` (new) + `src/sidebar/skin-pane.ts` -- Object type, State, Property rows; session + Skin.mappings via store; clear → Unbound -- FR-18 / UX-DR9 / ALLOW_UNBIND
- [x] `src/sidebar/palette-pane.ts` (and/or selection controller) -- ROW_THEN_PALETTE bind on Palette click when a row is focused -- UX-DR9
- [x] `src/styles/base.css` -- mapping-row / unbound marker / Object+State controls from tokens -- UX-DR9
- [x] `scripts/mappings-matrix.test.mjs` (+ update `skin-tab-matrix`; wire `package.json`) -- I/O matrix with fixture inventory -- edge coverage

**Acceptance Criteria:**
- Given the Mappings tab and loaded inventory types, when I choose Object type and State, then Property rows list that pair.
- Given a focused Property row, when I click a Palette entry, then the Skin stores that `paletteEntryId` only — never free `#RRGGBB`.
- Given a bound row, when I clear the binding, then the row returns to Unbound (`null`) with warning marker + label.
- Given type-level rules, when inspecting the UI, then there is no per-instance override path.
- Given a State change, when rows refresh, then they match the new pair and session State updates.
- Given mapping uniqueness, when two edits target the same triple on one Skin, then one Mapping entry remains.

## Implementation Notes

- Implemented: `findMapping` / `upsertMapping`; `mappings-pane.ts` + `mapping-focus.ts`; ROW_THEN_PALETTE via palette-pane; Clear → Unbound; seed inventory unchanged empty.
- Review patches: Skin-scoped focus clear; Clear only when bound; `bindFocusedMapping` false on rejected upsert; five matrix regressions.
- Verified: `npm test` 123 pass; `npm run build` green.

## Spec Change Log

## Review Triage Log

- `low` rejected — Sprint `in-progress` vs spec `in-review` mid-review: process timing only; sprint advances to `review` at present — not a product defect
- `false` — Spec Code Map still sounding pre-implementation: fix would edit this build’s spec (rejected by triage rules)
- `medium` patch — Sticky State path untested: Design Notes require keeping shared `selectedStateId`; added sticky State matrix case
- `false` — Clear without prior focus vs matrix “Focused bound row”: frozen ALLOW_UNBIND allows clear on focused/bound; Clear focuses then clears
- `medium` patch — Palette click with no focused row untested: added no-op matrix case (verification-gap)
- `medium` patch — Mapping focus not Skin-scoped: focus survived Skin switch and bound onto the new Skin — fixed clear on `activeSkinId` change / missing Skin + Skin-switch matrix
- `medium` patch — Clear on never-bound focused row upserted null Mapping: Clear only when `paletteEntryId != null`; onClear no-ops if absent/null
- `low` patch — `bindFocusedMapping` returned true on rejected hex upsert: now returns `applyMappingUpsert` boolean
- `low` rejected — `MappingTriple` vs `MappingFocusKey` duplication: unlikely everyday harm; unify would be a refactor
- `low` rejected — Hard-coded mapping CSS sizes / export-disabled tokens: cosmetic; everyday product harm unlikely
- `medium` patch — `activeSkinId` null while focus survives: grouped with Skin-scoped focus clear
- `low` rejected — `upsertMapping` leaves twin triples if input already duplicated: normal UI never creates duplicates
- `medium` defer — Session Object/State id missing from inventory: select shows dash while session/chrome keep stale ids — Collect/inventory shrink path; not everyday with KEEP_EMPTY seed
- `medium` patch — State switch did not assert focus clear / no bind to prior State: code already cleared focus; added matrix coverage (verification-gap)
- `medium` patch — Second Object type `knobLarge` never asserted Property rows: added matrix case (verification-gap)

## Design Notes

- Missing Mapping for an inventory Property reads as Unbound until first upsert; do not pre-seed empty rows for every Property.
- On Object type change: keep `selectedStateId` if still in that type’s `states[]`; else first state or `null`.
- Mock Object-type paint from mappings stays 4.4. Context strip Object/State update from session writes here. Canvas hits stay non-interactive until 4.3.

## Verification

**Commands:**
- `npm test` -- expected: all matrix scripts pass (including mappings coverage)
- `npm run build` -- expected: TypeScript/Vite build succeeds
