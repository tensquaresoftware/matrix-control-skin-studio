const DELETE_CONFIRM_SELECTORS = [
  '[data-palette-delete-confirm]',
  '[data-skin-delete-confirm]',
] as const

const NEW_CONFIRM_SELECTOR = '[data-boot-confirm]'

function removeAllMatching(root: ParentNode, selector: string): void {
  // Prefer querySelector loop — test DOM mocks often omit querySelectorAll /
  // do not parse comma-combined selectors.
  if (typeof root.querySelector !== 'function') return
  let el = root.querySelector(selector)
  while (el) {
    el.remove()
    el = root.querySelector(selector)
  }
}

/** Remove open Palette/Skin delete confirm scrims. */
export function dismissDeleteConfirms(root: ParentNode = document): void {
  for (const selector of DELETE_CONFIRM_SELECTORS) {
    removeAllMatching(root, selector)
  }
}

/**
 * Remove all project-scoped confirm scrims (New + delete colour + delete skin).
 * Prefer `dismissDeleteConfirms` from inside the New confirm itself.
 */
export function dismissProjectConfirms(root: ParentNode = document): void {
  removeAllMatching(root, NEW_CONFIRM_SELECTOR)
  dismissDeleteConfirms(root)
}
