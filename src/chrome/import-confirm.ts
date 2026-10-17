import { clearHistory } from '../history/index'
import { createEmptySession } from '../model/empty-project'
import type { ProjectStore } from '../model/store'
import type { ProjectDocument } from '../model/types'
import { dismissDeleteConfirms } from './dismiss-project-confirms'

export const IMPORT_CONFIRM_BODY =
  'Replace the current project with this file? Unsaved browser state will be overwritten.'

export const IMPORT_UNSUPPORTED_VERSION_ERROR =
  'Import failed — this file uses an unsupported format version.'

export const IMPORT_INVALID_PROJECT_ERROR =
  'Import failed — this file is not a valid Skin Studio project.'

const IMPORT_CONFIRM_SELECTOR = '[data-import-confirm]'
const IMPORT_ERROR_SELECTOR = '[data-import-error]'

function removeMatching(root: ParentNode, selector: string): void {
  if (typeof root.querySelector !== 'function') return
  let el = root.querySelector(selector)
  while (el) {
    el.remove()
    el = root.querySelector(selector)
  }
}

/** Drop any open Import confirm/error so a second pick replaces the first. */
function dismissImportScrims(root: ParentNode): void {
  removeMatching(root, IMPORT_CONFIRM_SELECTOR)
  removeMatching(root, IMPORT_ERROR_SELECTOR)
}

/**
 * One-deep replace-all Import confirm. Confirm applies parsed project + empty
 * session (MIRROR_NEW), clears history, and never touches prefs.
 */
export function openImportConfirmModal(
  root: HTMLElement,
  store: ProjectStore,
  project: ProjectDocument,
): void {
  // Replace any prior Import scrim (confirm or error) — never no-op a new pick.
  dismissImportScrims(root)

  // One modal deep — drop New confirm if still open.
  const bootConfirm = root.querySelector('[data-boot-confirm]')
  if (bootConfirm) bootConfirm.remove()

  const scrim = document.createElement('div')
  scrim.setAttribute('data-import-confirm', '')
  scrim.className = 'boot-confirm-scrim'

  const panel = document.createElement('div')
  panel.className = 'boot-confirm-panel'

  const body = document.createElement('p')
  body.className = 'boot-confirm-body'
  body.textContent = IMPORT_CONFIRM_BODY

  const actions = document.createElement('div')
  actions.className = 'boot-confirm-actions'

  const cancelButton = document.createElement('button')
  cancelButton.type = 'button'
  cancelButton.className = 'boot-confirm-secondary'
  cancelButton.textContent = 'Cancel'

  const confirmButton = document.createElement('button')
  confirmButton.type = 'button'
  confirmButton.className = 'boot-confirm-primary-destructive'
  confirmButton.textContent = 'Import'

  const close = (): void => {
    scrim.remove()
  }

  cancelButton.addEventListener('click', () => {
    close()
  })

  confirmButton.addEventListener('click', () => {
    // Drop sibling delete confirms before replace so a leftover Confirm
    // cannot mutate the fresh project by a captured id.
    dismissDeleteConfirms(root)
    store.apply({
      project,
      session: createEmptySession(),
    })
    clearHistory(store)
    close()
  })

  actions.append(cancelButton, confirmButton)
  panel.append(body, actions)
  scrim.append(panel)
  root.append(scrim)
}

/**
 * One-deep MODAL_ACK error surface (OK only) — same visual family as confirms.
 */
export function openImportErrorModal(root: HTMLElement, message: string): void {
  // Replace any prior Import scrim (confirm or error) — never no-op a new pick.
  dismissImportScrims(root)

  // One modal deep — drop New confirm if still open.
  const bootConfirm = root.querySelector('[data-boot-confirm]')
  if (bootConfirm) bootConfirm.remove()

  const scrim = document.createElement('div')
  scrim.setAttribute('data-import-error', '')
  scrim.className = 'boot-confirm-scrim'

  const panel = document.createElement('div')
  panel.className = 'boot-confirm-panel'

  const body = document.createElement('p')
  body.className = 'boot-confirm-body'
  body.textContent = message

  const actions = document.createElement('div')
  actions.className = 'boot-confirm-actions'

  const okButton = document.createElement('button')
  okButton.type = 'button'
  okButton.className = 'boot-confirm-secondary'
  okButton.textContent = 'OK'

  const close = (): void => {
    scrim.remove()
  }

  okButton.addEventListener('click', () => {
    close()
  })

  actions.append(okButton)
  panel.append(body, actions)
  scrim.append(panel)
  root.append(scrim)
}
