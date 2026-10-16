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
