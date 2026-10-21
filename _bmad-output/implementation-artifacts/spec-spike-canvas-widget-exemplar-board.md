---
title: 'Spike: Canvas Widget Exemplar Board'
type: 'feature'
created: '2026-10-20'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '21ec14acbeeb8e684e6e21662ec37bd978d2f311'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiate">

## Intent

**Problem:** The GUI view still shows the Lot A / Epic 4 Header–Body–Footer mock (grey panable plaque, Orchestrator bands, decorative knobs/faders, provisional hits). That silhouette blocks validating whether Matrix-Control base widgets are drawable as recognizable bricks before any window assembly or Lot C fidelity work.

**Approach:** Exploratory spike — totally purge the mock composition and its grey panable `.canvas-surface` plaque, then show a flat, labeled exemplar board (one instance each of the base widgets) under the existing pan/zoom host so the left viewport is empty host chrome plus the board only.

## Boundaries & Constraints

**Always:**
- Purge mock composition, Orchestrator zones, decorative knobs/faders, Lot A hit regions, and the raised grey plaque (`--color-surface-raised` / `#3a3a3a`) on the panable surface so the left viewport no longer shows a mobile grey “fake window” plate — only app/host background plus the exemplar board.
- Draw widgets as isolated flat pieces (HTML/CSS preferred) with DesignAtoms sizes at UI Scale 100% from Matrix-Control `Source/GUI/Widgets` (+ `DesignAtoms.h` / `WidgetLooks.h` as size/look sources). Orbital capture is secondary visual reference only.
- Mount at least one labeled exemplar of each: Slider, Combo, Button, Toggle, Label, GroupLabel, ModuleHeader, ModulationBusHeader, SectionHeader, EnvelopeDisplay, TrackGeneratorDisplay, PatchNameDisplay, HorizontalSeparator — laid out for readable scanning (grid or vertical file).
- Populate exemplars with realistic labels/values (Orbital-inspired when useful). English UI strings.
- Keep pan/zoom prefs wiring: transform still applies so the **board** pans/zooms; host chrome (top bar, sidebar, prefs) unchanged except what is strictly required for empty canvas + board.
- Adapt mock-assuming matrices so they assert the spike honestly (no greenwash): board present, mock DOM gone, no grey raised plaque as pan target, pan/zoom still works. Selection/pulse may honestly have zero canvas targets until Lot C.
- Note other distinct bricks (NumberBox, Led, PeakIndicator, …) as follow-up in Design Notes / Implementation Notes — do not block the spike on them.
- `npm test` / `npm run build` green. No commit/push unless Guillaume asks.

**Never:**
- Reconstruct the full Matrix-Control window, panel tree, or Lot C fidelity pass; no Correct Course; no PRD/UX/sprint-status updates for Lot C.
- Copy JUCE panel→subpanel DOM structure; chase pixel-perfect GUI-wide match.
- Remove seed Palette Patch/Master entries or envelope schema “while here” — leave them unused on canvas.
- Invent Collect ObjectTypes or fake selectable hits on exemplars to keep 4.3/4.4 green without real targets.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Board mounts | Chrome mounts canvas | Labeled exemplars for all listed base widgets; no Header/Body/Footer mock, no orch zones, no mock hits | N/A |
| No grey plaque | Inspect pan surface / host | Pan transform may still live on a transparent/neutral surface wrapper; no raised `#3a3a3a` plaque reading as fake window fill | N/A |
| Pan/Zoom | Non-default prefs or live drag/arrows | Board rides transform; host background visible around board | N/A |
| Selection dormancy | Click board / empty host | No Object-type hit / zone select targets; sidebar selection sync not driven by mock hits | N/A |
| Matrices honest | `npm test` | Suites no longer require mock composition / zone fills / hit DOM; assert board + purge + pan | Fail if still asserting mock |

</frozen-after-approval>

## Code Map

- `src/canvas/index.ts` — Replace `renderMockComposition` / hit/zone selection paint with exemplar-board mount; keep `applyCanvasViewFromPrefs`, host pan/keyboard, store wiring only if still needed (Palette zone repaint can go).
- `src/canvas/mock-layout.ts` — Delete or replace with board layout metadata (widget id, label, demo values, DesignAtoms sizes); remove `MOCK_COMPOSITION` / `ORCHESTRATOR_ZONES` / hit helpers consumers.
- `src/styles/base.css` — Remove `.canvas-mock` / `.mock-*` / hit styles; clear `.canvas-surface` raised background + fake-window border/radius so plaque disappears; add board/exemplar styles. Keep `.canvas-host` app background.
- `src/chrome/index.ts` — Keep `mountCanvas` call; drop unused selection/store args only if types require (prefer minimal churn).
- `src/sidebar/canvas-selection-sync.ts` — Leave module; canvas may stop calling `notifyCanvasHit` when no hits (honest dormancy).
- Matrix-Control refs (read-only): `…/Matrix-Control/Source/GUI/Widgets/*`, `Layout/Design/DesignAtoms.h`, `Looks/WidgetLooks.h`, `Skins/SkinValues.h`.
- Tests: `scripts/canvas-mock-matrix.test.mjs` → retarget or rename to board matrix; `scripts/chrome-shell-matrix.test.mjs` (drop zone-fill asserts); `scripts/selection-sync-matrix.test.mjs`, `scripts/live-preview-matrix.test.mjs` — rewrite/skip paths that require mock hits/zones so results stay honest.
- `package.json` — Update test script name if matrix file renamed.

## Tasks & Acceptance

**Execution:**
- [x] `src/canvas/mock-layout.ts` (or replacement) -- Replace mock composition/zones/hits with exemplar board descriptors (ids, English labels, demo values, 100% sizes) -- flat bricks
- [x] `src/canvas/index.ts` -- Purge mock render + hit/zone selection/pulse DOM; mount labeled board under pan surface; keep pan/zoom -- Intent
- [x] `src/styles/base.css` -- Remove mock/plaque styles; transparent/neutral pan surface; style board + exemplars -- no grey plaque
- [x] `scripts/canvas-mock-matrix.test.mjs` (+ rename if clearer) -- Assert board widgets present, mock/orch/hits absent, no raised plaque, pan transform still applied -- I/O matrix
- [x] `scripts/chrome-shell-matrix.test.mjs` / `selection-sync-matrix.test.mjs` / `live-preview-matrix.test.mjs` -- Minimal honest adaptation (no fake mock asserts) -- no greenwash
- [x] `package.json` -- Point `test` at renamed matrix if needed -- CI

**Acceptance Criteria:**
- Given Skin Studio chrome, when the canvas mounts, then the left GUI view shows a labeled exemplar board of the listed base widgets and does not show the Header/Body/Footer mock, Orchestrator bands, or Lot A hit regions.
- Given the pan surface styles, when the operator looks at or pans the view, then there is no raised grey `#3a3a3a` plaque acting as a fake window background — only host/app background plus the board.
- Given non-default Zoom/pan prefs, when the canvas applies prefs, then the exemplar board moves/scales with the existing transform path.
- Given existing matrix suites, when `npm test` runs, then assertions match the purged mock + board reality (no residual “mock still there” greens).

## Implementation Notes

- Replaced `mock-layout.ts` with `exemplar-board.ts` (descriptors + `EXEMPLAR_BOARD`).
- Canvas mount is static (no store repaint / hit / zone / pulse). `selectionSync` option kept for chrome call-site compatibility but unused.
- Matrix rename: `scripts/canvas-exemplar-board-matrix.test.mjs`.
- Also adapted `history-matrix` (sidebar Object select instead of canvas hit) and fixed pre-existing `palette-picker` harness missing `removeAttribute` (needed for `npm test` green).
- Review patches: board matrix asserts captions + DesignAtoms sizes + empty surface backgroundColor; selection-sync restored `closest` + board-click keeps selection. No commit (spike Always — wait for Guillaume).

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Evidence / route |
|---------|---------|------------------|
| BH: Slider `faceText` unused | low (rejected) | Caption + `valueText` already satisfy scannable realistic demo; unused `faceText` is negligible for spike |
| BH: Slider fill % hard-coded vs `valueText` | low (rejected) | Cosmetic spike desync; not everyday harm |
| BH: `.exemplar-brick` missing `display:flex` | false | `base.css` `.exemplar-brick` sets `display: flex` |
| BH: Separator `height: 8px !important` dual source | low (rejected) | Works; spike-only dual source |
| BH: Matrix skips caption/size asserts | medium → patch | Same root as VG labeled-board gap |
| BH: Plaque hex not asserted on pan target | medium → patch | Same root as VG plaque runtime gap |
| BH: Envelope vs TrackGen look-alike | low (rejected) | Side captions distinguish; Lot C fidelity out of spike bar |
| BH: ModuleHeader vs SectionHeader similar CSS | low (rejected) | Captions distinguish; spike approximations OK |
| BH: No DesignAtoms path citations in TS | low (rejected) | Spec Design Notes already list size anchors |
| BH: Brick font 11px vs Design Notes ~14 | low (rejected) | Fit choice for small bricks; recognizable still |
| BH: Follow-ups missing from Implementation Notes | low (rejected) | Already in Design Notes |
| BH: Empty Spec Change / Triage at review start | false | Normal before triage fill-in |
| BH: No Lot C restore checklist | false | Design Notes already state dormancy + Lot C restore |
| BH: Captions not aria-linked to bricks | low (rejected) | Board has aria-label; spike a11y not expanded |
| BH: palette-picker harness fix bundled | false | Required for honest green `npm test`; noted in Implementation Notes |
| EC: remount stacks pan/deselect listeners | defer | Pre-existing single-mount chrome pattern; same class as deferred canvas dispose |
| EC: selection-sync harness dropped `closest` | medium → patch | Diff removed `closest`; landmine if sidebar paths use it in this matrix |
| VG: labeled board / sizes only checked by kind | medium → patch | Clear captions/sizes while keeping kinds → suite still green |
| VG: board-click deselect path untested | medium → patch | Breaking `clickOriginatedInsideBoard` clears selection with no failing test |
| VG: plaque only CSS source-text | medium → patch | Inline `#3a3a3a` on surface would still pass CSS regex |

## Design Notes

- **Pan wrapper:** Keep a `[data-canvas-surface]` transform target for Epic 2 prefs continuity, but make it background-transparent and without the raised “card” look so it does not read as a window plate. Size it to content (board) rather than a flex-filling grey slab when practical.
- **Sizes (UI Scale 100% anchors):** Slider 60×16; Combo height 16 (width ~60–104 by role); Button/Toggle height 20; Label height 16; GroupLabel height 24; ModuleHeader / ModulationBusHeader / SectionHeader height 32; EnvelopeDisplay / TrackGeneratorDisplay 152×128; PatchNameDisplay 152×72; HorizontalSeparator height 8. Default control font ~14.
- **Follow-up bricks (out of spike board unless trivial):** NumberBox, Led, PeakIndicator; HierarchicalComboBox / popup suite; ParameterCell / ModulationBusCell (composites).
- **4.3 / 4.4:** Canvas→sidebar hit sync and mapping pulse go dormant with zero targets; do not invent exemplar hits. Lot C / later window assembly restores real selectable regions.
- **Colours:** Approximations inspired by Matrix-Control dark looks are enough for “recognizable”; full SkinColourId ↔ Palette live paint stays Lot C.

## Verification

**Commands:**
- `npm test` -- expected: all matrices pass with board/purge asserts
- `npm run build` -- expected: TypeScript/Vite build succeeds

**Manual checks (if no CLI):**
- Open Skin Studio: left view = dark host + labeled widget board; pan/zoom moves the board; no grey mobile plaque; top bar / sidebar still usable.
