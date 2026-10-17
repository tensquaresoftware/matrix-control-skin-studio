import { applyCanvasViewFromPrefs, mountCanvas } from '../canvas/index'
import {
  canRedo,
  canUndo,
  execute,
  redo,
  subscribeHistory,
  undo,
} from '../history/index'
import {
  downloadProjectJson,
  exportBlockedTooltip,
  isExportBlocked,
  parseProjectDocument,
  unboundExportCount,
} from '../io/index'
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
import {
  IMPORT_INVALID_PROJECT_ERROR,
  IMPORT_UNSUPPORTED_VERSION_ERROR,
  openImportConfirmModal,
  openImportErrorModal,
} from './import-confirm'
import { openNewConfirmModal } from './new-confirm'

export {
  dismissDeleteConfirms,
  dismissProjectConfirms,
} from './dismiss-project-confirms'
export {
  IMPORT_CONFIRM_BODY,
  IMPORT_INVALID_PROJECT_ERROR,
  IMPORT_UNSUPPORTED_VERSION_ERROR,
  openImportConfirmModal,
  openImportErrorModal,
} from './import-confirm'
export { NEW_CONFIRM_BODY, openNewConfirmModal } from './new-confirm'

const EMPTY_GLYPH = '—'

/** Remount cleanup registry on the chrome root (history button subscriptions). */
const CHROME_CLEANUPS = Symbol.for('matrix-control-skin-studio.chrome-cleanups')

type RootWithCleanups = HTMLElement & {
  [CHROME_CLEANUPS]?: Array<() => void>
}

function disposeChromeCleanups(root: HTMLElement): void {
  const keyed = root as RootWithCleanups
  const list = keyed[CHROME_CLEANUPS]
  if (list == null) return
  for (const dispose of list) {
    dispose()
  }
  keyed[CHROME_CLEANUPS] = []
}

function registerChromeCleanup(root: HTMLElement, dispose: () => void): void {
  const keyed = root as RootWithCleanups
  if (keyed[CHROME_CLEANUPS] == null) {
    keyed[CHROME_CLEANUPS] = []
  }
  keyed[CHROME_CLEANUPS].push(dispose)
}

export type MountChromeShellOptions = {
  storage?: PersistStorage
}

/**
 * Locked desktop chrome: top bar (40px) + context strip (28px) + body
 * (canvas flex:1 + sidebar 320px). New / Import / Export / Undo / Redo /
 * Zoom / Skin live against store, history, and io contracts.
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
  disposeChromeCleanups(root)
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

  const { topBar, importFileInput } = buildTopBar(
    root,
    store,
    storage,
    zoomReadout,
    skinReadout,
    canvasHost,
  )
  const body = document.createElement('div')
  body.className = 'chrome-body'
  body.setAttribute('data-chrome-body', '')

  const sidebarHost = document.createElement('aside')
  sidebarHost.className = 'chrome-sidebar-slot'
  sidebarHost.setAttribute('data-chrome-sidebar-slot', '')

  body.append(canvasHost, sidebarHost)
  shell.append(topBar, contextStrip, body)
  // Shell first so remount / scaffold still see [data-chrome-shell] as children[0].
  root.append(shell, importFileInput)

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
): { topBar: HTMLElement; importFileInput: HTMLInputElement } {
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

  const { button: importBtn, fileInput: importFileInput } = buildImportButton(
    modalRoot,
    store,
  )
  const exportBtn = buildExportButton(modalRoot, store)
  const sep1 = separator()
  const undoBtn = buildHistoryButton(modalRoot, store, 'Undo', 'undo', () => {
    undo(store)
  })
  const redoBtn = buildHistoryButton(modalRoot, store, 'Redo', 'redo', () => {
    redo(store)
  })
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
  return { topBar, importFileInput }
}

/**
 * Live Import: hidden file picker → io parse/validate → confirm or MODAL_ACK.
 * Prefs (Zoom/pan) are never read or written on this path.
 */
function buildImportButton(
  modalRoot: HTMLElement,
  store: ProjectStore,
): { button: HTMLButtonElement; fileInput: HTMLInputElement } {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'chrome-top-btn'
  button.textContent = 'Import'
  button.setAttribute('data-chrome-import', '')

  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = '.json,application/json'
  fileInput.hidden = true
  fileInput.setAttribute('data-chrome-import-file', '')

  button.addEventListener('click', () => {
    fileInput.click()
  })

  fileInput.addEventListener('change', () => {
    void handleImportFilePicked(modalRoot, store, fileInput)
  })

  return { button, fileInput }
}

/** Monotonic generation so a slower earlier pick cannot overwrite a newer one. */
let importPickGeneration = 0

async function handleImportFilePicked(
  modalRoot: HTMLElement,
  store: ProjectStore,
  fileInput: HTMLInputElement,
): Promise<void> {
  const file = fileInput.files?.[0] ?? null
  // Allow re-picking the same path after Cancel / error.
  fileInput.value = ''
  if (file == null) return

  const gen = ++importPickGeneration

  let raw: string
  try {
    raw = await readPickedFileText(file)
  } catch {
    if (gen !== importPickGeneration) return
    openImportErrorModal(modalRoot, IMPORT_INVALID_PROJECT_ERROR)
    return
  }

  // Stale read — a newer pick already owns the flow.
  if (gen !== importPickGeneration) return

  const result = parseProjectDocument(raw)
  if (!result.ok) {
    const message =
      result.reason === 'unsupported-format-version'
        ? IMPORT_UNSUPPORTED_VERSION_ERROR
        : IMPORT_INVALID_PROJECT_ERROR
    openImportErrorModal(modalRoot, message)
    return
  }

  openImportConfirmModal(modalRoot, store, result.project)
}

async function readPickedFileText(file: File): Promise<string> {
  if (typeof file.text === 'function') {
    return file.text()
  }
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '')
    }
    reader.onerror = () => {
      reject(reader.error ?? new Error('Failed to read import file'))
    }
    reader.readAsText(file)
  })
}

/**
 * Live Export: hard-gated by project-total unbound (aria-disabled in tab order).
 * When clear, accent styling + download project-only JSON.
 */
function buildExportButton(
  root: HTMLElement,
  store: ProjectStore,
): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'chrome-top-btn'
  button.textContent = 'Export'
  button.setAttribute('data-chrome-export', '')

  const syncGate = (): void => {
    const { project } = store.getState()
    const unboundCount = unboundExportCount(project)
    const blocked = isExportBlocked(project)

    if (blocked) {
      button.setAttribute('aria-disabled', 'true')
      button.setAttribute('title', exportBlockedTooltip(unboundCount))
      button.classList.remove('chrome-top-btn-export-ready')
    } else {
      button.removeAttribute('aria-disabled')
      button.removeAttribute('title')
      button.classList.add('chrome-top-btn-export-ready')
    }
  }

  syncGate()
  registerChromeCleanup(root, store.subscribe(syncGate))

  button.addEventListener('click', () => {
    if (button.getAttribute('aria-disabled') === 'true') return
    const { project } = store.getState()
    if (isExportBlocked(project)) return
    downloadProjectJson(project)
  })

  return button
}

function buildHistoryButton(
  root: HTMLElement,
  store: ProjectStore,
  label: string,
  kind: 'undo' | 'redo',
  onClick: () => void,
): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'chrome-top-btn chrome-top-btn-ghost'
  button.textContent = label
  button.setAttribute(`data-chrome-${kind}`, '')

  const syncEnabled = (): void => {
    button.disabled = kind === 'undo' ? !canUndo(store) : !canRedo(store)
  }
  syncEnabled()
  registerChromeCleanup(root, subscribeHistory(store, syncEnabled))

  button.addEventListener('click', () => {
    if (button.disabled) return
    onClick()
  })
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
      // Orphaned activeSkinId sync — non-undoable (EXCLUDE).
      execute(
        store,
        {
          session: {
            selectedObjectTypeId: session.selectedObjectTypeId,
            selectedStateId: session.selectedStateId,
            activeSkinId: null,
          },
        },
        { push: false },
      )
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

    // Skin combo only updates activeSkinId — never an undo step (EXCLUDE).
    execute(
      store,
      {
        session: {
          selectedObjectTypeId: currentSession.selectedObjectTypeId,
          selectedStateId: currentSession.selectedStateId,
          activeSkinId: nextId,
        },
      },
      { push: false },
    )
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
