export type OpenSkinDeleteConfirmOptions = {
  root: HTMLElement
  skinId: string
  displayName: string
  onConfirm: () => void
}

export const SKIN_DELETE_CONFIRM_BODY = (displayName: string): string =>
  `Delete skin “${displayName}”?`

/**
 * One-deep delete-skin confirm (UX-DR13). Cancel closes without mutating.
 * Reuses boot-confirm scrim / destructive primary tokens via shared CSS classes.
 */
export function openSkinDeleteConfirm(
  options: OpenSkinDeleteConfirmOptions,
): void {
  const { root, skinId, displayName, onConfirm } = options
  if (root.querySelector('[data-skin-delete-confirm]')) return

  const scrim = document.createElement('div')
  scrim.setAttribute('data-skin-delete-confirm', '')
  scrim.setAttribute('data-skin-delete-id', skinId)
  scrim.className = 'boot-confirm-scrim'

  const panel = document.createElement('div')
  panel.className = 'boot-confirm-panel'

  const body = document.createElement('p')
  body.className = 'boot-confirm-body'
  body.setAttribute('data-skin-delete-body', '')
  body.textContent = SKIN_DELETE_CONFIRM_BODY(displayName)

  const actions = document.createElement('div')
  actions.className = 'boot-confirm-actions'

  const cancelButton = document.createElement('button')
  cancelButton.type = 'button'
  cancelButton.className = 'boot-confirm-secondary'
  cancelButton.setAttribute('data-skin-delete-cancel', '')
  cancelButton.textContent = 'Cancel'

  const confirmButton = document.createElement('button')
  confirmButton.type = 'button'
  confirmButton.className = 'boot-confirm-primary-destructive'
  confirmButton.setAttribute('data-skin-delete-apply', '')
  confirmButton.textContent = 'Delete'

  const close = (): void => {
    scrim.remove()
  }

  cancelButton.addEventListener('click', () => {
    close()
  })

  confirmButton.addEventListener('click', () => {
    try {
      onConfirm()
    } finally {
      close()
    }
  })

  actions.append(cancelButton, confirmButton)
  panel.append(body, actions)
  scrim.append(panel)
  root.append(scrim)
}
