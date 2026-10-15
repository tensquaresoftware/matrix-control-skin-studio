---
name: 'Adversarial architecture review — Matrix-Control Skin Studio spine'
type: architecture-review
lens: adversarial
status: complete
created: '2026-10-15'
spine: '../ARCHITECTURE-SPINE.md'
verdict: 'fail — spine does not constrain shared shapes, session ownership, or command/apply boundaries tightly enough for independently built epics to compose'
---

# Adversarial Review — Architecture Spine

## Method

Assume two epic/feature builders (Unit A, Unit B). Each team:

1. Reads only the spine ADs and consistency conventions.
2. Obeys every AD **to the letter**.
3. Does not coordinate on undocumented choices.

If their outputs cannot merge into one SPA without a rewrite of shared types, mutation paths, or serializers, that pair is a **hole**. Each hole needs a new or tightened AD.

## Verdict

**FAIL.** The paradigm slogan (“document-centric single-writer store”) is directionally right, but several binding surfaces are still **semantic wishes**, not **mechanical contracts**. Two careful builders can stay AD-compliant and still ship clashing `ProjectDocument` shapes, two owners of session/selection, and divergent command → history → store apply paths. Close the holes below before treating this spine as build-substrate for parallel epics.

---

## Attack scenario (working pair of units)

| Unit | Scope (one level down) | Obeys |
| --- | --- | --- |
| **Unit A — Mapping & Palette epic** | `model/` types for palette + mappings, `sidebar/` palette + mappings panes, `seed/` base palette, unbound derivation used by export gate | AD-1…AD-13 as written |
| **Unit B — Canvas & Session epic** | `canvas/` mock + pan/zoom, `chrome/` Skin combo + context strip, session sticky context, prefs restore, live preview paint | AD-1…AD-13 as written |

Both units need the same project truth, the same Skin switch semantics, and a single export gate. The failures below are what they produce **without violating any current AD text**.

---

## Finding 1 — Mapping (and skins) storage shape is unbound

### Hole

AD-4 binds **entities and relationships** and a semantic Mapping arrow  
`objectTypeId × stateId × propertyId → paletteEntryId | null`,  
and lists `Skin.mappings[]`. It does **not** freeze:

- whether `mappings` is an **array of records**, a **nested map**, or a **composite-key `Record`**;
- uniqueness of the triple (duplicate rows allowed? last-write wins?);
- whether `Project.skins` / `palette` are **arrays** or **id-keyed maps**;
- whether a Mapping row has its own stable `id`.

Consistency conventions say “JSON keys: semantic names in AD-4; final key freeze post-Collect” — which **explicitly postpones** the wire/runtime shape that Units A and B must share **now**.

### Incompatible builds (both AD-legal)

**Unit A (mappings sidebar):**

```ts
// Skin.mappings as array; project collections as arrays
type Mapping = {
  objectTypeId: string;
  stateId: string;
  propertyId: string;
  paletteEntryId: string | null;
};
type Skin = { id: string; displayName: string; mappings: Mapping[] };
type ProjectDocument = {
  formatVersion: number;
  palette: PaletteEntry[];
  skins: Skin[];
  inventory: Inventory;
};
```

Unbound scan: nested loops over inventory × skins × `mappings.find(...)`.  
Missing triple ⇒ Unbound (AD-10 “mapping is missing”).  
Null `paletteEntryId` ⇒ Unbound.  
Duplicates: “first match” wins.

**Unit B (canvas live preview):**

```ts
// Same AD-4 arrow, different shape — still “paletteEntryId | null only”
type MappingKey = `${string}/${string}/${string}`; // ot/state/prop
type Skin = {
  id: string;
  displayName: string;
  mappings: Record<MappingKey, string | null>; // absent key = missing
};
type ProjectDocument = {
  formatVersion: number;
  palette: Record<string, PaletteEntry>;
  skins: Record<string, Skin>;
  inventory: Inventory;
};
```

Paint path: `skin.mappings[`${ot}/${st}/${prop}`]` — O(1).  
Absent key vs explicit `null` both Unbound under AD-10.  
No array order; Skin CRUD rewrites whole Record.

### Clash

- Store snapshots, seed, persist, and io serializers cannot agree on one `ProjectDocument`.
- Unit A’s “append Mapping row” command is meaningless to Unit B’s Record model (and vice versa).
- Import/export (AD-5, AD-9) becomes two packing dialects, both “one JSON = whole Project.”

### Close with

**Tighten AD-4** (or add **AD-4a — Runtime document shape**): freeze MVP runtime + localStorage/export isomorphic shape for `palette`, `skins`, and `mappings` (recommend: arrays + unique triple constraint; forbid Record maps until post-Collect schema freeze). State uniqueness rule and “missing vs null” equivalence in one sentence.

---

## Finding 2 — Inventory topology is ambiguous (ER vs table)

### Hole

AD-4 ER diagram:

- `ObjectType ||--|{ State`
- `ObjectType ||--|{ Property`

Table row:

- Inventory = “ObjectType / State / Property **id lists** — placeholders until Collect”

Those are different graphs. “Id lists” allows three flat arrays with no nesting ownership. The diagram requires States/Properties **belong to** ObjectType. No AD states which is binding when they conflict.

### Incompatible builds

**Unit A (unbound / mappings):** Nesting matches ER — required slots walk `objectType.states × objectType.properties`. Mapping targets are ids **scoped per ObjectType**. Same `stateId` string may exist under two ObjectTypes without collision in A’s mind (ids are local).

**Unit B (canvas picker / sticky context):** Flat inventory —

```ts
type Inventory = {
  objectTypeIds: string[];
  stateIds: string[];
  propertyIds: string[];
};
```

AD-6 fields `selectedObjectTypeId` + `selectedStateId` are global ids. Unit B treats State as project-global (one “FullyOn” for all types). Seed placeholders invent one shared state list.

### Clash

- Mapping triples are not comparable across units (scoped vs global ids).
- Unbound count (AD-10) diverges: A multiplies per-type states; B multiplies global states × all types → different `unboundCount` → export gate (AD-9) opens/closes differently for the “same” semantic project.
- Sticky context (AD-6) “never invent a selection” cannot be tested the same way when State identity differs.

### Close with

**Tighten AD-4 Inventory:** pick one topology for MVP placeholders (recommended: States and Properties are **children of ObjectType**; ids unique within project; Mapping ids are global strings that must resolve under the targeted ObjectType). Add a one-line anti-rule: flat parallel id lists are non-compliant.

---

## Finding 3 — Two owners of SessionUiState / selection / zoom

### Hole

- AD-1: only `model/store` may mutate **`ProjectDocument`**. Session is **not** named in the rule.
- Diagram: `Store --> SessionUiState` (implies store ownership).
- AD-6: lists SessionUiState fields; does not say **who may write** them or that writes go through commands.
- AD-7: command stack covers project + Object type / State selection; zoom/pan never undo — implies selection is command-shaped, but not that chrome/canvas cannot also assign fields.
- AD-8: prefs hold Zoom, pan, sidebar pane heights in `skin-studio:prefs`, while AD-6 also puts `zoomStep` / `panXY` in SessionUiState — **dual homes, no hydration contract**.
- Capability map: sticky context in `model/session`; structural seed shows only `model/` — no mandated session module boundary.

### Incompatible builds

**Unit B (chrome + canvas):** Treats SessionUiState as a **mutable module singleton** exported from `model/session.ts`. Chrome sets `activeSkinId` on Skin combo change; canvas writes `panXY` / `zoomStep` on pointer wheel; both call `persist.savePrefs()` themselves. Selection clicks set `selectedObjectTypeId` in place. History (AD-7) is only hooked for project commands Unit A owns — Unit B pushes ad-hoc `SelectObjectType` commands **or** skips history when “faster,” still claiming AD-1 (project untouched).

**Unit A (sidebar mappings + unbound):** Believes diagram + AD-7: every selection change is a **command** through `history` → `store.setSession(...)`. Subscribes to store snapshots only. Implements coalesce-adjacent selection updates. On Skin switch, only dispatches `SetActiveSkin` via store. Expects zoom/pan to live in session and be **restored by `persist/` on boot into the store**, not written by chrome.

### Clash

- Skin switch + picker click races: Unit B’s in-place session write vs Unit A’s command-ordered session → context strip (AD-6 readout) and mappings pane show different Object type / State after the same user gesture.
- Prefs: Unit B writes `{ zoom, pan, paneHeights }`; Unit A’s persist layer writes serialized `SessionUiState` blob to the same key `skin-studio:prefs` (AD-8 key name obeyed; shape free). Reload: one unit restores zoom, the other resets or double-applies.
- Undo (AD-7): Unit A undoes selection; Unit B’s canvas never heard a command — sticky context desync (FR-2 / FR-5 broken while every AD citation still “passes”).

### Close with

**New AD-S (session single-writer)** or extend AD-1:

1. Only `model/store` mutates `SessionUiState` (same as project).
2. UI never assigns session fields; only commands / store APIs.
3. **Prefs contract:** `skin-studio:prefs` schema listed (zoomStep, panXY, paneHeights…); boot path = persist → store.hydratePrefs; runtime source of truth = SessionUiState; persist is a projection, not a second writer from chrome.

**Tighten AD-7:** selection mutations always go store←history; name the command boundary (UI → history.execute → store.apply).

---

## Finding 4 — Command / history / store apply path and payload shape undefined

### Hole

AD-1: mutations “via commands”; store applies.  
AD-3: `history → model`; UI may depend on history.  
AD-7: coalesce rules (400 ms / pointer-up); discrete vs micro-edit.

None of these define:

- command **type inventory** or envelope (`type` + `payload`);
- whether UI calls **`history.execute`** or **`store.dispatch`** (who records undo);
- coalesce **identity** (same command type? same target field path? same Mapping triple?);
- transactional undo of **project + selection** (one stack frame vs two).

### Incompatible builds

**Unit A — Palette hex + mapping commit:**

- Envelope: `{ kind: 'palette/setHex', entryId, hex }`.
- Path: sidebar → `history.execute` → coalesce by `entryId` → `store.apply`.
- Mapping change: `{ kind: 'mapping/set', skinId, triple, paletteEntryId }` — always discrete (AD-7).
- Undo frame = project-only; selection commands are separate frames.

**Unit B — Canvas pick Object type + Skin chrome:**

- Envelope: intentional patches `{ path: 'session.selectedObjectTypeId', value }` and `{ path: 'project.skins[i]...', value }` (“commands” as JSON patches).
- Path: UI → `store.dispatch(patch)` → store notifies `history.record` after the fact.
- Coalesce: any patch to `project.palette[*].hex` within 400 ms — **by path prefix**, not by entryId.
- Undo frame = deep snapshot pair `(project, session)` every time (heavy but AD-7 “covers project + selection”).

### Clash

- Two command dialects; history cannot replay the other unit’s stack.
- Coalesce merges different gestures (A: per swatch; B: any hex path) → FR-4 behavior forks.
- On import replace-all (AD-9), Unit A clears history and leaves session; Unit B resets both — neither required by AD — so post-import sticky context differs.

### Close with

**New AD-C — Command bus:**

- Single entry: UI shells → `history.execute(Command)` only; `store.apply` is internal to model/history.
- `Command` is a closed TypeScript union owned by `model/` (list MVP kinds: palette hex, mapping set, skin CRUD, selection set, active skin, …).
- Coalesce keys defined per kind (e.g. palette hex → `entryId`).
- Import replace-all: normative side effects on history + session (recommend: clear history; keep or reset session fields per explicit table).

---

## Finding 5 — Unbound / color resolution / export gate can be reimplemented

### Hole

AD-10 defines **when** a slot is Unbound; capability map places derivation in `model/unbound`.  
AD-9: export disabled while `unboundCount > 0`.  
No AD says:

- unbound is a **pure function of (ProjectDocument)** owned solely by `model/`;
- `io/` and chrome **must call** that function (no parallel counters);
- canvas color resolve for deleted palette ids must use the **same** resolvability rule as Unbound;
- whether `unboundCount` is **project-total** or **per active skin** (AD-9 “all skins” export suggests project-total, but not stated).

### Incompatible builds

**Unit A:** `model/unbound.ts` → `countUnbound(project): number` used by sidebar unbound pane and by `io/export`. Deleted palette id ⇒ Unbound. Export checks project-total.

**Unit B:** Canvas resolves paint as `palette[id]?.hex ?? fallbackSeedGray` and treats “painted with fallback” as still visually OK. Chrome export button uses a **local** heuristic: `activeSkin` mappings every non-null ⇒ enable Export (misread of AD-9 “export target = all skins” as “gate only cares about current skin”). Still never writes raw hex into mappings (AD-4 obeyed).

### Clash

- Operator sees unbound list (A) non-zero while Export is enabled (B), or the reverse.
- Preview colors disagree with Mapping pane for deleted palette entries (AD-10 “unresolvable” vs canvas soft fallback).
- No AD violation on paper: B didn’t invent Collect inventory; didn’t put hex in mappings; formatVersion gate still fail-closed.

### Close with

**Tighten AD-10 + AD-9:**

- Single exported API: `deriveUnbound(project)`; `unboundCount` is project-total across every Skin × loaded inventory slot.
- `io/` and chrome **shall not** reimplement; canvas **shall not** substitute a paint color for unresolvable palette ids in a way that hides Unbound (recommend: explicit unbound paint token from DESIGN, not a silent gray that looks “bound”).
- Optional: AD ban on soft fallbacks for missing palette refs in MVP preview.

---

## Finding 6 (secondary) — Identity generation & Skin switch validity

### Hole

No AD on id generation (`PaletteEntry.id`, `Skin.id`), collision policy on import, or what happens to `activeSkinId` / mapping refs when a Skin or Palette entry is deleted.

### Incompatible builds

- Unit A seed: `skin-black-green`, `pal-duo-led`.  
- Unit B CRUD: `crypto.randomUUID()`.  
- Import (replace-all): A preserves ids; B renames on collision with “current session leftovers” that AD-9 never said to clear from memory before replace.

### Clash

Orphan `paletteEntryId`s and stale `activeSkinId` after CRUD/import — Unbound and sticky context fork. Lower severity than Findings 1–5 because a single diligent team might converge, but parallel epics will not.

### Close with

**AD-I — Ids:** generation rule (recommend: stable seeded slugs for v1 seed; UUID for user-created); import replace-all clears prior project **and** validates `activeSkinId` ∈ new skins (else first skin or null per AD-6 “never invent” — pick one and write it).

---

## Summary table — holes → AD actions

| # | Hole | Failure mode | Recommended AD action |
| --- | --- | --- | --- |
| 1 | Mapping / collection shape free | Clashing `ProjectDocument` | Tighten AD-4 / add AD-4a runtime shape + uniqueness |
| 2 | Inventory ER vs flat id lists | Divergent unbound math & Mapping ids | Tighten AD-4 Inventory topology |
| 3 | Session not under single-writer; prefs dual home | Two owners of sticky context / zoom | Extend AD-1 or AD-S; prefs schema + hydrate path |
| 4 | Command bus & apply order undefined | Unreplayable history; coalesce forks | New AD-C command union + execute path |
| 5 | Unbound/export/paint reimplementable | Gate vs UI vs canvas disagree | Tighten AD-9/10 single derive API |
| 6 | Id & delete/import validity | Orphans / stale activeSkinId | New AD-I ids + post-mutation session rules |

## What already holds (do not reopen without cause)

- Vanilla Vite+TS stack (AD-2), module dependency direction (AD-3), single-document packing (AD-5), UX chrome layout (AD-11), static hosting (AD-12), orchestrator-on-canvas-only (AD-13), no hex-in-mappings rule (AD-4) — these **do** constrain builders usefully. The failures are in **shared data mechanics** and **write ownership**, not in stack or chrome wireframe.

## Suggested priority to close before parallel build

1. AD-4a document shape + Inventory topology (Findings 1–2) — without this, nothing else composes.  
2. Session single-writer + prefs projection (Finding 3).  
3. Command bus (Finding 4).  
4. Unbound single derive + export count scope (Finding 5).  
5. Ids / delete / import session rules (Finding 6).
