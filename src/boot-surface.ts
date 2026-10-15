import type { ProjectStore } from './model/store'
import { applySeedBaseline } from './seed/index'

const NEW_CONFIRM_BODY =
  'Replace the current project with the seed baseline? Unsaved browser state will be overwritten.'

/**
 * Minimal Epic 1 boot shell: title + New control with one-deep confirm modal.
 * Full chrome placement is Story 2.3.
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
  title.textContent = 'Skin Studio'

  const newButton = document.createElement('button')
  newButton.type = 'button'
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
  scrim.style.cssText =
    'position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:1000'

  const panel = document.createElement('div')
  panel.style.cssText =
    'background:#fff;color:#111;padding:1.25rem 1.5rem;max-width:28rem;box-shadow:0 8px 24px rgba(0,0,0,0.25)'

  const body = document.createElement('p')
  body.textContent = NEW_CONFIRM_BODY

  const actions = document.createElement('div')
  actions.style.cssText = 'display:flex;gap:0.75rem;justify-content:flex-end;margin-top:1rem'

  const cancelButton = document.createElement('button')
  cancelButton.type = 'button'
  cancelButton.textContent = 'Cancel'

  const confirmButton = document.createElement('button')
  confirmButton.type = 'button'
  confirmButton.textContent = 'New'
  confirmButton.style.cssText = 'background:#b00020;color:#fff;border:none;padding:0.4rem 0.85rem'

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
