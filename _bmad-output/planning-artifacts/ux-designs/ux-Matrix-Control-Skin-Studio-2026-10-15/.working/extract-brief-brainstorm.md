# UX extract — brief + brainstorm + FR source brief

Sources (2026-10-14): English product brief + addendum; brainstorm intent + HTML trait/morph cues; French source brief `docs/2026-10-14-Matrix-Control-Skin-Studio-Brief.md`. Faithful extraction for UX design — not a new product decision.

---

## Product job & user

**Job:** Calibrate a five-skin Matrix-Control family on a credible overall mock, bind every painted property to a **named opaque palette** entry only, and export JSON that Matrix-Control can implement without guessed hex — while clarifying palette → token → skin → orchestrator for the plugin side.

**Primary user:** Guillaume (and BMad agents in this repo) iterating skins before plugin alpha. Speed, palette discipline, and a reviewable handoff matter more than illustration power.

**Secondary (not MVP):** external design contributors shipping JSON once tokens and plugin import are stable.

**Anti-jobs (explicit):** not a second Matrix-Control / audio host; not live in-plugin editing; not a full typography or design-system editor in MVP; not a marketing site for the tool.

**Core loop (UX):** see Figma-like mock → select object type (click or combo) → pick state → map property → palette id → real-time preview → switch skins without losing place → undo/redo → autosave + file JSON import/export. Final aesthetic sign-off always happens in the real plugin after integration.

**Success (product, UX-relevant):** five v1 skins calibrated on a credible mock; mappings use named palette only; export usable by implementers; tool stays light enough not to delay alpha alone.

---

## Aesthetic / metaphor cues (Figma-like, what to avoid)

**Fidelity bar:** Match the **current Figma mock** of Matrix-Control — readable overall composition (rectangles, contours, text, Header / Body Patch&Master / Footer, recognizable widgets). Not a pixel-perfect JUCE LookAndFeel clone; no DAW/OS scaling simulation.

**Chrome metaphor (accepted MVP silhouette):** Canvas (GUI view) + **right sidebar** + **thin top bar** with segmented skin “modes” switcher. No bottom chrome; no left layers tree in MVP.

**Steal from Figma (accepted cues):** selection outline; type = component (edit once, all instances update); palette entries ≈ variables; skin ≈ mode; top modes switcher like light/dark; click-to-map.

**Steal from Photoshop / tokens / DevTools (cues, horizon-split):** constrained “eyedropper” to nearest named swatch; replace-colour remap; swatch grid with rename + usage badge; Storybook-like state bar; optional paint-bucket (palette first, then apply to properties). Named history panel and JSON/Dev Mode inspect are denser studio envy — parked.

**Avoid / reject as product hire:** Auto Layout, vectors, effects panels; true overlay / adjustment-layer simulation; free hex on the mapping path; Matrix-Control clone; comment pins (contributor V2); alias tokens in MVP (flat palette → property).

**Colour rules that shape UI:** opaque `#RRGGBB` only in studio; LEDs always preview **fully-on**; true-transparency overlays (lock film, modal dim) out of editor; Duo Patch/Master accents are **zone-orchestrated on the mock**, not frozen into generic widgets.

**FR brief sidebar blocks (structural cue):** top = scrollable palette (swatch + `k…` name + hex); center = Photoshop-like picker (hue + S/L, RGB sliders, copyable hex); bottom = skin + object type + state + property→palette combos.

**View chrome:** UI Scale `50%`…`200%` (default `100%`) + pan/scroll X-Y (scrollbars, click-drag, arrow keys when focused). Scale/pan are **local session prefs**, excluded from skin JSON export.

---

## UX ideas accepted vs parked from brainstorm

### Accepted for MVP

| Idea | Notes |
|---|---|
| Chrome **A1+B1+C1+D1+F2** | Canvas + right sidebar; top segmented skin switcher; click-to-map; unbound-count signal |
| Sticky context | Skin switch preserves object type, state, pan, zoom |
| Canvas ↔ sidebar sync | Mock click focuses mapping section; mapping change pulses affected mock regions |
| Constrained mapping picker | Commit **palette ids only**; hex only when editing a palette entry |
| Coalesced undo | Rapid picker/palette micro-drags collapse to one history step |
| Paint-bucket path | Optional accent-sweep interaction within MVP model (morph marks D2 “later” — treat as optional/light, not required chrome expansion) |
| Duo header LEDs | Baseline golden yellow `#FFCC00` as named palette entry (calibratable, not forever-frozen C++) |
| Type-level mappings only | No per-instance colour overrides |
| Export completeness cue | Unbound count; warn or gate export when unbound remain |

### Soon after MVP (accepted as horizon, not MVP exit)

- Where-used + rename refactor (flash affected mock regions)
- Side-by-side compare (E2) — Black/Green vs Cream/Green, Duo accents
- Replace-colour remap X→Y per skin; search / zoom-to-selection
- Draft vs ready lock; simple contrast hints
- Collect re-import as merge/re-map (not blind wipe)

### Parked / V2

- Layers tree; named history panel; JSON/Dev Mode inspect; comments; object×property matrix; alias tokens; contributor tooling; denser double-sidebar / bottom history chrome; keyboard-only power modes as primary chrome

### Rejected

- Auto Layout / vectors / effects; true overlays; free hex in mappings; building a Matrix-Control clone

### Open in brainstorm (chrome polish — do not expand MVP by default)

- Optional left palette rail vs right-only swatches
- Inspector drawer on narrow viewports

---

## Language / voice cues if any

| Cue | Source |
|---|---|
| Product / skin / zone names stay in English: Skin Studio, Matrix-Control, `Black/Green`, `Cream/Green`, `Black/Duo`, `Cream/Duo`, `Monochrome`, Patch, Master, Header | Brief + FR baseline |
| French for Guillaume chat and the source brief; English for BMad technical artifacts in this repo | Addendum / org notes |
| Rejected skin labels: `Two-tone`, `Split` — keep **Duo** | Brief + FR |
| Palette constants shown as `k…` + hex in UI lists | FR brief sidebar |
| Property / state names should stay stable and aligned with Matrix-Control target vocabulary | FR export notes |
| Voice of the tool (implicit): disciplined calibration console — “modes”, unbound checklist, constrained swatches — not a playful illustration app | Brainstorm keepers |

No dedicated microcopy system or tone guide in these sources.

---

## Conflicts with PRD (if any — flag only)

Checked against `prd-Matrix-Control-Skin-Studio-2026-10-15/prd.md`. Most brainstorm MVP chrome and sticky-context items are already absorbed. Flags only:

1. **Duo Header LEDs:** FR/English brief left “green vs yellow” open for calibration; brainstorm **decided** `#FFCC00`. PRD FR-16 already closed on yellow baseline — UX should not reopen as green-vs-yellow product debate; calibration of the named entry remains allowed.
2. **Left palette rail / narrow drawer:** Brainstorm listed as open PRD feed; PRD parks left rail and does not require a bottom drawer for MVP desktop. UX may propose Soon soft layout without expanding MVP chrome.
3. **Paint-bucket:** Brainstorm intent allows optional MVP path; morph matrix tags D2 “later”; PRD MVP emphasizes constrained property→swatch mapping. UX should keep paint-bucket from expanding chrome or scope silently.
4. **Where-used pulse vs full where-used:** Brief/FR put “where used” in soon-after; brainstorm MVP mentions bidirectional pulse; PRD splits MVP pulse vs Soon full where-used — consistent if UX does not promote full browse into MVP.
5. **Import wipe vs merge:** Brainstorm/PRD Soon = merge/re-map; PRD notes MVP import may be replace-all — UX should surface destructive import clearly if MVP ships replace-all.

No other hard UX conflict with current PRD scope found in these sources.

---

## Fresh angles UX could propose without reopening PRD scope

These stay inside MVP chrome and decided constraints (canvas + right sidebar + thin top bar; named-palette mappings; sticky context; Figma-like fidelity):

1. **Unbound-first calibration path** — start from unbound count / checklist jump-to-mock, then map (brainstorm reverse keeper), without adding panels.
2. **Context strip density** — skin mode + object type chip + state control as one readable band (SCAMPER “bande contexte”) inside existing chrome.
3. **Coalesced undo affordance** — make history feel trustworthy after chaotic palette exploration (job ticket) without a named history panel.
4. **Paint-bucket as mode, not panel** — palette-first apply for Duo/Monochrome accent sweeps without layers/matrix chrome.
5. **Selection ↔ mapping pulse choreography** — timing, highlight language, and scroll-into-view so bidirectional sync feels instantaneous on sticky skin switch.
6. **Sidebar information hierarchy** — reduce cognitive overload (known fail mode): palette / picker / mappings stacking and progressive disclosure within the right column only.
7. **Export readiness copy** — warn vs soft-block when unbound remain; keep JSON-only export; no schema freeze.
8. **Soon-ready hooks without Soon UI** — e.g. subtle “usage” badge placeholders or contrast-adjacent layout that can grow into where-used / contrast hints later without MVP feature delivery.
9. **Narrow-viewport soft layout (Soon note)** — inspector drawer proposal as non-MVP desktop exit criterion, per PRD PM note.
10. **Duplicate-skin accent remap assistant** — interaction pattern for deriving Duo/Monochrome from Green bases, still using type-level mappings and palette ids only.

Do **not** reopen: live plugin editing, typography system, overlays, contributor V2, layers tree, Auto Layout, free hex mappings, or JSON schema freeze before Collect inventory.
