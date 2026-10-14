---
title: "Addendum: Matrix-Control Skin Studio Product Brief"
status: ready
created: 2026-10-14
updated: 2026-10-14
---

# Addendum — depth for PRD / architecture

Material preserved from the source baseline that belongs downstream or is too detailed for the executive brief. Decisions are not reopened here.

## Source baseline absorbed

- Primary SSOT adopted: `docs/2026-10-14-Matrix-Control-Skin-Studio-Brief.md` (this repo)
- Read-only mirror (do not edit from Skin Studio chats): Matrix-Control  
  `Documentation/Development/Plans/2026/10/2026-10-14-Matrix-Control-Skin-Studio-Brief.md`
- Palette context (read-only, not inventoried here): `ColourChart.h` / `SkinColours*.h` in Matrix-Control

## Illustrative JSON sketch (not a frozen schema)

```json
{
  "formatVersion": 1,
  "exportedAt": "2026-10-14T22:00:00Z",
  "palette": [
    { "id": "green4", "constantName": "kGreen4", "hex": "#00DDAD" }
  ],
  "objectTypes": [
    {
      "id": "slider",
      "displayName": "Slider",
      "states": ["normal", "disabled", "focus"],
      "properties": ["background", "track", "valueBar", "text", "focusBorder"]
    }
  ],
  "skins": [
    {
      "id": "black-green",
      "displayName": "Black/Green",
      "locked": false,
      "mappings": [
        {
          "objectTypeId": "slider",
          "state": "normal",
          "property": "valueBar",
          "paletteColorId": "green4"
        }
      ]
    }
  ]
}
```

Freeze only after a minimal Collect inventory of object types, properties, and states.

## Collect inventory (Matrix-Control — linked, not this MVP)

Document without rewriting yet:

- Shared palette (`ColourChart`, `k…` constants)
- Current skin associations (`blackVariant` / `creamVariant` on named elements)
- Runtime colour IDs (`SkinColourId`, etc.)
- Widget looks (background, track, text, focus border, …)
- Painted states: normal, hover, focus, disabled, on/off, button-like variants, …
- Alpha usages: darken/dim shortcuts → solid RGB candidates; true overlays → stay out of Skin Studio

## Rejected naming

- `Black/Two-tone`, `Cream/Two-tone` — too vague
- `Split` — rejected; **`Duo`** retained

## Organization notes

| Topic | Decision |
|---|---|
| BMad steering | Separate project `matrix-control-skin-studio` |
| Tool code location | Dedicated repo (mirror folder or submodule later — architecture) |
| Design SSOT during calibration | Skin Studio + exported JSON |
| Runtime SSOT | Matrix-Control sources after integration |
| Languages | French for Guillaume chat / source brief; English for BMad technical artifacts in this repo |

## Suggested BMad chain after this brief

1. `/bmad-prd` — MVP boundaries, acceptance criteria, JSON direction
2. UX design specs
3. Light architecture (data, persistence, editor UI structure)
4. Epics & stories → MVP implementation
5. Parallel or follow-on Matrix-Control effort: model conformance + alpha-shortcut replacement + final skins from JSON

## Explicit non-goals for this adoption run

- No HTML/CSS/JS implementation in the product-brief chat
- No Matrix-Control C++ refactor from this chat
- No exhaustive `SkinColourId` inventory here
- No commit / push / PR unless Guillaume asks
