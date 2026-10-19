import { looksLikeOpaqueHexToken, parseOpaqueHex } from './opaque-hex'
import type { Mapping, PaletteEntry, ProjectDocument } from './types'

/** One inventory slot lacking a resolvable Palette colour (AD-10). */
export type UnboundHit = {
  skinId: string
  skinDisplayName: string
  objectTypeId: string
  stateId: string
  propertyId: string
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

/** UI label for one Palette entry — `constantName` when set, else stable `id`. */
export function paletteEntryDisplayName(entry: PaletteEntry): string {
  return entry.constantName || entry.id
}

/**
 * Display label for a Palette id (SSOT with the Palette tab).
 * Missing entry → the raw id (or empty when null).
 */
export function resolvePaletteLabel(
  project: ProjectDocument,
  paletteEntryId: string | null,
): string {
  if (paletteEntryId == null) return ''
  const entry = project.palette.find((e) => e.id === paletteEntryId)
  if (!entry) return paletteEntryId
  return paletteEntryDisplayName(entry)
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
  const current = mappings[index]
  // Same binding → keep the array reference so callers can skip a no-op write.
  if (
    current.paletteEntryId === next.paletteEntryId &&
    current.objectTypeId === next.objectTypeId &&
    current.stateId === next.stateId &&
    current.propertyId === next.propertyId
  ) {
    return mappings as Mapping[]
  }
  return mappings.map((mapping, i) =>
    i === index ? { ...next } : mapping,
  )
}

/**
 * Every required inventory slot that cannot paint — missing Mapping,
 * `paletteEntryId` null, or id not in palette (or palette hex unreadable).
 * Completeness = Skin × ObjectType × State × Property from the **loaded**
 * inventory (AD-10). Empty inventory ⇒ no required slots. Orphan mappings
 * outside inventory are ignored.
 */
export function deriveUnbound(project: ProjectDocument): UnboundHit[] {
  const hits: UnboundHit[] = []
  for (const skin of project.skins) {
    for (const objectType of project.inventory.objectTypes) {
      for (const stateId of objectType.states) {
        for (const propertyId of objectType.properties) {
          const mapping = findMapping(skin.mappings, {
            objectTypeId: objectType.id,
            stateId,
            propertyId,
          })
          if (mapping != null && !isMappingUnbound(project, mapping)) {
            continue
          }
          hits.push({
            skinId: skin.id,
            skinDisplayName: skin.displayName,
            objectTypeId: objectType.id,
            stateId,
            propertyId,
          })
        }
      }
    }
  }
  return hits
}
