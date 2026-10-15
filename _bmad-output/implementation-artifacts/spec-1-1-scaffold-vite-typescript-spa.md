---
title: '1-1 Scaffold Vite TypeScript SPA'
type: 'feature'
created: '2026-10-15'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'c3114d449473728acee88a01ea27987a1e177da3'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Skin Studio has no runnable app shell yet — only planning artifacts — so later stories cannot land store, seed, or chrome on a real module graph.

**Approach:** Add a pinned Vite + TypeScript vanilla SPA at the repo root with the architecture module folders as stubs, a minimal boot surface, and install/dev scripts so the desktop browser can load Skin Studio.

## Boundaries & Constraints

**Always:**
- Pins: Vite `8.3.4`, TypeScript `7.0.2`, Node engines `^20.19.0 || >=22.12.0` (AD-2).
- Vanilla DOM/CSS only — TypeScript modules, no UI framework.
- Root `index.html` + `vite.config.ts`; `src/` modules: `model/`, `history/`, `persist/`, `io/`, `seed/`, `chrome/`, `canvas/`, `sidebar/`, `styles/` (stub entry points OK).
- kebab-case source files; English UI microcopy; npm as package manager with a committed lockfile.
- Minimal boot: mount `#app` and show the product name `Skin Studio` (no calibration chrome yet).

**Never:**
- React, Preact, Lit, Vue, Svelte, or other UI frameworks / JSX tooling.
- Store, seed data, localStorage, chrome layout, canvas, or sidebar behavior (stories 1.2+).
- Overwrite `_bmad/`, `_bmad-output/`, `.agents/`, `.cursor/`, `AGENTS.md`, `docs/`, or existing `.gitignore` ignore rules (may append only if a Vite/TS ignore is missing — currently already covered).
- Server API, accounts, or plugin-embedded hosting.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Happy path boot | Clean checkout; Node in engines range; `npm install` then `npm run dev` | Dev server serves SPA; browser shows `Skin Studio` in `#app`; no framework runtime | N/A |
| Production build | `npm run build` | `dist/` emitted without type/build errors | Fail the build on TS/Vite errors |
| Wrong Node (informational) | Node outside `engines` | Install/run may warn via `engines` field | Do not soft-polyfill; operator upgrades Node |

</frozen-after-approval>

## Code Map

- `README.md` -- stub title only; extend with install/dev/build commands for operators
- `.gitignore` -- already ignores `node_modules/`, `dist/`, `.vite/`; do not regress
- `_bmad-output/planning-artifacts/architecture/.../ARCHITECTURE-SPINE.md` -- AD-2 pins + Structural Seed folder tree (planning only; do not edit)
- `_bmad-output/implementation-artifacts/epic-1-context.md` -- Epic 1 stack/module constraints
- No existing `package.json`, `vite.config.ts`, `tsconfig*`, `index.html`, or `src/` -- greenfield create at repo root
- Do not touch BMad planning trees or agent config dirs listed in Boundaries

## Tasks & Acceptance

**Execution:**
- [x] `package.json` -- create with name/scripts (`dev`, `build`, `preview`), exact Vite/TS deps, and `engines` -- pin AD-2 and npm workflow
- [x] `package-lock.json` -- generate via `npm install` at pinned versions -- reproducible installs
- [x] `vite.config.ts` -- Vite 8 TS config at project root -- architecture requires explicit file
- [x] `tsconfig.json` (+ `tsconfig.node.json` if Vite needs it) -- strict TS for `src/` and config -- TypeScript 7 project
- [x] `index.html` -- Vite entry with `#app` root and script to `/src/main.ts` -- browser boot surface
- [x] `src/main.ts` -- import stub modules + mount minimal `Skin Studio` text into `#app` -- proves graph links without real features
- [x] `src/model/index.ts`, `src/history/index.ts`, `src/persist/index.ts`, `src/io/index.ts`, `src/seed/index.ts`, `src/chrome/index.ts`, `src/canvas/index.ts`, `src/sidebar/index.ts`, `src/styles/index.ts` -- stub barrel exports (empty or no-op) -- reserve architecture folders
- [x] `src/styles/base.css` -- minimal reset/base imported from `main` or `styles/index` -- styles module is real, not empty-only
- [x] `public/.gitkeep` -- keep empty public assets dir from Structural Seed -- future static assets
- [x] `README.md` -- document Node engines, `npm install`, `npm run dev` / `build` / `preview` -- operator can run Skin Studio

**Acceptance Criteria:**
- Given a clean checkout with Node in `^20.19.0 || >=22.12.0`, when `npm install` and `npm run dev` succeed, then a desktop browser loads the SPA and shows `Skin Studio` without React/Preact/Lit (or other UI framework) in dependencies or runtime.
- Given the installed toolchain, when `package.json` is inspected, then Vite is `8.3.4`, TypeScript is `7.0.2`, and `engines.node` matches AD-2.
- Given the repo tree after implementation, when `src/` is listed, then folders `model/`, `history/`, `persist/`, `io/`, `seed/`, `chrome/`, `canvas/`, `sidebar/`, and `styles/` exist with stub entry points, and root `vite.config.ts` plus `index.html` exist.
- Given a successful `npm run build`, when the build finishes, then `dist/` is produced with no TypeScript or Vite errors.

### Review Findings

- [x] [Review][Patch] Rewrite matrix tests without `--experimental-strip-types` so Node `^20.19.0` can run `npm test` (decision: rewrite) [package.json:13]
- [x] [Review][Patch] Entry `main.ts` never executed in matrix tests — silent-skip or dropped mount can still pass [scripts/scaffold-matrix.test.mjs:57-60]
- [x] [Review][Patch] Framework dependency matcher misses `react-dom` and `@lit/*` [scripts/scaffold-matrix.test.mjs:33-38]
- [x] [Review][Patch] Happy-path never asserts `scripts.dev` remains `vite` [scripts/scaffold-matrix.test.mjs:26-28]

#### Rejected

- `false` — Empty Spec Change Log: intent unchanged; Review Triage Log already records Build review patches.
- `false` — Spec `done` vs sprint `review`: expected mid code-review workflow states, not a product defect.
- Rejected (spec edit) — Stale Code Map / Design Notes / Verification / `review_loop_iteration` / triage-log wording: fix would edit the spec under review.
- `false` — README H1 “Matrix Control Skin Studio”: UI boot string is already `Skin Studio`; Build triage dismissed the same H1 claim.
- `false` — Dist CSS asset not asserted: happy-path already checks `base.css` + styles import; AC does not require a `dist` CSS chunk check.
- `low` rejected — Production test uses first `*.js` only: single-chunk scaffold today; unlikely everyday false pass.
- `low` rejected — Missing `execFileSync` build timeout: hang not demonstrated; defensive complexity for this scaffold.

## Implementation Notes

- Hand-authored greenfield scaffold (no create-vite leftover template).
- `tsconfig.node.json` omitted — Vite loads `vite.config.ts` without a separate Node project; `tsconfig.json` covers `src/` with `noEmit` + `tsc` gate in `build`.
- Added `scripts/scaffold-matrix.test.mjs` + `npm test` to cover I/O matrix rows (engines pin, happy-path structure/boot text, production `dist` emit).
- Verified: `npm install`, `npm run build`, `npm test` (3/3 pass). Dev smoke via served module content (full desktop browser open left to human walkthrough if desired).
- Review patches: `mountBootSurface` fail-fast; matrix tests execute mount + harden `dist` checks; README documents `npm test`.
- Code-review patches: `npm test` uses Node test runner only (compile `boot-surface.ts` via `tsc` CLI — no `--experimental-strip-types`); assert `main.ts` mounts `#app` without silent skip; widen framework dep matcher; pin `scripts.dev` / `preview`.

## Spec Change Log

## Review Triage Log

- `false` — README H1 “Matrix Control Skin Studio” vs Matrix-Control hyphen: pre-existing stub title style; product string in boot/UI is already `Skin Studio`; no operator-facing defect from the H1 wording.
- `low` — README omits `npm test`: real docs gap after adding the script; everyday developer friction; route patch (trivial line add).
- `medium` — `src/main.ts` silent skip when `#app` missing: confirmed `if (app)` leaves blank page; broken entry yields empty boot; route patch (fail-fast throw).
- `low` — boot uses `textContent` without `h1`: a11y outline polish beyond frozen minimal boot (“show Skin Studio”); reject (fix would add structure not required by intent).
- `false` — `tsconfig.json` excludes `vite.config.ts`: intentional per Implementation Notes / task “if Vite needs it”; empty `defineConfig` is type-checked by Vite load path; no build escape for app sources.
- `false` — “wrong Node” test only string-compares `engines.node`: matches frozen matrix row (informational engines field), not a runtime Node version simulator.
- `medium` — happy-path / production tests never execute mount (verification-gap, pre-verified): source/string greps stay green if assignment is inverted; route patch (execute mount + assert `dist` `#app`).
- `low` — tests omit `base.css` / styles import / stub side-effect imports / `public/.gitkeep`: real incomplete assertions for task checklist; route patch (extend same suite).
- `low` — production test assumes `dist/assets` without existence guard: Edge Case confirmed ENOENT risk; route patch.
- `false` — empty stub modules may tree-shake from `dist`: AC requires folders/stubs on disk, not retained empty chunks in the bundle; folders remain.
- `false` — sprint `in-progress` vs spec `in-review`: expected mid-workflow sync lag; status updates at closeout, not a product defect.
- `false` — empty Spec Change Log / Review Triage Log at review start: normal until this pass fills the triage log.
- `low` — missing favicon 404: not in intent/AC; reject (noise-only, would add assets out of scope).
- `medium` — Edge Case `#app` missing: same defect as silent skip above; grouped with that patch.
- `medium` — Edge Case unguarded `dist/assets` readdir: same as production-test guard above; grouped with test patch.
- `false` — Edge Case claim “strict TS for config”: same intentional tsconfig scope as above.

## Design Notes

Hand-author the scaffold (or `npm create vite@…` then immediately force pins/folders) — either is fine if the end state matches pins and Structural Seed. Prefer stub barrels `src/<module>/index.ts` exporting nothing or a named no-op so later stories replace contents without renaming folders. `main.ts` may side-effect-import stubs so the module graph is exercised by Vite; do not implement store/seed/persist logic here.

## Verification

**Commands:**
- `node -v` -- expected: satisfies `^20.19.0 || >=22.12.0`
- `npm install` -- expected: lockfile resolves Vite `8.3.4` and TypeScript `7.0.2`
- `npm run build` -- expected: exit 0; `dist/` present
- `npm test` -- expected: 3/3 matrix coverage tests pass
- `npm run dev` -- expected: server starts; manual open shows `Skin Studio` in page

**Manual checks (if no CLI):**
- DevTools: no React/Preact/Lit globals; Dependencies in `package.json` have no UI framework packages
