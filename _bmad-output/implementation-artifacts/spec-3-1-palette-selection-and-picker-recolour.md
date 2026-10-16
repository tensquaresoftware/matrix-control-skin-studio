---
title: '3-1 Palette Selection and Picker Recolour'
type: 'feature'
created: '2026-10-16'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'd35d47192fba12d1fa3b5a8a5e066fc604db17dd'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The sidebar Picker and Palette panes are empty shells, so operators cannot select a Palette entry or recalibrate its opaque hex even though seed already ships `duoLedYellow` / `#FFCC00`.

**Approach:** Populate Palette rows from `project.palette`, keep selection in sidebar-local UI state (not SessionUiState), and let the Picker edit only the selected entry’s hex via HSV sliders + mono hex field with live write-through, without free hex on Mapping paths.

## Boundaries & Constraints

**Always:**
- **Decision COMMIT_MODE = LIVE:** sliders and hex write through to the selected entry as the operator edits; no Apply button; coalesce deferred to story 5-1.
- Select a Palette swatch row → Picker targets that entry only (UX-DR7 / FR-13 / AD-16). No selection → Picker may show idle wells but must not write hex.
- Hex is opaque `#RRGGBB` only; normalize uppercase on write; case-insensitive parse on read. Hex fields use IBM Plex Mono via existing `.type-mono` / picker-pane tokens (NFR-3 / UX-DR2).
- Selection stays **sidebar-local** — do **not** add `selectedPaletteEntryId` to `SessionUiState` (AD-6 keys remain Object / State / Skin only).
- Mutate palette hex through the existing single-writer path used by chrome today (`store.apply` with a cloned `project`); do not invent dual writers. Full `history.execute` + 400 ms coalesce remains Epic 5 story 5-1.
- Mapping pane stays free of any `#RRGGBB` text input; model/persist already reject hex-as-`paletteEntryId` — keep that gate; add a regression that Mapping body has no free-hex field (FR-1 / UX-DR9 foundation).
- Palette row: swatch chip + label (`constantName` if present else `id`) + hex readout; selected ring uses `--comp-palette-swatch-selected-ring`. Picker layout: large swatch + Hue/Sat/Val sliders + mono hex field (no Apply).
- Cover select → edit → store hex, idle no-commit, invalid hex reject, Mapping no free-hex input in a focused Node matrix under `scripts/`; keep `npm test` / `npm run build` green.

**Never:**
- Palette create / rename / delete affordances or delete-confirm modal (Story 3.2).
- Skin tab CRUD, Mapping bind UI, canvas preview paint of palette changes (later stories).
- Expand SessionUiState; write Zoom/pan/sidebar heights via this path; put hex on Mapping.
- Implement undo/redo stack or coalesce timers here (5-1); wire Import/Export.
- Add an Apply button or stage-then-commit picker flow.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Select + recolour | Seed project; click `duoLedYellow` row; change hex/sliders to `#112233` | `project.palette[0].hex` becomes `#112233` immediately; row + picker swatch update; id/`constantName` unchanged | N/A |
| Idle picker | No Palette row selected; operator moves sliders / types hex | Store palette unchanged | Ignore commits |
| Reselect | Select entry A, then B | Picker shows B’s hex; further edits touch B only | N/A |
| Invalid hex | Selected entry; type `#GG` / empty / alpha `#RRGGBBAA` | Store unchanged; field returns to last valid selected hex | Reject write |
| Mapping guard | Inspect Mapping pane body | No text/color input that accepts free `#RRGGBB` | N/A |
| Multi-entry (test fixture) | Two palette entries; edit second while selected | Only second entry hex changes | N/A |

</frozen-after-approval>

## Code Map

- `src/sidebar/index.ts` — `mountSidebar` / `createPane`; picker + palette bodies are empty; mount selection + picker/palette DOM here (or extract sibling modules under `src/sidebar/` if file grows)
- `src/model/types.ts` + `src/model/store.ts` — `PaletteEntry.hex`; `store.apply({ project })` clone-replace; `SessionUiState` must stay three keys
- `src/seed/seed-data.ts` — `SEED_PALETTE` / `duoLedYellow` / `#FFCC00` / `kDuoLedYellow` for happy-path tests
- `src/styles/base.css` — `--comp-picker-pane-*`, `--comp-palette-swatch-*`, `.type-mono` / `.type-mono-sm`; add concrete row/picker rules consuming those tokens
- `src/persist/envelope.ts` — `isValidMappingPaletteEntryId` hex reject; do not weaken
- `src/history/index.ts` — leave stub (`export {}`); no execute/coalesce in this story
- `scripts/` — new or extended matrix (prefer `scripts/palette-picker-matrix.test.mjs`) for I/O cases; reuse jsdom/store boot patterns from `scripts/chrome-shell-matrix.test.mjs`
- `_bmad-output/planning-artifacts/ux-designs/.../mockups/editor-main.html` — visual reference for picker/palette layout
- Do **not** change: sidebar splitter/prefs heights, Skin combo, canvas paint, envelope schema, seed inventory content

## Tasks & Acceptance

**Execution:**
- [x] `src/sidebar/index.ts` (+ optional `src/sidebar/palette-pane.ts` / `picker-pane.ts`) -- render Palette rows from store; local selection; mount Picker HSV + hex with live write-through; subscribe/resync on `store.apply`; commit hex only when selected -- FR-13 / AD-16
- [x] `src/styles/base.css` -- swatch-row / picker control styles from existing component tokens; mono on hex -- UX-DR2
- [x] `scripts/palette-picker-matrix.test.mjs` -- select/recolour live, idle no-commit, invalid hex, multi-entry isolation, Mapping body has no free-hex input -- regression
- [x] `src/model/*` / `src/persist/envelope.ts` -- touch only if a tiny shared hex normalize helper is clearly needed; otherwise keep helpers local to sidebar -- discipline (helpers kept in `src/sidebar/hex-color.ts`)

**Acceptance Criteria:**
- Given a seeded palette in the Palette pane, when the operator selects a swatch row, then the Picker edits that entry only.
- Given a selected entry, when a valid opaque hex is entered or sliders change, then that entry’s `hex` updates in the project store immediately and Palette/Picker readouts refresh; Mapping slots never receive typed `#RRGGBB`.
- Given no Palette entry selected, when the operator interacts with the Picker, then no palette hex is written.
- Given the Mapping pane, when inspecting edit affordances, then there is no free `#RRGGBB` input path.

## Implementation Notes

## Spec Change Log

## Review Triage Log

- `false` — Spec Code Map still says empty shells — reject (would only edit this build’s spec); process metadata
- `false` — Blank Implementation Notes / Change Log / Triage at in-review — reject (would only edit this build’s spec); process fill-in, not a product defect
- `false` — sprint-status `in-progress` vs spec `in-review` — reject (workflow sync, not a product defect; step-05 updates sprint)
- `medium` — Idle Picker: slider/hex can drift from idle wells when no selection — verified: `onSliderInput` / hex `input` return without `syncFromStore` when unselected — route patch
- `low` rejected — Hex field missing placeholder/maxlength/inputmode — everyday reject + blur already restores valid hex
- `low` rejected — Selected row shares hover background token — cosmetic; ring already marks selection
- `false` — store/selection subscribe never unsubscribed — production mounts chrome/sidebar once; New replaces project via `apply`, does not remount panes
- `medium` — Chrome mount path never asserts store→Palette/Picker wiring — verification-gap pre-verified; chrome can drop `store` while palette-picker matrix stays green — route patch
- `false` — Mapping no-free-hex test should also hit envelope reject — AC asks Mapping body has no free-hex input (covered); envelope hex-as-id already covered in persist matrix
- `false` — RGB↔HSV Math.round can nudge hex after slider touch — inherent LIVE HSV quantization; syncing flag prevents silent commit on sync-only updates
- `low` rejected — Missing webkit/moz range track/thumb CSS — cosmetic; accent-color range works in Chromium/Safari target
- `low` rejected — Incomplete listbox/radiogroup a11y on swatch rows — would add branching complexity beyond a direct fix
- `false` — I/O matrix pins `palette[0]` for duoLedYellow — reject (would only edit this build’s spec); tests already look up by id
- `false` — Epic 3 context still mentions 400 ms coalesce — reject (edit agent-context / epic file); story frozen intent already defers coalesce to 5-1
- `medium` — Idle slider drift (edge-case) — same defect as idle Picker drift above — route patch (grouped)
- `low` rejected — Invalid stored hex leaves picker stuck — seed/writer paths emit opaque hex; operator invalid input already restored on blur; corrupt import is later story
- `false` — Duplicate palette ids confuse selection — unreachable with current seed/writers; not introduced by this change
- `medium` — Orphan listeners on remount (edge-case) — same as subscribe finding; false for production single-mount path (already logged)
- `medium` — Palette row `constantName` else `id` label never asserted — verification-gap pre-verified — route patch
- `medium` — Slider write-through test circular on `hsvToHex` — verification-gap pre-verified; golden `#4C7F99` for (200,50,60) — route patch
