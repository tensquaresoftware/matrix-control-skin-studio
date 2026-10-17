import { resolvePaletteHex } from '../model/palette-helpers'
import type { ProjectStore } from '../model/store'
import type { ProjectDocument } from '../model/types'
import {
  clampZoomStep,
  getBrowserStorage,
  loadPrefs,
  savePrefs,
  type PersistStorage,
} from '../persist/index'
import {
  listObjectTypeHitRegions,
  MOCK_COMPOSITION,
  ORCHESTRATOR_ZONES,
  type OrchestratorZoneDescriptor,
} from './mock-layout'

/** Arrow pan step in content-space pixels (4 × spacing unit). */
export const ARROW_PAN_STEP_PX = 16

export type MountCanvasOptions = {
  storage?: PersistStorage
  /** When provided, Palette-backed zone paint resolves from project and repaints on store changes. */
  store?: ProjectStore
}

export {
  isOrchestratorZoneId,
  listObjectTypeHitRegions,
  MOCK_COMPOSITION,
  ORCHESTRATOR_ZONES,
  orchestratorZonePaletteIds,
  PALETTE_ID_DUO_LED,
  PALETTE_ID_MASTER_ZONE,
  PALETTE_ID_PATCH_ZONE,
} from './mock-layout'

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
 * Renders the Matrix-Control mock under `[data-canvas-surface]`.
 */
export function mountCanvas(
  host: HTMLElement,
  options: MountCanvasOptions = {},
): void {
  const storage = options.storage ?? getBrowserStorage()
  const store = options.store
  host.replaceChildren()
  // Keep chrome slot layout classes (flex:1) — never clobber with assignment.
  host.classList.add('canvas-host')
  host.setAttribute('data-canvas-host', '')
  host.tabIndex = 0
  host.setAttribute('tabindex', '0')

  const surface = document.createElement('div')
  surface.className = 'canvas-surface'
  surface.setAttribute('data-canvas-surface', '')

  const mockRoot = document.createElement('div')
  mockRoot.className = 'canvas-mock'
  mockRoot.setAttribute('data-canvas-mock', '')
  surface.append(mockRoot)
  host.append(surface)

  const paint = (): void => {
    const project = store?.getState().project ?? null
    renderMockComposition(mockRoot, project)
  }
  paint()
  if (store != null) {
    store.subscribe(paint)
  }

  applyCanvasViewFromPrefs(host, storage)
  wirePanInteractions(host, surface, storage)
}

function renderMockComposition(
  mockRoot: HTMLElement,
  project: ProjectDocument | null,
): void {
  mockRoot.replaceChildren()

  const header = document.createElement('div')
  header.className = 'mock-header'
  header.setAttribute('data-mock-header', '')

  const title = document.createElement('span')
  title.className = 'mock-title'
  title.setAttribute('data-mock-title', '')
  title.textContent = MOCK_COMPOSITION.title

  const leds = document.createElement('div')
  leds.className = 'mock-leds'
  leds.setAttribute('data-mock-leds', '')

  for (let i = 0; i < MOCK_COMPOSITION.greenLedCount; i += 1) {
    const led = document.createElement('span')
    led.className = 'mock-led mock-led-green'
    led.setAttribute('data-mock-led', 'green')
    leds.append(led)
  }

  const duoLedZone = ORCHESTRATOR_ZONES.find((z) => z.role === 'headerLed')
  if (duoLedZone != null) {
    leds.append(buildZoneElement(duoLedZone, project, 'mock-led mock-led-duo'))
  }

  header.append(title, leds)

  const body = document.createElement('div')
  body.className = 'mock-body'
  body.setAttribute('data-mock-body', '')

  for (const columnRole of MOCK_COMPOSITION.bodyColumns) {
    const col = document.createElement('div')
    col.className = 'mock-col'
    col.setAttribute('data-mock-col', columnRole)

    const zoneLabel = document.createElement('div')
    zoneLabel.className = 'mock-zone-label'
    zoneLabel.textContent = columnRole === 'patch' ? 'Patch' : 'Master'

    const knobRow = document.createElement('div')
    knobRow.className = 'mock-knob-row'
    for (let i = 0; i < 2; i += 1) {
      const knob = document.createElement('div')
      knob.className = 'mock-knob'
      knob.setAttribute('aria-hidden', 'true')
      knobRow.append(knob)
    }

    const widget = document.createElement('span')
    widget.className = 'mock-btn-widget'
    widget.setAttribute('aria-hidden', 'true')
    widget.textContent = columnRole === 'patch' ? 'Bypass' : 'Mute'

    const bandZone = ORCHESTRATOR_ZONES.find((z) => z.role === columnRole)
    col.append(zoneLabel, knobRow, widget)
    if (bandZone != null) {
      col.append(buildZoneElement(bandZone, project, 'mock-orch'))
    }
    body.append(col)
  }

  const footer = document.createElement('div')
  footer.className = 'mock-footer'
  footer.setAttribute('data-mock-footer', '')
  for (let i = 0; i < MOCK_COMPOSITION.footerFaderCount; i += 1) {
    const fader = document.createElement('div')
    fader.className = 'mock-fader'
    fader.setAttribute('aria-hidden', 'true')
    footer.append(fader)
  }

  const hitHost = document.createElement('div')
  hitHost.className = 'mock-object-type-hits'
  hitHost.setAttribute('data-mock-object-type-hits', '')
  if (project != null) {
    for (const region of listObjectTypeHitRegions(project.inventory)) {
      // Non-interactive until 4.3 owns selection — avoid capturing pointerdown as pan.
      const hit = document.createElement('div')
      hit.className = 'mock-object-type-hit'
      hit.setAttribute('data-object-type-id', region.objectTypeId)
      hit.textContent = region.objectTypeId
      hitHost.append(hit)
    }
  }

  mockRoot.append(header, body, footer, hitHost)
}

function buildZoneElement(
  zone: OrchestratorZoneDescriptor,
  project: ProjectDocument | null,
  className: string,
): HTMLElement {
  const el = document.createElement('div')
  el.className = className
  el.setAttribute('data-orch-zone', zone.id)
  el.setAttribute('data-orch-role', zone.role)
  el.setAttribute('data-orch-palette-id', zone.paletteEntryId)
  if (zone.role !== 'headerLed') {
    el.textContent = zone.label
  }
  applyZonePaint(el, zone.paletteEntryId, project)
  return el
}

function applyZonePaint(
  el: HTMLElement,
  paletteEntryId: string,
  project: ProjectDocument | null,
): void {
  const hex =
    project == null ? null : resolvePaletteHex(project, paletteEntryId)
  if (hex == null) {
    el.style.backgroundColor = ''
    el.setAttribute('data-zone-unbound', '')
    return
  }
  el.style.backgroundColor = hex
  el.removeAttribute('data-zone-unbound')
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
