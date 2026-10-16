# Epic 3 Context: Manage Palette and Skins

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Epic 3 gives the operator full Palette and Skin management on the locked chrome: create, rename, recolour, and safely delete Palette entries; create, rename, duplicate, and delete Skins; keep the five v1 display names and the calibratable Duo LED yellow Palette entry (`#FFCC00` baseline) available from seed. Colour discipline stays absolute — hex only on Palette entries, Mappings only by Palette id — so later mapping/preview work does not inherit silent hex substitution or a broken v1 skin family.

## Stories

- Story 3.1: Palette Selection and Picker Recolour
- Story 3.2: Palette Create, Rename, and Referenced Delete
- Story 3.3: Skin Tab — Rename, Duplicate, Delete
- Story 3.4: Create Skin and Preserve v1 Duo LED Entry

## Requirements & Constraints

- Palette CRUD: create (stable id), rename (id stays stable; display/constant name updates), recolour via picker/sliders/hex, delete. Colours are opaque `#RRGGBB` only; uppercase hex preferred on write, case-insensitive on read.
- Deleting a Palette entry still referenced by mappings must confirm first and list how many mappings will become Unbound; on confirm those mappings become Unbound (`paletteEntryId` null) — never a silent hex substitute. Cancel leaves palette and mappings unchanged.
- Skin CRUD: create, rename, duplicate (copies mappings into a new Skin identity), delete. Delete always confirms; cancel = no change; confirm removes the Skin from the switcher and project. No per-instance colour overrides.
- v1 Skin display names that must remain available from seed: `Black/Green`, `Cream/Green`, `Black/Duo`, `Cream/Duo`, `Monochrome`. Rejected names (`Black/Two-tone`, `Cream/Two-tone`, `Split`) must not appear as display names.
- Duo LED yellow is a named Palette entry with baseline `#FFCC00`, not a magic constant outside the Palette. Changing its hex updates every consumer of that id on the next preview paint. Duo Patch/Master accents stay zone-orchestrated on the mock later — not frozen into generic Object types in this epic.
- Mapping UI must not accept free `#RRGGBB` typed into a Mapping slot; hex editing lives only on the selected Palette entry.
- Hex fields use mono typography (IBM Plex Mono). Chrome UI microcopy is English.

## Technical Decisions

- **Model:** Ordered `palette[]` and `skins[]` on `ProjectDocument`. `PaletteEntry`: stable `id`, opaque hex, optional `constantName`. `Skin`: stable `id`, `displayName`, `mappings[]` unique on `(objectTypeId, stateId, propertyId)`. Mapping values are `paletteEntryId | null` only — never raw hex.
- **Mutation path:** UI → `history.execute(command)` → single-writer `model/store`. Picker / Palette hex micro-edits coalesce (~400 ms idle or pointer-up). Discrete commits (rename, Skin CRUD, mapping id change) stay separate undo steps.
- **Sidebar IA:** Pane 3 segmented `[Mappings | Skin]` (Mappings default). Skin tab = rename / duplicate / delete (and create affordance as model rules allow) — not a layers tree. Picker pane commits hex only when a Palette entry is selected.
- **Seed:** Fresh project includes the five v1 skins, base palette, and Duo LED yellow entry. Skin combo reflects the Skin list after CRUD.
- **Out of this epic’s ownership:** Canvas Orchestrator zone simulation for Patch/Master accents; full live-preview pulse wiring — those belong to mapping/preview work. Paint colour resolution must still go through model palette/mapping helpers when preview is touched.

## UX & Interaction Patterns

- Select a Palette swatch row → picker edits that entry only. No selected entry → picker may show idle values but must not commit hex.
- Palette row: swatch + optional constant name + hex; Add / Delete affordances; delete of a referenced id opens the confirm modal.
- Delete referenced Palette colour: title `Delete colour “{name}”?`; body `{n} mapping(s) will become Unbound:` + list; primary `Delete and unbind`; cancel `Cancel`. Visual reference: delete-palette modal mockup in the UX package.
- Delete Skin: always confirm with `Delete skin “{name}”? This cannot be undone.`
- Skin switcher (top-bar combo) updates when skins are created, duplicated, or deleted. Skin tab does not introduce mode pills or per-instance override UI.

## Cross-Story Dependencies

- 3.1 picker recolour → 3.2 palette create/rename/referenced-delete; 3.3 Skin tab rename/duplicate/delete → 3.4 create Skin + preserve v1 Duo LED entry.
- Depends on Epic 1 (single-writer store, seed project with palette/skins, command history) and Epic 2 (four-pane sidebar shell, Skin combo, DESIGN tokens including mono hex).
- Epic 4 assumes Palette-id-only discipline, the Duo LED entry, and that Duo zone accents are not baked into Object types here.
- Referenced Palette delete increases Unbound count; export-gate behavior remains Epic 5, but Unbound semantics must match the shared model derive.
