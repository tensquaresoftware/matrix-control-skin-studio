---
name: 'Adversarial architecture review pass 2 — Matrix-Control Skin Studio spine'
type: architecture-review
lens: adversarial-recheck
status: complete
created: '2026-10-15'
spine: '../ARCHITECTURE-SPINE.md'
prior: './review-adversarial.md'
focus: 'Holes 1–5 from pass 1 only'
verdict: 'pass — previous critical holes closed'
---

# Adversarial Re-review (Pass 2)

## Scope

Re-check only whether pass-1 holes **(1)–(5)** are closed in the updated spine. Finding 6 (ids / delete / import session) out of scope.

## Verdict

**PASS.** The five mechanical holes that blocked parallel epic composition are closed by AD-4 / AD-14, AD-1 / AD-6 / AD-8, AD-3 / AD-15, and AD-9 / AD-10.

## Hole closure checklist

| # | Previous hole | Closed by | Status |
| --- | --- | --- | --- |
| 1 | Mapping / collection runtime shape unbound (array vs Record) | AD-4 binding shapes: `palette[]`, `skins[]`, `mappings[]` + triple uniqueness; AD-14 forbids alternate topologies | **Closed** |
| 2 | Inventory nested vs flat id lists | AD-4: `inventory.objectTypes: { id, states[], properties[] }[]` | **Closed** |
| 3 | SessionUiState vs prefs dual home; session not under store | AD-1 store mutates session; AD-6 session = selection + activeSkin only; AD-8 prefs = zoom/pan/sidebar only; envelope `{ project, session }` | **Closed** |
| 4 | Command / history / store path undefined | AD-3 + AD-15: UI → `history.execute` → `store.apply`; UI never `store.apply` | **Closed** |
| 5 | Unbound / export / paint reimplementable | AD-10 sole `deriveUnbound` in `model/`; AD-9 io asks model; AD-15 unbound + paint resolve owned by model helpers | **Closed** |

## Remaining critical holes (focus set)

None.

## Residual (non-blocking for this pass)

Command **kind inventory / coalesce-key-per-kind** and **id generation** (pass-1 Finding 6) remain thinner than an ideal closed union — not regressions of the five holes above; not critical for this re-review.
