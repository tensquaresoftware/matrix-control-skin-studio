import { execute } from '../history/index'
import type { ProjectStore } from '../model/store'
import {
  clampZoomStep,
  getBrowserStorage,
  loadPrefs,
  savePrefs,
  type PersistStorage,
} from '../persist/index'
import type { CanvasSelectionSync } from '../sidebar/canvas-selection-sync'
import {
  EXEMPLAR_BOARD,
  sliderValueBarWidthPx,
  type ExemplarDescriptor,
} from './exemplar-board'

/** Arrow pan step in content-space pixels (4 × spacing unit). */
export const ARROW_PAN_STEP_PX = 16

export type MountCanvasOptions = {
  storage?: PersistStorage
  /** Kept for chrome call-site compatibility; board is static (no Palette zone paint). */
  store?: ProjectStore
  /** Kept for chrome wiring; spike has zero hit targets (selection dormancy). */
  selectionSync?: CanvasSelectionSync
}

export {
  EXEMPLAR_BOARD,
  exemplarBoardKinds,
  sliderValueBarWidthPx,
  type ExemplarDescriptor,
  type ExemplarWidgetKind,
} from './exemplar-board'

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
 * Renders the spike exemplar board under `[data-canvas-surface]`.
 */
export function mountCanvas(
  host: HTMLElement,
  options: MountCanvasOptions = {},
): void {
  const storage = options.storage ?? getBrowserStorage()
  const store = options.store
  // selectionSync intentionally unused — no canvas hit targets on the spike board.
  void options.selectionSync

  host.replaceChildren()
  // Keep chrome slot layout classes (flex:1) — never clobber with assignment.
  host.classList.add('canvas-host')
  host.setAttribute('data-canvas-host', '')
  host.tabIndex = 0
  host.setAttribute('tabindex', '0')

  const surface = document.createElement('div')
  surface.className = 'canvas-surface'
  surface.setAttribute('data-canvas-surface', '')

  const board = document.createElement('div')
  board.className = 'exemplar-board'
  board.setAttribute('data-exemplar-board', '')
  board.setAttribute('aria-label', 'Widget exemplar board')
  renderExemplarBoard(board)
  surface.append(board)
  host.append(surface)

  applyCanvasViewFromPrefs(host, storage)
  /** Shared with pan: a real drag must not clear selection via the trailing click. */
  const panClickGuard = { suppressNextClickDeselect: false }
  wirePanInteractions(host, surface, storage, panClickGuard)
  wireBackgroundDeselect(host, board, store, panClickGuard)
}

function renderExemplarBoard(board: HTMLElement): void {
  board.replaceChildren()
  for (const descriptor of EXEMPLAR_BOARD) {
    board.append(buildExemplarRow(descriptor))
  }
}

function buildExemplarRow(descriptor: ExemplarDescriptor): HTMLElement {
  const row = document.createElement('div')
  row.className = 'exemplar-row'
  row.setAttribute('data-exemplar-row', descriptor.id)

  const caption = document.createElement('span')
  caption.className = 'exemplar-caption'
  caption.setAttribute('data-exemplar-caption', descriptor.id)
  caption.textContent = descriptor.caption

  const brick = document.createElement('div')
  brick.className = `exemplar-brick exemplar-brick-${descriptor.kind}`
  brick.setAttribute('data-exemplar-widget', descriptor.id)
  brick.setAttribute('data-exemplar-kind', descriptor.kind)
  brick.style.width = `${descriptor.width}px`
  brick.style.height = `${descriptor.height}px`

  fillBrickFace(brick, descriptor)
  row.append(caption, brick)
  return row
}

function fillBrickFace(
  brick: HTMLElement,
  descriptor: ExemplarDescriptor,
): void {
  switch (descriptor.kind) {
    case 'slider': {
      // Black enabled paint: full brick = track; inset value bar; centered readout.
      const fill = document.createElement('div')
      fill.className = 'exemplar-slider-fill'
      const valueMin = descriptor.valueMin ?? 0
      const valueMax = descriptor.valueMax ?? 63
      const valueNum = descriptor.value ?? valueMin
      const fillWidth = sliderValueBarWidthPx(
        descriptor.width,
        valueNum,
        valueMin,
        valueMax,
      )
      fill.style.width = `${fillWidth}px`
      fill.setAttribute('data-exemplar-slider-fill-width', String(fillWidth))
      const value = document.createElement('span')
      value.className = 'exemplar-slider-value'
      value.setAttribute('data-exemplar-slider-value', '')
      value.textContent = descriptor.valueText ?? ''
      brick.append(fill, value)
      break
    }
    case 'combo': {
      const text = document.createElement('span')
      text.className = 'exemplar-combo-text'
      text.setAttribute('data-exemplar-combo-text', '')
      text.textContent = descriptor.faceText ?? ''
      const chevron = document.createElement('span')
      chevron.className = 'exemplar-combo-chevron'
      chevron.setAttribute('aria-hidden', 'true')
      brick.append(text, chevron)
      break
    }
    case 'button':
    case 'toggle':
    case 'label':
    case 'groupLabel': {
      brick.textContent = descriptor.faceText ?? ''
      break
    }
    case 'moduleHeader':
    case 'sectionHeader': {
      const title = document.createElement('span')
      title.className = 'exemplar-header-title'
      title.textContent = descriptor.faceText ?? ''
      brick.append(title)
      break
    }
    case 'modulationBusHeader': {
      const num = document.createElement('span')
      num.className = 'exemplar-bus-num'
      num.textContent = descriptor.faceText ?? ''
      const cols = document.createElement('span')
      cols.className = 'exemplar-bus-cols'
      cols.textContent = descriptor.valueText ?? ''
      brick.append(num, cols)
      break
    }
    case 'envelopeDisplay':
    case 'trackGeneratorDisplay': {
      const label = document.createElement('span')
      label.className = 'exemplar-display-label'
      label.textContent = descriptor.faceText ?? ''
      const curve = document.createElement('div')
      curve.className = 'exemplar-display-curve'
      curve.setAttribute('aria-hidden', 'true')
      brick.append(label, curve)
      break
    }
    case 'patchNameDisplay': {
      brick.textContent = descriptor.faceText ?? ''
      break
    }
    case 'horizontalSeparator':
      break
    default: {
      const _exhaustive: never = descriptor.kind
      void _exhaustive
    }
  }
}

/** Pixel movement that counts as a pan drag (not a plain click). */
const PAN_CLICK_SUPPRESS_THRESHOLD_PX = 3

type PanClickGuard = {
  suppressNextClickDeselect: boolean
}

/**
 * Click in the canvas host but outside the exemplar board clears Object-type
 * selection. Clicks on the board do not invent hit targets (dormancy).
 *
 * Pan drags also synthesize a host `click` after pointer-up — those are
 * ignored via `panClickGuard` so panning does not clear selection.
 */
function wireBackgroundDeselect(
  host: HTMLElement,
  board: HTMLElement,
  store: ProjectStore | undefined,
  panClickGuard: PanClickGuard,
): void {
  if (store == null) return
  host.addEventListener('click', (event: MouseEvent) => {
    if (panClickGuard.suppressNextClickDeselect) {
      panClickGuard.suppressNextClickDeselect = false
      return
    }
    if (clickOriginatedInsideBoard(event, board)) return
    const { session } = store.getState()
    if (session.selectedObjectTypeId == null) return
    execute(store, {
      session: {
        ...session,
        selectedObjectTypeId: null,
      },
    })
  })
}

function clickOriginatedInsideBoard(
  event: MouseEvent,
  board: HTMLElement,
): boolean {
  const path =
    typeof event.composedPath === 'function' ? event.composedPath() : []
  for (const node of path) {
    if (node === board) return true
    if (
      node != null &&
      typeof node === 'object' &&
      'getAttribute' in node &&
      typeof (node as HTMLElement).getAttribute === 'function' &&
      (node as HTMLElement).getAttribute('data-exemplar-board') != null
    ) {
      return true
    }
  }
  const target = event.target as {
    closest?: (sel: string) => unknown
    parent?: unknown
  } | null
  if (target != null && typeof target.closest === 'function') {
    if (target.closest('[data-exemplar-board]') != null) return true
  }
  let current: unknown = target
  while (current != null && typeof current === 'object') {
    if (current === board) return true
    current =
      (current as { parent?: unknown }).parent ??
      (current as { parentElement?: unknown }).parentElement ??
      (current as { parentNode?: unknown }).parentNode ??
      null
  }
  return false
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
  panClickGuard: PanClickGuard,
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
    const movedPx = Math.hypot(
      currentPan.x - startPan.x,
      currentPan.y - startPan.y,
    )
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
      if (movedPx >= PAN_CLICK_SUPPRESS_THRESHOLD_PX) {
        // Browser still fires click after a drag; do not treat it as deselect.
        panClickGuard.suppressNextClickDeselect = true
      }
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
