---
title: '5-3 Hard Export Gate and Single Project JSON'
type: 'feature'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'e427235d4e59b88960e4607086bc5258253134f7'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-5-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Export is still an always-disabled top-bar stub, and `io/` has no project-only JSON packing — so Skin Studio cannot hand off a complete project file, and there is no hard gate tying Export to the Unbound count from story 5-2.

**Approach:** Wire Export to the project-total `deriveUnbound` count (disable + English tooltip while n > 0; enable with accent when clear), and download one `.json` document that is the live `ProjectDocument` only (`formatVersion` writer pin `1`, all skins, Palette ids in mappings — never session, prefs, or raw hex).

## Boundaries & Constraints

**Always:**
- Hard gate only: while project-total unbound > 0, Export is visually disabled and non-activating; no soft “warn but allow” (FR-3 / AD-9).
- Gate truth = `deriveUnbound(project).length` from `model/` — same project-total as the Unbound pane badge; `io/` and chrome must not reimplement unbound math (AD-10 / AD-15).
- Tooltip when blocked: `Export blocked — {n} unbound mapping(s)` (English; UX-DR13).
- When unbound = 0: Export enabled with primary accent styling (DESIGN top-bar).
- Successful Export downloads one `.json` = whole `ProjectDocument` (all skins): `formatVersion: 1`, `palette`, `skins`, `inventory` — **not** session, Zoom, pan, or sidebar prefs (AD-5 / AD-8 / AD-9).
- Mappings in the file stay `paletteEntryId` strings (or null); never expand to raw hex (SM-2 / FR-1).
- No mandatory Markdown companion; packing is a single project JSON — not per-skin files.
- Serialize via `io/`; chrome owns the control + click → download glue. English UI only.
- **Decision DOWNLOAD_FILENAME = `matrix-control-skin-studio.json`:** download always uses this exact filename.
- **Decision DISABLED_TAB = ARIA_DISABLED_IN_TAB:** when blocked, Export stays in tab order (`aria-disabled="true"`, not native `disabled`); click / activation does nothing; visual uses export-disabled tokens; tooltip still shows.

**Never:**
- Import / file-picker / replace-all / fail-closed version checks (story 5-4) — leave Import inert.
- Changing `deriveUnbound`, Unbound pane, history stack, or autosave envelope shape.
- Soft-allow Export with warnings; multi-file / Markdown export; inventing Collect inventory to “pass” the gate.
- Including session or prefs in the download payload.
- Using native `disabled` on blocked Export (would skip Tab).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Blocked | `deriveUnbound` length n > 0 | Export muted + `aria-disabled`; in tab order; tooltip `Export blocked — {n} unbound mapping(s)`; click / Enter does nothing | N/A |
| Clear | n = 0 | Export enabled + accent; click downloads `matrix-control-skin-studio.json` | N/A |
| Empty inventory | Seed `objectTypes: []` ⇒ n = 0 | Export enabled (interim inventory gate) | N/A |
| Payload shape | Any clear export | Body is `ProjectDocument` only; no `session` / prefs keys | N/A |
| Mappings | Bound / unbound cleared | Exported mappings use Palette ids (or null), never hex | N/A |
| Live gate | Bind/unbind or Skin edits change n | Export disabled/enabled + tooltip update from store | N/A |
| Multi-skin | Gaps on one Skin only | Gate uses project-total (blocked until all Skins clear) | N/A |
| No Markdown | Clear export | Single `.json` only | N/A |

</frozen-after-approval>

## Code Map

- `src/io/index.ts` — Replace stub: project-only serialize (`ProjectDocument` → JSON string, writer pin `1`), unbound gate helper that calls `deriveUnbound` (count / blocked?), and browser download trigger (`Blob` + object URL + temporary `<a download>` with filename `matrix-control-skin-studio.json`). No Import yet.
- `src/model/palette-helpers.ts` (+ `src/model/index.ts`) — **Reuse** `deriveUnbound` only; do not fork completeness math.
- `src/model/types.ts` — `ProjectDocument` is the export shape (`formatVersion`, `palette`, `skins`, `inventory`).
- `src/chrome/index.ts` — Replace inert Export with live control: subscribe to store, sync `aria-disabled`/tooltip/accent from unbound count, click → `io` download when clear (guard when blocked); keep Import as `inertButton`; remove `data-chrome-inert="export"` when live.
- `src/styles/base.css` — Style blocked Export via `aria-disabled` + export-disabled tokens (not only `:disabled`); add enabled Export accent class when unbound = 0.
- `src/persist/` — **Do not** change envelope/prefs; export must not call `writeEnvelope` as the handoff artifact.
- `scripts/io-export-matrix.test.mjs` (new) + `package.json` `test` — Cover I/O matrix: blocked vs clear, payload keys (no session/prefs), `formatVersion: 1`, mappings stay ids, empty-inventory clear.
- `scripts/chrome-shell-matrix.test.mjs` — Stop treating Export as always-inert; assert gate + tooltip wiring (and optional accent / download hook with injectable download).
- Mock reference: `_bmad-output/planning-artifacts/ux-designs/.../mockups/export-blocked.html` — visual/tooltip intent only.
- Do **not** change: Unbound pane, history, Import stub, seed inventory content.

## Tasks & Acceptance

**Execution:**
- [x] `src/io/index.ts` -- Serialize project-only JSON + download + gate helpers using `deriveUnbound` -- AD-5 / AD-9 / AD-10
- [x] `src/chrome/index.ts` + `src/styles/base.css` -- Live Export control (hard gate, tooltip, accent when clear, click download) -- FR-3 / UX-DR13 / DESIGN
- [x] `scripts/io-export-matrix.test.mjs` (+ `package.json`) + `scripts/chrome-shell-matrix.test.mjs` -- Cover I/O matrix and chrome gate wiring; drop always-inert Export asserts -- edge coverage

**Acceptance Criteria:**
- Given project-total unbound n > 0, when the operator views Export, then it is visually disabled / non-activating with tooltip `Export blocked — {n} unbound mapping(s)`.
- Given unbound = 0, when the operator Exports, then a `.json` downloads containing the whole project only (`formatVersion` 1, all skins, Palette ids in mappings — not session/prefs, no Markdown companion).

### Review Findings

- [x] [Review][Patch] Pin defaultTriggerDownload: body append before click + revoke not synchronous [`scripts/io-export-matrix.test.mjs`]
- [x] [Review][Patch] Gate matrix: assert blocked for missing mapping or dangling palette id (not only null id) [`scripts/io-export-matrix.test.mjs`]
- [x] [Review][Patch] syncGate: use isExportBlocked(project) instead of unboundCount > 0 [`src/chrome/index.ts:197`]
- [x] [Review][Patch] Export hard-gate chrome test: restore URL/createElement mocks in finally [`scripts/chrome-shell-matrix.test.mjs:470`]
- [x] [Review][Defer] Blob URL revoke at setTimeout(0) may still be too early for some browsers [`src/io/index.ts:53`] — deferred: maybe-false; settle with real-browser download of non-trivial JSON (empty/corrupt file ⇒ raise delay)

**Rejected**
- `false` — Spec triage log / status / change-log hygiene: fix would edit the spec under review
- `false` — Overridable `filename` on `downloadProjectJson`: chrome uses default; param is test seam (prior triage)
- `false` — `downloadProjectJson` omits `isExportBlocked`: intentional caller contract; only chrome calls it and guards
- `false` — No `aria-label` beyond `title`: UX-DR13 specifies title tooltip
- `false` — Chrome download path never re-reads blob JSON: payload already locked in io-export matrix
- `low` rejected — Tab-order focusability unasserted: production button stays undislabled; mock `tabIndex: -1` would need harness redesign
- `low` rejected — Blocked-path unused `createElement` restore: test hygiene only
- `low` rejected — Blob MIME `application/json` unasserted: cosmetic
- `low` rejected — Multi-skin serialize “all skins” unasserted: `serializeProject` always copies `project.skins`; single-skin download already deep-equals skins
- `low` rejected — `document.body` null / append throw leak: SPA always has body; try/finally guard is outsized for this app

## Implementation Notes

- `io/`: `serializeProject` (pretty 2-space, pin `formatVersion: 1`), `unboundExportCount` / `isExportBlocked` / `exportBlockedTooltip` via `deriveUnbound`, `downloadProjectJson` with fixed filename + injectable `triggerDownload`.
- Chrome Export: `aria-disabled` + title when blocked; `.chrome-top-btn-export-ready` accent when clear; click guarded; Import remains inert.
- Matrices: `io-export-matrix` + chrome hard-gate/live-clear/download asserts; `npm test` 204/204 green.
- Review patches: download append + deferred revoke; polluted session/prefs serialize asserts; chrome clear→unbind + multi-skin project-total gate; defaultTriggerDownload + missing/dangling gate pins; syncGate via `isExportBlocked`; chrome mock restore in `finally`.

## Spec Change Log

## Review Triage Log

- `false` — Spec Intent “disabled” vs DISABLED_TAB aria: Decision in same frozen block is authoritative; product “disabled” ≠ native `disabled`
- `false` — sprint `in-progress` vs spec `in-review`: expected mid-build tracking, not a product defect
- `false` — Blocked Enter untested: HTML button activation fires `click`; existing click guard covers Enter/Space
- `medium` — Live gate clear→blocked (unbind) unasserted in chrome matrix — verified one-way bind-only coverage in `Export hard gate…`
- `medium` — `defaultTriggerDownload` revokes object URL immediately after click — verified `src/io/index.ts` sync revoke
- `false` — `filename` param overridable: chrome calls default; injectable param is test seam, production pin holds
- `false` — Nested extra props on palette/skins: well-formed `ProjectDocument` assumed; deep sanitize out of everyday path
- `low` rejected — Blob MIME `application/json` unasserted: cosmetic matrix gap
- `low` rejected — Blocked-path restores unused `createElement` stub: test hygiene only
- `medium` — Download anchor never appended to DOM — verified detached `<a>` click in `defaultTriggerDownload`
- `medium` — VG: chrome Export never multi-skin project-total — verified single-skin chrome fixture only
- `medium` — VG: serialize “no session/prefs” never feeds polluted input — verified fixtures lack those keys

## Design Notes

- **Gate vs pane:** Unbound pane may list only the active Skin; Export must use **project-total** length from the same `deriveUnbound` call — never “active Skin clear ⇒ allow export.”
- **Serialize:** Prefer a pure `serializeProject(project) → string` (pretty 2-space JSON) plus `downloadProjectJson(project, filename)` so matrices can assert the string without DOM. Chrome only calls download when gate is clear.
- **Accent / blocked:** Enabled Export uses a dedicated top-bar accent class; blocked uses `aria-disabled` + `--comp-export-disabled-*` visual twin (not native `disabled`).
- **Filename:** Constant `matrix-control-skin-studio.json` on the download anchor.
- **Empty seed:** With empty placeholder inventory, n = 0 and Export is enabled — intentional interim Completeness until Collect inventory lands (same as 5-2).

## Verification

**Commands:**
- `npm test` -- expected: all matrices green, including new io-export and updated chrome-shell asserts
- `npx tsc --noEmit` -- expected: clean when used by the matrix harness

**Manual checks:**
- With fixture inventory and unbound > 0: Export muted, tooltip shows count, click does nothing; bind all → accent Export → download opens as project-only JSON with `formatVersion: 1`
