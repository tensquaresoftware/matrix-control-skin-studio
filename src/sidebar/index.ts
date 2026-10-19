import type { ProjectStore } from '../model/store'
import { loadPrefs, savePrefs } from '../persist/prefs'
import type { PersistStorage } from '../persist/storage'
import { getBrowserStorage } from '../persist/storage'
import type { CanvasSelectionSync } from './canvas-selection-sync'
import { createCanvasSelectionSync } from './canvas-selection-sync'
import { createMappingFocus } from './mapping-focus'
import { mountMappingsPane } from './mappings-pane'
import { mountPalettePane } from './palette-pane'
import { createPaletteSelection } from './palette-selection'
import { mountPickerPane } from './picker-pane'
import { mountSkinPane } from './skin-pane'
import { mountUnboundPane } from './unbound-pane'

export type { CanvasSelectionSync } from './canvas-selection-sync'
export { createCanvasSelectionSync } from './canvas-selection-sync'
export { mountObjectStateControls } from './object-state-controls'

/** Default / min heights for the two Lot B zones. */
export const DEFAULT_COLOR_PALETTE_HEIGHT_PX = 280
export const DEFAULT_SKIN_MAPPINGS_UNBOUND_HEIGHT_PX = 240
export const MIN_COLOR_PALETTE_HEIGHT_PX = 120
export const MIN_SKIN_MAPPINGS_UNBOUND_HEIGHT_PX = 120

/** @deprecated Lot B — use DEFAULT_COLOR_PALETTE_HEIGHT_PX. Kept for matrix aliases. */
export const PICKER_PANE_HEIGHT_PX = DEFAULT_COLOR_PALETTE_HEIGHT_PX
/** @deprecated Lot B aliases for older matrix names. */
export const DEFAULT_PALETTE_HEIGHT_PX = DEFAULT_COLOR_PALETTE_HEIGHT_PX
export const MIN_PALETTE_HEIGHT_PX = MIN_COLOR_PALETTE_HEIGHT_PX
export const MIN_MAPPINGS_HEIGHT_PX = MIN_SKIN_MAPPINGS_UNBOUND_HEIGHT_PX
export const MIN_UNBOUND_HEIGHT_PX = MIN_SKIN_MAPPINGS_UNBOUND_HEIGHT_PX

export type SidebarPaneHeights = {
  colorPalette: number
  skinMappingsUnbound: number
}

export type MountSidebarOptions = {
  storage?: PersistStorage
  store?: ProjectStore
  selectionSync?: CanvasSelectionSync
}

const ZONE_IDS = ['colorPalette', 'skinMappingsUnbound'] as const
type ZoneId = (typeof ZONE_IDS)[number]

type Zone1Tab = 'color' | 'palette'
type Zone2Tab = 'skin' | 'mappings' | 'unbound'

/**
 * Two stacked zones (Lot B): Color|Palette and Skin→Mappings→Unbound,
 * with one horizontal splitter. Heights under
 * `skin-studio:prefs.sidebarPaneHeights` keys `colorPalette` /
 * `skinMappingsUnbound` (AD-8). Legacy three-key prefs → defaults.
 */
export function mountSidebar(
  host: HTMLElement,
  options: MountSidebarOptions = {},
): void {
  const storage = options.storage ?? getBrowserStorage()
  host.replaceChildren()
  host.classList.add('sidebar')
  host.setAttribute('data-sidebar', '')

  const saved = loadPrefs(storage).sidebarPaneHeights
  const heights = resolvePaneHeights(saved, host)

  const zone1 = createZone('colorPalette', heights.colorPalette)
  const zone2 = createZone('skinMappingsUnbound', heights.skinMappingsUnbound)
  const splitter = createSplitter(0)

  const colorPanel = createTabPanel('color')
  const palettePanel = createTabPanel('palette')
  const skinPanel = createTabPanel('skin')
  const mappingsPanel = createTabPanel('mappings')
  const unboundPanel = createTabPanel('unbound')

  const zone1Tabs = mountZoneTabs<Zone1Tab>(zone1.head, [
    { id: 'color', label: 'Color', panel: colorPanel },
    { id: 'palette', label: 'Palette', panel: palettePanel },
  ], 'color')

  const zone2Tabs = mountZoneTabs<Zone2Tab>(zone2.head, [
    { id: 'skin', label: 'Skin', panel: skinPanel },
    { id: 'mappings', label: 'Mappings', panel: mappingsPanel },
    { id: 'unbound', label: 'Unbound', panel: unboundPanel },
  ], 'mappings')

  zone1.body.append(colorPanel, palettePanel)
  zone2.body.append(skinPanel, mappingsPanel, unboundPanel)

  host.append(zone1.zone, splitter, zone2.zone)

  const zoneEls = {
    colorPalette: zone1.zone,
    skinMappingsUnbound: zone2.zone,
  }

  applyHeights(zoneEls, heights)

  const showZone1 = (tab: Zone1Tab): void => {
    zone1Tabs.setActive(tab)
    colorPanel.hidden = tab !== 'color'
    palettePanel.hidden = tab !== 'palette'
  }

  let activeZone2: Zone2Tab = 'mappings'
  const mappingFocus = createMappingFocus()

  const showZone2 = (tab: Zone2Tab): void => {
    if (activeZone2 !== tab && tab !== 'mappings') {
      mappingFocus.setFocused(null)
    }
    activeZone2 = tab
    zone2Tabs.setActive(tab)
    skinPanel.hidden = tab !== 'skin'
    mappingsPanel.hidden = tab !== 'mappings'
    unboundPanel.hidden = tab !== 'unbound'
  }

  zone1Tabs.onSelect(showZone1)
  zone2Tabs.onSelect(showZone2)
  showZone1('color')
  showZone2('mappings')

  wireSplitters({
    splitters: [splitter],
    zoneEls,
    storage,
  })

  if (options.store) {
    const selection = createPaletteSelection()
    const selectionSync =
      options.selectionSync ?? createCanvasSelectionSync()

    selectionSync.setSwitchToMappings(() => {
      showZone2('mappings')
    })

    mountPickerPane(colorPanel, options.store, selection)
    mountPalettePane(palettePanel, options.store, selection, mappingFocus)
    mountSkinPane(skinPanel, options.store)
    mountMappingsPane(mappingsPanel, options.store, mappingFocus, {
      selectionSync,
    })
    mountUnboundPane(unboundPanel, options.store, {
      mappingFocus,
      selectionSync,
      badgeHost: zone2Tabs.tabButton('unbound'),
    })
  }
}

/**
 * Resolve prefs into clamped Lot B heights.
 * Legacy three-key (`palette` / `mappings` / `unbound`) or missing keys → defaults.
 */
export function resolvePaneHeights(
  raw: Record<string, number> | undefined,
  host?: HTMLElement,
): SidebarPaneHeights {
  if (hasLotBHeights(raw)) {
    return clampHeights({
      colorPalette: raw!.colorPalette,
      skinMappingsUnbound: raw!.skinMappingsUnbound,
    })
  }
  return distributeDefaultHeights(host?.clientHeight ?? 0)
}

function hasLotBHeights(
  raw: Record<string, number> | undefined,
): raw is Record<string, number> {
  if (raw == null) return false
  return ZONE_IDS.every(
    (id) => typeof raw[id] === 'number' && Number.isFinite(raw[id]),
  )
}

function distributeDefaultHeights(hostHeightPx: number): SidebarPaneHeights {
  const fallback = clampHeights({
    colorPalette: DEFAULT_COLOR_PALETTE_HEIGHT_PX,
    skinMappingsUnbound: DEFAULT_SKIN_MAPPINGS_UNBOUND_HEIGHT_PX,
  })
  if (hostHeightPx <= 0) return fallback

  const splitterPx = 1
  const available = hostHeightPx - splitterPx
  if (
    available <
    MIN_COLOR_PALETTE_HEIGHT_PX + MIN_SKIN_MAPPINGS_UNBOUND_HEIGHT_PX
  ) {
    return fallback
  }

  const colorPalette = Math.round(available * 0.55)
  const skinMappingsUnbound = available - colorPalette
  return clampHeights({ colorPalette, skinMappingsUnbound })
}

function clampHeights(heights: SidebarPaneHeights): SidebarPaneHeights {
  return {
    colorPalette: Math.max(MIN_COLOR_PALETTE_HEIGHT_PX, heights.colorPalette),
    skinMappingsUnbound: Math.max(
      MIN_SKIN_MAPPINGS_UNBOUND_HEIGHT_PX,
      heights.skinMappingsUnbound,
    ),
  }
}

function createZone(
  id: ZoneId,
  heightPx: number,
): { zone: HTMLElement; head: HTMLElement; body: HTMLElement } {
  const zone = document.createElement('div')
  zone.className = `sidebar-zone sidebar-zone-${id}`
  zone.setAttribute('data-sidebar-zone', id)
  // Legacy pane attribute for matrix queries that still use pane ids.
  zone.setAttribute('data-sidebar-pane', id === 'colorPalette' ? 'colorPalette' : 'skinMappingsUnbound')
  zone.style.height = `${heightPx}px`

  const head = document.createElement('div')
  head.className = 'sidebar-zone-head'
  head.setAttribute('data-sidebar-zone-head', id)

  const body = document.createElement('div')
  body.className = 'sidebar-zone-body'
  body.setAttribute('data-sidebar-pane-body', id)

  zone.append(head, body)
  return { zone, head, body }
}

function createTabPanel(id: string): HTMLElement {
  const panel = document.createElement('div')
  panel.className = 'sidebar-tab-panel'
  panel.setAttribute('data-sidebar-tab-panel', id)
  panel.setAttribute('role', 'tabpanel')
  // Stable hooks used by existing matrices.
  if (id === 'color') panel.setAttribute('data-sidebar-pane-body', 'picker')
  if (id === 'palette') panel.setAttribute('data-sidebar-pane-body', 'palette')
  if (id === 'skin') panel.setAttribute('data-sidebar-pane-body', 'skin')
  if (id === 'mappings') panel.setAttribute('data-sidebar-pane-body', 'mappings')
  if (id === 'unbound') panel.setAttribute('data-sidebar-pane-body', 'unbound')
  return panel
}

function mountZoneTabs<T extends string>(
  host: HTMLElement,
  tabs: readonly { id: T; label: string; panel: HTMLElement }[],
  initial: T,
): {
  setActive: (id: T) => void
  onSelect: (fn: (id: T) => void) => void
  tabButton: (id: T) => HTMLElement
} {
  const tablist = document.createElement('div')
  tablist.className = 'sidebar-tablist'
  tablist.setAttribute('role', 'tablist')

  const buttons = new Map<T, HTMLButtonElement>()
  let onSelectFn: ((id: T) => void) | null = null

  for (const tab of tabs) {
    const tabId = `sidebar-tab-${tab.id}`
    const panelId = `sidebar-panel-${tab.id}`
    tab.panel.id = panelId
    tab.panel.setAttribute('aria-labelledby', tabId)

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.id = tabId
    btn.className = 'sidebar-tab'
    btn.setAttribute('role', 'tab')
    btn.setAttribute('aria-controls', panelId)
    btn.setAttribute('data-sidebar-tab', tab.id)
    // Skin-tab matrix legacy hooks for zone-2 tabs.
    if (tab.id === 'skin' || tab.id === 'mappings' || tab.id === 'unbound') {
      btn.setAttribute('data-skin-seg-tab', tab.id)
    }
    btn.textContent = tab.label
    btn.addEventListener('click', () => {
      onSelectFn?.(tab.id)
    })
    btn.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
      event.preventDefault()
      const ids = tabs.map((t) => t.id)
      const idx = ids.indexOf(tab.id)
      const next =
        event.key === 'ArrowRight'
          ? ids[(idx + 1) % ids.length]
          : ids[(idx - 1 + ids.length) % ids.length]
      buttons.get(next)?.focus()
      onSelectFn?.(next)
    })
    buttons.set(tab.id, btn)
    tablist.append(btn)
  }

  host.append(tablist)

  const setActive = (id: T): void => {
    for (const [tabId, btn] of buttons) {
      const on = tabId === id
      if (on) btn.classList.add('is-on')
      else btn.classList.remove('is-on')
      btn.setAttribute('aria-selected', on ? 'true' : 'false')
      btn.tabIndex = on ? 0 : -1
    }
  }

  setActive(initial)

  return {
    setActive,
    onSelect(fn) {
      onSelectFn = fn
    },
    tabButton(id) {
      const btn = buttons.get(id)
      if (!btn) throw new Error(`Missing tab ${id}`)
      return btn
    },
  }
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
  zoneEls: Record<ZoneId, HTMLElement>,
  heights: SidebarPaneHeights,
): void {
  for (const id of ZONE_IDS) {
    zoneEls[id].style.height = `${heights[id]}px`
  }
}

function readCurrentHeights(
  zoneEls: Record<ZoneId, HTMLElement>,
): SidebarPaneHeights {
  return {
    colorPalette: parseHeight(zoneEls.colorPalette),
    skinMappingsUnbound: parseHeight(zoneEls.skinMappingsUnbound),
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
        colorPalette: heights.colorPalette,
        skinMappingsUnbound: heights.skinMappingsUnbound,
      },
    },
    storage,
  )
}

type SplitterWire = {
  splitters: HTMLElement[]
  zoneEls: Record<ZoneId, HTMLElement>
  storage: PersistStorage
}

function wireSplitters({ splitters, zoneEls, storage }: SplitterWire): void {
  for (let i = 0; i < splitters.length; i++) {
    const splitter = splitters[i]
    let dragging = false
    let activePointerId: number | null = null
    let startY = 0
    let startHeights: SidebarPaneHeights = {
      colorPalette: DEFAULT_COLOR_PALETTE_HEIGHT_PX,
      skinMappingsUnbound: DEFAULT_SKIN_MAPPINGS_UNBOUND_HEIGHT_PX,
    }

    const onPointerMove = (event: PointerEvent): void => {
      if (!dragging || event.pointerId !== activePointerId) return
      const delta = event.clientY - startY
      const next = resizeFromDrag(i, delta, startHeights)
      applyHeights(zoneEls, next)
    }

    const endDrag = (event: PointerEvent): void => {
      if (!dragging) return
      if (activePointerId != null && event.pointerId !== activePointerId) return

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
        // Capture may already be gone.
      } finally {
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', endDrag)
        window.removeEventListener('pointercancel', endDrag)
        splitter.removeEventListener('lostpointercapture', endDrag)
      }

      if (shouldPersist) {
        persistHeights(readCurrentHeights(zoneEls), storage)
      } else {
        applyHeights(zoneEls, startHeights)
      }
    }

    splitter.addEventListener('pointerdown', (event: PointerEvent) => {
      if (event.button !== 0) return
      if (dragging) return
      event.preventDefault()
      dragging = true
      activePointerId = event.pointerId
      startY = event.clientY
      startHeights = readCurrentHeights(zoneEls)
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
 * Pure resize math for the single Lot B zone splitter.
 * index 0: colorPalette ↔ skinMappingsUnbound
 */
export function resizeFromDrag(
  splitterIndex: number,
  deltaY: number,
  start: SidebarPaneHeights,
): SidebarPaneHeights {
  if (!Number.isFinite(deltaY)) return start
  if (splitterIndex !== 0) return start

  const colorPalette = clampOne(
    start.colorPalette + deltaY,
    MIN_COLOR_PALETTE_HEIGHT_PX,
  )
  const skinMappingsUnbound = clampOne(
    start.skinMappingsUnbound - (colorPalette - start.colorPalette),
    MIN_SKIN_MAPPINGS_UNBOUND_HEIGHT_PX,
  )
  const appliedDelta = start.skinMappingsUnbound - skinMappingsUnbound
  return {
    colorPalette: start.colorPalette + appliedDelta,
    skinMappingsUnbound,
  }
}

function clampOne(value: number, min: number): number {
  return Math.max(min, value)
}
