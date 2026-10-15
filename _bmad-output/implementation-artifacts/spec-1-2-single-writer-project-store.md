---
title: '1-2 Single-Writer Project Store'
type: 'feature'
created: '2026-10-15'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'a84e2d8dd9cb35c5c631e08a364d8b86c8efcf13'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Skin Studio has a Vite SPA shell but no shared project or session state — later chrome and mapping edits would each invent their own copies and diverge.

**Approach:** Add typed `ProjectDocument` / `SessionUiState` shapes and a single-writer `model/store` that owns all mutations via `apply`, so every later shell reads one document of truth.

## Boundaries & Constraints

**Always:**
- Only `model/store` mutates `ProjectDocument` and `SessionUiState` (AD-1). UI shells and `main` never assign into nested fields in place.
- Runtime shapes (AD-4, AD-14): `formatVersion` writer pin `1`; ordered `palette: PaletteEntry[]`; ordered `skins: Skin[]`; `inventory.objectTypes: { id, states: string[], properties: string[] }[]`. Mapping values are `paletteEntryId | null` only — never raw `#RRGGBB`.
- Entity semantics: PaletteEntry = stable `id` + opaque hex (+ optional `constantName`); Skin = stable `id` + `displayName` + `mappings[]`; Mapping = `objectTypeId` × `stateId` × `propertyId` → `paletteEntryId | null`. Prefer field name `paletteEntryId`.
- `SessionUiState` holds only `selectedObjectTypeId`, `selectedStateId`, `activeSkinId` (AD-6) — each `string | null` when unset (never invent a selection).
- Store surface: read (`getState` or equivalent), subscribe to changes, and `apply` that replaces project and/or session immutably. Boot initializes one store instance with an empty document (`formatVersion: 1`, empty arrays / empty `objectTypes`) and null session ids.
- Inventory type may include optional `source?: string` so story 1.3 can mark `seed-placeholder` without reshaping types.
- kebab-case source files; English identifiers; vanilla TypeScript modules only.

**Never:**
- Seed content, localStorage / envelope persistence, history command stack / undo-redo, chrome / canvas / sidebar behavior, unbound derive, import/export, or palette lookup helpers beyond types needed for the document.
- UI frameworks; alternate collection topologies (`Record<id, T>`, flat inventory); dual stores; letting UI call `store.apply` from chrome/canvas/sidebar (those call sites wait for `history.execute` in a later story).
- Invent ObjectTypes / Properties / States or v1 skin/palette data inside the store module.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Boot init | App starts with no prior project | Store holds empty `ProjectDocument` (`formatVersion` `1`, empty `palette`/`skins`/`inventory.objectTypes`) and session ids all `null` | N/A |
| Apply project | `apply` with a replacement project (e.g. one skin + one unbound mapping) | `getState().project` reflects the new document; listeners notified; prior nested objects are not mutated in place | Reject or no-op only if implementation chooses strict validation; prefer accept typed replacements |
| Apply session | `apply` changing only `activeSkinId` | Session updates; project reference unchanged when project not in the apply payload | N/A |
| Mapping type | Mapping with `paletteEntryId: null` or a string id | TypeScript accepts; no hex-typed mapping field exists on Mapping | Compile-time only — no runtime hex scrubber required in 1.2 |
| Single writer | Attempt to document ownership | All writable paths go through `store.apply`; no exported mutable document reference meant for in-place edits | N/A |

</frozen-after-approval>

## Code Map

- `src/model/index.ts` -- stub barrel; re-export types + store public API after implementation
- `src/model/` -- create types + store modules here (e.g. `types.ts`, `store.ts`, empty-document helper); keep `model/` free of UI imports
- `src/main.ts` -- today side-effect-imports stubs + mounts boot text; wire store initialization (keep `Skin Studio` boot surface)
- `src/boot-surface.ts` -- leave product name mount alone
- `src/history/index.ts` -- leave stub; do not implement `execute` / undo here
- `src/persist/index.ts`, `src/seed/index.ts` -- leave stubs (1.4 / 1.3)
- `scripts/scaffold-matrix.test.mjs` -- existing node:test + `importCompiledTs` pattern to reuse for store matrix coverage
- `package.json` -- extend `test` script to include the new store test file
- `_bmad-output/implementation-artifacts/epic-1-context.md` -- Epic 1 store/session constraints (loaded context)
- `_bmad-output/planning-artifacts/architecture/.../ARCHITECTURE-SPINE.md` -- AD-1, AD-4, AD-6, AD-14, AD-15 (planning only; do not edit)
- Continuity from `spec-1-1-scaffold-vite-typescript-spa.md` (done): stub barrels, `npm test` via `node --test`, compile-then-import for TS units

## Tasks & Acceptance

**Execution:**
- [x] `src/model/types.ts` (or equivalent) -- define `ProjectDocument`, `PaletteEntry`, `Skin`, `Mapping`, `Inventory` / object-type row, and `SessionUiState` per Boundaries -- AD-4/AD-6/AD-14 foundation
- [x] `src/model/empty-project.ts` (or equivalent) -- factory for empty `ProjectDocument` with `formatVersion: 1` -- boot and later seed replace share one empty baseline
- [x] `src/model/store.ts` -- single-writer store (`getState`, `subscribe`, `apply`) with immutable project/session updates -- AD-1 ownership
- [x] `src/model/index.ts` -- export public types + store API; drop empty `export {}` stub -- module graph entry for later stories
- [x] `src/main.ts` -- initialize the store with empty project + null session on boot (keep existing boot surface) -- AC “app initializes the store”
- [x] `scripts/store-matrix.test.mjs` -- unit-test I/O matrix rows (empty init, apply project, apply session, mapping null id typing via shapes) using the scaffold compile-import pattern -- edge coverage
- [x] `package.json` -- include the new test file in `scripts.test` -- `npm test` runs scaffold + store suites

**Acceptance Criteria:**
- Given the 1.1 scaffold, when the app initializes the store, then only `model/store` can mutate `ProjectDocument` and `SessionUiState`, and boot state is an empty document with `formatVersion` `1` plus null session selections.
- Given the store types, when a `ProjectDocument` is constructed, then it exposes ordered `palette[]`, ordered `skins[]`, and nested `inventory.objectTypes` with `states[]` / `properties[]`, and Mapping values are typed as `paletteEntryId | null` (no raw-hex mapping field).
- Given `SessionUiState`, when inspected, then it holds only `selectedObjectTypeId`, `selectedStateId`, and `activeSkinId`.
- Given a subscriber, when `apply` replaces project or session, then listeners run and prior nested objects are not mutated in place.
- Given `npm test` and `npm run build`, when they finish, then both exit 0 with the new store matrix covered.

## Implementation Notes

- Added `types.ts`, `empty-project.ts`, `store.ts`; barrel re-exports from `index.ts`.
- Store: `createStore` + module singleton `store` / `initProjectStore()`; `apply` and `getState` clone via `structuredClone`.
- `Inventory.source?` (not per object-type) for future `seed-placeholder`.
- Review patches: getState clones; store-matrix covers singleton boot + session payload isolation; scaffold pins `scripts.test` to both suites.
- `npm test` 8/8 and `npm run build` exit 0 after review patches.

## Spec Change Log

## Review Triage Log

- `medium` — `getState()` returns live internal `state` so callers can mutate nested fields without `apply` [src/model/store.ts:39-41]; confirmed by reading `getState`; conflicts with matrix “no exported mutable document reference”; route patch (clone on read).
- `medium` — Boot singleton / `initProjectStore` never exercised by tests (pre-verified verification-gap); only `createStore()` is covered; route patch.
- `medium` — Session `apply` clone isolation not asserted (pre-verified verification-gap); project path has post-apply mutation check, session does not; route patch.
- `low` — `package.json` `scripts.test` not pinned to include store suite (pre-verified verification-gap); store matrix can be dropped while `npm test` stays green; route patch.
- `false` — `initProjectStore` “overstates” init: module-level `createStore()` already establishes empty baseline at import; boot call returns that singleton as intended.
- `low` rejected — unsubscribe untested: no production subscribers yet; unlikely everyday; would add test-only surface without product defect.
- `low` rejected — empty/no-op `apply` undocumented/untested: silent no-op is harmless; documenting/testing adds noise beyond intent.
- `false` — sprint `in-progress` vs spec `in-review`: expected mid Build review sync lag.
- `false` — empty Spec Change Log / empty triage at review start: normal until this pass fills the triage log.
- `low` deferred — duplicated `importCompiledTs` helpers across scaffold and store test files: pre-existing pattern debt from 1.1; not a product defect of this story.
- `false` — mapping hex only checked at runtime: frozen matrix says compile-time typing only; no runtime hex scrubber required.
- `false` — review diff double-presents paths: artifact of staging untracked+tracked; not a product defect.
- `low` rejected — throwing subscriber aborts later listeners: speculative; try/catch isolation adds complexity not in intent.
- `low` rejected — `apply` with runtime `null` project/session: TypeScript `ApplyPayload` excludes null; null-guard complexity for unreachable everyday path.
- `low` rejected — listener reentrancy during notify: speculative; snapshotting listeners is defensive complexity without demonstrated caller.

## Design Notes

Keep `apply` as an explicit replacement of `project` and/or `session` slices (partial payload OK) rather than a free-form deep-merge API — history commands in later stories will compute next documents and hand them to `apply`. Export a module-level store singleton (or `createStore` + one instance created at boot) so persist/seed can later `apply` without UI ownership. Do not add Immer or other libs; structured clone / spread is enough for MVP document sizes.

```ts
// Illustrative — not normative line-for-line
type Mapping = {
  objectTypeId: string
  stateId: string
  propertyId: string
  paletteEntryId: string | null
}
type SessionUiState = {
  selectedObjectTypeId: string | null
  selectedStateId: string | null
  activeSkinId: string | null
}
```

## Verification

**Commands:**
- `npm test` -- expected: scaffold + store matrix suites pass
- `npm run build` -- expected: exit 0; `dist/` present

**Manual checks (if no CLI):**
- DevTools / source: `src/model/` exports store API; `main.ts` initializes store; boot still shows `Skin Studio`
