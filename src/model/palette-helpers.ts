import { parseOpaqueHex } from './opaque-hex'
import type { Mapping, ProjectDocument } from './types'

export type UnboundHit = {
  skinId: string
  skinDisplayName: string
  mapping: Mapping
}

/**
 * Resolve a Mapping's palette id to opaque `#RRGGBB`.
 * `null` / missing / invalid hex → unbound (no paint colour).
 */
export function resolvePaletteHex(
  project: ProjectDocument,
  paletteEntryId: string | null,
): string | null {
  if (paletteEntryId == null) return null
  const entry = project.palette.find((e) => e.id === paletteEntryId)
  if (!entry) return null
  return parseOpaqueHex(entry.hex)
}

/** True when the mapping has no resolvable Palette colour (null or dangling id). */
export function isMappingUnbound(
  project: ProjectDocument,
  mapping: Mapping,
): boolean {
  return resolvePaletteHex(project, mapping.paletteEntryId) === null
}

/**
 * Every mapping that cannot paint — `paletteEntryId` null or id not in palette
 * (or palette hex unreadable). Shared Unbound derive for Epic 4/5.
 */
export function deriveUnbound(project: ProjectDocument): UnboundHit[] {
  const hits: UnboundHit[] = []
  for (const skin of project.skins) {
    for (const mapping of skin.mappings) {
      if (isMappingUnbound(project, mapping)) {
        hits.push({
          skinId: skin.id,
          skinDisplayName: skin.displayName,
          mapping,
        })
      }
    }
  }
  return hits
}
