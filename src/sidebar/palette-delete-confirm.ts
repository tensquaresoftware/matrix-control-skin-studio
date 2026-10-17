import { execute } from '../history/index'
import type { ProjectStore } from '../model/store'
import type { Mapping, ProjectDocument, Skin } from '../model/types'

export type PaletteDeleteRef = {
  skinDisplayName: string
  objectTypeId: string
  stateId: string
  propertyId: string
}

/**
 * Collect mappings across all skins that still reference `paletteEntryId`.
 */
export function collectPaletteRefs(
  project: ProjectDocument,
  paletteEntryId: string,
): PaletteDeleteRef[] {
  const refs: PaletteDeleteRef[] = []
  for (const skin of project.skins) {
    for (const mapping of skin.mappings) {
      if (mapping.paletteEntryId === paletteEntryId) {
        refs.push({
          skinDisplayName: skin.displayName,
          objectTypeId: mapping.objectTypeId,
          stateId: mapping.stateId,
          propertyId: mapping.propertyId,
        })
      }
    }
  }
  return refs
}

/**
 * List line: `{skin.displayName} · {objectTypeId} · {propertyId}`;
 * include `stateId` only when needed to disambiguate among the listed refs.
 */
export function formatPaletteDeleteRefLine(
  ref: PaletteDeleteRef,
  all: readonly PaletteDeleteRef[],
): string {
  const ambiguous = all.some(
    (other) =>
      other !== ref &&
      other.skinDisplayName === ref.skinDisplayName &&
      other.objectTypeId === ref.objectTypeId &&
      other.propertyId === ref.propertyId &&
      other.stateId !== ref.stateId,
  )
  if (ambiguous) {
    return `${ref.skinDisplayName} · ${ref.objectTypeId} · ${ref.stateId} · ${ref.propertyId}`
  }
  return `${ref.skinDisplayName} · ${ref.objectTypeId} · ${ref.propertyId}`
}

export type OpenPaletteDeleteConfirmOptions = {
  root: HTMLElement
  paletteEntryId: string
  displayName: string
  refs: readonly PaletteDeleteRef[]
  onConfirm: () => void
}

/**
 * One-deep delete-colour confirm (UX-DR13). Cancel closes without mutating.
 * Reuses New-confirm scrim / destructive primary tokens via shared CSS classes.
 */
export function openPaletteDeleteConfirm(
  options: OpenPaletteDeleteConfirmOptions,
): void {
  const { root, paletteEntryId, displayName, refs, onConfirm } = options
  if (root.querySelector('[data-palette-delete-confirm]')) return

  const n = refs.length
  const scrim = document.createElement('div')
  scrim.setAttribute('data-palette-delete-confirm', '')
  scrim.setAttribute('data-palette-delete-id', paletteEntryId)
  scrim.className = 'boot-confirm-scrim'

  const panel = document.createElement('div')
  panel.className = 'boot-confirm-panel palette-delete-panel'

  const title = document.createElement('h2')
  title.className = 'palette-delete-title'
  title.setAttribute('data-palette-delete-title', '')
  title.textContent = `Delete colour “${displayName}”?`

  const body = document.createElement('p')
  body.className = 'boot-confirm-body'
  body.setAttribute('data-palette-delete-body', '')
  body.textContent = `${n} mapping(s) will become Unbound:`

  const list = document.createElement('ul')
  list.className = 'palette-delete-ref-list'
  list.setAttribute('data-palette-delete-refs', '')
  for (const ref of refs) {
    const item = document.createElement('li')
    item.className = 'palette-delete-ref-item'
    item.textContent = formatPaletteDeleteRefLine(ref, refs)
    list.append(item)
  }

  const actions = document.createElement('div')
  actions.className = 'boot-confirm-actions'

  const cancelButton = document.createElement('button')
  cancelButton.type = 'button'
  cancelButton.className = 'boot-confirm-secondary'
  cancelButton.setAttribute('data-palette-delete-cancel', '')
  cancelButton.textContent = 'Cancel'

  const confirmButton = document.createElement('button')
  confirmButton.type = 'button'
  confirmButton.className = 'boot-confirm-primary-destructive'
  confirmButton.setAttribute('data-palette-delete-apply', '')
  confirmButton.textContent = 'Delete and unbind'

  const close = (): void => {
    scrim.remove()
  }

  cancelButton.addEventListener('click', () => {
    close()
  })

  confirmButton.addEventListener('click', () => {
    onConfirm()
    close()
  })

  actions.append(cancelButton, confirmButton)
  panel.append(title, body, list, actions)
  scrim.append(panel)
  root.append(scrim)
}

/** Remove palette entry and null every matching mapping's paletteEntryId. */
export function applyDeleteAndUnbind(
  store: ProjectStore,
  paletteEntryId: string,
): void {
  const { project } = store.getState()
  const next: ProjectDocument = {
    ...project,
    palette: project.palette.filter((entry) => entry.id !== paletteEntryId),
    skins: project.skins.map((skin: Skin) => ({
      ...skin,
      mappings: skin.mappings.map((mapping: Mapping) =>
        mapping.paletteEntryId === paletteEntryId
          ? { ...mapping, paletteEntryId: null }
          : mapping,
      ),
    })),
  }
  execute(store, { project: next })
}
