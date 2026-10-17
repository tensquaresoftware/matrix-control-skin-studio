import type { Inventory } from '../model/types'

/** Seed Palette id for the Patch Orchestrator band (calibratable on every Skin). */
export const PALETTE_ID_PATCH_ZONE = 'patchZoneBlue'

/** Seed Palette id for the Master Orchestrator band (calibratable on every Skin). */
export const PALETTE_ID_MASTER_ZONE = 'masterZoneOrange'

/** Seed Palette id for the Duo Header LED face. */
export const PALETTE_ID_DUO_LED = 'duoLedYellow'

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
