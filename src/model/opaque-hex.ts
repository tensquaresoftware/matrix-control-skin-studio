/** Opaque `#RRGGBB` or bare `RRGGBB` — uppercase `#RRGGBB` on success. */
const OPAQUE_HEX_RE = /^#([0-9A-Fa-f]{6})$/
const BARE_OPAQUE_HEX_RE = /^[0-9A-Fa-f]{6}$/

/** Parse operator input into normalized `#RRGGBB`, or null if invalid. */
export function parseOpaqueHex(raw: string): string | null {
  const trimmed = raw.trim()
  const withHash = OPAQUE_HEX_RE.exec(trimmed)
  if (withHash) return `#${withHash[1].toUpperCase()}`
  const bare = BARE_OPAQUE_HEX_RE.exec(trimmed)
  if (bare) return `#${bare[0].toUpperCase()}`
  return null
}

/**
 * Document / import / envelope gate: `#RRGGBB` only.
 * Bare `RRGGBB` is rejected (picker may still accept bare via `parseOpaqueHex`).
 */
export function parseHashedOpaqueHex(raw: string): string | null {
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
