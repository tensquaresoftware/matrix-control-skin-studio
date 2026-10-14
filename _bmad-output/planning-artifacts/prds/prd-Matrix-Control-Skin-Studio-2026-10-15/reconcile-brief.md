---
title: "PRD finalize — input reconciliation (brief)"
status: draft
created: 2026-10-15
input: briefs/brief-Matrix-Control-Skin-Studio-2026-10-14
prd: prds/prd-Matrix-Control-Skin-Studio-2026-10-15
---

# Reconcile: Product Brief → PRD

Compare **INPUT** (brief + brief addendum) against **PRD** (`prd.md` + PRD `addendum.md`). Goal: surface ideas/requirements present in the brief that are missing, weakened, or qualitatively dropped in the PRD.

## Known intentional deltas (excluded — not gaps)

| Brief / prior | PRD | Status |
|---|---|---|
| Duo Header LEDs: green vs yellow **open** | Closed: Duo LED yellow `#FFCC00` as calibratable Palette entry (FR-16) | Intentional close |
| (no Unbound export policy in brief) | Hard export gate on Unbound required mappings (FR-3) | Intentional discovery choice |
| (chrome detail not fixed in brief) | Left Palette rail + narrow bottom drawer deferred (FR-10, FR-12) | Intentional defer |

## Absorbed well (no action)

- Vision poles: Figma vs live-in-plugin vs Skin Studio; final sign-off in Matrix-Control.
- Primary operator (Guillaume + in-repo BMad agents); external contributors V2 / non-MVP.
- Conceptual model: Palette → mappings/skins; Look; Orchestrator; generic widgets; Patch/Master only via Orchestrator.
- Linked loop Collect → cleanup → Skin Studio → Matrix-Control sources; JSON not auto-applied.
- MVP inventory: Palette/Skins CRUD, Figma-like mock, UI Scale set + pan/scroll as local prefs excluded from JSON, selection + states + mappings, live preview, undo/redo, autosave, JSON import/export, bootstrap Black/Cream → Black/Green & Cream/Green.
- Five v1 display names; rejected Two-tone / Split naming.
- Opaque `#RRGGBB`; true overlays out; LEDs fully-on in studio.
- Explicit outs: live plugin edit, full typography, marketing site, exhaustive SkinColourId in this doc, schema freeze before Collect, C++ refactor in this repo.
- Open questions retained: JSON packing, web stack, Collect home, object-type inventory.
- Design SSOT during calibration vs runtime SSOT after integration.
- Soon: where-used, draft/ready (brief “lock delivered vs draft”), contrast hints, side-by-side compare.
- Illustrative JSON sketch preserved (not frozen) in PRD addendum.
- Languages / separate BMad project boundary.

---

## Gaps

### G1 — Program success criterion #4 (clearer Matrix-Control skin model) not carried as a success metric

**In INPUT (brief § Success Criteria #4):**

> The follow-on Matrix-Control work leaves a clearer skin/look model (orchestrator injection, generic widgets).

**In PRD:** Orchestrator / generic widgets appear in Glossary, Constraints, Integration, and FR-15 simulation rules. Success Metrics stop at export/handoff trust (SM-1…SM-3) and tool lightness (SM-5). There is **no success metric** that the linked Matrix-Control pass actually yields the clearer model the brief treats as a program outcome.

**Nature:** Missing (as measurable / trackable success criterion). Constraints alone do not replace the brief’s “did the loop leave the model cleaner?” bar.

**Severity:** Material for finalize — either promote a secondary SM (qualitative, Guillaume-tracked) or explicitly reclassify #4 as an out-of-Skin-Studio Matrix-Control success criterion with a forward pointer.

---

### G2 — Aesthetic fidelity bar vs current Figma mock weakened

**In INPUT (brief § The Solution):**

> Aesthetic fidelity matches the current Figma mock; final sign-off is always in Matrix-Control after integration.

**In PRD:** Mock is “Figma-like… readable composition, not a pixel-perfect JUCE clone”; Figma is “aesthetic reference only” (§11); SM-C1 actively counters chasing pixel parity with JUCE.

**Nature:** Qualitative weaken. Anti–pixel-perfect-JUCE is consistent and good; the **positive** bar (“match the current Figma mock”) is no longer stated. Downstream UX could under-invest in composition fidelity that the brief treated as non-negotiable relative to the existing mock.

**Severity:** Material tone/constraint drop — restore a short fidelity sentence (match Figma mock composition/colours intent; still not JUCE pixel clone; final sign-off in plugin).

---

### G3 — Collect inventory operational detail diluted

**In INPUT (brief addendum § Collect inventory):**

Concrete Collect checklist, including:

- Shared palette (`ColourChart`, `k…` constants)
- Current skin associations (`blackVariant` / `creamVariant` on named elements)
- Runtime colour IDs (`SkinColourId`, etc.)
- Widget looks examples (background, track, text, focus border, …)
- Painted-state examples (normal, hover, focus, disabled, on/off, button-like variants, …)
- **Alpha usages:** darken/dim shortcuts → solid RGB candidates; true overlays → stay out of Skin Studio

**In PRD:** Collect is a glossary term + upstream dependency (“colours, Object types, Properties, States, Looks”). Overlays remain a Non-Goal. The **conversion rule** (alpha darken/dim → solid RGB candidates for studio) and the **named inventory anchors** (ColourChart / SkinColours / blackVariant·creamVariant / SkinColourId) are not restated in PRD or PRD addendum.

**Nature:** Weakened / detail dropped. Product rule about what enters the studio palette (solid RGB from alpha shortcuts) is easy to lose when Collect starts.

**Severity:** Material for Collect handoff — at least restore the alpha→solid RGB candidate rule and the inventory bullet list into PRD addendum (or §11), even if exhaustive IDs stay out of MVP.

---

### G4 — Problem framing: coherent family rename + escape hard-coded two-variant

**In INPUT (brief § The Problem):**

- Refine existing looks, **rename into a coherent family**, add three skins (five total).
- Clarify palette / tokens / looks / orchestration so the model can **scale beyond a hard-coded two-variant approach**.
- Without a studio, work either stalls alpha **or hardens an unclear colour model**.

**In PRD:** Why Now / Vision mention five coherent skins and a clearer colour model, but the sharper failure modes (“coherent family rename”, “beyond hard-coded two-variant”, “harden an unclear model”) are softened or implicit.

**Nature:** Qualitative drop (tone / problem urgency). Not a missing FR, but weaker product narrative for epics prioritization.

**Severity:** Minor–moderate — one short Problem/Why Now paragraph would restore intent without new scope.

---

### G5 — Tool code location note (mirror / submodule later) not carried

**In INPUT (brief addendum § Organization notes):**

> Tool code location: Dedicated repo (mirror folder or submodule later — architecture)

**In PRD:** Separate BMad project and web platform are clear; **no** open question or integration note about eventual Matrix-Control mirror folder / submodule relationship.

**Nature:** Missing organization/architecture pointer (not an MVP feature gap).

**Severity:** Minor — add to §8 or Integration/addendum so architecture does not rediscover hosting topology.

---

### G6 — Traceability: Matrix-Control read-only brief mirror path

**In INPUT (brief addendum § Source baseline absorbed):**

- Read-only mirror path in Matrix-Control:  
  `Documentation/Development/Plans/2026/10/2026-10-14-Matrix-Control-Skin-Studio-Brief.md`
- Palette context pointers: `ColourChart.h` / `SkinColours*.h` (read-only, not inventoried here)

**In PRD:** `sources` list the Skin Studio brief + `docs/…` baseline; Matrix-Control mirror path and header pointers are absent.

**Nature:** Missing documentation/traceability (overlaps G3 for ColourChart/SkinColours).

**Severity:** Minor — belongs in PRD addendum “sources / read-only mirrors” unless intentionally dropped as Skin-Studio-local only.

---

## Non-gaps / clarifications

| Topic | Notes |
|---|---|
| “Token / element” vs Property/Mapping | Brief conceptual row renamed into PRD Glossary (Property, Mapping). Functional intent preserved. |
| Object selection “click or combo” | Covered as canvas click + Sidebar control (FR-18 / FR-5). |
| `exportedAt` / `locked` in brief JSON sketch | Illustrative only; versioning and Soon draft/ready cover intent. |
| Unbound hard gate, left rail, narrow drawer, Duo `#FFCC00` | Intentional deltas — excluded above. |
| Suggested BMad chain after brief | Process note; not a PRD content obligation. |

---

## Suggested finalize actions (priority)

1. **G1** — Add secondary success metric (or explicit Matrix-Control-side outcome pointer) for clearer skin/look model after integration.
2. **G2** — Restore one sentence: aesthetic fidelity matches current Figma mock; final sign-off remains in Matrix-Control; still not a JUCE pixel clone.
3. **G3** (+ G6 pointers) — Restore Collect checklist + alpha darken/dim → solid RGB candidates into PRD addendum.
4. **G4** — Optionally tighten Why Now / problem framing (coherent family; two-variant escape).
5. **G5** — Optionally note dedicated-repo hosting + future mirror/submodule as architecture open item.
