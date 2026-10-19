---
title: 'Lot B — Photocraft / Photoshop chrome'
type: 'feature'
created: '2026-10-19'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '1e758274d1ebaa94bd2acf6c6be8ffabbcb947bc'
context:
  - '{project-root}/_bmad-output/planning-artifacts/sprint-change-proposal-2026-10-19.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-Matrix-Control-Skin-Studio-2026-10-15/DESIGN.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-Matrix-Control-Skin-Studio-2026-10-15/EXPERIENCE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Skin Studio chrome still matches the locked Epic 2 shell (320px sidebar, context strip, four panes, HSV sliders) — too wide, too much dead chrome, picker unusable for calibration, Unbound buried without a persistent tab badge.

**Approach:** Implement Lot B Photocraft / Photoshop chrome only: 260px sidebar, two tabbed zones, square+hue Color picker with `#`+RGB, Object/State in the top bar, Skin then Zoom, remove context strip — without touching Lot A seed/click or Lot C mock fidelity.

## Boundaries & Constraints

**Always:**
- Sidebar default width **260px**; Photocraft-aligned surface greys from DESIGN.md (hexes tunable without reopening product).
- Zone 1 tabs **`Color` | `Palette`** (Picker renamed Color). Zone 2 tabs **`Skin` → `Mappings` → `Unbound`**. No redundant panel titles when tabs already name the view.
- Color tab: SV square ≈ **200×200** + **vertical hue** strip; **no** Hue/Sat/Val sliders; one row `#` label + 6-char hex field (no truncation, e.g. `FFCC00`) + `R:` `G:` `B:` decimal on the same line; live sync; commit only if a Palette entry is selected (AD-16); coalesced undo unchanged (AD-7).
- Splitter between the two zones: marked gutter; **blue accent line** on hover/drag; both heights persist under prefs keys `colorPalette` / `skinMappingsUnbound`. Legacy three-key `sidebarPaneHeights` (`palette` / `mappings` / `unbound`) or invalid shape → **defaults** (AD-8).
- **Unbound count badge on the Unbound tab** even when that tab is inactive.
- Remove context strip. **Object** + **State** (labels + living selects, same session semantics as today’s mappings editors) live in the top bar. Empty → `—`.
- Right block: **Skin then Zoom**; Skin+Zoom ≈ **260px** budget; **do not** change Zoom combo width; adapt Skin combo only. Left ops order unchanged: New / Import / Export · Undo / Redo.
- Skin buttons: **Create**, **Duplicate**, **Delete** (not “Create Skin”, not “…”). Remove “Type-level only — no per-instance colour overrides.”
- English chrome (NFR-9); keyboard-focusable tabs with focus ring (NFR-8).
- Mappings remain palette-id-only; hex edits only via Palette selection + Color tab.

**Never:**
- Lot A: invent/repair seed inventory, clickable-mock fidelity beyond chrome wiring, palette colour-name redesign.
- Lot C: redraw / enrich Matrix-Control mock.
- Epic 6, left rail, layers tree, bottom chrome, paint-bucket, i18n.
- Pixel-clone Photocraft; change Zoom combo width; reshape mappings model / `formatVersion` / packing.
- Reintroduce 320px default, four-pane stack, context strip, or HSV Hue/Sat/Val sliders.
- Regenerate stale UX HTML mockups.
- Bypass `history.execute` for picker writes; commit Color when no Palette entry is selected.

**Agent decisions (locked for this Build):**
- Default active tabs: **Color** (zone 1), **Mappings** (zone 2) — preserve prior “working” default.
- Hex field stores/displays **6 hex digits** without `#` prefix; `#` is a static label before the field.
- Default zone heights: fit Color square+hue+fields without horizontal scroll at 260px; clamp mins so neither zone collapses below a usable tab strip + content.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Cold layout | Fresh prefs | Sidebar 260px; two zones; no context strip; Object/State in top bar; Skin then Zoom | N/A |
| Legacy prefs | Old 3-key `sidebarPaneHeights` | Heights fall back to Lot B defaults (`colorPalette` / `skinMappingsUnbound`) | Ignore legacy keys |
| Color drag | Palette entry selected; drag SV or hue | Live hex sync; coalesced undo burst; flush on pointer end | No commit if no selection |
| Color fields | Selected entry; edit `#` / R / G / B | Live sync square/hue; coalesce; blur flushes / reverts invalid hex | Invalid hex ignored / blur revert |
| Tabs | Click / keyboard Color↔Palette, Skin↔Mappings↔Unbound | Panels switch; focus ring; Unbound badge visible when inactive if count > 0 | N/A |
| Object/State | Change top-bar Object or State | Session updates; Mappings rows refresh; sticky Skin switch unchanged | Empty shows `—` |
| Skin microcopy | Skin tab | Buttons Create / Duplicate / Delete; no type-level reminder sentence | N/A |
| Density | Color tab at 260px | No horizontal scroll; 6-char hex fully visible | N/A |

</frozen-after-approval>

## Code Map

- `src/styles/base.css` — tokens: `--space-sidebar-width: 260px`, Photocraft greys + gutter/tab/picker-sv/hue; remove live context-strip layout; splitter hover blue; Skin combo width; tab chrome
- `src/chrome/index.ts` — drop `buildContextStrip`; mount Object/State selects in top bar; reorder right block Skin then Zoom; sync Object/State from session (reuse sticky semantics); keep Export/Undo/Redo/New/Import wiring
- `src/sidebar/index.ts` — replace 4-pane stack with **two** zone hosts + **one** splitter; prefs keys `colorPalette` / `skinMappingsUnbound`; legacy 3-key → defaults; mount zone tablists
- `src/sidebar/picker-pane.ts` + `src/sidebar/hex-color.ts` — replace HSV sliders with SV square + vertical hue + `#`/RGB row; keep `commitHex` / `coalesceKey: hex:${id}` / `flushCoalesce` / AD-16 gate; RGB helpers as needed (hsv↔rgb via existing HSV math OK internally)
- `src/sidebar/palette-pane.ts` — mount under Palette tab (no redundant “Palette” pane title)
- `src/sidebar/skin-pane.ts` — dissolve into zone-2 tabs; buttons Create/Duplicate/Delete; remove reminder; stop hosting Mappings|Skin segmented control
- `src/sidebar/mappings-pane.ts` — **rows only** (remove Object/State selects from here; they move to chrome); keep `data-mappings-*` property list + focus/pulse
- `src/sidebar/unbound-pane.ts` — badge mounts on **Unbound tab** (not a separate pane head); list body unchanged; empty-inventory honesty from Lot A preserved
- `src/persist/prefs.ts` — document/accept two-key heights; load path already falls back on corrupt prefs — ensure sidebar never partial-migrates legacy 3-key
- Reuse unchanged: `src/history/` coalesce, `palette-selection.ts`, export gate `src/io/`, canvas/seed (Lot A), mock layout (Lot C out)
- Matrices to update: `scripts/chrome-shell-matrix.test.mjs`, `scripts/styles-matrix.test.mjs`, `scripts/palette-picker-matrix.test.mjs`, `scripts/skin-tab-matrix.test.mjs`, `scripts/mappings-matrix.test.mjs`, `scripts/unbound-pane-matrix.test.mjs`, `scripts/persist-matrix.test.mjs` (prefs keys), plus any suite asserting context strip / 320 / HSV / Create Skin copy
- Continuity: Epic 2 stories remain done; SSOT is Lot B proposal + DESIGN/EXPERIENCE/AD-11 — do not restore Epic 2 geometry from old story ACs

## Tasks & Acceptance

**Execution:**
- [x] `src/styles/base.css` — Photocraft tokens, 260 sidebar, tabs/gutters/splitter blue hover, picker SV+hue+#RGB, drop context-strip live layout — Lot B surfaces
- [x] `src/chrome/index.ts` — Object/State in top bar; Skin then Zoom; remove context strip; Skin combo width only — chrome IA
- [x] `src/sidebar/index.ts` (+ tab shell) — two zones, one splitter, prefs `colorPalette`/`skinMappingsUnbound`, legacy → defaults — sidebar IA
- [x] `src/sidebar/picker-pane.ts` (+ `hex-color.ts` as needed) — square + hue + `#`/RGB; keep coalesce + AD-16 — Photoshop picker
- [x] `src/sidebar/skin-pane.ts` / `mappings-pane.ts` / `unbound-pane.ts` / `palette-pane.ts` — tab hosts, Skin microcopy, Mappings rows-only, Unbound tab badge — zone content
- [x] Matrix suites listed in Code Map — lock I/O matrix + chrome DOM contracts
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` — advance `lot-b-photocraft-chrome` per Build workflow (in-progress → review)

**Acceptance Criteria:**
- Given cold open / fresh prefs, when the shell mounts, then sidebar is 260px, context strip is absent, Object/State live in the top bar, and Skin appears before Zoom on the right.
- Given Color tab with a Palette entry selected, when the operator drags the SV square or hue or edits `#`/RGB, then the selected entry hex updates with coalesced undo and no horizontal truncation of the 6-char hex.
- Given no Palette selection, when Color controls change, then no project write occurs (AD-16).
- Given Unbound count > 0 and another zone-2 tab active, when the tab strip is visible, then the Unbound tab shows the count badge.
- Given legacy three-key `sidebarPaneHeights`, when prefs load, then zone heights use Lot B defaults (not a broken partial layout).
- Given Skin tab, when buttons render, then labels are Create / Duplicate / Delete and the type-level reminder sentence is gone.
- Given `npm test` and `npm run build`, when they finish, then both exit 0.
- Given the Lot B diff, when reviewed, then Lot A seed/inventory/click behaviour and Lot C mock geometry are not redesigned (chrome wiring only).

### Review Findings

- [x] [Review][Decision] Hue drag lift on near-black / near-gray — **rejected (non-sujet)** — Guillaume: Photocraft parity = SV toward black/white must not move hue thumb (already Lot B HSV model); hue-on-black lift not treated as a product decision for this review.
- [x] [Review][Patch] SV plunge to black/white must not thrash hue thumb (Photocraft) — preserve achromatic hue + skip store sync mid-drag [`src/sidebar/picker-pane.ts`] + matrix case
- [x] [Review][Patch] SV drag filters pointerId like hue [`src/sidebar/picker-pane.ts`]
- [x] [Review][Patch] Matrix: near-black hue lift behaviour pinned [`scripts/palette-picker-matrix.test.mjs`]
- [x] [Review][Patch] Matrix: hue strip pointerdown path (not only `.value`+`input`) [`scripts/palette-picker-matrix.test.mjs`]
- [x] [Review][Patch] Matrix: hue coalesce flush via real pointerdown→pointerup lifecycle [`scripts/palette-picker-matrix.test.mjs`]
- [x] [Review][Patch] Matrix: invalid RGB + blur restore (mirror invalid hex) [`scripts/palette-picker-matrix.test.mjs`]
- [x] [Review][Defer] DESIGN hue strip 16px vs runtime 24px — deferred: planning/DESIGN token drift after smoke; product uses 24px hit target
- [x] [Review][Defer] EXPERIENCE State Patterns still cite Sidebar Object sync — deferred: Correct Course planning leftover; runtime Object/State already in top bar
- [x] [Review][Defer] UX-DR2 / DESIGN typography `context` orphaned after strip removal — deferred: planning hygiene, not live chrome defect
- [x] [Review][Defer] PRD FR-18 soft “may live in top bar” vs Lot B lock — deferred: planning wording; product locked in top bar
- [x] [Review][Defer] ASCII chrome sim cited without Lot B stale banner — deferred: planning reference hygiene
- [x] [Review][Defer] Color SV/hue focusable without arrow-key adjust — deferred: Lot B NFR-8 scoped to tabs; picker keyboard beyond this lot

#### Rejected

- `false` — persist-matrix missing two-key prefs: chrome-shell matrix already covers Lot B keys + legacy → defaults
- `false` — redundant `role="tabpanel"` on Skin host: no user-facing ARIA failure
- `false` — skin `data-context-value` lost displayName: select options still set `textContent` to `displayName`
- `low` — Skin+Zoom ≈260 budget token unused as wrapper: soft ≈ budget; Zoom 72 / Skin 88–112 already adapted and matrix-locked
- `low` — `.picker-fields-row` overflow may clip RGB: AC pins hex visibility; everyday clip not demonstrated at 260
- `low` — PrefsDocument `sidebarPaneHeights` not narrowed in TS: comment-only contract; runtime validates Lot B keys
- `low` — empty Implementation Notes / Spec Change Log / review_loop_iteration: rejected (would only edit the spec under review)
- `low` — SV/hue syncFromStore during drag / Color tab hide mid-drag / zone sum vs tiny host: rare paths; not everyday calibration
- `low` — deleted Skin/Zoom undo-exclusion comments: behaviour unchanged; docs-only

## Implementation Notes

## Spec Change Log

## Review Triage Log

- blind: EXPERIENCE State Patterns still say Sidebar Object sync — `low` → **defer** — Correct Course planning leftover; Lot B runtime chrome already moved Object/State to top bar
- blind: UX-DR2 still lists typography `context` after strip removal — `low` → **defer** — epics/planning hygiene; not a product chrome defect
- blind: ASCII chrome sim still cited without stale warning — `low` → **defer** — planning reference hygiene (HTML mockups already marked stale)
- blind: PRD FR-18 soft “may live in top bar” vs Lot B lock — `low` → **defer** — planning wording; product chrome is locked in top bar
- blind: historical Story 2.2–2.4 / 3.1 ACs not footnoted superseded — `low` → **defer** — optional proposal note; Epic 2 narrative already points to Lot B
- blind: persist-matrix not updated for two-key heights — `false` — chrome-shell matrix covers legacy three-key → defaults and Lot B keys
- blind: orphan session Object/State ids show empty while session sticky — `false` — Empty → `—` display met; sticky session is prior Epic 2/4 contract
- blind: object-state-controls.ts under sidebar/ vs chrome/ ownership — `low` rejected — developer layering only; no user-facing harm
- blind: legacy data-context-value / data-mappings-* / data-skin-seg-tab hooks retained — `false` — intentional matrix/compat hooks documented in Code Map continuity
- blind: tabs missing aria-controls / labelledby — `medium` → **patch** — wired tab↔panel ARIA ids
- blind: deprecated height export aliases remain — `false` — explicit matrix aliases beside Lot B names
- blind: Skin+Zoom ≈260 budget not asserted — `medium` → **patch** — styles-matrix locks Zoom 72px; Skin combo adapted (88px)
- edge: empty/whitespace RGB coerces to 0 and commits — `medium` → **patch** — parseRgbChannel rejects empty/non-integer
- edge: paste #RRGGBB truncated by maxLength 6 — `medium` → **patch** — strip leading `#`; maxLength 7
- edge: SV drag ignores pointer id on move/up — `low` rejected — multi-pointer rare in this chrome; not everyday operator path
- verify-gap: bare parseOpaqueHex widens persist/import without pin — `medium` → **patch** — parseHashedOpaqueHex for documents; bare rejected in persist/import matrices
- verify-gap: Unbound leave does not pin MappingFocus clear — `medium` → **patch** — mappings-matrix sibling test added (code already cleared)
- verify-gap: one-key Lot B sidebarPaneHeights untested — `medium` → **patch** — chrome-shell asserts defaults on single-key prefs
- verify-gap Other: bare palette hex can pass validation unnormalized — `medium` → **patch** — same document `#` gate (hashed-only)

## Design Notes

**Prefs:** On load, if `sidebarPaneHeights` is missing either `colorPalette` or `skinMappingsUnbound` (including presence of only legacy `palette`/`mappings`/`unbound`), treat as invalid for Lot B and use defaults — do not invent a hybrid migrate.

**Object/State move:** Lift the existing mappings-pane select behaviour (session write + sticky State rules) into chrome; Mappings tab becomes property rows only. Do not claim Lot A click repair if session stays empty.

**Internal colour math:** HSV helpers in `hex-color.ts` may remain as conversion internals for the SV square; operator-facing Hue/Sat/Val **sliders** must not ship.

## Verification

**Commands:**
- `npm test` -- expected: exit 0
- `npm run build` -- expected: exit 0

**Manual checks (if no CLI):**
- Resize the two sidebar zones; blue line on hover; heights survive reload
- Switch Color|Palette and Skin|Mappings|Unbound; Unbound badge when inactive
- Picker drag + `#`/RGB with a selected Palette entry → undo coalesces; without selection → no write
- Object/State visible in top bar; no context strip; Skin then Zoom; Skin combo narrower if needed, Zoom width unchanged
- Confirm no Lot A seed/click or Lot C mock redraw in the diff
