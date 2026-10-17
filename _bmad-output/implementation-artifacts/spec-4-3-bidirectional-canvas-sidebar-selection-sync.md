---
title: '4-3 Bidirectional Canvas ↔ Sidebar Selection Sync'
type: 'feature'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'cac5123ca276bd02e3ed4ca264c5acd5c4f4e1e9'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Mock Object-type hit regions stay inert and the canvas never outlines the session Object type, so operators cannot click the mock to drive Mappings selection or see Sidebar Object type reflected on the mock.

**Approach:** Wire bidirectional selection through existing `SessionUiState`: canvas hit click selects Object type without resetting State; Sidebar Object type selection outlines matching hit region(s); Mapping rows scroll/highlight per the frozen decisions below; context strip already follows session.

## Boundaries & Constraints

**Always:**
- Selection source of truth remains `SessionUiState.selectedObjectTypeId` / `selectedStateId` via `store.apply` (same path as Mappings Object/State controls). Canvas click must **not** reset State when the new type still lists the current State (reuse `resolveStateAfterTypeChange` semantics from 4-2).
- Hit regions only for types in the **loaded** inventory (`listObjectTypeHitRegions`); empty inventory → zero interactive hits. Do not invent Collect types.
- Selected mock hit: 2px chrome selection outline (`--comp-canvas-selection-outline*`), transparent fill (`--comp-canvas-selection-fill`). Unselected hits keep transparent outline.
- Hit click must not start canvas pan (`stopPropagation` on the hit’s pointer path).
- Canvas paint/subscribe must reflect session Object type (re-apply selected class after mock rebuild is OK; do not pull the deferred narrow-repaint refactor unless required for this AC).
- Context strip Object/State continue to read session (already wired). English UI only.
- **Decision CANVAS_SELECT_SEGMENT = AUTO_MAPPINGS:** Object-type hit click switches pane 3 to the Mappings segment so Mapping row(s) can scroll/highlight into view.
- **Decision CANVAS_ROW_FOCUS = HIGHLIGHT_SCROLL_ONLY:** canvas-driven path scrolls/highlights Mapping row(s) with muted accent and does **not** set MappingFocus — Palette bind stays an explicit Property-row click (ROW_THEN_PALETTE).

**Never:**
- Mapping pulse, live Object-type colour paint, or LED fully-on preview (4.4).
- Free hex on Mapping path; inventing inventory; Orchestrator zones as ObjectTypes; changing pan/Zoom prefs model.
- Unbound export gate / history (Epic 5).
- Setting MappingFocus from a canvas hit click (would enable accidental Palette binds).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Canvas → type | Fixture inventory; State already set; click hit | `selectedObjectTypeId` = hit id; State kept if still valid; switch to Mappings; row(s) highlight/scroll; no MappingFocus; context strip updates | N/A |
| Sidebar → outline | Select Object type in Mappings | Matching hit gets selected outline; other hits not | N/A |
| Empty inventory | Seed `objectTypes: []` | No hits; no click selection path | N/A |
| Missing hit | Session type not in inventory / no region | No outline; Sidebar/session unchanged by canvas | N/A |
| Pan intact | pointerdown on empty mock / host (not on hit) | Pan still starts | N/A |
| Same type re-click | Click already-selected hit | Session unchanged; still switch to Mappings + scroll/highlight; no MappingFocus | N/A |
| Skin tab + click | Pane 3 on Skin; click hit | Segment switches to Mappings; then highlight/scroll as above | N/A |

</frozen-after-approval>

## Code Map

- `src/canvas/index.ts` — hit DOM already built; wire click → session; apply `.is-selected` (or equivalent) from `session.selectedObjectTypeId` inside paint; stopPropagation so `wirePanInteractions` does not pan
- `src/canvas/mock-layout.ts` — reuse `listObjectTypeHitRegions`; do not turn Orchestrator zones into ObjectTypes
- `src/styles/base.css` — `--comp-canvas-selection-outline*` / fill already reserved; selected hit uses accent outline colour; interactive `cursor` on hits; keep pan grab on host; muted accent for canvas-driven Mapping row highlight (distinct from or shared carefully with `.is-focused`)
- `src/sidebar/mappings-pane.ts` — Object type → session already; on canvas-driven Object-type selection, scroll/highlight Property row(s) without MappingFocus; share `resolveStateAfterTypeChange` for canvas path
- `src/sidebar/skin-pane.ts` — expose switch-to-Mappings for AUTO_MAPPINGS (today `setSegment` is local)
- `src/sidebar/mapping-focus.ts` — MappingFocus remains bind-path only; canvas must not call `setFocused`
- `src/chrome/index.ts` — context strip already syncs Object/State; do not reshape SessionUiState
- `src/model/types.ts` / store — reuse; no new session keys
- `scripts/canvas-mock-matrix.test.mjs` and/or `scripts/mappings-matrix.test.mjs` (+ `package.json` if new file) — matrix: canvas→session+State sticky, AUTO_MAPPINGS, HIGHLIGHT_SCROLL_ONLY (no focus), sidebar→outline, empty inventory, pan not stolen
- Do **not** change: zone Palette paint ownership (4.1), Mapping CRUD/bind (4.2), pulse/live paint (4.4)
- Deferred narrow `replaceChildren` repaint stays out unless selection outline cannot meet AC without it; preferred: re-stamp selected class after each paint

## Tasks & Acceptance

**Execution:**
- [x] `src/canvas/index.ts` (+ CSS) -- interactive hits: click → session Object type (State sticky); selected outline from session; no pan steal -- FR-5 / UX-DR12
- [x] `src/sidebar/mappings-pane.ts` + `src/sidebar/skin-pane.ts` -- AUTO_MAPPINGS switch; HIGHLIGHT_SCROLL_ONLY (no MappingFocus); share State-sticky helper -- FR-5
- [x] `scripts/*-matrix.test.mjs` (+ wire `package.json` if needed) -- I/O matrix coverage with fixture inventory -- edge coverage

**Acceptance Criteria:**
- Given the mock and Mappings tab, when I click an Object-type region, then that Object type is selected and corresponding Mapping row(s) highlight/scroll into view without resetting State.
- Given I choose an Object type in the Sidebar, when a matching mock region exists, then it shows the 2px accent selection outline with transparent fill.
- Given session Object/State change from either side, when the context strip renders, then Object/State readouts match session.

## Implementation Notes

- Added `createCanvasSelectionSync` bridge (chrome → canvas + sidebar) for AUTO_MAPPINGS + HIGHLIGHT_SCROLL_ONLY without MappingFocus.
- Extracted `resolveStateAfterTypeChange` to `src/model/session-helpers.ts` for shared sticky-State semantics.
- Hit outline re-applied after full mock rebuild from session; narrow-repaint still deferred.
- Matrix: `scripts/selection-sync-matrix.test.mjs` wired in `package.json` `test`.

## Spec Change Log

## Review Triage Log

- `false` — Same muted bg for `.is-canvas-highlighted` and `.is-focused`: Code Map allows shared carefully; HIGHLIGHT_SCROLL_ONLY is semantic (no MappingFocus), not a separate colour token
- `false` — `--comp-canvas-selection-fill` unused on selected hit: chip background already transparent; CSS comment documents fill stays transparent
- `low` rejected — Missing `aria-selected`/`aria-pressed` on hits: unlikely everyday harm for inventory chip labels; a11y attrs would add surface without product ask
- `false` — Hit keyboard focus invisible: global `[tabindex]:not([tabindex='-1']):focus-visible` already paints focus ring
- `medium` patch — Canvas hit path never asserts non-sticky State fallback (`resolveStateAfterTypeChange` → first State)
- `medium` patch — Enter/Space hit activation wired but untested in selection-sync matrix
- `low` patch — Same-type re-click does not assert `scrollIntoView` again
- `false` — Orphan `createCanvasSelectionSync` when `selectionSync` omitted: chrome always passes the shared bridge; product path is wired
- `low` rejected — Sync setters uncleared on unmount: remount/detach not an everyday operator path
- `false` — Leftover `InventoryObjectType` import: still used by `resolveObjectType` in mappings-pane
- `false` — notify after inventory removes hit id: paint rebuilds hits from current inventory; stale hit DOM is not reachable via store updates
- `medium` patch — `canvasHighlightActive` not cleared when active Skin is null inside `renderPropertyRows`; flag can stick and highlight later without a new canvas hit
- `low` patch — Held Enter/Space `keydown` repeats can re-fire `notifyCanvasHit` without `event.repeat` guard
- `false` — Claim “without resetting State” overstated vs fallback: frozen Always require sticky-when-valid via `resolveStateAfterTypeChange` (fallback to first State is intended)
- `medium` patch — AUTO_MAPPINGS-before-highlight order in `notifyCanvasHit` unpinned by matrix (swap would still pass)

## Design Notes

- Seed inventory stays empty (KEEP_EMPTY from 4-2); tests inject fixture ObjectTypes — same pattern as mappings/canvas matrices.
- Steady selection outline can be re-applied after full mock rebuild; leave deferred narrow-repaint for 4.4 pulse stability unless AC fails.
- Do not treat Orchestrator zone bands as selectable Object types.

## Verification

**Commands:**
- `npm test` -- expected: all matrix scripts pass (including selection-sync coverage)
- `npm run build` -- expected: TypeScript/Vite build succeeds
