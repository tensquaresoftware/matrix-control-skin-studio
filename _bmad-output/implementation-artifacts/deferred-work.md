- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-single-writer-project-store.md`
  summary: Deduplicate compile-and-import test helpers shared by scaffold and store matrix suites.
  evidence: Both `scripts/scaffold-matrix.test.mjs` and `scripts/store-matrix.test.mjs` copy `importCompiledTs` / ESM `.js` rewrite logic; a future tsc/ESM flag fix must be applied twice. Pre-existing pattern from story 1.1, not a product defect of the store itself.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-seed-v1-skins-palette-and-placeholder-inventory.md`
  summary: Deduplicate compile-and-import test helpers now also copied by the seed matrix suite.
  evidence: `scripts/seed-matrix.test.mjs` duplicates the same `importCompiledTs` / ESM `.js` rewrite helpers as scaffold and store; pre-existing pattern debt from 1.1/1.2, not a product defect of the seed factory.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-4-autosave-envelope-and-cold-reopen.md`
  summary: Deduplicate compile-and-import test helpers now also copied by the persist matrix suite.
  evidence: `scripts/persist-matrix.test.mjs` duplicates the same `importCompiledTs` / ESM `.js` rewrite helpers as scaffold, store, and seed; pre-existing pattern debt from 1.1–1.3, not a product defect of persist.

## Deferred from: code review of spec-1-5-first-open-and-new-load-seed.md (2026-10-16)

- Production `main.ts` only wires `bootProjectStore` via source-text regex; behavioral matrices execute the helper directly — deferred because the shared helper is the intentional executed boundary and matrices avoid importing `main` (CSS/DOM side effects).
- Epic 1 context doc not updated for shared `bootProjectStore` continuity — deferred because the fix would edit planning/agent-context docs outside this story’s code surface.

## Deferred from: code review of spec-2-2-chrome-shell-layout.md (2026-10-16)

- Chrome-shell matrix duplicates `importCompiledTs` / minimal DOM harness already copied across Epic 1 suites — deferred as the same shared-harness debt tracked from stories 1.2–1.4; not a product defect of the chrome shell itself.

## Deferred from: build review of spec-2-3-top-bar-ops-zoom-and-skin-combo.md (2026-10-16)

- source_spec: `_bmad-output/implementation-artifacts/spec-2-3-top-bar-ops-zoom-and-skin-combo.md`
  summary: Assert English Zoom/Skin visible labels (or aria-label) in the chrome-shell matrix top-bar row.
  evidence: Static chrome copy; order/structure already covered; everyday product harm unlikely until copy drifts.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-3-top-bar-ops-zoom-and-skin-combo.md`
  summary: Deduplicate boot-seed vs chrome-shell minimal DOM harness / matchesSelector helpers.
  evidence: Pre-existing shared-harness debt also deferred from Epic 1 and story 2-2; not a product defect of Zoom/Skin wiring.

## Deferred from: code review of spec-2-3-top-bar-ops-zoom-and-skin-combo.md (2026-10-16)

- English Zoom/Skin visible labels unasserted in the chrome-shell matrix — already tracked under the build-review defer for this spec; static copy, low everyday harm.
- boot-seed vs chrome-shell minimal DOM harness / `matchesSelector` divergence — already tracked as shared-harness debt (Epic 1 / 2-2 / build review); not a product defect of Zoom/Skin.

## Deferred from: build review of spec-2-5-canvas-pan-and-prefs-persistence.md (2026-10-16)

- source_spec: `_bmad-output/implementation-artifacts/spec-2-5-canvas-pan-and-prefs-persistence.md`
  summary: Add `touch-action: none` on the canvas host so touch gestures do not steal pan drags.
  evidence: Desktop-first MVP; browser may steal touch pans without it; reopen when touch canvas work is in scope.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-5-canvas-pan-and-prefs-persistence.md`
  summary: Assert non-primary pointer buttons do not start canvas pan in the chrome-shell matrix.
  evidence: Primary click-drag is covered; secondary-button ignore is real but outside everyday I/O rows until context-menu work lands on the canvas.

## Deferred from: code review of spec-3-1-palette-selection-and-picker-recolour.md (2026-10-16)

- Selected palette id removed from store never asserted to clear selection — orphan-clear exists in palette pane; not in 3-1 I/O matrix; cover with New-after-custom-select or when 3.2 delete makes missing-id common.
- ~~Epic 3 context still documents ~400 ms coalesce while 3-1 uses immediate `store.apply`~~ — **Resolved (2026-10-17):** `epic-3-context.md` mutation path now states immediate `store.apply`; coalesce / `history.execute` remain story 5-1.

## Deferred from: code review of spec-3-2-palette-create-rename-and-referenced-delete.md (2026-10-16)

- Delete-colour confirm reuses New-confirm scrim/buttons but does not set `role="dialog"` / `aria-modal` or move focus — deferred as pre-existing New-confirm pattern; story required reuse rather than inventing a richer dialog layer.

## Deferred from: build review of spec-3-3-skin-tab-rename-duplicate-delete.md (2026-10-16)

- source_spec: `_bmad-output/implementation-artifacts/spec-3-3-skin-tab-rename-duplicate-delete.md`
  summary: Assert Skin delete confirm one-deep guard (second Delete click does not stack another scrim).
  evidence: Early return exists in `openSkinDeleteConfirm`; single-open cancel/confirm already covered; double-open is an edge interaction not worth blocking this change.

## Deferred from: build review of spec-4-1-gui-view-mock-with-orchestrator-zones.md (2026-10-17)

- source_spec: `_bmad-output/implementation-artifacts/spec-4-1-gui-view-mock-with-orchestrator-zones.md`
  summary: Merge or migrate Patch/Master seed Palette entries into restored pre-4.1 envelopes so Orchestrator bands are not unbound after cold reopen.
  evidence: `bootProjectStore` applies seed baseline only when nothing is restored; an autosaved formatVersion-1 project with the old one-entry palette leaves `patchZoneBlue` / `masterZoneOrange` unresolved until New or manual Palette create.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-1-gui-view-mock-with-orchestrator-zones.md`
  summary: Dispose canvas store subscription on remount (or document single-mount lifetime).
  evidence: `mountCanvas` subscribes for zone repaint with no unsubscribe; same pattern as chrome strip subscribers; everyday remount uncommon until a product remount path appears.

## Deferred from: code review of spec-4-1-gui-view-mock-with-orchestrator-zones.md (2026-10-17)

- source_spec: `_bmad-output/implementation-artifacts/spec-4-1-gui-view-mock-with-orchestrator-zones.md`
  summary: Narrow zone/Palette repaint instead of full mock `replaceChildren` on every store notification (needed before 4.3 selection outline / 4.4 pulse on stable nodes).
  evidence: `renderMockComposition` clears and rebuilds the whole mock on each `store.subscribe` tick; fine for 4.1 band paint, fights later selection/pulse work that needs stable DOM.

## Deferred from: build review of spec-4-2-object-type-state-and-palette-id-mappings.md (2026-10-17)

- source_spec: `_bmad-output/implementation-artifacts/spec-4-2-object-type-state-and-palette-id-mappings.md`
  summary: Repair session Object type / State ids when they are missing from the loaded inventory so chrome and selects stay aligned.
  evidence: Mappings selects show dash while session/chrome can keep stale ids if inventory shrinks; KEEP_EMPTY seed never hits this everyday — Collect or inventory replace will surface it.

## Deferred from: code review of spec-4-2-object-type-state-and-palette-id-mappings.md (2026-10-17)

- source_spec: `_bmad-output/implementation-artifacts/spec-4-2-object-type-state-and-palette-id-mappings.md`
  summary: Repair session Object type / State ids when missing from inventory (chrome vs selects) — confirmed still open; same item as build-review defer above.
  evidence: Edge Case Hunter + Blind Hunter; `mappings-pane` fillSelect shows dash without rewriting session; KEEP_EMPTY seed everyday-safe.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-2-object-type-state-and-palette-id-mappings.md`
  summary: Align spec frontmatter status / review_loop_iteration with sprint `review` when the review loop closes (process tracking only).
  evidence: Spec `status: done` while sprint moves story to `review`; not a product defect.

## Deferred from: code review of spec-4-3-bidirectional-canvas-sidebar-selection-sync.md (2026-10-17)

- Keyboard focus dropped after Object-type hit activation because full mock rebuild replaces hit nodes — deferred: same full-rebuild / narrow-repaint debt already parked from 4-1; 4-3 keeps re-stamping selection class after rebuild; focus restore needs stable hit DOM.

## Deferred from: build review of spec-4-4-live-preview-led-fully-on-and-mapping-pulse.md (2026-10-17)

- source_spec: `_bmad-output/implementation-artifacts/spec-4-4-live-preview-led-fully-on-and-mapping-pulse.md`
  summary: Keep in-flight Mapping pulse across later store paints until animationend (needs stable hit nodes / pulse id memory).
  evidence: Full mock rebuild on every store tick drops `.is-pulsing` mid-animation; Design Notes accepted re-stamp-after-rebuild; same narrow-repaint debt as 4-1/4-3.
- source_spec: `_bmad-output/implementation-artifacts/spec-4-4-live-preview-led-fully-on-and-mapping-pulse.md`
  summary: Share the canvas DOM/tsc harness helper across Epic 4 matrix scripts instead of re-copying it.
  evidence: `live-preview-matrix.test.mjs` duplicates the large harness from `canvas-mock-matrix`; harness fixes will diverge silently.

## Accepted at Epic 4 close (transversal review 2026-10-17)

Decision: close Epic 4 with debts accepted; Unbound completeness owned by story **5-2** (not deferred).

- Cumulative canvas debt still open (already listed above from 4-1…4-4): narrow-repaint / pulse memory; `mountCanvas` unsubscribe; pre-4.1 Patch/Master palette migrate on restore; session Object/State repair on inventory shrink; shared matrix harness; keyboard focus restore after rebuild.
- `deriveUnbound` vs Mapping-row Unbound for **missing** rows is **not** deferred product debt — Story 5.2 AC / AD-10 require expanding derive to the inventory × Skin × ObjectType × State completeness set before the Unbound pane and export gate ship.
- Verification gaps accepted for later matrix polish (not Epic 4 reopen): canvas hit Unbound stub when Mapping has dangling Palette id; canvas clears hits when `activeSkinId` is null.
- Edge polish accepted: no-op identical Mapping upsert still writes/pulses; canvas Mapping highlight may survive leaving the Mappings segment.

## Deferred from: build review of spec-fix-canvas-layout-chrome.md (2026-10-17)

- source_spec: `_bmad-output/implementation-artifacts/spec-fix-canvas-layout-chrome.md`
  summary: Decide behavior when the window is narrower than sidebar 320px plus a usable canvas (min canvas width vs intentional page overflow).
  evidence: With `flex: 0 0 320px` the sidebar never shrinks; a very narrow viewport can still starve the canvas. Out of this bugfix DoD (normal desktop window); reopen if responsive chrome becomes a goal.

- source_spec: `_bmad-output/implementation-artifacts/spec-5-1-history-stack-with-coalesced-undo-redo.md`
  summary: Replace JSON.stringify snapshot equality in history coalesce / canUndo with a cheaper structural compare if project documents grow large.
  evidence: Every coalesce tick and enablement check stringifies full project+session; fine for MVP seed size; revisit under large palettes/skins.

## Deferred from: code review of spec-5-1-history-stack-with-coalesced-undo-redo.md (2026-10-17)

- Unbounded undo stack stores full project+session snapshots with no eviction — fine for MVP session length; revisit cap/eviction if long editing sessions grow memory.
- Chrome Object/State/Skin `store.subscribe` readouts still stack on remount (only history listeners were disposed) — pre-existing remount pattern across shells; not blocking 5-1 Undo/Redo.

## Deferred from: code review of spec-5-2-unbound-derive-and-unbound-pane.md (2026-10-17)

- Sprint-status comment above 5-2 still says the story must expand “derive + pane + export gate,” but export gating is owned by 5-3 — tracking comment hygiene only; not a product defect of the Unbound pane.

## Deferred from: code review of spec-5-3-hard-export-gate-and-single-project-json.md (2026-10-17)

- Blob URL revoke at `setTimeout(0)` after Export download may still be too early in some browsers — deferred: unverified; settle with a real-browser download of non-trivial JSON (empty or corrupt file ⇒ raise delay).

- source_spec: `_bmad-output/implementation-artifacts/spec-5-4-import-replace-all-with-fail-closed-formatversion.md`
  summary: Concurrent overlapping Import file-change handlers could race before prior read finishes.
  evidence: maybe-false / unverified medium — native file picker is usually serial; settle by firing two async change events with delayed text() resolves and asserting a single final modal + project.

## Deferred from: build review of spec-lot-a-seed-inventory-clickable-mock-neutral-palette.md (2026-10-18)

- source_spec: `_bmad-output/implementation-artifacts/spec-lot-a-seed-inventory-clickable-mock-neutral-palette.md`
  summary: Mirror hit-chip Enter/Space coverage for painted Orchestrator zones.
  evidence: Zone keydown is implemented; Lot A matrix pins click; hit keyboard already covers shared applyObjectTypeHitSelection.
- source_spec: `_bmad-output/implementation-artifacts/spec-lot-a-seed-inventory-clickable-mock-neutral-palette.md`
  summary: Update epic-1/epic-4 context docs that still teach KEEP_EMPTY seed inventory.
  evidence: Continuity docs contradict Lot A seed-placeholder fixture; agent-context hygiene, not a runtime product defect.

## Deferred from: Correct Course Lot B Photocraft chrome (2026-10-19)

- source_spec: `_bmad-output/planning-artifacts/sprint-change-proposal-2026-10-19.md`
  summary: Regenerate UX HTML mockups (`editor-main.html`, related) to match Lot B chrome — optional / Soon; DESIGN+EXPERIENCE spines already updated.
  evidence: Mockups marked stale vs Lot B; not blocking `lot-b-photocraft-chrome` Build.
- source_spec: `_bmad-output/planning-artifacts/sprint-change-proposal-2026-10-19.md`
  summary: Lot C — mock fidelity vs real Matrix-Control (out of Lot B absolute).
  evidence: Explicit course boundary; do not expand into Lot B Build.

## Deferred from: build review of spec-lot-b-photocraft-chrome.md (2026-10-19)

- source_spec: `_bmad-output/implementation-artifacts/spec-lot-b-photocraft-chrome.md`
  summary: EXPERIENCE State Patterns still describe Sidebar Object/State sync after Lot B top-bar move.
  evidence: Runtime chrome is correct; leftover Correct Course / EXPERIENCE prose vs Interaction Primitives.
- source_spec: `_bmad-output/implementation-artifacts/spec-lot-b-photocraft-chrome.md`
  summary: UX-DR2 still lists typography role `context` after context-strip removal.
  evidence: Orphaned scale entry in epics contract; no live consumer after Lot B.
- source_spec: `_bmad-output/implementation-artifacts/spec-lot-b-photocraft-chrome.md`
  summary: Mark `.working/ascii-chrome-simulations.md` stale vs Lot B (same class as HTML mockups).
  evidence: Agents may treat ASCII as current chrome SSOT without a stale banner.
- source_spec: `_bmad-output/implementation-artifacts/spec-lot-b-photocraft-chrome.md`
  summary: Tighten PRD FR-18 / FR-5 wording so Object/State top-bar placement is locked, not soft “may”.
  evidence: Planning softness vs Lot B locked chrome; product already implements top bar.
- source_spec: `_bmad-output/implementation-artifacts/spec-lot-b-photocraft-chrome.md`
  summary: Optional superseded footnotes on historical Story 2.2–2.4 / 3.1 ACs (320 / four panes / strip).
  evidence: Proposal optional; Epic 2 narrative already points agents to Lot B spines.

## Deferred from: code review of spec-lot-b-photocraft-chrome.md (2026-10-19)

- source_spec: `_bmad-output/implementation-artifacts/spec-lot-b-photocraft-chrome.md`
  summary: DESIGN.md pins Color hue strip at 16px while runtime CSS uses 24px (smoke hit target).
  evidence: Planning/DESIGN token drift; product intentionally wider for usability; align DESIGN later.
- source_spec: `_bmad-output/implementation-artifacts/spec-lot-b-photocraft-chrome.md`
  summary: EXPERIENCE State Patterns still cite Sidebar Object sync after top-bar move.
  evidence: Already deferred in build review; runtime chrome correct.
- source_spec: `_bmad-output/implementation-artifacts/spec-lot-b-photocraft-chrome.md`
  summary: UX-DR2 / DESIGN typography `context` orphaned after context-strip removal.
  evidence: Already deferred in build review; planning hygiene.
- source_spec: `_bmad-output/implementation-artifacts/spec-lot-b-photocraft-chrome.md`
  summary: PRD FR-18 soft “may live in top bar” vs Lot B lock.
  evidence: Already deferred in build review; product locked in top bar.
- source_spec: `_bmad-output/implementation-artifacts/spec-lot-b-photocraft-chrome.md`
  summary: ASCII chrome sim cited without Lot B stale banner.
  evidence: Already deferred in build review; planning reference hygiene.
- source_spec: `_bmad-output/implementation-artifacts/spec-lot-b-photocraft-chrome.md`
  summary: Color SV/hue `role=slider` focusable without arrow-key adjustment.
  evidence: Lot B NFR-8 scoped to tabs + focus ring; full picker keyboard is a later a11y pass.

## Deferred from: oneshot review of spec-sidebar-photocraft-cosmetics.md (2026-10-19)

- source_spec: `_bmad-output/implementation-artifacts/spec-sidebar-photocraft-cosmetics.md`
  summary: DESIGN.md / UX-DR2 still mandate IBM Plex while runtime now loads Inter + JetBrains Mono (PhotoCraft).
  evidence: Cosmetics pass deliberately skipped DESIGN rewrite; planning SSOT should catch up.
- source_spec: `_bmad-output/implementation-artifacts/spec-sidebar-photocraft-cosmetics.md`
  summary: Prior Lot B defer “DESIGN 16px vs runtime 24px” is stale — runtime hue width is now 16px.
  evidence: Cosmetics aligned to DESIGN width; close or rewrite the Lot B defer when grooming deferred-work.

## Deferred from: code review (2026-10-20)

- Working-tree PhotoCraft polish (uncommitted since acd3460): DESIGN.md / planning tokens still lag runtime (sidebar width, type sizes, float gap) — already out of scope for this pass; same class of DESIGN drift deferred earlier.
- Hex double-click → Color has no keyboard equivalent — pointer gesture only; full Palette a11y jump is a later pass.
- Zoom select forced to 60px may clip longer labels (e.g. 200%) — intentional PhotoCraft chrome budget; reopen if operators report clipping.
- canvas-mock ALWAYS_ON band test narrative still says Skin is irrelevant while bridged zones now follow Skin Mappings when inventory is present — documentation/test copy hygiene, not a product bug for this pass.
