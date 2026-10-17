/**
 * Bridges canvas Object-type hits → Sidebar: AUTO_MAPPINGS segment switch +
 * HIGHLIGHT_SCROLL_ONLY (no MappingFocus). Created once in chrome and passed
 * into canvas + sidebar mounts.
 */
export type CanvasSelectionSync = {
  /** Canvas calls after a hit interaction (including same-type re-click). */
  notifyCanvasHit: () => void
  /** Skin pane registers the Mappings segment switcher. */
  setSwitchToMappings: (fn: (() => void) | null) => void
  /** Mappings pane registers muted row highlight + scroll (no MappingFocus). */
  setHighlightScroll: (fn: (() => void) | null) => void
}

export function createCanvasSelectionSync(): CanvasSelectionSync {
  let switchToMappings: (() => void) | null = null
  let highlightScroll: (() => void) | null = null

  return {
    notifyCanvasHit() {
      // Segment first so Mapping rows are visible before scroll/highlight.
      switchToMappings?.()
      highlightScroll?.()
    },
    setSwitchToMappings(fn) {
      switchToMappings = fn
    },
    setHighlightScroll(fn) {
      highlightScroll = fn
    },
  }
}
