---
title: "UX finalize — input reconciliation (brief)"
status: draft
created: 2026-10-15
input: .working/extract-brief-brainstorm.md (brief sections) + brief path cited in EXPERIENCE sources
against: DESIGN.md + EXPERIENCE.md
---

# Reconcile: Brief → UX spines

Compare **INPUT** (brief / FR-source-brief portions of `extract-brief-brainstorm.md`) against **current** `DESIGN.md` + `EXPERIENCE.md`. Goal: confirm product job and aesthetic cues are absorbed, name intentional UX deltas vs brief chrome sketches, and list qualitative drops worth noting. **Do not reopen locked PRD scope** (PRD already absorbed the brief with intentional closes).

---

## Absorbed ideas

- Job: calibrate five-skin Matrix-Control family on a credible mock; bind painted properties to named opaque Palette only; export JSON for implementers; clarify palette → token → skin → orchestrator for the plugin side.
- Primary user Guillaume (+ in-repo agents); secondary external contributors = not MVP.
- Anti-jobs: not second Matrix-Control host; not live in-plugin editing; not full typography/DS editor; not a marketing shell for the tool.
- Core loop: Figma-like mock → Object type → State → Property → Palette id → real-time preview → Skin switch without losing place → undo/redo → autosave + JSON import/export; final aesthetic sign-off in the real plugin.
- Fidelity: match **current Figma mock** composition (Header / Body Patch&Master / Footer, recognizable widgets); not JUCE LookAndFeel clone; no DAW/OS scaling simulation.
- Chrome silhouette cue: canvas + right sidebar + thin top bar; no bottom chrome; no left layers tree in MVP.
- Figma steal cues: selection outline; type = edit once for all instances; palette ≈ variables; skin ≈ mode; click-to-map; reopen last file.
- Photoshop / density cues: constrained picker above swatches; stacked inspector panes (realized as four resizable sidebar panes).
- Colour rules: opaque `#RRGGBB`; LEDs fully-on; overlays out; Duo Patch/Master zone-orchestrated on mock.
- View chrome: discrete UI Scale set + pan/scroll as local prefs excluded from JSON (chrome label Zoom).
- English product / skin / zone names; rejected `Two-tone` / `Split`; keep **Duo**.
- Palette list may show `k…` constant names + hex (`DESIGN.md` palette-swatch / mono typography).
- Voice: disciplined calibration console — not a playful illustration app (`EXPERIENCE.md` Voice and Tone).
- Success framing: five v1 skins calibrated; named-palette mappings; usable export; tool light enough not to delay alpha alone (flows + foundation).

---

## Intentional UX deltas

| Brief / extract cue | UX spines | Why intentional |
|---|---|---|
| “Segmented skin modes switcher” / Figma light-dark modes strip | **Skin combo** right-anchored (not horizontal pills) | Same job as modes switcher; scales to **15–20 skins**; sticky context unchanged. PRD FR-9 presentation evolve, not product reopen. |
| FR brief sidebar sketch: **top = palette**, center = picker, bottom = skin/object/state/mappings | **Picker fixed top** → Palette → Mappings/Skin → Unbound | Photoshop-like: edit colour with picker anchored; palette scrolls beneath — wave-2 chrome decision. |
| “Warn or gate” export completeness (older brief/brainstorm wording) | Hard gate: Export **disabled** + Unbound pane | Already PRD-locked option B; UX implements the harder path. |
| Skin ≈ mode metaphor language | Product behaviour kept; UI control = labeled combo `Skin:` | Metaphor intact; control form adapted for scale. |
| Context strip listed as “fresh angle” in extract | Absorbed as permanent readout under top bar | Uses invent room inside existing chrome. |
| Unbound-first path as fresh angle | Partially absorbed: always-visible Unbound pane + clickable jump; Flow 1 still starts from canvas calibrate | See drops — primary journey framing stays canvas-first. |

---

## Dropped qualitative ideas

Qualitative cues from the brief extract that are **not** carried as MVP UX deliverables (horizon or soft omit). None reopen PRD locks.

| # | Idea | Notes |
|---|---|---|
| 1 | **Eyedropper → nearest named swatch** | Brief “steal from Photoshop / tokens” cue. Not in spines; mapping path remains explicit Property → Palette id. |
| 2 | **Storybook-like state bar** as separate chrome | State lives in sidebar Mappings tab controls + context strip readout — no dedicated Storybook strip. |
| 3 | **Paint-bucket / accent-sweep** as MVP nicety | Extract fresh angle #4 / brief morph “later”. Spines keep it Soon (PRD-aligned). |
| 4 | **Soon-ready hooks** (e.g. subtle usage-badge placeholders, contrast-adjacent layout) | Extract fresh angle #8. Not in `DESIGN.md` components — avoid fake Soon UI. |
| 5 | **Duplicate-skin accent remap assistant** | Extract fresh angle #10. Not in Key Flows / components — operators Duplicate Skin + manual remap. |
| 6 | **Coalesced-undo “trust” affordance** beyond Undo/Redo | Behaviour absorbed (coalesce window ASSUMPTION); no extra history UI cue (named history stays V2). |
| 7 | **Unbound-first as primary journey framing** | Pane 4 supports jump-to-gap; Flow 1 climax is still canvas → bind → export gate, not “start at unbound checklist.” |
| 8 | **Narrow-viewport soft drawer sketch** | Mentioned as Soon intent only; no drawer composition in DESIGN/EXPERIENCE beyond Horizon note. |

**Qualitative drop count for this slug: 8**

---

## No reopen

Do not reopen: Duo green-vs-yellow (PRD closed `#FFCC00`); left Palette rail as MVP; live plugin editing; typography system; overlays; free hex mappings; contributor V2; schema freeze before Collect; Auto Layout / Matrix-Control clone.
