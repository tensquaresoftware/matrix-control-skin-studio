import { clearHistory } from '../history/index'
import type { ProjectStore } from '../model/store'
import { applySeedBaseline } from '../seed/index'
import { dismissDeleteConfirms } from './dismiss-project-confirms'

export const NEW_CONFIRM_BODY =
  'Replace the current project with the seed baseline? The saved browser project will be replaced. Preferences stay unchanged.'

/**
 * One-deep New confirm modal. Confirm calls `applySeedBaseline` only
 * (sole seed-replace path). Cancel closes without mutating the store.
 */
export function openNewConfirmModal(root: HTMLElement, store: ProjectStore): void {
  const existing = root.querySelector('[data-boot-confirm]')
  if (existing) return

  const scrim = document.createElement('div')
  scrim.setAttribute('data-boot-confirm', '')
  scrim.className = 'boot-confirm-scrim'

  const panel = document.createElement('div')
  panel.className = 'boot-confirm-panel'

  const body = document.createElement('p')
  body.className = 'boot-confirm-body'
  body.textContent = NEW_CONFIRM_BODY

  const actions = document.createElement('div')
  actions.className = 'boot-confirm-actions'

  const cancelButton = document.createElement('button')
  cancelButton.type = 'button'
  cancelButton.className = 'boot-confirm-secondary'
  cancelButton.textContent = 'Cancel'

  const confirmButton = document.createElement('button')
  confirmButton.type = 'button'
  confirmButton.className = 'boot-confirm-primary-destructive'
  confirmButton.textContent = 'New'

  const close = (): void => {
    scrim.remove()
  }

  cancelButton.addEventListener('click', () => {
    close()
  })

  confirmButton.addEventListener('click', () => {
    // Drop sibling delete confirms before seed-replace so a leftover
    // Confirm cannot mutate the fresh seed by a captured id.
    dismissDeleteConfirms(root)
    applySeedBaseline(store)
    clearHistory(store)
    close()
  })

  actions.append(cancelButton, confirmButton)
  panel.append(body, actions)
  scrim.append(panel)
  root.append(scrim)
}
