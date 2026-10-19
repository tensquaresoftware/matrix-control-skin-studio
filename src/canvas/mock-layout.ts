import type { Inventory } from '../model/types'

/** Seed Palette id for the Patch Orchestrator band (calibratable on every Skin). */
export const PALETTE_ID_PATCH_ZONE = 'blue'

/** Seed Palette id for the Master Orchestrator band (calibratable on every Skin). */
export const PALETTE_ID_MASTER_ZONE = 'orange'

/** Seed Palette id for the Duo Header LED face. */
export const PALETTE_ID_DUO_LED = 'yellow'

export type OrchestratorZoneRole = 'patch' | 'master' | 'headerLed'

export type OrchestratorZoneDescriptor = {
  id: string
  role: OrchestratorZoneRole
  /** Palette entry to paint via `resolvePaletteHex` — never Mapping hex. */
  paletteEntryId: string
  label: string
}

export type ObjectTypeHitRegion = {
  objectTypeId: string
}

/**
 * Zone role → provisional seed ObjectType id (Lot A / CLICK_SURFACE = A).
 * Bands remain paint metadata; selection targets inventory ids only when loaded.
 */
const ZONE_ROLE_OBJECT_TYPE_ID: Readonly<
  Record<OrchestratorZoneRole, string>
> = Object.freeze({
  headerLed: 'headerLed',
  patch: 'patchBand',
  master: 'masterBand',
})

/** Structural composition of the GUI-view mock (Header / Body / Footer). */
export const MOCK_COMPOSITION = {
  title: 'Matrix-Control',
  bodyColumns: ['patch', 'master'] as const,
  footerFaderCount: 3,
  greenLedCount: 2,
} as const

/**
 * Orchestrator zones are canvas layout metadata — not Inventory ObjectTypes.
 * Band colours resolve through Palette ids (ALWAYS_ON for every Skin).
 */
export const ORCHESTRATOR_ZONES: readonly OrchestratorZoneDescriptor[] = Object.freeze([
  {
    id: 'zone-patch',
    role: 'patch',
    paletteEntryId: PALETTE_ID_PATCH_ZONE,
    label: 'Orchestrator zone',
  },
  {
    id: 'zone-master',
    role: 'master',
    paletteEntryId: PALETTE_ID_MASTER_ZONE,
    label: 'Orchestrator zone',
  },
  {
    id: 'zone-header-duo-led',
    role: 'headerLed',
    paletteEntryId: PALETTE_ID_DUO_LED,
    label: 'Duo LED',
  },
])

/** Palette ids referenced by Orchestrator zone metadata (for seed/matrix asserts). */
export function orchestratorZonePaletteIds(): readonly string[] {
  return ORCHESTRATOR_ZONES.map((zone) => zone.paletteEntryId)
}

/** Provisional ObjectType id associated with a zone role (bridge helper). */
export function objectTypeIdForZoneRole(role: OrchestratorZoneRole): string {
  return ZONE_ROLE_OBJECT_TYPE_ID[role]
}

/**
 * Selectable ObjectType id for a painted zone when that id is in the loaded
 * inventory with at least one state × property slot; otherwise null (AD-10).
 */
export function resolveZoneSelectableObjectTypeId(
  role: OrchestratorZoneRole,
  inventory: Inventory,
): string | null {
  const objectTypeId = objectTypeIdForZoneRole(role)
  const objectType = inventory.objectTypes.find(
    (type) => type.id === objectTypeId,
  )
  if (objectType == null) return null
  if (objectType.states.length === 0 || objectType.properties.length === 0) {
    return null
  }
  return objectTypeId
}

/**
 * Clickable Object-type regions exist only for ids present in the loaded inventory.
 * Empty `objectTypes` → zero regions (no invented Collect types).
 */
export function listObjectTypeHitRegions(
  inventory: Inventory,
): ObjectTypeHitRegion[] {
  const regions: ObjectTypeHitRegion[] = []
  for (const objectType of inventory.objectTypes) {
    if (typeof objectType.id !== 'string' || objectType.id.length === 0) continue
    regions.push({ objectTypeId: objectType.id })
  }
  return regions
}

/** True when an id is an Orchestrator zone descriptor — never an inventory ObjectType. */
export function isOrchestratorZoneId(id: string): boolean {
  return ORCHESTRATOR_ZONES.some((zone) => zone.id === id)
}
