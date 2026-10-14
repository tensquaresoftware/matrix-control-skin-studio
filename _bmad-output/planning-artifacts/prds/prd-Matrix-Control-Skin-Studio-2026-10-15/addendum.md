# Addendum — Matrix-Control Skin Studio PRD

Companion to `prd.md`. Holds depth that must not dilute the PRD spine: illustrative contracts, rejected alternatives, research echoes, and mechanism notes for architecture/UX.

## Illustrative JSON sketch (NOT frozen)

Do not treat this as the schema. Freeze only after minimal Collect inventory of Object types, Properties, and States. Packing (global vs per-Skin) remains open in PRD §8.

```json
{
  "formatVersion": 1,
  "palette": [
    {
      "id": "duoLedYellow",
      "constantName": "kDuoLedYellow",
      "hex": "#FFCC00"
    },
    {
      "id": "green4",
      "constantName": "kGreen4",
      "hex": "#00DDAD"
    }
  ],
  "objectTypes": [
    {
      "id": "headerLed",
      "states": ["on"],
      "properties": ["face"]
    }
  ],
  "skins": [
    {
      "id": "black-duo",
      "displayName": "Black/Duo",
      "mappings": [
        {
          "objectTypeId": "headerLed",
          "state": "on",
          "property": "face",
          "paletteColorId": "duoLedYellow"
        }
      ]
    }
  ]
}
```

Notes for architecture:
- Field name `paletteColorId` illustrates a **Palette id** reference (Glossary); final JSON field names are an architecture decision.
- Mappings reference Palette ids only (never raw hex).
- UI Scale / pan never appear in export JSON.
- Orchestrator zone rules (Patch vs Master accent injection) may live beside Skins or in Matrix-Control only — product rule is simulation on mock, not baking zones into generic widgets.

## Rejected alternatives (rationale)

| Alternative | Why rejected |
|---|---|
| Soft Unbound export (warn only) | Chosen hard gate (PRD FR-3) so handoff cannot silently ship holes before alpha. |
| Left Palette rail in MVP | Preserves winning chrome (canvas + right Sidebar + thin Top bar); rail is polish/Soon at best. |
| Narrow bottom inspector as MVP exit | Would expand MVP desktop chrome; defer to UX soft layout. |
| Free hex on Mapping path | Breaks Palette discipline and multi-Skin refactor. |
| Pixel-perfect JUCE clone / second Matrix-Control | Wrong hire; fidelity sign-off stays in the real plugin. |
| Auto Layout / vectors / overlays | Figma feature envy; not the calibration job. |
| Duo LED = Matrix-12 green | Product decision: golden yellow `#FFCC00` as calibratable Palette entry. |
| Freeze JSON packing in PRD | Blocked on Collect inventory — premature freeze creates rework. |
| Contributor tooling / V2 first | Brief non-negotiable: MVP for Guillaume calibration loop. |

## Options considered — Unbound export

- **A Warn-only:** faster iteration, weak handoff trust.
- **B Hard gate (selected):** export blocked while required Mappings remain Unbound.
- **C Warn now + gate on ready later:** attractive once draft/ready (Soon) exists; MVP has no ready flag yet, so B is the MVP rule; C may supersede or layer on B when FR-26 lands.

## Landscape echoes (non-binding)

Patterns that reinforced existing decisions (see Discovery research digest):
- Bind UI slots by token / Palette id (Figma Variables / design-token practice).
- Treat Unbound as first-class state; fail closed on handoff.
- Draft vs ready as a later release gate (Tokens Studio–like) — mapped to Soon FR-26, not MVP.
- Fixed widget surface / closed bindable slots (plugin UIDescription editors) — aligns with Collect-driven Object types.

Explicitly ignored for this internal tool: multi-format token export, SaaS collab, WCAG-as-product, bitmap knob pipelines, Style Dictionary beyond JSON.

## Collect checklist echoes (for Matrix-Control Collect, not Skin Studio MVP)

Carry into Collect planning (not frozen schema):
- Inventory colours / Object types / Properties / States / Looks (including ColourChart and variant anchors as reference, not exhaustive PRD content).
- Flag alpha / darken / dim usages that should become **solid opaque RGB** Palette candidates in Skin Studio.
- True-transparency overlays remain out of Skin Studio; do not invent overlay editing here.
- Confirm current Black/Cream Header LED greens before locking Green-Skin LED Mappings.

## Mechanism / transport notes (for architecture)

- Autosave: local browser persistence sufficient for a single operator; no cloud sync in MVP.
- MVP import may be replace-all; merge / re-map is Soon (FR-28).
- Coalesced undo timing is a UX/architecture detail (~300–500 ms assumption in PRD).
- Web stack: prefer boring/simple; decide in architecture, not in the PRD.

## Persona depth (inline only)

Primary operator is Guillaume (+ BMad agents in-repo). No standalone persona section in the PRD; journeys UJ-1/UJ-2 carry context. Secondary external contributors remain V2.
