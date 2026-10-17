import { execute, flushCoalesce } from '../history/index'
import type { ProjectStore } from '../model/store'
import type { ProjectDocument } from '../model/types'
import { hexToHsv, hsvToHex, parseOpaqueHex } from './hex-color'
import type { PaletteSelectionController } from './palette-selection'

const IDLE_HEX = '#000000'

/**
 * Picker: large swatch + Hue/Sat/Val sliders + mono hex field.
 * LIVE write-through to the selected Palette entry only; idle = no commit.
 */
export function mountPickerPane(
  body: HTMLElement,
  store: ProjectStore,
  selection: PaletteSelectionController,
): void {
  body.classList.add('picker-pane-body')
  body.replaceChildren()

  const swatch = document.createElement('div')
  swatch.className = 'picker-swatch-lg'
  swatch.setAttribute('data-picker-swatch', '')

  const hue = createSlider('Hue', 'hue', 0, 360)
  const sat = createSlider('Sat', 'sat', 0, 100)
  const val = createSlider('Val', 'val', 0, 100)

  const hexRow = document.createElement('div')
  hexRow.className = 'picker-hex-row'

  const hexField = document.createElement('input')
  hexField.type = 'text'
  hexField.className = 'picker-hex-field type-mono'
  hexField.setAttribute('data-picker-hex', '')
  hexField.setAttribute('spellcheck', 'false')
  hexField.setAttribute('autocomplete', 'off')
  hexField.setAttribute('aria-label', 'Hex colour')
  hexRow.append(hexField)

  body.append(swatch, hue.row, sat.row, val.row, hexRow)

  let hexFocused = false
  let syncing = false

  const selectedHex = (): string | null => {
    const id = selection.getSelectedId()
    if (id == null) return null
    const entry = store.getState().project.palette.find((e) => e.id === id)
    return entry?.hex ?? null
  }

  const syncFromStore = (forceHex = false): void => {
    const hex = selectedHex() ?? IDLE_HEX
    const hsv = hexToHsv(hex)
    syncing = true
    try {
      swatch.style.background = hex
      hue.input.value = String(Math.round(hsv.h))
      sat.input.value = String(Math.round(hsv.s))
      val.input.value = String(Math.round(hsv.v))
      if (!hexFocused || forceHex) {
        hexField.value = hex
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

  const onSliderInput = (): void => {
    if (syncing) return
    if (selection.getSelectedId() == null) {
      syncFromStore(true)
      return
    }
    const h = Number(hue.input.value)
    const s = Number(sat.input.value)
    const v = Number(val.input.value)
    if (![h, s, v].every(Number.isFinite)) return
    commitHex(hsvToHex(h, s, v))
  }

  const onPointerUpFlush = (): void => {
    flushCoalesce(store)
  }

  for (const slider of [hue, sat, val]) {
    slider.input.addEventListener('input', onSliderInput)
    slider.input.addEventListener('pointerup', onPointerUpFlush)
    slider.input.addEventListener('mouseup', onPointerUpFlush)
  }

  hexField.addEventListener('focus', () => {
    hexFocused = true
  })

  hexField.addEventListener('input', () => {
    if (syncing) return
    if (selection.getSelectedId() == null) {
      syncFromStore(true)
      return
    }
    const parsed = parseOpaqueHex(hexField.value)
    if (parsed == null) return
    commitHex(parsed)
  })

  hexField.addEventListener('blur', () => {
    hexFocused = false
    if (selection.getSelectedId() == null) {
      syncFromStore(true)
      return
    }
    const parsed = parseOpaqueHex(hexField.value)
    if (parsed == null) {
      const hex = selectedHex()
      hexField.value = hex ?? IDLE_HEX
      return
    }
    commitHex(parsed)
  })

  syncFromStore()
  store.subscribe(syncFromStore)
  selection.subscribe(syncFromStore)
}

function createSlider(
  labelText: string,
  key: string,
  min: number,
  max: number,
): { row: HTMLElement; input: HTMLInputElement } {
  const row = document.createElement('div')
  row.className = 'picker-slider-row'

  const label = document.createElement('span')
  label.className = 'picker-slider-label type-label'
  label.textContent = labelText

  const input = document.createElement('input')
  input.type = 'range'
  input.min = String(min)
  input.max = String(max)
  input.step = '1'
  input.className = 'picker-slider'
  input.setAttribute(`data-picker-${key}`, '')
  input.setAttribute('aria-label', labelText)

  row.append(label, input)
  return { row, input }
}
