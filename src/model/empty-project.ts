import type { ProjectDocument, SessionUiState } from './types'

/** Empty baseline shared by boot and later seed replace. */
export function createEmptyProject(): ProjectDocument {
  return {
    formatVersion: 1,
    palette: [],
    skins: [],
    inventory: { objectTypes: [] },
  }
}

export function createEmptySession(): SessionUiState {
  return {
    selectedObjectTypeId: null,
    selectedStateId: null,
    activeSkinId: null,
  }
}
