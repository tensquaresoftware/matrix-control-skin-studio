---
title: '3-2 Palette Create, Rename, and Referenced Delete'
type: 'feature'
created: '2026-10-16'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '594105043bfec1ef85753cd8f441fb50f6a8e3b6'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Operators can select and recolour Palette entries, but cannot create, rename, or delete them — so palette discipline cannot grow or shrink safely when a colour is still mapped.

**Approach:** Add Palette `+ Add` / `Delete…` (and rename) on the existing swatch list; create with a stable opaque id; rename keeps id stable and updates the display/`constantName` label; delete of a referenced id opens the delete-colour confirm that lists n→Unbound, then nulls those `paletteEntryId`s on confirm (never a hex substitute).

## Boundaries & Constraints

**Always:**
- Palette actions live under the swatch list as in the editor mockup: `+ Add` and `Delete…`. Mutate via the same single-writer path as picker recolour (`store.apply` with a cloned `project`); discrete create / rename / delete commits (no coalesce — Epic 5).
- **Create:** append a new `PaletteEntry` with a unique stable opaque `id` (not shown as the primary label once `constantName` exists), default opaque hex `#808080`, `constantName` `Colour {n}` with the smallest unused positive integer among existing `Colour {n}` labels; select the new entry so the Picker can edit it immediately.
- **Rename (Decision RENAME_AFFORDANCE = INLINE_ROW):** double-click the swatch-row label to edit in place. Id never changes; only the operator-facing label updates via `constantName` (create the field if missing). Empty/whitespace rename is rejected; restore the previous label. Single-click on the row still selects only.
- **Delete (referenced):** if any mapping across any Skin has `paletteEntryId ===` the target id, open one-deep modal-confirm before mutating. Microcopy (UX-DR13): title `Delete colour “{name}”?` (`{name}` = `constantName` else `id`); body `{n} mapping(s) will become Unbound:` + scrollable list; primary `Delete and unbind`; cancel `Cancel`. List line format: `{skin.displayName} · {objectTypeId} · {propertyId}` (include `stateId` only when needed to disambiguate). On confirm: remove the palette entry and set every matching mapping’s `paletteEntryId` to `null` — never write hex into mappings. Cancel: palette and mappings unchanged.
- **Delete (unreferenced):** no modal — remove the entry immediately. `Delete…` is disabled when nothing is selected.
- After delete, orphan selection must clear (existing `mountPalettePane` path); cover with a matrix case (deferred from 3-1).
- Reuse modal-confirm tokens / New-confirm pattern (scrim, destructive primary, Cancel). English chrome microcopy. Keep selection sidebar-local (not SessionUiState).
- Cover create, rename (id stable), referenced delete confirm/cancel/apply→Unbound, unreferenced delete, and selection-clear-after-delete in `scripts/palette-picker-matrix.test.mjs` (or a sibling matrix under `scripts/`). Keep `npm test` / `npm run build` green. Seed skins have empty mappings today — tests use fixtures with mappings that reference a palette id.

**Never:**
- Skin tab CRUD, Mapping bind UI, canvas preview paint, Export-gate / Unbound pane UI, Import/Export, undo/redo stack or hex coalesce (5-1).
- Silent hex substitute on delete; free `#RRGGBB` on Mapping paths; expanding SessionUiState.
- Stacked modals; changing envelope schema or seed v1 skin display names / Duo LED baseline entry content beyond what CRUD naturally allows (operators may still rename/delete seed entries if they choose — do not special-case protect Duo here; story 3.4 owns preserve-from-seed rules for create Skin).
- Implement full `deriveUnbound` (AD-10) — only null referenced mappings on confirm; Unbound pane remains later.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Create | Seed palette; click `+ Add` | New entry appended with unique `id`, hex `#808080`, `constantName` `Colour {n}`; selected; Picker targets it | N/A |
| Rename | Double-click row label; type `Accent` and commit | `constantName` becomes `Accent`; `id` and `hex` unchanged; row label updates | Empty/whitespace → reject, restore prior label |
| Delete unreferenced | Selected entry with zero mapping refs; `Delete…` | Entry removed; selection cleared; no modal | N/A |
| Delete referenced cancel | Entry referenced by ≥1 mapping; `Delete…` then `Cancel` | Modal lists n; after Cancel, palette + mappings unchanged | N/A |
| Delete referenced confirm | Same; confirm `Delete and unbind` | Entry removed; those mappings’ `paletteEntryId` are `null`; selection cleared; no hex written on mappings | N/A |
| Delete disabled | No selection; `Delete…` | Control disabled / no-op | N/A |
| Orphan selection | Select custom entry; remove it via delete (or store loses id) | Selection becomes null; Picker idle (no commit) | N/A |

</frozen-after-approval>

## Code Map

- `src/sidebar/palette-pane.ts` — `mountPalettePane` / `buildRow`; orphan-clear already present; extend with actions bar (`+ Add`, `Delete…`), create/delete mutations, inline double-click rename on row label; keep single-click = select
- `src/sidebar/palette-selection.ts` — `createPaletteSelection`; reuse; do not move selection into SessionUiState
- `src/sidebar/picker-pane.ts` — live hex only; leave untouched for this story
- `src/sidebar/index.ts` — already mounts palette + shared selection; pass-through only if new deps needed
- `src/chrome/new-confirm.ts` — pattern for one-deep scrim modal (`data-boot-confirm`); extract shared helper or add sibling `src/sidebar/palette-delete-confirm.ts` (prefer sibling over overloading New)
- `src/model/types.ts` — `PaletteEntry` `{ id, hex, constantName? }`; `Mapping.paletteEntryId: string | null`
- `src/model/store.ts` — `store.apply({ project })` clone-replace (same as picker)
- `src/seed/seed-data.ts` — `SEED_PALETTE` / empty skin mappings; do not rely on seed for referenced-delete happy path — use test fixtures
- `src/styles/base.css` — `--comp-modal-confirm-*`, `.boot-confirm-*`, palette swatch tokens; add palette-actions + delete-modal list styles consuming existing tokens
- `scripts/palette-picker-matrix.test.mjs` — extend (or sibling) for create/rename/delete I/O + orphan clear; reuse `mountWithProject` / jsdom harness
- UX refs: `mockups/delete-palette-modal.html`, `mockups/editor-main.html` (`+ Add` / `Delete…`), EXPERIENCE delete-colour row
- Do **not** change: picker HSV live path contract, SessionUiState keys, envelope hex-as-id reject, history stub, Skin combo, canvas paint

## Tasks & Acceptance

**Execution:**
- [x] `src/sidebar/palette-pane.ts` (+ optional `src/sidebar/palette-delete-confirm.ts`) -- Add/Delete actions; create + unreferenced delete; referenced delete modal + unbind; inline double-click rename; keep orphan-clear -- FR-13 / AD-16 / UX-DR13
- [x] `src/styles/base.css` -- palette-actions + delete-colour modal list styles from modal-confirm / palette tokens -- UX-DR2 / UX-DR11
- [x] `scripts/palette-picker-matrix.test.mjs` -- create, rename id-stable, unreferenced delete, referenced cancel/confirm→null, delete disabled, orphan selection clear -- I/O matrix / 3-1 defer

**Acceptance Criteria:**
- Given the Palette pane, when the operator adds an entry, then it appears with a stable unique id and is selected for Picker edit.
- Given a selected entry, when the operator renames it, then the id stays stable and the row label updates via `constantName`.
- Given a selected entry still referenced by mappings, when the operator deletes it, then the confirm lists n mappings and Cancel leaves everything unchanged; Confirm removes the entry and sets those mappings’ `paletteEntryId` to null with no hex substitute.
- Given a selected entry with no mapping refs, when the operator deletes it, then it is removed without the unbound modal.

## Implementation Notes

## Spec Change Log

## Review Triage Log

- `medium` — Swatch rows are `div role=button` without Enter/Space activation — verified: only `click` calls `onSelect` after button→div change — route patch
- `medium` — Inline rename wiped when `render` runs `list.replaceChildren` mid-edit — verified: no guard for `[data-palette-rename]` before rebuild — route patch
- `medium` — Delete confirm list lines under-asserted (format / stateId disambiguation) — verification-gap pre-verified — route patch
- `medium` — Confirm-delete fixture cannot catch nulling all mappings — verification-gap pre-verified — route patch
- `medium` — `Colour {n}` gap-fill / second add untested — verification-gap pre-verified — route patch
- `medium` — Title fallback to `id` when `constantName` missing untested — verification-gap pre-verified — route patch
- `low` — Cancel / Delete and unbind button labels never asserted — verification-gap pre-verified; trivial assert — route patch
- `low` — `OpenPaletteDeleteConfirmOptions.store` unused — verified: destructured away, never read — route patch (remove dead param)
- `low` rejected — `data-palette-delete-id` unused attribute — cosmetic dead attr; everyday harm none
- `low` rejected — `palette-delete-panel` class with no CSS — cosmetic unfinished class; everyday harm none
- `low` rejected — Escape-to-cancel rename untested — Escape path works; matrix already covers empty reject; extra case unlikely everyday
- `low` rejected — Delete confirm lacks focus trap / Escape / scrim dismiss — same pattern as New confirm; adding traps is branching complexity beyond a direct fix
- `false` — Sprint `in-progress` vs spec `in-review` — workflow tracking only; step-05 syncs sprint
- `false` — Empty Implementation Notes / Change Log / Triage at review start — process fill-in, not a product defect
- `false` — `crypto.randomUUID` throw without try/catch — when absent, `typeof` guard uses fallback; throw-when-present is not the supported Skin Studio boot path
- `medium` — Edge-case: Enter/Space on focused row (duplicate of keyboard finding) — same defect — route patch (grouped)
- `medium` — Edge-case: rename wiped by store/selection render (duplicate) — same defect — route patch (grouped)
- `low` rejected — Verification-gap other: unused store (already routed as low patch above)
