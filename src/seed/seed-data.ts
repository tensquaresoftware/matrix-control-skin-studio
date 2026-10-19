import type { Inventory, Mapping, PaletteEntry, Skin } from '../model/types'

function freezePalette(entries: PaletteEntry[]): readonly PaletteEntry[] {
  for (const entry of entries) Object.freeze(entry)
  return Object.freeze(entries)
}

function freezeSkins(skins: Skin[]): readonly Skin[] {
  for (const skin of skins) {
    for (const mapping of skin.mappings) Object.freeze(mapping)
    Object.freeze(skin.mappings)
    Object.freeze(skin)
  }
  return Object.freeze(skins)
}

function freezeInventory(inventory: Inventory): Readonly<Inventory> {
  for (const objectType of inventory.objectTypes) {
    Object.freeze(objectType.states)
    Object.freeze(objectType.properties)
    Object.freeze(objectType)
  }
  Object.freeze(inventory.objectTypes)
  return Object.freeze(inventory)
}

/**
 * Seed Palette — colour-only ids/constantNames (Lot A).
 * Usage roles live on ObjectType properties, never on Palette names.
 * Hex baselines unchanged from Duo LED yellow / Patch blue / Master orange.
 */
export const SEED_PALETTE = freezePalette([
  {
    id: 'yellow',
    hex: '#FFCC00',
    constantName: 'kYellow',
  },
  {
    id: 'blue',
    hex: '#3D7EFF',
    constantName: 'kBlue',
  },
  {
    id: 'orange',
    hex: '#FF8A1F',
    constantName: 'kOrange',
  },
])

/**
 * Provisional seed ObjectTypes for mapping practice (Lot A).
 * Collect (or a later fixture) replaces this content — never Collect-final.
 * Keep `inventory.source: "seed-placeholder"`.
 */
const SEED_OBJECT_TYPES = [
  { id: 'headerLed', states: ['default'], properties: ['fill'] },
  { id: 'patchBand', states: ['default'], properties: ['fill'] },
  { id: 'masterBand', states: ['default'], properties: ['fill'] },
] as const

/** headerLed→yellow, patchBand→blue, masterBand→orange — primary `fill` @ `default`. */
const SEED_FILL_BINDINGS: readonly Mapping[] = Object.freeze([
  {
    objectTypeId: 'headerLed',
    stateId: 'default',
    propertyId: 'fill',
    paletteEntryId: 'yellow',
  },
  {
    objectTypeId: 'patchBand',
    stateId: 'default',
    propertyId: 'fill',
    paletteEntryId: 'blue',
  },
  {
    objectTypeId: 'masterBand',
    stateId: 'default',
    propertyId: 'fill',
    paletteEntryId: 'orange',
  },
])

function seedMappings(): Mapping[] {
  return SEED_FILL_BINDINGS.map((mapping) => ({ ...mapping }))
}

/** v1 skin display names only — kebab ids derived from display names. */
export const SEED_SKINS = freezeSkins([
  { id: 'black-green', displayName: 'Black/Green', mappings: seedMappings() },
  { id: 'cream-green', displayName: 'Cream/Green', mappings: seedMappings() },
  { id: 'black-duo', displayName: 'Black/Duo', mappings: seedMappings() },
  { id: 'cream-duo', displayName: 'Cream/Duo', mappings: seedMappings() },
  { id: 'monochrome', displayName: 'Monochrome', mappings: seedMappings() },
])

/**
 * Placeholder inventory — Collect (or a later fixture) replaces this content later.
 * Provisional ObjectTypes are an explicit seed fixture, not Matrix-Control Collect truth.
 */
export const SEED_INVENTORY = freezeInventory({
  source: 'seed-placeholder',
  objectTypes: SEED_OBJECT_TYPES.map((objectType) => ({
    id: objectType.id,
    states: [...objectType.states],
    properties: [...objectType.properties],
  })),
})
