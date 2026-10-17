import { applyCanvasViewFromPrefs, mountCanvas } from '../canvas/index'
import type { ProjectStore } from '../model/store'
import {
  clampZoomStep,
  getBrowserStorage,
  loadPrefs,
  savePrefs,
  ZOOM_STEPS,
  type PersistStorage,
} from '../persist/index'
import {
  createCanvasSelectionSync,
  mountSidebar,
} from '../sidebar/index'
import { openNewConfirmModal } from './new-confirm'

export {
  dismissDeleteConfirms,
  dismissProjectConfirms,
} from './dismiss-project-confirms'
export { NEW_CONFIRM_BODY, openNewConfirmModal } from './new-confirm'

const EMPTY_GLYPH = '—'

export type MountChromeShellOptions = {
  storage?: PersistStorage
}

/**
 * Locked desktop chrome: top bar (40px) + context strip (28px) + body
 * (canvas flex:1 + sidebar 320px). New + Zoom + Skin live; other AD-11
 * controls remain ordered disabled stubs.
 */
export function mountChromeShell(
  root: HTMLElement | null,
  store: ProjectStore,
  options: MountChromeShellOptions = {},
): void {
  if (root == null) {
    throw new Error('Chrome root #app is missing')
  }

  const storage = options.storage ?? getBrowserStorage()
  root.replaceChildren()

  const shell = document.createElement('div')
  shell.className = 'chrome-shell'
  shell.setAttribute('data-chrome-shell', '')
  shell.setAttribute('aria-label', 'Skin Studio')

  const contextStrip = buildContextStrip()
  const objectReadout = contextStrip.querySelector('[data-context-value="object"]')
  const stateReadout = contextStrip.querySelector('[data-context-value="state"]')
  const zoomReadout = contextStrip.querySelector('[data-context-value="zoom"]')
  const skinReadout = contextStrip.querySelector('[data-context-value="skin"]')
  if (!objectReadout || !stateReadout || !zoomReadout || !skinReadout) {
    throw new Error('Context strip Object/State/Zoom/Skin readouts missing')
  }

  const syncObjectStateFromStore = (): void => {
    const { session } = store.getState()
    objectReadout.textContent = session.selectedObjectTypeId ?? EMPTY_GLYPH
    stateReadout.textContent = session.selectedStateId ?? EMPTY_GLYPH
  }
  syncObjectStateFromStore()
  store.subscribe(syncObjectStateFromStore)

  const canvasHost = document.createElement('main')
  canvasHost.className = 'chrome-canvas-slot'
  canvasHost.setAttribute('data-chrome-canvas-slot', '')

  const topBar = buildTopBar(root, store, storage, zoomReadout, skinReadout, canvasHost)
  const body = document.createElement('div')
  body.className = 'chrome-body'
  body.setAttribute('data-chrome-body', '')

  const sidebarHost = document.createElement('aside')
  sidebarHost.className = 'chrome-sidebar-slot'
  sidebarHost.setAttribute('data-chrome-sidebar-slot', '')

  body.append(canvasHost, sidebarHost)
  shell.append(topBar, contextStrip, body)
  root.append(shell)

  const selectionSync = createCanvasSelectionSync()
  mountCanvas(canvasHost, { storage, store, selectionSync })
  mountSidebar(sidebarHost, { storage, store, selectionSync })
}

function buildTopBar(
  modalRoot: HTMLElement,
  store: ProjectStore,
  storage: PersistStorage,
  zoomReadout: Element,
  skinReadout: Element,
  canvasHost: HTMLElement,
): HTMLElement {
  const topBar = document.createElement('div')
  topBar.className = 'chrome-top-bar'
  topBar.setAttribute('data-chrome-top-bar', '')

  const newButton = document.createElement('button')
  newButton.type = 'button'
  newButton.className = 'chrome-top-btn'
  newButton.setAttribute('data-chrome-new', '')
  newButton.textContent = 'New'
  newButton.addEventListener('click', () => {
    openNewConfirmModal(modalRoot, store)
  })

  const importBtn = inertButton('Import')
  const exportBtn = inertButton('Export')
  const sep1 = separator()
  const undoBtn = inertButton('Undo', 'chrome-top-btn chrome-top-btn-ghost')
  const redoBtn = inertButton('Redo', 'chrome-top-btn chrome-top-btn-ghost')
  const zoom = buildZoomCombo(storage, zoomReadout, canvasHost)
  const spacer = document.createElement('span')
  spacer.className = 'chrome-top-spacer'
  spacer.setAttribute('data-chrome-spacer', '')
  const skin = buildSkinCombo(store, skinReadout)

  topBar.append(
    newButton,
    importBtn,
    exportBtn,
    sep1,
    undoBtn,
    redoBtn,
    zoom,
    spacer,
    skin,
  )
  return topBar
}

function inertButton(label: string, className = 'chrome-top-btn'): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = className
  button.textContent = label
  button.disabled = true
  button.setAttribute('data-chrome-inert', label.toLowerCase())
  return button
}

function separator(): HTMLElement {
  const sep = document.createElement('span')
  sep.className = 'chrome-top-sep'
  sep.setAttribute('aria-hidden', 'true')
  return sep
}

function buildZoomCombo(
  storage: PersistStorage,
  zoomReadout: Element,
  canvasHost: HTMLElement,
): HTMLElement {
  const wrap = document.createElement('span')
  wrap.className = 'chrome-combo'
  wrap.setAttribute('data-chrome-zoom', '')

  const selectId = 'chrome-zoom-select'
  const lbl = document.createElement('label')
  lbl.className = 'chrome-combo-label'
  lbl.setAttribute('for', selectId)
  lbl.textContent = 'Zoom:'

  const select = document.createElement('select')
  select.id = selectId
  select.className = 'chrome-combo-select'
  select.setAttribute('data-chrome-zoom-select', '')

  for (const step of ZOOM_STEPS) {
    const option = document.createElement('option')
    option.value = step
    option.textContent = step
    select.append(option)
  }

  const zoomStep = clampZoomStep(loadPrefs(storage).zoomStep)
  select.value = zoomStep
  zoomReadout.textContent = zoomStep

  select.addEventListener('change', () => {
    const next = clampZoomStep(select.value)
    select.value = next
    const prefs = loadPrefs(storage)
    prefs.zoomStep = next
    savePrefs(prefs, storage)
    zoomReadout.textContent = next
    applyCanvasViewFromPrefs(canvasHost, storage)
  })

  wrap.append(lbl, select)
  return wrap
}

function buildSkinCombo(store: ProjectStore, skinReadout: Element): HTMLElement {
  const wrap = document.createElement('span')
  wrap.className = 'chrome-combo chrome-skin-combo'
  wrap.setAttribute('data-chrome-skin', '')

  const selectId = 'chrome-skin-select'
  const lbl = document.createElement('label')
  lbl.className = 'chrome-combo-label'
  lbl.setAttribute('for', selectId)
  lbl.textContent = 'Skin:'

  const select = document.createElement('select')
  select.id = selectId
  select.className = 'chrome-combo-select'
  select.setAttribute('data-chrome-skin-select', '')

  const syncSkinFromStore = (): void => {
    let { project, session } = store.getState()

    if (
      session.activeSkinId !== null &&
      !project.skins.some((s) => s.id === session.activeSkinId)
    ) {
      store.apply({
        session: {
          selectedObjectTypeId: session.selectedObjectTypeId,
          selectedStateId: session.selectedStateId,
          activeSkinId: null,
        },
      })
      ;({ project, session } = store.getState())
    }

    select.replaceChildren()
    const emptyOption = document.createElement('option')
    emptyOption.value = ''
    emptyOption.textContent = EMPTY_GLYPH
    select.append(emptyOption)
    for (const skin of project.skins) {
      const option = document.createElement('option')
      option.value = skin.id
      option.textContent = skin.displayName
      select.append(option)
    }

    const activeSkin =
      session.activeSkinId === null
        ? undefined
        : project.skins.find((s) => s.id === session.activeSkinId)

    if (activeSkin) {
      select.value = activeSkin.id
      skinReadout.textContent = activeSkin.displayName
    } else {
      select.value = ''
      skinReadout.textContent = EMPTY_GLYPH
    }
  }

  syncSkinFromStore()
  store.subscribe(syncSkinFromStore)

  select.addEventListener('change', () => {
    const nextId = select.value === '' ? null : select.value
    const { project: currentProject, session: currentSession } = store.getState()

    if (nextId !== null && !currentProject.skins.some((s) => s.id === nextId)) {
      syncSkinFromStore()
      return
    }

    store.apply({
      session: {
        selectedObjectTypeId: currentSession.selectedObjectTypeId,
        selectedStateId: currentSession.selectedStateId,
        activeSkinId: nextId,
      },
    })
  })

  wrap.append(lbl, select)
  return wrap
}

function buildContextStrip(): HTMLElement {
  const strip = document.createElement('div')
  strip.className = 'chrome-context-strip type-context'
  strip.setAttribute('data-chrome-context-strip', '')

  strip.append(
    contextField('Object', EMPTY_GLYPH),
    contextField('State', EMPTY_GLYPH),
    contextField('Zoom', EMPTY_GLYPH),
    contextField('Skin', EMPTY_GLYPH),
  )
  return strip
}

function contextField(label: string, value: string): HTMLElement {
  const wrap = document.createElement('span')
  wrap.className = 'chrome-context-field'

  const lbl = document.createElement('span')
  lbl.className = 'chrome-context-label'
  lbl.textContent = label

  const val = document.createElement('span')
  val.className = 'chrome-context-value'
  val.textContent = value
  val.setAttribute('data-context-value', label.toLowerCase())

  wrap.append(lbl, val)
  return wrap
}
