import assert from 'node:assert/strict'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import { execFileSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tscJs = join(root, 'node_modules/typescript/lib/tsc.js')

const PREFS_FIELDS = ['zoomStep', 'panXY', 'sidebarPaneHeights']

/** Node ESM requires explicit .js on relative specifiers; tsc emit omits them. */
function addJsExtensionsToRelativeImports(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      addJsExtensionsToRelativeImports(full)
      continue
    }
    if (!entry.name.endsWith('.js')) continue
    const code = readFileSync(full, 'utf8').replace(
      /((?:import|export)(?:\s+[^'"()]+?)?\s+from\s+|import\s+)\s*(['"])(\.[^'"]+)\2/g,
      (match, prefix, quote, spec) => {
        if (/\.(js|json|mjs|cjs)$/.test(spec)) return match
        return `${prefix}${quote}${spec}.js${quote}`
      },
    )
    writeFileSync(full, code)
  }
}

/**
 * Emit a src/*.ts entry (and its relative imports) via tsc, then import the JS.
 * Nested paths under src/ keep their relative layout under outDir.
 */
async function importCompiledTs(relPath) {
  const absPath = join(root, relPath)
  const dir = mkdtempSync(join(tmpdir(), 'skin-studio-persist-'))
  try {
    execFileSync(
      process.execPath,
      [
        tscJs,
        '--ignoreConfig',
        '--pretty',
        'false',
        '--target',
        'ES2022',
        '--module',
        'ESNext',
        '--moduleResolution',
        'bundler',
        '--skipLibCheck',
        '--outDir',
        dir,
        '--rootDir',
        join(root, 'src'),
        absPath,
      ],
      { cwd: root, stdio: 'pipe' },
    )
    addJsExtensionsToRelativeImports(dir)
    const outJs = join(dir, relPath.replace(/^src\//, '').replace(/\.ts$/, '.js'))
    return await import(pathToFileURL(outJs).href)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function sampleProject() {
  return {
    formatVersion: 1,
    palette: [{ id: 'duoLedYellow', hex: '#FFCC00' }],
    skins: [
      {
        id: 'black-green',
        displayName: 'Black/Green',
        mappings: [],
      },
    ],
    inventory: { source: 'seed-placeholder', objectTypes: [] },
  }
}

function sampleSession() {
  return {
    selectedObjectTypeId: 'ot-1',
    selectedStateId: 'idle',
    activeSkinId: 'black-green',
  }
}

describe('persist I/O matrix', () => {
  it('autosave on apply: envelope matches store; prefs key untouched', async () => {
    const { createStore } = await importCompiledTs('src/model/index.ts')
    const {
      attachAutosave,
      createMemoryStorage,
      PROJECT_ENVELOPE_KEY,
      PREFS_KEY,
    } = await importCompiledTs('src/persist/index.ts')

    const storage = createMemoryStorage()
    storage.setItem(PREFS_KEY, JSON.stringify({ zoomStep: '125%', panXY: { x: 1, y: 2 }, sidebarPaneHeights: {} }))
    const prefsBefore = storage.getItem(PREFS_KEY)

    const store = createStore()
    attachAutosave(store, storage)

    store.apply({
      project: sampleProject(),
      session: sampleSession(),
    })

    const raw = storage.getItem(PROJECT_ENVELOPE_KEY)
    assert.notEqual(raw, null)
    const envelope = JSON.parse(raw)
    assert.deepEqual(envelope.project, store.getState().project)
    assert.deepEqual(envelope.session, store.getState().session)
    assert.equal(storage.getItem(PREFS_KEY), prefsBefore)
  })

  it('prefs separation: envelope has only project + session; no prefs fields', async () => {
    const { createStore } = await importCompiledTs('src/model/index.ts')
    const {
      attachAutosave,
      createMemoryStorage,
      PROJECT_ENVELOPE_KEY,
      PREFS_KEY,
      loadPrefs,
      getDefaultPrefs,
    } = await importCompiledTs('src/persist/index.ts')

    const storage = createMemoryStorage()
    const store = createStore()
    attachAutosave(store, storage)

    store.apply({
      project: sampleProject(),
      session: sampleSession(),
    })

    const envelope = JSON.parse(storage.getItem(PROJECT_ENVELOPE_KEY))
    assert.deepEqual(Object.keys(envelope).sort(), ['project', 'session'])
    for (const field of PREFS_FIELDS) {
      assert.equal(field in envelope, false, `prefs field leaked into envelope: ${field}`)
      assert.equal(field in envelope.project, false)
      assert.equal(field in envelope.session, false)
    }

    // Prefs helpers return defaults without forcing a prefs write
    assert.equal(storage.getItem(PREFS_KEY), null)
    assert.deepEqual(loadPrefs(storage), getDefaultPrefs())
    assert.equal(getDefaultPrefs().zoomStep, '100%')
  })

  it('cold reopen valid: store matches saved envelope; formatVersion stays 1', async () => {
    const { createStore, createEmptyProject, createEmptySession } =
      await importCompiledTs('src/model/index.ts')
    const {
      attachAutosave,
      createMemoryStorage,
      restoreEnvelope,
      PROJECT_ENVELOPE_KEY,
    } = await importCompiledTs('src/persist/index.ts')

    const storage = createMemoryStorage()
    const writer = createStore()
    attachAutosave(writer, storage)
    writer.apply({
      project: sampleProject(),
      session: sampleSession(),
    })

    const saved = JSON.parse(storage.getItem(PROJECT_ENVELOPE_KEY))
    assert.equal(saved.project.formatVersion, 1)

    // Cold reopen: fresh empty store + restore
    const boot = createStore()
    assert.deepEqual(boot.getState().project, createEmptyProject())
    assert.deepEqual(boot.getState().session, createEmptySession())

    const restored = restoreEnvelope(boot, storage)
    assert.equal(restored, true)

    assert.deepEqual(boot.getState().project, saved.project)
    assert.deepEqual(boot.getState().session, saved.session)
    assert.equal(boot.getState().project.formatVersion, 1)
  })

  it('no prior envelope: restore false; store stays empty baseline; no seed apply', async () => {
    const { createStore, createEmptyProject, createEmptySession } =
      await importCompiledTs('src/model/index.ts')
    const { createMemoryStorage, restoreEnvelope, PROJECT_ENVELOPE_KEY } =
      await importCompiledTs('src/persist/index.ts')

    const storage = createMemoryStorage()
    assert.equal(storage.getItem(PROJECT_ENVELOPE_KEY), null)

    const store = createStore()
    let restored
    assert.doesNotThrow(() => {
      restored = restoreEnvelope(store, storage)
    })
    assert.equal(restored, false)

    assert.deepEqual(store.getState().project, createEmptyProject())
    assert.deepEqual(store.getState().session, createEmptySession())
    assert.equal(store.getState().project.skins.length, 0)
    assert.equal(store.getState().project.palette.length, 0)
  })

  it('corrupt / invalid envelope: CLEAR bad key; restore false; empty store; no throw', async () => {
    const { createStore, createEmptyProject, createEmptySession } =
      await importCompiledTs('src/model/index.ts')
    const { createMemoryStorage, restoreEnvelope, PROJECT_ENVELOPE_KEY } =
      await importCompiledTs('src/persist/index.ts')

    const cases = [
      '{ not json',
      JSON.stringify({ project: { formatVersion: 2 }, session: sampleSession() }),
      JSON.stringify({ project: sampleProject() }),
      JSON.stringify({ session: sampleSession() }),
      JSON.stringify({
        project: sampleProject(),
        session: { selectedObjectTypeId: 1, selectedStateId: null, activeSkinId: null },
      }),
      'null',
      '"string"',
    ]

    for (const bad of cases) {
      const storage = createMemoryStorage()
      storage.setItem(PROJECT_ENVELOPE_KEY, bad)
      const store = createStore()

      let restored
      assert.doesNotThrow(() => {
        restored = restoreEnvelope(store, storage)
      })
      assert.equal(restored, false)
      assert.equal(
        storage.getItem(PROJECT_ENVELOPE_KEY),
        null,
        `expected CLEAR for: ${bad.slice(0, 40)}`,
      )
      assert.deepEqual(store.getState().project, createEmptyProject())
      assert.deepEqual(store.getState().session, createEmptySession())
    }
  })

  it('getItem throw: restore false, CLEAR attempted, empty baseline', async () => {
    const { createStore, createEmptyProject, createEmptySession } =
      await importCompiledTs('src/model/index.ts')
    const { restoreEnvelope } = await importCompiledTs('src/persist/index.ts')

    let removeItemCalls = 0
    const storage = {
      getItem() {
        throw new Error('storage blocked')
      },
      setItem() {},
      removeItem() {
        removeItemCalls += 1
      },
    }

    const store = createStore()
    let restored
    assert.doesNotThrow(() => {
      restored = restoreEnvelope(store, storage)
    })
    assert.equal(restored, false)
    assert.ok(removeItemCalls >= 1, 'expected CLEAR via removeItem')
    assert.deepEqual(store.getState().project, createEmptyProject())
    assert.deepEqual(store.getState().session, createEmptySession())
  })

  it('storage write failure: autosave fails soft (no throw into UI)', async () => {
    const { createStore } = await importCompiledTs('src/model/index.ts')
    const { attachAutosave } = await importCompiledTs('src/persist/index.ts')

    const storage = {
      getItem() {
        return null
      },
      setItem() {
        throw new Error('quota exceeded')
      },
      removeItem() {},
    }

    const store = createStore()
    attachAutosave(store, storage)

    assert.doesNotThrow(() => {
      store.apply({
        project: sampleProject(),
        session: sampleSession(),
      })
    })
  })

  it('getBrowserStorage happy: default restore/autosave use stubbed localStorage', async () => {
    const { createStore, createEmptyProject, createEmptySession } =
      await importCompiledTs('src/model/index.ts')
    const {
      attachAutosave,
      getBrowserStorage,
      restoreEnvelope,
      PROJECT_ENVELOPE_KEY,
    } = await importCompiledTs('src/persist/index.ts')

    const map = new Map()
    const stub = {
      getItem(key) {
        return map.has(key) ? map.get(key) : null
      },
      setItem(key, value) {
        map.set(key, String(value))
      },
      removeItem(key) {
        map.delete(key)
      },
    }

    const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    Object.defineProperty(globalThis, 'localStorage', {
      value: stub,
      configurable: true,
      writable: true,
    })

    try {
      const adapter = getBrowserStorage()
      assert.equal(adapter, stub)
      assert.equal(typeof adapter.getItem, 'function')
      assert.equal(typeof adapter.setItem, 'function')
      assert.equal(typeof adapter.removeItem, 'function')

      const writer = createStore()
      // Default arg path — same as main.ts (no storage override)
      attachAutosave(writer)
      writer.apply({
        project: sampleProject(),
        session: sampleSession(),
      })
      assert.notEqual(stub.getItem(PROJECT_ENVELOPE_KEY), null)

      const boot = createStore()
      assert.deepEqual(boot.getState().project, createEmptyProject())
      assert.deepEqual(boot.getState().session, createEmptySession())
      assert.equal(restoreEnvelope(boot), true)
      assert.deepEqual(boot.getState().project, sampleProject())
      assert.deepEqual(boot.getState().session, sampleSession())
    } finally {
      if (previous) {
        Object.defineProperty(globalThis, 'localStorage', previous)
      } else {
        delete globalThis.localStorage
      }
    }
  })

  it('getBrowserStorage blocked: soft-fail to noop; default restore/autosave stay safe', async () => {
    const { createStore, createEmptyProject, createEmptySession } =
      await importCompiledTs('src/model/index.ts')
    const { attachAutosave, getBrowserStorage, restoreEnvelope } =
      await importCompiledTs('src/persist/index.ts')

    const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    Object.defineProperty(globalThis, 'localStorage', {
      get() {
        throw new Error('localStorage blocked')
      },
      configurable: true,
    })

    try {
      const adapter = getBrowserStorage()
      assert.equal(adapter.getItem('any'), null)
      assert.doesNotThrow(() => adapter.setItem('k', 'v'))
      assert.doesNotThrow(() => adapter.removeItem('k'))

      const store = createStore()
      let restored
      assert.doesNotThrow(() => {
        restored = restoreEnvelope(store)
      })
      assert.equal(restored, false)
      assert.deepEqual(store.getState().project, createEmptyProject())
      assert.deepEqual(store.getState().session, createEmptySession())

      assert.doesNotThrow(() => attachAutosave(store))
      assert.doesNotThrow(() => {
        store.apply({
          project: sampleProject(),
          session: sampleSession(),
        })
      })
    } finally {
      if (previous) {
        Object.defineProperty(globalThis, 'localStorage', previous)
      } else {
        delete globalThis.localStorage
      }
    }
  })
})
