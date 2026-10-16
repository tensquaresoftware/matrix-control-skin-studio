import { PREFS_KEY } from './keys'
import type { PersistStorage } from './storage'
import { getBrowserStorage } from './storage'

/** Prefs-only document (AD-8) — never written into the project envelope. */
export type PrefsDocument = {
  zoomStep: string
  panXY: { x: number; y: number }
  sidebarPaneHeights: Record<string, number>
}

export const DEFAULT_PREFS: PrefsDocument = {
  zoomStep: '100%',
  panXY: { x: 0, y: 0 },
  sidebarPaneHeights: {},
}

/** Discrete Zoom steps only (FR-11 / AD-8). */
export const ZOOM_STEPS = [
  '50%',
  '75%',
  '100%',
  '125%',
  '150%',
  '175%',
  '200%',
] as const

export type ZoomStep = (typeof ZOOM_STEPS)[number]

/** Unknown / invalid stored zoomStep → fresh default `100%`. */
export function clampZoomStep(zoomStep: string): ZoomStep {
  return (ZOOM_STEPS as readonly string[]).includes(zoomStep)
    ? (zoomStep as ZoomStep)
    : (DEFAULT_PREFS.zoomStep as ZoomStep)
}

export function getDefaultPrefs(): PrefsDocument {
  return {
    zoomStep: DEFAULT_PREFS.zoomStep,
    panXY: { ...DEFAULT_PREFS.panXY },
    sidebarPaneHeights: { ...DEFAULT_PREFS.sidebarPaneHeights },
  }
}

/**
 * Load prefs from storage, or defaults when the key is absent / unreadable.
 * Does not force a write of `skin-studio:prefs` (chrome writer lands later).
 */
export function loadPrefs(storage: PersistStorage = getBrowserStorage()): PrefsDocument {
  let raw: string | null
  try {
    raw = storage.getItem(PREFS_KEY)
  } catch {
    return getDefaultPrefs()
  }

  if (raw === null) {
    return getDefaultPrefs()
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isPrefsDocument(parsed)) {
      return getDefaultPrefs()
    }
    return {
      zoomStep: parsed.zoomStep,
      panXY: { x: parsed.panXY.x, y: parsed.panXY.y },
      sidebarPaneHeights: { ...parsed.sidebarPaneHeights },
    }
  } catch {
    return getDefaultPrefs()
  }
}

/**
 * Persist the full prefs document under `skin-studio:prefs`.
 * Write failures fail soft (no throw into UI). Never touches the project envelope.
 */
export function savePrefs(
  prefs: PrefsDocument,
  storage: PersistStorage = getBrowserStorage(),
): void {
  try {
    storage.setItem(
      PREFS_KEY,
      JSON.stringify({
        zoomStep: prefs.zoomStep,
        panXY: { x: prefs.panXY.x, y: prefs.panXY.y },
        sidebarPaneHeights: { ...prefs.sidebarPaneHeights },
      }),
    )
  } catch {
    // fail soft — chrome must not throw into the operator UI
  }
}

function isPrefsDocument(value: unknown): value is PrefsDocument {
  if (value === null || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  if (typeof o.zoomStep !== 'string') return false
  if (o.panXY === null || typeof o.panXY !== 'object') return false
  const pan = o.panXY as Record<string, unknown>
  if (typeof pan.x !== 'number' || typeof pan.y !== 'number') return false
  // Reject NaN / Infinity — typeof NaN === 'number' and would poison canvas transform.
  if (!Number.isFinite(pan.x) || !Number.isFinite(pan.y)) return false
  if (o.sidebarPaneHeights === null || typeof o.sidebarPaneHeights !== 'object') {
    return false
  }
  return true
}
