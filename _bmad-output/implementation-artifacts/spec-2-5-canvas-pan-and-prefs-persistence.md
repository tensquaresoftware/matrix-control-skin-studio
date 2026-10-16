---
title: '2-5 Canvas Pan and Prefs Persistence'
type: 'feature'
created: '2026-10-16'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'b0ad02bdfb89acf68737f1fda6deb329fd16de97'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The GUI view is still a non-interactive placeholder: Zoom already writes prefs and the context strip, but neither Zoom scale nor panXY affect the canvas, and operators cannot click-drag or arrow-pan — so view place does not survive reopen as a visible layout (FR-11 / AD-8).

**Approach:** Make the canvas focusable and interactive: apply stored Zoom + pan as a live transform, pan via click-drag and arrow keys when focused, persist Zoom/panXY only under `skin-studio:prefs`, and keep the context-strip Zoom path coherent without touching the project envelope.

## Boundaries & Constraints

**Always:**
- Canvas focused (`tabindex="0"` on the canvas host, click or Tab to focus, visible focus ring): click-drag pans X-Y; ArrowUp/Down/Left/Right pan by a fixed step (16px content space) and `preventDefault` when focused so the page does not scroll.
- On mount and whenever Zoom prefs change, apply both `zoomStep` (CSS scale from the discrete step string) and `panXY` as a transform on the canvas surface (not the chrome shell).
- Persist `panXY` with the same merge-write pattern as sidebar heights (`loadPrefs` → mutate field → `savePrefs`): commit pan on pointer-up after drag; commit after each arrow key that moves pan. Zoom continues to persist from the existing top-bar combo.
- When Zoom combo changes, update strip Zoom (already done) **and** re-apply canvas scale from prefs without mutating project/session JSON.
- Prefs document remains `{ zoomStep, panXY, sidebarPaneHeights }` only under `skin-studio:prefs`. Envelope/export stay free of Zoom/pan fields (FR-11, NFR-4, AD-8).
- Keep placeholder “GUI view” content; do not build Epic 4 mock zones or selection hit-testing.
- Cover pan drag, arrow pan, Zoom live scale + strip, reopen restore of pan/Zoom transform, and envelope isolation in `scripts/chrome-shell-matrix.test.mjs`; keep `npm test` / `npm run build` green.

**Never:**
- Write Zoom/pan into session, project envelope, or export shape; put Zoom/pan on the undo stack.
- Add wheel/trackpad pan, pinch zoom, freeform continuous Zoom, or a second Zoom control on the canvas.
- Change AD-8 field set, Zoom step list, Skin sticky behavior, Object/State strip contract, or sidebar height persistence API.
- Invent Object/State selection UI or real Matrix-Control mock content (Epic 4).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Drag pan | Canvas focused; pointer down + move + up | Surface translates by delta; `panXY` saved on pointer-up; prefs merge keeps zoom/sidebar | Ignore drag that started outside canvas |
| Arrow pan | Canvas focused; ArrowLeft/Right/Up/Down | `panXY` steps ±16px; prefs saved; transform updates; no page scroll | Ignore arrows when canvas not focused |
| Zoom live | Change Zoom combo to `150%` | Strip Zoom = `150%`; canvas scale = 1.5; prefs `zoomStep` saved; envelope unchanged | Clamp unknown step via existing `clampZoomStep` |
| Reopen restore | Prefs have non-zero pan + non-100% Zoom | Mount applies same transform; strip Zoom matches | Corrupt prefs → defaults (existing loadPrefs) |
| Prefs isolation | Pan or Zoom change | Envelope has no `zoomStep`/`panXY`; Skin/Object/State session untouched | savePrefs fail soft |
| Unfocused arrows | Focus elsewhere; press arrows | No pan change | N/A |

</frozen-after-approval>

## Code Map

- `src/canvas/index.ts` — replace placeholder-only `mountCanvas`: focusable host, pointer drag pan, arrow-key pan, apply `transform` from `loadPrefs` (`translate` + `scale`); export a small hook chrome can call after Zoom change (e.g. `applyCanvasViewFromPrefs(host, storage)` or event) — do not duplicate Zoom combo UI
- `src/chrome/index.ts` — after Zoom `savePrefs`, notify canvas to re-apply scale (keep strip update); pass `storage` into `mountCanvas` like sidebar; leave Skin/Object/State paths alone
- `src/persist/prefs.ts` — reuse `loadPrefs` / `savePrefs` / `clampZoomStep` / `ZOOM_STEPS` / `panXY` shape; no schema change
- `src/styles/base.css` — focus ring on `[data-canvas-host]:focus` / `:focus-visible`; allow overflow so panned/scaled surface can move; keep bright raised surface vs dark chrome
- `scripts/chrome-shell-matrix.test.mjs` — add pan drag + arrow + Zoom visual/transform + reopen + envelope isolation cases; keep existing sticky Skin / strip Object-State coverage
- Do **not** change: envelope writer, session shape, sidebar height keys, Zoom step list, Skin combo sticky copy-through

## Tasks & Acceptance

**Execution:**
- [x] `src/canvas/index.ts` -- focusable GUI view with drag/arrow pan, live Zoom+pan transform from prefs, pan prefs merge-write — FR-11 / AD-8
- [x] `src/chrome/index.ts` -- pass storage into canvas; on Zoom change re-apply canvas view after prefs write — strip + visual coherence
- [x] `src/styles/base.css` -- canvas focus ring + overflow for pan/scale — UX focus / layout
- [x] `scripts/chrome-shell-matrix.test.mjs` -- assert drag/arrow pan, Zoom scale+strip, reopen restore, envelope isolation — regression

**Acceptance Criteria:**
- Given the canvas region is focused, when the operator click-drags or uses arrow keys, then the GUI view pans on X-Y and `panXY` is stored in `skin-studio:prefs`.
- Given a Zoom step change via the top-bar combo, when prefs update, then the context strip Zoom value updates, the canvas visual scale matches the step, and project JSON/envelope gain no Zoom/pan fields.
- Given non-default Zoom and pan prefs, when the shell remounts (cold reopen of prefs), then the same transform is restored.
- Given pan or Zoom prefs writes, when inspecting the project envelope, then prefs fields are absent from the envelope document.

## Implementation Notes

## Spec Change Log

## Review Triage Log

- `false` — Code Map “allow overflow” vs CSS `overflow: hidden` — reject (would only edit this build’s spec); clipping is intentional so pan/scale stay inside the slot
- `false` — Frozen matrix missing `pointercancel` row — reject (would only edit frozen intent); cancel path already implemented and tested
- `false` — Spec `in-review` vs sprint `in-progress` — expected BMad states during build review before sprint sync to review
- `false` — Empty Implementation Notes / Spec Change Log / Review Triage Log at review start — process metadata; this log fills during triage
- `medium` — ArrowLeft / ArrowDown never exercised in tests [scripts/chrome-shell-matrix.test.mjs] — only Right/Up run; broken Left/Down would still pass
- `low` rejected — Cancel-drag omits mid-drag transform assert before restore — restore/prefs equality already proven; everyday product harm unlikely
- `false` — “Ignore drag started outside canvas” untested — pointerdown is only on the canvas host; outside starts cannot enter the handler
- `low` — Click-to-focus (`host.focus()`) unasserted [src/canvas/index.ts pointerdown] — tests dispatch keydown on host without observing focus
- `low` rejected — Drag-pan at Zoom ≠ 100% untested — Design Notes lock screen-pixel deltas; same `applyLiveTransform` path as 100%
- `low` rejected — Non-primary button ignore untested [button !== 0] — real gap but outside everyday I/O matrix; deferred separately
- `low` rejected — savePrefs fail-soft after pan leaves visual snap via reload — rare quota path; same fail-soft class as sidebar/Zoom; fix adds branch complexity
- `low` rejected — Mid-drag remount / listener teardown — product remounts replace the host element; not an everyday operator path
- `medium` — `setPointerCapture` throw after `dragging = true` with no try [src/canvas/index.ts:149-151] — can leave drag stuck and ignore later pointerdowns
- `medium` — Arrow pan while pointer drag still active [src/canvas/index.ts keydown] — commits prefs that diverge from live drag transform
- `low` rejected — Zoom change during active drag wipes live pan — uncommon combo; everyday Zoom happens between gestures
- `low` rejected — Zoom savePrefs fail-soft desyncs strip vs canvas — strip uses in-memory next; canvas reloads; rare storage failure
- `low` rejected — NaN/Infinity panXY passes typeof-number guard — only hand-edited corrupt prefs; not seed/product writers
- `medium` deferred — Touch drag without `touch-action: none` [src/styles/base.css] — browser gesture may steal touch pans; desktop-first MVP
- `low` rejected — Remount `mountCanvas` on same host duplicates listeners — chrome always creates a fresh host; product does not double-mount
- `medium` — Click-to-focus regression gap [verification-gap] — delete `host.focus()` and tests still pass
- `low` deferred — Non-primary pointer button ignore untested [verification-gap] — real gap; close if secondary-button canvas work lands

## Design Notes

- Bridge Zoom → canvas: prefer an exported `applyCanvasViewFromPrefs` (or equivalent) called from the Zoom change handler after `savePrefs`, plus the same apply on `mountCanvas` — avoid `storage` events (cross-tab only) and avoid putting Zoom/pan into the project store.
- Transform model: `transform: translate(xpx, ypx) scale(s)` on `[data-canvas-surface]` with origin top-left; parse scale from Zoom strings (`150%` → `1.5`). Pan deltas are in screen pixels at 100% (do not divide by scale for MVP placeholder).
- Arrow step 16px (= 4 × spacing unit) mirrors the dense console grid; drag uses raw pointer movement.
- Wheel/pinch intentionally out of scope (story AC lists click-drag + arrows only).

## Verification

**Commands:**
- `npm test` -- expected: exit 0 including updated chrome-shell matrix
- `npm run build` -- expected: exit 0

**Manual checks (if no CLI):**
- `npm run dev` — click canvas, drag to pan, arrows to nudge, change Zoom and confirm scale + strip; reload and confirm place/Zoom restored; DevTools Application → localStorage: prefs vs project keys stay split
