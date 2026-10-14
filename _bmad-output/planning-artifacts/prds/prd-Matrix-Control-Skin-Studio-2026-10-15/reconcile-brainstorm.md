# Reconcile — Brainstorm Intent → PRD

**Input:** `_bmad-output/brainstorming/brainstorm-skin-studio-outils-ux-2026-10-14/brainstorm-intent.md`  
**Against:** `prd.md` + `addendum.md` (same PRD folder)  
**Purpose:** Surface accepted triage items that are missing or weakened in the PRD package before finalize.  
**Date:** 2026-10-15

---

## 1. Method

1. Treat `brainstorm-intent.md` §2 hard constraints, §3 chosen directions, and §4 PRD feed points as the accepted triage set.
2. Map each item to PRD FR / section / addendum evidence (or mark gap).
3. Separate **intentional** demotions (user-confirmed) from **material** gaps (should fix or explicitly accept before finalize).
4. Ignore rejected / V2 park items unless the PRD accidentally pulled them forward or dropped a binding reject.

---

## 2. Coverage matrix

### 2.1 Hard constraints (§2) — all covered

| Intent item | PRD / addendum landing | Status |
|---|---|---|
| Not a second Matrix-Control / audio host; not full typography/DS editor in MVP | §5 Non-Goals; §2.2 Non-Users | Covered |
| Mappings = named palette ids only; hex only on palette entry | FR-1; Glossary Palette / Palette id; §5 | Covered |
| Type-level only; no per-instance; LED fully-on; no true overlays | FR-6, FR-7; §5 overlays | Covered |
| Chrome MVP: canvas + right sidebar + thin top bar; no bottom; no Auto Layout / vector / effects | FR-8; §5; addendum rejected table | Covered |
| Duo Patch/Master accents zone-orchestrated on mock | FR-15; Glossary Orchestrator; UJ-2 | Covered |
| Duo header LEDs `#FFCC00` (not Matrix-12 green), calibratable | FR-16; Glossary Duo LED yellow; addendum reject “Duo LED = Matrix-12 green” | Covered |

### 2.2 MVP directions (§3 MVP) — covered with two softenings

| Intent item | PRD / addendum landing | Status |
|---|---|---|
| Chrome A1+B1+C1+D1+F2: canvas + right sidebar + top segmented switcher + click-to-map + unbound count | FR-8, FR-9, FR-5, FR-18, FR-3 | Covered |
| Sticky skin\|type\|state\|pan/zoom | FR-2; Glossary Sticky context; UJ-2 | Covered |
| Canvas↔sidebar sync + coalesced undo | FR-5, FR-4, FR-20 | Covered (pulse softened — see §4) |
| Constrained picker / palette-id commits | FR-1, FR-10, FR-13 | Covered |
| Paint-bucket optional for accent sweeps **within MVP interaction model** | §8.7 open + ASSUMPTION “defer to Soon unless UX finds it trivial”; Assumptions Index | **Weakened** (see §4) |

### 2.3 Soon after MVP (§3) — covered; one UX detail thinner

| Intent item | PRD landing | Status |
|---|---|---|
| Where-used + rename refactor; flash affected mock regions | FR-22 (where-used + rename/refactor); flash not named | **Slightly weakened** (see §4) |
| Side-by-side compare (E2) | FR-23; UJ-2 notes bientôt out of MVP | Covered |
| Replace-colour remap + search/zoom-to-selection | FR-24, FR-25 | Covered |
| Draft vs ready lock | FR-26 (+ ASSUMPTION on export policy layer) | Covered |
| Contrast hints | FR-27 | Covered (advisory “may”) |
| Collect import merge (not blind wipe) | FR-28; §8.6; addendum mechanism notes | Covered |

### 2.4 V2 / park & Reject (§3) — aligned

| Intent item | PRD landing | Status |
|---|---|---|
| Layers tree, named history, Dev Mode, comments, matrix, aliases, contributor tooling | §4.6 V2 / parked | Covered (parked) |
| Reject Auto Layout / vectors / effects; overlays; free hex; Matrix-Control clone | §5; addendum rejected table | Covered |

### 2.5 PRD feed points (§4, max 8)

| # | Feed point | Landing | Status |
|---|---|---|---|
| 1 | Mapping UI: named palette ids only; block wild hex | FR-1 | Covered |
| 2 | Sticky context: object, state, pan, zoom | FR-2 | Covered |
| 3 | Top skin switcher + unbound count; export warning **or** gate | FR-3 **hard gate**; addendum Options B selected | Covered — **intentional harden** (user chose B) |
| 4 | Bidirectional selection; mapping change pulses where-used on mock (full where-used Soon) | FR-5 (“MVP **may** pulse”); FR-22 Soon | Covered with soft language (see §4) |
| 5 | Undo coalesces rapid picker micro-edits | FR-4 | Covered |
| 6 | Duo LEDs `#FFCC00` named palette entry, calibratable | FR-16 | Covered |
| 7 | Post-MVP: Collect merge/re-map; side-by-side | FR-28, FR-23 | Covered |
| 8 | Open: left palette rail vs right-only; narrow inspector drawer — confirm without expanding MVP chrome | FR-10 (right-only MVP); FR-12 deferred; §4.6 left rail parked; §6.2; addendum rejects | Covered — **intentional defer** |

---

## 3. Known intentional (do not treat as gaps)

Per finalize input / prior product choices:

1. **Hard export gate (option B)** — Feed point 3 allowed “warning or gate”; PRD FR-3 + addendum lock **B**. Stronger than the open wording, not a loss.
2. **Left Palette rail** — Deferred out of MVP (FR-10 / §4.6 / addendum). Matches feed point 8 “confirm without expanding MVP chrome.”
3. **Narrow-viewport inspector drawer** — Deferred (FR-12). Same.

---

## 4. Gaps / weakenings (material review set)

### G1 — Paint-bucket accent sweeps demoted from optional-MVP to assume-Soon

- **Intent:** MVP bullet: constrained picker path; “paint-bucket optional for accent sweeps within MVP interaction model.”
- **PRD:** No FR for paint-bucket. §8.7 + Assumptions Index: **defer to Soon** unless UX finds it trivial.
- **Assessment:** Accepted triage allowed optional MVP nicety; PRD closes by assumption toward Soon. Not a silent drop, but **horizon weakened** relative to intent.
- **Finalize options:** (a) keep assumption and note “accepted demotion” in PRD §8.7; (b) add optional MVP FR if UX wants the nicety in scope language.

### G2 — Mapping-change “pulse where-used on mock” softened to “may”

- **Intent:** Feed point 4 — mapping change **pulses** where-used on mock; full where-used UX may be Soon.
- **PRD:** FR-5 — “MVP **may** pulse mapped regions on Mapping change; full where-used browse is Soon (FR-22).”
- **Assessment:** Bidirectional selection is required; the pulse cue is optionalized. Light weakening of an accepted feed point.
- **Finalize options:** (a) require a minimal pulse/highlight on Mapping change in FR-5 consequences; (b) keep “may” and treat pulse as UX polish under FR-5.

### G3 — Where-used “flash affected mock regions” not spelled in Soon FR

- **Intent:** Soon — where-used + rename; “flash affected mock regions.”
- **PRD:** FR-22 names where-used and rename/refactor; does not mention flash/highlight of mock regions.
- **Assessment:** Capability present at product level; **UX specificity thinner**. Low severity if UX owns flash behavior later.
- **Finalize options:** (a) add one consequence line under FR-22 for flash/highlight; (b) leave to UX DESIGN/EXPERIENCE.

---

## 5. Non-gaps (checked, no action)

- Unbound count signal during editing — FR-3.
- Click-to-map / object selection — FR-5, FR-18.
- Five skins / Duo orchestration / sticky compare journey — FR-15, UJ-2.
- Collect merge not wipe — FR-28 (Soon); MVP replace-all called out in §8.6 / addendum (consistent with horizon).
- Reject list and V2 park list — §5 / §4.6 / addendum aligned.
- No accepted triage item fully **missing** from the PRD package.

---

## 6. Verdict for PRD finalize

| Class | Count | Items |
|---|---|---|
| Fully covered | Majority of §2–§4 | See matrix |
| Intentional (not gaps) | 3 | Hard gate B; left rail defer; narrow drawer defer |
| Material weakenings to decide | 3 | G1 paint-bucket horizon; G2 pulse “may”; G3 where-used flash wording |
| Fully missing accepted items | 0 | — |

**Recommendation:** No blocking omission. Before marking PRD ready, either accept G1–G3 as documented softenings (current text is defensible) or tighten FR-5 / FR-22 / §8.7 in a short finalize pass.

---

## 7. Compact summary (for chat)

- **input name:** brainstorm-intent
- **gaps:**
  - Paint-bucket optional-MVP → PRD assumes Soon (§8.7)
  - Mapping-change pulse softened to “may” (FR-5)
  - Where-used “flash mock regions” not in FR-22 wording
- **file path:** `_bmad-output/planning-artifacts/prds/prd-Matrix-Control-Skin-Studio-2026-10-15/reconcile-brainstorm.md`
