---
title: '5-1 History Stack with Coalesced Undo/Redo'
type: 'feature'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '6b017d53aa8af56d827e558a7f2f1705c3fe4163'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-5-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Skin Studio mutates the project through direct `store.apply` calls, with inert Undo/Redo chrome and no history module — so operators cannot reverse Palette, Skin, Mapping, or Object/State selection mistakes, and rapid picker hex gestures would flood a future stack.

**Approach:** Introduce `history/` as the only UI mutation path (`execute` → `store.apply`), coalesce rapid picker/Palette hex micro-edits into one undo step at 400 ms idle or pointer-up, keep discrete commits separate, wire live top-bar Undo/Redo, and leave Zoom/pan prefs off the stack.

## Boundaries & Constraints

**Always:**
- Mutation path for UI shells: `history.execute` → `store.apply` only (AD-1, AD-3, AD-15). `history/` owns the command stack and coalesce; `model/` and `history/` must not import UI shells.
- Undo restores project JSON mutations plus Object-type / State selection (`selectedObjectTypeId`, `selectedStateId`) (FR-20). Redo reapplies until a new branch edit clears the redo stack.
- **Decision SKIN_SWITCH_UNDO = EXCLUDE:** Skin combo changes that only update `activeSkinId` must not push an undo step (non-undoable history apply, or equivalent). FR-20 stays literal — Object-type / State only.
- Rapid picker / Palette hex micro-edits coalesce at **400 ms idle or pointer-up** into one undo step (FR-4, AD-7). Discrete commits (Skin rename, Mapping Palette-id change, Skin CRUD, Palette create/rename/delete) remain separate undo steps.
- Zoom and pan stay prefs-only — never undo steps (FR-20, AD-7).
- Top-bar Undo/Redo become live (enable/disable from stack depth); Import/Export stay stubs until later Epic 5 stories.
- Boot / seed / envelope restore may call `store.apply` directly and must not push undo steps; New (seed baseline) clears the history stack.
- English UI only; single-writer store contract unchanged (clone-replace `apply`, no in-place patch of `getState()`).

**Never:**
- UI shells calling `store.apply` directly for operator edits.
- Putting Zoom/pan or Skin-only `activeSkinId` switches on the undo stack; inventing keyboard shortcuts in this story (top-bar only).
- Unbound derive/pane, Export gate, Import replace-all (stories 5-2…5-4).
- Changing envelope/prefs schema, SessionUiState keys, Mapping Palette-id-only contract, or canvas paint/pulse behaviour beyond reacting to history-driven store updates.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Discrete commit | Skin rename / Mapping id change / Skin CRUD / Palette CRUD via `execute` | One new undo step; redo cleared | N/A |
| Hex coalesce idle | Rapid picker slider/hex writes on same entry within 400 ms | Single undo step after 400 ms idle | Invalid hex ignored (existing) |
| Hex coalesce pointer-up | Slider drag ends (pointer-up) mid-burst | Open coalesce flushes to one undo step | N/A |
| Hex different entry | Switch Palette selection mid-burst then edit | Prior coalesce closes; new entry starts new step | N/A |
| Undo project | Undo after Palette/Skin/Mapping edit | Prior project snapshot restored | Empty stack → Undo disabled |
| Undo selection | Undo after Object-type / State change | Prior `selectedObjectTypeId` / `selectedStateId` restored | Empty stack → disabled |
| Redo then branch | Redo once, then new `execute` | Redo stack cleared; new branch | N/A |
| Zoom/pan | Change Zoom combo or pan canvas | Prefs update; undo stack unchanged | N/A |
| Skin switch (EXCLUDE) | Change Skin combo only (`activeSkinId`) | Session Skin updates; undo stack unchanged | N/A |
| New | Confirm New → seed baseline | Project/session seed applied; history stack empty | Cancel → no change |
| Top-bar | Undo/Redo buttons | Invoke `history.undo` / `history.redo`; disabled when empty | N/A |

</frozen-after-approval>

## Code Map

- `src/history/index.ts` — Replace stub with `execute` / `undo` / `redo` / coalesce helpers + canUndo/canRedo (or equivalent); only history calls `store.apply` for UI mutations
- `src/model/store.ts` — Keep single-writer `apply`; do not add undo logic here; history imports store
- `src/sidebar/picker-pane.ts` — Route `commitHex` through coalescing `execute` (400 ms idle + pointer-up flush); no direct `store.apply`
- `src/sidebar/palette-pane.ts`, `palette-delete-confirm.ts`, `skin-pane.ts`, `mappings-pane.ts` — Discrete `execute` for project (± session) mutations; session Object/State selection via undoable `execute`
- `src/canvas/index.ts` — Selection clicks → undoable session `execute` (Object/State); pan stays prefs
- `src/chrome/index.ts` — Live Undo/Redo buttons; Skin combo via non-undoable apply (EXCLUDE); New clears stack; Zoom stays prefs
- `src/seed/index.ts`, `src/persist/index.ts` — Keep direct `store.apply` for boot/seed/restore (no stack push)
- `scripts/history-matrix.test.mjs` (new) + wire `package.json` `test` — I/O matrix: coalesce, discrete, undo/redo branch, Zoom/pan excluded, New clears stack
- Update callers in existing matrices that assert direct UI→`apply` if they break (`palette-picker-matrix`, `chrome-shell-matrix` Undo/Redo inert → live enablement, store/skin/mappings/selection as needed)
- Do **not** change: Unbound/export/import, Mapping Palette-id paint/pulse contracts, prefs schema

## Tasks & Acceptance

**Execution:**
- [x] `src/history/index.ts` -- Implement execute/undo/redo + hex coalesce (400 ms idle / pointer-up) + stack clear API -- AD-1 / AD-7 / FR-4 / FR-20
- [x] `src/sidebar/picker-pane.ts` -- Coalesced hex path via history; pointer-up flush -- FR-4
- [x] `src/sidebar/{palette,skin,mappings}*.ts` + `src/canvas/index.ts` + `src/chrome/index.ts` -- Route operator mutations through history; live Undo/Redo; New clears stack -- AD-3 / FR-20
- [x] `scripts/history-matrix.test.mjs` (+ `package.json`) -- Cover I/O matrix; adjust chrome/palette matrices for live Undo/Redo -- edge coverage

**Acceptance Criteria:**
- Given an operator edit that mutates project or Object/State selection, when it goes through `history.execute`, then Undo restores the prior snapshot and Redo reapplies until a new branch edit clears redo.
- Given rapid picker/Palette hex micro-edits on the same entry, when idle reaches 400 ms or pointer-up fires, then those edits form a single undo step; discrete Skin/Mapping/Palette commits remain separate steps.
- Given Zoom or pan changes, when Undo is invoked, then Zoom/pan are unchanged by history; top-bar Undo/Redo reflect stack depth and invoke history.

### Review Findings

- [x] [Review][Patch] Coalesced execute must clear redo immediately; `canRedo` false mid-burst [`src/history/index.ts`]
- [x] [Review][Patch] Unsubscribe history listeners on chrome remount [`src/chrome/index.ts`]
- [x] [Review][Patch] Matrix gaps: coalesce-after-undo redo, chrome Skin EXCLUDE, picker coalesce, Skin-CRUD Skin restore, UI-driven undo [`scripts/history-matrix.test.mjs`, `scripts/palette-picker-matrix.test.mjs`]
- [x] [Review][Defer] JSON.stringify equality cost on coalesce ticks [`src/history/index.ts`] — deferred: MVP size OK
- [x] [Review][Patch] Skin delete confirm still says permanent while delete is undoable [`src/sidebar/skin-delete-confirm.ts:8`]
- [x] [Review][Patch] Net-zero coalesce burst must not destroy redo — clear redo only when flush pushes a step; keep mid-burst `canRedo` false via open coalesce [`src/history/index.ts:144`]
- [x] [Review][Patch] Assert UI-driven discrete undo for Skin rename, Palette create/rename, Mapping bind, and State select [`scripts/history-matrix.test.mjs`]
- [x] [Review][Patch] Assert orphan `activeSkinId` mount sync leaves `canUndo` false [`scripts/chrome-shell-matrix.test.mjs` / `scripts/history-matrix.test.mjs`]
- [x] [Review][Patch] Assert top-bar Undo enabled mid-coalesce before flush [`scripts/history-matrix.test.mjs`]
- [x] [Review][Defer] Unbounded undo stack / full-snapshot memory growth [`src/history/index.ts`] — deferred: MVP session length OK; revisit eviction later
- [x] [Review][Defer] Chrome `store.subscribe` readouts not disposed on remount [`src/chrome/index.ts:100`] — deferred: pre-existing remount pattern; history listeners already cleaned

#### Rejected

- `false` — Hex field needs blur flush: idle covers hex; pointer-up is for sliders
- `false` — Design Notes stale flag wording: would only edit this build’s spec
- `false` — Sprint vs spec status mismatch: expected mid-build / mid-review
- `false` — `canUndo` via open coalesce without stack depth: intentional mid-gesture Undo
- `low` rejected — No `pointercancel`: idle flush covers interrupted drag
- `false` — Spec Change Log / AC / Manual Verification / Design Notes / `review_loop_iteration` gaps: fix would only edit this build’s spec
- `low` rejected — Zoom/pan exclusion only via prefs API: chrome Zoom and canvas pan never call history
- `low` rejected — `push: false` + `coalesceKey` interaction undocumented: no caller combines them
- `low` rejected — Chrome remount history-cleanup unasserted: dispose path exists; everyday remount unlikely

## Implementation Notes

- History controller attached via `Symbol.for` on the store so separately compiled test graphs share one stack.
- Coalesce: `coalesceKey` + 400 ms idle timer; `flushCoalesce` for pointer-up; key change / discrete execute flushes prior burst.
- `push: false` for Skin-only `activeSkinId` (EXCLUDE); undo/redo restore Object/State always, `activeSkinId` only when the command itself changed it (Skin CRUD).
- UI writers routed through `history.execute`; seed/persist keep direct `store.apply`; New calls `clearHistory` after seed.
- Coverage: `scripts/history-matrix.test.mjs` wired in `package.json`; chrome matrix expects live Undo/Redo; review patches added coalesce-redo, chrome Skin EXCLUDE, picker-mounted coalesce, Skin-CRUD Skin restore, canvas UI undo.
- Review patches: mid-burst `canRedo` false via open coalesce; redo cleared only when flush pushes a step (net-zero preserves redo); chrome remount unsubscribes history listeners; Skin delete confirm no longer claims permanence; UI discrete undo + orphan EXCLUDE + mid-coalesce Undo button covered in history matrix.

## Spec Change Log

## Review Triage Log

- `high` — Coalesced `execute` never clears `redoStack` until flush; mid-burst Redo flushes then no-ops — verified at `src/history/index.ts` coalesce branch (apply + notify without `redoStack.length = 0`)
- `high` — Starting a coalesced hex burst after Undo leaves Redo enabled until flush — same defect as above
- `medium` — `subscribeHistory` in `buildHistoryButton` never unsubscribes; remount via `replaceChildren` orphans listeners — verified `src/chrome/index.ts` mount path
- `low` rejected — No `pointercancel` on sliders: idle 400 ms flush covers interrupted drag; everyday harm low
- `false` — Hex field lacks blur flush so “pointer-up or idle” half-wired: hex path is idle-only by design; pointer-up is for slider drag (I/O matrix)
- `medium` — History-matrix lacks Mapping/Palette CRUD / canvas UI discrete-path coverage — verification-gap disposition patch
- `medium` — No picker-mounted coalesce / pointer-up test — verification-gap disposition patch
- `false` — Design Notes “hex-field coalescable flag” stale: fix would only edit this build’s spec
- `false` — Sprint `in-progress` vs spec `in-review`: expected mid-build tracking, not a product defect
- `low` deferred — `JSON.stringify` equality on every coalesce tick: MVP-size fine; revisit if documents grow
- `high` — Edge: coalesced execute while redo non-empty leaves stale Redo — same as first finding
- `high` — Edge: Redo while dirty coalesce flush-clears redo then no-ops — same root cause
- `medium` — Edge: remount orphaned history listeners — same as chrome unsubscribe finding
- `high` — Edge claim: branch edit should clear redo immediately — verified coalesce path does not; same root cause
- `false` — Edge claim: `canUndo` true via open coalesce without stack depth: intentional pending burst (Undo must stay available mid-gesture)
- `medium` — VG: Chrome Skin combo EXCLUDE never asserted at chrome boundary — pre-verified; patch tests
- `medium` — VG: Picker coalesce/pointer-up not verified through picker UI — pre-verified; patch tests
- `medium` — VG: Skin-CRUD `activeSkinId` restore on undo untested — pre-verified; patch tests
- `medium` — VG: Discrete UI writers not verified to push undo via UI — pre-verified; patch thin UI-driven undo checks
- `medium` — Round-2 AA: Skin delete confirm still says “cannot be undone” while `applyDelete` uses undoable `execute` — verified `src/sidebar/skin-delete-confirm.ts`
- `medium` — Round-2 Edge: mid-burst dirty clears redo; net-zero flush pushes nothing → redo lost with unchanged document — verified `src/history/index.ts` coalesce + `flushCoalesce`
- `medium` — Round-2 VG: discrete sidebar writers still lack UI-driven undo asserts (Skin/Palette/Mapping/State) — pre-verified; prior patch only covered canvas Object-type
- `medium` — Round-2 VG: orphan `activeSkinId` mount EXCLUDE never asserts `canUndo` false — pre-verified
- `medium` — Round-2 VG+BH: mid-coalesce top-bar Undo enablement unasserted — pre-verified
- `medium` deferred — Unbounded undo stack / full snapshots: MVP OK
- `low` deferred — Chrome `store.subscribe` remount leak: pre-existing pattern outside history cleanup

## Design Notes

- **Coalesce key:** same Palette entry id + hex-field coalescable flag; any non-coalesce `execute` or entry switch flushes the open burst first.
- **SKIN_SWITCH_UNDO = EXCLUDE:** Skin combo uses a history path that applies without pushing (e.g. `execute({ …, push: false })` or dedicated `applyWithoutHistory`); orphaned `activeSkinId` sync in chrome stays non-undoable too.
- **Boot path:** `seed` / `persist` keep direct `apply` so cold restore and New seed do not invent phantom undo steps; New explicitly clears history after seed apply.
- **Keyboard:** deferred — story AC wires top-bar only.
- Golden coalesce: ten slider `input` events within 200 ms → one undo; wait 400 ms → second burst → second undo step.

## Verification

**Commands:**
- `npm test` -- expected: all matrices green, including new history matrix
- `npx tsc --noEmit` -- expected: clean (if used by other matrices’ harness)

**Manual checks:**
- Drag picker hue rapidly, Undo once → prior colour restored in one step; Zoom change then Undo → Zoom stays
