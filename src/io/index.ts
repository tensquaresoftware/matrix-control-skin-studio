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

/** Hard gate: blocked while project-total unbound > 0. */
export function isExportBlocked(project: ProjectDocument): boolean {
  return unboundExportCount(project) > 0
}

/** English tooltip while Export is blocked (UX-DR13). */
export function exportBlockedTooltip(unboundCount: number): string {
  return `Export blocked — ${unboundCount} unbound mapping(s)`
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

/** Lean project-shape checks aligned with export fields (not parseEnvelope). */
function isValidProjectShape(p: Record<string, unknown>): boolean {
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
 * Download project-only JSON. Caller must ensure the export gate is clear.
 * Filename defaults to {@link EXPORT_DOWNLOAD_FILENAME}.
 */
export function downloadProjectJson(
  project: ProjectDocument,
  filename: string = EXPORT_DOWNLOAD_FILENAME,
  options: DownloadProjectJsonOptions = {},
): void {
  const json = serializeProject(project)
  const blob = new Blob([json], { type: 'application/json' })
  const trigger = options.triggerDownload ?? defaultTriggerDownload
  trigger(blob, filename)
}
