# Rubric Walker Review — Architecture Spine Finalize Gate

**Artifact:** `ARCHITECTURE-SPINE.md`  
**Altitude:** initiative / build-substrate  
**Reviewed:** 2026-10-15  
**Checklist:** good-spine (divergence coverage, enforceable AD Rules, Deferred safety, verified tech, dimension completeness, no placeholders, mermaid + minimal seed)

---

## Verdict

**pass-with-fixes**

The spine is strong for initiative altitude: clear paradigm, enforceable AD Rules on the main divergence axes (single-writer store, stack, dependency direction, packing, session sticky context, undo, persist split, import/export gate, unbound derivation, UX chrome, hosting, orchestrator-on-canvas), valid mermaid, minimal structural seed, and Deferred items mostly gated with revisit criteria. It is not yet finalize-clean: a few ownership gaps can still let two units diverge unsafely, and at least one dimension this altitude owns is neither decided nor explicitly deferred/open.

---

## Checklist scorecard

| Criterion | Result | Notes |
| --- | --- | --- |
| Fixes real divergence points; misses none of importance | **Partial** | Core product divergences covered; restore-scope of session vs prefs, New-project semantics, and seed-inventory shape still open enough to diverge |
| Every AD Rule enforceable and prevents stated divergence | **Mostly pass** | AD-1…AD-13 rules are concrete; AD-4 / AD-10 leave inventory content ambiguous relative to “do not invent Collect inventory” |
| Nothing under Deferred could let two units diverge unsafely | **Partial** | Most Deferred rows are safe; seed “inventory placeholders” + deferred Collect inventory home can still fork MVP fixtures |
| Named tech verified-current (or flagged) | **Pass** | Vite `8.3.4`, TypeScript `7.0.2` dated npm check 2026-10-15; ASSUMPTION tags used where appropriate |
| Every owned dimension decided / deferred / open — esp. ops | **Partial** | AD-12 hosting envelope decided; verification/test approach neither decided nor deferred; session restore incomplete |
| No template comments or placeholders | **Pass** | No `TODO` / `TBD` / template tokens; “placeholders until Collect” is intentional domain language, not a template hole |
| Diagrams valid mermaid; seed minimal | **Pass** | Four mermaid blocks parse as valid flowchart/erDiagram; seed stops at module folders |

---

## Findings (by severity)

### 1. High — Session restore scope vs prefs split is incomplete

**Where:** AD-6, AD-8, paradigm diagram (`Persist --> SessionUiState`)

AD-8 decides prefs keys for Zoom, pan, and sidebar pane heights, and that reopen restores the last project. It does **not** decide whether `activeSkinId`, `selectedObjectTypeId`, or `selectedStateId` survive reopen (or live only in memory).

**Divergence risk:** One unit restores sticky context from prefs / project JSON; another always reseeds selection/Skin on load. That breaks FR-2 sticky-context intent across sessions and contradicts the Persist→SessionUiState edge in the paradigm diagram without a matching rule.

**Fix:** Explicitly decide (or Deferred + revisit): which `SessionUiState` fields persist under `skin-studio:prefs`, which reset on load, and that none enter export JSON.

---

### 2. High — Seed inventory placeholders vs AD-10 “do not invent” can fork MVP truth

**Where:** AD-4 table (“placeholders until Collect”), AD-10, Deferred “Collect inventory home”, `seed/` in Structural Seed

AD-10 correctly forbids inventing Collect inventory as product truth and binds Unbound to the **loaded** inventory. MVP still needs *some* loaded inventory for Unbound/export to be exercisable. Deferred only discusses where Collect inventory *lives* later, not what seed may ship now.

**Divergence risk:** Two implementers invent different ObjectType/State/Property fixtures (or one ships empty inventory and another ships a rich fake). Unbound counts, export gate behavior, and story acceptance diverge while both claim compliance with AD-10.

**Fix:** Add an enforceable seed rule, e.g. minimal labeled fixture (non-Collect, versioned/marked interim), empty inventory until Collect bootstrap, or a single checked-in interim inventory path with ownership — and move “interim inventory content” out of silent ambiguity into Decided or Deferred with revisit.

---

### 3. Medium — `New` / first-open reset semantics undecided

**Where:** AD-8 (first open seeds), AD-11 (top bar includes `[New]`), Capability map FR-13…16 / FR-21

First open with no project seeds v1 skins + base palette. Behavior of **New** (confirm? wipe project only? wipe prefs? re-run seed inventory?) is not stated.

**Divergence risk:** Chrome “New” vs persist bootstrap vs seed module disagree on what a clean slate is — especially inventory placeholders and active Skin.

**Fix:** One AD Rule or Consistency row: New = replace `ProjectDocument` with seed (after confirm), prefs policy, and whether SessionUiState resets.

---

### 4. Medium — Verification / test dimension neither decided nor deferred

**Where:** Document-wide (Stack, Deferred, Consistency Conventions)

Ops/deployment envelope is owned and decided (AD-12). At this altitude, how units prove store/unbound/io invariants (manual only vs lightweight unit tests vs none until later) is a dimension teams below will invent if silent.

**Divergence risk:** One epic adds a test harness and CI expectations; another ships UI-only with no shared verification story — weak for a build-substrate spine, though less acute than data-model forks.

**Fix:** Decide minimal stance (e.g. “no automated test harness in MVP; manual AC only”) **or** Deferred with revisit criterion — do not leave unnamed.

---

### 5. Low — Structural seed vs capability map path for session

**Where:** Capability map (`model/session`), Structural Seed (`model/` comment omits SessionUiState)

Session lives conceptually in AD-6 / paradigm but seed folder comment lists ProjectDocument, types, store, unbound only. Capability map invents `model/session`.

**Divergence risk:** Mild folder/module naming drift (session colocated in store vs `model/session.ts` vs top-level). Not unsafe if AD-1/AD-6 hold, but easy to clean.

**Fix:** Align seed comment and capability map to one path; ensure SessionUiState is named under `model/` (or wherever decided).

---

### 6. Low — Initial `formatVersion` value not pinned

**Where:** AD-9, AD-4 (`formatVersion` required)

Integer required; fail-closed on unknown/newer is good. Starting value for seed/export (e.g. `1`) is not stated.

**Divergence risk:** Seed writes `1`, io tests expect `0`, or stories disagree on first bump — small but real.

**Fix:** Pin MVP `formatVersion = 1` (or equivalent) in AD-9 / conventions.

---

## AD Rule enforceability pass

| AD | Prevents stated divergence? | Enforceable? |
| --- | --- | --- |
| AD-1 | Yes — dual project copies / in-place UI patches | Yes — module ownership + review |
| AD-2 | Yes — framework churn | Yes — package + ban list; versions dated |
| AD-3 | Yes — UI owning persist/schema; cycles | Yes — import direction; diagram matches rule |
| AD-4 | Mostly — Collect-as-truth / free hex on Mapping | Partial — entity semantics strong; inventory *content* weak until Finding 2 fixed |
| AD-5 | Yes — mixed packing strategies | Yes |
| AD-6 | Yes — Skin switch resetting context unevenly | Yes for in-session; restore gap = Finding 1 |
| AD-7 | Yes — undo flood / zoom-pan on stack | Yes — 400 ms / pointer-up / exclusions |
| AD-8 | Yes — prefs leaking into handoff JSON | Yes for keys; incomplete session list = Finding 1 |
| AD-9 | Yes — soft export / silent partial import | Yes |
| AD-10 | Yes — fake Collect inventory as completion cheat | Undermined by unspecified seed fixtures = Finding 2 |
| AD-11 | Yes — PRD mode pills / layers / bottom chrome | Yes — against UX final |
| AD-12 | Yes — cloud/plugin/MC submodule as MVP blockers | Yes — static SPA envelope |
| AD-13 | Yes — Patch/Master baked into inventory types | Yes — canvas-only simulation |

Status tags (`[ADOPTED]` / `[ASSUMPTION]`) are inconsistent (AD-3, AD-4, AD-5, AD-12 unlabeled) but not a finalize blocker.

---

## Deferred safety pass

| Deferred item | Unsafe if left deferred? |
| --- | --- |
| Definitive JSON field freeze | No — AD-4 semantics + prefer `paletteEntryId` bind implementers |
| Per-skin multi-file packing | No — AD-5 locks single document |
| Optional Property flags | No — AD-10 all-required until Collect |
| IndexedDB | No — localStorage assumed; flagged ASSUMPTION |
| Merge import / draft-ready export | No — AD-9 replace-all + unbound gate |
| Collect inventory home | **Yes if seed content also unset** — see Finding 2 |
| MC mirror / C++ Look / SkinColourId / overlay RGB | No for MVP runtime — Collect/MC gated |
| UI framework revisit / server | No — AD-2 / AD-12 lock MVP |

---

## Tech currency

- Vite `8.3.4` and TypeScript `7.0.2` stated with npm verification date `2026-10-15`.
- Platform “evergreen” browsers is acceptable at initiative altitude.
- No other pinned libraries. Meets “verified-current (or flagged)” for named tech in this file alone.

---

## Dimension completeness (this altitude)

| Dimension | Status in spine |
| --- | --- |
| Paradigm / write path | Decided |
| Module boundaries / deps | Decided |
| App data model (semantics) | Decided; schema freeze Deferred |
| Persistence / prefs | Decided with restore gap |
| Import/export gate | Decided |
| Undo policy | Decided (ASSUMPTION on coalesce timing) |
| UX chrome contracts | Decided |
| Hosting / ops envelope | Decided (AD-12) |
| Interim inventory for MVP | **Implicit / unsafe** |
| Verification / tests | **Missing** (not decided, deferred, or open) |
| Open Questions section | Absent — fine only if nothing remains open; Findings 1–4 show remainder |

---

## Mermaid & seed

- Diagrams: paradigm flowchart, dependency flowchart, erDiagram, hosting flowchart — syntax valid; labels readable; no broken edges observed.
- Seed: root config + `src/` module folders only — appropriately minimal; no over-specified file trees inside modules.
- Minor: paradigm shows `Persist --> SessionUiState` without AD text listing which session fields persist (ties to Finding 1).

---

## Template / placeholder hygiene

- Frontmatter `status: draft` is workflow state, not a template hole.
- No `TODO`, `FIXME`, `TBD`, `{{…}}`, or “fill in later” authoring comments.
- Pass.

---

## Required fixes before finalize

1. Decide SessionUiState persist/restore field list (and keep export exclusion).
2. Decide interim seed inventory rule so AD-10 and `seed/` cannot fork.
3. Decide `New` (+ confirm) relative to seed/persist/session.
4. Decide or Deferred the verification/test stance.
5. (Recommended) Pin `formatVersion` initial value; align `model/session` naming in seed vs capability map.

---

## What already meets the bar

- Document-centric single-writer paradigm with clear Project vs Session vs History split.
- AD-5 / AD-8 / AD-9 packing and handoff gates are crisp and enforceable.
- AD-11 binds UX final chrome (not PRD-era Skin mode pills).
- AD-12 closes ops/deployment envelope for MVP without cloud/plugin false dependencies.
- Capability → Architecture map ties FRs to modules and ADs.
- Deferred table generally includes “why wait” + “revisit when”.

---

## Rubric walker conclusion

Solid initiative spine; finalize after closing the session-restore, seed-inventory, New, and verification gaps. Do not treat current Deferred Collect rows as covering interim MVP inventory content.
