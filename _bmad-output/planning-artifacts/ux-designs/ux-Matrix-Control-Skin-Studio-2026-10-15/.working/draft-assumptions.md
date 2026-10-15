# Draft assumptions & open items — Skin Studio UX (2026-10-15)

Status: checklist while DESIGN.md / EXPERIENCE.md remain **draft**. Not a decision log freeze.

## Remaining [ASSUMPTION] items (UX inventiveness still marked)

| # | Item | Where marked | Notes |
|---|---|---|---|
| 1 | Concrete dark chrome hex token set | DESIGN.md Colors | Invented once as a block; may shift at implementation |
| 2 | Default sidebar width 320px | DESIGN.md Layout | Resizable later = Soon/parked unless trivial |
| 3 | Picker pane fixed height ≈ 200–240px | DESIGN.md Components / sidebar-splitter | Exact px TBD |
| 4 | Context strip empty Object/State glyph (`—`) | DESIGN.md context-strip | Exact empty readout |
| 5 | Coalesce undo window ~300–500 ms | EXPERIENCE.md State Patterns | Shared with architecture |
| 6 | MVP Import = replace-all + strong confirm | EXPERIENCE.md | Backup/merge = Soon FR-28 |
| 7 | First open with no prior project → seed v1 skins + base palette | EXPERIENCE.md | Figma-like reopen when project exists |
| 8 | Import replace-all confirm microcopy exact wording | EXPERIENCE.md Voice | Table draft |
| 9 | Unbound list row separator / State jump on click | EXPERIENCE.md | Middot; whether click also sets State |
| 10 | Disabled Export focus/tab behaviour | EXPERIENCE.md A11y | In tab order vs skipped |
| 11 | First-open seed behaviour in UJ-1 | EXPERIENCE.md Key Flows | Ties to #7 |
| 12 | Picker idle when no Palette entry selected | EXPERIENCE.md State Patterns | No commit until row selected |
| 13 | Chrome focus / tab order | EXPERIENCE.md State Patterns | Top bar → strip → sidebar → canvas |

## Open for architecture / Collect (do not decide in UX)

| Topic | Owner |
|---|---|
| JSON packing (one global vs one file per Skin) | Architecture after Collect |
| Web stack (vanilla vs light framework) | Architecture |
| Collect inventory home (`docs/` vs shared MC note) | Collect / ops |
| Exact Object types / Properties / States inventory | Collect — **do not invent** |
| Alpha/darken/dim → solid opaque RGB candidates | Collect |
| Black/Green & Cream/Green Header LED greens confirmation | Collect |
| Tool hosting (mirror / submodule into Matrix-Control) | Architecture / ops |
| Final JSON field names | Architecture |
| Orchestrator zone rules storage | Architecture / MC |
| Exact coalesce timing (alongside UX 300–500 ms assumption) | UX + Architecture |

## Locked (not assumptions — do not reopen here)

Chrome silhouette; Sidebar 4 panes + IA variant A; Top bar remix + Skin combo right; Unbound pane 4 + hard Export gate; Pulse 1–2× ~400ms chrome accent; Zoom discrete steps; sticky context; Duo LED `#FFCC00` as Palette entry; English UI; no left rail / layers / bottom chrome / Auto Layout / overlays.
