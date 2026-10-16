/** Opaque `#RRGGBB` only — uppercase on success; case-insensitive parse. */
const OPAQUE_HEX_RE = /^#([0-9A-Fa-f]{6})$/
const BARE_OPAQUE_HEX_RE = /^[0-9A-Fa-f]{6}$/

/** Parse operator input into normalized `#RRGGBB`, or null if invalid. */
export function parseOpaqueHex(raw: string): string | null {
  const match = OPAQUE_HEX_RE.exec(raw.trim())
  if (!match) return null
  return `#${match[1].toUpperCase()}`
}

/**
 * True when a string looks like an opaque colour token (with or without `#`).
 * Used to keep Mapping.paletteEntryId from storing hex-shaped values as ids.
 */
export function looksLikeOpaqueHexToken(raw: string): boolean {
  const trimmed = raw.trim()
  return OPAQUE_HEX_RE.test(trimmed) || BARE_OPAQUE_HEX_RE.test(trimmed)
}
