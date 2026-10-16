---
title: '2-1 Design Tokens and Typography'
type: 'feature'
created: '2026-10-16'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'd2f927818918408cf357f305ee21b7bf732ed66a'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Skin Studio still boots with a bare `system-ui` stylesheet — no DESIGN.md chrome tokens, no IBM Plex, no focus ring — so Epic 2 shell work has no visual contract to hang on.

**Approach:** Map DESIGN.md color, spacing, radius, typography, and component roles to CSS custom properties under `styles/`, load IBM Plex Sans + Mono via npm Fontsource packages, apply the type scale and dark chrome defaults on the document, and give focusable chrome controls a visible focus ring from `{colors.focus-ring}`. Restyle the Epic 1 New confirm modal with `modal-confirm` tokens so first paint stays coherent; do not build top-bar / sidebar / canvas chrome (Stories 2.2+).

## Boundaries & Constraints

**Always:**
- Token SSOT values come from DESIGN.md frontmatter (`colors`, `typography`, `rounded`, `spacing`, `components`). Emit them as CSS variables on `:root` (or equivalent document root) under `src/styles/`.
- Naming (agent decision): `--color-*`, `--space-*`, `--radius-*`, `--type-<role>-*` (family/size/weight/line-height/letter-spacing as needed), `--comp-<component>-*` for component roles. Component vars reference color/space/radius/type vars via `var(...)` where DESIGN.md uses `{colors.…}`-style aliases; resolve literals (sizes, durations, rgba scrim) directly.
- **Decision FONT_DELIVERY = FONTSOURCE:** add `@fontsource/ibm-plex-sans` and `@fontsource/ibm-plex-mono` as npm dependencies; import their CSS from the styles entry (lockfile-pinned, offline-friendly). Apply the typography scale roles (`ui`, `ui-strong`, `label`, `title-bar`, `mono`, `mono-sm`, `context`) as reusable CSS hooks (custom properties and/or utility classes) so later chrome can consume them without redefining faces.
- Document defaults: `body` uses chrome surface + primary text + `{typography.ui}` face/size. Visible `:focus-visible` ring on focusable chrome controls uses `{colors.focus-ring}` (`#7AA8FF`).
- Restyle `boot-surface` New confirm with `components.modal-confirm` tokens (scrim, surface, border, title/body text, destructive primary, secondary, radius) — keep Epic 1 behavior and English copy; swap inline light hex for token-backed styles/classes.
- Cover token presence + Palette exclusion + focus-ring rule with a Node matrix test that reads shipped CSS (and font wiring) from disk; keep `npm test` / `npm run build` green.

**Never:**
- Add project Palette colours (Duo `#FFCC00`, Black/Cream bases, Green/Grey control paints, etc.) as chrome brand tokens in `styles/`.
- Build top bar, context strip, sidebar, canvas layout, Zoom/Skin controls, pan, or prefs UI (Stories 2.2–2.5).
- Change `model/`, `seed/`, `persist/`, store apply paths, or New confirm/cancel semantics beyond visual restyle.
- Introduce a UI framework, CSS-in-JS runtime, or Tailwind (or similar) utility stack.
- Treat UX mockup HTML as a runtime dependency — reference only.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tokens present | Built/dev CSS from `src/styles/` | `:root` exposes DESIGN.md color, spacing, radius, and component-role variables used by chrome | N/A |
| Typography | Styles + fonts load | IBM Plex Sans/Mono available; type-scale roles map to Plex + DESIGN sizes/weights | Missing face falls back to system stack after Plex names |
| Focus ring | Keyboard focus on New / modal buttons | Visible ring uses focus-ring token `#7AA8FF` | Mouse click need not force ring (`:focus-visible`) |
| Palette exclusion | Inspect chrome token definitions | No Duo `#FFCC00` (or other Palette product colours) declared as chrome brand tokens | N/A |
| Boot modal restyle | Open New confirm | Modal uses dark `modal-confirm` tokens; Cancel / New still cancel-safe / seed-replace | Behavior unchanged from 1.5 |

</frozen-after-approval>

## Code Map

- `_bmad-output/planning-artifacts/ux-designs/ux-Matrix-Control-Skin-Studio-2026-10-15/DESIGN.md` (L5–172 frontmatter + L175–208) — SSOT hex/type/radius/spacing/component roles; Palette colours explicitly out of band
- `_bmad-output/implementation-artifacts/epic-2-context.md` — Epic 2 visual + `styles/` ownership; 2.1 precedes shell
- `src/styles/base.css` — today only box-sizing + `system-ui`; expand (or split sibling CSS imported by barrel) for `:root` tokens, type scale, focus-visible, body chrome defaults
- `src/styles/index.ts` — barrel already imports `./base.css`; import Fontsource CSS here (or dedicated module imported by barrel) — keep single styles entry from `main`
- `src/main.ts` — already imports `./styles`; do not reorder Epic 1 boot for this story beyond styles side effects
- `src/boot-surface.ts` — replace light inline modal hex with classes/vars from `modal-confirm` tokens; keep `applySeedBaseline` / copy / one-deep modal
- `package.json` — add `@fontsource/ibm-plex-sans` + `@fontsource/ibm-plex-mono`; extend `test` script for styles matrix
- `scripts/scaffold-matrix.test.mjs` — already asserts `base.css` exists; extend only if barrel/import shape changes
- `scripts/styles-matrix.test.mjs` (new) — assert token keys/hex samples, focus-ring rule, absence of Duo `#FFCC00` in chrome token CSS, Fontsource deps + styles imports
- Do **not** change: `src/model/**`, `src/seed/**`, `src/persist/**`, `src/chrome/` stub (layout is 2.2+), planning mockups

## Tasks & Acceptance

**Execution:**
- [x] `src/styles/` -- emit DESIGN.md CSS variables (color, spacing, radius, type scale, component roles); body chrome defaults; `:focus-visible` focus-ring -- UX-DR1/2/15/16 foundation
- [x] `package.json` + styles entry -- add `@fontsource/ibm-plex-sans` / `@fontsource/ibm-plex-mono` and import CSS -- FONTSOURCE / UX-DR2
- [x] `src/boot-surface.ts` -- restyle New confirm with `modal-confirm` tokens/classes; keep 1.5 behavior/copy -- coherent dark first paint
- [x] `scripts/styles-matrix.test.mjs` + `package.json` -- matrix for tokens, Palette exclusion, focus-ring, font wiring -- regression guard
- [x] `npm test` / `npm run build` -- green -- scaffold + Epic 1 matrices still pass

**Acceptance Criteria:**
- Given Epic 1 scaffold, when styles load, then CSS variables cover DESIGN.md color, spacing, radius, and component token roles.
- Given styles load, when chrome text renders, then IBM Plex Sans and IBM Plex Mono are applied per the typography scale.
- Given chrome token definitions, when inspected, then project Palette colours (including Duo `#FFCC00`) are not chrome brand tokens.
- Given keyboard focus on focusable chrome controls (boot New / modal actions), when focused, then the visible focus ring uses `{colors.focus-ring}`.
- Given `npm test` and `npm run build`, when they finish, then both exit 0 with the styles matrix covered.

## Implementation Notes

- Fontsource `5.3.0`: Sans 400/500/600 + Mono 400 imported from `src/styles/index.ts`.
- Chrome hex emitted lowercase in CSS (equivalent to DESIGN.md); component roles alias via `var(...)`.
- Boot New confirm uses `.boot-confirm-*` classes on `modal-confirm` tokens; behavior unchanged (boot-seed matrix).
- Styles matrix covers all I/O rows including boot modal token wiring; New confirm/cancel behavior remains in boot-seed matrix.
- Review patches: emit DESIGN component typography leaves + pulse repeats; drop dead `.boot-confirm-title`; tighten styles matrix (Fontsource weights, type font-weights, boot class hooks, `button:focus-visible`).

## Spec Change Log

## Review Triage Log

- `medium` — missing DESIGN.md component typography aliases + pulse `repeats` under `:root` while AC claims component-role coverage [src/styles/base.css:105-170] — verified: context-strip/picker/palette/mapping typography leaves and pulse-highlight.repeats absent; route patch
- `low` — `.boot-confirm-title` styled but never used by boot-surface [src/styles/base.css ~L275; src/boot-surface.ts] — verified dead CSS; route patch (delete unused rule)
- `medium` — Fontsource weight CSS imports not pinned (500/600 can drop while test passes) [scripts/styles-matrix.test.mjs; src/styles/index.ts:1-4] — verification-gap pre-verified; route patch
- `medium` — type-role matrix omits `--type-*-font-weight` (and related weight samples) [scripts/styles-matrix.test.mjs] — verification-gap pre-verified; route patch
- `medium` — boot class hooks for title/New/body/actions untested [src/boot-surface.ts; scripts/styles-matrix.test.mjs] — verification-gap pre-verified; route patch
- `medium` — focus-ring matrix does not require `button:focus-visible` (or peer selectors) [scripts/styles-matrix.test.mjs; src/styles/base.css] — verification-gap pre-verified; route patch
- `false` — sprint `in-progress` vs spec `in-review` [sprint-status.yaml] — expected mid-review; sprint sync to review is presentation step
- `low` rejected — boot control padding hardcoded `0.4rem 0.85rem` — cosmetic; DESIGN has no control-padding leaf; unlikely everyday harm
- `false` — modal `box-shadow` literal outside tokens — DESIGN.md defines no shadow tokens; tonal stacking allows modest elevation
- `low` rejected — Palette exclusion matrix only bans Duo `#FFCC00` — AC names Duo; broader product paints lack a stable chrome denylist without inventing hexes
- `false` — `.boot-title` uses title-bar scale — no frozen requirement for boot heading role; agent type-scale choice until chrome lands
- `false` — scaffold-matrix not updated for Fontsource barrel — Code Map assigns font wiring to styles matrix; scaffold still asserts `base.css` presence

## Design Notes

- Variable aliases: component tokens that reference other tokens in DESIGN.md should be `var(--color-…)` / `var(--space-…)` etc., not duplicated hex, so a later token tweak stays one edit.
- `rounded.full` (`9999px`) may be emitted for completeness but chrome must not introduce pill Skin chips (UX-DR16) — no Skin combo in this story.
- Selection/pulse outline tokens are defined now for later canvas stories; do not wire canvas selection UI here.
- Continuity: Story 1.5 frozen `NEW_SURFACE = BOOT_MINIMAL` and deferred full chrome to Epic 2; this story owns visual tokens + boot modal restyle only.

## Verification

**Commands:**
- `npm test` -- expected: exit 0 including new styles matrix
- `npm run build` -- expected: exit 0

**Manual checks (if no CLI):**
- `npm run dev` — dark app background, Plex on title/New, keyboard Tab shows `#7AA8FF` focus ring on New / modal buttons; New confirm modal is dark graphite, not white card
