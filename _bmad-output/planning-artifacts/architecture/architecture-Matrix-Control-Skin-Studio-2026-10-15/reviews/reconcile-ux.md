---
name: reconcile-ux
status: complete
date: '2026-10-15'
spine: ARCHITECTURE-SPINE.md
ux:
  - EXPERIENCE.md (final)
  - DESIGN.md (final)
purpose: List UX contracts that did not land in the architecture spine; separate spine-fix gaps from intentionally out-of-altitude detail
---

# Reconcile — Architecture spine vs UX final spines

## Method

Compared `ARCHITECTURE-SPINE.md` (draft) against UX final `EXPERIENCE.md` + `DESIGN.md`. A contract **lands** when an AD, Consistency Convention, Structural Seed, Capability map row, or Deferred row binds the same rule so independent builders cannot diverge. A mere capability-map pointer without a rule does **not** count as landed.

Altitude filter: initiative spine must bind **behavior / ownership / gates / module contracts**. Pixel tokens, typography faces, mock HTML, exact microcopy strings, and a11y reading-order assumptions may stay referenced to UX files without restating.

## Verdict

Chrome shell shape, sticky context, Unbound export gate, import fail-closed, packing, stack, and store paradigm **largely land**. Several **behavioral UX contracts** that builders need (sidebar IA tabs, canvas↔sidebar sync, pulse, destructive confirms, LED fully-on, unbound jump) are **thin or missing** — spine-fix candidates. Most DESIGN visual detail and EXPERIENCE microcopy tables are correctly **out of altitude** via AD-11 references.

---

## Landed (aligned — no fix required)

| UX contract | Where it lands |
| --- | --- |
| Document-centric single-writer; SessionUiState ≠ export | Design Paradigm, AD-1, AD-6 |
| Palette-id-only mappings; opaque `#RRGGBB`; no free hex on Mapping | AD-4, Consistency Conventions |
| v1 seed skin display names; Duo LED `#FFCC00` as Palette entry | AD-4, conventions |
| Sticky context on Skin switch; never invent empty selection | AD-6 |
| Context strip = readout of SessionUiState | AD-6; Structural Seed `chrome/` |
| Top bar order; Skin combo right-anchored; Zoom label; no mode pills | AD-11 |
| Sidebar four panes; picker fixed; panes 2–4 splitters | AD-11; Structural Seed `sidebar/` |
| No layers tree; no bottom chrome MVP | AD-11 |
| English chrome; tokens from DESIGN.md | AD-11 |
| Hard Unbound export gate; unbound derivation from loaded inventory | AD-9, AD-10 |
| `formatVersion` fail-closed; MVP replace-all after confirm | AD-9 |
| Export target = all skins (MVP) | AD-9 |
| Autosave project vs prefs split; prefs never in export | AD-8 |
| First open → seed v1 skins + base palette | AD-8 |
| Coalesced undo ~400 ms (within UX 300–500 band); Zoom/pan never undo | AD-7 |
| Discrete Zoom steps `50…200%` | Consistency Conventions |
| Orchestrator Patch/Master on canvas only; generic Object types | AD-13 |
| Hosting = static SPA; no plugin embed / cloud MVP | AD-12 |
| JSON packing one project document (UX left to Architecture) | AD-5 |
| Stack vanilla Vite+TS (UX left to Architecture) | AD-2 |
| Merge import / draft-ready / Collect inventory / MC mirror | Deferred (matches UX Horizon / Open for architecture) |
| True overlay → solid RGB candidates = Collect | Deferred |

---

## Did NOT land — needs spine fix

These are **binding UX behavioral contracts** at initiative altitude. Independent builders can diverge today.

### G1 — Sidebar pane 3 IA variant A (locked)

- **UX:** Segmented `[Mappings | Skin]`; Mappings default; Object type + State always visible on Mappings; Skin tab = Rename / Duplicate / Delete only; type-level reminder OK.
- **Spine:** AD-11 says `mappings/skin` pane only — no segmented control, no tab duties.
- **Fix:** Extend AD-11 (or AD-14) with locked IA A + Skin-tab CRUD-only.

### G2 — Canvas ↔ Sidebar sync (FR-5)

- **UX:** Canvas click → select Object type + scroll/highlight Mapping row; **State unchanged**. Sidebar Object type → outline mock region when present. Changing State refreshes Property mappings + mock paint.
- **Spine:** Capability map points FR-5 at AD-1/AD-6; those ADs do not state sync rules.
- **Fix:** Explicit sync rules (new AD or AD-6 expansion) owned by session + canvas/sidebar.

### G3 — Pulse highlight on Mapping change

- **UX:** Discrete outline pulse 1–2× ~400 ms, chrome `{colors.pulse-outline}`; preview paints immediately.
- **Spine:** FR-19 live preview only; no pulse contract; no `canvas/` cue ownership.
- **Fix:** Bind pulse as canvas feedback on mapping commands (timing may stay `[ASSUMPTION]` matching DESIGN).

### G4 — Destructive confirm contracts

- **UX:** Delete Skin always confirm; Delete referenced Palette id confirm **first** listing *n* mappings → Unbound then apply (no silent hex substitute); Import replace-all strong confirm. Microcopy table in EXPERIENCE.
- **Spine:** AD-9 mentions import “strong confirm” only. No Skin/Palette delete confirm or “list then unbind” rule.
- **Fix:** AD on destructive commands (model mutations gated by confirm UX); microcopy remains EXPERIENCE reference.

### G5 — Unbound list navigation

- **UX:** Unbound pane always on; clickable row jumps to Object type + Mapping row [ASSUMPTION also sets State if encoded].
- **Spine:** Unbound derivation + export gate only; no jump/focus path.
- **Fix:** Session command: unbound row → selection + sidebar focus (State rule as assumption or deferred encode).

### G6 — LED fully-on preview

- **UX:** LED preview always fully-on Palette colour; no intensity/dim slider.
- **Spine:** Capability map FR-7 → AD-13 + conventions; neither states fully-on. Duo `#FFCC00` seeding ≠ LED intensity rule.
- **Fix:** Convention or AD-13 bullet: LED paint = full Palette hex; no dim/intensity UI in MVP.

### G7 — Type-level mappings only (no per-instance)

- **UX:** Type-level only; banned per-instance overrides; Skin tab may remind.
- **Spine:** AD-4 ER is type-shaped but never bans instance overrides.
- **Fix:** Explicit AD-4 rule: no per-instance mapping entity in MVP model.

### G8 — Absent MVP chrome / interaction bans (incomplete vs UX)

- **UX bans:** left layers tree, bottom chrome, left Palette rail, Auto Layout, true overlay editing, named history panel, JSON Dev Mode, side-by-side compare, free hex on Mapping, soft Export.
- **Spine AD-11:** only “No layers tree; no bottom chrome.” Soft export / free hex covered elsewhere. Missing: left Palette rail, Auto Layout, true overlay editing UI, named history, Dev Mode, compare (Soon/V2).
- **Fix:** Expand AD-11 absent list to match EXPERIENCE Interaction Primitives / Absent in MVP (Soon/V2 can stay Deferred).

### G9 — `New` project semantics

- **UX:** Top bar includes `New`; first-open seed when no project; not a blocking wizard.
- **Spine:** `New` in chrome order; no command meaning (wipe+seed? confirm? empty project?).
- **Fix:** Bind `New` = confirm → replace with seeded v1 project (or chosen empty+seed policy) `[ASSUMPTION]` aligned to first-open.

### G10 — Picker idle / selection gate

- **UX:** No Palette entry selected → picker shows last/idle wells but **does not commit hex** until a Palette row is selected.
- **Spine:** Coalesce assumes picker edits; no idle/no-selection gate.
- **Fix:** Model/command rule: hex commits require `selectedPaletteEntryId` in session.

### G11 — Orchestrator zone rules storage (UX → Architecture open)

- **UX Open for architecture:** “Orchestrator zone rules storage.”
- **Spine:** AD-13 = canvas simulation only; no decision whether zones are code constants, seed JSON, or later MC artifact.
- **Fix:** Short AD or Deferred row: MVP zones = canvas/seed constants (not inventory); revisit when MC Look wiring starts.

### G12 — Pan interaction primitives (thin)

- **UX:** Pan = click-drag on GUI view; arrow keys when canvas focused. Zoom = discrete combo only.
- **Spine:** Session holds `panXY` / `zoomStep`; Structural Seed mentions pan/zoom; no input primitive bind.
- **Fix:** One convention line under canvas ownership (optional if G2 batch absorbs it).

---

## Intentionally out of altitude (do **not** dump into spine)

Keep as AD-11 / EXPERIENCE / DESIGN references. Restating would bloat initiative spine without changing module ownership.

| Topic | Why out |
| --- | --- |
| Exact English microcopy table (`{n} unbound`, export tooltips, import/delete strings) | AD-11 already points at EXPERIENCE.md |
| DESIGN color/typography/spacing/rounded token values; IBM Plex faces | AD-11 + `styles/` seed; tokens may shift without product reopen |
| Component visual anatomy (swatch 20px, modal scrim rgba, export opacity 0.55) | DESIGN Components |
| Empty Object/State glyph (`—`) | DESIGN `[ASSUMPTION]` presentation |
| Picker fixed height ≈ 200–240px; sidebar default 320px | DESIGN spacing `[ASSUMPTION]` |
| Pulse easing / outline width px | DESIGN `{components.pulse-highlight}` |
| Focus ring color; exact tab reading order; disabled Export tab-order pick | Accessibility Floor — implement from DESIGN/EXPERIENCE |
| Canonical mock HTML / ASCII sims | Visual references, not architecture |
| Aesthetic bar “not pixel-perfect JUCE”; Figma composition intent | Product/UX fidelity — AD-13 + canvas module enough |
| Soon FR-22…28 / V2 parked lists | Already Deferred / Horizon; not MVP spine gaps |
| Contrast advisories (FR-27) | Soon |
| Soft narrow layout (FR-12 NOTE) | Soon intent only |
| Exact coalesce ms within 300–500 | Spine fixed 400 ms — **resolved**, not a gap |
| Final JSON field names; Collect inventory; packing revisit | Explicitly Deferred / Open for Collect |
| Web stack choice | Settled AD-2 |
| Hosting mirror/submodule into MC | Deferred AD-12 companion |

---

## Partial / reference-only (watch, not blockers)

| Topic | Note |
| --- | --- |
| Skin combo scales to 15–20 skins | Implied by combo vs pills; optional one-liner under AD-11 |
| Mapping Unbound marker label `Unbound` | Covered by EXPERIENCE microcopy reference |
| Export disabled visual vs behavior | Behavior in AD-9; visuals DESIGN |
| History graph: canvas ↛ history | OK if canvas only emits commands; ensure selection from canvas is undoable via same stack as AD-7 |
| Prefs omit Object/State/Skin selection on cold reopen | UX sticky is Skin-switch session rule; cold reopen restores project — acceptable unless product later requires last selection |

---

## Suggested spine edit order (if fixing)

1. **G2 + G5 + G12** — session/sync/navigation (one AD)
2. **G1 + G8** — AD-11 chrome/IA expansion
3. **G4 + G9 + G10** — command gates (New, delete confirms, picker selection)
4. **G3 + G6** — canvas feedback (pulse, LED fully-on)
5. **G7** — AD-4 one-liner type-level only
6. **G11** — Deferred or short AD on zone storage

---

## Sources checked

- `_bmad-output/planning-artifacts/architecture/architecture-Matrix-Control-Skin-Studio-2026-10-15/ARCHITECTURE-SPINE.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-Matrix-Control-Skin-Studio-2026-10-15/EXPERIENCE.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-Matrix-Control-Skin-Studio-2026-10-15/DESIGN.md`
- `.memlog.md` (decision trail; does not substitute missing AD text)
