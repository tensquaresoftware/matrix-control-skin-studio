import { execute, flushCoalesce } from '../history/index'
import type { ProjectStore } from '../model/store'
import type { ProjectDocument } from '../model/types'
import {
  hexDigits,
  hexToHsv,
  hexToRgb,
  hsvToHex,
  parseOpaqueHex,
  rgbToHex,
} from './hex-color'
import type { PaletteSelectionController } from './palette-selection'

const IDLE_HEX = '#000000'

/**
 * Color tab: SV square + vertical hue + `#` / RGB row.
 * LIVE write-through to the selected Palette entry only; idle = no commit (AD-16).
 */
export function mountPickerPane(
  body: HTMLElement,
  store: ProjectStore,
  selection: PaletteSelectionController,
): void {
  body.classList.add('picker-pane-body')
  body.replaceChildren()

  const stage = document.createElement('div')
  stage.className = 'picker-sv-stage'
  stage.setAttribute('data-picker-sv-stage', '')

  const square = document.createElement('div')
  square.className = 'picker-sv-square'
  square.setAttribute('data-picker-sv', '')
  square.setAttribute('role', 'slider')
  square.setAttribute('aria-label', 'Saturation and brightness')
  square.tabIndex = 0

  const crosshair = document.createElement('div')
  crosshair.className = 'picker-sv-crosshair'
  crosshair.setAttribute('data-picker-sv-crosshair', '')
  crosshair.setAttribute('aria-hidden', 'true')
  square.append(crosshair)

  const hue = document.createElement('input')
  hue.type = 'range'
  hue.min = '0'
  hue.max = '360'
  hue.step = '1'
  hue.className = 'picker-hue-strip'
  hue.setAttribute('data-picker-hue', '')
  hue.setAttribute('aria-label', 'Hue')
  hue.setAttribute('orient', 'vertical')

  stage.append(square, hue)

  const fields = document.createElement('div')
  fields.className = 'picker-fields-row'
  fields.setAttribute('data-picker-fields', '')

  const hashLabel = document.createElement('span')
  hashLabel.className = 'picker-hash-label'
  hashLabel.textContent = '#'
  hashLabel.setAttribute('aria-hidden', 'true')

  const hexField = document.createElement('input')
  hexField.type = 'text'
  hexField.className = 'picker-hex-field type-mono'
  hexField.setAttribute('data-picker-hex', '')
  hexField.setAttribute('spellcheck', 'false')
  hexField.setAttribute('autocomplete', 'off')
  hexField.setAttribute('aria-label', 'Hex colour')
  // Allow `#` + 6 digits so a paste of `#FFCC00` is not truncated before strip.
  hexField.maxLength = 7
  hexField.size = 6

  const rField = createRgbField('R', 'r')
  const gField = createRgbField('G', 'g')
  const bField = createRgbField('B', 'b')

  fields.append(
    hashLabel,
    hexField,
    rField.wrap,
    gField.wrap,
    bField.wrap,
  )

  body.append(stage, fields)

  let hexFocused = false
  let rgbFocused: 'r' | 'g' | 'b' | null = null
  let syncing = false
  let hsv = { h: 0, s: 0, v: 0 }

  const selectedHex = (): string | null => {
    const id = selection.getSelectedId()
    if (id == null) return null
    const entry = store.getState().project.palette.find((e) => e.id === id)
    return entry?.hex ?? null
  }

  const paintSquare = (): void => {
    const pure = hsvToHex(hsv.h, 100, 100)
    square.style.background = `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${pure})`
    crosshair.style.left = `${hsv.s}%`
    crosshair.style.top = `${100 - hsv.v}%`
  }

  const syncFromStore = (forceFields = false): void => {
    const hex = selectedHex() ?? IDLE_HEX
    hsv = hexToHsv(hex)
    const rgb = hexToRgb(hex)
    syncing = true
    try {
      hue.value = String(Math.round(hsv.h))
      paintSquare()
      if (!hexFocused || forceFields) {
        hexField.value = hexDigits(hex)
      }
      if (rgbFocused !== 'r' || forceFields) {
        rField.input.value = String(rgb.r)
      }
      if (rgbFocused !== 'g' || forceFields) {
        gField.input.value = String(rgb.g)
      }
      if (rgbFocused !== 'b' || forceFields) {
        bField.input.value = String(rgb.b)
      }
    } finally {
      syncing = false
    }
  }

  const commitHex = (hex: string): void => {
    const id = selection.getSelectedId()
    if (id == null) return
    const { project } = store.getState()
    const index = project.palette.findIndex((e) => e.id === id)
    if (index < 0) return
    if (project.palette[index].hex === hex) {
      syncFromStore()
      return
    }
    const next: ProjectDocument = {
      ...project,
      palette: project.palette.map((entry, i) =>
        i === index ? { ...entry, hex } : entry,
      ),
    }
    execute(store, { project: next }, { coalesceKey: `hex:${id}` })
  }

  const commitFromHsv = (): void => {
    if (selection.getSelectedId() == null) {
      syncFromStore(true)
      return
    }
    commitHex(hsvToHex(hsv.h, hsv.s, hsv.v))
  }

  const onHueInput = (): void => {
    if (syncing) return
    const h = Number(hue.value)
    if (!Number.isFinite(h)) return
    hsv = { ...hsv, h }
    paintSquare()
    commitFromHsv()
  }

  const onPointerUpFlush = (): void => {
    flushCoalesce(store)
  }

  hue.addEventListener('input', onHueInput)
  hue.addEventListener('pointerup', onPointerUpFlush)
  hue.addEventListener('mouseup', onPointerUpFlush)
  hue.addEventListener('pointercancel', onPointerUpFlush)
  hue.addEventListener('lostpointercapture', onPointerUpFlush)

  const applySvFromClient = (clientX: number, clientY: number): void => {
    const rect = square.getBoundingClientRect?.()
    if (rect == null || rect.width <= 0 || rect.height <= 0) {
      // Test / headless hosts without layout — treat as centre.
      hsv = { ...hsv, s: 50, v: 50 }
      paintSquare()
      commitFromHsv()
      return
    }
    const s = clamp01((clientX - rect.left) / rect.width) * 100
    const v = (1 - clamp01((clientY - rect.top) / rect.height)) * 100
    hsv = { ...hsv, s, v }
    paintSquare()
    commitFromHsv()
  }

  let svDragging = false

  square.addEventListener('pointerdown', (event: PointerEvent) => {
    if (event.button !== 0) return
    event.preventDefault()
    svDragging = true
    square.setPointerCapture?.(event.pointerId)
    applySvFromClient(event.clientX, event.clientY)
  })

  square.addEventListener('pointermove', (event: PointerEvent) => {
    if (!svDragging) return
    applySvFromClient(event.clientX, event.clientY)
  })

  const endSvDrag = (event: PointerEvent): void => {
    if (!svDragging) return
    svDragging = false
    try {
      square.releasePointerCapture?.(event.pointerId)
    } catch {
      // capture may already be gone
    }
    flushCoalesce(store)
  }

  square.addEventListener('pointerup', endSvDrag)
  square.addEventListener('pointercancel', endSvDrag)
  square.addEventListener('lostpointercapture', endSvDrag)

  hexField.addEventListener('focus', () => {
    hexFocused = true
  })

  hexField.addEventListener('input', () => {
    if (syncing) return
    if (selection.getSelectedId() == null) {
      syncFromStore(true)
      return
    }
    const parsed = parseOpaqueHex(stripLeadingHash(hexField.value))
    if (parsed == null) return
    commitHex(parsed)
    // Lot B: keep the field as 6 digits (normalize `#` / casing while typing).
    const digits = hexDigits(parsed)
    if (hexField.value !== digits) {
      syncing = true
      try {
        hexField.value = digits
      } finally {
        syncing = false
      }
    }
  })

  hexField.addEventListener('blur', () => {
    hexFocused = false
    if (selection.getSelectedId() == null) {
      syncFromStore(true)
      flushCoalesce(store)
      return
    }
    const parsed = parseOpaqueHex(stripLeadingHash(hexField.value))
    if (parsed == null) {
      const hex = selectedHex()
      hexField.value = hexDigits(hex ?? IDLE_HEX)
      flushCoalesce(store)
      return
    }
    commitHex(parsed)
    flushCoalesce(store)
  })

  const wireRgb = (
    field: { input: HTMLInputElement; key: 'r' | 'g' | 'b' },
  ): void => {
    field.input.addEventListener('focus', () => {
      rgbFocused = field.key
    })
    field.input.addEventListener('input', () => {
      if (syncing) return
      if (selection.getSelectedId() == null) {
        syncFromStore(true)
        return
      }
      const r = parseRgbChannel(rField.input.value)
      const g = parseRgbChannel(gField.input.value)
      const b = parseRgbChannel(bField.input.value)
      if (r == null || g == null || b == null) return
      commitHex(rgbToHex(r, g, b))
    })
    field.input.addEventListener('blur', () => {
      rgbFocused = null
      if (selection.getSelectedId() == null) {
        syncFromStore(true)
        flushCoalesce(store)
        return
      }
      const r = parseRgbChannel(rField.input.value)
      const g = parseRgbChannel(gField.input.value)
      const b = parseRgbChannel(bField.input.value)
      if (r == null || g == null || b == null) {
        syncFromStore(true)
        flushCoalesce(store)
        return
      }
      commitHex(rgbToHex(r, g, b))
      flushCoalesce(store)
    })
  }

  wireRgb(rField)
  wireRgb(gField)
  wireRgb(bField)

  syncFromStore()
  store.subscribe(syncFromStore)
  selection.subscribe(syncFromStore)
}

function createRgbField(
  labelText: string,
  key: 'r' | 'g' | 'b',
): { wrap: HTMLElement; input: HTMLInputElement; key: 'r' | 'g' | 'b' } {
  const wrap = document.createElement('label')
  wrap.className = 'picker-rgb-field'

  const label = document.createElement('span')
  label.className = 'picker-rgb-label'
  label.textContent = `${labelText}:`

  const input = document.createElement('input')
  input.type = 'text'
  input.inputMode = 'numeric'
  input.className = 'picker-rgb-input type-mono'
  input.setAttribute(`data-picker-${key}`, '')
  input.setAttribute('aria-label', labelText)
  input.maxLength = 3
  input.size = 3

  wrap.append(label, input)
  return { wrap, input, key }
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

/** Strip a leading `#` so paste of `#RRGGBB` can normalize to six digits. */
function stripLeadingHash(raw: string): string {
  const trimmed = raw.trim()
  return trimmed.startsWith('#') ? trimmed.slice(1) : trimmed
}

/** Integer channel 0–255; empty / whitespace / non-integer → null (no coerce). */
function parseRgbChannel(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  if (!/^\d+$/.test(trimmed)) return null
  const n = Number(trimmed)
  if (!Number.isInteger(n) || n < 0 || n > 255) return null
  return n
}
