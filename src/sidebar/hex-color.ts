import { parseOpaqueHex } from '../model/opaque-hex'

export { parseOpaqueHex } from '../model/opaque-hex'

export type Hsv = {
  h: number
  s: number
  v: number
}

export type Rgb = {
  r: number
  g: number
  b: number
}

/** Six uppercase hex digits without `#` (Lot B Color field display). */
export function hexDigits(hex: string): string {
  const normalized = parseOpaqueHex(hex)
  return normalized ? normalized.slice(1) : '000000'
}

export function hexToRgb(hex: string): Rgb {
  const normalized = parseOpaqueHex(hex)
  if (!normalized) return { r: 0, g: 0, b: 0 }
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${toByte(clampByte(r))}${toByte(clampByte(g))}${toByte(clampByte(b))}`
}

function clampByte(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(255, Math.max(0, Math.round(n)))
}

export function hexToHsv(hex: string): Hsv {
  const normalized = parseOpaqueHex(hex)
  if (!normalized) return { h: 0, s: 0, v: 0 }
  const r = Number.parseInt(normalized.slice(1, 3), 16) / 255
  const g = Number.parseInt(normalized.slice(3, 5), 16) / 255
  const b = Number.parseInt(normalized.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  let h = 0
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / delta + 2) / 6
    else h = ((r - g) / delta + 4) / 6
  }
  const s = max === 0 ? 0 : delta / max
  return { h: h * 360, s: s * 100, v: max * 100 }
}

export function hsvToHex(h: number, s: number, v: number): string {
  const hue = ((h % 360) + 360) % 360
  const sat = clamp01(s / 100)
  const val = clamp01(v / 100)
  const c = val * sat
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = val - c
  let r1 = 0
  let g1 = 0
  let b1 = 0
  if (hue < 60) {
    r1 = c
    g1 = x
  } else if (hue < 120) {
    r1 = x
    g1 = c
  } else if (hue < 180) {
    g1 = c
    b1 = x
  } else if (hue < 240) {
    g1 = x
    b1 = c
  } else if (hue < 300) {
    r1 = x
    b1 = c
  } else {
    r1 = c
    b1 = x
  }
  // Floor matches opaque-hex goldens used by the picker matrix (e.g. HSV 200/50/60 → #4C7F99).
  const r = Math.floor((r1 + m) * 255)
  const g = Math.floor((g1 + m) * 255)
  const b = Math.floor((b1 + m) * 255)
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

function toByte(n: number): string {
  return n.toString(16).padStart(2, '0').toUpperCase()
}
