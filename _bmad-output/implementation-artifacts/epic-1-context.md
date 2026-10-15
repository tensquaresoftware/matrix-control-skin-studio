# Epic 1 Context: Skin Studio Opens with a Seeded Project

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Epic 1 delivers a buildable Skin Studio SPA that boots with a known v1 baseline: five skins, a base palette (including Duo LED yellow), and a single seed-placeholder inventory. Project and session state live in one store, autosave to the browser, and restore on cold reopen so calibration work survives a tab close. First open and confirmed New always land on that seed — no empty-state wizard.

## Stories

- Story 1.1: Scaffold Vite TypeScript SPA
- Story 1.2: Single-Writer Project Store
- Story 1.3: Seed v1 Skins, Palette, and Placeholder Inventory
- Story 1.4: Autosave Envelope and Cold Reopen
- Story 1.5: First Open and New Load Seed

## Requirements & Constraints

- Operator starts from inventory-seeded Palette and Object types suitable for `Black/Green` and `Cream/Green` bootstrap; MVP may ship one inventory file marked as seed-placeholder until Collect replaces it. Do not invent ObjectTypes / Properties / States outside that seed file, and do not treat placeholders as Matrix-Control product truth.
- v1 Skin display names only: `Black/Green`, `Cream/Green`, `Black/Duo`, `Cream/Duo`, `Monochrome`. Rejected names (`Black/Two-tone`, `Cream/Two-tone`, `Split`) must not appear.
- Duo LED yellow is a named Palette entry with default hex `#FFCC00` (calibratable); mappings reference its Palette id, never a raw hex literal.
- Green skins may carry bootstrap mappings from seed notes when present — still via the seed file, not ad hoc UI invention.
- Mapping values are Palette entry id or null (Unbound) — never raw `#RRGGBB` on the Mapping path. Hex is opaque `#RRGGBB`; uppercase preferred on write.
- Project autosaves in the browser; closing and reopening the same origin/profile restores the last project. Single-operator local storage is enough for MVP (no cloud sync).
- First open with no prior project loads seed + default session without a blocking empty-state wizard.
- New requires confirm, then replaces the current project with seed; cancel leaves the project unchanged. English operational microcopy for the confirm (same voice as other destructive confirms).
- Export/import JSON packing and full chrome UI are later epics; this epic only lays the document + persistence foundation (`formatVersion` writer pin `1` from day one).

## Technical Decisions

- **Stack:** Vite SPA + TypeScript + vanilla DOM/CSS. No React, Preact, Lit, or other UI framework. Pins: Vite `8.3.4`, TypeScript `7.0.2`, Node engines `^20.19.0 || >=22.12.0`. Static hosting only — no server API, accounts, or plugin-embedded UI.
- **Module folders under `src/`:** `model/`, `history/`, `persist/`, `io/`, `seed/`, `chrome/`, `canvas/`, `sidebar/`, `styles/` (stubs OK early). Root `vite.config.ts` and `index.html` required. Boot path: load persist → seed if empty → mount shells.
- **Dependency direction:** `model/` and `history/` must not import UI shells. `persist/` and `io/` depend on `model/` only. `seed/` feeds `model/`. UI may call history execute / undo / redo — never `store.apply` directly.
- **Single-writer store:** Only `model/store` mutates `ProjectDocument` and `SessionUiState`. UI emits commands; shells never patch fields in place.
- **ProjectDocument:** `formatVersion` (writer pin `1`), ordered `palette[]`, ordered `skins[]`, `inventory` with nested objectTypes / states / properties. Runtime shapes stay arrays + nested inventory — no alternate topologies.
- **Entity semantics:** PaletteEntry = stable id + opaque hex (+ optional constantName). Skin = stable id + displayName + mappings[]. Mapping = objectTypeId × stateId × propertyId → `paletteEntryId | null`. Prefer field name `paletteEntryId` over illustrative `paletteColorId`.
- **SessionUiState:** only `selectedObjectTypeId`, `selectedStateId`, `activeSkinId`. Zoom / pan / sidebar heights are prefs, not session.
- **Persistence split:** `localStorage` key `skin-studio:project` = envelope `{ project, session }`. Prefs key `skin-studio:prefs` = `{ zoomStep, panXY, sidebarPaneHeights }` only — never mixed into project export shape. Reopen restores envelope (+ prefs when present). Default zoom step `100%`.
- **Hosting:** desktop evergreen browser SPA; handoff later is downloaded JSON (out of this epic’s UI scope).

## UX & Interaction Patterns

- First open: seeded skins + base palette ready to calibrate; spine-only (no dedicated empty-state mock); no wizard.
- Autosave / cold reopen behaves like “reopen last file” — last envelope restores into the store.
- New is a confirm-then-seed-replace action (modal confirm pattern shared with other destructive ops: one modal deep, English sentence-case microcopy). Exact New confirm string may be assumed if EXPERIENCE has no dedicated row yet; keep the same operational voice as Import replace-all.
- Chrome visual tokens and full shell layout belong to Epic 2+; Epic 1 need not style the calibration console beyond a bootable shell.

## Cross-Story Dependencies

- 1.1 scaffold → 1.2 store → 1.3 seed content; 1.4 and 1.5 both require the store and seed load path.
- Boot order: restore envelope if present; otherwise seed. New confirm replaces store with seed and should persist via the same envelope path.
- Later epics (chrome, canvas, sidebar, unbound/export) assume this epic’s module layout, single-writer store, seed baseline, and autosave keys.
