---
title: '1-3 Seed v1 Skins, Palette, and Placeholder Inventory'
type: 'feature'
created: '2026-10-15'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'fb47757d07511787741b78296eb2c93578cee667'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Skin Studio has a typed empty project store but no v1 baseline document — operators cannot start calibration from the five named skins, Duo LED yellow, or a marked placeholder inventory.

**Approach:** Add a `seed/` builder that returns a complete `ProjectDocument` (five skins, base palette with Duo LED `#FFCC00`, single inventory marked `source: "seed-placeholder"`) so later first-open / New stories can `apply` one known baseline.

## Boundaries & Constraints

**Always:**
- Exactly five skins with display names `Black/Green`, `Cream/Green`, `Black/Duo`, `Cream/Duo`, `Monochrome` only — never rejected names (`Black/Two-tone`, `Cream/Two-tone`, `Split`).
- **Decision BASE_PALETTE = DUO_ONLY:** palette is exactly one entry — Duo LED yellow with default hex `#FFCC00` (uppercase on write). Prefer stable id `duoLedYellow` and optional `constantName: "kDuoLedYellow"` (FR-16 allows id/name choice). No other palette entries in this story.
- **Decision INVENTORY_CONTENT = EMPTY:** inventory lives in **one** seed module/file with `inventory.source: "seed-placeholder"` and `objectTypes: []` (AD-10). No ObjectType / Property / State invented in UI code or outside that seed file; Collect (or a later fixture story) fills content later.
- Mapping values are `paletteEntryId | null` only — never raw hex on mappings. All five skins ship with empty `mappings: []` (no in-repo Black/Cream bootstrap notes).
- Seed API: export `createSeedProject(): ProjectDocument` (name may vary) that returns `formatVersion: 1` with ordered `palette[]` / `skins[]` and the marked empty inventory. Stable skin `id`s are kebab derived from display names (e.g. `black-green`).
- Wire seed into the module graph via `src/seed/index.ts` exports. Cover with a matrix test that builds the seed and asserts AC shape (five names, Duo-only palette + hex, empty `objectTypes` + `source`, no rejected names, empty mappings).
- Reuse `ProjectDocument` types from `model/`; do not reshape store types.

**Never:**
- Autosave / localStorage envelope (1.4), first-open / New confirm replace (1.5), history/undo, chrome/canvas/sidebar UI, unbound derive, import/export.
- Treat seed inventory as Matrix-Control product truth or invent Collect inventory outside the single seed file.
- Call `store.apply(seed)` from `main.ts` in this story — boot stays empty until 1.4/1.5 own restore-then-seed order.
- UI frameworks; alternate collection topologies; dual seed sources; extra palette colours beyond Duo in this story.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Happy seed build | `createSeedProject()` | Document with `formatVersion: 1`; exactly 5 skins with the v1 display names; palette length 1 with Duo `#FFCC00`; `inventory.source === "seed-placeholder"`; `objectTypes: []` | N/A |
| Rejected names absent | Inspect `skins[].displayName` | None of `Black/Two-tone`, `Cream/Two-tone`, `Split` | N/A |
| Mapping discipline | Inspect all `mappings` | All skins have `mappings: []`; no raw-hex mapping fields | N/A |
| Apply path (caller) | Caller `store.apply({ project: createSeedProject() })` | Store holds seeded document; seed module itself does not mutate store | N/A |

</frozen-after-approval>

## Code Map

- `src/seed/index.ts` -- stub today (`export {}`); replace with seed public API (`createSeedProject` + re-exports)
- `src/seed/` -- add seed data module and/or JSON imported by Vite (single inventory ownership); keep free of UI imports
- `src/model/types.ts` -- reuse `ProjectDocument`, `PaletteEntry`, `Skin`, `Mapping`, `Inventory` (`source?` already reserved); do not reshape
- `src/model/empty-project.ts` -- leave empty baseline; seed is a separate factory, not a mutation of empty-project
- `src/model/store.ts` / `src/main.ts` -- do not call seed apply from boot in this story; main keeps `initProjectStore()` + boot surface
- `src/persist/index.ts`, `src/history/index.ts` -- leave stubs (1.4 / undo later)
- `scripts/store-matrix.test.mjs` -- pattern to reuse (`importCompiledTs` + `node:test`)
- `scripts/scaffold-matrix.test.mjs` -- asserts `seed` stub presence; keep green after seed exports real API
- `package.json` -- extend `test` script to include new seed matrix file
- `_bmad-output/implementation-artifacts/epic-1-context.md` -- Epic 1 seed constraints
- Continuity from `spec-1-2-single-writer-project-store.md` (done): store types, `Inventory.source?`, empty boot, compile-import tests

## Tasks & Acceptance

**Execution:**
- [x] `src/seed/` data module (TS and/or single JSON) -- define v1 skins, Duo-only palette, empty inventory with `source: "seed-placeholder"` -- AD-10 / FR-15 / FR-16 ownership
- [x] `src/seed/index.ts` -- export `createSeedProject(): ProjectDocument` building from that data -- callable baseline for 1.4/1.5
- [x] `scripts/seed-matrix.test.mjs` -- assert I/O matrix (five names, Duo-only `#FFCC00`, empty objectTypes + source, no rejected names, empty mappings) -- edge coverage
- [x] `package.json` -- include seed matrix in `scripts.test` -- `npm test` runs scaffold + store + seed

**Acceptance Criteria:**
- Given `createSeedProject()`, when the document is inspected, then skins are exactly the five v1 display names and rejected names are absent.
- Given the seed palette, when inspected, then it has exactly one entry — Duo LED with default hex `#FFCC00`.
- Given the seed inventory, when inspected, then `source` is `"seed-placeholder"` and `objectTypes` is `[]`, with no ObjectTypes defined outside the seed file.
- Given the seeded skins, when inspected, then each has `mappings: []`.
- Given `npm test` and `npm run build`, when they finish, then both exit 0 with the seed matrix covered.

### Review Findings

- [x] [Review][Patch] Assert exported SEED_* freeze / poison path in seed matrix [scripts/seed-matrix.test.mjs; src/seed/seed-data.ts:22-43]
- [x] [Review][Patch] Remove redundant shallow copy before structuredClone in createSeedProject [src/seed/index.ts:11-16]
- [x] [Review][Patch] Align freezeInventory return type with readonly freeze helpers [src/seed/seed-data.ts:16-18]

#### Rejected

- `false` — Spec `done` vs sprint `review`: expected mid-review lifecycle; sprint `review` is why this pass ran.
- `false` — Spec Code Map still says seed stub: fix would edit this build's spec (rejected).
- `false` — Spec Change Log empty / review_loop_iteration 0 / Design Notes “illustrative” ids: fix would edit this build's spec (rejected).
- `false` — Mapping-discipline inner loop never runs: AC requires `mappings: []`; outer `deepEqual` already satisfies the row.
- `false` — Factory-to-factory isolation untested: `structuredClone` + frozen `SEED_*` already prevent poisoning via a returned document.
- `false` — Public `SEED_*` re-exports beyond AC-named `createSeedProject`: allowed surface; not a product defect of this diff.
- `false` — No repo-wide ObjectTypes scan outside seed: EMPTY inventory ownership already asserted in seed; inventing elsewhere is not a defect of this diff.

## Implementation Notes

- Added `seed-data.ts` (single ownership) + `createSeedProject()` pure factory in `seed/index.ts`.
- Duo-only palette (`duoLedYellow` / `#FFCC00` / `kDuoLedYellow`); empty inventory with `source: "seed-placeholder"`; five v1 skins with empty mappings.
- `scripts/seed-matrix.test.mjs` covers all four I/O matrix rows; `package.json` test script includes it.
- Boot unchanged (no `store.apply` of seed) — deferred to 1.4/1.5.
- Review patches: freeze `SEED_*`; `createSeedProject` via `structuredClone`; assert kebab skin ids; scaffold pins `seed-matrix` in `scripts.test`.
- Code-review patches: assert `SEED_*` freeze in matrix; drop redundant shallow copy before `structuredClone`; `freezeInventory` returns `Readonly<Inventory>`.
- `npm test` and `npm run build` exit 0 after implementation and review patches.

## Spec Change Log

## Review Triage Log

- `false` — mapping-discipline inner loop never runs on empty `mappings: []` [scripts/seed-matrix.test.mjs]; verified: matrix row expects empty mappings; outer `deepEqual(skin.mappings, [])` already satisfies the row; dead inner loop is not a product defect.
- `medium` — seed matrix never asserts kebab skin `id`s [scripts/seed-matrix.test.mjs; src/seed/seed-data.ts:14-18]; verified: only `displayName` pinned; `activeSkinId` later keys off `id`; route patch.
- `medium` — exported `SEED_*` constants are mutable plain data; caller mutation poisons later `createSeedProject` [src/seed/seed-data.ts:4-25]; verified: no freeze; factory reads live module data; route patch.
- `medium` — `createSeedProject` shallow-copies nested mappings/objectTypes [src/seed/index.ts:14-21]; verified: top-level array copy only; shared nested refs if content grows; route patch (deep clone).
- `false` — Spec Code Map still says seed stub; fix would edit this build's spec (rejected).
- `medium` — scaffold does not pin `seed-matrix` in `scripts.test` [scripts/scaffold-matrix.test.mjs:81-82]; pre-verified verification-gap; route patch.
- `false` — sprint `in-progress` vs spec `in-review` / empty Spec Change Log at review start: expected mid-Build sync lag / empty until triage fills.
- `false` — no repo-wide scan that ObjectTypes are not invented outside seed: EMPTY decision + seed-only ownership already asserted; inventing elsewhere is not a defect of this diff.
- `low` deferred — duplicated `importCompiledTs` helpers across scaffold/store/seed test files: pre-existing pattern debt from 1.1/1.2; not introduced as product defect of seed.
- `false` — “uppercase on write” untested beyond `#FFCC00` equality: literal already pins uppercase `#RRGGBB`.
- `false` — apply-path mostly re-proves store clone from 1.2: still asserts seed→apply contract and that factory alone does not mutate store; isolation of `SEED_*` covered by freeze/deep-clone patch group.

## Design Notes

Keep seed as a pure factory — no store singleton ownership inside `seed/`. Later stories: persist restore (1.4) then first-open/New call `createSeedProject()` and `store.apply`. Prefer one data source file so Collect can replace inventory content without hunting UI literals.

Skin id examples (illustrative): `black-green`, `cream-green`, `black-duo`, `cream-duo`, `monochrome`.

## Verification

**Commands:**
- `npm test` -- expected: scaffold + store + seed matrix suites pass
- `npm run build` -- expected: exit 0; `dist/` present

**Manual checks (if no CLI):**
- Import `createSeedProject` from `src/seed` in a scratch call; confirm five skins, Duo `#FFCC00`, `inventory.source === "seed-placeholder"`
