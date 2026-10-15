# Technology Verification Review — Architecture Spine

**Artifact:** `ARCHITECTURE-SPINE.md`  
**Reviewer lens:** technology verification (versions current, named tech exists & fits, greenfield starter defaults reality-checked)  
**Review date:** 2026-10-15  
**Verdict:** **PASS WITH GAPS**

---

## Scope of committed technology decisions

Only decisions that name a platform, library, API, or toolchain pin were verified. Pure product/architecture rules (AD-1, AD-3…AD-13 except hosting/stack bits) are out of this lens.

| Decision | Where committed | Claim |
| --- | --- | --- |
| Stack pin | AD-2, Stack table | Vite `8.3.4` + TypeScript `7.0.2` + vanilla DOM |
| UI approach | AD-2, Stack, Deferred | No React / Preact / Lit / other UI framework in MVP |
| Hosting | AD-12, Stack, Capability map | Static SPA via Vite (local or static file host); no server API |
| Persistence | AD-8, Stack, Deferred | `localStorage` for project + prefs; IndexedDB deferred |
| Handoff I/O | AD-9, Stack | JSON download + file picker import (browser APIs) |
| Target browsers | Stack | Desktop Chromium / Safari / Firefox evergreen |
| Structural seed | Structural Seed | `vite.config.ts`, `index.html`, `package.json`, `src/main.ts`, … |
| Explicit research claim | AD-2, `.memlog.md` | Pins verified via npm on 2026-10-15 |

---

## Verification method (this review)

Re-checked on **2026-10-15** (same calendar day as the spine claim):

| Check | Command / source | Result |
| --- | --- | --- |
| Vite latest | `npm view vite version` | **8.3.4** — matches spine |
| TypeScript latest | `npm view typescript version` | **7.0.2** — matches spine |
| Vite engines | `npm view vite@8.3.4 engines` | `node: ^20.19.0 \|\| >=22.12.0` |
| TypeScript engines | `npm view typescript@7.0.2 engines` | `node: >=16.20.0` |
| Dist-tags | `npm dist-tag ls vite` / `typescript` | both pins are **`latest`** |
| Greenfield starter | `create-vite@9.2.1` template `vanilla-ts` | exists; Vite `^8.3.0`, TypeScript `~6.0.2` |
| Official Vite guide | vite.dev/guide + create-vite README | `vanilla-ts` listed; Node 20.19+ / 22.12+ |
| Named alternatives | `npm view react\|preact\|lit version` | still published (19.3.1 / 11.0.1 / 3.3.3) |
| Vite 8 bundler identity | vite.dev blog + package deps | Vite 8 ships **Rolldown** internally; product pin remains “Vite” |

Parent claim that Vite `8.3.4` and TypeScript `7.0.2` were verified via npm on 2026-10-15 is **confirmed**.

---

## Decision-by-decision findings

### 1. Vite 8.3.4 — VERIFIED

- Package exists; `latest` == `8.3.4`.
- Spine labels it “Bundler / dev server” — accurate for product choice. Vite 8 uses Rolldown under the hood; the spine does **not** incorrectly pin Rollup/esbuild as the user-facing stack.
- Fits a greenfield static SPA with no backend (AD-12).
- Research evidence in spine: explicit “Verified pins … (npm, 2026-10-15)” + memlog `(version)` line — **not training-data assertion alone**.

### 2. TypeScript 7.0.2 — VERIFIED (with starter-default gap)

- Package exists; `latest` == `7.0.2` (GitHub release tag `v7.0.2` also present).
- Fits typed domain model / store / IO modules without a UI framework.
- Research evidence same as Vite — **confirmed**.
- **Gap:** official `create-vite` `vanilla-ts` starter still pins `"typescript": "~6.0.2"` while the spine pins npm latest `7.0.2`. Choosing latest over the template default is reasonable, but the spine does **not** record that it diverged from the starter pin or that TS 7 was smoke-checked with Vite 8.3.x beyond “npm latest exists.”

### 3. Vanilla DOM (no React / Preact / Lit) — REALITY-CHECKED / FITS

- Alternatives still exist on npm; rejecting them is a conscious product/stack choice, not a dead-tech avoidance.
- Official greenfield path exists: `npm create vite@latest -- --template vanilla-ts`.
- Memlog records weighed options (no-build / Preact / React) — decision rationale present.
- Fits light internal tool altitude (AD-2, Deferred “UI framework revisit”).

### 4. Hosting envelope (Vite static SPA) — FITS / CONFIRMED PATTERN

- Vite remains the standard way to serve/build a static SPA; AD-12 correctly excludes cloud/API/plugin embed for MVP.
- Not a version-sensitive claim beyond the Vite pin.

### 5. `localStorage` persistence — STANDARD API / ASSUMPTION TAGGED

- Web platform API; no library version to pin.
- Spine correctly tags quota sufficiency as `[ASSUMPTION]` and defers IndexedDB — good honesty.
- No web quota numbers researched in the spine; acceptable for an assumption, but **not** web-researched capacity evidence.

### 6. JSON download / file picker — STANDARD APIs / NOT LIBRARY-PINNED

- Classic `Blob` + object URL + `<a download>` and `<input type="file">` remain valid evergreen approaches.
- Spine does not name `showOpenFilePicker` / File System Access API — avoids over-committing to a narrower API. No action required.

### 7. Target browsers “current evergreen” — REASONABLE, UNPINNED

- No specific browser versions researched or cited.
- Acceptable for an internal desktop tool at this altitude; not a false claim, but **not** reality-checked against a compatibility matrix.

### 8. Greenfield structural seed vs official starter — PARTIAL MISMATCH

Official `vanilla-ts` (`create-vite@9.2.1`) includes:

- `index.html`, `package.json`, `tsconfig.json`, `src/main.ts`, `public/`, **no** `vite.config.ts`

Spine Structural Seed lists:

- `vite.config.ts` as a root file

`vite.config.ts` is valid and common once config is needed, but it is **not** the zero-config starter default. Minor: seed invents a file the official template omits without noting “add when needed.”

### 9. Node.js runtime — OMITTED FROM STACK TABLE

Vite `8.3.4` **requires** Node `^20.19.0 || >=22.12.0` (npm engines + official docs). The Stack table lists Platform / Bundler / Language / UI / Persistence / Handoff but **not** Node. That is a committed toolchain constraint implied by the Vite pin and was neither listed nor version-verified in the spine text (only Vite/TS pins were).

---

## What was clearly research-/reality-checked

1. Vite version pin (npm, dated in AD-2 + memlog) — **reconfirmed**.
2. TypeScript version pin (npm, dated) — **reconfirmed**.
3. Vanilla DOM + `vanilla-ts` as a real Vite starter path — **fits**.
4. Rejection of React/Preact/Lit as MVP UI libs — alternatives still live; choice still coherent.
5. Static SPA / no server — consistent with Vite greenfield defaults.

## What was asserted or left unchecked

1. **Node.js minimum** required by Vite 8 — missing from Stack; not cited.
2. **TypeScript 7.0.2 vs starter `~6.0.2`** — latest verified, starter default not acknowledged.
3. **`vite.config.ts` in structural seed** — not the official `vanilla-ts` default.
4. **Evergreen browser set** — no version matrix.
5. **`localStorage` capacity** — tagged assumption only (OK), not researched.

None of the unchecked items falsify the stack choice; they are documentation / starter-alignment gaps.

---

## Verdict rationale

Committed version pins that matter most (Vite, TypeScript) are current `latest` on npm and were explicitly marked as npm-verified on the architecture date. The stack combination (Vite + TypeScript + vanilla DOM + localStorage + static hosting) still exists and fits a greenfield Skin Studio MVP. Gaps are omissions and starter-default drift, not stale or invented technologies.

**PASS WITH GAPS** — do not block on tech currency; tighten Stack / seed notes before first scaffold if builders will follow `create-vite` literally.

---

## Top findings (actionable)

1. **Vite 8.3.4 and TypeScript 7.0.2 are current npm `latest` (reconfirmed 2026-10-15)** — research claim in AD-2 holds.
2. **Official `vanilla-ts` starter still pins TypeScript `~6.0.2`**, not `7.0.2` — spine chose latest without noting divergence or Vite+TS7 smoke check.
3. **Node `^20.19.0 \|\| >=22.12.0` is required by Vite 8.3.4 but absent from the Stack table** — implied toolchain fact never listed.
4. **Structural Seed lists `vite.config.ts`; official `vanilla-ts` has none** — starter default not mirrored.
5. **Browser evergreen + localStorage quota remain unresearched claims/assumptions** — acceptable if left as assumptions; do not treat as verified pins.

---

## Evidence trail (commands)

```bash
npm view vite version          # 8.3.4
npm view typescript version    # 7.0.2
npm view vite@8.3.4 engines    # node ^20.19.0 || >=22.12.0
# create-vite@9.2.1 template-vanilla-ts/package.json:
#   "typescript": "~6.0.2", "vite": "^8.3.0"
```
