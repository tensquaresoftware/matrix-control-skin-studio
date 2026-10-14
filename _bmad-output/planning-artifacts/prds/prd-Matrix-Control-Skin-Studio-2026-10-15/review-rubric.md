# PRD Quality Review — Matrix-Control Skin Studio

## Overall verdict
This is a strong internal-tool PRD for Fast-path stakes: the thesis (disciplined browser simulation → trustworthy JSON handoff before alpha) holds, trade-offs are decided and documented (hard Unbound gate, Duo LED `#FFCC00`, left rail deferred), and MVP FRs mostly carry testable consequences. The main usefulness risk is not honesty but **Collect dependency** — SM-1 / FR-3 “zero Unbound required” cannot become precise acceptance criteria until the Object-type inventory lands (§8.4). That gap is correctly left open; it remains the load-bearing blocker for closing the handoff definition of done.

## Decision-readiness — strong
Decisions read as decisions, not smoothed “considerations.” Hard Unbound export is chosen and contrasted with soft warn (`FR-3`, §6.2 “Soft ‘warn but allow export’ Unbound policy (hard gate chosen)”, addendum “Options considered — Unbound export” A/B/C with B selected). Left Palette rail and narrow bottom drawer are explicitly deferred (`FR-10`, `FR-12`, §4.6). Duo LED yellow is closed at `#FFCC00` as a calibratable Palette entry (`FR-16`, Glossary “Duo LED yellow”). Vision names what was given up (live in-plugin editing “too costly before alpha”; Figma “cannot enforce palette-bound multi-skin calibration”). Open Questions in §8 are real (JSON packing, Collect inventory, stack) — not rhetorical answers in the next sentence. Addendum rejected-alternatives table gives a decision-maker pushback material without reopening scope.

### Findings
- **low** Paint-bucket still listed as open while assumed deferred (§8.7 vs §9) — §8.7 asks “include in UX as optional MVP nicety or defer?” then tags `[ASSUMPTION: defer to Soon…]`. *Fix:* Drop the open question or rephrase as resolved deferral so §8 only holds truly unresolved items.

## Substance over theater — strong
No persona furniture: single operator carried in UJ-1/UJ-2; addendum states “No standalone persona section.” Vision is product-specific (five-skin family, palette → token → skin → orchestrator, JSON for C++ handoff) — not swappable into a generic “design tool” PRD. NFRs are thresholds or product rules (`opaque #RRGGBB`, LED fully-on, UI Scale discrete set, JSON-only export), not boilerplate scalable/secure/reliable. Landscape echoes in the addendum are explicitly non-binding reinforcement, not innovation theater. JTBD and Non-Users stay tight.

### Findings
_(none)_

## Strategic coherence — strong
Thesis is clear in §1 and §13: Skin Studio as the bounded middle between Figma aesthetics and live-plugin cost, rigorous enough that export is a trustworthy handoff and light enough not to sole-block alpha. Feature prioritization follows that arc (interaction contracts FR-1…FR-7 first; Soon tools after calibration loop; V2 parked). Success metrics validate the thesis (SM-1 complete five-skin export, SM-2 palette-id purity, SM-3/SM-4 handoff and model clarity) with counter-metrics against pixel parity and Figma feature count (SM-C1…SM-C3). MVP scope kind is problem-solving / calibration-contract, not a capability laundry list.

### Findings
_(none)_

## Done-ness clarity — adequate
MVP interaction and chrome FRs generally meet the “one testable consequence” bar (`FR-1` “never accepts a free `#RRGGBB`”, `FR-2` sticky selection/view, `FR-3` export disabled/rejected, `FR-8`/`FR-10` chrome absences, `FR-16` Duo LED defaults and remapping). Soft adjectives that would fail the rubric are mostly avoided. Remaining weakness is structural: “required Mapping” completeness and schema freeze are deferred to Collect (`FR-3` assumption; §8.4 “blocks schema freeze and precise ‘required Mapping’ enumeration”), so SM-1’s primary success condition is directionally clear but not yet enumerable for story ACs. Soon FRs (`FR-22`…`FR-28`) are capability stubs without consequences — acceptable for Fast-path horizon labels, thin if pulled forward. A few MVP phrases stay fuzzy (`FR-20` “as appropriate”; `FR-14` “with confirm if destructive”).

### Findings
- **high** Required Mapping set still Collect-blocked while SM-1 is primary success (§8.4, `FR-3` assumption, SM-1) — SM-1 requires “exported with zero Unbound required Mappings,” but §8.4 states exact Object types/Properties/States “blocks … precise ‘required Mapping’ enumeration.” *Fix:* Keep inventory open, but add an explicit gate note under SM-1 / §6: “SM-1 acceptance criteria finalize when Collect lands minimal inventory; until then FR-3 implements hard gate over whatever inventory is loaded.”
- **medium** Soon FRs lack testable consequences (§4.5 `FR-22`…`FR-28`) — e.g. `FR-23` “dedicated compare mode” with no exit conditions. *Fix:* Either one consequence bullet each, or a single §4.5 note that Soon items are intent-only until promoted.
- **low** Undo scope hedged (`FR-20`) — “Undo restores prior Palette, Skin, Mapping, and selection-affecting edits as appropriate.” *Fix:* Replace “as appropriate” with an explicit include/exclude list (or “all edits that mutate project JSON + selection”).
- **low** Destructive Skin delete confirmation vague (`FR-14`) — “with confirm if destructive” does not say when confirm appears. *Fix:* “Delete always confirms; cancel leaves Skin unchanged.”

## Scope honesty — strong
Non-Goals (§5) do real work (no live plugin edit, no second Matrix-Control, no free hex on Mapping path, no schema freeze before Collect, no C++ refactor in this repo). MVP in/out (§6) names hard gate, left rail, bottom drawer, Soon/V2, and open architecture items. Assumptions are tagged inline and indexed (§9). Deferred chrome and soft-export rejection are explicit, not silent. Open-item density (eight §8 questions + assumptions) is Collect/architecture-heavy — appropriate for internal stakes once product assumptions are confirmed; not a fake green light that hides missing product decisions.

### Findings
_(none beyond Decision-readiness paint-bucket note)_

## Downstream usability — adequate
Chain-top intent is stated (§0: UX, architecture, epics). Glossary is binding and used consistently across FRs/UJs. FR-1…FR-28 and SM-1…SM-6 / SM-C1…SM-C3 are contiguous; UJ-1/UJ-2 name Guillaume as protagonist with entry/path/climax. Cross-refs (`FR-2`, `FR-3`, `FR-5`→`FR-22`) resolve. Weak spots for extractors: two Assumptions Index entries lack inline tags; Soon stubs need more before story breakdown; illustrative addendum JSON uses `paletteColorId` while Glossary says **Palette id** (sketch-only, but worth aligning).

### Findings
- **low** Assumptions Index roundtrip incomplete (§9) — “Form factor: desktop-oriented…” and “Single-operator local browser storage…” appear in §9 without matching inline `[ASSUMPTION: …]` in the body (Platform §12 / `FR-21` imply them). *Fix:* Tag once inline in §12 and `FR-21`, or mark those index rows as “index-only synthesis.”
- **low** Glossary vs addendum field name (addendum JSON `paletteColorId`) — Glossary term is **Palette id**. *Fix:* One-line addendum note: “`paletteColorId` illustrates the Palette id reference; final field names are architecture.”

## Shape fit — strong
Shape matches an internal single-operator serious tool: capability-spec spine (interaction contracts, chrome, skins/palette, persistence), light UJs (two named journeys), operational SMs plus qualitative program outcomes, no consumer-product persona stack. Over-formalization avoided; under-formalization avoided for a chain-top PRD (glossary, FR IDs, Non-Goals, addendum depth). Fast-path calibration (confirmed assumptions, closed Duo LED / hard gate / left rail) is reflected rather than re-litigated.

### Findings
_(none)_

## Mechanical notes
- **Glossary:** **Palette id**, **Mapping**, **Unbound**, **Sticky context**, **Orchestrator**, **UI Scale** used consistently; “GUI view / canvas” dual name is glossary-declared.
- **ID continuity:** FR-1…FR-28 contiguous; UJ-1/UJ-2; SM-1…SM-6 + SM-C1…SM-C3. No duplicate IDs spotted. `FR-12` is a deferred non-requirement FR — unusual but intentional and cross-linked from §6.
- **Assumptions Index roundtrip:** Inline tags at `FR-3`, `FR-4`, `FR-21`, `FR-26`, §8.7 match index; form-factor and single-operator autosave are index-only (see Downstream finding).
- **UJ protagonists:** Both journeys name Guillaume with inline context.
- **Required sections for internal Fast-path:** Vision, target user/UJs, Glossary, Features/FRs, Non-Goals, MVP scope, Success Metrics (+ counters), Open Questions, Assumptions, Constraints, Integration, Platform, Why Now — present. Addendum carries rejected alternatives and illustrative (non-frozen) JSON as intended.
