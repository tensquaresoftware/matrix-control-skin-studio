import { execute } from '../history/index'
import {
  findMapping,
  resolvePaletteHex,
} from '../model/palette-helpers'
import { resolveStateAfterTypeChange } from '../model/session-helpers'
import type { ProjectStore } from '../model/store'
import type {
  InventoryObjectType,
  Mapping,
  ProjectDocument,
  SessionUiState,
  Skin,
} from '../model/types'
import {
  clampZoomStep,
  getBrowserStorage,
  loadPrefs,
  savePrefs,
  type PersistStorage,
} from '../persist/index'
import type { CanvasSelectionSync } from '../sidebar/canvas-selection-sync'
import {
  listObjectTypeHitRegions,
  MOCK_COMPOSITION,
  ORCHESTRATOR_ZONES,
  type OrchestratorZoneDescriptor,
  resolveZoneSelectableObjectTypeId,
} from './mock-layout'

/** Arrow pan step in content-space pixels (4 × spacing unit). */
export const ARROW_PAN_STEP_PX = 16

export type MountCanvasOptions = {
  storage?: PersistStorage
  /** When provided, Palette-backed zone paint resolves from project and repaints on store changes. */
  store?: ProjectStore
  /** Canvas ↔ Sidebar selection bridge (story 4-3). */
  selectionSync?: CanvasSelectionSync
}

export {
  isOrchestratorZoneId,
  listObjectTypeHitRegions,
  MOCK_COMPOSITION,
  objectTypeIdForZoneRole,
  ORCHESTRATOR_ZONES,
  orchestratorZonePaletteIds,
  PALETTE_ID_DUO_LED,
  PALETTE_ID_MASTER_ZONE,
  PALETTE_ID_PATCH_ZONE,
  resolveZoneSelectableObjectTypeId,
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
  const selectionSync = options.selectionSync
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

  /** Prior project snapshot for Mapping-delta pulse detection (FR-5 / AD-16). */
  let previousProject: ProjectDocument | null = null

  const paint = (): void => {
    const state = store?.getState()
    const project = state?.project ?? null
    const session = state?.session ?? null
    const pulseTypeIds =
      previousProject != null && project != null
        ? detectMappingChangedObjectTypeIds(
            previousProject,
            project,
            session?.activeSkinId ?? null,
          )
        : []
    renderMockComposition(
      mockRoot,
      project,
      session,
      store,
      selectionSync,
      pulseTypeIds,
    )
    previousProject = project
  }
  paint()
  if (store != null) {
    store.subscribe(paint)
  }

  applyCanvasViewFromPrefs(host, storage)
  /** Shared with pan: a real drag must not clear selection via the trailing click. */
  const panClickGuard = { suppressNextClickDeselect: false }
  wirePanInteractions(host, surface, storage, panClickGuard)
  wireBackgroundDeselect(host, mockRoot, store, panClickGuard)
}

/** Pixel movement that counts as a pan drag (not a plain click). */
const PAN_CLICK_SUPPRESS_THRESHOLD_PX = 3

type PanClickGuard = {
  suppressNextClickDeselect: boolean
}

/**
 * Click in the canvas host but outside the mock clears Object-type selection
 * (drops the blue selection outline). Clicks inside the mock keep / change it.
 *
 * Prefer `composedPath`: hit/zone clicks rebuild the mock mid-event, which
 * detaches `event.target` so `closest('[data-canvas-mock]')` would fail and
 * immediately undo the selection.
 *
 * Pan drags also synthesize a host `click` after pointer-up — those are
 * ignored via `panClickGuard` so panning does not clear selection.
 */
function wireBackgroundDeselect(
  host: HTMLElement,
  mockRoot: HTMLElement,
  store: ProjectStore | undefined,
  panClickGuard: PanClickGuard,
): void {
  if (store == null) return
  host.addEventListener('click', (event: MouseEvent) => {
    if (panClickGuard.suppressNextClickDeselect) {
      panClickGuard.suppressNextClickDeselect = false
      return
    }
    if (clickOriginatedInsideMock(event, mockRoot)) return
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

function clickOriginatedInsideMock(
  event: MouseEvent,
  mockRoot: HTMLElement,
): boolean {
  const path =
    typeof event.composedPath === 'function' ? event.composedPath() : []
  for (const node of path) {
    if (node === mockRoot) return true
    if (
      node != null &&
      typeof node === 'object' &&
      'getAttribute' in node &&
      typeof (node as HTMLElement).getAttribute === 'function' &&
      (node as HTMLElement).getAttribute('data-canvas-mock') != null
    ) {
      return true
    }
  }
  // Harness / no composedPath: walk parents (works when DOM was not rebuilt).
  const target = event.target as {
    closest?: (sel: string) => unknown
    parent?: unknown
  } | null
  if (target != null && typeof target.closest === 'function') {
    if (target.closest('[data-canvas-mock]') != null) return true
  }
  let current: unknown = target
  while (current != null && typeof current === 'object') {
    if (current === mockRoot) return true
    current =
      (current as { parent?: unknown }).parent ??
      (current as { parentElement?: unknown }).parentElement ??
      (current as { parentNode?: unknown }).parentNode ??
      null
  }
  return false
}

function renderMockComposition(
  mockRoot: HTMLElement,
  project: ProjectDocument | null,
  session: SessionUiState | null,
  store: ProjectStore | undefined,
  selectionSync: CanvasSelectionSync | undefined,
  pulseTypeIds: readonly string[] = [],
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
    leds.append(
      buildZoneElement(
        duoLedZone,
        project,
        session,
        store,
        selectionSync,
        pulseTypeIds,
        'mock-led mock-led-duo',
      ),
    )
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
      col.append(
        buildZoneElement(
          bandZone,
          project,
          session,
          store,
          selectionSync,
          pulseTypeIds,
          'mock-orch',
        ),
      )
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
    const selectedId = session?.selectedObjectTypeId ?? null
    const pulseSet = new Set(pulseTypeIds)
    const typesById = new Map(
      project.inventory.objectTypes.map((type) => [type.id, type]),
    )
    const activeSkin = resolveActiveSkin(project, session)
    for (const region of listObjectTypeHitRegions(project.inventory)) {
      const hit = document.createElement('div')
      hit.className = 'mock-object-type-hit'
      hit.setAttribute('data-object-type-id', region.objectTypeId)
      hit.setAttribute('role', 'button')
      hit.tabIndex = 0
      hit.textContent = region.objectTypeId
      if (selectedId === region.objectTypeId) {
        hit.classList.add('is-selected')
      }
      const objectType = typesById.get(region.objectTypeId)
      if (objectType != null) {
        applyHitFillPaint(hit, objectType, project, session, activeSkin)
      }
      if (pulseSet.has(region.objectTypeId)) {
        hit.classList.add('is-pulsing')
      }
      // Stop pan from starting when the operator clicks a hit region.
      hit.addEventListener('pointerdown', (event: PointerEvent) => {
        event.stopPropagation()
      })
      hit.addEventListener('click', (event: MouseEvent) => {
        // Keep host background-deselect from seeing this after mock rebuild.
        event.stopPropagation?.()
        if (store == null) return
        applyObjectTypeHitSelection(store, region.objectTypeId)
        selectionSync?.notifyCanvasHit()
      })
      hit.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        if (event.repeat) return
        event.preventDefault()
        if (store == null) return
        applyObjectTypeHitSelection(store, region.objectTypeId)
        selectionSync?.notifyCanvasHit()
      })
      hitHost.append(hit)
    }
  }

  mockRoot.append(header, body, footer, hitHost)
}

function resolveActiveSkin(
  project: ProjectDocument,
  session: SessionUiState | null,
): Skin | null {
  const skinId = session?.activeSkinId
  if (skinId == null) return null
  return project.skins.find((skin) => skin.id === skinId) ?? null
}

/**
 * HIT_FILL_FIRST_PROPERTY: paint State = session State when this type is
 * selected and that State is listed; otherwise the type’s first State.
 */
function resolveHitPaintStateId(
  objectType: InventoryObjectType,
  session: SessionUiState | null,
): string | null {
  if (objectType.states.length === 0) return null
  if (
    session?.selectedObjectTypeId === objectType.id &&
    session.selectedStateId != null &&
    objectType.states.includes(session.selectedStateId)
  ) {
    return session.selectedStateId
  }
  return objectType.states[0] ?? null
}

/** First-Property face fill via findMapping + resolvePaletteHex (AD-15). */
function applyHitFillPaint(
  hit: HTMLElement,
  objectType: InventoryObjectType,
  project: ProjectDocument,
  session: SessionUiState | null,
  activeSkin: Skin | null,
): void {
  const stateId = resolveHitPaintStateId(objectType, session)
  const propertyId = objectType.properties[0]
  if (stateId == null || propertyId == null || activeSkin == null) {
    hit.style.backgroundColor = ''
    hit.setAttribute('data-hit-unbound', '')
    return
  }
  const mapping = findMapping(activeSkin.mappings, {
    objectTypeId: objectType.id,
    stateId,
    propertyId,
  })
  const hex = resolvePaletteHex(project, mapping?.paletteEntryId ?? null)
  if (hex == null) {
    hit.style.backgroundColor = ''
    hit.setAttribute('data-hit-unbound', '')
    return
  }
  hit.style.backgroundColor = hex
  hit.removeAttribute('data-hit-unbound')
}

function mappingTripleKey(mapping: Mapping): string {
  return `${mapping.objectTypeId}\0${mapping.stateId}\0${mapping.propertyId}`
}

/**
 * Object-type ids whose Mapping rows changed on the active Skin only.
 * Inactive Skin deltas and Palette hex-only edits → empty (no pulse).
 */
function detectMappingChangedObjectTypeIds(
  previous: ProjectDocument,
  next: ProjectDocument,
  activeSkinId: string | null,
): string[] {
  if (activeSkinId == null) return []

  const prevSkin = previous.skins.find((skin) => skin.id === activeSkinId)
  const nextSkin = next.skins.find((skin) => skin.id === activeSkinId)
  if (nextSkin == null) return []

  // Skin newly present under activeSkinId (create/restore) is not an operator
  // Mapping upsert/clear — do not flood-pulse every mapped Object type.
  if (prevSkin == null) return []

  const changed = new Set<string>()

  const prevByTriple = new Map(
    prevSkin.mappings.map((mapping) => [
      mappingTripleKey(mapping),
      mapping.paletteEntryId,
    ]),
  )
  const nextTriples = new Set<string>()

  for (const mapping of nextSkin.mappings) {
    const key = mappingTripleKey(mapping)
    nextTriples.add(key)
    const prevPaletteId = prevByTriple.get(key)
    if (
      prevPaletteId === undefined ||
      prevPaletteId !== mapping.paletteEntryId
    ) {
      changed.add(mapping.objectTypeId)
    }
  }

  for (const [key] of prevByTriple) {
    if (nextTriples.has(key)) continue
    const objectTypeId = key.split('\0')[0]
    if (objectTypeId != null && objectTypeId.length > 0) {
      changed.add(objectTypeId)
    }
  }

  return [...changed]
}

/** Select Object type via session; keep State sticky when still valid (4-2 semantics). */
function applyObjectTypeHitSelection(
  store: ProjectStore,
  objectTypeId: string,
): void {
  const { project, session } = store.getState()
  const nextType =
    project.inventory.objectTypes.find((type) => type.id === objectTypeId) ??
    null
  if (nextType == null) return

  const nextStateId = resolveStateAfterTypeChange(
    nextType,
    session.selectedStateId,
  )
  if (
    session.selectedObjectTypeId === objectTypeId &&
    session.selectedStateId === nextStateId
  ) {
    // Same-type re-click: session unchanged; caller still notifies AUTO_MAPPINGS.
    return
  }

  const nextSession: SessionUiState = {
    ...session,
    selectedObjectTypeId: objectTypeId,
    selectedStateId: nextStateId,
  }
  execute(store, { session: nextSession })
}

function buildZoneElement(
  zone: OrchestratorZoneDescriptor,
  project: ProjectDocument | null,
  session: SessionUiState | null,
  store: ProjectStore | undefined,
  selectionSync: CanvasSelectionSync | undefined,
  pulseTypeIds: readonly string[],
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
  applyZonePaint(el, zone, project, session)

  // CLICK_SURFACE = A: painted band selects matching inventory ObjectType when present.
  const selectableId =
    project == null
      ? null
      : resolveZoneSelectableObjectTypeId(zone.role, project.inventory)
  if (selectableId != null) {
    el.classList.add('is-selectable')
    el.setAttribute('data-zone-object-type-id', selectableId)
    el.setAttribute('role', 'button')
    el.setAttribute('aria-label', zone.label)
    el.tabIndex = 0
    const selectedId = session?.selectedObjectTypeId ?? null
    if (selectedId === selectableId) {
      el.classList.add('is-selected')
    }
    if (pulseTypeIds.includes(selectableId)) {
      el.classList.add('is-pulsing')
    }
    el.addEventListener('pointerdown', (event: PointerEvent) => {
      event.stopPropagation()
    })
    el.addEventListener('click', (event: MouseEvent) => {
      // Keep host background-deselect from seeing this after mock rebuild.
      event.stopPropagation?.()
      if (store == null) return
      applyObjectTypeHitSelection(store, selectableId)
      selectionSync?.notifyCanvasHit()
    })
    el.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      if (event.repeat) return
      event.preventDefault()
      if (store == null) return
      applyObjectTypeHitSelection(store, selectableId)
      selectionSync?.notifyCanvasHit()
    })
  }

  return el
}

/**
 * Zone face colour: when the zone bridges to an inventory ObjectType, paint
 * from the active Skin’s first-Property Mapping (same loop as clicking the
 * LED → editing fill). Otherwise keep ALWAYS_ON metadata Palette id.
 */
function applyZonePaint(
  el: HTMLElement,
  zone: OrchestratorZoneDescriptor,
  project: ProjectDocument | null,
  session: SessionUiState | null,
): void {
  let paletteEntryId: string | null = zone.paletteEntryId

  if (project != null) {
    const objectTypeId = resolveZoneSelectableObjectTypeId(
      zone.role,
      project.inventory,
    )
    if (objectTypeId != null) {
      const objectType = project.inventory.objectTypes.find(
        (type) => type.id === objectTypeId,
      )
      const activeSkin = resolveActiveSkin(project, session)
      const stateId =
        objectType == null ? null : resolveHitPaintStateId(objectType, session)
      const propertyId = objectType?.properties[0] ?? null
      if (activeSkin != null && stateId != null && propertyId != null) {
        const mapping = findMapping(activeSkin.mappings, {
          objectTypeId,
          stateId,
          propertyId,
        })
        // Bridged zone follows Mapping (including unbound stub) — do not
        // fall back to ALWAYS_ON yellow/blue/orange or the LED lies.
        paletteEntryId = mapping?.paletteEntryId ?? null
      }
    }
  }

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
