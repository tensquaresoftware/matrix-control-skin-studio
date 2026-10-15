# UX extract — PRD Matrix-Control Skin Studio (2026-10-15)

Source: `prd.md` (status: final) + `addendum.md` + `.memlog.md` + `review-rubric.md` + `reconcile-brief.md` + `reconcile-brainstorm.md`.  
Focus: UX experience / visual / interaction only. No invention beyond cited sources.

---

## Locked decisions (do not reopen)

- **Product role:** Internal single-operator browser editor; not a second Matrix-Control / audio host; end users never open Skin Studio; external contributors = V2 only (§2.2, §5).
- **Aesthetic bar:** GUI view is Figma-like — readable composition matching the **current Figma mock** of Matrix-Control; **not** a pixel-perfect JUCE clone. Final visual sign-off always in the real plugin after integration (§1, §11; reconcile-brief G2 restored). Counter-metric SM-C1: do not chase JUCE pixel parity.
- **Colour discipline:** Opaque `#RRGGBB` only in studio. Hex edited **only** on Palette entries. Mappings bind by Palette id only — never free hex on the Mapping path (FR-1, Glossary, §5).
- **Type-level Mappings only:** No per-instance colour overrides in MVP–V2 planned scope (FR-6).
- **LED preview:** Always fully-on Palette colour; no intensity slider / dimmed LED mode in Skin Studio (FR-7). Plugin intensity out of scope.
- **True overlays out:** No lock-film / modal-dimming / adjustment-layer / true-transparency overlay editing in Skin Studio (§5; Collect: alpha/darken/dim → solid RGB candidates; true overlays stay out — addendum).
- **No Figma feature envy:** No Auto Layout, vector drawing, effects panels (§5).
- **No full typography / design-system editor** — colour first (§5).
- **Unbound export = hard gate (option B):** Export blocked while any required Mapping for the export target remains Unbound. Soft “warn but allow” rejected for MVP (FR-3; addendum Options A/B/C; §6.2). Option C (warn now + gate on ready) may layer later with FR-26 — not MVP.
- **Duo LED yellow closed:** Named Palette entry, baseline `#FFCC00` (not Matrix-12 green); calibratable (FR-16; Glossary; addendum reject table).
- **Chrome MVP locked:** Canvas + right Sidebar + thin Top bar only. No left layers tree, no bottom chrome, no left Palette rail in MVP (FR-8, FR-10; §4.6 park).
- **Narrow-viewport bottom inspector drawer:** Not an MVP desktop requirement (FR-12). UX may define a Soon soft layout without expanding MVP chrome (FR-12 NOTE).
- **Paint-bucket accent sweeps:** Deferred to Soon unless UX later marks them trivial on the constrained picker (resolved assumption §8 / §9; not an open reopen).
- **Form factor:** Desktop-oriented web app first; mobile not a v1 target (§12).
- **Export format:** JSON only; no mandatory companion Markdown; multi-format export out (§5, FR-21).
- **Scope binding:** Brief absorb-without-reopening-scope + accepted brainstorm triage remain binding (§10).

---

## Chrome & layout (MVP)

| Element | Decision | FR |
|---|---|---|
| **GUI view / canvas** | Left/main interactive mock: Figma-like composition; selection, pan/scroll, UI Scale | Glossary, FR-8, FR-11 |
| **Sidebar** | Right panel: Palette, picker, Skin/Object type/State, Mappings | Glossary, FR-8, FR-10 |
| **Top bar** | Thin chrome; segmented Skin switcher (modes-like) | Glossary, FR-8, FR-9 |
| **Absent in MVP** | Left layers tree; bottom chrome / inspector strip; left Palette rail | FR-8, FR-10, §4.6 |
| **Skin switcher** | Lists available Skins; switch without leaving GUI view; triggers Sticky context | FR-9, FR-2 |
| **Palette UI location** | Swatches, picker, hex editing in **right Sidebar only** | FR-10 |
| **Platform** | Desktop browser; local persistence + file import/export; not native shell / plugin-embedded / mobile-first / cloud multi-user | §12 |

---

## Interaction contracts (sticky context, unbound gate, coalesced undo, pulse, sync, UI scale, pan/scroll, autosave, import/export)

### Sticky context (FR-2)
- On Skin switch via Top bar: preserve **Object type selection**, **State**, and **pan/zoom (including UI Scale)**.
- Does **not** invent a selection if none existed.
- SM-5: preserve selection + view in ≥95% of manual spot-checks.

### Unbound signal & hard export gate (FR-3)
- Surface Unbound **required** Mapping **count** and enough detail to locate gaps (warning affordance during editing).
- Export disabled or rejected with explicit reason while any required slot for export target remains Unbound.
- Unbound = required slot with no Palette id, or deleted/unresolvable Palette id (Glossary).
- Deleting a referenced Palette id leaves Mappings Unbound — no silent hex substitute (FR-13).
- **Assumption:** Until Collect marks optional Properties, all inventory Properties are required. Interim gate = whatever inventory is loaded in session (SM-1 gate note).

### Coalesced undo (FR-4) + undo/redo (FR-20)
- Rapid consecutive micro-edits on colour picker / Palette hex coalesce into **one** undo step.
- Discrete commits (Skin rename, Mapping change to different Palette id, Skin CRUD) remain separate steps.
- **Assumption:** Coalesce window ≈ 300–500 ms idle or until pointer-up on picker drag — exact timing = UX/architecture detail.
- Undo restores all edits that mutate project JSON (Palette, Skin, Mapping, identity fields) **and** current Object-type / State selection.
- Undo does **not** reverse UI Scale or pan/scroll (local prefs).
- Redo until a new branch edit occurs.

### Bidirectional canvas ↔ Sidebar sync + pulse (FR-5)
- Canvas select → focus corresponding Mapping section in Sidebar.
- Sidebar Object type choice → outline / highlight corresponding mock region when present.
- On Mapping change: MVP **pulses / briefly highlights** affected mock region(s) for the active Object type (required minimal cue; finalize autofix from brainstorm “may” → must — `.memlog`).
- Full where-used browse + rename refactor = Soon (FR-22).

### UI Scale (FR-11)
- Discrete set: `50%`, `75%`, `100%` (default), `125%`, `150%`, `175%`, `200%`.
- Local preference; **never** in JSON export.
- Persists as local session preference with pan/scroll.

### Pan / scroll (FR-11)
- GUI view pan/scroll on X-Y: **click-drag** and **arrow keys**.
- Local prefs; excluded from JSON export.

### Real-time preview (FR-19)
- Palette and Mapping edits update GUI view without explicit refresh; same interaction turn (no page reload).
- Changing a Palette entry’s hex updates every Property mapped to that id on next preview paint (FR-1).

### Selection & States (FR-18)
- Select Object type via canvas click **or** Sidebar; choose State; edit Property → Palette id Mappings.
- Changing State refreshes shown Property Mappings and mock paint for that Object type.

### Autosave (FR-21)
- Project autosaves in browser; reopen restores last autosaved project (same origin/profile).
- **Assumption:** Single-operator local browser storage; no cloud sync in MVP.

### Import / export (FR-21, FR-3)
- Export: `.json` with `formatVersion`; JSON only; obeys Unbound hard gate.
- Import: replaces or loads from version-aware JSON the tool understands.
- **Assumption:** Unknown/newer `formatVersion` fails closed with clear error (no partial silent load).
- Local prefs (UI Scale, pan) unchanged by export / not in JSON (UJ-1).
- MVP import may be replace-all; merge/re-map = Soon FR-28 (§8.6 — confirm at UX if MVP needs safer import).

### Journeys that encode UX climax
- **UJ-1:** Export succeeds only when required Mappings bound; Unbound → blocked with clear count/list; map gaps and retry.
- **UJ-2:** Switch Skin; same Object type / State / view; Duo accents zone-orchestrated on mock; Sticky context feels instantaneous; side-by-side compare out of MVP.

---

## Skins & palette rules

### Palette (FR-1, FR-13)
- Closed set of named opaque colours; each entry: stable id, optional constant name, `#RRGGBB`.
- CRUD: create, rename, recolour (hex/picker), delete.
- Mapping UI never accepts free `#RRGGBB` in a Mapping slot; persisted values = Palette ids or explicitly Unbound.

### Skins CRUD (FR-14)
- Create, rename, duplicate, delete.
- Duplicate copies Mappings into new Skin identity.
- **Delete always shows confirmation**; cancel leaves Skin unchanged; confirm removes from switcher and project data.

### v1 Skin display names (FR-15) — use these, not rejected names

| Display name | Base | Control accents | Header LEDs |
|---|---|---|---|
| `Black/Green` | Current Black | Greens | Greens (confirm current MC behaviour during Collect) |
| `Cream/Green` | Current Cream | Greens | Same as Black/Green LEDs policy |
| `Black/Duo` | Black | Blue (Patch) / Orange (Master) via Orchestrator | Duo LED yellow Palette entry |
| `Cream/Duo` | Cream | Blue / Orange via Orchestrator | Duo LED yellow Palette entry |
| `Monochrome` | Black | Grey | Grey |

- Rejected display names: `Black/Two-tone`, `Cream/Two-tone`, `Split`.
- Duo Patch/Master accents simulated as **Orchestrator zones on the mock**, not frozen into generic Object types.
- Bootstrap can seed `Black/Green` and `Cream/Green` from current Black/Cream inventory (FR-17).

### Duo LED yellow (FR-16)
- Fresh Duo-capable Palette includes entry default `#FFCC00` (id/name chosen at implementation; meaning = Duo header LED yellow).
- Operator can change hex; preview + export reflect new value.
- Duo Header LED Property Mappings reference that Palette id — not raw `#FFCC00` on Mapping path.

### Widgets / zones
- Object types stay **generic**; product zones (Patch vs Master, Header, …) known only via Orchestrator simulation on mock (Glossary, FR-15, §10).
- Skin Studio simulates Looks visually; does not implement C++ Looks (Glossary).

---

## Empty / error / edge states mentioned

| State | Behaviour | Source |
|---|---|---|
| **Unbound required Mappings** | Visible count + locate detail; export blocked / disabled with explicit reason | FR-3, UJ-1 |
| **Deleted Palette id still referenced** | Mappings become Unbound (not silent hex sub) | FR-13 |
| **No prior selection on Skin switch** | Sticky context does not invent a selection | FR-2 |
| **Import unknown/newer formatVersion** | Fail closed with clear error (assumption) | FR-21 |
| **Skin delete** | Always confirm; cancel = no change | FR-14 |
| **Export target incomplete** | Hard gate until all required slots for target Skins bound | FR-3, SM-1 |
| **MVP import wipe risk** | Replace-all may be MVP default; safer merge = Soon / UX confirm | §8.6, addendum |

No dedicated empty-state copy, onboarding empty project, or offline/storage-quota UX is specified in the PRD package.

---

## Soon / V2 (intent only — not MVP exit criteria)

### Soon (FR-22…FR-28) — capability intent; full consequences when pulled into sprint
- **FR-22:** Where-used for a Palette id (including **flashing / highlighting** corresponding mock regions) + rename/refactor ids with reference updates.
- **FR-23:** Side-by-side compare mode (at least Black/Green vs Cream/Green; Duo accent checks).
- **FR-24:** Replace-colour: Palette id X → Y within a Skin (or scoped set).
- **FR-25:** Search Object types/Properties + zoom GUI view to selection.
- **FR-26:** Draft vs ready for Skins/packages. Assumption: Ready adds export policy layer on top of FR-3; **exact rules deferred to UX**.
- **FR-27:** Simple contrast advisories (not full WCAG productization).
- **FR-28:** Collect re-import merges / re-maps rather than wiping operator work by default.
- Paint-bucket accent sweeps: Soon (unless UX marks trivial).
- Narrow soft layout for narrow screens: optional Soon without expanding MVP desktop chrome (FR-12 NOTE).

### V2 / parked (§4.6) — do not pull into MVP without course correction
- Layers tree; named history panel; JSON/Dev Mode inspect; comments; object×property matrix; alias tokens; contributor tooling; denser chrome variants; keyboard-only power modes.
- Optional left Palette rail (parked relative to MVP; may revisit with Soon chrome polish).
- External contributors shipping non-Black/Cream-derived Skins via JSON once Matrix-Control import is stable.

---

## Open for architecture/Collect (not UX to decide)

| Topic | Owner | Notes |
|---|---|---|
| JSON packing (one global vs one file per Skin) | Architecture after Collect | §8.1; not frozen |
| Web stack (vanilla vs light framework) | Architecture | Prefer simplicity §8.2 |
| Collect inventory home (`docs/` vs shared MC note) | Collect / ops | §8.3 |
| Exact Object types / Properties / States inventory | Collect | Blocks schema freeze + precise required-Mapping enumeration §8.4 |
| Alpha/darken/dim → solid opaque RGB candidates list | Collect | True overlays stay out of Studio |
| Black/Green & Cream/Green Header LED greens confirmation | Collect | FR-15 table |
| Tool hosting (mirror / submodule into Matrix-Control later) | Architecture / ops | §8.7; not MVP product blocker |
| Final JSON field names (e.g. illustrative `paletteColorId`) | Architecture | Addendum sketch only |
| Orchestrator zone rules storage (beside Skins vs MC-only) | Architecture / MC | Product rule = simulation on mock |
| Exact coalesce timing | UX **and** architecture | Assumption 300–500 ms |

---

## Gaps where UX still needs to invent

Items either explicitly deferred to UX, or absent from PRD while required for DESIGN/EXPERIENCE work:

1. **Microcopy** — Unbound warning wording; export-blocked reason strings; Skin-delete confirm text; import fail-closed messages; no PRD copy provided.
2. **Sidebar information architecture** — Order/grouping of Palette vs picker vs Skin/Object type/State vs Mappings; density; expand/collapse; sticky Mapping section behaviour on sync (FR-5 says “focus” only).
3. **Empty / first-run states** — Empty project, empty Palette, no Skin selected, bootstrap vs blank start UX not specified.
4. **Pulse / highlight visuals (FR-5 MVP)** — Required that Mapping change pulses/briefly highlights regions; **exact motion, duration, colour, multi-instance behaviour** not specified (only coalesce timing called out as detail elsewhere).
5. **Unbound affordance design** — Count + “enough detail to locate gaps” required; UI pattern (badge, list, inline markers on Properties) not specified.
6. **Export control UX** — Disabled vs click-then-reject; placement in chrome; multi-Skin export-target picker if packing allows subsets (packing open).
7. **UI Scale + pan controls placement** — Discrete steps and input methods locked; chrome location / affordance not locked.
8. **Skin switcher presentation** — “Segmented / modes-like” only; overflow for five names, rename reflection, Duo vs Green visual distinction not specified.
9. **Mock fidelity details** — Match Figma composition/colours intent, not pixel JUCE; how close, which mock frames, Orchestrator zone visualization language for Patch/Master accents — UX to define within bar.
10. **Draft vs ready (FR-26)** — Exact Ready export policy rules deferred to UX when Soon is promoted.
11. **MVP import safety** — Confirm whether replace-all is acceptable or UX needs a safer MVP confirm/backup (§8.6).
12. **Paint-bucket** — If UX marks trivial, may re-enter MVP nicety; otherwise Soon — UX call on constrained picker.
13. **Soon soft narrow layout** — Optional; not MVP exit; UX may sketch without expanding desktop chrome.
14. **Contrast hints (FR-27)** — Advisory intent only; thresholds/UI not defined.
15. **Where-used flash (FR-22)** — Flash/highlight named for Soon; visual language can align with or extend MVP pulse — not specified.
16. **No accessibility / keyboard map for MVP** beyond pan arrow keys and “keyboard-only power modes” parked in V2.

---

## Source fidelity notes

- Finalize autofixes reflected in `prd.md`: FR-5 pulse is mandatory; FR-22 includes flash/highlight; FR-14 always-confirm delete; FR-20 explicit undo include/exclude; paint-bucket resolved to Soon; Figma aesthetic bar restored; Soon section marked intent-only.
- Reconcile docs used only to confirm intentional deltas and residual UX invent list — not to reopen locked decisions.
