import type { ProjectStore } from '../model/store'
import { loadPrefs, savePrefs } from '../persist/prefs'
import type { PersistStorage } from '../persist/storage'
import { getBrowserStorage } from '../persist/storage'
import type { CanvasSelectionSync } from './canvas-selection-sync'
import { createCanvasSelectionSync } from './canvas-selection-sync'
import { createMappingFocus } from './mapping-focus'
import { mountPalettePane } from './palette-pane'
import { createPaletteSelection } from './palette-selection'
import { mountPickerPane } from './picker-pane'
import { mountSkinPane } from './skin-pane'

export type { CanvasSelectionSync } from './canvas-selection-sync'
export { createCanvasSelectionSync } from './canvas-selection-sync'

/** Mock-canonical picker height (PANE_DEFAULTS = MOCK) — fixed, not in prefs. */
export const PICKER_PANE_HEIGHT_PX = 220

/** Default / min heights for resizable panes 2–4 (mock editor-main.html). */
export const DEFAULT_PALETTE_HEIGHT_PX = 140
export const MIN_PALETTE_HEIGHT_PX = 80
export const MIN_MAPPINGS_HEIGHT_PX = 160
export const MIN_UNBOUND_HEIGHT_PX = 120

export type SidebarPaneHeights = {
  palette: number
  mappings: number
  unbound: number
}

export type MountSidebarOptions = {
  storage?: PersistStorage
  /** When provided, mounts Palette rows + Picker live recolour (story 3-1). */
  store?: ProjectStore
  /** Canvas ↔ Mappings selection bridge (story 4-3). */
  selectionSync?: CanvasSelectionSync
}

const PANE_IDS = ['palette', 'mappings', 'unbound'] as const

/**
 * Four stacked panes: picker (fixed) → palette → mappings/skin → unbound,
 * with horizontal splitters. Panes 2–4 heights load/save under
 * `skin-studio:prefs.sidebarPaneHeights` (AD-8).
 */
export function mountSidebar(
  host: HTMLElement,
  options: MountSidebarOptions = {},
): void {
  const storage = options.storage ?? getBrowserStorage()
  host.replaceChildren()
  // Keep chrome slot layout classes (320px / flex-shrink:0) — never clobber.
  host.classList.add('sidebar')
  host.setAttribute('data-sidebar', '')

  const saved = loadPrefs(storage).sidebarPaneHeights
  const heights = resolvePaneHeights(saved, host)

  const picker = createPane('picker', 'Picker', PICKER_PANE_HEIGHT_PX, true)
  const palette = createPane('palette', 'Palette', heights.palette, false)
  const mappings = createPane('mappings', 'Mappings / Skin', heights.mappings, false)
  const unbound = createPane('unbound', 'Unbound', heights.unbound, false)

  const splitter0 = createSplitter(0)
  const splitter1 = createSplitter(1)
  const splitter2 = createSplitter(2)

  host.append(
    picker.pane,
    splitter0,
    palette.pane,
    splitter1,
    mappings.pane,
    splitter2,
    unbound.pane,
  )

  const paneEls = {
    palette: palette.pane,
    mappings: mappings.pane,
    unbound: unbound.pane,
  }

  applyHeights(paneEls, heights)

  wireSplitters({
    host,
    splitters: [splitter0, splitter1, splitter2],
    paneEls,
    storage,
  })

  if (options.store) {
    const selection = createPaletteSelection()
    const mappingFocus = createMappingFocus()
    const selectionSync =
      options.selectionSync ?? createCanvasSelectionSync()
    mountPickerPane(picker.body, options.store, selection)
    mountPalettePane(palette.body, options.store, selection, mappingFocus)
    mountSkinPane(mappings.body, options.store, {
      mappingFocus,
      selectionSync,
    })
  }
}

/**
 * Resolve prefs (or corrupt/missing) into clamped heights.
 * When prefs lack pane keys and the host has a measurable height, distribute
 * remaining body height across panes 2–4 (mock flex 1.2 : 0.9 after palette).
 */
export function resolvePaneHeights(
  raw: Record<string, number> | undefined,
  host?: HTMLElement,
): SidebarPaneHeights {
  if (hasSavedHeights(raw)) {
    return clampHeights({
      palette: raw!.palette,
      mappings: raw!.mappings,
      unbound: raw!.unbound,
    })
  }
  return distributeDefaultHeights(host?.clientHeight ?? 0)
}

function hasSavedHeights(
  raw: Record<string, number> | undefined,
): raw is Record<string, number> {
  if (raw == null) return false
  return PANE_IDS.every(
    (id) => typeof raw[id] === 'number' && Number.isFinite(raw[id]),
  )
}

function distributeDefaultHeights(hostHeightPx: number): SidebarPaneHeights {
  const fallback = clampHeights({
    palette: DEFAULT_PALETTE_HEIGHT_PX,
    mappings: MIN_MAPPINGS_HEIGHT_PX,
    unbound: MIN_UNBOUND_HEIGHT_PX,
  })
  if (hostHeightPx <= 0) return fallback

  const splitterPx = 3 // three 1px tracks
  const available =
    hostHeightPx - PICKER_PANE_HEIGHT_PX - splitterPx - DEFAULT_PALETTE_HEIGHT_PX
  if (available < MIN_MAPPINGS_HEIGHT_PX + MIN_UNBOUND_HEIGHT_PX) {
    return fallback
  }

  const mappings = Math.round(available * (1.2 / 2.1))
  const unbound = available - mappings
  return clampHeights({
    palette: DEFAULT_PALETTE_HEIGHT_PX,
    mappings,
    unbound,
  })
}

function clampHeights(heights: SidebarPaneHeights): SidebarPaneHeights {
  return {
    palette: Math.max(MIN_PALETTE_HEIGHT_PX, heights.palette),
    mappings: Math.max(MIN_MAPPINGS_HEIGHT_PX, heights.mappings),
    unbound: Math.max(MIN_UNBOUND_HEIGHT_PX, heights.unbound),
  }
}

function createPane(
  id: string,
  title: string,
  heightPx: number,
  fixed: boolean,
): { pane: HTMLElement; body: HTMLElement } {
  const pane = document.createElement('div')
  pane.className = `sidebar-pane sidebar-pane-${id}`
  pane.setAttribute('data-sidebar-pane', id)
  if (fixed) {
    pane.setAttribute('data-pane-fixed', '')
  }
  pane.style.height = `${heightPx}px`

  const head = document.createElement('div')
  head.className = 'sidebar-pane-head type-label'
  head.textContent = title

  const body = document.createElement('div')
  body.className = 'sidebar-pane-body'
  body.setAttribute('data-sidebar-pane-body', id)

  pane.append(head, body)
  return { pane, body }
}

function createSplitter(index: number): HTMLElement {
  const splitter = document.createElement('div')
  splitter.className = 'sidebar-splitter'
  splitter.setAttribute('data-sidebar-splitter', String(index))
  splitter.setAttribute('role', 'separator')
  splitter.setAttribute('aria-orientation', 'horizontal')
  return splitter
}

function applyHeights(
  paneEls: Record<(typeof PANE_IDS)[number], HTMLElement>,
  heights: SidebarPaneHeights,
): void {
  for (const id of PANE_IDS) {
    paneEls[id].style.height = `${heights[id]}px`
  }
}

function readCurrentHeights(
  paneEls: Record<(typeof PANE_IDS)[number], HTMLElement>,
): SidebarPaneHeights {
  return {
    palette: parseHeight(paneEls.palette),
    mappings: parseHeight(paneEls.mappings),
    unbound: parseHeight(paneEls.unbound),
  }
}

function parseHeight(el: HTMLElement): number {
  const raw = el.style.height.replace(/px$/, '')
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

function persistHeights(
  heights: SidebarPaneHeights,
  storage: PersistStorage,
): void {
  const current = loadPrefs(storage)
  savePrefs(
    {
      ...current,
      sidebarPaneHeights: {
        palette: heights.palette,
        mappings: heights.mappings,
        unbound: heights.unbound,
      },
    },
    storage,
  )
}

type SplitterWire = {
  host: HTMLElement
  splitters: HTMLElement[]
  paneEls: Record<(typeof PANE_IDS)[number], HTMLElement>
  storage: PersistStorage
}

/**
 * Splitter 0 (picker|palette): dragging redistributes panes 2–4 only;
 * picker height stays fixed (DESIGN sidebar-splitter assumption).
 * Splitters 1–2 move the boundary between adjacent resizable panes.
 */
function wireSplitters({ splitters, paneEls, storage }: SplitterWire): void {
  for (let i = 0; i < splitters.length; i++) {
    const splitter = splitters[i]
    let dragging = false
    let activePointerId: number | null = null
    let startY = 0
    let startHeights: SidebarPaneHeights = {
      palette: DEFAULT_PALETTE_HEIGHT_PX,
      mappings: MIN_MAPPINGS_HEIGHT_PX,
      unbound: MIN_UNBOUND_HEIGHT_PX,
    }

    const onPointerMove = (event: PointerEvent): void => {
      if (!dragging || event.pointerId !== activePointerId) return
      const delta = event.clientY - startY
      const next = resizeFromDrag(i, delta, startHeights)
      applyHeights(paneEls, next)
    }

    const endDrag = (event: PointerEvent): void => {
      if (!dragging) return
      if (activePointerId != null && event.pointerId !== activePointerId) return

      // Spec: prefs commit on pointer-up only (not cancel / lost capture).
      const shouldPersist = event.type === 'pointerup'
      const pointerId = activePointerId
      dragging = false
      activePointerId = null
      splitter.classList.remove('is-dragging')

      try {
        if (pointerId != null) {
          splitter.releasePointerCapture(pointerId)
        }
      } catch {
        // Capture may already be gone (lostpointercapture / cancel).
      } finally {
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', endDrag)
        window.removeEventListener('pointercancel', endDrag)
        splitter.removeEventListener('lostpointercapture', endDrag)
      }

      if (shouldPersist) {
        persistHeights(readCurrentHeights(paneEls), storage)
      } else {
        // Cancel / lost capture: restore live heights (mirror canvas pan cancel).
        applyHeights(paneEls, startHeights)
      }
    }

    splitter.addEventListener('pointerdown', (event: PointerEvent) => {
      if (event.button !== 0) return
      if (dragging) return
      event.preventDefault()
      dragging = true
      activePointerId = event.pointerId
      startY = event.clientY
      startHeights = readCurrentHeights(paneEls)
      splitter.classList.add('is-dragging')
      splitter.setPointerCapture(event.pointerId)
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', endDrag)
      window.addEventListener('pointercancel', endDrag)
      splitter.addEventListener('lostpointercapture', endDrag)
    })
  }
}

/**
 * Pure resize math for tests and splitters.
 * index 0: grow/shrink palette from the top of the resizable stack (picker fixed).
 * index 1: palette ↔ mappings
 * index 2: mappings ↔ unbound
 */
export function resizeFromDrag(
  splitterIndex: number,
  deltaY: number,
  start: SidebarPaneHeights,
): SidebarPaneHeights {
  if (!Number.isFinite(deltaY)) return start

  const next = { ...start }

  if (splitterIndex === 0) {
    // Moving the picker|palette splitter down grows palette; up shrinks it.
    // Palette only grows by what mappings/unbound can actually free (stack stays stable).
    const desiredPalette = clampOne(start.palette + deltaY, MIN_PALETTE_HEIGHT_PX)
    const desiredDelta = desiredPalette - start.palette
    if (desiredDelta === 0) return start

    if (desiredDelta > 0) {
      const pair = redistributePair(
        start.mappings,
        start.unbound,
        -desiredDelta,
        MIN_MAPPINGS_HEIGHT_PX,
        MIN_UNBOUND_HEIGHT_PX,
      )
      const freed =
        start.mappings + start.unbound - (pair.a + pair.b)
      next.palette = start.palette + freed
      next.mappings = pair.a
      next.unbound = pair.b
      return next
    }

    const pair = redistributePair(
      start.mappings,
      start.unbound,
      -desiredDelta,
      MIN_MAPPINGS_HEIGHT_PX,
      MIN_UNBOUND_HEIGHT_PX,
    )
    next.palette = desiredPalette
    next.mappings = pair.a
    next.unbound = pair.b
    return next
  }

  if (splitterIndex === 1) {
    const palette = clampOne(start.palette + deltaY, MIN_PALETTE_HEIGHT_PX)
    const mappings = clampOne(
      start.mappings - (palette - start.palette),
      MIN_MAPPINGS_HEIGHT_PX,
    )
    // If mappings hit min, stop palette growth
    const appliedDelta = start.mappings - mappings
    next.palette = start.palette + appliedDelta
    next.mappings = mappings
    return next
  }

  // splitterIndex === 2
  const mappings = clampOne(start.mappings + deltaY, MIN_MAPPINGS_HEIGHT_PX)
  const unbound = clampOne(
    start.unbound - (mappings - start.mappings),
    MIN_UNBOUND_HEIGHT_PX,
  )
  const appliedDelta = start.unbound - unbound
  next.mappings = start.mappings + appliedDelta
  next.unbound = unbound
  return next
}

function clampOne(value: number, min: number): number {
  return Math.max(min, value)
}

/** Push `delta` into pair (a,b) while respecting mins; prefer splitting proportionally. */
function redistributePair(
  a: number,
  b: number,
  delta: number,
  minA: number,
  minB: number,
): { a: number; b: number } {
  // delta > 0 means free space to give to a+b; delta < 0 means take from a+b
  let nextA = a
  let nextB = b
  let remaining = delta

  if (remaining > 0) {
    const total = a + b
    const shareA = total > 0 ? (a / total) * remaining : remaining / 2
    nextA = a + shareA
    nextB = b + (remaining - shareA)
    return { a: nextA, b: nextB }
  }

  // Shrink: take from whichever has room above min
  remaining = -remaining
  const roomA = Math.max(0, a - minA)
  const roomB = Math.max(0, b - minB)
  const takeA = Math.min(roomA, remaining)
  remaining -= takeA
  const takeB = Math.min(roomB, remaining)
  return { a: a - takeA, b: b - takeB }
}
