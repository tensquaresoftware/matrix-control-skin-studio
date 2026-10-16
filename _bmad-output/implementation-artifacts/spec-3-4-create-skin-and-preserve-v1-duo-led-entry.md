---
title: '3-4 Create Skin and Preserve v1 Duo LED Entry'
type: 'feature'
created: '2026-10-16'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '9263def88c258574f28eb9f82fc986654ff1f608'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Operators can rename, duplicate, and delete Skins from the Skin tab, but cannot create a fresh Skin identity — and Epic 3 still needs a clear guard that seed’s five v1 display names and the calibratable Duo LED yellow Palette entry stay available as the family baseline.

**Approach:** Add a Create Skin affordance on the Skin tab that appends a new Skin with a stable opaque id and empty mappings, activates it like Duplicate, refreshes the Skin combo; keep seed-matrix (or sibling) asserts that the five v1 names, rejected-name absence, Duo LED `#FFCC00` / `duoLedYellow`, and colourless inventory objectTypes remain true after create.

## Boundaries & Constraints

**Always:**
- Create lives on the Skin tab action row beside Duplicate / Delete (English label `Create Skin`). Do **not** put Create on the top-bar Skin combo (switcher only). Mutate via `store.apply({ project, session? })` discrete commit (same path as Duplicate — no coalesce).
- **Create:** append a new `Skin` with unique opaque `id` (reuse `allocateSkinId` / `crypto.randomUUID` + collision loop), `displayName` per CREATE_DEFAULT_NAME, and `mappings: []` (Decision MAPPINGS_ON_CREATE = EMPTY — matches seed skins and “empty or default” with no default mapping template in the model yet).
- **Decision CREATE_DEFAULT_NAME = SKIN_N:** default `displayName` is `Skin {n}` with the smallest unused positive integer among existing skins whose `displayName` matches `Skin {n}` (same numbering idea as Palette `Colour {n}`).
- **Decision CREATE_ACTIVATES = SELECT_NEW:** after create, set `session.activeSkinId` to the new Skin’s `id` in the same apply so the tab and combo show the new Skin (mirror DUPLICATE_ACTIVATES).
- **Decision CREATE_WITHOUT_ACTIVE = ALWAYS_ENABLED:** Create Skin stays enabled when `activeSkinId` is null and when `project.skins` is empty (recovery after last-skin delete). Rename / Duplicate / Delete keep their existing no-active disable rules from story 3.3.
- **Preserve v1 / Duo LED (FR-15 / FR-16):** after Create (and without operator-driven seed edits), the seeded project still exposes the five v1 display names (`Black/Green`, `Cream/Green`, `Black/Duo`, `Cream/Duo`, `Monochrome`); rejected names (`Black/Two-tone`, `Cream/Two-tone`, `Split`) are not introduced by Create; Palette still includes `duoLedYellow` with baseline `#FFCC00` and `constantName` `kDuoLedYellow`, calibratable via the existing Picker path (hex write-through updates any consumer that resolves palette by id — canvas paint remains Epic 4).
- **Decision NO_ACCENT_BAKE:** Create must not add Duo Patch/Master accent colours onto inventory Object types; `objectTypes` stay without colour fields / remain seed-placeholder empty as today (FR-15 / AD-13 — zone simulation belongs to Epic 4).
- Cover Create (id + empty mappings + combo + activate), create-without-active / empty-list recovery, and preserve asserts in `scripts/skin-tab-matrix.test.mjs` and/or `scripts/seed-matrix.test.mjs`. Keep `npm test` / `npm run build` green. English chrome microcopy.

**Never:**
- Mapping bind UI, canvas preview paint / Orchestrator zones, Export-gate / Unbound pane, Import/Export, undo/redo stack / hex coalesce (5-1).
- CRUD on the top-bar Skin combo. Expanding SessionUiState keys. Per-instance colour overrides. Layers tree / mode pills. Stacked modals.
- Special-case locking Duo LED or v1 skins against rename/delete (operators may still edit them — this story only ensures Create + seed baseline remain available from a fresh seed).
- Changing envelope schema. Baking Duo accents into generic Object types.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Create happy | Seed project; Skin tab; Create Skin | New Skin appended; unique `id`; `mappings: []`; `displayName` `Skin {n}` (smallest unused); combo lists it; `activeSkinId` = new id | N/A |
| Create without active | `activeSkinId` null and/or `skins: []`; Create Skin | Create enabled; new Skin appended and activated; empty list recovers to one Skin | N/A |
| Preserve v1 after create | Seed project; Create Skin once | Original five v1 skins still present with their seed display names; no rejected display names introduced by Create | N/A |
| Preserve Duo LED | Seed project; Create Skin once | `duoLedYellow` still `#FFCC00` / `kDuoLedYellow`; Picker can still recolour that id | N/A |
| No accent bake | Seed project; Create Skin | Inventory `objectTypes` still have no baked Duo accent colours (empty placeholder inventory unchanged) | N/A |

</frozen-after-approval>

## Code Map

- `src/sidebar/skin-pane.ts` — `mountSkinPane`, `applyDuplicate`, `allocateSkinId`, `deepCopyMappings`; add Create button + `applyCreate`; keep rename/duplicate/delete contracts
- `src/sidebar/skin-delete-confirm.ts` — leave delete confirm alone
- `src/sidebar/index.ts` — already mounts Skin pane; pass-through only if needed
- `src/chrome/index.ts` — `buildSkinCombo` / `syncSkinFromStore` already rebuild from `project.skins`; verify via matrix after create — no CRUD here
- `src/model/types.ts` — `Skin` `{ id, displayName, mappings }`; `SessionUiState.activeSkinId`
- `src/model/store.ts` — `store.apply({ project?, session? })`
- `src/seed/seed-data.ts` / `src/seed/index.ts` — five v1 skins, `duoLedYellow` `#FFCC00` / `kDuoLedYellow`, empty `objectTypes`; do not rewrite seed unless a preserve helper is missing
- `src/styles/base.css` — reuse `.skin-actions` / `.skin-action-btn`; layout tweak only if Create needs ordering
- `scripts/skin-tab-matrix.test.mjs` — extend for Create + no-active policy
- `scripts/seed-matrix.test.mjs` — reuse/extend for v1 names, rejected names, Duo LED, empty inventory after create path if cleaner than skin-tab matrix
- Continuity from 3-3: DUPLICATE_ACTIVATES = SELECT_NEW, LAST_SKIN_DELETE = ALLOW_EMPTY, displayNames need not be unique
- Do **not** change: Palette/Picker panes, Mapping bind UI, canvas paint, SessionUiState shape, envelope schema, chrome combo CRUD

## Tasks & Acceptance

**Execution:**
- [x] `src/sidebar/skin-pane.ts` -- Add Create Skin affordance + `applyCreate` (stable id, `Skin {n}`, empty mappings, SELECT_NEW, ALWAYS_ENABLED) -- FR-14
- [x] `src/styles/base.css` -- Adjust Skin-tab action row only if Create needs layout -- UX-DR2 / UX-DR6 (no change needed; existing `.skin-actions` flex-wrap fits Create)
- [x] `scripts/skin-tab-matrix.test.mjs` (+ `scripts/seed-matrix.test.mjs` if needed) -- Create happy path, create-without-active / empty-list, preserve v1 names / Duo LED / no accent bake -- I/O matrix / FR-15 / FR-16

**Acceptance Criteria:**
- Given the Skin tab, when the operator creates a Skin, then it appears in the Skin combo with a stable unique id and empty mappings, and becomes the active Skin.
- Given a seeded project, when the operator creates a Skin, then the five v1 display names and Duo LED yellow Palette entry (`#FFCC00`) remain available and calibratable; rejected names are not introduced.
- Given Create, when it runs, then Duo Patch/Master accents are not baked into inventory Object types.

## Implementation Notes

- Create Skin button (`data-skin-create`) prepended to Skin tab actions; `applyCreate` + `nextSkinName` (`Skin {n}`) in `src/sidebar/skin-pane.ts`.
- No `base.css` change — three action buttons wrap with existing styles.
- Preserve / Create matrix cases live in `scripts/skin-tab-matrix.test.mjs` (seed-matrix unchanged).
- Review patch: Create happy-path mounts `projectWithActiveSkin()` so empty-mappings cannot pass by copying Duplicate.
- Review patch (pass 2): happy-path re-asserts `black-green` mappings via `fixtureMappings()`; open-Skin-tab pins `Create Skin` textContent.

## Spec Change Log

- 2026-10-16 — Code-review pass 2: pin existing-skin mappings after Create; assert Create Skin label.

## Review Triage Log

- `medium` patch — Create empty-mappings only asserted against empty-mapping skins — verified: happy-path used seed `mappings: []`; copying active mappings would still pass — route patch (matrix now uses `projectWithActiveSkin()`)
- `false` — Vacuous objectTypes colour-field loop — verified: `assert.deepEqual(objectTypes, [])` already fails if Create baked accents; loop is redundant not a gap
- `false` — AC omit CREATE_WITHOUT_ACTIVE — rejected: fix would edit this build’s acceptance bullets
- `false` — Duo LED calibratable only via store.apply not Picker UI — verified: same model hex write-through; Picker path already covered in palette-picker-matrix
- `false` — sprint-status `in-progress` vs spec `in-review` — workflow tracking; step-05 syncs sprint to review
- `low` rejected — Gap-fill create omits id/mappings/activate asserts — naming-only case; happy-path covers those
- `false` — Happy-path never asserts name field enabled after create — with active seed Skin the field was already enabled; empty-list case asserts enable
- `false` — Create during in-progress rename unspecified — verified: blur still commits `editingSkinId` (old Skin); Create only appends + activates new
- `false` — Empty Spec Change Log / Triage at review start — process fill-in, not a product defect
- `false` — Duo LED AC thinner than frozen `kDuoLedYellow` / Picker recolour — rejected: fix would edit this build’s AC
- `low` rejected — No assert Create absent from top-bar combo — chrome unchanged; Create only on Skin tab by construction
- `false` — Preserve checks display names not seed skin ids — verified: `applyCreate` only appends; never mutates existing skins
- `false` — Create enabled after successful create untested — verified: `createBtn.disabled = false` always; no disable path
- Edge Case Hunter — no findings
- `medium` patch — Create happy-path never re-asserts existing Skin mappings after append — verified: pre-click mappings snapshot unused after click; wiping existing mappings would still pass — route patch
- `low` patch — Create Skin English label never asserted — verified: matrix only checks `disabled` / click; wrong `textContent` would stay green — route patch
- Edge Case Hunter (pass 2) — empty findings → layer marked failed; other layers used for triage

### Review Findings

- [x] [Review][Patch] Create empty-mappings only asserted against empty-mapping skins [scripts/skin-tab-matrix.test.mjs]
- [x] [Review][Patch] Create happy-path never re-asserts existing Skin mappings after append [scripts/skin-tab-matrix.test.mjs:770]
- [x] [Review][Patch] Create Skin English label is never asserted [scripts/skin-tab-matrix.test.mjs:431]

#### Rejected (code review pass 2)

- `false` — Spec `done` vs sprint `review`: expected during code-review; not a product defect
- rejected — AC omit CREATE_WITHOUT_ACTIVE: fix would edit this build’s acceptance bullets
- `false` — No assert Create absent from top-bar combo: chrome unchanged; Create only on Skin tab by construction
- `low` rejected — Gap-fill create omits id/mappings/activate asserts: naming-only case; happy-path covers those
- `false` — Vacuous objectTypes colour-field loop: `assert.deepEqual(objectTypes, [])` already fails if Create baked accents
- `false` — Duo LED calibratable only via store.apply not Picker UI: same model hex write-through; Picker path covered in palette-picker-matrix
- `false` — Create during in-progress rename unspecified: blur still commits `editingSkinId` (old Skin); Create only appends + activates new
- `false` — Empty Spec Change Log: process fill-in, not a product defect
- `false` — Preserve checks display names not seed skin ids alone: subsumed by patch on happy-path existing-mappings pin; `applyCreate` is append-only today

## Verification

**Commands:**
- `npm test` -- expected: all matrix suites green, including Create + preserve cases
- `npm run build` -- expected: TypeScript/Vite build succeeds
