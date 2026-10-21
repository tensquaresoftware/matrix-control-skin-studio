---
title: 'Exemplar board Black / Orbital visual recalibration'
type: 'feature'
created: '2026-10-20'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: '21ec14acbeeb8e684e6e21662ec37bd978d2f311'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The spike exemplar board uses Skin Studio caricature styling (Inter stack, invented greens, fake “Amount” / “64%” / “LFO 1”) so bricks are not recognizable against Matrix-Control skin Black or the Orbital patch capture.

**Approach:** Keep the flat labeled board and transparent pan surface; restyle bricks with Matrix-Control Black ColourChart / Looks paint (exact slider geometry and greens), embed PT Sans Narrow (and other product fonts only if a brick uses them), and populate captions/values from Orbital cases (Slider 60×16 value 48 like PULSE WIDTH; Combo 60×16 PRESSURE like TRACK INPUT; PatchName ORBITAL; other readable Orbital faces). Chrome pan/zoom unchanged except gallery font assets. No Lot C window rebuild. No commit/push unless Guillaume asks.

</frozen-after-approval>

## Implementation Notes

- Copied PT Sans Narrow Regular + Bold from Matrix-Control `Assets/Fonts/` into `public/fonts/matrix-control/` with `@font-face` via `src/styles/matrix-control-fonts.css`. Captions stay on Skin Studio Inter tokens; bricks use `--mc-font`.
- PatchNameDisplay uses PT Sans Narrow 28 + ColourChart red (`#FF0000`) — Matrix-Control `TypographyStyleId::kPatchName`, not Orbitron (Orbitron is brand/About only).
- Slider paint: brick = track `#002D0E`; inset 1px value bar `#00785E`; width `round((60−2)×48/63)=44`; centered `48` in `#00DDAD` PT Sans Narrow 14. Helper `sliderValueBarWidthPx`.
- Orbital faces: PRESSURE @ 60×16; COPY; ON; FREQUENCY; INTERNAL PATCHES; DCO 1; PATCH EDIT; ENV 1; RAMP 1; ORBITAL; bus columns SOURCE/AMOUNT/DESTINATION.
- ColourChart CSS vars on `.exemplar-board` (`--mc-green1`…`4`, greys, blue, red). Removed invented `#00aa55` exemplar paints.
- Matrix extended for Orbital faces, fill width 44, Black hexes, font files on disk, slider inset CSS, toggle green2, combo chevron green3.
- Review patches: default slider max 63; toggle `ON`; trim OFL header to PT only + `SOURCE.txt`; drop unused `--mc-orange`.
- Deferred: ADSR/ramp silhouettes; distinct ModulationBusHeader column layout.
- No commit (Intent + project policy).

## Review Triage Log

- Spec empty / status in-progress — false (oneshot finalize writes Notes + `done`).
- Matrix still named “spike” — false (board is the spike artifact; Black/Orbital asserts added).
- green2 unasserted — high→patched (assert toggle `--mc-green2`).
- Captions not asserted off `--mc-font` — false (intentional chrome Inter).
- Bold unused — false (shipped for product parity; Typography uses Regular).
- Font files not asserted — medium→patched (`existsSync` Regular/Bold + SOURCE).
- OFL lists Orbitron/Montserrat — medium→patched (header PT-only + SOURCE.txt).
- Orbitron for PatchName — false (source is PT Sans Narrow 28).
- Toggle `On` casing — low→patched (`ON`).
- Envelope/Track generic stripe — defer (deferred-work).
- ModulationBusHeader flat string — defer (deferred-work).
- Other faces undocumented as Orbital — false (COPY/FREQUENCY/DCO 1/PATCH EDIT/ORBITAL from capture).
- Combo chevron unlocked — medium→patched (assert `--mc-green3` triangle).
- CSS inset vs JS fill — medium→patched (assert `left/top/bottom: 1px`).
- Separator `!important` height — low rejected (pre-existing spike; rare operator harm).
- Unused `--mc-orange` — low→patched (removed).
- Slider default max 1 — medium→patched (default 63).
- No font provenance note — low→patched (`SOURCE.txt`).
