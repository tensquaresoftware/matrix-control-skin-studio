# Brainstorm Intent — Skin Studio tools & UX

## 1. Session goal

Challenge missing tools, sharpen Figma/Photoshop-inspired ideas, and lock MVP vs later chrome for Skin Studio’s multi-skin calibration UX before PRD.

## 2. Hard constraints (not reopened)

- Studio is **not** a second Matrix-Control / audio host, and **not** a full typography or design-system editor in MVP.
- Mappings commit **named palette ids only** — no wild hex on the mapping path (hex only when editing a palette entry).
- Type-level mappings only; no per-instance overrides; LED preview always fully-on (no true overlays / adjustment layers).
- Chrome MVP: canvas + right sidebar + thin top bar; no bottom chrome; no Auto Layout / vector / effects panels.
- Duo Patch/Master accents stay zone-orchestrated on the mock — not painted into widgets.
- **Decided:** Duo header LEDs use golden yellow `#FFCC00` (not Matrix-12 green) for a fresher Duo read.

## 3. Chosen directions by horizon

### MVP
- **Chrome A1+B1+C1+D1+F2** — canvas + right sidebar + top segmented skin switcher + click-to-map + unbound count; disciplined calibration without a layers tree.
- **Sticky skin|type|state|pan/zoom** across skin switch — keeps the multi-skin A/B loop usable.
- **Canvas↔sidebar sync + coalesced undo** — selection scrolls mappings; rapid picker drags collapse to one history step.
- **Constrained picker / paint-bucket path** — substitute free hex with palette-id commits; paint-bucket optional for accent sweeps within MVP interaction model.

### Soon after MVP
- **Where-used + rename refactor** — find every use before rename/delete; flash affected mock regions.
- **Side-by-side compare (E2)** — calibrate Black/Green vs Cream/Green and Duo accents without freezing every colour in MVP.
- **Replace-colour remap + search/zoom-to-selection** — rebind palette entry X→Y per skin; navigate dense mock.
- **Draft vs ready lock, contrast hints, Collect import merge** — export intent clear; spot weak contrast early; re-import without wiping calibration.

### V2 / park
- Layers tree, named history panel, JSON/Dev Mode inspect, comments, object×property matrix, alias tokens, contributor tooling — denser studio envy, defer until inventory or collaboration demands it.

### Reject
- Auto Layout / vectors / effects; true overlays; free hex in mappings; Matrix-Control clone — wrong product hire; Studio wins on disciplined multi-skin contract, not illustration.

## 4. PRD feed points (max 8)

1. Require mapping UI to select only named palette ids; block wild hex on the mapping path.
2. Specify sticky context contract: skin switch preserves selected object, state, pan, and zoom.
3. MVP chrome: top skin modes switcher + unbound count signal; export warning or gate when unbound remain.
4. Bidirectional selection: mock click focuses mapping section; mapping change pulses where-used on mock (where-used full UX may be soon-after if scoped tight).
5. Undo coalesces rapid palette/picker micro-edits into single history steps.
6. Duo skins: header LEDs default to golden yellow `#FFCC00` (named palette entry), not Matrix-12 green — still calibrate via Studio, not locked forever in C++.
7. Post-MVP: Collect re-import is merge/re-map, not blind wipe of calibrated mappings; side-by-side compare remains for multi-skin A/B.
8. Open: optional left palette rail vs right-only swatches; inspector drawer on narrow viewports — confirm in PRD without expanding MVP chrome.

## 5. Recommended next skill

`/bmad-prd`
