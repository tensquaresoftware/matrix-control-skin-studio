---
title: '4-4 Live Preview, LED Fully-On, and Mapping Pulse'
type: 'feature'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '3fe0d405dbba08382ca2555ff782a6228b3322f6'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Mapping and Palette edits already update Orchestrator zone colours, but inventory Object-type faces do not show Mapping-driven colour, LED fully-on is only a zone stub rule, and Mapping changes never pulse the mock — so the calibration loop still feels incomplete.

**Approach:** Keep zone Palette live paint; add Mapping-driven live paint for inventory Object-type faces resolved only via model helpers; enforce LED fully-on (full Palette hex, no intensity UI); on Mapping change, briefly pulse affected Object-type hit outline(s) with chrome `pulse-outline`, then return to steady selection if still selected.

## Boundaries & Constraints

**Always:**
- Canvas continues to subscribe to the single-writer store; Mapping Palette-id edits and Palette hex edits that feed painted faces update the GUI view in the same interaction turn (no reload, no explicit refresh) (FR-19).
- Resolve every paint colour with `findMapping` + `resolvePaletteHex` (or equivalent model helpers) — never read hex off a Mapping (AD-15).
- **Decision LIVE_PAINT_FACES = HIT_FILL_FIRST_PROPERTY:** each Object-type hit chip background paints from the **first Property** of the active State for that type (session State when selected, else the type’s first State), via `findMapping` + `resolvePaletteHex` on the active Skin. Unbound/null → neutral chrome stub. Other Properties share live preview only when they use the same Palette id and that entry’s hex changes.
- **Decision LED_FULLY_ON_SCOPE = ZONE_PLUS_RULE:** Duo `headerLed` zone continues to paint full Palette hex; decorative green Header LEDs stay temporary hard-coded stubs (4.1). LED fully-on is the canvas paint rule for any future LED Property face — full opaque mapped hex, **no** intensity/dim/opacity preview UI (FR-7, AD-13). Matrix covers Duo LED full hex + absence of intensity controls.
- On Mapping change (Palette-id bind/clear/upsert for an `(objectTypeId, stateId, propertyId)`), pulse outline on affected Object-type hit region(s) when present: chrome `--comp-pulse-highlight-*` / `--color-pulse-outline`, **2** repeats × **~400 ms**, ease-out; then steady selection outline if that Object type remains selected (FR-5, AD-16, UX-DR12).
- Pulse does **not** fire for Palette hex-only edits (live paint still updates). Pulse is a no-op when the Mapping’s Object type has no hit region (empty inventory / missing type).
- Seed inventory stays empty (`KEEP_EMPTY`); prove Mapping live paint + pulse with fixture inventory in matrix tests — do not invent Collect ObjectTypes in seed.
- Keep selection sync (4.3), Mapping CRUD/bind (4.2), and zone → Palette-id paint contract (4.1) unchanged. English UI only.

**Never:**
- Free hex on Mapping path; inventing Collect inventory; baking Patch/Master into Object types; intensity/dim LED controls.
- Unbound export gate / history coalesce (Epic 5).
- Pulling a full narrow-repaint architecture unless pulse/selection ACs cannot be met by re-stamping classes after the existing full mock rebuild.
- Changing envelope/prefs schema, SessionUiState keys, or Orchestrator zone ownership.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Palette hex → zone | Edit Patch/Master/Duo LED Palette hex | Zone face updates same turn via `resolvePaletteHex` | Unresolvable → unbound stub (existing) |
| Mapping bind → face | Fixture ObjectType; bind **first** Property of active State → Palette id | Hit chip background paints that hex same turn | Unbound/null → neutral stub, no throw |
| Palette hex → mapped face | First-Property face bound to Palette id; edit that entry’s hex | Hit chip updates to new hex same turn | N/A |
| Mapping change → pulse | Upsert/clear Mapping for type with a hit | Hit outline pulses 2× ~400 ms chrome pulse; then steady if selected | No hit → no pulse, no throw |
| Palette hex → no pulse | Recolour Palette only | Faces update; no pulse | N/A |
| Empty inventory | Seed `objectTypes: []` | Zones still live-paint; zero hits → no Mapping faces / no pulse targets | N/A |
| LED fully-on (ZONE_PLUS_RULE) | Duo `headerLed` zone + any future LED Property face | Duo paints full Palette hex; greens stay hard-coded stubs; no dim/intensity control exists | Unbound Duo → stub |
| Selection after pulse | Type still selected when pulse ends | Steady 2px selection outline remains | N/A |

</frozen-after-approval>

## Code Map

- `src/canvas/index.ts` — `store.subscribe(paint)` + full `renderMockComposition` already; hit build applies HIT_FILL_FIRST_PROPERTY fill; detect Mapping deltas vs previous project snapshot to stamp pulse class on affected hits after rebuild; keep zone `applyZonePaint` / selection outline / 4.3 hit wiring
- `src/canvas/mock-layout.ts` — reuse `listObjectTypeHitRegions` / `ORCHESTRATOR_ZONES`; do not turn zones into ObjectTypes; no seed inventory invention
- `src/model/palette-helpers.ts` — reuse `findMapping`, `resolvePaletteHex`, `isMappingUnbound`; paint never reads Mapping.hex
- `src/styles/base.css` — tokens `--color-pulse-outline`, `--comp-pulse-highlight-*` already reserved (repeats=2, duration=400ms); add `@keyframes` + `.is-pulsing` (or equivalent) outline animation; keep selection outline tokens; do not restyle chrome
- `src/sidebar/mappings-pane.ts` / `picker-pane.ts` — mutation paths already `store.apply`; no API change expected — canvas reacts via subscribe
- `scripts/canvas-mock-matrix.test.mjs` (+ possibly new `scripts/live-preview-matrix.test.mjs`) — fixture inventory: first-Property hit fill; Palette hex → mapped face; Mapping change → pulse; empty inventory no-op; ZONE_PLUS_RULE (Duo full hex, no intensity UI, greens unchanged); wire `package.json` `test` if new file
- Do **not** change: Mapping CRUD UX (4.2), selection sync bridge (4.3), zone Palette-id ownership (4.1), history/export (Epic 5)
- Deferred full narrow-repaint stays out unless pulse cannot complete on post-rebuild nodes

## Tasks & Acceptance

**Execution:**
- [x] `src/canvas/index.ts` -- HIT_FILL_FIRST_PROPERTY paint + Mapping-delta pulse stamp after paint; keep zone/selection paths -- FR-19 / FR-5 / AD-16
- [x] `src/styles/base.css` -- Wire pulse-outline keyframes/class from existing `--comp-pulse-highlight-*` tokens -- UX-DR12
- [x] `scripts/*-matrix.test.mjs` (+ `package.json` if needed) -- I/O matrix with fixture inventory -- edge coverage

**Acceptance Criteria:**
- Given an active Skin and a Mapping or Palette hex edit that feeds a painted face, when the edit commits through the store, then the GUI view updates in the same interaction turn without reload.
- Given a Mapping change for an Object type that has a mock hit, when the upsert/clear lands, then that hit pulses outline 2× ~400 ms with chrome pulse tokens, then returns to steady selection if still selected.
- Given ZONE_PLUS_RULE, when the Duo Header LED zone paints and the canvas mounts, then Duo uses fully-on Palette hex, decorative greens stay stubs, and no intensity/dim UI is present.

## Implementation Notes

- HIT_FILL_FIRST_PROPERTY + Mapping-delta `.is-pulsing` stamp in `src/canvas/index.ts` after full mock rebuild; zone/selection paths unchanged.
- Pulse CSS: `@keyframes mock-hit-pulse-outline` + `.mock-object-type-hit.is-pulsing` from `--comp-pulse-highlight-*`.
- Coverage: `scripts/live-preview-matrix.test.mjs` wired in `package.json` `test`.

## Spec Change Log

## Review Triage Log

- `false` — `.is-pulsing` never cleared so steady selection never returns: after keyframes end (no `animation-fill-mode: forwards`), computed outline falls back to `.is-selected` / default transparent; leftover class is inert until next rebuild
- `medium` — live-preview matrix never binds only non-first Property (`ring`) to prove HIT_FILL_FIRST_PROPERTY ignores it (comment asserts `bypassBtn` instead)
- `low` — no matrix assert that pulse class is gone after ~800 ms while selection remains: JS harness cannot reliably wait CSS animationend; visual steady outline already follows from CSS; rejected (everyday harm low, fix adds timer complexity)
- `medium` — Mapping-delta detection walks every Skin while hit fill uses active Skin only — inactive Skin Mapping edits can pulse hits whose colour did not change
- `false` — Skin delete drops mappings without pulsing: I/O matrix and AC cover Mapping upsert/clear, not Skin CRUD removal; skin-pane delete is out of this pulse contract
- `false` — sprint `in-progress` vs spec `in-review` in one diff: expected mid-build tracking; not a product defect
- `medium` — Mapping change on non-first Property (`ring`) should still pulse the hit; untested (face-only pulse case)
- `false` — ZONE_PLUS_RULE needs hit-fill opacity asserts: decision covers Duo zone full hex + no intensity UI + green stubs; opaque `#RRGGBB` already enforced by `resolvePaletteHex` / `parseOpaqueHex`
- `low` — no `prefers-reduced-motion` opt-out on pulse: rejected (not in frozen intent; everyday operator path unchanged)
- `false` — Code Map lists `isMappingUnbound` but canvas never calls it: paint uses `resolvePaletteHex` null → unbound stub; equivalent discipline, not a missing call
- `medium` — no multi-Skin / `activeSkinId` switch coverage for hit fill (verification-gap)
- `low` — matrix harness duplicated from canvas-mock: rejected as standalone patch (pattern shared across Epic 4); deferred for shared helper
- `false` — Skin present only in previous snapshot never pulses: same as Skin-delete claim; not required by Mapping upsert/clear contract
- `medium` — later store paint while pulse runs aborts in-flight `.is-pulsing` (full rebuild): real under rapid session ticks; accepted by Design Notes re-stamp approach; deferred with existing narrow-repaint debt
- `medium` [verification-gap] — ring-only Mapping must leave hit fill unbound — pre-verified; disposition patch
- `medium` [verification-gap] — non-first Property Mapping edits must still pulse — pre-verified; disposition patch
- `medium` [verification-gap] — active Skin must drive which Mappings paint the hit — pre-verified; disposition patch

## Design Notes

- Prefer re-stamping `.is-pulsing` on newly built hit nodes after detecting a Mapping delta — avoids pulling the deferred narrow-repaint refactor unless animation cannot start that way.
- Seed stays empty; matrices inject fixture ObjectTypes the same way as 4-2 / 4-3.
- HIT_FILL_FIRST_PROPERTY: resolve paint State as session `selectedStateId` when the hit’s type is selected and that State is listed; otherwise the type’s first State.
- ZONE_PLUS_RULE: do not retarget `.mock-led-green` in this story.

## Verification

**Commands:**
- `npm test` -- expected: all matrix scripts pass (including live-preview / pulse coverage)
- `npm run build` -- expected: TypeScript/Vite build succeeds
