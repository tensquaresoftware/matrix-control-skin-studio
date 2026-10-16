import {
  clampZoomStep,
  getBrowserStorage,
  loadPrefs,
  savePrefs,
  type PersistStorage,
} from '../persist/index'

/** Arrow pan step in content-space pixels (4 × spacing unit). */
export const ARROW_PAN_STEP_PX = 16

export type MountCanvasOptions = {
  storage?: PersistStorage
}

/**
 * Apply stored Zoom + panXY as a live transform on the canvas surface.
 * Safe no-op when the surface is not mounted yet.
 */
export function applyCanvasViewFromPrefs(
  host: HTMLElement,
  storage: PersistStorage = getBrowserStorage(),
): void {
  const surface = host.querySelector<HTMLElement>('[data-canvas-surface]')
  if (surface == null) return

  const prefs = loadPrefs(storage)
  const scale = zoomStepToScale(clampZoomStep(prefs.zoomStep))
  const { x, y } = prefs.panXY
  surface.style.transformOrigin = 'top left'
  surface.style.transform = `translate(${x}px, ${y}px) scale(${scale})`
}

/**
 * Focusable GUI-view host: click-drag + arrow pan, live Zoom+pan from prefs.
 * Bright focus surface inside dark chrome; placeholder content only (Epic 4 later).
 */
export function mountCanvas(
  host: HTMLElement,
  options: MountCanvasOptions = {},
): void {
  const storage = options.storage ?? getBrowserStorage()
  host.replaceChildren()
  host.className = 'canvas-host'
  host.setAttribute('data-canvas-host', '')
  host.tabIndex = 0
  host.setAttribute('tabindex', '0')

  const surface = document.createElement('div')
  surface.className = 'canvas-surface'
  surface.setAttribute('data-canvas-surface', '')

  const label = document.createElement('div')
  label.className = 'canvas-placeholder-label'
  label.textContent = 'GUI view'

  surface.append(label)
  host.append(surface)

  applyCanvasViewFromPrefs(host, storage)
  wirePanInteractions(host, surface, storage)
}

function zoomStepToScale(zoomStep: string): number {
  const parsed = Number.parseFloat(zoomStep)
  return Number.isFinite(parsed) ? parsed / 100 : 1
}

function applyLiveTransform(
  surface: HTMLElement,
  panXY: { x: number; y: number },
  zoomStep: string,
): void {
  const scale = zoomStepToScale(clampZoomStep(zoomStep))
  surface.style.transformOrigin = 'top left'
  surface.style.transform = `translate(${panXY.x}px, ${panXY.y}px) scale(${scale})`
}

function commitPanXY(
  panXY: { x: number; y: number },
  storage: PersistStorage,
): void {
  const prefs = loadPrefs(storage)
  prefs.panXY = { x: panXY.x, y: panXY.y }
  savePrefs(prefs, storage)
}

function wirePanInteractions(
  host: HTMLElement,
  surface: HTMLElement,
  storage: PersistStorage,
): void {
  let dragging = false
  let activePointerId: number | null = null
  let startClientX = 0
  let startClientY = 0
  let startPan = { x: 0, y: 0 }
  let currentPan = { x: 0, y: 0 }
  let dragZoomStep = '100%'

  const onPointerMove = (event: PointerEvent): void => {
    if (!dragging || event.pointerId !== activePointerId) return
    currentPan = {
      x: startPan.x + (event.clientX - startClientX),
      y: startPan.y + (event.clientY - startClientY),
    }
    applyLiveTransform(surface, currentPan, dragZoomStep)
  }

  const endDrag = (event: PointerEvent): void => {
    if (!dragging || event.pointerId !== activePointerId) return
    const shouldPersist = event.type === 'pointerup'
    dragging = false
    activePointerId = null

    try {
      if (typeof host.releasePointerCapture === 'function') {
        host.releasePointerCapture(event.pointerId)
      }
    } catch {
      // Capture may already be gone.
    } finally {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
    }

    if (shouldPersist) {
      commitPanXY(currentPan, storage)
      applyCanvasViewFromPrefs(host, storage)
    } else {
      // Cancel: restore transform from last committed prefs.
      applyCanvasViewFromPrefs(host, storage)
    }
  }

  host.addEventListener('pointerdown', (event: PointerEvent) => {
    if (event.button !== 0) return
    if (dragging) return
    host.focus()
    dragging = true
    activePointerId = event.pointerId
    startClientX = event.clientX
    startClientY = event.clientY
    const prefs = loadPrefs(storage)
    startPan = { x: prefs.panXY.x, y: prefs.panXY.y }
    currentPan = { ...startPan }
    dragZoomStep = prefs.zoomStep
    try {
      if (typeof host.setPointerCapture === 'function') {
        host.setPointerCapture(event.pointerId)
      }
    } catch {
      // Capture may fail; window listeners still end the drag.
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
  })

  host.addEventListener('keydown', (event: KeyboardEvent) => {
    if (dragging) return
    let dx = 0
    let dy = 0
    switch (event.key) {
      case 'ArrowLeft':
        dx = -ARROW_PAN_STEP_PX
        break
      case 'ArrowRight':
        dx = ARROW_PAN_STEP_PX
        break
      case 'ArrowUp':
        dy = -ARROW_PAN_STEP_PX
        break
      case 'ArrowDown':
        dy = ARROW_PAN_STEP_PX
        break
      default:
        return
    }
    event.preventDefault()
    const prefs = loadPrefs(storage)
    const nextPan = {
      x: prefs.panXY.x + dx,
      y: prefs.panXY.y + dy,
    }
    commitPanXY(nextPan, storage)
    applyCanvasViewFromPrefs(host, storage)
  })
}
