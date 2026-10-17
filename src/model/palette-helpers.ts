import { looksLikeOpaqueHexToken, parseOpaqueHex } from './opaque-hex'
import type { Mapping, ProjectDocument } from './types'

export type UnboundHit = {
  skinId: string
  skinDisplayName: string
  mapping: Mapping
}

export type MappingTriple = {
  objectTypeId: string
  stateId: string
  propertyId: string
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

/** Find the type-level Mapping for `(objectTypeId, stateId, propertyId)`. */
export function findMapping(
  mappings: readonly Mapping[],
  triple: MappingTriple,
): Mapping | undefined {
  return mappings.find(
    (mapping) =>
      mapping.objectTypeId === triple.objectTypeId &&
      mapping.stateId === triple.stateId &&
      mapping.propertyId === triple.propertyId,
  )
}

/**
 * Upsert one Mapping by uniqueness `(objectTypeId, stateId, propertyId)`.
 * Rejects hex-shaped `paletteEntryId` values (FR-1) — returns `mappings` unchanged.
 */
export function upsertMapping(
  mappings: readonly Mapping[],
  next: Mapping,
): Mapping[] {
  if (
    next.paletteEntryId != null &&
    looksLikeOpaqueHexToken(next.paletteEntryId)
  ) {
    // Same reference → callers can skip a no-op store write.
    return mappings as Mapping[]
  }
  const index = mappings.findIndex(
    (mapping) =>
      mapping.objectTypeId === next.objectTypeId &&
      mapping.stateId === next.stateId &&
      mapping.propertyId === next.propertyId,
  )
  if (index < 0) {
    return [...mappings, { ...next }]
  }
  return mappings.map((mapping, i) =>
    i === index ? { ...next } : mapping,
  )
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
