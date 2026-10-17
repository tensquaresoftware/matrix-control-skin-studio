---
title: '5-4 Import Replace-All with Fail-Closed formatVersion'
type: 'feature'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'a1c98b3c2ab44687d3abadfa4f2929a106ec2b7c'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-5-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Import is still an inert top-bar stub — Skin Studio can export a project JSON (5-3) but cannot reload one safely, so operators cannot round-trip work without silent partial loads or accidental wipe.

**Approach:** Wire Import to a file picker plus `io/` project-only parse/validate: supported `formatVersion` `1` opens a strong replace-all confirm, then replaces the live project; unknown or newer `formatVersion` fails closed with the pinned English error and never mutates. Prefs (Zoom/pan) stay untouched.

## Boundaries & Constraints

**Always:**
- Import accepts a **project-only** JSON document (export shape: `formatVersion`, `palette`, `skins`, `inventory`) — not the autosave envelope `{ project, session }`.
- Supported `formatVersion` is exactly `1` (writer pin). Unknown, missing, or newer → fail closed; no partial silent load (FR-21 / AD-9).
- Fail-closed copy (exact): `Import failed — this file uses an unsupported format version.`
- Before replace-all, confirm modal (UX-DR11) with exact body: `Replace the current project with this file? Unsaved browser state will be overwritten.` Cancel = no store mutation.
- Successful confirm replaces the project document via `store.apply`; Zoom/pan prefs are never read or written by Import.
- Flow: pick file → read → validate in `io/` → on version failure show error **without** confirm; on valid v1 → confirm → apply. One modal deep.
- Chrome owns the Import control + file picker + confirm glue; `io/` owns parse/validate (and parse error classification). English UI only.
- Reuse existing `boot-confirm-*` modal CSS; primary confirm is destructive-styled; buttons `Cancel` / `Import`.
- On successful import: dismiss sibling delete confirms (same as New) before apply.
- **Decision ERROR_SURFACE = MODAL_ACK:** fail-closed and malformed errors use a one-deep scrim + panel with a single OK (same visual family as confirms); not `alert()`, not inline top-bar status.
- **Decision POST_IMPORT_STATE = MIRROR_NEW:** on successful confirm, `store.apply({ project, session: createEmptySession() })` then `clearHistory(store)` — same as New.
- **Decision MALFORMED_COPY = DISTINCT_INVALID:** non-JSON, envelope, or shape-invalid documents use exact copy `Import failed — this file is not a valid Skin Studio project.` (version failures keep the unsupported-format-version sentence).

**Never:**
- Merge / re-map import (Soon FR-28).
- Changing Export gate, `serializeProject`, Unbound derive/pane, history coalesce rules, or prefs persistence APIs.
- Routing import through `parseEnvelope` (envelope ≠ handoff document).
- Soft-allow unknown/newer versions; inventing Collect inventory; including session/prefs in the import file contract.
- Stacking a second confirm/error modal over an open one.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Happy path | Valid `formatVersion: 1` project JSON | Confirm → on Import: project + empty session applied; history cleared; prefs unchanged | N/A |
| Cancel | Valid v1 file, Cancel on confirm | Store unchanged; prefs unchanged | N/A |
| Unsupported version | Missing / non-1 / newer `formatVersion` | No confirm; project unchanged; MODAL_ACK with unsupported-version copy | Exact unsupported-version string |
| Envelope file | `{ project, session }` JSON | Treated as invalid project document (not supported handoff) | MODAL_ACK + DISTINCT_INVALID copy |
| Non-JSON / unreadable | Corrupt text | Project unchanged; no silent load | MODAL_ACK + DISTINCT_INVALID copy |
| Malformed v1 | `formatVersion: 1` but bad shapes | Project unchanged; no partial apply | MODAL_ACK + DISTINCT_INVALID copy |
| Prefs isolation | Any import outcome | `zoomStep` / `panXY` storage untouched | N/A |

</frozen-after-approval>

## Code Map

- `src/io/index.ts` — Add `parseProjectDocument(raw) → { ok, project } | { ok: false, reason }` (or equivalent): JSON parse + fail-closed `formatVersion` gate + project-shape checks aligned with export fields; do **not** accept envelope wrappers. Keep existing export/gate APIs unchanged.
- `src/persist/envelope.ts` — **Reuse ideas only** (`formatVersion === 1`, palette/skins/inventory lean checks, mapping id-or-null). Do not call `parseEnvelope` for Import; do not export private helpers unless a tiny shared validator is justified without widening persist surface.
- `src/chrome/index.ts` — Replace `inertButton('Import')` with live Import: hidden `<input type="file" accept=".json,application/json">`, click → pick → read text → `io` validate → confirm or error. Remove `data-chrome-inert="import"`.
- `src/chrome/import-confirm.ts` (new) — One-deep replace-all confirm (`data-import-confirm`) plus MODAL_ACK error helper (OK only); confirm → dismiss delete confirms → `store.apply({ project, session: createEmptySession() })` → `clearHistory(store)` → close.
- `src/chrome/dismiss-project-confirms.ts` — Register Import confirm / error selectors so New/Import/deletes stay one-deep and dismissable together where appropriate.
- `src/chrome/new-confirm.ts` / `src/seed/index.ts` / `src/history/index.ts` — **Pattern only**: New’s `apply` + `clearHistory`; Import applies parsed project + empty session instead of seed. Do not change New copy or seed path.
- `src/model/types.ts` / `src/model/empty-project.ts` — `ProjectDocument` shape; `createEmptySession` for MIRROR_NEW.
- `src/persist/` prefs — **Do not** call `loadPrefs`/`savePrefs` from Import success/fail paths.
- `scripts/io-export-matrix.test.mjs` (extend or sibling `io-import-matrix`) — Cover matrix: v1 round-trip parse, unsupported version, envelope reject, malformed, serialize↔parse symmetry for valid docs.
- `scripts/chrome-shell-matrix.test.mjs` — Drop always-inert Import asserts; cover live Import, cancel, confirm replace, prefs untouched, fail-closed copy surface.
- Do **not** change: Export hard gate, Unbound pane, history coalesce, Collect merge.

## Tasks & Acceptance

**Execution:**
- [x] `src/io/index.ts` -- Add project-only parse/validate with fail-closed `formatVersion` -- FR-21 / AD-9
- [x] `src/chrome/import-confirm.ts` + `src/chrome/dismiss-project-confirms.ts` + `src/chrome/index.ts` -- Live Import: file picker, confirm, apply, error surface -- UX-DR11 / UX-DR13
- [x] `scripts/io-export-matrix.test.mjs` (or import sibling) + `scripts/chrome-shell-matrix.test.mjs` + `package.json` if needed -- Cover I/O matrix and chrome Import wiring -- edge coverage

**Acceptance Criteria:**
- Given a JSON file with supported `formatVersion` `1`, when the operator Imports and confirms, then the project document is replaced and Zoom/pan prefs remain unchanged.
- Given a JSON file with supported `formatVersion` `1`, when the operator cancels the confirm, then the current project is unchanged.
- Given unknown or newer `formatVersion`, when the operator Imports, then import fails closed with `Import failed — this file uses an unsupported format version.` and no partial load.
- Given merge/re-map behavior, when Import succeeds or fails, then no merge path exists (Soon FR-28 stays out).

### Review Findings

- [x] [Review][Patch] Replace Import confirm/error scrims on second pick (no early-return stale confirm) [`src/chrome/import-confirm.ts`]
- [x] [Review][Patch] Assert Import confirm dismisses open Skin delete confirm [`scripts/chrome-shell-matrix.test.mjs`]
- [x] [Review][Patch] Assert New↔Import mutual one-deep dismissal [`scripts/chrome-shell-matrix.test.mjs`]
- [x] [Review][Patch] Assert file.text() reject → DISTINCT_INVALID MODAL_ACK [`scripts/chrome-shell-matrix.test.mjs`]
- [x] [Review][Patch] Ignore stale Import reads with a generation token (verified race) [`src/chrome/index.ts`]
- [x] [Review][Patch] Assert second Import pick replaces open confirm/error and binds latest project [`scripts/chrome-shell-matrix.test.mjs`]
- [x] [Review][Patch] Assert hidden Import file input value cleared after pick [`scripts/chrome-shell-matrix.test.mjs`]
- [x] [Review][Patch] Assert Import confirm dismisses open Palette delete confirm [`scripts/chrome-shell-matrix.test.mjs`]
- [x] [Review][Patch] Assert Zoom/pan prefs untouched on Import fail-closed / malformed paths [`scripts/chrome-shell-matrix.test.mjs`]
- [x] [Review][Patch] Strip UTF-8 BOM before project JSON parse [`src/io/index.ts`]

**Rejected**
- `false` — Lean validation depth (skin.id / mapping keys / inventory entries): intentional envelope-parity lean gate
- `false` — Missing formatVersion → unsupported-version (not DISTINCT_INVALID): matrix “Missing / non-1 / newer”
- `false` — Import open does not dismiss deletes: parity with New (dismiss on confirm only)
- `false` — Autosave envelope unasserted after Import: apply + attachAutosave covered; prefs isolation is the Import contract
- `low` rejected — Hidden file input outside shell tree: remount layout
- `false` — `dismissProjectConfirms` unused by callers: re-export helper; live one-deep uses targeted removes
- `false` — Spec `status: done` vs sprint `review`: expected mid-review tracking; not a product defect
- rejected (edit-spec) — AC text omits DISTINCT_INVALID / envelope rows already in frozen matrix
- rejected (edit-spec) — empty Spec Change Log heading
- `low` rejected — Import copy redeclared in chrome matrix: everyday drift unlikely; pins already exported
- `false` — Envelope gate requires both `project` and `session` keys: intentional handoff vs autosave matrix
- rejected (edit-spec) — Manual verification list omits Cancel / envelope / unreadable paths already in matrix

## Implementation Notes

- `io/`: `parseProjectDocument` — reject envelope keys, fail-closed non-1 `formatVersion`, lean shape checks; export APIs unchanged.
- `chrome/`: live Import + hidden file input; `import-confirm.ts` confirm + MODAL_ACK error; New/Import dismiss each other for one-deep; MIRROR_NEW apply + `clearHistory`; second pick replaces prior Import scrim.
- Matrices: `io-import-matrix` + chrome Import confirm/cancel/fail-closed/delete-dismiss/New mutual/read-fail; `npm test` 219/219 green.
- Review patches: dismissImportScrims before open; chrome asserts for delete dismiss, New↔Import one-deep, file.text() reject.
- Review pass 2: importPickGeneration ignores stale reads; BOM strip; second-pick / palette-delete / prefs-on-fail / file-input clear asserts; stale-vs-newer pick race test.


## Spec Change Log

## Review Triage Log

- `medium` — Import confirm/error early-return when the other Import scrim is open — verified `src/chrome/import-confirm.ts:28-30` / `88-90`: second pick no-ops; stale confirm can still apply
- `medium` — Second file pick while Import confirm open keeps stale captured project — verified same early-return + confirm closes over first `project` param
- `false` — Lean validation omits skin.id / mapping keys / inventory entry shape — Code Map + envelope parity intentionally lean; frozen matrix “bad shapes” covered by palette/mappings/array checks already tested
- `false` — inventory.objectTypes `[null]` accepted — same lean gate as persist envelope; not a 5-4 deviation
- `false` — No unknown-key stripping on parse — export/import round-trip keeps document fields; deep sanitize out of scope
- `false` — `{}` classified unsupported-format-version — matrix row “Missing / non-1 / newer”; missing `formatVersion` is the version path by design
- `false` — Import open does not dismiss delete confirms — Always requires dismiss on successful confirm only (parity with New); delete+Import-open stacking matches New
- `false` — Chrome does not assert autosave envelope after Import — `store.apply` + attachAutosave already covered elsewhere; prefs isolation asserts are the Import contract
- `medium` — No chrome coverage for `readPickedFileText` rejection → DISTINCT_INVALID MODAL_ACK — verified catch at `src/chrome/index.ts:246-251`; pick helpers always resolve `text()`
- `low` rejected — Hidden file input sibling of shell — intentional remount layout; everyday risk negligible
- `medium` — EC: valid parse while error open dropped — same early-return as first medium
- `medium` — EC: failed parse while confirm open dropped — same early-return / stale confirm
- `maybe-false` — Overlapping async change handlers race — native picker usually serial; would need concurrent synthetic change events to settle
- `medium` — EC: new pick while prior Import modal open ignored — same root as stale-modal medium
- `false` — EC: skin missing id/displayName — lean validation intentional
- `false` — EC: mapping missing objectTypeId/stateId/propertyId — lean validation intentional
- `false` — EC: inventory objectTypes entries unshaped — lean validation intentional
- `medium` — VG: Import confirm never asserts sibling delete dismiss — pre-verified; New has parallel crossflow assert, Import does not
- `medium` — VG: New↔Import mutual one-deep dismissal untested — pre-verified; openers clear each other but no matrix case
- `medium` — VG: file-read failure → MODAL_ACK untested — pre-verified; same as read-failure medium above
- `false` — VG other: `dismissProjectConfirms` unused by callers — re-export helper; live one-deep uses targeted removes

## Design Notes

- **Handoff ≠ autosave:** Export/Import move a bare `ProjectDocument`. Autosave keeps `{ project, session }` under a different key. Rejecting an envelope file on Import is intentional — operators should re-export from Skin Studio, not dump localStorage.
- **Validate before confirm:** Unsupported version must never open the replace-all modal (avoids “confirm then surprise fail”).
- **Mirror Export ownership:** `io/` classifies the file; chrome only presents confirm/error and calls `store.apply`.

## Verification

**Commands:**
- `npm test` -- expected: all matrices green, including import parse/fail-closed and chrome Import asserts
- `npx tsc --noEmit` -- expected: clean when used by the matrix harness

**Manual checks:**
- Export a clear project → Import that file → confirm → skins/palette match; Zoom/pan unchanged; unsupported bumped `formatVersion` shows fail copy and leaves project alone
