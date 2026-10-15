import type { ProjectStore, Unsubscribe } from '../model/store'
import { clearEnvelopeKey, parseEnvelope, writeEnvelope } from './envelope'
import type { ProjectEnvelope } from './envelope'
import { PROJECT_ENVELOPE_KEY, PREFS_KEY } from './keys'
import { DEFAULT_PREFS, getDefaultPrefs, loadPrefs } from './prefs'
import type { PrefsDocument } from './prefs'
import {
  createMemoryStorage,
  getBrowserStorage,
  type PersistStorage,
} from './storage'

export type { PersistStorage, PrefsDocument, ProjectEnvelope }
export {
  createMemoryStorage,
  DEFAULT_PREFS,
  getBrowserStorage,
  getDefaultPrefs,
  loadPrefs,
  PREFS_KEY,
  PROJECT_ENVELOPE_KEY,
}

/**
 * Cold reopen: if a valid envelope exists, `apply` it into the store.
 * Missing key → leave empty boot store unchanged (no seed).
 * Corrupt / invalid → CLEAR bad key; leave empty store; never throw.
 */
export function restoreEnvelope(
  store: ProjectStore,
  storage: PersistStorage = getBrowserStorage(),
): void {
  let raw: string | null
  try {
    raw = storage.getItem(PROJECT_ENVELOPE_KEY)
  } catch {
    clearEnvelopeKey(storage)
    return
  }

  if (raw === null) {
    return
  }

  const envelope = parseEnvelope(raw)
  if (envelope === null) {
    clearEnvelopeKey(storage)
    return
  }

  store.apply({
    project: envelope.project,
    session: envelope.session,
  })
}

/**
 * Subscribe to store changes and persist `{ project, session }` synchronously.
 * Write failures fail soft (no throw into UI).
 */
export function attachAutosave(
  store: ProjectStore,
  storage: PersistStorage = getBrowserStorage(),
): Unsubscribe {
  return store.subscribe(() => {
    const { project, session } = store.getState()
    writeEnvelope(storage, { project, session })
  })
}
