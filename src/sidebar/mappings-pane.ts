import { execute } from '../history/index'
import {
  findMapping,
  isMappingUnbound,
  resolvePaletteHex,
  upsertMapping,
} from '../model/palette-helpers'
import { resolveStateAfterTypeChange } from '../model/session-helpers'
import type { ProjectStore } from '../model/store'
import type {
  InventoryObjectType,
  Mapping,
  ProjectDocument,
  SessionUiState,
  Skin,
} from '../model/types'
import type { CanvasSelectionSync } from './canvas-selection-sync'
import type { MappingFocusController, MappingFocusKey } from './mapping-focus'

export type MountMappingsPaneOptions = {
  selectionSync?: CanvasSelectionSync
}

/**
 * Mappings tab: Object type + State always visible; Property → Palette-id rows
 * for the active pair (FR-18). Session writes keep the chrome context strip in sync.
 */
export function mountMappingsPane(
  host: HTMLElement,
  store: ProjectStore,
  mappingFocus: MappingFocusController,
  options: MountMappingsPaneOptions = {},
): void {
  host.classList.add('mappings-pane')
  host.replaceChildren()

  const objectRow = document.createElement('div')
  objectRow.className = 'mappings-control-row'

  const objectLabel = document.createElement('label')
  objectLabel.className = 'mappings-field-label type-label'
  objectLabel.setAttribute('for', 'mappings-object-type')
  objectLabel.textContent = 'Object type:'

  const objectSelect = document.createElement('select')
  objectSelect.id = 'mappings-object-type'
  objectSelect.className = 'mappings-select'
  objectSelect.setAttribute('data-mappings-object-type', '')

  objectRow.append(objectLabel, objectSelect)

  const stateRow = document.createElement('div')
  stateRow.className = 'mappings-control-row'

  const stateLabel = document.createElement('label')
  stateLabel.className = 'mappings-field-label type-label'
  stateLabel.setAttribute('for', 'mappings-state')
  stateLabel.textContent = 'State:'

  const stateSelect = document.createElement('select')
  stateSelect.id = 'mappings-state'
  stateSelect.className = 'mappings-select'
  stateSelect.setAttribute('data-mappings-state', '')

  stateRow.append(stateLabel, stateSelect)

  const propertyList = document.createElement('div')
  propertyList.className = 'mappings-property-list'
  propertyList.setAttribute('data-mappings-property-list', '')

  host.append(objectRow, stateRow, propertyList)

  let syncingSelects = false
  /** Last seen active Skin id — focus is Skin-scoped and cleared on switch. */
  let trackedActiveSkinId: string | null | undefined = undefined
  /**
   * Canvas-driven muted highlight (HIGHLIGHT_SCROLL_ONLY) — never MappingFocus.
   * Cleared on Sidebar Object/State change or explicit Property-row focus.
   */
  let canvasHighlightActive = false

  const resolveActiveSkin = (): Skin | null => {
    const { project, session } = store.getState()
    const id = session.activeSkinId
    if (id == null) return null
    return project.skins.find((skin) => skin.id === id) ?? null
  }

  const resolveObjectType = (
    objectTypes: readonly InventoryObjectType[],
    objectTypeId: string | null,
  ): InventoryObjectType | null => {
    if (objectTypeId == null) return null
    return objectTypes.find((type) => type.id === objectTypeId) ?? null
  }

  const clearFocusIfStale = (
    objectTypeId: string | null,
    stateId: string | null,
    properties: readonly string[],
  ): void => {
    const focused = mappingFocus.getFocused()
    if (focused == null) return
    if (
      objectTypeId == null ||
      stateId == null ||
      focused.objectTypeId !== objectTypeId ||
      focused.stateId !== stateId ||
      !properties.includes(focused.propertyId)
    ) {
      mappingFocus.setFocused(null)
    }
  }

  const fillSelect = (
    select: HTMLSelectElement,
    options: readonly { value: string; label: string }[],
    selected: string | null,
  ): void => {
    select.replaceChildren()
    const empty = document.createElement('option')
    empty.value = ''
    empty.textContent = '—'
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

  const renderPropertyRows = (): void => {
    const { project, session } = store.getState()
    const skin = resolveActiveSkin()
    if (skin == null) {
      canvasHighlightActive = false
      mappingFocus.setFocused(null)
      propertyList.replaceChildren()
      return
    }

    const objectType = resolveObjectType(
      project.inventory.objectTypes,
      session.selectedObjectTypeId,
    )
    const stateId = session.selectedStateId
    const properties =
      objectType != null &&
      stateId != null &&
      objectType.states.includes(stateId)
        ? objectType.properties
        : []

    clearFocusIfStale(
      session.selectedObjectTypeId,
      stateId,
      properties,
    )

    const focused = mappingFocus.getFocused()
    propertyList.replaceChildren()

    if (objectType == null || stateId == null || properties.length === 0) {
      // Avoid sticky HIGHLIGHT_SCROLL_ONLY when there is nothing to show.
      canvasHighlightActive = false
      return
    }

    let firstRow: HTMLElement | null = null
    for (const propertyId of properties) {
      const triple = {
        objectTypeId: objectType.id,
        stateId,
        propertyId,
      }
      const mapping = findMapping(skin.mappings, triple)
      const isFocused =
        focused != null &&
        focused.objectTypeId === triple.objectTypeId &&
        focused.stateId === triple.stateId &&
        focused.propertyId === triple.propertyId
      const row = buildPropertyRow({
        project,
        triple,
        mapping,
        focused: isFocused,
        canvasHighlighted: canvasHighlightActive && !isFocused,
        onFocus: () => {
          canvasHighlightActive = false
          mappingFocus.setFocused(triple)
        },
        onClear: () => {
          if (mapping == null || mapping.paletteEntryId == null) return
          applyMappingUpsert(store, skin.id, {
            ...triple,
            paletteEntryId: null,
          })
        },
      })
      if (firstRow == null) firstRow = row
      propertyList.append(row)
    }

    if (canvasHighlightActive && firstRow != null) {
      firstRow.scrollIntoView?.({ block: 'nearest' })
    }
  }

  const render = (): void => {
    const { project, session } = store.getState()
    const activeSkinId = session.activeSkinId
    if (
      trackedActiveSkinId !== undefined &&
      trackedActiveSkinId !== activeSkinId
    ) {
      mappingFocus.setFocused(null)
      canvasHighlightActive = false
    }
    trackedActiveSkinId = activeSkinId

    const objectTypes = project.inventory.objectTypes
    const selectedType = resolveObjectType(
      objectTypes,
      session.selectedObjectTypeId,
    )

    syncingSelects = true
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
      syncingSelects = false
    }

    renderPropertyRows()
  }

  objectSelect.addEventListener('change', () => {
    if (syncingSelects) return
    const { project, session } = store.getState()
    const nextTypeId =
      objectSelect.value === '' ? null : objectSelect.value
    const nextType = resolveObjectType(
      project.inventory.objectTypes,
      nextTypeId,
    )
    const nextStateId = resolveStateAfterTypeChange(
      nextType,
      session.selectedStateId,
    )
    const nextSession: SessionUiState = {
      ...session,
      selectedObjectTypeId: nextTypeId,
      selectedStateId: nextStateId,
    }
    canvasHighlightActive = false
    mappingFocus.setFocused(null)
    execute(store, { session: nextSession })
  })

  stateSelect.addEventListener('change', () => {
    if (syncingSelects) return
    const { session } = store.getState()
    const nextStateId =
      stateSelect.value === '' ? null : stateSelect.value
    const nextSession: SessionUiState = {
      ...session,
      selectedStateId: nextStateId,
    }
    canvasHighlightActive = false
    mappingFocus.setFocused(null)
    execute(store, { session: nextSession })
  })

  options.selectionSync?.setHighlightScroll(() => {
    canvasHighlightActive = true
    renderPropertyRows()
  })

  render()
  store.subscribe(render)
  mappingFocus.subscribe(renderPropertyRows)
}

/** @returns true when Skin.mappings were written. */
function applyMappingUpsert(
  store: ProjectStore,
  skinId: string,
  next: Mapping,
): boolean {
  const { project } = store.getState()
  const skinIndex = project.skins.findIndex((skin) => skin.id === skinId)
  if (skinIndex < 0) return false
  const skin = project.skins[skinIndex]
  const mappings = upsertMapping(skin.mappings, next)
  // Rejected (e.g. hex-shaped id) → no write when reference unchanged.
  if (mappings === skin.mappings) return false
  const nextProject: ProjectDocument = {
    ...project,
    skins: project.skins.map((item, i) =>
      i === skinIndex ? { ...item, mappings } : item,
    ),
  }
  execute(store, { project: nextProject })
  return true
}

/** Bind focused Mapping row to a Palette id (ROW_THEN_PALETTE). */
export function bindFocusedMapping(
  store: ProjectStore,
  mappingFocus: MappingFocusController,
  paletteEntryId: string,
): boolean {
  const focused = mappingFocus.getFocused()
  if (focused == null) return false
  const { project, session } = store.getState()
  const skinId = session.activeSkinId
  if (skinId == null) return false
  if (!project.skins.some((skin) => skin.id === skinId)) return false
  return applyMappingUpsert(store, skinId, {
    ...focused,
    paletteEntryId,
  })
}

type BuildRowOptions = {
  project: ProjectDocument
  triple: MappingFocusKey
  mapping: Mapping | undefined
  focused: boolean
  /** Muted canvas-driven highlight — never enables Palette bind. */
  canvasHighlighted: boolean
  onFocus: () => void
  onClear: () => void
}

function buildPropertyRow(options: BuildRowOptions): HTMLElement {
  const {
    project,
    triple,
    mapping,
    focused,
    canvasHighlighted,
    onFocus,
    onClear,
  } = options
  const row = document.createElement('div')
  row.className = 'mapping-row'
  row.setAttribute('data-mapping-row', triple.propertyId)
  row.setAttribute('role', 'button')
  row.tabIndex = 0
  if (focused) {
    row.classList.add('is-focused')
  }
  if (canvasHighlighted) {
    row.classList.add('is-canvas-highlighted')
  }

  const unbound =
    mapping == null || isMappingUnbound(project, mapping)
  if (unbound) {
    row.classList.add('is-unbound')
  }

  const propertyLabel = document.createElement('span')
  propertyLabel.className = 'mapping-row-property'
  propertyLabel.setAttribute('data-mapping-property', '')
  propertyLabel.textContent = triple.propertyId

  const value = document.createElement('span')
  value.className = 'mapping-row-value'
  value.setAttribute('data-mapping-value', '')

  if (unbound) {
    const marker = document.createElement('span')
    marker.className = 'mapping-row-unbound-marker'
    marker.setAttribute('data-mapping-unbound-marker', '')
    marker.setAttribute('aria-hidden', 'true')

    const unboundLabel = document.createElement('span')
    unboundLabel.className = 'mapping-row-unbound-label'
    unboundLabel.setAttribute('data-mapping-unbound-label', '')
    unboundLabel.textContent = 'Unbound'

    value.append(marker, unboundLabel)
  } else {
    const hex = resolvePaletteHex(project, mapping!.paletteEntryId)
    const swatch = document.createElement('span')
    swatch.className = 'mapping-row-swatch'
    swatch.setAttribute('data-mapping-swatch', '')
    if (hex != null) {
      swatch.style.background = hex
    }

    const idLabel = document.createElement('span')
    idLabel.className = 'mapping-row-palette-id'
    idLabel.setAttribute('data-mapping-palette-id', '')
    idLabel.textContent = mapping!.paletteEntryId ?? ''

    value.append(swatch, idLabel)
  }

  row.append(propertyLabel, value)

  // Only bound rows — never invent a null Mapping via Clear on a missing entry.
  if (mapping != null && mapping.paletteEntryId != null) {
    const clearBtn = document.createElement('button')
    clearBtn.type = 'button'
    clearBtn.className = 'mapping-row-clear'
    clearBtn.setAttribute('data-mapping-clear', '')
    clearBtn.textContent = 'Clear'
    clearBtn.addEventListener('click', (event) => {
      event.stopPropagation()
      onFocus()
      onClear()
    })
    row.append(clearBtn)
  }

  row.addEventListener('click', () => {
    onFocus()
  })

  row.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    if (event.target !== row) return
    event.preventDefault()
    onFocus()
  })

  return row
}
