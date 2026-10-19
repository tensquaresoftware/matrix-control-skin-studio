---
title: "Matrix-Control Skin Studio"
status: final
created: 2026-10-15
updated: 2026-10-15
sources:
  - _bmad-output/planning-artifacts/briefs/brief-Matrix-Control-Skin-Studio-2026-10-14/brief.md
  - _bmad-output/brainstorming/brainstorm-skin-studio-outils-ux-2026-10-14/brainstorm-intent.md
  - docs/2026-10-14-Matrix-Control-Skin-Studio-Brief.md
---

# PRD: Matrix-Control Skin Studio

## 0. Document Purpose

This PRD is the product-requirements source of truth for **Matrix-Control Skin Studio**, an internal web tool that calibrates and exports UI skins for the Matrix-Control plugin. It is written for Guillaume and for downstream BMad owners of UX, architecture, and epics. It absorbs the adopted product brief (`status: ready`) and the accepted outils/UX brainstorm triage without reopening hard scope. Glossary terms below are binding; functional requirements (FRs) are globally numbered and stable. Implementation choices (web stack, final JSON schema packing) belong in architecture or remain open — see §8 and `addendum.md`.

## 1. Vision

Matrix-Control Skin Studio is a lightweight browser editor for designing, calibrating, and exporting UI skins for the Matrix-Control JUCE plugin. The operator works against a Figma-like overall mock whose aesthetic fidelity should match the current Figma mock of Matrix-Control (readable composition, not a pixel-perfect JUCE clone), binds every painted Property to a named opaque Palette entry, and exports a machine-readable JSON contract that a later Matrix-Control effort can implement in C++ without guessing colours.

Today Matrix-Control ships two hard-coded symbolic skins; v1 needs a coherent five-Skin family and a clearer Palette → token → Skin → Orchestrator model. Figma proved aesthetic direction but cannot enforce Palette-bound multi-Skin calibration. Live in-plugin editing would maximise fidelity but is too costly before alpha. Skin Studio sits between those poles: disciplined simulation outside the audio process, with final visual sign-off always in the real plugin after integration.

The tool must stay light enough not to single-handedly delay the plugin alpha campaign, while being rigorous enough that exported JSON is a trustworthy handoff — not a sketch that forces re-discovery in C++. Success includes leaving the follow-on Matrix-Control work with a clearer Skin/Look model (Orchestrator injection, generic widgets), not only a file of colours.

## 2. Target User

### 2.1 Jobs To Be Done

- **Functional:** Calibrate five v1 Skins on a credible mock; keep every Mapping on a named Palette id; export JSON Matrix-Control can implement without retyping guessed hex.
- **Functional:** Switch Skins while keeping Object type selection, State, and view position so multi-Skin compare does not reset context.
- **Emotional:** Trust that “ready to hand off” means required slots are mapped — export does not silently ship holes.
- **Contextual:** Run as a separate BMad project; Collect and C++ implementation remain Matrix-Control-side work in the linked loop.

### 2.2 Non-Users (v1)

- External design contributors shipping arbitrary Skins (V2 vision only, after token model + plugin import are stable).
- End users of the Matrix-Control plugin (they never open Skin Studio).
- Operators expecting a second Matrix-Control / audio host in the browser.

### 2.3 Key User Journeys

Internal single-operator tool — journeys stay light and named.

- **UJ-1. Guillaume calibrates Black/Green then exports a complete skin package.**
  - **Persona + context:** Guillaume, pre-alpha, needs a reviewable colour contract for Matrix-Control.
  - **Entry state:** Browser session with autosaved project (or import); mock showing Matrix-Control layout.
  - **Path:** Adjust Palette entries → select Object type / State → map Properties via Palette ids → switch States → preview updates live → attempt export.
  - **Climax:** Export succeeds only when required Mappings for the target Skin(s) are bound; JSON lands as a file he can hand to the Matrix-Control implementation pass.
  - **Resolution:** Local prefs (UI Scale, pan) unchanged in JSON; project remains autosaved.
  - **Edge case:** Unbound required Mappings → export blocked with a clear Unbound count / list; he maps the gaps and retries.

- **UJ-2. Guillaume compares Duo accents across Black/Duo and Cream/Duo without losing place.**
  - **Persona + context:** Same operator, checking Patch/Master Orchestrator accents and Duo header LEDs.
  - **Entry state:** Object type + State selected; pan/zoom set on a control cluster.
  - **Path:** Switch Skin via Top bar segmented switcher → same Object type / State / view preserved → tweak LED Palette entry (`#FFCC00` baseline) → confirm LEDs show fully-on colour on mock.
  - **Climax:** Duo accents remain zone-orchestrated on the mock (not painted into generic widgets); Sticky context makes the switch feel instantaneous.
  - **Resolution:** Continues calibration; optional bientôt side-by-side compare remains out of MVP.

## 3. Glossary

- **Skin Studio** — This product: the web editor in the Matrix-Control-Skin-Studio BMad project.
- **Matrix-Control** — The JUCE plugin that consumes exported skin JSON in a later implementation effort; not edited from this repository’s MVP scope.
- **Palette** — Closed set of named opaque colours; each entry has a stable id, optional constant name, and `#RRGGBB` hex. Hex is edited only on Palette entries.
- **Palette id** — Stable identifier of a Palette entry used by Mappings (never a free hex on the Mapping path).
- **Object type** — Generic widget/control category on the mock (e.g. knob, button). Widgets stay generic; product zones are not baked into Object types.
- **State** — Named visual state of an Object type (e.g. normal, hover, active) for which Properties may map differently.
- **Property** — Coloured attribute of an Object type in a State (fill, stroke, text, LED face, …) that can hold a Mapping.
- **Mapping** — Binding from (Skin × Object type × State × Property) to exactly one Palette id. Type-level only; no per-instance overrides in v1.
- **Skin** — Named Mapping set over Object types/States/Properties; display names for v1 are listed in §4.3.
- **Look** — Colour (and optionally font) bundle conceptually injected into a generic widget at construction in Matrix-Control; Skin Studio simulates the visible result, it does not implement C++ Looks.
- **Orchestrator** — Sole conceptual place that knows product zones (Patch vs Master, Header, …) and chooses Looks/colours for the active Skin. Duo Patch/Master accents are zone-orchestrated on the mock.
- **GUI view / canvas** — Left/main interactive mock surface: Figma-like composition with selection, pan/scroll, and UI Scale.
- **Sidebar** — Right panel for Palette, picker, Skin/Object type/State, and Mappings.
- **Top bar** — Thin chrome including the segmented Skin switcher (modes-like).
- **UI Scale** — Discrete zoom of the GUI view: `50%`, `75%`, `100%` (default), `125%`, `150%`, `175%`, `200%`. Local preference; excluded from JSON export.
- **Sticky context** — On Skin switch, preserve selected Object type, State, and pan/zoom (UI Scale).
- **Unbound** — A required Mapping slot with no Palette id (or a deleted/unresolvable Palette id).
- **Collect** — Matrix-Control-side inventory of colours, object types, properties, states, and looks that feeds Skin Studio’s bootstrap and later schema freeze.
- **JSON export** — The only mandatory handoff format from Skin Studio; versioned (`formatVersion` from day one). Schema shape is not frozen in this PRD before minimal Collect inventory.
- **LED fully-on** — In Skin Studio, LEDs always preview at their fully-on Palette colour; intensity modulation is a plugin concern.
- **Duo LED yellow** — Baseline calibration colour `#FFCC00` for Header LEDs on Duo Skins; stored as a named Palette entry, not a magic hard-coded constant outside the Palette.

## 4. Features

Horizon labels: **MVP**, **Soon** (peu après MVP), **V2**. FRs without a Soon/V2 tag are MVP unless stated otherwise.

### 4.1 Interaction Contracts (cross-cutting)

**Description:** Non-negotiable interaction rules from the accepted brainstorm. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-1: Palette-id-only Mappings

Operator can bind Properties only by selecting a Palette id. Hex appears only when editing a Palette entry.

**Consequences (testable):**
- Mapping UI never accepts a free `#RRGGBB` typed into a Mapping slot.
- Persisted Mapping values are Palette ids (or explicitly Unbound), never raw hex.
- Changing a Palette entry’s hex updates every Property that maps to that id on the next preview paint.

#### FR-2: Sticky context across Skin switch

When the operator switches Skin via the Top bar, Skin Studio preserves Object type selection, State, and pan/zoom (including UI Scale).

**Consequences (testable):**
- After Skin A → Skin B with knob X + state Hover selected and pan offset non-zero, Skin B shows the same selection and view offset.
- Sticky context does not invent a selection if none existed.

#### FR-3: Unbound signal and hard export gate

Skin Studio surfaces Unbound required Mapping count (and enough detail to locate gaps). JSON export is blocked while any required Mapping for the export target remains Unbound.

**Consequences (testable):**
- Unbound count is visible during editing (warning affordance).
- Export action is disabled or rejected with an explicit reason when Unbound required slots remain.
- When all required slots for the export target are bound, export proceeds.
- `[ASSUMPTION: “Required” Mapping slots = all Property slots present in the loaded Object-type inventory for the Skins included in the export target; Collect may later mark some Properties optional — until then treat inventory Properties as required.]`

#### FR-4: Coalesced undo for picker micro-gestures

Rapid consecutive micro-edits on the colour picker / Palette hex controls coalesce into a single undo step.

**Consequences (testable):**
- A continuous drag (or burst of fine adjustments within a short window) undoes as one step, not dozens.
- Discrete commits (Skin rename, Mapping change to a different Palette id, Skin CRUD) remain separate undo steps.
- `[ASSUMPTION: Coalesce window ≈ 300–500 ms idle or until pointer-up on picker drag — exact timing is a UX/architecture detail.]`

#### FR-5: Bidirectional canvas ↔ Sidebar selection sync

Selecting on the canvas focuses the corresponding Mapping section in the Sidebar; changing Mapping context in the Sidebar reflects selection on the canvas.

**Consequences (testable):**
- Clicking an Object type region on the mock selects that Object type (and focuses Sidebar Mapping UI).
- Choosing an Object type in the Sidebar outlines / highlights the corresponding mock region when present.
- On Mapping change, MVP pulses / briefly highlights the affected mock region(s) for the active Object type; full where-used browse and rename refactor are Soon (FR-22).

#### FR-6: Type-level Mappings only

Mappings apply per Object type (× State × Property), not per individual instance on the mock.

**Consequences (testable):**
- No UI path creates instance-specific colour overrides in MVP–V2 planned scope.
- Multiple mock instances of the same Object type always share Mappings.

#### FR-7: LED fully-on preview

LED Properties always render at their mapped fully-on Palette colour in Skin Studio.

**Consequences (testable):**
- No intensity slider or dimmed LED preview mode in Skin Studio for v1 Skins.
- Plugin-side intensity modulation is out of Skin Studio scope.

### 4.2 Chrome and navigation

**Description:** Desktop chrome for calibration: GUI view, Sidebar, and Top bar. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-8: MVP chrome layout

Skin Studio presents GUI view (canvas), right Sidebar, and thin Top bar. No left layers tree and no bottom chrome in MVP.

**Consequences (testable):**
- Default desktop layout matches canvas | Sidebar | Top bar only.
- Layers tree and bottom inspector strip are absent from MVP UI.

#### FR-9: Segmented Skin switcher

Top bar includes a segmented Skin switcher (modes-like) listing available Skins.

**Consequences (testable):**
- Operator can switch among loaded Skins without leaving the GUI view.
- Switch triggers Sticky context (FR-2).

#### FR-10: Right-side Palette and picker only (MVP)

Palette swatches, picker, and hex editing live in the right Sidebar in MVP. No left Palette rail in MVP.

**Consequences (testable):**
- MVP builds do not show a left Palette rail.
- Left rail, if ever added, is Soon/V2 and must not be required to complete UJ-1.

#### FR-11: UI Scale and pan/scroll (local prefs)

Operator can set UI Scale to the discrete set `50%`…`200%` (default `100%`) and pan/scroll the GUI view on X-Y (click-drag and arrow keys).

**Consequences (testable):**
- All seven scale steps are selectable; default on fresh session is `100%`.
- Pan/scroll and UI Scale persist as local session preferences.
- JSON export never includes UI Scale or pan offsets.

#### FR-12: Narrow-viewport inspector drawer — deferred

A bottom inspector drawer for narrow viewports is not an MVP desktop requirement.

**Consequences (testable):**
- MVP acceptance does not require a responsive bottom drawer.
- `[NOTE FOR PM: UX may still define a Soon soft layout for narrow screens without expanding MVP desktop chrome.]`

### 4.3 Skins, Palette, and v1 targets

**Description:** CRUD for Palette and Skins; bootstrap from Collect/Matrix-Control inventory; five v1 Skin display names; Duo LED baseline. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-13: Palette CRUD

Operator can create, rename, recolour (hex/picker), and delete Palette entries.

**Consequences (testable):**
- New entries receive a stable Palette id.
- Deleting a Palette id that is still referenced leaves those Mappings Unbound (FR-3) rather than silently substituting hex.
- Colours are opaque `#RRGGBB` only in the studio.

#### FR-14: Skins CRUD

Operator can create, rename, duplicate, and delete Skins.

**Consequences (testable):**
- Duplicate copies Mappings into a new Skin identity.
- Delete always shows a confirmation; cancel leaves the Skin unchanged. Confirm removes the Skin from the switcher and project data.

#### FR-15: v1 Skin set

Skin Studio supports calibration of these display names for Matrix-Control v1:

| Display name | Base | Control accents | Header LEDs |
|---|---|---|---|
| `Black/Green` | Current Black | Greens | Greens (confirm current Matrix-Control behaviour during Collect) |
| `Cream/Green` | Current Cream | Greens | Same as Black/Green LEDs policy |
| `Black/Duo` | Black | Blue (Patch) / Orange (Master) via Orchestrator | Duo LED yellow Palette entry |
| `Cream/Duo` | Cream | Blue / Orange via Orchestrator | Duo LED yellow Palette entry |
| `Monochrome` | Black | Grey | Grey |

**Consequences (testable):**
- Bootstrap can seed `Black/Green` and `Cream/Green` from current Black/Cream inventory.
- Duo Patch/Master accents are simulated as Orchestrator zones on the mock, not as frozen colours inside generic Object types.
- Rejected names (`Black/Two-tone`, `Cream/Two-tone`, `Split`) are not used as display names.

#### FR-16: Duo LED yellow Palette entry

Duo Skins use a named Palette entry with baseline hex `#FFCC00` for Header LEDs. The entry remains calibratable in Skin Studio (not a forever-frozen C++ magic colour).

**Consequences (testable):**
- Fresh Duo-capable Palette includes an entry whose default hex is `#FFCC00` (id/name chosen at implementation; meaning is “Duo header LED yellow”).
- Operator can change that entry’s hex; preview and export reflect the new value.
- Mappings for Duo Header LED Properties reference that Palette id, not a raw `#FFCC00` literal on the Mapping path.

#### FR-17: Bootstrap from inventory

Operator can start from a Collect / Matrix-Control-derived inventory that seeds Palette and Object types for `Black/Green` and `Cream/Green`.

**Consequences (testable):**
- Bootstrap does not require hand-entering every known green token from scratch for the two Green Skins.
- Exact inventory file location remains open (§8).

### 4.4 Mapping, preview, and persistence

**Description:** Selection, States, live preview, undo/redo, autosave, import/export. Realizes UJ-1.

**Functional Requirements:**

#### FR-18: Object selection and States

Operator can select an Object type (canvas click or chrome Object control) and choose a State, then edit Property → Palette id Mappings.

**Consequences (testable):**
- Changing State refreshes which Property Mappings are shown and how the mock paints that Object type.
- Selection mechanisms include both canvas and chrome Object/State controls (FR-5).
- `[NOTE FOR UX Lot B 2026-10-19: Object type and State controls may live in the top bar (not only in the sidebar); sticky-context and mapping semantics are unchanged.]`

#### FR-19: Real-time preview

Palette and Mapping edits update the GUI view without an explicit refresh action.

**Consequences (testable):**
- After a Mapping or Palette hex change, the mock reflects the new colour within the same interaction turn (no page reload).

#### FR-20: Undo / redo

Operator can undo and redo edits, subject to coalescing (FR-4).

**Consequences (testable):**
- Undo restores all edits that mutate project JSON (Palette, Skin, Mapping, and related identity fields) and the current Object-type / State selection.
- Undo does not reverse UI Scale or pan/scroll (local prefs, FR-11).
- Redo reapplies undone steps until a new branch edit occurs.

#### FR-21: Autosave and JSON import/export

Project state autosaves in the browser. Operator can export and import JSON files. Export is JSON only (no mandatory companion Markdown). Export obeys FR-3.

**Consequences (testable):**
- Closing and reopening the browser session restores the last autosaved project (same origin/profile assumptions).
- `[ASSUMPTION: Single-operator local browser storage is sufficient for MVP autosave; no cloud sync.]`
- Import replaces or loads project data from a JSON file the tool understands (version-aware).
- Export produces a `.json` file with `formatVersion`.
- `[ASSUMPTION: Import of newer/unknown formatVersion fails with a clear error rather than partial silent load.]`
- Global single file vs one file per Skin packing is **not** frozen here (§8).

### 4.5 Soon after MVP

**Description:** Capabilities accepted in brainstorm triage as bientôt — not MVP exit criteria. **Intent-only until promoted:** FR-22…FR-28 name capability intent for sequencing; they do not yet carry full testable consequences. When a Soon item is pulled into a sprint, UX/epics must add consequences before implementation.

#### FR-22: Where-used and rename refactor (Soon)

Operator can see where a Palette id is used (including flashing / highlighting the corresponding mock regions) and rename/refactor ids with reference updates.

#### FR-23: Side-by-side compare (Soon)

Operator can compare two Skins (at least Black/Green vs Cream/Green, and Duo accent checks) in a dedicated compare mode.

#### FR-24: Replace-colour (Soon)

Operator can replace Palette id X → Y for Mappings within a Skin (or scoped set).

#### FR-25: Search and zoom-to-selection (Soon)

Operator can search Object types/Properties and zoom the GUI view to the selection.

#### FR-26: Draft vs ready (Soon)

Skins (or project packages) can be marked draft vs ready. `[ASSUMPTION: Ready status becomes an additional export policy layer on top of FR-3; exact rules deferred to UX.]`

#### FR-27: Contrast hints (Soon)

Skin Studio may surface simple contrast advisories; not a full WCAG productization.

#### FR-28: Collect import merge (Soon)

Re-import from Collect merges / re-maps rather than wiping operator work by default.

### 4.6 V2 / parked

**Description:** Explicitly parked — do not pull into MVP without a course correction.

- Layers tree; named history panel; JSON/Dev Mode inspect; comments; object×property matrix; alias tokens; contributor tooling; denser chrome variants; keyboard-only power modes.
- Optional left Palette rail (parked relative to MVP; may revisit with Soon chrome polish).
- External contributors shipping non-Black/Cream-derived Skins via JSON once Matrix-Control import is stable.

## 5. Non-Goals (Explicit)

- Live editing inside the Matrix-Control audio/UI process.
- Transforming Skin Studio into a second Matrix-Control or audio host in CSS/JS.
- Pixel-perfect JUCE clone of the plugin UI.
- True UI overlays (lock film, modal dimming) and adjustment-layer workflows inside Skin Studio.
- Auto Layout, vector drawing, and effects panels (Figma feature envy).
- Free hex on the Mapping path.
- Full typography / design-system editor (colour first).
- Exhaustive `SkinColourId` inventory inside this PRD (Collect).
- Freezing the definitive JSON schema before minimal Object type / Property / State inventory.
- Implementing the Matrix-Control C++ skin refactor in this repository.
- Marketing site for the tool.
- Multi-format export (CSS, Tailwind, Android, etc.).
- SaaS collaboration, accounts, or multiplayer editing in v1.

## 6. MVP Scope

### 6.1 In Scope

- Interaction contracts FR-1…FR-7.
- Chrome FR-8…FR-11 (not FR-12).
- Palette & Skins FR-13…FR-17 (including Duo LED `#FFCC00` Palette entry).
- Mapping / preview / persistence FR-18…FR-21 with hard Unbound export gate.
- Five v1 Skin display names.
- Local UI Scale + pan/scroll excluded from JSON.
- Opaque tokens; LED fully-on preview; Orchestrator-simulated Duo zones on mock.

### 6.2 Out of Scope for MVP

- Soon items FR-22…FR-28 (reasons: calibration loop first; avoid Figma-scope creep).
- V2 / parked items in §4.6.
- Left Palette rail; narrow-viewport bottom drawer as MVP exit criteria.
- Soft “warn but allow export” Unbound policy (hard gate chosen).
- Final JSON packing decision and web stack choice (architecture / §8).
- Precise enumeration of every required Mapping slot for SM-1 story ACs (blocked on Collect §8.4; session-loaded inventory is the interim FR-3 gate surface).

## 7. Success Metrics

**Primary**

- **SM-1:** All five v1 Skins can be calibrated on the mock and exported with zero Unbound required Mappings. Validates FR-3, FR-15, FR-21. **Gate note:** SM-1 acceptance criteria finalize when Collect lands the minimal Object-type / Property / State inventory (§8.4). Until then, FR-3 implements the hard export gate over whatever inventory is loaded in the session.
- **SM-2:** No Mapping in an accepted export contains raw hex; all resolve through Palette ids. Validates FR-1, FR-13.
- **SM-3:** A developer/BMad agent can implement a Skin in Matrix-Control from export + Collect notes without inventing colours. Validates FR-21 and Vision handoff.
- **SM-4:** Follow-on Matrix-Control skin work can adopt a clearer Skin/Look model (generic widgets + Orchestrator injection) guided by the Studio contract, rather than extending the hard-coded two-variant approach. Validates Vision program outcome (qualitative; evidenced in the Matrix-Control implementation pass).

**Secondary**

- **SM-5:** Skin switch preserves selection + view in ≥95% of manual spot-checks during calibration sessions. Validates FR-2.
- **SM-6:** Tool effort does not become the sole blocker of the Matrix-Control alpha campaign (qualitative; tracked by Guillaume). Validates Vision lightness.

**Counter-metrics (do not optimize)**

- **SM-C1:** Pixel parity with JUCE — do not chase. Counterbalances aesthetic fidelity pressure against FR mock philosophy.
- **SM-C2:** Feature count toward Figma completeness — do not chase. Counterbalances SM-1 schedule.
- **SM-C3:** Export volume / number of Skins beyond the five v1 targets before alpha — do not chase. Counterbalances contributor-V2 pull-forward.

## 8. Open Questions

1. **JSON packing:** one global project JSON vs one JSON file per Skin — decide after minimal Collect inventory of Object types / Properties / States (do not freeze in this PRD).
2. **Web stack:** vanilla vs light framework — architecture decision; prefer simplicity.
3. **Collect inventory home:** Skin Studio `docs/` vs shared note originating from Matrix-Control — decide when Collect starts.
4. **Minimal Object type inventory:** exact Object types, Properties, and States (from Collect) — blocks schema freeze and precise “required Mapping” enumeration. Collect should also list alpha/darken/dim usages in Matrix-Control that must become solid opaque RGB Palette candidates (true overlays stay out of Skin Studio).
5. **Black/Green & Cream/Green Header LED confirmation:** confirm current Matrix-Control green LED behaviour during Collect (table in FR-15).
6. **Import merge semantics for MVP:** MVP import may be replace-all; merge/re-map is Soon (FR-28) — confirm at UX if MVP needs a safer import.
7. **Tool hosting detail:** this BMad project is already a dedicated repo; whether Matrix-Control later mirrors or submodules Skin Studio artifacts is an architecture/ops choice, not an MVP product blocker.

**Resolved (not open):** Paint-bucket accent sweeps are deferred to Soon unless UX later marks them trivial on the constrained picker (confirmed assumption; see §9).

## 9. Assumptions Index

- `[ASSUMPTION]` FR-3: until Collect marks optional Properties, all inventory Properties are required for export gate.
- `[ASSUMPTION]` FR-4: coalesce window ≈ 300–500 ms idle or pointer-up — UX/architecture to finalize.
- `[ASSUMPTION]` FR-21: unknown newer `formatVersion` fails closed on import.
- `[ASSUMPTION]` FR-26: Ready status adds policy on top of Unbound gate; details in UX.
- `[ASSUMPTION]` Paint-bucket accent sweeps deferred to Soon unless UX marks them trivial (resolved under §8).
- `[ASSUMPTION]` Form factor: desktop-oriented web app first; mobile not a v1 target (inline §12).
- `[ASSUMPTION]` Single-operator local browser storage is sufficient for MVP autosave (no cloud sync) (inline FR-21).

## 10. Constraints and Guardrails

- **Project boundary:** Skin Studio BMad project is separate from Matrix-Control (dedicated repo already); no Matrix-Control C++ refactor implemented from this repo’s MVP scope. Later mirror/submodule of artifacts into Matrix-Control is optional ops (§8.7).
- **Export:** JSON only; version from day one; UI Scale / pan excluded from export contract.
- **Colour model:** opaque `#RRGGBB` in studio; true-transparency overlays out of editor; LEDs fully-on in studio.
- **Widgets:** generic Object types; Patch/Master only via Orchestrator simulation on the mock.
- **Communication:** chat with Guillaume in clear French; generated artifacts in English (`document_output_language`).
- **Scope adoption:** brief `adoption: absorb-without-reopening-scope` and accepted brainstorm triage remain binding unless a factual contradiction appears.

## 11. Integration and Dependencies

- **Upstream:** Collect inventory from Matrix-Control (colours, Object types, Properties, States, Looks).
- **Downstream:** Matrix-Control implementation pass consumes JSON as a specification (not auto-applied).
- **Linked loop:** Collect → conceptual cleanup (Palette → tokens → Skins → Orchestrator) → Skin Studio simulation / export → Matrix-Control sources.
- **Design SSOT during calibration:** Skin Studio + exported JSON. **Runtime SSOT after integration:** Matrix-Control sources.
- **Figma:** current Figma mock sets the aesthetic bar for the Skin Studio GUI view; Figma is not the calibration SSOT once Skin Studio exists.

## 12. Platform

- **v1:** Web application, desktop browser, local persistence + file import/export. `[ASSUMPTION: Desktop-oriented web app first; mobile is not a v1 target.]`
- **Not v1:** native shell, plugin-embedded UI, mobile-first layout, cloud multi-user.

## 13. Why Now

Matrix-Control v1 needs five coherent Skins and a clearer colour model before alpha. Unstructured Figma and hand-edited C++ hex will not produce a reviewable multi-Skin contract in time; Skin Studio is the bounded tool that makes calibration discipline cheap enough to finish.
