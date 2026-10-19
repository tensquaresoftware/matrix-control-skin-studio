import { execute } from '../history/index'
import { resolveStateAfterTypeChange } from '../model/session-helpers'
import type { ProjectStore } from '../model/store'
import type { InventoryObjectType, SessionUiState } from '../model/types'

const EMPTY_GLYPH = '—'

export type ObjectStateControls = {
  objectWrap: HTMLElement
  stateWrap: HTMLElement
}

/**
 * Living Object / State selects (Lot B top bar). Same sticky State rules as the
 * former Mappings editors — session write only; empty shows `—`.
 */
export function mountObjectStateControls(store: ProjectStore): ObjectStateControls {
  const objectWrap = document.createElement('span')
  objectWrap.className = 'chrome-combo'
  objectWrap.setAttribute('data-chrome-object', '')

  const objectSelectId = 'chrome-object-type-select'
  const objectLabel = document.createElement('label')
  objectLabel.className = 'chrome-combo-label'
  objectLabel.setAttribute('for', objectSelectId)
  objectLabel.textContent = 'Object:'

  const objectSelect = document.createElement('select')
  objectSelect.id = objectSelectId
  objectSelect.className = 'chrome-combo-select chrome-object-select'
  objectSelect.setAttribute('data-mappings-object-type', '')
  objectSelect.setAttribute('data-chrome-object-select', '')
  objectSelect.setAttribute('data-context-value', 'object')

  objectWrap.append(objectLabel, objectSelect)

  const stateWrap = document.createElement('span')
  stateWrap.className = 'chrome-combo'
  stateWrap.setAttribute('data-chrome-state', '')

  const stateSelectId = 'chrome-state-select'
  const stateLabel = document.createElement('label')
  stateLabel.className = 'chrome-combo-label'
  stateLabel.setAttribute('for', stateSelectId)
  stateLabel.textContent = 'State:'

  const stateSelect = document.createElement('select')
  stateSelect.id = stateSelectId
  stateSelect.className = 'chrome-combo-select chrome-state-select'
  stateSelect.setAttribute('data-mappings-state', '')
  stateSelect.setAttribute('data-chrome-state-select', '')
  stateSelect.setAttribute('data-context-value', 'state')

  stateWrap.append(stateLabel, stateSelect)

  let syncing = false

  const resolveObjectType = (
    objectTypes: readonly InventoryObjectType[],
    objectTypeId: string | null,
  ): InventoryObjectType | null => {
    if (objectTypeId == null) return null
    return objectTypes.find((type) => type.id === objectTypeId) ?? null
  }

  const fillSelect = (
    select: HTMLSelectElement,
    options: readonly { value: string; label: string }[],
    selected: string | null,
  ): void => {
    select.replaceChildren()
    const empty = document.createElement('option')
    empty.value = ''
    empty.textContent = EMPTY_GLYPH
    select.append(empty)
    for (const option of options) {
      const el = document.createElement('option')
      el.value = option.value
      el.textContent = option.label
      select.append(el)
    }
    select.value = selected ?? ''
    select.disabled = options.length === 0
  }

  const render = (): void => {
    const { project, session } = store.getState()
    const objectTypes = project.inventory.objectTypes
    const selectedType = resolveObjectType(
      objectTypes,
      session.selectedObjectTypeId,
    )

    syncing = true
    try {
      fillSelect(
        objectSelect,
        objectTypes.map((type) => ({ value: type.id, label: type.id })),
        selectedType?.id ?? null,
      )

      const states = selectedType?.states ?? []
      const stateSelected =
        session.selectedStateId != null &&
        states.includes(session.selectedStateId)
          ? session.selectedStateId
          : null
      fillSelect(
        stateSelect,
        states.map((stateId) => ({ value: stateId, label: stateId })),
        stateSelected,
      )
    } finally {
      syncing = false
    }
  }

  objectSelect.addEventListener('change', () => {
    if (syncing) return
    const { project, session } = store.getState()
    const nextTypeId = objectSelect.value === '' ? null : objectSelect.value
    const nextType = resolveObjectType(project.inventory.objectTypes, nextTypeId)
    const nextStateId = resolveStateAfterTypeChange(
      nextType,
      session.selectedStateId,
    )
    const nextSession: SessionUiState = {
      ...session,
      selectedObjectTypeId: nextTypeId,
      selectedStateId: nextStateId,
    }
    execute(store, { session: nextSession })
  })

  stateSelect.addEventListener('change', () => {
    if (syncing) return
    const { session } = store.getState()
    const nextStateId = stateSelect.value === '' ? null : stateSelect.value
    const nextSession: SessionUiState = {
      ...session,
      selectedStateId: nextStateId,
    }
    execute(store, { session: nextSession })
  })

  render()
  store.subscribe(render)

  return { objectWrap, stateWrap }
}
