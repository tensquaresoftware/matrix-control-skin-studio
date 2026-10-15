/** Storage-like surface shared by browser localStorage and Node Map stand-ins. */
export type PersistStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

/** No-op adapter when browser storage is blocked — restore/attach become no-ops. */
function createNoopStorage(): PersistStorage {
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }
}

/** In-memory adapter for matrix tests (no real browser localStorage). */
export function createMemoryStorage(): PersistStorage {
  const map = new Map<string, string>()
  return {
    getItem(key) {
      return map.has(key) ? map.get(key)! : null
    },
    setItem(key, value) {
      map.set(key, String(value))
    },
    removeItem(key) {
      map.delete(key)
    },
  }
}

/** Browser default; fails soft to a no-op adapter when localStorage is blocked. */
export function getBrowserStorage(): PersistStorage {
  try {
    return localStorage
  } catch {
    return createNoopStorage()
  }
}
