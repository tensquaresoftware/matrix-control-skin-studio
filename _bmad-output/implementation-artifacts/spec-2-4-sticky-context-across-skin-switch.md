---
title: '2-4 Sticky Context Across Skin Switch'
type: 'feature'
created: '2026-10-16'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'c7531aba3bf29b888fa095b4ffaee339ea831221'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Skin switch already keeps Object/State/Zoom in session and prefs, but the context strip still hardcodes Object and State as `—`, so operators cannot see sticky place when a selection exists (UJ-2 / UX-DR5).

**Approach:** Wire the context-strip Object and State readouts to `session.selectedObjectTypeId` / `selectedStateId` (session id strings or `—` when null), keep Skin-switch session copy-through and Zoom/prefs untouched, and extend the chrome matrix so sticky + live strip Object/State are proven without inventing a selection UI.

## Boundaries & Constraints

**Always:**
- **Decision SELECTION_SURFACE = TESTS_ONLY:** no product or temporary Object/State selection UI in this story; prove sticky + live strip via chrome-matrix `store.apply`. Everyday UI keeps Object/State as `—` until Epic 4 selection exists.
- Skin switch continues to change only `activeSkinId` via full session replace that copies `selectedObjectTypeId` / `selectedStateId` unchanged (AD-6 / FR-2). Never invent Object/State when null.
- Context strip shows `Object · State · Zoom · Skin` with muted labels / primary values; empty Object/State use the existing empty glyph `—` (UX-DR5). Strip stays readout-only — not a second editor.
- When session Object/State ids are non-null, strip values show those id strings (inventory has no separate displayName today; seed `objectTypes` is empty).
- Zoom and pan stay in prefs only; Skin switch must not mutate `zoomStep`, `panXY`, or `sidebarPaneHeights`. Project envelope must not gain prefs fields.
- Subscribe (or equivalent) so strip Object/State resync after any `store.apply` that changes session (including New / external apply), same coherence class as Skin strip sync from 2.3.
- Cover sticky preserve, strip Object/State live sync (null → `—`, set → ids), prefs isolation on Skin switch, and no invented selection in `scripts/chrome-shell-matrix.test.mjs`; keep `npm test` / `npm run build` green.

**Never:**
- Add product Object/State selection UI in chrome or sidebar (Epic 4 owns selection surfaces).
- Implement canvas pan interaction or Zoom visual scale (Story 2.5).
- Clear or invent Object/State as a side effect of Skin switch, orphan Skin cleanup, or Zoom change.
- Change envelope/export schema, seed inventory content, model session shape, or top-bar Zoom/Skin combo contracts from 2.3.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Empty selection | Both Object/State null | Strip Object/State = `—`; Skin switch leaves them null | N/A |
| Sticky switch | Object `ot-1`, State `idle`, Zoom non-default; pick another Skin | Only `activeSkinId` changes; Object/State/Zoom/pan prefs unchanged; strip Object/State show `ot-1` / `idle`; strip Skin updates | Ignore unknown skin id |
| Live strip sync | `store.apply` sets Object/State (tests or later UI) | Strip Object/State update without editing strip | N/A |
| Clear selection | Apply session with Object/State null after they were set | Strip returns to `—`; no invent | N/A |
| Prefs isolation | Skin switch with non-default Zoom/pan prefs | Prefs document unchanged by Skin path; envelope has no `zoomStep` / pan fields | N/A |
| New / resync | New confirm clears session | Strip Object/State/Skin return to `—` (Skin via existing subscribe) | N/A |

</frozen-after-approval>

## Code Map

- `src/chrome/index.ts` — `buildContextStrip` / `contextField` (`data-context-value="object"|"state"`); today Object/State hardcoded `EMPTY_GLYPH` at build time; Skin path already preserves session ids (`buildSkinCombo` change handler ~236–252); reuse `store.subscribe` pattern from `syncSkinFromStore`
- `src/model/types.ts` + `src/model/store.ts` — `SessionUiState` fields; `apply` full-replaces session (callers must copy Object/State)
- `src/persist/prefs.ts` — Zoom/pan/sidebar heights; Skin path must not write prefs
- `src/canvas/index.ts` — leave placeholder; pan interaction is 2.5
- `scripts/chrome-shell-matrix.test.mjs` — extend Skin sticky cases: strip Object/State must show session ids (today incorrectly asserts `—` when session is set ~629–636); add prefs isolation on Skin switch; keep clear-to-null / orphan Skin coverage
- `_bmad-output/implementation-artifacts/spec-2-3-top-bar-ops-zoom-and-skin-combo.md` — continuity: CONTEXT_STRIP was Zoom/Skin only; 2.4 completes Object/State readout
- Do **not** change: seed `objectTypes: []`, envelope writer shape, sidebar pane UI, Zoom combo steps

## Tasks & Acceptance

**Execution:**
- [x] `src/chrome/index.ts` -- sync context-strip Object/State from session on mount + subscribe; keep Skin sticky copy-through and Zoom/prefs paths — FR-2 / AD-6 / UX-DR5
- [x] `scripts/chrome-shell-matrix.test.mjs` -- assert strip Object/State live values, sticky Skin switch preserve, prefs isolation, null → `—`, no invent — regression

**Acceptance Criteria:**
- Given Object type X + State Y in session and non-default Zoom prefs, when the operator switches Skin via the top-bar combo, then only `activeSkinId` changes; Object, State, Zoom, and pan prefs remain; strip Object/State show X/Y.
- Given no Object/State selected, when Skin switches, then Object/State stay null and strip shows `—` (no invent).
- Given the context strip, when session Object/State change via `store.apply`, then strip values update and the strip itself stays non-editable.
- Given Skin switch, when inspecting prefs and envelope, then prefs are untouched by the Skin path and the envelope gains no Zoom/pan fields.

## Implementation Notes

## Spec Change Log

## Review Triage Log

- `false` — Sticky Skin switch never re-asserts strip Zoom still `150%` [scripts/chrome-shell-matrix.test.mjs sticky block] — Skin path never writes Zoom readout; prefs blob equality already proves Zoom step sticky
- `false` — Zoom change while Object/State set untested [src/chrome/index.ts buildZoomCombo] — Zoom handler only mutates prefs + Zoom readout; session Object/State untouched
- `false` — Orphan Skin row missing from frozen I/O matrix — reject (would only edit this build’s spec); orphan sticky covered in tests
- `false` — Code Map still describes pre-fix hardcoded Object/State — reject (would only edit this build’s spec)
- `false` — Non-editable strip proven only via missing `contenteditable` attr [contextField spans] — strip values are non-interactive spans, never inputs/editors
- `low` rejected — Second `store.subscribe` without unsubscribe on remount [src/chrome/index.ts:59] — product mounts chrome once; teardown needs a surface beyond a direct correction (same class as 2.3 Skin subscribe)
- `low` rejected — Single `it(...)` folds multiple I/O rows — test organization only; everyday product harm unlikely
- `false` — Live strip shows raw ids with no inventory membership check — by design (TESTS_ONLY + id strings; seed `objectTypes` empty)
- `false` — Empty Implementation Notes on in-review spec — reject (would only edit this build’s spec)
- `false` — Empty-string Object/State shows blank instead of `—` [`??` vs `||` at syncObjectStateFromStore] — writers use null or real ids; empty string not produced on product/seed paths (parallel to 2.3 empty skin id reject)
- `low` rejected — Remount leaks Object/State listeners to detached nodes [edge-case-hunter] — same remount/teardown class as subscribe finding above

## Design Notes

- Story 2.3 already seeded sticky session copy-through and Zoom/Skin strip sync; 2.4 completes the live Object/State readout contract.
- Inventory entries are ids only (no displayName); showing session id strings is correct until Collect/Epic 4 enrich labels.
- Pan interaction is Story 2.5; this story only proves Skin switch does not disturb stored `panXY`.

## Verification

**Commands:**
- `npm test` -- expected: exit 0 including updated chrome-shell matrix
- `npm run build` -- expected: exit 0

**Manual checks (if no CLI):**
- `npm run dev` — Skin switch still updates strip Skin only for everyday empty selection; with session Object/State injected (tests / console), strip shows those ids and keeps them across Skin changes
