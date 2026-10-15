import type { ProjectDocument, SessionUiState } from '../model/types'
import { PROJECT_ENVELOPE_KEY } from './keys'
import type { PersistStorage } from './storage'

export type ProjectEnvelope = {
  project: ProjectDocument
  session: SessionUiState
}

/** Parse + validate envelope JSON. Returns null when unreadable or invalid. */
export function parseEnvelope(raw: string): ProjectEnvelope | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (parsed === null || typeof parsed !== 'object') return null
  const o = parsed as Record<string, unknown>

  if (!isProjectDocument(o.project)) return null
  if (!isSessionUiState(o.session)) return null

  return {
    project: o.project,
    session: o.session,
  }
}

/** Soft-fail write of `{ project, session }` only — never prefs fields. */
export function writeEnvelope(
  storage: PersistStorage,
  envelope: ProjectEnvelope,
): void {
  try {
    const payload: ProjectEnvelope = {
      project: envelope.project,
      session: envelope.session,
    }
    storage.setItem(PROJECT_ENVELOPE_KEY, JSON.stringify(payload))
  } catch {
    // Storage quota / private mode — fail soft (no throw into UI).
  }
}

/** Soft-fail remove of a bad envelope key (CORRUPT_ENVELOPE = CLEAR). */
export function clearEnvelopeKey(storage: PersistStorage): void {
  try {
    storage.removeItem(PROJECT_ENVELOPE_KEY)
  } catch {
    // ignore
  }
}

function isProjectDocument(value: unknown): value is ProjectDocument {
  if (value === null || typeof value !== 'object') return false
  const p = value as Record<string, unknown>
  return p.formatVersion === 1
}

function isSessionUiState(value: unknown): value is SessionUiState {
  if (value === null || typeof value !== 'object') return false
  const s = value as Record<string, unknown>
  return (
    isNullableString(s.selectedObjectTypeId) &&
    isNullableString(s.selectedStateId) &&
    isNullableString(s.activeSkinId)
  )
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}
