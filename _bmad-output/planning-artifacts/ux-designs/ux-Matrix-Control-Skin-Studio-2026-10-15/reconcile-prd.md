---
title: "UX finalize — input reconciliation (PRD)"
status: draft
created: 2026-10-15
input: .working/extract-prd.md (+ peeks at prds/prd-Matrix-Control-Skin-Studio-2026-10-15/prd.md)
against: DESIGN.md + EXPERIENCE.md
---

# Reconcile: PRD → UX spines

Compare **INPUT** (PRD UX extract + FR-9 / Glossary peeks in `prd.md`) against **current** `DESIGN.md` + `EXPERIENCE.md`. Goal: confirm locked PRD scope is carried, name intentional UX presentation deltas, and list any qualitative drops. **Do not reopen locked PRD product scope.**

---

## Absorbed ideas

Locked product / interaction contracts carried into the spines:

- Internal single-operator desktop browser editor; not a Matrix-Control host; end users never open Skin Studio; external contributors = V2 / horizon.
- Aesthetic bar: Figma-like GUI view matching current Matrix-Control mock composition; not a JUCE pixel clone; final sign-off in the real plugin.
- Colour discipline: opaque `#RRGGBB`; hex only on Palette entries; Mappings bind Palette ids only; type-level only; LED preview fully-on; true overlays out; no Auto Layout / vectors / effects; colour-first (no typography/DS editor).
- Hard Unbound export gate (option B): Export disabled while required Unbound remain; soft warn-and-allow rejected for MVP.
- Duo LED yellow closed: named Palette entry baseline `#FFCC00` (calibratable); Patch/Master Duo accents via Orchestrator zones on the mock.
- Chrome silhouette: GUI view + right Sidebar + thin Top bar; no left layers tree, no bottom chrome, no left Palette rail in MVP.
- Sticky context (FR-2): on Skin switch preserve Object type, State, pan/zoom; do not invent a selection.
- Canvas ↔ Sidebar sync + Mapping-change pulse (FR-5): canvas selects Object type and focuses Mapping row without resetting State; pulse is mandatory discrete outline (exact motion filled by UX).
- Coalesced undo (FR-4 / FR-20): micro-gestures coalesce; Zoom/pan excluded from undo; discrete commits stay separate.
- UI Scale discrete set `50%`…`200%` (default `100%`) as local pref, never in JSON — chrome label **Zoom**.
- Pan: click-drag + arrow keys when canvas focused.
- Real-time preview; Autosave; JSON-only import/export; fail-closed on unknown/newer `formatVersion`.
- Palette + Skin CRUD; Delete Skin always confirms; v1 display names exactly as FR-15; rejected `Two-tone` / `Split`.
- Soon FR-22…FR-28 and V2/parked lists mirrored as intent-only Horizon.
- Open architecture/Collect table left undecided (inventory, packing, stack, hosting, Orchestrator storage, etc.).
- UX invent gaps from the extract filled in spines: microcopy table, sidebar IA (four panes + `[Mappings | Skin]`), Unbound pane pattern, Export disabled styling, pulse tokens, context strip, first-open / import ASSUMPTIONs.

---

## Intentional UX deltas

Presentation / IA choices inside PRD consequences — **not** scope reopens.

| PRD / extract | UX spines | Why intentional |
|---|---|---|
| FR-9 / Glossary: **segmented** Skin switcher (modes-like) | Top-bar **Skin combo/dropdown**, right-anchored above sidebar; scrollable menu | Five names today; **15–20 skins** with future contributors — horizontal mode pills break. Consequences preserved: switch without leaving GUI view; sticky context still applies. |
| Glossary term **UI Scale** | Chrome label **Zoom**; same discrete steps | Operator-facing brevity; PRD step set unchanged; still local pref / not in JSON. |
| Sidebar order unspecified; FR-10 “Palette, picker, Skin/Object/State, Mappings” | Photoshop-like stack: **Picker fixed top** → Palette → Object/State/Mappings → **Unbound** | Wave-2 Q&A + density: constrained picker above swatches; Unbound always visible (FR-3 “enough detail”). |
| FR-3: Export disabled **or** rejected with reason | **Disabled** Export control + permanent Unbound pane (no soft click path) | Stronger, clearer gate UX; still FR-3. |
| FR-3: count + locate detail (pattern open) | Always-visible **4th sidebar pane**: count badge + clickable list | Permanent affordance over tooltip/modal-only. |
| FR-5 pulse required; motion open | Outline pulse **1–2× ~400ms**, chrome accent `{colors.pulse-outline}` | Fills invent gap without new Palette colour. |
| FR-13: delete referenced Palette → Mappings Unbound | Confirm **first** listing *n* mappings that will become Unbound, then apply | Safer than silent apply; no hex substitute. |
| §8.6 MVP import may be replace-all | ASSUMPTION: replace-all after strong confirm; merge = Soon FR-28 | Closes invent gap without inventing merge UI in MVP. |
| First-run / empty project unspecified | ASSUMPTION: seed v1 skins + base palette when no prior project; else reopen last | Figma-like reopen; no blocking wizard. |
| Context strip absent from PRD | Readout band: `Object · State · Zoom · Skin` under top bar | Sticky context visibility without second editors. |
| Pane 3 IA open | Locked variant A: segmented `[Mappings \| Skin]` | Skin CRUD on Skin tab; Object/State always on Mappings. |

---

## Dropped qualitative ideas

None that reopen or weaken locked PRD MVP requirements. Residual items are either already **Soon/V2**, still **ASSUMPTION**, or correctly left to architecture/Collect:

| Idea | Source cue | Treatment in spines | Drop? |
|---|---|---|---|
| Multi-Skin export-target picker if packing allows subsets | Extract invent #6 | Not designed — packing open | Deferred with packing (not a UX drop of a locked FR) |
| FR-26 Ready export policy detail | Extract invent #10 | Horizon only | Correct defer |
| Paint-bucket accent sweeps | PRD Soon / trivial escape | Horizon Soon | Intentional (PRD-aligned) |
| Soft narrow inspector drawer | FR-12 NOTE | Horizon intent sentence only — no layout sketch | Soft defer of optional Soon chrome |
| Contrast advisories UI | FR-27 | Horizon | Correct defer |
| Where-used flash visual language | FR-22 | Horizon; MVP pulse is the related cue | Correct defer |

**Qualitative drop count for this slug: 0** (no PRD-locked idea silently omitted).

---

## No reopen

Do not reopen from this reconcile: hard Unbound gate, Duo `#FFCC00`, overlays/Auto Layout outs, left rail / layers / bottom chrome, type-level-only, LED fully-on, JSON-only export, Collect inventory inventing, contributor V2, soft export, JUCE pixel parity chase.
