# ASCII chrome simulations — Skin Studio MVP (draft for user pick)

## Full window (dark chrome)

```text
┌─ Skin Studio ──────────────────────────────────────────────────────────────────────────────┐
│ TOP BAR (see variants below)                                                               │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ CONTEXT STRIP:  Object: Knob large    State: Normal    Zoom: 100%    Skin: Black/Green     │
├───────────────────────────────────────────────────────────┬────────────────────────────────┤
│                                                           │ PICKER (fixed height)          │
│                                                           │  ┌─ HSV / RGB sliders ──────┐  │
│                     GUI VIEW (canvas)                     │  │  hue ████████░░░░        │  │
│              Figma-like Matrix-Control mock               │  │  sat ░░████░░░░          │  │
│                                                           │  │  val ██████░░░░          │  │
│           [selected region outline + pulse]               │  │  #FFCC00  [Apply]        │  │
│                                                           │  └──────────────────────────┘  │
│                                                           ├──── drag splitter ─────────────┤
│                                                           │ PALETTE (scroll, resizable)    │
│                                                           │  ■ bg_dark  #1A1A1A            │
│                                                           │  ■ led_duo  #FFCC00  ← active  │
│                                                           │  ■ accent_g #00AA55            │
│                                                           │  …                             │
│                                                           │  [+ Add]  [Delete…]            │
│                                                           ├──── drag splitter ─────────────┤
│                                                           │ OBJECT / STATE / MAPPINGS      │
│                                                           │  (see bottom-pane variants)    │
│                                                           ├──── drag splitter ─────────────┤
│                                                           │ UNBOUND (scroll, resizable)    │
│                                                           │  ⚠ 3 unbound                   │
│                                                           │  • Knob large · ring → …       │
│                                                           │  • Button · fill → …           │
│                                                           │  • LED · on → …                │
└───────────────────────────────────────────────────────────┴────────────────────────────────┘
```

---

## Q11 — Top bar variants

### A — Project left, Skins center, Zoom+Export right (recommended)

```text
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ [New] [Import]     [ Black/Green | Cream/Green | Black/Duo | Cream/Duo | Mono ]          │
│                                                              Zoom [100% ▾]  ↶ ↷  [Export] │
└──────────────────────────────────────────────────────────────────────────────────────────┘
     ↑ project ops              ↑ Skin switcher (modes)                         ↑ view+gate
```

### B — Skins left (look-first), project+view right

```text
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ [ Black/Green | Cream/Green | Black/Duo | Cream/Duo | Mono ]                             │
│                                    [New] [Import]   Zoom [100% ▾]  ↶ ↷  [Export]         │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Context strip (always under top bar — already decided)

```text
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ Object: Knob large    ·    State: Normal    ·    Zoom: 100%    ·    Skin: Black/Green    │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

Export when blocked:

```text
│ …  Zoom [100% ▾]  ↶ ↷  [Export ✕] │
                           └─ disabled; Unbound pane shows why
```

---

## Q10 — Bottom pane (OBJECT / STATE / MAPPINGS) variants

### A — Always-visible Object + State; Skin in secondary segment (recommended)

```text
┌─ Object / Mappings ─────────────────────────────────────────┐
│ [ Mappings ]  [ Skin ]     ← segmented; Mappings = default  │
├─────────────────────────────────────────────────────────────┤
│ Object type                                                 │
│  ( Knob large ▼ )                                           │
│                                                             │
│ State                                                       │
│  ( Normal | Hover | Down | Disabled )                       │
│                                                             │
│ Mappings                                      Skin: Black/… │
│  ┌ property ──────────── palette id ────────────────────┐   │
│  │ track_bg     →  ■ bg_dark                            │   │
│  │ ring         →  ■ accent_g         ← highlighted     │   │
│  │ value_fill   →  ○ Unbound          ← click → picker  │   │
│  │ led_on       →  ■ led_duo                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↕ scroll inside pane                │
└─────────────────────────────────────────────────────────────┘

When [ Skin ] selected instead:
┌─ Object / Mappings ─────────────────────────────────────────┐
│ [ Mappings ]  [ Skin ]                                      │
├─────────────────────────────────────────────────────────────┤
│ Skin name:  [ Black/Green          ]                        │
│ [ Duplicate Skin ]   [ Delete Skin… ]                       │
│ (no per-instance overrides — type-level only reminder)      │
└─────────────────────────────────────────────────────────────┘
```

### B — Accordion (one section open)

```text
┌─ Object / Mappings ─────────────────────────────────────────┐
│ ▸ Skin                                                      │
│ ▾ Object & State                                            │
│     Object ( Knob large ▼ )                                 │
│     State  ( Normal | Hover | Down )                        │
│ ▸ Mappings (4)                                              │
└─────────────────────────────────────────────────────────────┘
   ↑ more clicks to reach mappings during calibration
```

### A′ — denser rows (same IA as A, less chrome)

```text
│ [Mappings|Skin]                                             │
│ Object ( Knob large ▼ )   State: Normal Hover Down Disabled │
│ ─────────────────────────────────────────────────────────── │
│ track_bg      ■ bg_dark                                     │
│ ring          ■ accent_g   ◀                                │
│ value_fill    ○ — choose palette…                           │
│ led_on        ■ led_duo                                     │
```
```
