import type { ProjectStore } from './model/store'
import { applySeedBaseline } from './seed/index'

const NEW_CONFIRM_BODY =
  'Replace the current project with the seed baseline? The saved browser project will be replaced. Preferences stay unchanged.'

/**
 * Minimal Epic 1 boot shell: title + New control with one-deep confirm modal.
 * Full chrome placement is Story 2.3 — chrome must reuse `applySeedBaseline` for New
 * (sole seed-replace path; do not invent a parallel store.apply).
 */
export function mountBootSurface(
  root: HTMLElement | null,
  store: ProjectStore,
): void {
  if (root == null) {
    throw new Error('Boot root #app is missing')
  }

  root.replaceChildren()

  const title = document.createElement('h1')
  title.className = 'boot-title'
  title.textContent = 'Skin Studio'

  const newButton = document.createElement('button')
  newButton.type = 'button'
  newButton.className = 'boot-new-button'
  newButton.textContent = 'New'

  root.append(title, newButton)

  newButton.addEventListener('click', () => {
    openNewConfirmModal(root, store)
  })
}

function openNewConfirmModal(root: HTMLElement, store: ProjectStore): void {
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
    applySeedBaseline(store)
    close()
  })

  actions.append(cancelButton, confirmButton)
  panel.append(body, actions)
  scrim.append(panel)
  root.append(scrim)
}
