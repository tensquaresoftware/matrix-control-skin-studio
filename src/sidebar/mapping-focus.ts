/** Sidebar-local focused Mapping row — never stored in SessionUiState. */
export type MappingFocusKey = {
  objectTypeId: string
  stateId: string
  propertyId: string
}

export type MappingFocusController = {
  getFocused: () => MappingFocusKey | null
  setFocused: (key: MappingFocusKey | null) => void
  subscribe: (listener: () => void) => () => void
}

export function createMappingFocus(): MappingFocusController {
  let focused: MappingFocusKey | null = null
  const listeners = new Set<() => void>()

  return {
    getFocused() {
      return focused
    },
    setFocused(key) {
      if (sameFocus(focused, key)) return
      focused = key
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

function sameFocus(
  a: MappingFocusKey | null,
  b: MappingFocusKey | null,
): boolean {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return (
    a.objectTypeId === b.objectTypeId &&
    a.stateId === b.stateId &&
    a.propertyId === b.propertyId
  )
}
