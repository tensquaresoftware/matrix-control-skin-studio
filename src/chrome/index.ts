import { mountCanvas } from '../canvas/index'
import type { ProjectStore } from '../model/store'
import type { PersistStorage } from '../persist/storage'
import { getBrowserStorage } from '../persist/storage'
import { mountSidebar } from '../sidebar/index'
import { openNewConfirmModal } from './new-confirm'

export { NEW_CONFIRM_BODY, openNewConfirmModal } from './new-confirm'

export type MountChromeShellOptions = {
  storage?: PersistStorage
}

/**
 * Locked desktop chrome: top bar (40px) + context strip (28px) + body
 * (canvas flex:1 + sidebar 320px). New is live; other AD-11 controls are inert.
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

  const topBar = buildTopBar(root, store)
  const contextStrip = buildContextStrip()
  const body = document.createElement('div')
  body.className = 'chrome-body'
  body.setAttribute('data-chrome-body', '')

  const canvasHost = document.createElement('main')
  canvasHost.className = 'chrome-canvas-slot'
  canvasHost.setAttribute('data-chrome-canvas-slot', '')

  const sidebarHost = document.createElement('aside')
  sidebarHost.className = 'chrome-sidebar-slot'
  sidebarHost.setAttribute('data-chrome-sidebar-slot', '')

  body.append(canvasHost, sidebarHost)
  shell.append(topBar, contextStrip, body)
  root.append(shell)

  mountCanvas(canvasHost)
  mountSidebar(sidebarHost, { storage })
}

function buildTopBar(modalRoot: HTMLElement, store: ProjectStore): HTMLElement {
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
  const zoom = inertCombo('Zoom', '—')
  const spacer = document.createElement('span')
  spacer.className = 'chrome-top-spacer'
  spacer.setAttribute('data-chrome-spacer', '')
  const skin = inertCombo('Skin', '—', true)

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

function inertCombo(
  label: string,
  value: string,
  skin = false,
): HTMLElement {
  const wrap = document.createElement('span')
  wrap.className = skin ? 'chrome-combo chrome-skin-combo' : 'chrome-combo'
  wrap.setAttribute('data-chrome-inert', label.toLowerCase())

  const lbl = document.createElement('span')
  lbl.className = 'chrome-combo-label'
  lbl.textContent = `${label}:`

  const val = document.createElement('span')
  val.className = 'chrome-combo-value'
  val.textContent = value
  val.setAttribute('aria-disabled', 'true')

  wrap.append(lbl, val)
  return wrap
}

function buildContextStrip(): HTMLElement {
  const strip = document.createElement('div')
  strip.className = 'chrome-context-strip type-context'
  strip.setAttribute('data-chrome-context-strip', '')

  const empty = '—'
  strip.append(
    contextField('Object', empty),
    contextField('State', empty),
    contextField('Zoom', empty),
    contextField('Skin', empty),
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
