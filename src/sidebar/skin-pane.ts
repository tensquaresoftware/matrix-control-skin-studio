import type { ProjectStore } from '../model/store'
import type { Mapping, ProjectDocument, SessionUiState, Skin } from '../model/types'
import { openSkinDeleteConfirm } from './skin-delete-confirm'

type SkinSegment = 'mappings' | 'skin'

/**
 * Pane 3 host: segmented [Mappings | Skin] (Mappings default).
 * Skin tab renames / duplicates / deletes the active Skin only.
 */
export function mountSkinPane(body: HTMLElement, store: ProjectStore): void {
  body.classList.add('skin-pane-body')
  body.replaceChildren()

  let activeSegment: SkinSegment = 'mappings'

  const seg = document.createElement('div')
  seg.className = 'skin-seg'
  seg.setAttribute('data-skin-seg', '')
  seg.setAttribute('role', 'tablist')

  const mappingsBtn = createSegButton('Mappings', 'mappings')
  const skinBtn = createSegButton('Skin', 'skin')
  seg.append(mappingsBtn, skinBtn)

  const mappingsPanel = document.createElement('div')
  mappingsPanel.className = 'skin-seg-panel'
  mappingsPanel.setAttribute('data-mappings-tab', '')
  mappingsPanel.setAttribute('role', 'tabpanel')

  const skinPanel = document.createElement('div')
  skinPanel.className = 'skin-seg-panel'
  skinPanel.setAttribute('data-skin-tab', '')
  skinPanel.setAttribute('role', 'tabpanel')

  const nameRow = document.createElement('div')
  nameRow.className = 'skin-name-row'

  const nameLabel = document.createElement('label')
  nameLabel.className = 'skin-field-label type-label'
  nameLabel.setAttribute('for', 'skin-tab-name')
  nameLabel.textContent = 'Skin name:'

  const nameInput = document.createElement('input')
  nameInput.type = 'text'
  nameInput.id = 'skin-tab-name'
  nameInput.className = 'skin-name-field'
  nameInput.setAttribute('data-skin-name', '')

  nameRow.append(nameLabel, nameInput)

  const actions = document.createElement('div')
  actions.className = 'skin-actions'

  const duplicateBtn = document.createElement('button')
  duplicateBtn.type = 'button'
  duplicateBtn.className = 'skin-action-btn'
  duplicateBtn.setAttribute('data-skin-duplicate', '')
  duplicateBtn.textContent = 'Duplicate Skin'

  const deleteBtn = document.createElement('button')
  deleteBtn.type = 'button'
  deleteBtn.className = 'skin-action-btn skin-action-btn-ghost'
  deleteBtn.setAttribute('data-skin-delete', '')
  deleteBtn.textContent = 'Delete Skin…'

  actions.append(duplicateBtn, deleteBtn)

  const reminder = document.createElement('p')
  reminder.className = 'skin-reminder'
  reminder.setAttribute('data-skin-reminder', '')
  reminder.textContent = 'Type-level only — no per-instance colour overrides.'

  skinPanel.append(nameRow, actions, reminder)
  body.append(seg, mappingsPanel, skinPanel)

  const modalRoot = (): HTMLElement =>
    body.closest('[data-sidebar]') ?? body

  const syncSegmentUi = (): void => {
    const mappingsOn = activeSegment === 'mappings'
    if (mappingsOn) {
      mappingsBtn.classList.add('is-on')
      skinBtn.classList.remove('is-on')
    } else {
      mappingsBtn.classList.remove('is-on')
      skinBtn.classList.add('is-on')
    }
    mappingsBtn.setAttribute('aria-selected', mappingsOn ? 'true' : 'false')
    skinBtn.setAttribute('aria-selected', mappingsOn ? 'false' : 'true')
    mappingsPanel.hidden = !mappingsOn
    skinPanel.hidden = mappingsOn
  }

  const setSegment = (next: SkinSegment): void => {
    if (activeSegment === next) return
    activeSegment = next
    syncSegmentUi()
  }

  mappingsBtn.addEventListener('click', () => {
    setSegment('mappings')
  })
  skinBtn.addEventListener('click', () => {
    setSegment('skin')
  })

  let nameFocused = false
  /** Skin id captured when the name field gained focus — rename commits this id only. */
  let editingSkinId: string | null = null

  const resolveActiveSkin = (): Skin | null => {
    const { project, session } = store.getState()
    const id = session.activeSkinId
    if (id == null) return null
    return project.skins.find((skin) => skin.id === id) ?? null
  }

  const findSkinById = (id: string | null): Skin | null => {
    if (id == null) return null
    return store.getState().project.skins.find((skin) => skin.id === id) ?? null
  }

  const restoreNameField = (): void => {
    nameInput.value = resolveActiveSkin()?.displayName ?? ''
  }

  const render = (): void => {
    const active = resolveActiveSkin()
    const enabled = active != null
    duplicateBtn.disabled = !enabled
    deleteBtn.disabled = !enabled
    nameInput.disabled = !enabled

    // Keep in-progress edits; only sync when the field is not focused.
    if (nameFocused) return

    nameInput.value = active?.displayName ?? ''
  }

  const commitRename = (): void => {
    const target = findSkinById(editingSkinId)
    // Captured id gone / never set → do not rename a different active Skin.
    if (target == null) {
      restoreNameField()
      return
    }
    const trimmed = nameInput.value.trim()
    if (trimmed.length === 0) {
      nameInput.value = target.displayName
      return
    }
    if (trimmed === target.displayName) {
      nameInput.value = target.displayName
      return
    }
    applyRename(store, target.id, trimmed)
  }

  nameInput.addEventListener('focus', () => {
    nameFocused = true
    editingSkinId = resolveActiveSkin()?.id ?? null
  })

  nameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      nameInput.blur()
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      const target = findSkinById(editingSkinId)
      nameInput.value = target?.displayName ?? resolveActiveSkin()?.displayName ?? ''
      editingSkinId = null
      nameInput.blur()
    }
  })

  nameInput.addEventListener('blur', () => {
    nameFocused = false
    commitRename()
    editingSkinId = null
  })

  duplicateBtn.addEventListener('click', () => {
    if (duplicateBtn.disabled) return
    applyDuplicate(store)
  })

  deleteBtn.addEventListener('click', () => {
    if (deleteBtn.disabled) return
    const active = resolveActiveSkin()
    if (active == null) return
    openSkinDeleteConfirm({
      root: modalRoot(),
      skinId: active.id,
      displayName: active.displayName,
      onConfirm: () => {
        applyDelete(store, active.id)
      },
    })
  })

  syncSegmentUi()
  render()
  store.subscribe(render)
}

function createSegButton(label: string, segment: SkinSegment): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'skin-seg-btn'
  btn.setAttribute('role', 'tab')
  btn.setAttribute('data-skin-seg-tab', segment)
  btn.textContent = label
  return btn
}

function applyRename(
  store: ProjectStore,
  skinId: string,
  displayName: string,
): void {
  const { project } = store.getState()
  const index = project.skins.findIndex((skin) => skin.id === skinId)
  if (index < 0) return
  const next: ProjectDocument = {
    ...project,
    skins: project.skins.map((skin, i) =>
      i === index ? { ...skin, displayName } : skin,
    ),
  }
  store.apply({ project: next })
}

function applyDuplicate(store: ProjectStore): void {
  const { project, session } = store.getState()
  const sourceId = session.activeSkinId
  if (sourceId == null) return
  const source = project.skins.find((skin) => skin.id === sourceId)
  if (!source) return

  const copy: Skin = {
    id: allocateSkinId(project.skins),
    displayName: `${source.displayName} (copy)`,
    mappings: deepCopyMappings(source.mappings),
  }

  const nextProject: ProjectDocument = {
    ...project,
    skins: [...project.skins, copy],
  }
  const nextSession: SessionUiState = {
    ...session,
    activeSkinId: copy.id,
  }
  store.apply({ project: nextProject, session: nextSession })
}

function applyDelete(store: ProjectStore, skinId: string): void {
  const { project } = store.getState()
  const next: ProjectDocument = {
    ...project,
    skins: project.skins.filter((skin) => skin.id !== skinId),
  }
  store.apply({ project: next })
}

function deepCopyMappings(mappings: readonly Mapping[]): Mapping[] {
  return mappings.map((mapping) => ({ ...mapping }))
}

function allocateSkinId(skins: readonly Skin[]): string {
  let id = newOpaqueId()
  while (skins.some((skin) => skin.id === id)) {
    id = newOpaqueId()
  }
  return id
}

function newOpaqueId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }
  return `skin-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
