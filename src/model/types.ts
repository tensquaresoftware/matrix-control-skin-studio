/** Opaque `#RRGGBB` (or equivalent) — never used as a Mapping value. */
export type PaletteEntry = {
  id: string
  hex: string
  constantName?: string
}

/** objectTypeId × stateId × propertyId → paletteEntryId | null (unbound). */
export type Mapping = {
  objectTypeId: string
  stateId: string
  propertyId: string
  paletteEntryId: string | null
}

export type Skin = {
  id: string
  displayName: string
  mappings: Mapping[]
}

export type InventoryObjectType = {
  id: string
  states: string[]
  properties: string[]
}

/** Optional `source` lets story 1.3 mark `seed-placeholder` without reshaping types. */
export type Inventory = {
  objectTypes: InventoryObjectType[]
  source?: string
}

/** Writer pin `formatVersion: 1` (AD-4 / AD-14). */
export type ProjectDocument = {
  formatVersion: 1
  palette: PaletteEntry[]
  skins: Skin[]
  inventory: Inventory
}

/** Selection-only session slice (AD-6) — prefs live elsewhere. */
export type SessionUiState = {
  selectedObjectTypeId: string | null
  selectedStateId: string | null
  activeSkinId: string | null
}
