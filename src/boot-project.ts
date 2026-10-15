import type { ProjectStore } from './model/store'
import {
  attachAutosave,
  getBrowserStorage,
  restoreEnvelope,
  type PersistStorage,
} from './persist/index'
import { applySeedBaseline } from './seed/index'

/**
 * Shared browser/test boot path: restore → attachAutosave → seed when nothing restored.
 * Returns whether a valid envelope was applied.
 */
export function bootProjectStore(
  store: ProjectStore,
  storage: PersistStorage = getBrowserStorage(),
): boolean {
  const restored = restoreEnvelope(store, storage)
  attachAutosave(store, storage)
  if (!restored) {
    applySeedBaseline(store)
  }
  return restored
}
