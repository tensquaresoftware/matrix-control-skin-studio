---
title: "UX finalize — input reconciliation (brainstorm)"
status: draft
created: 2026-10-15
input: .working/extract-brief-brainstorm.md (brainstorm / triage sections)
against: DESIGN.md + EXPERIENCE.md
---

# Reconcile: Brainstorm → UX spines

Compare **INPUT** (accepted / Soon / parked / rejected / fresh-angle triage in `extract-brief-brainstorm.md`) against **current** `DESIGN.md` + `EXPERIENCE.md`. Goal: confirm accepted MVP chrome keepers are absorbed, name intentional presentation deltas, and list qualitative drops. **Do not reopen locked PRD scope.**

---

## Absorbed ideas

### Accepted MVP keepers

| Brainstorm / extract | Landing in spines |
|---|---|
| Chrome **A1+B1+C1+D1+F2** — canvas + right sidebar; top skin switcher; click-to-map; unbound-count signal | GUI view + Sidebar + Top bar; Skin control; canvas select → Mapping; Unbound pane + count |
| Sticky context | Skin change preserves Object type, State, pan/zoom; context strip proves it |
| Canvas ↔ sidebar sync + pulse on Mapping change | EXPERIENCE State Patterns + `{components.pulse-highlight}` |
| Constrained mapping picker — Palette ids only; hex only on Palette entry | Picker pane + mapping-row rules + Do/Don't |
| Coalesced undo | State Patterns + ASSUMPTION 300–500 ms |
| Type-level mappings only | Foundation + Skin tab reminder |
| Duo header LEDs `#FFCC00` named Palette entry | Foundation + Flow 1 |
| Export completeness cue | Hard gate + Unbound pane (stronger than “warn or gate”) |
| Reject Auto Layout / vectors / effects; overlays; free hex; Matrix-Control clone | Inspiration & Anti-patterns + DESIGN Don'ts |
| Parked V2 list | Horizon V2 / parked |
| Soon list (where-used, compare, replace-colour, search, draft/ready, contrast, Collect merge) | Horizon Soon FR-22…FR-28 |
| Left rail / narrow drawer — do not expand MVP by default | Absent in MVP; Soon soft layout note only |
| Voice: calibration console, not illustration play | Voice and Tone |

### Fresh angles absorbed (inside invent room)

- Context strip density (Object · State · Zoom · Skin).
- Sidebar information hierarchy within right column (four stacked panes + `[Mappings | Skin]`).
- Export readiness copy (blocked strings + empty success).
- Selection ↔ mapping pulse choreography (duration / outline / chrome accent).
- Unbound checklist jump (clickable list) without new panels.

---

## Intentional UX deltas

| Brainstorm / extract | UX spines | Why intentional |
|---|---|---|
| Top **segmented** skin switcher (modes-like / Figma modes) | **Skin combo/dropdown** right-anchored | Scales to **15–20 skins**; keeps switch-without-leave-view + sticky context. Presentation delta vs A1+C1 silhouette, not a chrome expansion. |
| Unbound count as “warn or gate” | **Hard gate** + permanent Unbound pane | Matches PRD option B already locked; UX chose disabled Export. |
| Paint-bucket optional within MVP model (morph D2 “later”) | **Soon** horizon only | Aligns with PRD resolve; avoids silent chrome expansion. |
| Optional left Palette rail open | Parked / not in MVP chrome | Matches PRD FR-10. |
| Narrow inspector drawer open | Soon intent; no MVP desktop requirement | Matches FR-12 NOTE. |
| Sidebar “reduce overload” open | Concrete IA: picker fixed / Palette / Mappings\|Skin / Unbound + splitters | Closes open polish without double-sidebar envy. |

---

## Dropped qualitative ideas

Qualitative brainstorm / fresh-angle items **not** delivered as MVP UX surface. Horizon demotions that already match PRD are listed for honesty but counted only when they remain a *user-visible* qualitative omit relative to brainstorm keepers/angles.

| # | Idea | Notes |
|---|---|---|
| 1 | **Paint-bucket as mode (not panel)** for Duo/Monochrome accent sweeps | Fresh angle #4; spines have no paint-bucket mode. Soon. |
| 2 | **Unbound-first calibration path** as primary entry framing | Reverse keeper / fresh angle #1. Pane 4 enables it; Key Flow 1 stays canvas-first. |
| 3 | **Soon-ready usage-badge / contrast-adjacent placeholders** | Fresh angle #8. Omitted to avoid fake Soon UI. |
| 4 | **Duplicate-skin accent remap assistant** | Fresh angle #10. Not designed. |
| 5 | **Coalesced undo trust cue** (beyond Undo/Redo buttons) | Fresh angle #3 partial. Behaviour yes; affordance no. |
| 6 | **Narrow soft-layout drawer composition** | Open polish / Soon note only — no ascii or component for drawer. |
| 7 | **Swatch “usage badge”** from Photoshop/tokens steal list | Not in `{components.palette-swatch}` — where-used stays FR-22. |

**Qualitative drop count for this slug: 7**

*(Hard rejects and V2 parks are not counted as drops — they are intentional non-MVP.)*

---

## No reopen

Do not reopen: hard Unbound gate vs soft warn; Duo `#FFCC00` vs Matrix-12 green; left rail as MVP; layers / named history / Dev Mode / comments / matrix / aliases; Auto Layout / overlays / free hex; full where-used browse as MVP (pulse only); import merge as MVP (replace-all ASSUMPTION + FR-28 Soon).
