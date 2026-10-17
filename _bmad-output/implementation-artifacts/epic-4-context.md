# Epic 4 Context: Calibrate Mappings with Live Preview

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

**Status:** closed (`sprint-status.yaml` → `epic-4: done`, 2026-10-17). Stories 4.1–4.4 complete; retrospective remains optional. Next MVP queue: Epic 5 (undo / Unbound / export).

## Epic 5 entry (readiness)

Stories 4.1–4.4 ship the calibration loop on the locked chrome. **Epic 5 may assume:**

- Mappings are `paletteEntryId | null` only; paint resolves via `resolvePaletteHex` / `findMapping` — never hex off a Mapping.
- Session sticky selection: `selectedObjectTypeId` / `selectedStateId` / `activeSkinId`; canvas click does not reset State.
- Canvas live paint: Orchestrator zones from layout Palette ids; inventory Object-type hits use `HIT_FILL_FIRST_PROPERTY`; Mapping change pulses chrome outline (may abort under rapid full-rebuild — accepted debt).
- Seed inventory stays `KEEP_EMPTY`; Object-type hits/pulse proven with fixture inventory in matrices — do not invent Collect types.
- Mapping rows already show Unbound for missing rows, null id, and dangling id.

**Must fix in story 5-2 (not optional):** today’s `deriveUnbound` only walks existing `Skin.mappings[]` rows. AD-10 / Story 5.2 require Unbound = every loaded inventory Property × Skin × ObjectType × State without a resolvable Palette colour (missing Mapping row **or** null **or** dangling). Expand `deriveUnbound` (and Unbound pane / export gate consumers) to that completeness set so UI markers, count, and hard gate share one truth.

**Accepted Epic 4 debt (do not block Epic 5 start):** full mock `replaceChildren` / pulse abort / keyboard focus loss; `mountCanvas` subscribe without dispose; pre-4.1 cold reopen missing Patch/Master Palette entries; session Object/State repair on inventory shrink; duplicated canvas matrix harness. Tracked in `deferred-work.md`.

**Not Epic 4 / do not implement against:** Unbound export hard gate, coalesced undo/redo, import/export packing — stories **5-1** / **5-3** / **5-4**.

## Goal

Epic 4 turns the locked console into a working calibration loop: the operator selects Object type and State, binds each Property to a Palette id only, and sees the Matrix-Control mock update immediately — including LED faces at fully-on colour and Duo Patch/Master accents via Orchestrator zones on the canvas. Canvas and Sidebar stay in sync on selection, with a short outline pulse when a Mapping changes, so multi-Skin colour work stays trustworthy without inventing inventory or free hex on the Mapping path.

## Stories

- Story 4.1: GUI View Mock with Orchestrator Zones
- Story 4.2: Object Type, State, and Palette-Id Mappings
- Story 4.3: Bidirectional Canvas ↔ Sidebar Selection Sync
- Story 4.4: Live Preview, LED Fully-On, and Mapping Pulse

## Requirements & Constraints

- Mappings bind Properties by Palette id only. Hex is edited only on Palette entries; a Mapping slot never accepts free `#RRGGBB`. Persisted values are Palette ids or explicitly Unbound (null / unresolvable).
- Mappings are type-level only: one binding per Object type × State × Property for the active Skin. No per-instance overrides; every mock instance of a type shares the same mappings.
- Operator selects Object type (canvas click or Sidebar) and State, then edits Property → Palette id rows for that pair. Changing State refreshes which Property rows appear and how the mock paints that Object type.
- Canvas ↔ Sidebar sync: click a mock Object-type region → select that type and highlight/scroll the corresponding Mapping row(s) without resetting State; choose Object type in Sidebar → outline the matching mock region(s) when present. Context strip Object/State values follow session selection.
- On Mapping change, affected mock region(s) get a brief outline pulse, then return to steady selection if still selected.
- Palette hex or Mapping Palette-id edits update the GUI view in the same interaction turn — no reload, no explicit refresh.
- LED Properties always paint at their mapped fully-on Palette colour; no intensity or dim preview UI in Skin Studio.
- Clickable Object-type regions exist only for types in the **loaded** seed inventory. Do not invent Collect inventory as product truth.
- Duo Patch/Master accents are simulated as Orchestrator zones on the mock layout, not frozen into generic Object types. GUI view is a readable Matrix-Control composition (Header / Body Patch&Master / Footer), not a pixel-perfect JUCE clone.
- Unbound Mapping rows show a warning marker and `Unbound` label. Export-gate behavior stays out of this epic’s ownership; Unbound semantics must stay consistent with the shared model derive.
- Chrome microcopy remains English and operational.

## Technical Decisions

- **Mapping model:** `Skin.mappings[]` unique on `(objectTypeId, stateId, propertyId)`; each value is `paletteEntryId | null` only. Inventory Object types stay generic (`id`, nested `states[]` / `properties[]` string ids). Paint colours resolve only via model palette/mapping lookup helpers — never by reading hex off a Mapping.
- **Session selection:** `SessionUiState` holds `selectedObjectTypeId`, `selectedStateId`, `activeSkinId`. Canvas click selects Object type and must not reset State. Skin switch (Epic 2) still changes only `activeSkinId`.
- **Orchestrator simulation:** Patch/Master / Header zone accents live in canvas mock layout metadata owned by the canvas layer — not as Inventory ObjectTypes and not as C++ Looks. LED fully-on paint is a canvas paint rule over mapped Palette colour.
- **Live preview:** Canvas subscribes to the single-writer store; Mapping or Palette hex changes repaint consumers of that Palette id on the next paint. Mutation path remains UI → history/store — shells do not patch project fields in place.
- **Seed inventory boundary:** Only Object types present in the loaded seed-placeholder inventory are selectable regions. Seed mappings may still need Duo Header-LED binds to the named Duo LED yellow Palette entry (`#FFCC00` baseline) rather than a hex literal on the Mapping path.
- **Out of this epic:** Unbound export hard gate, undo/redo coalesce, import/export packing — later epics. Where-used browse, rename refactor, search-to-zoom, and side-by-side compare remain Soon.

## UX & Interaction Patterns

- Sidebar pane 3 stays segmented `[Mappings | Skin]` (Mappings default). Mappings tab: Object type and State controls always visible; rows = Property → Palette id for the active pair. Skin tab stays CRUD-only.
- Mapping rows: bound = swatch + id; Unbound = chrome warning marker + `Unbound` label. Canvas-driven highlight uses muted accent background on the focused row(s).
- Selection outline on the mock: 2px chrome selection accent, transparent fill. Pulse on Mapping change: outline-only, chrome `pulse-outline` (same accent family — not a Palette colour), 1–2 repeats ~400 ms ease-out, then steady selection if still selected.
- Core loop: see mock → select Object type → choose State → map Property → Palette id → live preview; Skin switch keeps place (sticky context from earlier epics).
- Banned in this epic’s UI paths: free hex on Mapping path; baking Patch/Master into Object types; inventing Collect types in the mock; intensity/dim LED controls; left layers / bottom chrome.

## Cross-Story Dependencies

- 4.1 mock + zone metadata → 4.2 mapping editor → 4.3 bidirectional selection sync → 4.4 live preview, LED fully-on, and mapping pulse (pulse and paint assume mock regions and Mapping rows exist).
- Depends on Epic 1 (store, seed inventory/skins/palette) and Epic 2 (chrome shell, sticky context, canvas pan/zoom prefs). Assumes Epic 3 Palette/Skin CRUD and Palette-id-only discipline, including the calibratable Duo LED yellow entry.
- Epic 5 will gate Export on Unbound count derived from the same inventory/mapping rules this epic edits; keep Unbound row markers aligned with that derive without implementing the export gate here.
