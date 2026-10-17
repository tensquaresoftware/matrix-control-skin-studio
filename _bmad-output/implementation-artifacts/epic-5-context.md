# Epic 5 Context: Undo Safely and Export a Complete Package

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Epic 5 closes the calibration loop for trustworthy handoff: the operator undoes and redoes project and selection edits (with rapid picker/Palette hex micro-gestures coalesced into one step), sees a live Unbound count derived from the loaded inventory, and can download a single project JSON only when every required Mapping is bound. Import is replace-all after strong confirm and fails closed on unknown or newer `formatVersion`, so Skin Studio never silently ships holes or partially loads foreign files.

## Stories

- Story 5.1: History Stack with Coalesced Undo/Redo
- Story 5.2: Unbound Derive and Unbound Pane
- Story 5.3: Hard Export Gate and Single Project JSON
- Story 5.4: Import Replace-All with Fail-Closed formatVersion

## Requirements & Constraints

- Undo restores project mutations (Palette, Skin, Mapping, related identity fields) plus Object type / State selection. Undo never reverses Zoom or pan. Redo reapplies until a new branch edit clears the redo stack.
- Rapid consecutive picker / Palette hex micro-edits coalesce into a single undo step (≈ 400 ms idle or pointer-up). Discrete commits (Skin rename, Mapping change to a different Palette id, Skin CRUD) remain separate steps.
- Unbound required Mapping count and enough detail to locate gaps must stay visible while editing. Until Collect marks optionals, every Inventory Property for each Skin × ObjectType × State in the **loaded** inventory is required.
- A slot is Unbound if the Mapping is missing, `paletteEntryId` is null, or the Palette id is deleted/unresolvable. Do not invent Collect ObjectTypes to “fill” completeness — interim gate is the loaded inventory only (seed-placeholder OK).
- Export is hard-gated: disabled / non-activating while unbound count > 0; no soft allow with warnings. When clear, export produces one `.json` project document (all skins) with `formatVersion` writer pin `1`. Export never includes session, Zoom, pan, or sidebar prefs. Mappings in export stay Palette ids, never raw hex. No mandatory Markdown companion.
- Import of supported `formatVersion` `1` is replace-all after strong confirm; cancel leaves the current project unchanged; prefs (Zoom/pan) stay unchanged on successful import. Unknown or newer `formatVersion` fails closed with a clear error — no partial silent load. Merge/re-map import is Soon, not this epic.
- Handoff is JSON download / file-picker import only; English operational microcopy; desktop SPA / local operator — no cloud sync or server API in MVP.

## Technical Decisions

- Mutation path is UI → `history.execute` → `store.apply` only. UI shells must never call `store.apply` directly. `history/` owns the command stack and coalesce; Zoom/pan are prefs and never undo steps.
- Sole Unbound derive lives in `model/` (e.g. `deriveUnbound`). `io/` and UI ask that derive — they do not reimplement unbound math. Export gate reads the same derive.
- Autosave envelope (`{ project, session }`) and prefs remain separate from export/import: export/import serialize **project only**. Packing is one JSON document = whole Project; per-skin multi-file packing is Deferred.
- `formatVersion` is a required integer; writer pin `1`. Fail closed on unknown/newer. Final JSON field names remain Collect-blocked for freeze — do not invent schema beyond the adopted model shapes.
- Module ownership for this epic: `history/` (coalesce undo/redo), `model/` (deriveUnbound), `io/` (formatVersion validate + export gate), `sidebar/` (unbound pane), `chrome/` (Undo/Redo/Export/Import controls).

## UX & Interaction Patterns

- Top bar already ordered `[New][Import][Export]` · undo/redo · Zoom · Skin; this epic makes Undo/Redo/Import/Export live against history and io contracts.
- Sidebar pane 4 (Unbound) is always visible: warning count badge `{n} unbound` + clickable rows `{Object type} · {Property}`; empty success copy `All required mappings bound`. Row click jumps to that Object type + Mapping row (and State if encoded).
- Export when unbound > 0: visually disabled (`export-disabled` — muted, non-activating) with tooltip `Export blocked — {n} unbound mapping(s)`. When unbound = 0: Export enabled with accent styling.
- Import replace-all confirm: `Replace the current project with this file? Unsaved browser state will be overwritten.` Fail-closed copy: `Import failed — this file uses an unsupported format version.`
- Modal confirm pattern (scrim + raised surface, one modal deep) for Import replace-all. Disabled Export stays in tab order but non-activating (or skipped consistently — pick one at implementation).
- Coalesce applies to picker/Palette hex micro-gestures only; chrome warning tokens (not project Palette yellow) for Unbound affordances.

## Cross-Story Dependencies

- 5.1 history stack → all later project mutations in this epic go through execute/undo/redo.
- 5.2 complete Unbound derive + pane → 5.3 hard export gate (same count/list truth).
- 5.3 export packing/gate and 5.4 import versioning share `io/` + project-only serialization; 5.4 must not change Zoom/pan prefs.
- Depends on Epic 1 (store, seed inventory, autosave envelope/prefs split), Epic 2 (chrome controls present), Epic 3–4 (Palette/Skin/Mapping edits that feed history and Unbound). Epic 6 Soon items (merge import, draft/ready, where-used) stay out of scope.
