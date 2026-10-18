import {
  looksLikeOpaqueHexToken,
  parseOpaqueHex,
} from '../model/opaque-hex'
import { deriveUnbound } from '../model/palette-helpers'
import type { ProjectDocument } from '../model/types'

/** Fixed download filename (story 5-3 DOWNLOAD_FILENAME). */
export const EXPORT_DOWNLOAD_FILENAME = 'matrix-control-skin-studio.json'

/** Writer pin for exported ProjectDocument JSON. */
export const EXPORT_FORMAT_VERSION = 1 as const

/** Fail-closed / malformed reasons for project-only Import parse. */
export type ParseProjectFailureReason =
  | 'unsupported-format-version'
  | 'invalid-project'

export type ParseProjectDocumentResult =
  | { ok: true; project: ProjectDocument }
  | { ok: false; reason: ParseProjectFailureReason }

/** Project-total unbound count — same derive as Unbound pane (AD-10). */
export function unboundExportCount(project: ProjectDocument): number {
  return deriveUnbound(project).length
}

/**
 * Hard gate: blocked while project-total unbound > 0, or when there is no
 * Skin to bind against a non-empty inventory completeness set.
 */
export function isExportBlocked(project: ProjectDocument): boolean {
  if (unboundExportCount(project) > 0) return true
  return (
    project.skins.length === 0 && inventoryHasRequiredSlots(project.inventory)
  )
}

/** English tooltip while Export is blocked by unbound count (UX-DR13). */
export function exportBlockedTooltip(unboundCount: number): string {
  return `Export blocked — ${unboundCount} unbound mapping(s)`
}

/** Live Export title while gated; null when clear. */
export function exportGateTitle(project: ProjectDocument): string | null {
  if (!isExportBlocked(project)) return null
  const unboundCount = unboundExportCount(project)
  if (unboundCount > 0) return exportBlockedTooltip(unboundCount)
  return 'Export blocked — add at least one Skin'
}

/** Inventory defines at least one ObjectType × State × Property slot. */
function inventoryHasRequiredSlots(
  inventory: ProjectDocument['inventory'],
): boolean {
  for (const objectType of inventory.objectTypes) {
    if (objectType.states.length > 0 && objectType.properties.length > 0) {
      return true
    }
  }
  return false
}

/**
 * Serialize the live project only (pretty 2-space JSON).
 * Pins `formatVersion` to 1; never includes session or prefs.
 */
export function serializeProject(project: ProjectDocument): string {
  const doc: ProjectDocument = {
    formatVersion: EXPORT_FORMAT_VERSION,
    palette: project.palette,
    skins: project.skins,
    inventory: project.inventory,
  }
  return JSON.stringify(doc, null, 2)
}

/**
 * Parse + validate a project-only handoff JSON (Export shape).
 * Rejects autosave envelopes; fail-closed on unknown/newer formatVersion.
 */
export function parseProjectDocument(raw: string): ParseProjectDocumentResult {
  let parsed: unknown
  try {
    // Strip UTF-8 BOM — some editors prefix otherwise-valid JSON.
    parsed = JSON.parse(raw.replace(/^\uFEFF/, ''))
  } catch {
    return { ok: false, reason: 'invalid-project' }
  }

  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    Array.isArray(parsed)
  ) {
    return { ok: false, reason: 'invalid-project' }
  }
  const o = parsed as Record<string, unknown>

  // Envelope `{ project, session }` is not a handoff document.
  if (Object.hasOwn(o, 'project') && Object.hasOwn(o, 'session')) {
    return { ok: false, reason: 'invalid-project' }
  }

  if (o.formatVersion !== EXPORT_FORMAT_VERSION) {
    return { ok: false, reason: 'unsupported-format-version' }
  }

  if (!isValidProjectShape(o)) {
    return { ok: false, reason: 'invalid-project' }
  }

  return {
    ok: true,
    project: {
      formatVersion: EXPORT_FORMAT_VERSION,
      palette: o.palette as ProjectDocument['palette'],
      skins: o.skins as ProjectDocument['skins'],
      inventory: o.inventory as ProjectDocument['inventory'],
    },
  }
}

/**
 * Lean project-shape checks aligned with export fields + what deriveUnbound
 * consumes (not parseEnvelope). Fail-closed on missing structural fields.
 */
function isValidProjectShape(p: Record<string, unknown>): boolean {
  if (!isValidPalette(p.palette)) return false
  if (!Array.isArray(p.skins) || !skinsHaveValidShape(p.skins)) return false
  return isValidInventory(p.inventory)
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

function isValidInventory(inventory: unknown): boolean {
  if (inventory === null || typeof inventory !== 'object') return false
  const objectTypes = (inventory as Record<string, unknown>).objectTypes
  if (!Array.isArray(objectTypes)) return false
  for (const objectType of objectTypes) {
    if (objectType === null || typeof objectType !== 'object') return false
    const ot = objectType as Record<string, unknown>
    if (typeof ot.id !== 'string' || ot.id.length === 0) return false
    if (!isStringIdArray(ot.states) || !isStringIdArray(ot.properties)) {
      return false
    }
  }
  return true
}

function isStringIdArray(value: unknown): boolean {
  if (!Array.isArray(value)) return false
  return value.every((entry) => typeof entry === 'string')
}

function skinsHaveValidShape(skins: unknown[]): boolean {
  for (const skin of skins) {
    if (skin === null || typeof skin !== 'object') return false
    const s = skin as Record<string, unknown>
    if (typeof s.id !== 'string' || s.id.length === 0) return false
    if (typeof s.displayName !== 'string') return false
    if (!Array.isArray(s.mappings)) return false
    for (const mapping of s.mappings) {
      if (!isValidMapping(mapping)) return false
    }
  }
  return true
}

/** Mapping keys + palette entry id or null — never raw / bare hex tokens. */
function isValidMapping(mapping: unknown): boolean {
  if (mapping === null || typeof mapping !== 'object') return false
  const m = mapping as Record<string, unknown>
  if (typeof m.objectTypeId !== 'string' || m.objectTypeId.length === 0) {
    return false
  }
  if (typeof m.stateId !== 'string' || m.stateId.length === 0) return false
  if (typeof m.propertyId !== 'string' || m.propertyId.length === 0) {
    return false
  }
  const id = m.paletteEntryId
  if (id === null) return true
  if (typeof id !== 'string' || id.length === 0) return false
  return !looksLikeOpaqueHexToken(id)
}

export type DownloadProjectJsonOptions = {
  /** Override browser download trigger (tests). */
  triggerDownload?: (blob: Blob, filename: string) => void
}

function defaultTriggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.setAttribute('href', url)
  anchor.setAttribute('download', filename)
  anchor.setAttribute('rel', 'noopener')
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 0)
}

/**
 * Download project-only JSON when the hard export gate is clear; otherwise no-op.
 * Filename defaults to {@link EXPORT_DOWNLOAD_FILENAME}.
 */
export function downloadProjectJson(
  project: ProjectDocument,
  filename: string = EXPORT_DOWNLOAD_FILENAME,
  options: DownloadProjectJsonOptions = {},
): void {
  if (isExportBlocked(project)) return
  const json = serializeProject(project)
  const blob = new Blob([json], { type: 'application/json' })
  const trigger = options.triggerDownload ?? defaultTriggerDownload
  trigger(blob, filename)
}
