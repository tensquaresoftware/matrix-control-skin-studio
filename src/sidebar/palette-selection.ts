/** Sidebar-local Palette selection — never stored in SessionUiState (AD-6). */
export type PaletteSelectionController = {
  getSelectedId: () => string | null
  setSelectedId: (id: string | null) => void
  subscribe: (listener: () => void) => () => void
}

export function createPaletteSelection(): PaletteSelectionController {
  let selectedId: string | null = null
  const listeners = new Set<() => void>()

  return {
    getSelectedId() {
      return selectedId
    },
    setSelectedId(id) {
      if (selectedId === id) return
      selectedId = id
      for (const listener of listeners) listener()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
