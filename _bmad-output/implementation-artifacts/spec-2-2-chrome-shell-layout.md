---
title: '2-2 Chrome Shell Layout'
type: 'feature'
created: '2026-10-16'
status: 'done'
route: 'dispatch'
review_loop_iteration: 1
baseline_commit: '7340fab72f7da12eb1551131d5e6820b07f9bac8'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Skin Studio still boots as a title + New strip — there is no locked desktop chrome (top bar, context strip, canvas, four-pane sidebar), so Epic 2 calibration console geometry does not exist yet.

**Approach:** Replace the Epic 1 boot mount with a desktop shell that mounts top bar (40px) + context strip (28px) + body (canvas main + 320px sidebar), and a four-pane sidebar with horizontal splitters where panes 2–4 are resizable and their heights persist in `skin-studio:prefs.sidebarPaneHeights`. Leave Zoom/Skin/ops wiring and pan to Stories 2.3–2.5.

## Boundaries & Constraints

**Always:**
- Layout contract (UX-DR3 / FR-8): Top bar height `--space-top-bar-height` (40px) + Context strip `--space-context-strip-height` (28px) + body row with canvas `flex: 1` and Sidebar `--space-sidebar-width` (320px). No left layers tree, no bottom chrome, no left Palette rail.
- Sidebar (UX-DR6 / FR-10 / AD-11): four stacked panes — picker (fixed height) → palette → mappings/skin → unbound — separated by horizontal splitters using `--space-splitter-hit` (6px) hit target; panes 2–4 resizable; picker height fixed (DESIGN ≈ 200–240px; mock canonical **220px**).
- **Decision PANE_DEFAULTS = MOCK:** default heights/mins from `mockups/editor-main.html` — picker `220px` fixed; palette start `140px`; mappings `min-height: 160px`; unbound `min-height: 120px`. Remaining body height distributes across panes 2–4.
- Prefs (AD-8): persist only resizable pane heights under `sidebarPaneHeights` keys `palette` / `mappings` / `unbound` (numbers = px). Add `savePrefs` in `persist/`; load on mount, write on splitter commit (pointer-up). Never write prefs into the project envelope or export shape. Zoom/pan fields stay defaults until 2.5.
- Mount path: after `bootProjectStore`, mount the chrome shell into `#app` instead of the Epic 1 title+New-only surface. Shells live in `chrome/` + `sidebar/` + `canvas/` (layout placeholder only for canvas). Styles reuse DESIGN tokens from Story 2.1 — no new brand hex.
- **Decision BOOT_NEW = RELOCATE:** move New + one-deep confirm into the top-bar shell now; confirm still calls `applySeedBaseline` only. Retire production use of the Epic 1 title+New-only boot mount. Story 2.3 adds Import/Export/Undo/Redo/Zoom/Skin around this New.
- **Decision CHROME_FILL = INERT:** top bar shows inert English-labeled placeholders in AD-11 order (`[New]` live · `[Import][Export]` · undo/redo · `Zoom` · spacer · `Skin` right-anchored); Import/Export/Undo/Redo/Zoom/Skin are present but non-operational. Context strip is a static readout `Object · State · Zoom · Skin` with empty glyph `—` for Object/State (and inert Zoom/Skin values until 2.3/2.4). No live sticky-context or combo behavior.
- Cover layout + forbidden regions + pane-height prefs round-trip with a Node matrix test; keep `npm test` / `npm run build` green.

**Never:**
- Wire Zoom combo steps, Skin combo behavior, sticky context logic, or canvas pan (Stories 2.3–2.5).
- Make sidebar width user-resizable (Soon).
- Change `model/`, `seed/` content, envelope schema, or autosave contract.
- Add left layers / bottom chrome / left Palette rail; OS mock titlebar; UI frameworks / CSS-in-JS.
- Treat UX mockup HTML as a runtime dependency — geometry reference only.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Fresh shell mount | Tokens from 2.1; no prefs key | Top bar 40px + context strip 28px + canvas + sidebar 320px; four panes; picker 220px; defaults for 2–4; inert AD-11 placeholders + static context readout | N/A |
| Forbidden chrome | Inspect mounted DOM | No left layers tree, no bottom chrome, no left Palette rail | N/A |
| Splitter resize | Drag splitter between panes 2–4; release | Heights update; `skin-studio:prefs.sidebarPaneHeights` written with `palette`/`mappings`/`unbound` | Clamp to mins; picker height unchanged |
| Prefs restore | Prefs has saved pane heights | Sidebar panes 2–4 restore those px heights on mount | Corrupt/missing prefs → defaults via `loadPrefs` |
| Prefs isolation | After pane resize | Envelope `skin-studio:project` unchanged; no zoom/pan mutation required | N/A |
| New confirm | Existing project; confirm New in top bar | Store replaced via `applySeedBaseline`; prefs untouched | N/A |
| New cancel | Existing project; cancel New | Store and envelope unchanged; modal closed | N/A |

</frozen-after-approval>

## Code Map

- `_bmad-output/planning-artifacts/ux-designs/ux-Matrix-Control-Skin-Studio-2026-10-15/mockups/editor-main.html` — canonical geometry (top-bar/context/body/sidebar/panes/splitters); ignore decorative `.titlebar`
- `_bmad-output/implementation-artifacts/epic-2-context.md` — shell ownership `chrome/` + `canvas/` + `sidebar/`; prefs vs session split
- `src/main.ts` — today `bootProjectStore` → `mountBootSurface`; switch mount to chrome shell entry
- `src/boot-surface.ts` — extract or move New+confirm helpers into chrome; stop mounting title+New-only surface; keep `applySeedBaseline` as sole seed-replace path
- `src/chrome/index.ts` — stub → mount top bar (New live + inert placeholders) + static context strip; compose body hosts for canvas/sidebar
- `src/sidebar/index.ts` — stub → four panes + horizontal splitters; read/write `sidebarPaneHeights`
- `src/canvas/index.ts` — stub → empty GUI-view host (bright focus surface); no pan/zoom yet
- `src/persist/prefs.ts` + `src/persist/index.ts` — add `savePrefs`; reuse `loadPrefs` / `PrefsDocument` / `PREFS_KEY`
- `src/styles/base.css` — layout rules for shell/sidebar/splitters using existing `--space-*` / `--comp-*` tokens; no Palette brand tokens
- `scripts/boot-seed-matrix.test.mjs` / `scripts/scaffold-matrix.test.mjs` — update if mount symbol / boot-order source text changes; New confirm remains covered
- `scripts/chrome-shell-matrix.test.mjs` (new) + `package.json` — I/O matrix: geometry, forbidden regions, splitter prefs round-trip, envelope isolation
- Do **not** change: `src/model/**`, `src/seed/**` factories, envelope writer shape, planning mockups as runtime

## Tasks & Acceptance

**Execution:**
- [x] `src/chrome/` + `src/main.ts` -- mount locked desktop shell (top bar with New + inert AD-11 placeholders, static context strip, body hosts) after boot — UX-DR3 / FR-8 / BOOT_NEW / CHROME_FILL
- [x] `src/sidebar/` -- four panes + splitters; picker fixed; panes 2–4 resizable — UX-DR6 / FR-10
- [x] `src/canvas/` -- mount empty GUI-view host in body main — layout placeholder for 2.5
- [x] `src/persist/prefs.ts` (+ barrel) -- `savePrefs`; shell loads/writes `sidebarPaneHeights` only — AD-8
- [x] `src/styles/base.css` + New confirm styles -- shell/sidebar layout from tokens; keep 2.1 focus ring / modal tokens — visual contract
- [x] `scripts/chrome-shell-matrix.test.mjs` + boot/scaffold updates + `package.json` -- I/O matrix + regression — green `npm test` / `npm run build`

**Acceptance Criteria:**
- Given tokens from 2.1, when the editor chrome mounts, then layout is Top bar (40px) + Context strip (28px) + body with canvas main and Sidebar default 320px.
- Given the sidebar, when it mounts, then it has four stacked panes (picker fixed → palette → mappings/skin → unbound) with horizontal splitters, and panes 2–4 are resizable.
- Given the mounted chrome, when inspected, then there is no left layers tree, no bottom chrome, and no left Palette rail.
- Given the operator resizes panes 2–4, when prefs are read back (or after remount), then heights match `skin-studio:prefs.sidebarPaneHeights`.
- Given `npm test` and `npm run build`, when they finish, then both exit 0 with the chrome-shell matrix covered.

## Implementation Notes

- `mountChromeShell` replaces `mountBootSurface` in `main.ts`; New confirm lives in `chrome/new-confirm.ts`; `boot-surface.ts` re-exports for continuity.
- Sidebar splitters: index 0 redistributes panes 2–4 only (picker fixed 220px); heights keys `palette`/`mappings`/`unbound` via `savePrefs` on pointer-up.
- Chrome-shell matrix covers all I/O rows; `npm test` 44/44 and `npm run build` exit 0 after implementation + review patches.
- Review patches: splitter-0 absorb-limited growth; non-finite delta guard; pointercancel/lostpointercapture end drag; chrome null-root copy; matrix isolation via real commit, remount, distribute/clamp, Zoom/Skin —, savePrefs fail-soft.
- Review loop 2 patches: pointerId + re-entrant drag guards; prefs commit on pointerup only; releasePointerCapture fail-soft cleanup; matrix covers splitter-2, splitter-0 shrink, pointercancel, mount-path distribute.

## Spec Change Log

### Review Findings

- [x] [Review][Patch] Splitter matrix misses index-2 resize and splitter-0 shrink [scripts/chrome-shell-matrix.test.mjs:450-490]
- [x] [Review][Patch] pointercancel / lostpointercapture end-drag path untested [scripts/chrome-shell-matrix.test.mjs; src/sidebar/index.ts:237-261]
- [x] [Review][Patch] Fresh-mount distribute defaults never asserted via mount path [scripts/chrome-shell-matrix.test.mjs:320-323; src/sidebar/index.ts:75-86]
- [x] [Review][Patch] endDrag: releasePointerCapture before cleanup can skip listener removal; prefs written on cancel not only pointer-up [src/sidebar/index.ts:237-247]
- [x] [Review][Patch] Splitter drag ignores pointerId — foreign pointer can end or resize mid-gesture [src/sidebar/index.ts:230-261]
- [x] [Review][Patch] Re-entrant pointerdown while dragging duplicates window listeners [src/sidebar/index.ts:249-261]
- [x] [Review][Defer] Chrome-shell matrix duplicates importCompiledTs / minimal DOM harness [scripts/chrome-shell-matrix.test.mjs] — deferred: pre-existing Epic 1 pattern debt; same shared-harness work already deferred from 1.2–1.4

#### Rejected

- `false` — Spec status `done` vs sprint `review` / empty Spec Change Log / Code Map “stub →” residue — reject (would only edit this build’s spec)
- `false` — Partial `sidebarPaneHeights` drops to full defaults — matches corrupt/missing → defaults; not a defect
- `false` — `resizeFromDrag` fall-through for index outside 0–2 — production only calls 0–2 via `wireSplitters`
- `false` — loadPrefs→savePrefs race overwriting zoom/pan — sync single-writer in this story; no concurrent prefs writer yet
- `low` rejected — Remount during drag leaves window listeners — production mounts once at boot; remount is test/rare
- `low` rejected — AD-11 order/labels under-asserted — top bar builds correct order; product surface OK
- `low` rejected — New confirm keeps `data-boot-confirm` Epic 1 ids — continuity by design; rename is cosmetic
- `low` rejected — No upper bound on pane heights — spec clamps mins only; max adds design surface
- `low` rejected — `savePrefs` fail-soft only asserts doesNotThrow — enough for this story’s fail-soft contract
- `low` rejected — Forbidden-chrome asserts only absent attrs — positive chrome geometry already covered

## Review Triage Log

- `false` — Code Map still describes stubs / mountBootSurface [spec Code Map] — verified: Code Map already points at mountChromeShell + New relocate; remaining “stub →” wording is planning residue, not contradictory guidance; reject (would only edit this build’s spec)
- `medium` — prefs isolation matrix never exercises splitter commit path [scripts/chrome-shell-matrix.test.mjs:485-520] — verified: test calls `savePrefs` directly; envelope corruption on `persistHeights` would stay green — route patch
- `medium` — no remount-after-drag assert for pane heights AC [scripts/chrome-shell-matrix.test.mjs:373-444] — verified: splitter test checks JSON only — route patch (fold into splitter/isolation coverage)
- `medium` — `distributeDefaultHeights` measurable-host path untested [src/sidebar/index.ts:98-120; matrix DOM lacks clientHeight] — verification-gap pre-verified — route patch
- `low` — context strip Zoom/Skin `—` unasserted [src/chrome/index.ts:buildContextStrip; matrix only Object/State] — verified missing asserts — route patch
- `false` — splitter-hit token unused by hit target [src/styles/base.css] — verified `.sidebar-splitter::after` uses `--comp-sidebar-splitter-hit-height`
- `low` rejected — shell `aria-label` on generic div without landmark [src/chrome/index.ts] — unlikely everyday harm; a11y polish beyond direct layout AC
- `low` rejected — no upper bound on pane heights [src/sidebar/index.ts:clampHeights] — everyday prefs unlikely to store huge values; max clamp adds design surface
- `low` rejected — separator lacks aria-valuenow/keyboard [src/sidebar/index.ts:createSplitter] — intent is pointer splitters for layout; keyboard splitter not in frozen story
- `low` — null-root error still says “Boot root” [src/chrome/index.ts] — verified leftover Epic 1 copy — route patch
- `medium` — splitter-0 test only asserts picker fixed, not panes 2–4 redistribute [scripts/chrome-shell-matrix.test.mjs:429-440] — verification-gap pre-verified — route patch
- `false` — `#app` height 100vh + `.chrome-shell` min-height 100vh nested overflow [src/styles/base.css] — verified intentional fill-viewport flex shell; no demonstrated nested scroll bug
- `false` — `savePrefs` hand-lists fields vs shared serialize [src/persist/prefs.ts] — PrefsDocument is the shared shape; no field drift demonstrated
- `false` — Implementation Notes overstate matrix coverage [spec] — reject (would only edit this build’s spec)
- `false` — New confirm lacks Escape/focus handling [src/chrome/new-confirm.ts] — continuity from Story 1.5; frozen intent did not add modal a11y
- `medium` — pointercancel/lostpointercapture leave drag stuck / listeners leak [src/sidebar/index.ts:wireSplitters] — verified only pointerup cleans up — route patch
- `medium` — splitter-0 grows palette even when mappings/unbound at mins (stack overflow) [src/sidebar/index.ts:resizeFromDrag index 0] — verified palette uses full delta while redistributePair may absorb less — route patch
- `low` — non-finite deltaY can write NaNpx heights [src/sidebar/index.ts:resizeFromDrag] — verified no finite guard — route patch
- `false` — splitterIndex outside 0–2 applies wrong branch [src/sidebar/index.ts:resizeFromDrag] — wireSplitters only calls 0–2; unreachable from production
- `low` rejected — setPointerCapture/release throws leave drag stuck [src/sidebar/index.ts:wireSplitters] — uncommon browser path; try/catch adds complexity without everyday hit
- `medium` — below-min saved pane heights never shown to clamp [scripts/chrome-shell-matrix.test.mjs restore] — verification-gap pre-verified — route patch
- `medium` — `savePrefs` fail-soft on setItem throw unverified [src/persist/prefs.ts:61-77] — verification-gap pre-verified — route patch

## Design Notes

- Product chrome starts at the top bar — do not ship the mock’s decorative OS `.titlebar`.
- Splitter between picker and palette may exist visually but must not change picker height; dragging it redistributes panes 2–4 only (DESIGN sidebar-splitter assumption).
- Pane height keys are stable English ids (`palette`, `mappings`, `unbound`) — not display labels. Picker is omitted from prefs because it is fixed.
- Inert placeholders: prefer disabled controls or non-activating elements with English labels; do not fake Zoom/Skin menus. Static context strip is readout-shaped only — not a second editor.
- Continuity from 2.1: tokens/typography/focus-ring already shipped; this story consumes them. Continuity from 1.5: `applySeedBaseline` remains the only New seed-replace path.

## Verification

**Commands:**
- `npm test` -- expected: exit 0 including chrome-shell matrix
- `npm run build` -- expected: exit 0

**Manual checks (if no CLI):**
- `npm run dev` — dark chrome frame; 40px top bar + 28px context strip; canvas left; 320px sidebar with four panes; drag splitters persist after reload; no left rail / bottom bar
