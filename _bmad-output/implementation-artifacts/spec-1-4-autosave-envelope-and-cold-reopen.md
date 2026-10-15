---
title: '1-4 Autosave Envelope and Cold Reopen'
type: 'feature'
created: '2026-10-15'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '6618d7e08bcd953c731a5b574385026f57887926'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Skin Studio keeps project and session only in memory — closing the tab wipes calibration work.

**Approach:** Persist an autosave envelope `{ project, session }` under `localStorage` key `skin-studio:project`, restore it into the store on cold reopen of the same origin/profile, and keep prefs on a separate key so they never enter the project export shape.

## Boundaries & Constraints

**Always:**
- On every store change that mutates project and/or session, write envelope `{ project, session }` to `localStorage` key `skin-studio:project` (AD-8, FR-21). Session fields are AD-6 only: `selectedObjectTypeId`, `selectedStateId`, `activeSkinId`.
- Prefs live only under `skin-studio:prefs` with shape `{ zoomStep, panXY, sidebarPaneHeights }` (AD-8). Default `zoomStep` is `100%` when prefs are absent. Prefs must never appear inside the project envelope or any future export payload shape owned by this module.
- Cold reopen (same origin/profile): if a valid envelope exists, restore it into the store via `apply` so `formatVersion` remains writer pin `1`. If no envelope key exists, leave the empty boot store unchanged — do **not** call seed (story 1.5 owns first-open / New).
- Persistence lives in `persist/`; it may subscribe to the store and call `apply` for restore. It must not mutate nested project/session fields in place. Reuse existing `ProjectDocument` / `SessionUiState` types — do not reshape them.
- Cover the I/O matrix with a Node matrix test (injectable storage; do not require a real browser `localStorage`).
- **Decision CORRUPT_ENVELOPE = CLEAR:** if the envelope key is present but unreadable or fails validation, remove the bad key and leave the empty boot store unchanged (no seed). Boot must not throw.

**Never:**
- First-open seed apply or New confirm replace (1.5); history/undo; chrome / canvas / sidebar UI that writes zoom/pan/pane heights; import/export packing; IndexedDB.
- Mixing prefs into `skin-studio:project` or exporting prefs with the project document.
- UI frameworks; dual writers; calling seed from persist or boot in this story.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Autosave on apply | Store `apply` changes project and/or session | `skin-studio:project` holds JSON envelope `{ project, session }` matching store state; prefs key untouched | Storage write failures must not throw into UI — fail soft (no crash) |
| Prefs separation | Envelope written after apply | Envelope has only `project` + `session`; no `zoomStep` / `panXY` / `sidebarPaneHeights` fields | N/A |
| Cold reopen valid | Key holds a valid envelope; app boots | Store `getState()` matches saved project + session; `formatVersion === 1` | N/A |
| No prior envelope | Key missing on boot | Store stays empty baseline (1.2); no seed apply | N/A |
| Corrupt / invalid envelope | Key present but unreadable or fails validation | Remove the bad key; store stays empty baseline; no seed apply | Must not crash boot |

</frozen-after-approval>

## Code Map

- `src/persist/index.ts` -- stub `export {}` today; become public persist API (restore + attach autosave + prefs helpers)
- `src/persist/` -- add modules as needed (keys, envelope parse/validate, prefs defaults, storage adapter); `persist/` may import `model/` types and store types only — never UI
- `src/model/store.ts` -- reuse `subscribe` / `apply` / `getState`; do not change single-writer contract
- `src/model/types.ts` -- reuse `ProjectDocument`, `SessionUiState`; do not reshape
- `src/model/empty-project.ts` -- empty fallback when no/invalid envelope; do not alter seed
- `src/seed/` -- do **not** call from boot in this story
- `src/main.ts` -- after `initProjectStore()`, restore envelope (if any) then attach autosave before `mountBootSurface`
- `scripts/store-matrix.test.mjs` / `scripts/seed-matrix.test.mjs` -- pattern: `importCompiledTs` + `node:test`; reuse for persist matrix with in-memory storage
- `scripts/scaffold-matrix.test.mjs` -- module folder list includes `persist`; keep green when exports leave stub
- `package.json` -- extend `test` script with new persist matrix file
- Continuity from `spec-1-3-…` (done): seed factory ready; boot still empty until restore/seed stories wire it
- `_bmad-output/implementation-artifacts/epic-1-context.md` -- AD-8 keys and envelope shape

## Tasks & Acceptance

**Execution:**
- [x] `src/persist/` -- implement envelope save/load + validation + prefs types/helpers (defaults; no chrome writer yet) with injectable storage -- AD-8 split
- [x] `src/persist/index.ts` -- export restore + attach-autosave (and prefs helpers as needed) -- public API for boot
- [x] `src/main.ts` -- restore then attach autosave around store init / mount -- cold reopen path
- [x] `scripts/persist-matrix.test.mjs` -- cover I/O matrix rows (autosave, prefs separation, valid restore, missing key, corrupt path) -- edge coverage
- [x] `package.json` -- include persist matrix in `scripts.test` -- `npm test` runs scaffold + store + seed + persist

**Acceptance Criteria:**
- Given a store change to project or session, when autosave runs, then `skin-studio:project` holds `{ project, session }` and prefs fields are absent from that value.
- Given a valid saved envelope, when the app boots, then the store restores that project and session with `formatVersion` still `1`.
- Given no `skin-studio:project` key, when the app boots, then the store stays empty and seed is not applied.
- Given a corrupt envelope, when the app boots, then the bad key is removed, the store stays empty, seed is not applied, and boot does not throw.
- Given `npm test` and `npm run build`, when they finish, then both exit 0 with the persist matrix covered.

## Implementation Notes

- Added `persist/` modules: keys, injectable storage, envelope parse/write/clear, prefs load/defaults.
- Public API: `restoreEnvelope`, `attachAutosave`, prefs helpers; boot wires restore then autosave before mount.
- CORRUPT_ENVELOPE = CLEAR; lean validation (`formatVersion === 1` + session nullable strings).
- `scripts/persist-matrix.test.mjs` covers all matrix rows + write/getItem fail-soft; scaffold asserts restore→autosave→mount order.
- Review patches: soft-fail `getBrowserStorage`; CLEAR on getItem throw; scaffold wiring assert; getItem-throw matrix case.
- `npm test` (21) and `npm run build` exit 0.

## Spec Change Log

## Review Triage Log

- `false` — lean `isProjectDocument` (formatVersion only) [src/persist/envelope.ts]: Design Notes require at least formatVersion + session shape; half-documents are intentional lean accept, not a defect.
- `medium` — default `getBrowserStorage()` / `localStorage` access can throw before soft-fail try/catch [src/persist/storage.ts; restoreEnvelope/attachAutosave defaults]: verified — default-arg evaluation runs outside function body try; boot can crash when storage is blocked. Routed patch.
- `false` — main never calls `loadPrefs` [src/main.ts]: Design Notes + AC require prefs key separation / helpers, not boot hydrate; chrome prefs writer is later.
- `false` — corrupt prefs not CLEARed [src/persist/prefs.ts]: CORRUPT_ENVELOPE = CLEAR applies only to project envelope key.
- `false` — matrix omits half-document with formatVersion 1 missing arrays: lean accept is intentional per Design Notes.
- `false` — matrix does not spy/import seed on no-envelope/corrupt rows: empty baseline (0 skins/palette) already proves seed was not applied.
- `false` — sprint `in-progress` vs spec `in-review`: expected mid-Build lifecycle lag.
- `false` — Code Map still says stub: fix would edit this build's spec (rejected).
- `false` — empty Spec Change Log / Review Triage before this pass: expected until first review fills them.
- `low` rejected — prefs accept NaN/array heights [src/persist/prefs.ts]: unlikely everyday use this story; chrome prefs writer not wired; fix adds validation complexity.
- `low` rejected — manual Verification browser how-to vague: cosmetic for agent; CLI matrix covers AC.
- `low` deferred — duplicated `importCompiledTs` across matrix files: pre-existing pattern debt from 1.1–1.3; not a product defect of this diff.
- `medium` — `restoreEnvelope` getItem throw returns without CLEAR [src/persist/index.ts]: verified — frozen CORRUPT_ENVELOPE treats unreadable key as CLEAR; catch previously skipped removeItem. Routed patch.
- `false` — removeItem throw leaves sticky key [src/persist/envelope.ts clearEnvelopeKey]: already soft-fail; no further recovery available without throwing.
- `false` — multi-tab last-write-wins [attachAutosave]: FR-21 single-operator assumption; multi-tab sync out of intent.
- `medium` — boot never asserts restore+autosave wiring in main [verification-gap]: pre-verified — scaffold only checked persist import; dropping calls kept npm test green. Routed patch.
- `medium` — getItem-throw fail-soft path untested [verification-gap]: pre-verified — only setItem fail-soft was covered. Routed patch.

## Design Notes

Wire autosave via `store.subscribe` → synchronous write of `getState()` (payloads are small for MVP). Prefer an injectable `Storage`-like adapter so Node matrix tests use a `Map` stand-in. Prefs helpers may load defaults without forcing a write of `skin-studio:prefs` until a later prefs writer exists — architectural separation is enough for this story’s AC. Validate restored envelopes at least for JSON parse, object shape (`project` + `session`), and `project.formatVersion === 1`.

## Verification

**Commands:**
- `npm test` -- expected: scaffold + store + seed + persist matrix suites pass
- `npm run build` -- expected: exit 0; `dist/` present

**Manual checks (if no CLI):**
- In a browser: `apply` a non-empty project, reload, confirm store matches; clear `skin-studio:project`, reload, confirm empty store (no seed yet)
