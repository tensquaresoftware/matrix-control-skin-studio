---
title: 'Sidebar PhotoCraft cosmetics'
type: 'feature'
created: '2026-10-19'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: 'eaf7555c90933a53d47699e88bf7eb07566073cc'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-lot-b-photocraft-chrome.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** After Lot B, Skin Studio sidebar chrome still drifts from PhotoCraft: panel floats, tab paint, hue strip thickness/thumb/orientation, field chrome, RGB labels, and IBM Plex instead of PhotoCraft’s Inter / JetBrains Mono.

**Approach:** Cosmetic-only PhotoCraft alignment for the sidebar Color zone (and shared sidebar tab/panel surfaces): exact greys and borders from the request, thinner borderless hue with a discrete right-side triangle thumb, inverted vertical hue (yellow in the lower half), equal gaps beside the hue strip, `#`/RGB field chrome with `R`/`G`/`B` labels aligned to the SV square, and swap UI fonts to Inter + JetBrains Mono via Fontsource.

</frozen-after-approval>

## Implementation Notes

### Agent decisions (locked)
- **Fonts:** PhotoCraft ships `Inter` + `JetBrains Mono` under `assets/fonts` (OFL). Replaced `@fontsource/ibm-plex-*` with `@fontsource/inter` (400/500/600) + `@fontsource/jetbrains-mono` (400); updated type tokens + styles-matrix.
- **Sidebar surfaces:** gutter `#1E1E1E`; floating zones `#323232` with `#1E1E1E` rim + float padding/gap; selected tab `#323232` / `#DEDEDE`; inactive `#262626` / `#808080`.
- **Picker:** SV border `#1E1E1E`; hue **16px**, no border; fields `#242424` / `#4A4A4A`; labels `R`/`G`/`B`; fields row width = SV size for B-edge align.
- **Hue:** invert map `hue = (1 - t) * 360` + matching gradient; triangle thumb to the right of the strip.
- **Review patches:** tab-panel pad → `space-2` so Color stage fits 260px; splitter blue cue via `::before`; raised surface kept elevated `#3A3A3A`; cosmetics pins in styles + palette-picker matrices.

### Files touched
- `src/styles/base.css`, `src/styles/index.ts`, `src/sidebar/picker-pane.ts`
- `package.json` / `package-lock.json`
- `scripts/styles-matrix.test.mjs`, `scripts/palette-picker-matrix.test.mjs`
- `_bmad-output/implementation-artifacts/deferred-work.md` (typography SSOT + stale 16px note)

## Review Triage Log

- Color stage overflow at 260px with float padding — **high** → **patch**: reduced tab-panel horizontal padding to `space-2`.
- Splitter hover blue lost on `height: 0` — **medium** → **patch**: accent line on `::before`.
- Missing cosmetics pins (greys / 16px / RGB labels / hue invert) — **medium** → **patch**: styles + palette-picker assertions.
- Hue thumb hardcoded `#dedede` — **low** → **patch**: `var(--color-text-primary)`.
- `--color-surface-raised` collapsed to panel — **medium** → **patch**: raised `#3a3a3a`.
- DESIGN/UX-DR2 still say IBM Plex — **defer** (deferred-work).
- Stale Lot B “16px vs 24px” defer — **defer** (deferred-work note).
- Oneshot spec lacks Given/When/Then — **false** (oneshot template omits AC by design).
- Inactive sibling tabs look flat — **rejected low** (intentional PhotoCraft minimal tabs).
