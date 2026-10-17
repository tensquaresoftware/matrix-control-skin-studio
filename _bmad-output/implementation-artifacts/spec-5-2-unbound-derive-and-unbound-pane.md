---
title: '5-2 Unbound Derive and Unbound Pane'
type: 'feature'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '059d8797850b4e5362b43d185f5671e4abf30a61'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-5-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Skin Studio already marks individual Mapping rows Unbound when a row is missing or unresolvable, but `deriveUnbound` only walks existing Mapping rows and sidebar pane 4 is an empty shell — so there is no project-total readiness count or clickable gap list for export prep.

**Approach:** Expand `model.deriveUnbound` to the AD-10 completeness set (every loaded inventory Property × Skin × ObjectType × State), mount pane 4 with a project-total `{n} unbound` badge and an active-Skin-filtered clickable list (row labels include State), and jump session focus to the gap on row click — leaving the hard Export gate to story 5-3.

## Boundaries & Constraints

**Always:**
- Sole Unbound math in `model/` (`deriveUnbound`); sidebar asks that derive — no second unbound scan in UI or `io/` (AD-10, AD-15).
- Required slots = every Inventory Property for each Skin × ObjectType × State in the **loaded** inventory; empty seed-placeholder inventory ⇒ 0 unbound (do not invent Collect ObjectTypes).
- A slot is Unbound if Mapping missing, `paletteEntryId` null, or Palette id deleted/unresolvable (`resolvePaletteHex` / `isMappingUnbound`).
- **Decision PANE_SCOPE = LIST_ACTIVE_BADGE_PROJECT:** badge `{n} unbound` uses **project-total** count; clickable list shows only hits for the **active Skin**; success copy `All required mappings bound` only when project-total is 0 (never when another Skin still has gaps).
- **Decision ROW_DISAMBIG = INCLUDE_STATE:** list rows read `{Object type} · {State} · {Property}` (middot separators).
- Row click jumps to Object type + State + Mapping row focus on the active Skin (AD-16); no Skin switch from the list (list is already active-Skin-scoped).
- When active Skin has no gaps but project-total > 0: badge stays visible with project total; list body empty — do **not** show the success copy.
- Session writes that change Object/State go through `history.execute` (story 5-1 path). English UI only.

**Never:**
- Hard Export gate, `export-disabled` tooltip, or `io/` packing (story 5-3).
- Reimplementing unbound math outside `model/`; inventing Collect inventory to “fill” SM-1.
- Showing success copy while any Skin still has unbound slots; treating the pane list as the export-readiness truth (badge / derive project-total is).
- Changing Mapping Palette-id-only paint/pulse contracts, splitter/prefs keys for the unbound pane shell, or history coalesce rules.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Empty inventory | Seed `objectTypes: []` | `deriveUnbound` → `[]`; success copy | N/A |
| Missing Mapping | Inventory slot with no Mapping row | Hit in derive; listed if active Skin | N/A |
| Null / dangling | Mapping exists, null or unresolvable id | Hit counted (same as missing) | N/A |
| Bound resolvable | Mapping id resolves to opaque hex | Not in derive list | N/A |
| Multi-skin total | Gaps on Black and Green; Black active | Badge = sum both; list = Black only | N/A |
| Active clear / others dirty | Active Skin 0 gaps; other Skin > 0 | Badge shows project n; list empty; no success copy | N/A |
| Orphan Mapping | Mapping triple outside loaded inventory | Not counted (inventory gate only) | N/A |
| Badge / empty | project n > 0 / n = 0 | `{n} unbound` badge vs success copy | N/A |
| Row label | Any listed hit | `{Object type} · {State} · {Property}` | N/A |
| Row click | Click listed hit (active Skin) | Session Object type + State set; Mapping focused; Mappings segment shown | N/A |
| Live update | Bind/unbind or switch Skin | Badge from project derive; list refilters to active Skin | N/A |

</frozen-after-approval>

## Code Map

- `src/model/palette-helpers.ts` — Expand `deriveUnbound` to inventory Cartesian product; reshape `UnboundHit` for missing rows (slot identity + skin fields; do not require a persisted Mapping). Keep `resolvePaletteHex` / `isMappingUnbound` / `findMapping`.
- `src/model/index.ts` — Re-export updated types/helpers; no second derive module.
- `src/sidebar/unbound-pane.ts` (new) — Mount pane 4: project-total badge, active-Skin-filtered rows (`Object · State · Property`), success copy only when project-total 0; click → session jump + `mappingFocus` + switch-to-Mappings (no Skin switch).
- `src/sidebar/index.ts` — Call `mountUnboundPane` on unbound body with store + `mappingFocus` + `selectionSync` (same wiring pattern as palette/skin).
- `src/sidebar/mapping-focus.ts`, `canvas-selection-sync.ts`, `skin-pane.ts` — Reuse focus + `setSwitchToMappings`; do not fork selection semantics.
- `src/history/index.ts` — Use existing `execute` for Object/State jump; no Skin `push: false` path from this pane.
- `src/styles/base.css` — Style badge/rows/empty using existing `--comp-unbound-pane-*` tokens (mock: `export-blocked.html`).
- `scripts/model-palette-helpers-matrix.test.mjs` — Update for inventory completeness (empty inventory ⇒ 0; fixture inventory covers missing/null/dangling/bound/orphan).
- `scripts/unbound-pane-matrix.test.mjs` (new) + `package.json` `test` — Badge project-total, list active-Skin filter, INCLUDE_STATE labels, click jump, live Skin-switch refilter; do not assert Export gate.
- Do **not** change: `src/io/` export gate, chrome Export control, seed inventory content (remain empty placeholder), Mapping paint/pulse.

## Tasks & Acceptance

**Execution:**
- [x] `src/model/palette-helpers.ts` (+ `index.ts`) -- Expand `deriveUnbound` / `UnboundHit` to inventory × Skin completeness; keep resolve helpers -- AD-10
- [x] `src/sidebar/unbound-pane.ts` + `src/sidebar/index.ts` + `src/styles/base.css` -- Mount Unbound pane (project badge, active-Skin list, INCLUDE_STATE rows, jump) -- UX-DR10 / AD-16 / PANE_SCOPE
- [x] `scripts/model-palette-helpers-matrix.test.mjs` + `scripts/unbound-pane-matrix.test.mjs` (+ `package.json`) -- Cover I/O matrix; adjust derive tests for empty inventory -- edge coverage

**Acceptance Criteria:**
- Given loaded inventory and skins, when `deriveUnbound` runs, then every required inventory slot without a resolvable Palette colour is listed exactly once (missing, null, or dangling), and slots outside inventory are ignored.
- Given the sidebar, when project-total unbound is n > 0, then pane 4 shows `{n} unbound` and lists only the active Skin’s rows as `{Object type} · {State} · {Property}`; when project-total is 0, then it shows `All required mappings bound` with no rows.
- Given an Unbound row click, when the hit encodes Object type / State / Property on the active Skin, then session selection and Mapping focus land on that gap and the Mappings segment is shown.

### Review Findings

- [x] [Review][Patch] Mount `{n} unbound` badge in Unbound pane head (not scrolling body) [`src/sidebar/unbound-pane.ts`, `src/sidebar/index.ts`]
- [x] [Review][Patch] Scroll focused Mapping row into view after Unbound jump [`src/sidebar/unbound-pane.ts`]
- [x] [Review][Patch] Assert `deriveUnbound` counts unreadable palette hex slots [`scripts/model-palette-helpers-matrix.test.mjs`]
- [x] [Review][Patch] Assert Unbound row-click Object/State is undoable via history [`scripts/unbound-pane-matrix.test.mjs`]
- [x] [Review][Patch] Assert live unbind restores badge/list from success copy [`scripts/unbound-pane-matrix.test.mjs`]

#### Rejected

- `low` rejected — Shared pane-head flex without badge host
- `false` — Sprint vs spec status mid-build
- `false` — Manual Verification fixture loader (would only edit this build’s spec)
- `low` rejected — Draft comment in palette-helpers matrix
- `low` rejected — `activeSkinId == null` matrix gap
- `false` — List/live-region a11y not in intent
- `low` rejected — Per-row warning dot vs mock
- `false` — Optional `selectionSync` unset path
- `false` — Duplicate inventory id dedupe

## Implementation Notes

- `deriveUnbound` walks Skin × inventory ObjectType × State × Property; `UnboundHit` is slot identity (no `Mapping` field).
- Pane 4: project-total badge in pane head, active-Skin list filter, INCLUDE_STATE labels, jump via `history.execute` + `mappingFocus` + `selectionSync.switchToMappings()` + `scrollIntoView`.
- Matrices: inventory completeness (incl. unreadable hex) + unbound-pane (badge/list/jump/undo/unbind/Skin refilter); seed inventory stays empty.
- Review patches: head badge; scroll on jump; hex/undo/unbind matrix coverage.

## Spec Change Log

## Review Triage Log

- `medium` — Badge mounted in scrolling pane body, not sticky pane head (mock) — verified `src/sidebar/unbound-pane.ts` appends badge to body; body `overflow: auto`
- `low` rejected — Shared `.sidebar-pane-head` flex without hosting badge: everyday harm negligible
- `medium` — Unbound jump never `scrollIntoView` focused Mapping row — verified `jumpToHit` vs mappings-pane canvas path
- `false` — Sprint `in-progress` vs spec `in-review`: expected mid-build tracking, not a product defect
- `false` — Manual checks lack in-app fixture loader: would only edit this build’s Verification section; seed empty is intentional
- `medium` — No UI assert for unbind/live return from success copy to badge/list — verified unbound-pane matrix covers bind-all + Skin switch only
- `medium` — `deriveUnbound` unreadable-hex slot untested after rewrite — VG pre-verified
- `low` rejected — Draft-style comment in palette-helpers matrix: cosmetic
- `low` rejected — `activeSkinId == null` with project unbound > 0 untested: empty skins ⇒ 0 hits; orphan id transient
- `false` — Missing list/live-region a11y: not required by story intent
- `low` rejected — Per-row warning dot vs mock: list/badge still locate gaps; denser chrome not needed for MVP
- `medium` — Edge: focused Mapping row below fold after Unbound jump — same as scrollIntoView finding
- `false` — Edge: `selectionSync` unset / switcher null: production `mountSidebar` always wires sync; optional API intentional
- `false` — Edge: duplicate inventory ids inflate hits: well-formed inventory assumed; Collect/seed do not emit duplicates
- `medium` — VG: Unbound row-click history/undo path unobserved — VG pre-verified

## Design Notes

- **Completeness set:** For each `skin` × each `inventory.objectTypes[]` × each `stateId` × each `propertyId`, resolve Mapping via `findMapping`; unbound when missing or `isMappingUnbound`. Do not walk `skin.mappings` as the outer loop (orphans outside inventory drop out).
- **Hit shape:** Prefer slot fields (`skinId`, `skinDisplayName`, `objectTypeId`, `stateId`, `propertyId`) over requiring a live `Mapping` object so missing rows stay first-class.
- **Pane filter:** UI filters `deriveUnbound(project)` by `session.activeSkinId` for rows only; never re-derive a second math path for “active only.”
- **Empty seed:** Product-truth inventory stays Collect-owned; matrices must inject fixture `objectTypes` to exercise non-zero unbound.
- **Export:** Story 5-3 hard gate reads the same project-total `deriveUnbound`; pane badge already mirrors that truth.

## Verification

**Commands:**
- `npm test` -- expected: all matrices green, including updated palette-helpers and new unbound-pane matrix
- `npx tsc --noEmit` -- expected: clean when used by the matrix harness

**Manual checks:**
- With fixture inventory and two skins gapped: badge shows sum; list shows only active Skin; switch Skin → list refilters; bind all → success copy; click a row → Mappings focuses that Object/State/Property
