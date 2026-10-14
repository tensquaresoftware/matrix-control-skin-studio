---
title: "Product Brief: Matrix-Control Skin Studio"
status: ready
created: 2026-10-14
updated: 2026-10-14
source_baseline: docs/2026-10-14-Matrix-Control-Skin-Studio-Brief.md
adoption: absorb-without-reopening-scope
---

# Product Brief: Matrix-Control Skin Studio

## Executive Summary

**Matrix-Control Skin Studio** is a lightweight web editor for designing, calibrating, and exporting UI skins for the Matrix-Control JUCE plugin. It turns a palette of named opaque colours and per-object-type colour mappings into a machine-readable JSON contract that a later Matrix-Control BMad effort can implement in C++.

Figma already proved the aesthetic direction, but it cannot scale once several skins must bind every painted property to a named palette entry. Live in-plugin editing would be ideal for fidelity but is too costly before alpha. Skin Studio sits in between: a Figma-like simulation outside the audio process, with final visual validation always done in the real plugin.

This brief adopts the existing French product baseline without reopening decided scope. BMad planning for the tool lives in this separate repository; Matrix-Control remains the consumer of the exported JSON and the home of the later model-cleanup and skin-implementation work.

## The Problem

Matrix-Control already ships two symbolic skins (**Black**, **Cream**) with green-accented controls. For plugin v1 the team needs to refine those looks, rename them into a coherent family, and add three more skins — five total — while clarifying palette, tokens, looks, and orchestration so the model can scale beyond a hard-coded two-variant approach.

Today’s workarounds fail the job: Figma is too unstructured for palette-bound properties and multi-skin calibration; editing live inside the plugin is too risky before alpha; hand-editing hex in C++ does not produce a shared, reviewable contract. Without a dedicated studio, skin work either stalls the alpha campaign or hardens an unclear colour model.

## The Solution

A browser editor with two zones: a **GUI view** (Figma-like overall mock of Matrix-Control — readable composition, not a pixel-perfect JUCE clone) and a **sidebar** for palette, colour picker, skins, object types, states, and property→palette mappings. Edits update the view in real time. Persistence combines browser autosave with JSON file import/export; undo/redo is required. The tool does not ship audio or the JUCE plugin — only the editor and the JSON handoff. Aesthetic fidelity matches the current Figma mock; final sign-off is always in Matrix-Control after integration.

Feature inventory (UI Scale, pan/scroll, CRUD, bootstrap skins) is listed under Scope → MVP.

## Who This Serves

**Primary:** Guillaume (and BMad agents in this repo) calibrating Matrix-Control skins before alpha — fast visual iteration, palette discipline, and an export Matrix-Control can implement without guessing hex.

**Secondary (later, not MVP):** external design contributors delivering JSON mappings once the token model and plugin import path are stable.

## Success Criteria

1. Calibrate all five v1 skins on a credible overall mock.
2. Use only the named palette — no wild hex in mappings.
3. Export JSON that lets BMad/a developer implement skins in Matrix-Control without retyping guessed colours.
4. The follow-on Matrix-Control work leaves a clearer skin/look model (orchestrator injection, generic widgets).
5. The tool stays light enough not to single-handedly delay the plugin alpha campaign.

## Linked Loop with Matrix-Control

```text
Matrix-Control (current state)
        → [1] Collect — inventory colours, objects, properties, states, looks
        → [2] Conceptual cleanup — palette → tokens → skins → orchestrated injection
        → [3] Skin Studio (web) — simulate, edit, export JSON
        → [4] Matrix-Control sources — conform model + implement final skins
```

Collect and conceptual cleanup are Matrix-Control-side work guided by what the studio forces into named tokens. JSON is not auto-applied: a developer or BMad agent in Matrix-Control uses it as a machine-readable specification.

## Conceptual Model (target)

| Concept | Role |
|---|---|
| **Palette** | Closed set of named opaque colours (`kGreen4`, …) with `#RRGGBB` |
| **Token / element** | Coloured property of an object type for a given state |
| **Skin** | Mapping set: each token points to exactly one palette entry |
| **Look** | Colour (and optionally font) bundle injected into a generic widget at construction |
| **Orchestrator** | Sole place that knows product zones (Patch vs Master, Header, …) and chooses looks/colours for the active skin |

Non-negotiable for Duo skins: widgets stay generic; only the orchestrator knows Patch/Master.

## Scope

### MVP (first truly usable tool)

- Palette CRUD + picker + hex
- Skins CRUD (create / rename / duplicate / delete)
- Figma-like overall mock
- UI Scale (`50%`, `75%`, `100%` default, `125%`, `150%`, `175%`, `200%`) + pan/scroll X-Y (click-drag + arrow keys)
- Object selection (click or combo) + states + property→palette mappings
- Real-time preview (palette and mappings)
- Undo / redo
- Browser autosave + JSON file import/export
- Bootstrap from current Matrix-Control inventory (Black/Cream → `Black/Green` & `Cream/Green`)

View preference (UI Scale, pan position) is local session state and is **excluded from** the skin JSON export contract.

### Later (not MVP)

Desirable soon after MVP: “Where used”, lock delivered vs draft skins, simple contrast hints, optional side-by-side compare. V2 vision: external contributors may ship skins not derived from Black/Cream via JSON once tokens and the plugin import pipeline are stable — contributor tooling is out of MVP.

### Explicitly out of Skin Studio

- Live editing inside the plugin audio/UI process
- Full typography system (colour first)
- True UI overlays (lock film, modal dimming)
- Marketing site for the tool
- Exhaustive `SkinColourId` inventory in this brief (later Collect story)
- Final JSON schema freeze before a minimal object-types / properties / states inventory
- Implementing the Matrix-Control C++ skin refactor in this repository

## Target Skins for Matrix-Control v1

| Display name | Base | Control accents | Header LEDs |
|---|---|---|---|
| `Black/Green` | Current Black | Greens | Greens (confirm current behaviour) |
| `Cream/Green` | Current Cream | Greens | Same |
| `Black/Duo` | Black | Blue (Patch) / Orange (Master) via orchestrator | Green or yellow — open for calibration |
| `Cream/Duo` | Cream | Blue / Orange same | Green or yellow — open |
| `Monochrome` | Black | Grey | Grey |

## Output Contract

Export is **JSON only** (no mandatory companion Markdown). Exact schema is fixed in PRD/architecture — illustrative sketch in `addendum.md`. Do not freeze the schema before a minimal Collect inventory of object types, properties, and states. Version the format from day one for future contributor handoffs. Global file vs one file per skin is a PRD decision.

## Decided (do not reopen without cause)

- Separate BMad project from Matrix-Control; names: Matrix-Control Skin Studio / `matrix-control-skin-studio` / `Matrix-Control-Skin-Studio`
- Export JSON only; Figma-like mock (not pixel-perfect JUCE); generic widgets; Patch/Master only in the orchestrator
- Opaque `#RRGGBB` tokens in the studio; true-transparency overlays excluded from the editor; LEDs = fully-on colour in the studio (plugin may modulate intensity)
- GUI view: plugin-aligned UI Scale + pan/scroll X-Y as local prefs, excluded from JSON export
- MVP as scoped above — not contributor V2 first; v1 skin names as listed

## Open for PRD / Calibration

1. Duo Header LEDs: keep green, or introduce yellow (new palette entry)?
2. Exact `objectTypes` / properties / states list (from Collect inventory).
3. One global JSON vs one JSON per skin.
4. Minimal web stack (vanilla HTML/CSS/JS vs light framework) — prefer simplicity; decide in architecture.
5. Where Collect inventory lives (Skin Studio docs vs shared note from Matrix-Control).
