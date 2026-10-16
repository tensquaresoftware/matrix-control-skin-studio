/**
 * Empty GUI-view host — layout placeholder for Story 2.5 (pan/zoom).
 * Bright focus surface inside dark chrome; no interaction yet.
 */
export function mountCanvas(host: HTMLElement): void {
  host.replaceChildren()
  host.className = 'canvas-host'
  host.setAttribute('data-canvas-host', '')

  const surface = document.createElement('div')
  surface.className = 'canvas-surface'
  surface.setAttribute('data-canvas-surface', '')

  const label = document.createElement('div')
  label.className = 'canvas-placeholder-label'
  label.textContent = 'GUI view'

  surface.append(label)
  host.append(surface)
}
