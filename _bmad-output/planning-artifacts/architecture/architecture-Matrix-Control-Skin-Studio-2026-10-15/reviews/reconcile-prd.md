# Reconcile — Architecture Spine vs PRD

**Date:** 2026-10-15  
**Spine:** `ARCHITECTURE-SPINE.md` (draft)  
**PRD:** `prd-Matrix-Control-Skin-Studio-2026-10-15/prd.md` (final)  
**Addendum:** `…/addendum.md` (skimmed)  
**Purpose:** List what the PRD (incl. quiet / consequence-level requirements) did **not** land in the spine — distinguish **needs spine fix** vs **intentionally deferred / UX-overridden**.

---

## Method

1. Walk MVP FR-1…FR-21 + consequences; Soon FR-22…FR-28; §5–§12 + Assumptions Index.  
2. Cross-check spine AD-1…AD-13, Consistency Conventions, Capability map, Deferred table, `binds:` frontmatter.  
3. Skim addendum for transport / schema / Collect echoes that architecture must own.  
4. Flag **quiet** items: testable consequences, assumptions, and one-liners that are easy to miss when only reading FR titles.

---

## Executive split

| Bucket | Count (approx.) | Meaning |
| --- | --- | --- |
| **Landed** | Most MVP FR titles + packing/stack/Collect deferrals | Spine is broadly aligned |
| **Needs spine fix** | Quiet MVP contracts / model semantics / chrome prefs | Should be AD, convention, or capability-map line before freeze |
| **Intentionally deferred / overridden** | Soon/V2, Collect-blocked, UX chrome deltas | Do not pull into spine as MVP work; document delta where useful |

---

## 1. Needs spine fix (PRD landed incompletely)

These are **MVP** (or binding assumptions) present in the PRD that the spine does not yet govern clearly enough for implementers / epics.

### G1 — FR-5 Mapping-change pulse / highlight (quiet)

**PRD:** On Mapping change, MVP “pulses / briefly highlights the affected mock region(s) for the active Object type”; full where-used is Soon (FR-22).  
**Spine:** Capability map lists FR-5 as selection sync only (`AD-1`, `AD-6`). No pulse / highlight contract.  
**Fix:** Extend AD-6 or add a short chrome/canvas rule under AD-11 / Capability map: Mapping commit → brief canvas highlight of active Object-type region(s); where-used browse stays Deferred (FR-22).

### G2 — FR-14 Skin duplicate + delete confirm (quiet model/UX)

**PRD:** Duplicate copies Mappings into a new Skin identity; Delete always shows confirmation; cancel leaves Skin unchanged.  
**Spine:** “Skin CRUD” appears only as discrete undo commits (AD-7) and capability row FR-13…16. No duplicate semantics; no confirm-on-delete.  
**Fix:** Add under AD-4 or Consistency Conventions: `duplicateSkin` clones mappings under new `id`; delete is gated by confirm (UX copy in EXPERIENCE.md).

### G3 — FR-20 Redo / branch-on-edit (quiet)

**PRD:** Redo reapplies until a new branch edit occurs. Undo covers project JSON + Object-type/State selection; not Zoom/pan.  
**Spine:** AD-7 covers coalesced undo stack contents and Zoom/pan exclusion; **redo and branch discard** unspoken.  
**Fix:** One sentence in AD-7: command stack supports redo; any new edit after undo discards the redo branch.

### G4 — FR-11 pan via arrow keys + default Zoom `100%` (quiet)

**PRD:** Pan/scroll by click-drag **and arrow keys**; discrete scales `50%`…`200%`; **default on fresh session `100%`**.  
**Spine:** `panXY` / `zoomStep` in SessionUiState (AD-6); prefs key (AD-8); conventions say `50…200%` without enumerating seven steps or default; **no keyboard pan**.  
**Fix:** Conventions: list `50, 75, 100, 125, 150, 175, 200` + default `100%` when no prefs; AD-6 or Capability: pan = pointer drag + arrow keys.

### G5 — FR-15 / FR-17 Green bootstrap from current Black/Cream (quiet)

**PRD:** Bootstrap can seed `Black/Green` and `Cream/Green` from **current Black/Cream inventory**; Duo accents via Orchestrator zones; rejected display names not used.  
**Spine:** Seeds five display names + Duo `#FFCC00` palette entry; inventory placeholders until Collect (AD-4, AD-10). Does **not** say Green skins bootstrap from current Black/Cream colour inventory (vs empty mappings).  
**Fix:** Seed rule in AD-4 / `seed/`: when inventory/palette placeholders exist for current Black/Cream, map them into `Black/Green` and `Cream/Green`; Duo/Monochrome follow product table (zones + grey) without inventing Collect inventory.

### G6 — FR-21 export = JSON only, no companion Markdown (quiet)

**PRD:** Export is JSON only (no mandatory companion Markdown).  
**Spine:** Handoff = JSON download; never states Markdown / multi-format exclusion.  
**Fix:** One line under AD-9 or Conventions: MVP export artifact is a single `.json` file; no companion Markdown or multi-format bundles (aligns §5 non-goals).

### G7 — FR-1 live paint propagation (quiet consequence)

**PRD:** Changing a Palette entry’s hex updates every Property mapped to that id on the next preview paint.  
**Spine:** Implied by id-only mappings + FR-19 subscribe, but not stated as an invariant.  
**Fix:** Short convention or AD-1 note: Palette hex mutate → all dependent mappings re-paint via store subscription (no remapping).

### G8 — Opaque studio colour model / no LED intensity UI (quiet)

**PRD:** Opaque `#RRGGBB` only in studio; no intensity slider / dimmed LED mode (FR-7, §5, §10).  
**Spine:** Hex uppercase convention + LED fully-on in capability map; **no explicit “no alpha / no intensity control”** guard.  
**Fix:** Conventions: studio colours opaque only (reject alpha in picker/persist); canvas never exposes LED intensity controls.

### G9 — Document PRD→UX chrome override (FR-9) so reconcile stays honest

**PRD:** Top bar **segmented** Skin switcher (modes-like).  
**Spine AD-11:** **Skin combo** right-anchored; explicitly prevents regressing to PRD segmented pills (UX final).  
**Status:** Not a product bug — intentional UX override.  
**Fix:** Keep combo; add one Deferred or AD-11 note: “PRD FR-9 segmented switcher superseded by UX final combo — do not reintroduce pills.” Prevents epics from “fixing” back to PRD wording.

---

## 2. Intentionally deferred / out of spine MVP (do not “fix” into spine as work)

| Item | PRD locus | Spine status | Verdict |
| --- | --- | --- | --- |
| Definitive JSON field freeze | §8.1, §5 | Deferred + AD-4 semantic only | OK |
| Per-skin multi-file packing | §8.1, FR-21 | AD-5 MVP single doc; Deferred | OK |
| Optional Property flags | FR-3 assumption | Deferred + AD-10 all-required | OK |
| Merge import FR-28 | Soon | Deferred; MVP replace-all AD-9 | OK |
| Draft vs ready FR-26 | Soon | Deferred | OK |
| FR-22…FR-25, FR-27 | Soon | Deferred table partial (merge/draft only) | OK — optional: name FR-22…27 in Deferred for traceability |
| FR-12 narrow inspector drawer | Deferred MVP | AD-11 no bottom chrome; not named FR-12 | OK — optional Deferred row |
| Left Palette rail | FR-10 / §4.6 | AD-11 right sidebar only | OK |
| Soft Unbound export | §6.2 / addendum | Hard gate AD-9 | OK |
| Collect inventory home | §8.3 | Deferred | OK |
| MC mirror/submodule | §8.7 | AD-12 / Deferred | OK |
| Exhaustive SkinColourId / LED green confirm | §8.4–5, FR-15 | Deferred Collect | OK |
| True overlay → solid RGB candidates | §8.4, addendum Collect | Deferred | OK |
| C++ Look / Orchestrator impl | Vision / non-goals | AD-13 + Deferred | OK |
| Server / cloud / accounts | §5, §12 | AD-12 / Deferred never MVP | OK |
| UI framework revisit | §8.2 | AD-2 vanilla; Deferred | OK |
| IndexedDB | — | Deferred Assumption | OK |
| Paint-bucket accent sweeps | §8 resolved / §9 | **Absent from Deferred table** | Deferred OK — **add row for clarity** (not an MVP spine capability) |
| V2 parked chrome / contributors | §4.6 | Implicit via AD-11 / non-goals | OK |
| SM-5 / SM-6 / counter-metrics | §7 | Frontmatter binds SM-1…SM-4 only | OK — metrics not AD material |
| Chat French / artifacts English | §10 | Outside runtime spine | OK |
| Design SSOT / Figma not calibration SSOT | §11 | Product/integration, not module graph | Optional one-liner under AD-12/Integration |
| Figma aesthetic bar for mock | Vision §1 | Memlog notes “Figma-like”; spine body silent | **Borderline** — prefer UX DESIGN.md bind; optional AD-13/canvas “Figma mock aesthetic bar, not pixel-perfect JUCE” |
| Addendum `paletteColorId` sketch | addendum | Conventions prefer `paletteEntryId` | OK (conscious rename) |
| Orchestrator rules beside Skins vs MC-only | addendum | AD-13 canvas simulation only | OK |

---

## 3. FR coverage matrix (MVP)

| FR | Spine landing | Gap? |
| --- | --- | --- |
| FR-1 Palette-id-only | AD-4, conventions | Quiet paint-propagation → **G7** |
| FR-2 Sticky context | AD-6 | Landed |
| FR-3 Unbound + hard export | AD-9, AD-10 | Landed |
| FR-4 Coalesced undo | AD-7 (400 ms) | Landed (timing chosen inside PRD 300–500) |
| FR-5 Bidirectional sync | Capability map | Pulse highlight → **G1** |
| FR-6 Type-level only | AD-4 / capability | Landed |
| FR-7 LED fully-on | Capability + AD-13 | Opaque/no intensity UI → **G8** |
| FR-8 Chrome layout | AD-11 | Landed (UX-refined) |
| FR-9 Skin switcher | AD-11 combo ≠ PRD segmented | Override → **G9** (document) |
| FR-10 Right Palette only | AD-11 | Landed |
| FR-11 UI Scale + pan | AD-6, AD-8, conventions | Arrow keys + default 100% + step list → **G4** |
| FR-12 Narrow drawer | Implicit out | Intentional |
| FR-13 Palette CRUD | Capability; delete→Unbound via AD-10 | Landed enough; CRUD verbs optional |
| FR-14 Skins CRUD | Capability only | Duplicate + confirm → **G2** |
| FR-15 v1 Skin set | AD-4 names; AD-13 Duo zones | Green bootstrap from Black/Cream → **G5** |
| FR-16 Duo LED `#FFCC00` | Conventions + AD-4 | Landed |
| FR-17 Bootstrap inventory | seed/, Deferred Collect | Tied to **G5** |
| FR-18 Selection + States | AD-6, FR-5 map | Landed |
| FR-19 Live preview | Capability | Landed (see G7) |
| FR-20 Undo/redo | AD-7 | Redo/branch → **G3** |
| FR-21 Autosave I/O | AD-5, AD-8, AD-9 | No-Markdown export → **G6** |

Soon FR-22…FR-28: correctly out of MVP Capability map; only FR-26/FR-28 named in Deferred — acceptable; optional completeness pass.

---

## 4. Addendum skim — architecture-relevant

| Note | Spine | Action |
| --- | --- | --- |
| Illustrative JSON not frozen | AD-4 / Deferred | None |
| Prefer architecture field names over `paletteColorId` | Conventions → `paletteEntryId` | None |
| Soft export rejected | AD-9 hard gate | None |
| MVP import replace-all; merge = Soon | AD-9 + Deferred FR-28 | None |
| Coalesce ~300–500 ms | AD-7 400 ms | None |
| Collect: alpha/darken/dim → opaque RGB candidates | Deferred overlays row | None |
| Zone rules may live beside Skins or MC-only | AD-13 mock-only | None |
| Boring web stack | AD-2 Vite+TS+vanilla | None |

No addendum **quiet MVP** requirement missing beyond what §1 already lists.

---

## 5. Frontmatter / binds hygiene

- `binds: [FR-1…FR-21, UJ-1, UJ-2, SM-1…SM-4]` — accurate for altitude; Soon FRs correctly unbound.  
- Sources list PRD + addendum + UX — good.  
- Status `draft` — reconcile gaps above should close before treating spine as build-substrate frozen.

---

## 6. Recommended spine edit order (top)

1. **G1** FR-5 pulse/highlight  
2. **G2** Skin duplicate + delete confirm  
3. **G3** Redo / branch  
4. **G4** Zoom steps + default 100% + arrow-key pan  
5. **G5** Green bootstrap from Black/Cream  
6. **G6** JSON-only export (no Markdown)  
7. **G7–G8** Palette paint propagation + opaque / no LED intensity  
8. **G9** Document FR-9 → UX combo override  
9. Optional: Deferred rows for paint-bucket, FR-12, FR-22…FR-27 name-only  

---

## 7. What does **not** need a spine fix

- Choosing Vite/vanilla, single-document packing, fail-closed `formatVersion`, Unbound derivation from loaded inventory, SessionUiState sticky fields, prefs vs project split, Orchestrator-on-canvas-only, hosting envelope, Collect-blocked schema freeze.  
- Reverting Skin switcher to PRD segmented pills.  
- Pulling Soon/V2 into MVP architecture.
