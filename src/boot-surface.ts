export function mountBootSurface(root: HTMLElement | null): void {
  if (root == null) {
    throw new Error('Boot root #app is missing')
  }
  root.textContent = 'Skin Studio'
}
