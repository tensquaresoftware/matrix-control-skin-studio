# Pass 1 coverage notes — Skin Studio UX (2026-10-15)

Status: spines remain **draft** (parent sets `final`). No Collect inventory invented.

## Verdicts (mechanical)

| Category | Verdict | Notes |
|---|---|---|
| Flow coverage | strong (after fix) | UJ-1 / UJ-2 now named with protagonists, numbered steps, climax, failure path |
| Token completeness | strong | YAML tokens have hex / refs; prose `{path.to.token}` resolve |
| Component coverage | strong | 11 DESIGN components ↔ 11 EXPERIENCE Component Patterns rows |
| State coverage | adequate → strong (after fix) | Added no-Palette-selected, cold reopen label, chrome focus; PRD empty/error set covered |
| Visual reference coverage | adequate | Only ASCII in `.working/`; linked from both spines; no `mockups/` / `wireframes/` / `imports/` yet |

## Gaps fixed this pass

1. **UJ naming** — Key Flows retitled to **UJ-1** (export gate) and **UJ-2** (sticky Skin switch); climax + failure path explicit; UJ-2 calls Duo Orchestrator zones + Soon compare out.
2. **DESIGN frontmatter** — `status: draft`, `updated: 2026-10-15` added (was missing).
3. **Spines-win-on-conflict** — stated **once** in EXPERIENCE.md blockquote (removed duplicate at IA footer).
4. **Visual refs** — relative links to `.working/ascii-chrome-simulations.md` in DESIGN Layout + EXPERIENCE IA; GUI view noted spine-only until promoted mock.
5. **State rows** — No Palette entry selected; Autosave/cold reopen wording; Focus (chrome) [ASSUMPTION tab order].
6. **Confirmed present** — Inspiration & Anti-patterns; Responsive & Platform desktop-first; Horizon Soon/V2 intent-only; Open architecture/Collect brief.

## Remaining (not fixed — intentional or parent)

| Item | Why remaining |
|---|---|
| `status: final` | Parent sets final after Reviewer Gate / polish close |
| Promoted HTML mocks / wireframes | None in workspace; ASCII draft only; spine-only OK until parent renders |
| Collect Object types / Properties / States | Must not invent — open for Collect |
| Chrome hex token set exactness | Marked [ASSUMPTION]; may shift at implementation |
| Sidebar default 320px; picker fixed height px | [ASSUMPTION] |
| Context empty glyph; unbound State-on-click; Export tab order; coalesce ms; import copy | [ASSUMPTION] list in `draft-assumptions.md` |
| New ASSUMPTION: picker idle without Palette selection; focus tab order | Drafted for state coverage; confirm or drop at parent Finalize |
| Multi-Skin export-target picker | Packing open (architecture); hard gate stays count-based |
| Reviewer Gate lenses | Not run this pass (parent opt-in) |

## Component parity checklist

| DESIGN.md Components | EXPERIENCE.md Component Patterns |
|---|---|
| top-bar | ✓ |
| context-strip | ✓ |
| canvas-selection | ✓ |
| sidebar-splitter | ✓ |
| picker-pane | ✓ |
| palette-swatch | ✓ |
| mapping-row | ✓ |
| unbound-pane | ✓ |
| export-disabled | ✓ |
| modal-confirm | ✓ |
| pulse-highlight | ✓ |

Segmented `[Mappings \| Skin]` remains IA in EXPERIENCE (not a separate DESIGN component) — locked decision, no new chrome invented.
