import { deriveUnbound } from '../model/palette-helpers'
import type { ProjectDocument } from '../model/types'

/** Fixed download filename (story 5-3 DOWNLOAD_FILENAME). */
export const EXPORT_DOWNLOAD_FILENAME = 'matrix-control-skin-studio.json'

/** Writer pin for exported ProjectDocument JSON. */
export const EXPORT_FORMAT_VERSION = 1 as const

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
