---
title: 'Fix canvas crushed by chrome sidebar flex'
type: 'bugfix'
created: '2026-10-17'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** In Skin Studio the Matrix-Control GUI mock is mounted in the DOM but invisible: the sidebar flex slot grows past its 320px token (content `min-width: auto`) and crushes the canvas slot / `canvas-surface` to ~2px wide.

**Approach:** Tighten `.chrome-sidebar-slot` flex geometry so it stays at the sidebar width token, keep the canvas slot as the remaining flex space, and add a CSS-constraint regression assertion in the chrome shell matrix. No mock redesign; pan/Zoom stay on the surface.

</frozen-after-approval>

## Implementation Notes

- Root cause confirmed: `.chrome-sidebar-slot` had `width: 320px` + `flex-shrink: 0` but default `min-width: auto`, so long sidebar content widened the slot and crushed `.chrome-canvas-slot`.
- Fix: `flex: 0 0 var(--space-sidebar-width)`, `max-width`, `min-width: 0`, `overflow: hidden` on sidebar slot; `min-width: 0` on `.canvas-host`, `.canvas-surface`, and `.sidebar` for nested flex.
- Anti-regression: extended layout assertions in `scripts/chrome-shell-matrix.test.mjs` (CSS constraints; harness cannot measure Firefox flex); test title notes crush-prevention.
- No JS mount changes; slot classes already preserved via `classList.add`.
- Skipped git commit per Guillaume explicit hors-scope (commit only on request).
- Blind Hunter: renamed test title; added `.sidebar { min-width: 0 }`; deferred narrow-viewport canvas floor.

## Review Triage Log

- Missing oneshot AC/Tasks/Code Map — **false**: oneshot route omits those sections by design.
- Spec still `in-progress` at review time — **false**: process timing; finalized to `done` here.
- Intent Approach vs nested CSS details — **false**: Approach is high-level geometry tighten; properties are implementation.
- `overflow: hidden` clips edge focus/horizontal overflow — **low** rejected: panes already clip; 320px desktop contract.
- No runtime measured widths in matrix — **false**: agreed CSS-constraint approach; fake DOM does not layout flex like Firefox.
- Test title omitted crush-prevention — **low** → **patch**: title updated.
- Triple `flex`/`width`/`max-width` on sidebar slot — **false**: intentional crush-proof redundancy.
- Viewport narrower than 320px + usable canvas — **defer**: outside DoD (normal desktop window); see deferred-work.
- Root-cause note names only Picker/Palette — **low** rejected: examples only; cap applies to any content.
- `.sidebar` missing `min-width: 0` — **low** → **patch**: added.
- No manual verification section in oneshot spec — **false**: covered by Present / operator DoD.

### Review Findings

- [x] [Review][Patch] Matrix omits `.sidebar { min-width: 0 }` assertion [`scripts/chrome-shell-matrix.test.mjs:313`] — extend layout flex-caps test with the same `assert.match` used for `.canvas-host` / `.canvas-surface`
- [x] [Review][Patch] Stale mountSidebar comment still says `320px / flex-shrink:0` [`src/sidebar/index.ts:52`] — update to the live chrome-sidebar-slot contract (`flex: 0 0` + max/min-width caps)
- [x] [Review][Defer] Narrow viewport can still starve the canvas [`src/styles/base.css:351`] — deferred: already parked from build review of this spec; out of DoD (normal desktop); reopen if responsive chrome becomes a goal

#### Rejected

- Spec `review_loop_iteration: 0` stale vs applied patches — rejected: fix would edit the spec under review
- Deferred-work narrow-viewport entry underspecified (no options/owner) — **low** rejected: entry already has reopen trigger; process polish not everyday harm
- Intent missing observation method for ~2px — rejected: fix would edit the spec under review
- Approach wording singular vs multi-assertion block — rejected: fix would edit the spec under review
- CSS comment names only Picker/Palette — **low** rejected: examples only; build triage already closed this framing
- Root-cause note says literal `320px` vs token — rejected: fix would edit the spec under review
- Spec lacks positive post-fix success criterion — rejected: fix would edit the spec under review
- `overflow: hidden` on sidebar slot may clip wide content / focus — **low** rejected: panes already clip; 320px desktop contract; trade-off accepted in build
- Matrix mixes pre-existing canvas-slot pins with new crush caps — **low** rejected: pins still protect the contract; splitting old vs new is documentation only
- Crush-prevention only pinned by CSS source-text (no laid-out widths) — rejected: agreed CSS-constraint approach for this harness; not reopened as debt
- Edge Case Hunter: sidebar intrinsic content wider than 320px clips — **low** rejected: same overflow trade-off; panes already `overflow: hidden`

