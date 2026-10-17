/**
 * Bridges canvas Object-type hits → Sidebar: AUTO_MAPPINGS segment switch +
 * HIGHLIGHT_SCROLL_ONLY (no MappingFocus). Created once in chrome and passed
 * into canvas + sidebar mounts. Unbound pane reuses `switchToMappings` for
 * gap jumps (AD-16) without forking selection semantics.
 */
export type CanvasSelectionSync = {
  /** Canvas calls after a hit interaction (including same-type re-click). */
  notifyCanvasHit: () => void
  /** Skin pane registers the Mappings segment switcher. */
  setSwitchToMappings: (fn: (() => void) | null) => void
  /** Invoke the registered Mappings segment switch (no highlight/scroll). */
  switchToMappings: () => void
  /** Mappings pane registers muted row highlight + scroll (no MappingFocus). */
  setHighlightScroll: (fn: (() => void) | null) => void
}

export function createCanvasSelectionSync(): CanvasSelectionSync {
  let switchToMappingsFn: (() => void) | null = null
  let highlightScroll: (() => void) | null = null

  return {
    notifyCanvasHit() {
      // Segment first so Mapping rows are visible before scroll/highlight.
      switchToMappingsFn?.()
      highlightScroll?.()
    },
    setSwitchToMappings(fn) {
      switchToMappingsFn = fn
    },
    switchToMappings() {
      switchToMappingsFn?.()
    },
    setHighlightScroll(fn) {
      highlightScroll = fn
    },
  }
}
