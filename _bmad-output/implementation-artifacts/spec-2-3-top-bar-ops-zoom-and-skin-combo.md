---
title: '2-3 Top Bar — Ops, Zoom, and Skin Combo'
type: 'feature'
created: '2026-10-16'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'd4e6807fc16665c45993fad65aa2c5c337cc1f47'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The locked chrome from Story 2.2 still shows inert Zoom and Skin placeholders, so operators cannot switch skins or set discrete Zoom from the top bar.

**Approach:** Replace the Zoom and Skin inert shells with live native labeled `<select>` combos: Zoom writes discrete steps into prefs; Skin lists loaded skins and updates `activeSkinId` only. Sync context-strip Zoom/Skin readouts with those combos. Keep New live; leave Import/Export/Undo/Redo as ordered disabled stubs.

## Boundaries & Constraints

**Always:**
- Top-bar order (UX-DR4 / AD-11): `[New][Import][Export]` · undo/redo · `Zoom` · spacer · `Skin` combo right-anchored. English labels: `Zoom`, `Skin`, `New`, `Import`, `Export` (plus Undo/Redo control labels already present).
- **Decision COMBO_UI = NATIVE_SELECT:** Zoom and Skin use accessible `<select>` inside existing `chrome-combo` / `chrome-skin-combo` styling (scrollable native menu — not horizontal pills, not a custom mock dropdown).
- Zoom steps only: `50%`, `75%`, `100%`, `125%`, `150%`, `175%`, `200%`. Fresh prefs default remains `100%` (FR-11 / AD-8). On change: update prefs via `loadPrefs` → mutate `zoomStep` → `savePrefs`; never write Zoom into session or the project envelope.
- Skin control lists `project.skins` by `displayName` (value = skin `id`) (FR-9). Changing Skin applies `session` with only `activeSkinId` changed — preserve `selectedObjectTypeId` / `selectedStateId` (AD-6 sticky seed for 2.4). Do not invent Object/State selection.
- **Decision SKIN_NULL = LEAVE_EMPTY:** if `activeSkinId` is null, Skin combo stays empty/`—` until the operator picks; do not auto-select the first skin.
- **Decision CONTEXT_STRIP = SYNC_ZOOM_SKIN:** when Zoom/Skin combos change (and on mount from current prefs/session), update context-strip Zoom/Skin values only; Object/State stay the empty glyph `—` until Story 2.4. Strip remains readout-only (not a second editor).
- New stays on the Story 1.5 / 2.2 confirm → `applySeedBaseline` path. Import/Export/Undo/Redo remain present, disabled, ordered stubs.
- Invalid/unknown stored `zoomStep` → treat as fresh default `100%` for the combo (and persist that clamp on next Zoom write). Cover order, Zoom steps/default/prefs round-trip, Skin list + `activeSkinId`, strip Zoom/Skin sync, envelope isolation, and stub presence in the chrome matrix; keep `npm test` / `npm run build` green.

**Never:**
- Apply visual scale/pan to the canvas (Story 2.5).
- Build full sticky-context Object/State strip wiring or invent Object/State/skin when empty (Story 2.4 owns the rest of the live strip AC).
- Wire Import/Export/Undo/Redo behavior; change envelope/export schema; put Zoom/pan into session; use horizontal Skin pills or a custom chevron menu; add UI frameworks / CSS-in-JS.
- Change `model/` schema, seed skin list content, or sidebar/canvas layout contracts from 2.2.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Fresh Zoom | No prefs / default prefs | Zoom combo shows `100%`; strip Zoom shows `100%`; steps list is exactly the seven allowed values | N/A |
| Zoom change | Operator picks `150%` | Prefs `zoomStep` = `150%`; strip Zoom = `150%`; project envelope unchanged; session unchanged | `savePrefs` fail-soft |
| Corrupt zoomStep | Prefs has unknown string | Combo + strip Zoom show `100%` (default clamp) | No throw |
| Skin list | Seed project with five skins | Skin `<select>` lists five `displayName`s; right-anchored | N/A |
| Skin null | `activeSkinId` null; skins present | Skin combo empty/`—`; strip Skin = `—`; no session invent | N/A |
| Skin switch | Object/State may be set or null; pick another skin | Only `activeSkinId` changes; Object/State untouched; strip Skin shows `displayName`; envelope persists via existing autosave path | Ignore unknown id |
| Stubs | Mount chrome | Import/Export/Undo/Redo disabled and ordered; New still confirms seed | N/A |
| Prefs isolation | After Zoom change | `skin-studio:project` JSON has no `zoomStep` / pan fields | N/A |

</frozen-after-approval>

## Code Map

- `src/chrome/index.ts` — `buildTopBar` / `inertCombo` → native Zoom + Skin `<select>` combos; sync `data-context-value="zoom"|"skin"`; keep `inertButton` stubs; New unchanged; pass `storage` + context strip refs into builders
- `src/persist/prefs.ts` — reuse `loadPrefs` / `savePrefs` / `DEFAULT_PREFS.zoomStep`; optionally centralize allowed Zoom step list + clamp helper next to prefs or in chrome
- `src/model/store.ts` + `src/model/types.ts` — `store.getState().project.skins` / `session.activeSkinId`; `store.apply({ session })` for Skin switch (full session object with only `activeSkinId` changed)
- `src/chrome/new-confirm.ts` — do not change New confirm contract
- `src/canvas/index.ts` — leave placeholder; no Zoom consumer yet
- `src/history/index.ts` — Undo/Redo stub only; no history wiring
- `src/styles/base.css` — style native selects inside `chrome-combo` without inventing a custom menu widget
- `scripts/chrome-shell-matrix.test.mjs` + `package.json` — replace Zoom/Skin inert asserts with live combo + strip sync matrix; keep geometry / splitter / New coverage
- `_bmad-output/implementation-artifacts/epic-2-context.md` + Story 2.2 spec — continuity: CHROME_FILL → live Zoom/Skin; Import/Export/Undo/Redo still stubs
- Do **not** change: envelope writer shape, seed skin factories, sidebar layout, planning mockups as runtime

## Tasks & Acceptance

**Execution:**
- [x] `src/chrome/index.ts` (+ small helper module if needed) -- native Zoom/Skin `<select>` combos wired to prefs + session; sync strip Zoom/Skin — FR-9 / FR-11 / AD-11 / CONTEXT_STRIP
- [x] `src/persist/prefs.ts` (or chrome helper) -- allowed Zoom steps + clamp unknown `zoomStep` to `100%` — FR-11 / AD-8
- [x] `src/styles/base.css` -- native select looks at home in chrome combo shells — COMBO_UI
- [x] `scripts/chrome-shell-matrix.test.mjs` -- I/O matrix: order, Zoom steps/default/prefs, Skin list/`activeSkinId`/null, strip sync, stubs, envelope isolation — regression
- [x] Keep Import/Export/Undo/Redo disabled stubs and New confirm path — Story AC / continuity from 2.2

**Acceptance Criteria:**
- Given the chrome shell, when the top bar renders, then control order is `[New][Import][Export]` · undo/redo · `Zoom` · spacer · `Skin` right-anchored.
- Given loaded skins, when the Skin combo opens, then it lists those skins in a labeled native combo (not pills) and selecting one changes only `activeSkinId`; null `activeSkinId` stays empty until pick.
- Given fresh prefs, when Zoom renders, then the value is `100%` and the menu lists only the seven discrete steps; changing Zoom updates `skin-studio:prefs.zoomStep` and never the project envelope.
- Given Zoom or Skin changes, when the context strip is read, then Zoom/Skin values match the combos while Object/State stay `—`.
- Given mount, when inspecting ops, then New still confirms seed; Import/Export/Undo/Redo are present, disabled, and ordered; labels are English (`Zoom`, `Skin`, `New`, `Import`, `Export`).

## Implementation Notes

## Spec Change Log

## Review Triage Log

- `high` — Skin combo/strip never resync after store.apply (e.g. New) [src/chrome/index.ts:175-251; new-confirm applySeedBaseline] — verified: no store.subscribe; New clears session while select/strip keep prior skin — route patch
- `medium` — Mount with orphan activeSkinId missing from skins leaves session stale while UI empty [src/chrome/index.ts:205-215] — verified: mount sets empty UI only; change handler restores known id but mount does not clear orphan — route patch
- `medium` — Zoom prefs restore for valid non-default step never asserted on remount [scripts/chrome-shell-matrix.test.mjs Zoom + prefs restore] — verification-gap pre-verified — route patch
- `medium` — Skin select/strip after New confirm never asserted [scripts/chrome-shell-matrix.test.mjs:1220-1264] — verification-gap pre-verified; fails until Skin resync — route patch
- `low` — Zoom write path does not assert panXY/sidebarPaneHeights survive loadPrefs→savePrefs [src/chrome/index.ts:162-168] — verified code preserves via full-document save; missing assert only — route patch (test)
- `false` — Prefs isolation never asserts pan fields absent from envelope — envelope never gains pan keys from Zoom path; zoomStep absence already asserted
- `false` — Choosing empty Skin option after a real skin is undecided/uncovered — LEAVE_EMPTY empty option intentionally allows clear to null; not a defect
- `false` — Hard-coded select ids collide on remount — mountChromeShell `root.replaceChildren()` removes prior nodes before re-id
- `low` — Dual `<label for>` + `aria-label` on same select double-announces — verified both set; remove aria-label (label remains) — route patch
- `false` — Sixth empty/`—` Skin option undocumented in matrix — reject (would only edit this build’s spec)
- `false` — Skin right-anchored unproven — spacer `flex: 1` + `.chrome-skin-combo` already from 2.2 layout; no new regression
- `false` — New confirm path / English Zoom/Skin labels under-asserted as separate product holes beyond Skin-resync — New confirm still exercised; labels are static copy (labels gap deferred below)
- `false` — Code Map still says “optionally centralize” Zoom helpers — reject (would only edit this build’s spec)
- `false` — Empty Implementation Notes on in-review spec — reject (would only edit this build’s spec)
- `low` rejected — English Zoom/Skin label text unasserted [verification-gap] — static chrome copy; everyday harm unlikely; deferred
- `low` rejected / defer — boot-seed vs chrome-shell DOM harness drift — pre-existing shared-harness debt (same class as 1.2–2.2)

## Design Notes

- Story 2.2 left Zoom/Skin as inert `—` shells on purpose; this story flips those two only.
- Sticky Object/State preservation is required on Skin switch even though the full sticky + Object/State strip AC lives in 2.4 — do not clear selection as a side effect.
- CONTEXT_STRIP sync is a minimal coherence bridge into 2.4, not the full sticky-context story.
- Canvas scale is intentionally deferred: operators can set Zoom in prefs before 2.5 consumes it.
- Prefer product `displayName` in the Skin menu; stable `id` is the session value.

## Verification

**Commands:**
- `npm test` -- expected: exit 0 including updated chrome-shell matrix
- `npm run build` -- expected: exit 0

**Manual checks (if no CLI):**
- `npm run dev` — Zoom steps work and survive reload via prefs; Skin combo lists seed skins and switches `activeSkinId`; context strip Zoom/Skin follow; Import/Export/Undo/Redo stay disabled; New still confirms
