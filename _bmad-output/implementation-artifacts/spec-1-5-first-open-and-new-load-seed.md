---
title: '1-5 First Open and New Load Seed'
type: 'feature'
created: '2026-10-16'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '63c55b28c8b5f0dc72d1381a0eac3c9a48b24dfe'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** After cold reopen wiring, a first visit still boots an empty project, and there is no New path to return to the known v1 seed — operators cannot start (or restart) calibration from the baseline.

**Approach:** After envelope restore, if nothing was restored, apply the seed project plus default session; expose a minimal New control that confirms, then replaces the store with that same seed baseline (cancel leaves state unchanged). Autosave already attached writes the new envelope.

## Boundaries & Constraints

**Always:**
- Boot order: `initProjectStore` → `restoreEnvelope` → `attachAutosave` → seed-if-not-restored → `mountBootSurface`. Seed apply must run after autosave is attached so the first-open write lands in `skin-studio:project`.
- **Decision RESTORE_SIGNAL = BOOLEAN:** `restoreEnvelope` returns `true` only when a valid envelope was applied; missing key, corrupt CLEAR, and getItem-throw CLEAR all return `false`. First-open seeds when restore returns `false` (covers no prior project and post-CLEAR empty boot). Persist still never calls seed.
- Seed load applies `{ project: createSeedProject(), session: createEmptySession() }` via `store.apply` only — single-writer intact. Prefs key untouched.
- **Decision NEW_SURFACE = BOOT_MINIMAL:** Epic 2 owns full top-bar chrome. This story mounts a minimal New control on the boot surface plus a one-deep confirm modal (scrim + raised surface; Cancel + destructive primary **New**).
- **Decision NEW_CONFIRM_COPY:** body `Replace the current project with the seed baseline? Unsaved browser state will be overwritten.` — same operational voice as Import replace-all (EXPERIENCE has no New row; epic-1-context authorizes assume). English sentence-case buttons.
- Cancel closes the modal with no `apply`. Confirm replaces with seed + empty session; autosave persists. No blocking empty-state wizard on first open.
- Cover the I/O matrix with a Node matrix test (memory storage + DOM for modal where needed). Update scaffold boot-order assert.

**Never:**
- Full chrome / tokens / sidebar / canvas layout (Epic 2+); Import/Export packing; history/undo wiring; inventing seed content; teaching `persist/` to call seed; UI frameworks; `window.confirm` instead of the modal pattern; seeding when a valid envelope restored (even if that project is sparse).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First open | No `skin-studio:project` key on boot | After restore `false`, store holds seed project + empty session; envelope written via autosave; no wizard | N/A |
| Cold reopen | Valid envelope restored | Restore `true`; seed not applied; store matches envelope | N/A |
| Corrupt then first-open | Invalid key → CLEAR → restore `false` | Bad key removed; seed + empty session applied; envelope rewritten | Boot must not throw |
| New confirm | Existing project; user confirms New | Store replaced with fresh seed + empty session; envelope updated; prefs untouched | N/A |
| New cancel | Existing project; user cancels | Store and envelope unchanged; modal closed | N/A |

</frozen-after-approval>

## Code Map

- `src/persist/index.ts` -- change `restoreEnvelope` to return `boolean` (apply → `true`; miss/CLEAR paths → `false`); keep CLEAR / no-throw contract from 1.4
- `src/seed/index.ts` / `src/seed/` -- keep `createSeedProject` pure; add a small apply helper (e.g. `applySeedBaseline(store)`) that `apply`s seed project + `createEmptySession` — no UI imports in `seed/`
- `src/main.ts` -- wire restore → attachAutosave → seed-if-`!restored` → mount; pass store into boot surface for New
- `src/boot-surface.ts` -- mount title + minimal New control; open confirm modal; confirm → `applySeedBaseline`; cancel → no-op
- `src/model/empty-project.ts` / `src/model/store.ts` -- reuse `createEmptySession` / `apply`; do not reshape types
- `src/chrome/` -- leave stub; full New placement is Story 2.3
- `scripts/persist-matrix.test.mjs` -- update for boolean return; keep “restore itself never seeds” asserts
- `scripts/scaffold-matrix.test.mjs` -- update boot-order regex for seed-if-empty between autosave and mount
- `scripts/boot-seed-matrix.test.mjs` (new) -- I/O matrix: first-open, reopen, corrupt→seed, New confirm/cancel
- `package.json` -- include new matrix in `test` script
- Continuity from `spec-1-4-…` (done): restore/CLEAR/autosave; seed factory from 1.3; empty session from 1.2
- `_bmad-output/implementation-artifacts/epic-1-context.md` -- first-open / New / AD-16

## Tasks & Acceptance

**Execution:**
- [x] `src/persist/index.ts` -- return boolean from `restoreEnvelope` -- RESTORE_SIGNAL for boot
- [x] `src/seed/` -- export `applySeedBaseline(store)` (seed project + empty session via `apply`) -- shared first-open / New path
- [x] `src/main.ts` -- restore → autosave → seed-if-not-restored → mount with store -- boot order
- [x] `src/boot-surface.ts` -- New control + confirm modal (NEW_CONFIRM_COPY); cancel safe -- AD-16 / UX-DR11
- [x] `scripts/boot-seed-matrix.test.mjs` + persist/scaffold updates + `package.json` -- matrix + boot-order coverage

**Acceptance Criteria:**
- Given no prior envelope, when the app boots, then the store holds the seed project and default empty session without a wizard, and `skin-studio:project` is written.
- Given a valid saved envelope, when the app boots, then that envelope restores and seed is not applied.
- Given a corrupt envelope, when the app boots, then the bad key is cleared, seed loads, and boot does not throw.
- Given an existing project, when the operator chooses New and confirms, then the store is replaced with seed + empty session; when they cancel, then the store is unchanged.
- Given `npm test` and `npm run build`, when they finish, then both exit 0 with the boot-seed matrix covered.

### Review Findings

- [x] [Review][Patch] Execute first-open seed orchestration via shared `bootProjectStore` (main + boot-seed), not a mirrored helper / unbound regex [src/boot-project.ts; src/main.ts; scripts/boot-seed-matrix.test.mjs; scripts/scaffold-matrix.test.mjs]

## Implementation Notes

- `restoreEnvelope` returns boolean; persist matrix asserts true/false without seeding.
- `applySeedBaseline` shared by first-open / New; orchestration in `bootProjectStore` (`src/boot-project.ts`) used by `main` and boot-seed matrix.
- Scaffold asserts main wires `bootProjectStore` and executes the helper on memory storage; boot-seed covers all five I/O rows (Node DOM shim).
- Review patch: extracted shared boot helper so first-open seed-if-empty is executed, not only mirrored.
- `npm test` (28) and `npm run build` exit 0.

## Spec Change Log

## Review Triage Log

- `false` — sprint `in-progress` vs spec `in-review`: expected mid-Build lifecycle lag until present/sync.
- `medium` — scaffold boot-order regex does not bind the `restored` variable between `restoreEnvelope` assignment and `if (!…)` [scripts/scaffold-matrix.test.mjs:201-204]: verified — second `\w+` is unbound; a wrong identifier in the `if` can still match. Grouped with main orchestration gap (same root: boot path not executed as production code).
- `low` rejected — duplicated `addJsExtensionsToRelativeImports` / DOM shim across scaffold + boot-seed: pre-existing pattern debt from 1.1–1.4 matrices; fix adds shared harness surface beyond this story.
- `low` rejected — modal lacks `role="dialog"` / focus trap / Escape [src/boot-surface.ts]: Design Notes allow plain functional scrim for Epic 1 BOOT_MINIMAL; unlikely everyday need for this operator MVP.
- `low` rejected — chrome New and confirm New share visible label: intentional sentence-case product copy; assistive disambiguation not required under BOOT_MINIMAL.
- `low` rejected — background controls stay reachable under scrim without `inert`: same BOOT_MINIMAL / unlikely everyday for single-operator Epic 1 shell.
- `low` rejected — boot-seed omits getItem-throw → seed row: same `if (!restored)` branch already exercised by corrupt→CLEAR→seed; distinct adapter path unlikely to diverge boot orchestration.
- `low` rejected — no sparse-valid-envelope “skip seed” row: code seeds only when restore is false; sparse-but-valid restore is uncommon and already covered by cold-reopen restore-true path.
- `low` rejected — prefs untouched asserted only on New confirm: `writeEnvelope` / `applySeedBaseline` never touch prefs; first-open cannot write `PREFS_KEY`.
- `low` rejected — confirm-copy asserts use child indices: test brittleness only; product behavior covered.
- `low` rejected — second New while modal open is silent no-op; scrim-dismiss unspecified: not in frozen I/O matrix; cancel/confirm paths covered.
- `false` — empty Spec Change Log / Review Triage at review start: expected until this pass fills them; Implementation Notes count is continuity-only.
- `medium` — first-open seed gate in `main.ts` never executed by counting tests [src/main.ts:15-20; scripts/boot-seed-matrix.test.mjs:172-183 mirror]: verification-gap pre-verified — deleting seed-if-empty in main leaves boot-seed green; only source-text regex would move. Routed patch.

## Design Notes

`restoreEnvelope` stays seed-free so 1.4 persist matrix rows remain meaningful; orchestration lives in `main` + seed helper. Modal can be plain DOM (no design-token pass) — functional scrim/panel is enough for Epic 1. Do not default `activeSkinId` to a skin id here — empty session is the established default until chrome selection lands.

## Verification

**Commands:**
- `npm test` -- expected: scaffold + store + seed + persist + boot-seed matrices pass
- `npm run build` -- expected: exit 0; `dist/` present

**Manual checks (if no CLI):**
- Clear `skin-studio:project`, reload → seeded skins count > 0; edit something, reload → edits restore; New → confirm reseeds; New → cancel keeps edits
