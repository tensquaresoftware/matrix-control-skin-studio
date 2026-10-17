import type { InventoryObjectType } from './types'

/**
 * Keep State sticky across Object-type changes when the new type still lists it
 * (story 4-2 / 4-3). Otherwise fall back to the type’s first State.
 */
export function resolveStateAfterTypeChange(
  nextType: InventoryObjectType | null,
  previousStateId: string | null,
): string | null {
  if (nextType == null || nextType.states.length === 0) return null
  if (
    previousStateId != null &&
    nextType.states.includes(previousStateId)
  ) {
    return previousStateId
  }
  return nextType.states[0] ?? null
}
