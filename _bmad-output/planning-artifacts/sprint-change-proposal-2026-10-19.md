# Sprint Change Proposal — Lot B: Photocraft / Photoshop chrome

**Date:** 2026-10-19  
**Project:** Matrix-Control Skin Studio  
**Trigger:** Operator chrome density / IA / picker grammar (Lot B)  
**Mode:** Batch analysis  
**Status:** **Approved** — Guillaume 2026-10-19; planning artifacts patched; handoff `/bmad-build` for `lot-b-photocraft-chrome`  

---

## 1. Issue Summary

### Problem

Epics 1–5 delivered a working MVP chrome that matches the **locked 2026-10-15** UX/Architecture contracts: sidebar **320px**, **context strip**, **four stacked panes**, HSV **sliders** + hex, Object/State editors in the Mappings tab, Skin combo far-right with Zoom left of the spacer. That chrome is functional but not dense or Photocraft-like enough for calibration work: too much dead chrome (context strip duplicates Top bar Zoom/Skin), sidebar too wide, flat greys, picker not usable like Photoshop, and Unbound buried as a separate fourth pane without a persistent tab badge.

### Discovery

Stakeholder orientation (Guillaume) with Photoshop colour-picker and Photocraft sidebar references. Decisions for Lot B are **already locked** (width 260, Color|Palette + Skin|Mappings|Unbound tabs, square+hue picker, `#`+RGB text, Object/State in top bar, remove context strip, Unbound badge, etc.). This proposal **records** those decisions into planning artifacts so a subsequent `/bmad-build` does not “restore” 320px / four panes / context strip.

### Explicit non-goals (this course)

| Lot | Scope | This CC |
|-----|--------|---------|
| **A** | Seed inventory, clickable mock, colour-named palette, honest Unbound | **Out** — prerequisite / already treated; do not invent inventory here |
| **B** | Chrome / tokens / sidebar IA / top bar / picker UI | **In** |
| **C** | Mock fidelity ↔ real Matrix-Control | **Out** — absolute |

Also out: Epic 6, left rail, layers, bottom chrome, paint-bucket, i18n, pixel-clone Photocraft, Zoom combo width change, mappings data model / `formatVersion` / packing.

---

## 2. Impact Analysis

### Epic impact

| Epic | Status today | Impact |
|------|--------------|--------|
| Epic 1 Seed/store | done | None on seed/inventory (Lot A). Prefs shape for `sidebarPaneHeights` may adapt (chrome only). |
| Epic 2 Chrome | done | **Historical ACs superseded** by Lot B contracts. Do **not** reopen epic as incomplete. Add a **new** post-MVP Lot B story for implementation. |
| Epic 3 Palette/Skins | done | Picker UI surface changes (Story 3.1 UX); Skin tab microcopy (Create / Duplicate / Delete). Coalesce undo + commit-only-if-Palette-selected **unchanged**. |
| Epic 4 Mapping/preview | done | Object/State **controls move** to top bar; Mappings tab = rows only. Canvas sync / sticky context semantics unchanged. |
| Epic 5 Undo/export | done | Unbound **signal** must stay visible via **tab badge** when Unbound tab inactive. Derive/export gate unchanged. |
| Epic 6 Soon | backlog | Unchanged — still out of MVP queue. Note: epics “denser chrome” was parked under V2; Lot B **promotes denser Photocraft grammar now** without promoting Epic 6. |

### Story impact

- **Do not rewrite** done Stories 2.x–5.x as if unfinished.
- **Add** one implementation story (suggested id: `lot-b-photocraft-chrome`) after approval; track in `sprint-status.yaml`.
- Annotate epics **UX-DR** block + AD-11 / DESIGN / EXPERIENCE so future agents follow Lot B.
- Optional one-line “superseded by Lot B (2026-10-19)” footnotes on Epic 2 UX-DR3…DR7 and Story 2.2–2.4 / 3.1 chrome bullets.

### Artifact conflicts

| Artifact | Conflict severity | Action |
|----------|-------------------|--------|
| **DESIGN.md** | **High** | Rewrite layout, components, spacing; retune greys; remove context-strip as live chrome; picker Photoshop grammar; Photocraft tabs/gutters |
| **EXPERIENCE.md** | **High** | IA table, top bar, remove context strip, two tabbed zones, Object/State in top bar, Skin microcopy, focus order |
| **ARCHITECTURE-SPINE.md AD-11** (+ Structural Seed chrome/sidebar lines) | **High** | New chrome contracts; prefs height keys for **two** zones |
| **AD-8** | **Medium** | Clarify `sidebarPaneHeights` keys for two resizable zones; migration from old three-key prefs → defaults |
| **epics.md** UX-DR3…DR7, DR5; AD-11 summary; Epic 2 narrative | **High** | Align to Lot B |
| **PRD** | **Low** | FR-8…11 / FR-13 / FR-18 still hold; optional note that Object/State chrome may live in top bar (UX), not only sidebar |
| **HTML mockups** (`editor-main.html`, etc.) | **Medium** | Mark **stale** relative to Lot B; regenerate optional (Soon / not blocking Build) |
| **epic-2-context.md** | **Medium** | Update continuity summary so agents don’t restore old chrome |
| **sprint-status.yaml** | **Medium** | Add Lot B story entry after approval |

### Technical impact (implementation handoff — not done in CC)

- `src/styles/` tokens: greys, `--space-sidebar-width: 260px`, picker square ~200×200 + vertical hue, gutters, tab chrome, splitter hover blue line.
- `src/chrome/`: remove context strip; Object + State in top bar; order Skin then Zoom on the right block (~260px budget); Zoom combo width **unchanged**; Skin combo width adapted.
- `src/sidebar/`: two zones with real tabs Color|Palette and Skin|Mappings|Unbound; Unbound badge on tab; merge panes; Skin buttons Create / Duplicate / Delete; drop type-level reminder sentence.
- Prefs: adapt `sidebarPaneHeights` to two zones; old prefs shape → clamp to defaults.
- History coalesce + “commit only if Palette entry selected” preserved.
- Matrices: chrome-shell, picker, palette, skin-tab, unbound, mappings — update expectations; **no** Lot A seed / Lot C mock redraw.

---

## 3. Recommended Approach

### Path options

| Option | Viable? | Notes |
|--------|---------|-------|
| **1. Direct Adjustment** | **Yes — selected** | Update DESIGN / EXPERIENCE / AD-11 (+ AD-8 prefs note) / epics UX-DRs; add Lot B story; Build implements chrome only. |
| **2. Rollback** | No | Rolling back Epic 2–5 chrome would destroy working MVP for no gain. |
| **3. MVP Review / shrink** | No | MVP goals unchanged; this is chrome grammar refinement, not scope cut. |

### Recommendation

**Option 1 — Direct Adjustment**, effort **Medium**, risk **Medium** (layout density: 260 + 200×200 square + hue + margins; Unbound badge; prefs migration; Object/State dead labels if Lot A absent — document honestly, don’t fake click repair).

**Rationale:** Product decisions are locked; artifacts are the hazard (agents restoring 320/four panes/strip). Align SSOT first, then one focused Build. Lot A/C stay sealed.

### Timeline impact

- Correct Course: artifact edits only (this proposal + applied patches after approval).
- Build (fresh chat): Lot B chrome only — estimate one focused build/review cycle.
- Lot C / Epic 6: remain Soon / separate course.

---

## 4. Detailed Change Proposals

### 4.1 DESIGN.md

**File:** `_bmad-output/planning-artifacts/ux-designs/ux-Matrix-Control-Skin-Studio-2026-10-15/DESIGN.md`

| Section | OLD (summary) | NEW (summary) |
|---------|---------------|---------------|
| `spacing.sidebar-width` | `320px` | `260px` |
| `spacing.context-strip-height` | `28px` | **Remove** from live layout (token may be deleted or marked obsolete) |
| Colors / surfaces | Near-flat greys | **Photocraft-aligned** distinct surfaces (app / chrome / panel darker / raised / sunken / **gutter**). Exact hex **[ASSUMPTION]** tuned at Build against Guillaume’s Photocraft captures — keep accent blue family for selection + **splitter hover line** |
| Layout | Top bar + context strip + body; four panes | Top bar only + body; sidebar **two** stacked zones with thick gutters |
| Zone 1 | Picker pane + separate Palette pane | Tabs **`Color` \| `Palette`** (rename Picker → Color). Photocraft tab chrome: inactive grey, active white / lifts off panel |
| Zone 2 | Mappings\|Skin segmented + Unbound pane 4 | Tabs **`Skin` → `Mappings` → `Unbound`**. No redundant panel titles above content. **Unbound badge/count on tab** even when inactive |
| Splitters | Subtle track; panes 2–4 | Marked gutters between dark panels; **blue line on resize hover**; drag to resize **both** zones; persist heights |
| `picker-pane` | HSV/RGB sliders + hex | Photoshop grammar: **SV square ≈ 200×200** + **vertical hue slider** right of square; **no** Hue/Sat/Val sliders; one row: `#` (6 hex chars, no truncation, e.g. `FFCC00`) + `R:` `G:` `B:` decimal to the right of `#`; live sync with square/hue; commit only to selected Palette entry; coalesce undo unchanged |
| `top-bar` | Zoom then spacer then Skin; no Object/State | Left ops unchanged: New/Import/Export · Undo/Redo. **Object** + **State** (labels + controls per existing behaviour) in available left/centre. Right block: **`Skin` then `Zoom`** sized to fit cleanly in **~260px** with a few px safety (Skin combo width adapted; **Zoom combo width unchanged**) |
| `context-strip` | Live readout band | **Removed** from product chrome |
| Do’s/Don’ts | Pane 4 Unbound always visible | Unbound always reachable via tab + **persistent badge**; don’t reintroduce context strip or 320 default |

**Rationale:** Prevent Build agents from restoring Epic 2 geometry.

---

### 4.2 EXPERIENCE.md

**File:** `.../EXPERIENCE.md`

| Section | OLD | NEW |
|---------|-----|-----|
| IA table | Context strip; four panes; picker+sliders | No context strip; two tabbed zones; Color square+hue+`#`/RGB |
| Top bar | Zoom …… Skin | Object + State in bar; right: Skin then Zoom (~260 budget) |
| Context strip section | Readout-only band | **Delete** section; sticky context still via session + living Object/State/Skin/Zoom controls |
| Pane 3 IA | `[Mappings \| Skin]`; Object/State on Mappings | Zone tabs Skin\|Mappings\|Unbound; Object/State **not** duplicated in Mappings tab |
| Skin tab | Rename / Duplicate / Delete; type-level reminder OK | Buttons **`Create`**, **`Duplicate`**, **`Delete`** (not “Create Skin”, not “…”). **Remove** sentence “Type-level only — no per-instance colour overrides.” Keep rename field if already present as non-button control |
| Unbound | Always-visible pane 4 | Tab content + **badge on Unbound tab** when count > 0 |
| Component patterns | context-strip; four-pane splitters; HSV | Update top-bar, sidebar-splitter (2 zones), picker-pane, tab badge; focus order: top bar → sidebar → canvas (no strip) |
| Journeys | Mentions context strip proving sticky place | Sticky proven by Object/State/Skin/Zoom controls retaining values |

**Rationale:** Behavioural SSOT must match Lot B IA.

---

### 4.3 ARCHITECTURE-SPINE.md

#### AD-11 — replace rule text

**OLD:**  
Top bar order: `[New][Import][Export]` · undo/redo · `Zoom` · `Skin` combo right-anchored. Sidebar four panes: fixed-height picker → palette → mappings/skin → unbound (splitters; panes 2–4 resizable). Pane 3 IA: segmented `[Mappings | Skin]`; Skin tab = rename / duplicate / delete only. …

**NEW:**  
Top bar order: `[New][Import][Export]` · undo/redo · **`Object` · `State`** · spacer · **`Skin` then `Zoom`** right-anchored (Skin+Zoom block ≈ sidebar width **260px**; Zoom combo width unchanged; Skin combo width adapted). **No context strip.** Sidebar **two** resizable zones (thick Photocraft gutters; blue hover on resize): (1) tabs **`Color` \| `Palette`**; (2) tabs **`Skin` → `Mappings` → `Unbound`** with **Unbound count badge** on the tab. Color tab: SV square ≈200×200 + vertical hue + `#` + R/G/B text (no HSV sliders). Skin tab buttons: Create / Duplicate / Delete (English). No layers tree; no bottom chrome; no left Palette rail; no Auto Layout / true overlay editing UI. Microcopy English per EXPERIENCE.md. Visual tokens from DESIGN.md (Photocraft-aligned greys).

#### AD-8 — prefs clarification

**Add:** `sidebarPaneHeights` stores heights for the **two** Lot B zones (suggested keys: `colorPalette`, `skinMappingsUnbound`). On load, if legacy three-key shape (`palette` / `mappings` / `unbound`) or invalid data is present, **fall back to defaults** (do not invent a partial migrate that leaves a broken layout). Zoom/pan rules unchanged.

#### Structural Seed comments

- `chrome/` — top bar only (no context strip)  
- `sidebar/` — Color|Palette zone + Skin|Mappings|Unbound zone  

**AD-7 / AD-16:** unchanged (coalesce; commit only with Palette selection).

---

### 4.4 epics.md

| Item | Change |
|------|--------|
| UX-DR3 | Top bar 40px + body; sidebar default **260px**; **no** context strip |
| UX-DR4 | Order includes Object/State; right Skin then Zoom; ~260 Skin+Zoom budget |
| UX-DR5 | **Replace** context-strip DR with: Object/State live in top bar; empty uses `—`; sticky Skin switch unchanged |
| UX-DR6 | Two zones + Photocraft tabs/gutters/blue resize hover; Unbound tab badge; prefs two heights |
| UX-DR7 | Square + hue + `#`/RGB text; no HSV sliders; coalesce + commit rules unchanged |
| AD-11 bullet in architecture summary | Mirror new AD-11 |
| Epic 2 opening blurb | Note Lot B (2026-10-19) supersedes original chrome geometry for ongoing work |
| V2 “denser chrome” parked line | Note Lot B delivered denser Photocraft **grammar** without promoting Epic 6 |

Historical Story 2.2–2.4 / 3.1 ACs: optional **superseded** footnotes only — do not flip status to incomplete.

---

### 4.5 PRD (optional light touch)

**File:** `prd.md`

- No FR additions required for Lot B.
- Optional clarification under FR-18 / chrome FRs: Object type and State controls may live in the **top bar** (UX chrome), not only in the sidebar; selection semantics and sticky context unchanged.
- FR-10 still: picker/palette/hex on the **right** — Color|Palette tabs satisfy this.

**MVP:** still achievable; no scope cut.

---

### 4.6 Secondary artifacts

| Artifact | Proposal |
|----------|----------|
| `mockups/editor-main.html` (+ related) | Mark stale vs Lot B in DESIGN “Canonical chrome mock” note; regenerate optional / Soon |
| `epic-2-context.md` | Rewrite chrome summary to Lot B so continuity docs don’t fight AD-11 |
| `sprint-status.yaml` | After approval: add `lot-b-photocraft-chrome: ready-for-dev` (or backlog→ready when spec written by Build) under a **Post-MVP Lot B** comment block; do not reopen `epic-2: done` |
| `deferred-work.md` | Optional pointer: Lot B CC 2026-10-19; Lot C still out |

---

### 4.7 Explicitly unchanged

- Lot A seed / click / palette naming / Unbound honesty content  
- Lot C mock redraw  
- Mapping = palette id only; hex only on Palette edit  
- History coalesce rules; export gate derive  
- Zoom combo **width**; discrete Zoom steps  
- English chrome (NFR-9); product skin names  
- Epic 6 backlog  

---

## 5. Implementation Handoff

### Scope classification

**Moderate** — planning SSOT updates + one new Lot B story, then Developer `/bmad-build` (fresh chat). Not a full replan (Major). Not “code only without artifact update” (that would be the known pitfall).

### Sequencing

1. **Guillaume approves** this Sprint Change Proposal (yes / revise).  
2. Apply artifact patches listed in §4 (same Correct Course session or immediate follow-up).  
3. Update `sprint-status.yaml` with Lot B story.  
4. **Fresh chat:** `/bmad-build` scoped **only** to Lot B per accepted proposal + operator Build checklist (tokens, DOM tabs, top bar, matrices, manual checks).  
5. Build must **confirm** Lot A / Lot C untouched (except prefs/layout keys required by chrome).

### Success criteria

- DESIGN + AD-11 + EXPERIENCE + epics UX-DRs no longer specify 320 / four panes / context strip / HSV sliders.  
- Build delivers: 260 sidebar, Photocraft greys/tabs/gutters, Color picker square+hue+`#`/RGB, Object/State in top bar, Skin then Zoom ~260, Unbound badge, Skin Create/Duplicate/Delete, no type-level reminder sentence.  
- Coalesce undo + Palette-selected commit preserved.  
- Export gate still understandable via Unbound badge/list.  
- If Lot A absent: Object/State may be empty `—` — chrome must not claim click-to-select is fixed by Lot B.

### Handoff recipients

| Role | Responsibility |
|------|----------------|
| **This Correct Course** | Approve proposal → patch artifacts → sprint-status |
| **Developer (`/bmad-build`)** | Implement Lot B only; review; FR presentation |
| **PM/Architect** | Not required unless Guillaume rejects Direct Adjustment |

---

## 6. Checklist record (Correct Course)

### §1 Trigger and context

- [x] 1.1 Trigger: Lot B chrome Photocraft/Photoshop (post Epic 2–5)  
- [x] 1.2 Type: stakeholder UX refinement / strategic chrome pivot (not technical blocker)  
- [x] 1.3 Evidence: locked decisions + Photoshop/Photocraft refs; current DESIGN 320/four panes/strip  

### §2 Epic impact

- [x] 2.1 Epic 2 historical; add Lot B story  
- [x] 2.2 Modify UX contracts; no new epic required  
- [x] 2.3 Epic 3–5 surfaces only; Epic 6 untouched  
- [x] 2.4 No epic invalidated  
- [x] 2.5 No resequence of Epic 6 into MVP  

### §3 Artifacts

- [x] 3.1 PRD: low / optional note  
- [x] 3.2 Architecture: AD-11 + AD-8 prefs  
- [x] 3.3 UX DESIGN + EXPERIENCE: primary  
- [x] 3.4 Secondary: mocks stale, epic-2-context, sprint-status  

### §4 Path forward

- [x] 4.1 Direct Adjustment — Viable (Medium effort / Medium risk)  
- [x] 4.2 Rollback — Not viable  
- [x] 4.3 MVP Review — Not viable  
- [x] 4.4 Selected: **Option 1**  

### §5–6 Proposal / approval

- [x] 5.1–5.5 Components drafted in this document  
- [x] 6.3 User approval — yes (2026-10-19)  
- [x] 6.4 sprint-status — `lot-b-photocraft-chrome: ready-for-dev`  
- [x] 6.5 Handoff — Developer `/bmad-build` Lot B only (fresh chat)  

---

## Appendix — Build checklist (for fresh `/bmad-build` after acceptance)

1. Tokens/CSS: Photocraft greys; sidebar 260; picker square+hue; `#`+RGB row; tabs; gutters; blue resize hover.  
2. Sidebar modules: two zones, real tabs, Skin microcopy, Unbound badge; prefs two heights.  
3. Top bar: Object/State; Skin then Zoom; remove context strip; Skin combo width only.  
4. Manual: resize, tab switch, picker drag+fields → selected palette + coalesced undo, Unbound export signal, Object/State visible, no Lot A/C regression/invention.  
