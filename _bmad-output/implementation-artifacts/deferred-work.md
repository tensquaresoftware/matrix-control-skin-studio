- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-single-writer-project-store.md`
  summary: Deduplicate compile-and-import test helpers shared by scaffold and store matrix suites.
  evidence: Both `scripts/scaffold-matrix.test.mjs` and `scripts/store-matrix.test.mjs` copy `importCompiledTs` / ESM `.js` rewrite logic; a future tsc/ESM flag fix must be applied twice. Pre-existing pattern from story 1.1, not a product defect of the store itself.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-seed-v1-skins-palette-and-placeholder-inventory.md`
  summary: Deduplicate compile-and-import test helpers now also copied by the seed matrix suite.
  evidence: `scripts/seed-matrix.test.mjs` duplicates the same `importCompiledTs` / ESM `.js` rewrite helpers as scaffold and store; pre-existing pattern debt from 1.1/1.2, not a product defect of the seed factory.
