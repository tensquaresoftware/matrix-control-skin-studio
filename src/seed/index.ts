import { createEmptySession } from '../model/empty-project'
import type { ProjectStore } from '../model/store'
import type { ProjectDocument } from '../model/types'
import { SEED_INVENTORY, SEED_PALETTE, SEED_SKINS } from './seed-data'

export { SEED_INVENTORY, SEED_PALETTE, SEED_SKINS } from './seed-data'

/**
 * Pure factory for the v1 project baseline.
 * Callers may `store.apply({ project: createSeedProject() })` — this module never mutates the store.
 */
export function createSeedProject(): ProjectDocument {
  // Cast: structuredClone returns a mutable deep copy; SEED_* inputs are readonly from freeze.
  return structuredClone({
    formatVersion: 1 as const,
    palette: SEED_PALETTE,
    skins: SEED_SKINS,
    inventory: SEED_INVENTORY,
  }) as ProjectDocument
}

/**
 * Shared first-open / New path: seed project + empty session via single-writer `apply`.
 * No UI imports — callers own confirm and boot orchestration.
 */
export function applySeedBaseline(store: ProjectStore): void {
  store.apply({
    project: createSeedProject(),
    session: createEmptySession(),
  })
}
