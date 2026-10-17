import type { Inventory, PaletteEntry, Skin } from '../model/types'

function freezePalette(entries: PaletteEntry[]): readonly PaletteEntry[] {
  for (const entry of entries) Object.freeze(entry)
  return Object.freeze(entries)
}

function freezeSkins(skins: Skin[]): readonly Skin[] {
  for (const skin of skins) {
    Object.freeze(skin.mappings)
    Object.freeze(skin)
  }
  return Object.freeze(skins)
}

function freezeInventory(inventory: Inventory): Readonly<Inventory> {
  Object.freeze(inventory.objectTypes)
  return Object.freeze(inventory)
}

/**
 * Seed Palette baseline:
 * - Duo LED yellow (FR-16)
 * - Patch Blue / Master Orange Orchestrator band colours (FR-15 / DUO_ZONE_COLOURS)
 */
export const SEED_PALETTE = freezePalette([
  {
    id: 'duoLedYellow',
    hex: '#FFCC00',
    constantName: 'kDuoLedYellow',
  },
  {
    id: 'patchZoneBlue',
    hex: '#3D7EFF',
    constantName: 'kPatchZoneBlue',
  },
  {
    id: 'masterZoneOrange',
    hex: '#FF8A1F',
    constantName: 'kMasterZoneOrange',
  },
])

/** v1 skin display names only — kebab ids derived from display names. */
export const SEED_SKINS = freezeSkins([
  { id: 'black-green', displayName: 'Black/Green', mappings: [] },
  { id: 'cream-green', displayName: 'Cream/Green', mappings: [] },
  { id: 'black-duo', displayName: 'Black/Duo', mappings: [] },
  { id: 'cream-duo', displayName: 'Cream/Duo', mappings: [] },
  { id: 'monochrome', displayName: 'Monochrome', mappings: [] },
])

/** Placeholder inventory — Collect (or a later fixture) fills content later. */
export const SEED_INVENTORY = freezeInventory({
  source: 'seed-placeholder',
  objectTypes: [],
})
