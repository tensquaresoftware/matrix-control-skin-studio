import {
  looksLikeOpaqueHexToken,
  parseOpaqueHex,
} from '../model/opaque-hex'
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

  // Allow-list session fields only — strip prefs-like bleed from older/corrupt writes.
  return {
    project: o.project,
    session: pickSessionUiState(o.session),
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
      session: pickSessionUiState(envelope.session),
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

/**
 * Envelope gate: formatVersion 1 + array shapes + opaque palette hex +
 * Mapping.paletteEntryId is id-or-null (never hex-shaped, with or without `#`).
 */
function isProjectDocument(value: unknown): value is ProjectDocument {
  if (value === null || typeof value !== 'object') return false
  const p = value as Record<string, unknown>
  if (p.formatVersion !== 1) return false
  if (!isValidPalette(p.palette)) return false
  if (!Array.isArray(p.skins)) return false
  if (p.inventory === null || typeof p.inventory !== 'object') return false
  const inventory = p.inventory as Record<string, unknown>
  if (!Array.isArray(inventory.objectTypes)) return false
  return skinsHaveValidMappings(p.skins)
}

function isValidPalette(palette: unknown): boolean {
  if (!Array.isArray(palette)) return false
  for (const entry of palette) {
    if (entry === null || typeof entry !== 'object') return false
    const e = entry as Record<string, unknown>
    if (typeof e.id !== 'string' || e.id.length === 0) return false
    if (typeof e.hex !== 'string' || parseOpaqueHex(e.hex) === null) return false
    if (e.constantName !== undefined && typeof e.constantName !== 'string') {
      return false
    }
  }
  return true
}

function skinsHaveValidMappings(skins: unknown[]): boolean {
  for (const skin of skins) {
    if (skin === null || typeof skin !== 'object') return false
    const mappings = (skin as Record<string, unknown>).mappings
    if (!Array.isArray(mappings)) return false
    for (const mapping of mappings) {
      if (!isValidMappingPaletteEntryId(mapping)) return false
    }
  }
  return true
}

/** Mapping values are palette entry id or null — never raw / bare hex tokens. */
function isValidMappingPaletteEntryId(mapping: unknown): boolean {
  if (mapping === null || typeof mapping !== 'object') return false
  const id = (mapping as Record<string, unknown>).paletteEntryId
  if (id === null) return true
  if (typeof id !== 'string' || id.length === 0) return false
  return !looksLikeOpaqueHexToken(id)
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

function pickSessionUiState(session: SessionUiState): SessionUiState {
  return {
    selectedObjectTypeId: session.selectedObjectTypeId,
    selectedStateId: session.selectedStateId,
    activeSkinId: session.activeSkinId,
  }
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}
