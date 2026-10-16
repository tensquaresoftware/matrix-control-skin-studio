---
title: '3-3 Skin Tab — Rename, Duplicate, Delete'
type: 'feature'
created: '2026-10-16'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'af6bb8710b12e68d1c178c4b23c6677f617edc44'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Sidebar pane 3 is still an empty “Mappings / Skin” shell — operators can switch skins from the top-bar combo but cannot rename, duplicate, or delete a Skin identity from the Skin tab.

**Approach:** Mount pane 3 with segmented `[Mappings | Skin]` (Mappings default); on Skin, operate on the active Skin (`session.activeSkinId`) with a name field plus Duplicate / Delete — delete always confirms; duplicate clones mappings under a new opaque id; the Skin combo refreshes from `project.skins`.

## Boundaries & Constraints

**Always:**
- Pane 3 hosts segmented `[Mappings | Skin]` (Mappings default). Skin tab layout follows the UX ascii spine: `Skin name:` text field bound to the active Skin’s `displayName`; buttons `Duplicate Skin` and `Delete Skin…`; optional short type-level-only reminder. No layers tree, mode pills, or per-instance override UI (AD-11 / UX-DR6 / FR-14 / FR-6).
- **Target Skin = `session.activeSkinId`.** No second Skin selection in the tab. When `activeSkinId` is null or missing from `project.skins`, disable Duplicate / Delete and leave the name field empty/disabled (chrome already clears stale active ids).
- **Rename:** editing the name field commits `displayName` on blur or Enter; id stays stable. Empty/whitespace rename is rejected and the prior `displayName` is restored. Mutate via `store.apply({ project })` discrete commit (same single-writer clone path as Palette CRUD — no coalesce).
- **Decision DUPLICATE_NAME = SUFFIX_PAREN:** duplicate `displayName` is `{source.displayName} (copy)` (e.g. `Black/Green` → `Black/Green (copy)`).
- **Decision DUPLICATE_ACTIVATES = SELECT_NEW:** after duplicate, set `session.activeSkinId` to the new Skin’s `id` in the same apply (or immediately after) so the tab and combo show the copy.
- **Decision LAST_SKIN_DELETE = ALLOW_EMPTY:** deleting the last Skin is allowed after confirm; `project.skins` may become `[]` and chrome clears `activeSkinId`.
- **Duplicate:** append a new `Skin` with a unique opaque `id` (reuse palette-style `crypto.randomUUID` + collision loop / fallback), `displayName` per DUPLICATE_NAME, and a deep copy of the source Skin’s `mappings` (new array/objects; same `paletteEntryId` values). Combo must list the new Skin; activate per DUPLICATE_ACTIVATES.
- **Delete:** always open one-deep confirm before mutating. Microcopy (UX-DR13): body `Delete skin “{name}”? This cannot be undone.` (`{name}` = `displayName`). Primary destructive confirm + `Cancel`. Cancel = no change. Confirm removes that Skin from `project.skins`; existing chrome `syncSkinFromStore` clears a stale `activeSkinId`. Last skin allowed per LAST_SKIN_DELETE.
- **Mappings tab in this story:** stub only — empty body (no Object/State/mapping rows). Epic 4 owns Mapping bind UI. Segmented control must still switch tabs.
- Segment active tab is sidebar-local UI state (not SessionUiState). English chrome microcopy. Reuse `boot-confirm-*` modal tokens (sibling helper preferred over overloading New confirm).
- Cover rename (id stable), duplicate (new id + mappings copy + combo), delete cancel/confirm, no-active disabled, and segmented default in a Node matrix under `scripts/` (new sibling e.g. `skin-tab-matrix.test.mjs`). Keep `npm test` / `npm run build` green.

**Never:**
- Create Skin affordance (Story 3.4). Mapping bind UI, canvas preview paint, Export-gate / Unbound pane, Import/Export, undo/redo stack / hex coalesce (5-1).
- CRUD on the top-bar Skin combo (switcher only). Expanding SessionUiState keys. Per-instance colour overrides. Stacked modals. Changing envelope schema or seed v1 display-name list beyond what rename/duplicate/delete naturally allow.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Open Skin tab | Seed project; active Skin set; switch segment to Skin | Name field shows active `displayName`; Duplicate / Delete enabled | N/A |
| Rename | Edit name to `Night/Green`; blur or Enter | Active Skin `displayName` updates; `id` unchanged; combo + context strip update | Empty/whitespace → restore prior name |
| Duplicate | Active Skin with N mappings (fixture); Duplicate Skin | New Skin appended; unique `id`; mappings deep-copied; `displayName` ends with ` (copy)`; combo lists it; `activeSkinId` = new id | N/A |
| Delete cancel | Delete Skin… then Cancel | Modal closes; `project.skins` unchanged | N/A |
| Delete confirm | Delete Skin… then confirm | Skin removed; combo options refresh; if deleted was active, `activeSkinId` becomes null (existing chrome path) | N/A |
| No active Skin | `activeSkinId` null; Skin tab | Name empty/disabled; Duplicate / Delete disabled | N/A |
| Segment default | Mount pane 3 | Mappings segment selected; Skin body hidden until Skin chosen | N/A |
| Last skin | Only one Skin left; Delete… then confirm | Skin removed; `skins` empty; combo empty; `activeSkinId` null | N/A |

</frozen-after-approval>

## Code Map

- `src/sidebar/index.ts` — `mountSidebar`; pane 3 body empty today; mount new mappings/skin host when `store` provided; keep splitter/prefs contracts
- `src/sidebar/skin-pane.ts` (new) — segmented control + Skin tab UI (name field, Duplicate, Delete); subscribe to store; mutate `project.skins` / optionally `session.activeSkinId`
- `src/sidebar/skin-delete-confirm.ts` (new, preferred) — one-deep delete confirm reusing `boot-confirm-*` classes; body microcopy UX-DR13
- `src/chrome/index.ts` — `buildSkinCombo` / `syncSkinFromStore` already rebuilds options from `project.skins` and clears stale `activeSkinId`; do not add CRUD here — verify via matrix after delete/duplicate
- `src/chrome/new-confirm.ts` — pattern reference only; do not overload New with Skin delete
- `src/model/types.ts` — `Skin` `{ id, displayName, mappings }`; `SessionUiState.activeSkinId`
- `src/model/store.ts` — `store.apply({ project?, session? })` structuredClone path
- `src/seed/seed-data.ts` — five seed skins, empty mappings; tests that need mappings use fixtures
- `src/styles/base.css` — add segmented + Skin-tab field/button styles from DESIGN tokens / mock `.seg`; reuse modal-confirm tokens
- `scripts/skin-tab-matrix.test.mjs` (new) — I/O matrix cases; follow `palette-picker-matrix.test.mjs` harness
- UX refs: ascii Skin tab in `.working/ascii-chrome-simulations.md`; EXPERIENCE delete-skin copy; mock `editor-main.html` `.seg` visual
- Do **not** change: Palette/Picker panes, SessionUiState shape, envelope schema, history stub, Mapping bind UI, Create Skin (3.4)

## Tasks & Acceptance

**Execution:**
- [x] `src/sidebar/skin-pane.ts` (+ `src/sidebar/skin-delete-confirm.ts`) -- Segmented pane; rename / duplicate / delete on active Skin; wire delete confirm -- FR-14 / AD-11 / UX-DR13
- [x] `src/sidebar/index.ts` -- Mount mappings/skin host into pane 3 when store present -- AD-11
- [x] `src/styles/base.css` -- Segmented + Skin-tab styles from tokens / mock `.seg` -- UX-DR2 / UX-DR6
- [x] `scripts/skin-tab-matrix.test.mjs` -- Rename id-stable, duplicate mappings+id, delete cancel/confirm, no-active disabled, segment default, last-skin policy -- I/O matrix

**Acceptance Criteria:**
- Given pane 3, when the operator opens the Skin tab, then they can rename, duplicate, and delete the active Skin only — no per-instance overrides UI.
- Given an active Skin, when the operator duplicates it, then mappings copy into a new Skin identity and the Skin combo lists the new Skin.
- Given an active Skin, when the operator deletes it, then confirm always appears; Cancel leaves the Skin unchanged; Confirm removes it from the project and the combo updates.
- Given the delete confirm, when it opens, then the body reads `Delete skin “{name}”? This cannot be undone.`

## Implementation Notes

## Spec Change Log

## Review Triage Log

- `medium` — Rename commits against `resolveActiveSkin()` at blur, not the id focused — verified: `commitRename` re-resolves active id; combo change mid-edit can rename another Skin — route patch
- `medium` — Edge-case: activeSkinId changes while name focused (same defect) — verified: same `commitRename` path — route patch (grouped)
- `medium` — Stale `activeSkinId` (id missing from skins) untested — verification-gap style; code disables via `find ?? null` but matrix only covers null — route patch
- `medium` — Mappings stub emptiness never asserted — verification-gap pre-verified — route patch
- `low` deferred — Delete confirm double-open guard untested — verification-gap disposition defer; single-open paths covered
- `false` — Duplicate yields identical `(copy)` labels — Decision DUPLICATE_NAME = SUFFIX_PAREN does not require unique displayNames
- `low` rejected — Incomplete ARIA tabs (aria-controls / arrow keys) — full tab pattern is branching complexity beyond a direct fix; everyday keyboard still clicks segments
- `low` rejected — `.skin-seg-btn` hardcodes `font-size: 12px` — cosmetic; retokenizing adds churn
- `false` — Spec Code Map still says pane 3 empty — finding whose fix edits this build’s spec
- `low` rejected — Escape rename cancel untested — Escape is extra UX; blur/Enter matrix already covers commit/reject
- `low` rejected — Fixed global `id="skin-tab-name"` — single sidebar host in Skin Studio; remount collision unlikely everyday
- `false` — Sprint `in-progress` vs spec `in-review` — workflow tracking; step-05 syncs sprint
- `false` — Empty Implementation Notes / Change Log / Triage at review start — process fill-in, not a product defect
- `low` rejected — Delete confirm lacks Escape / scrim dismiss — same pattern as New / Palette confirm
- `low` rejected — Modal stale if Skin disappears while open — rare; Cancel still closes without mutate

### Review Findings

- [x] [Review][Patch] Rename commits against active Skin at blur, not the id captured on focus [src/sidebar/skin-pane.ts]
- [x] [Review][Patch] Matrix never asserts stale activeSkinId (set but missing from skins) [scripts/skin-tab-matrix.test.mjs]
- [x] [Review][Patch] Matrix never asserts Mappings stub stays empty [scripts/skin-tab-matrix.test.mjs]
- [x] [Review][Defer] Delete confirm double-open guard untested [src/sidebar/skin-delete-confirm.ts] — deferred: single-open paths covered

## Verification

**Commands:**
- `npm test` -- expected: all matrix suites pass including new skin-tab cases
- `npm run build` -- expected: TypeScript / Vite build succeeds
