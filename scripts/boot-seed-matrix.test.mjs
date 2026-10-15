import assert from 'node:assert/strict'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import { execFileSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tscJs = join(root, 'node_modules/typescript/lib/tsc.js')

const NEW_CONFIRM_BODY =
  'Replace the current project with the seed baseline? Unsaved browser state will be overwritten.'

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

async function importCompiledTs(relPath) {
  const absPath = join(root, relPath)
  const dir = mkdtempSync(join(tmpdir(), 'skin-studio-boot-seed-'))
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

function createElement(tagName) {
  const attrs = new Map()
  const listeners = new Map()
  const node = {
    tagName: String(tagName).toUpperCase(),
    type: '',
    textContent: '',
    style: { cssText: '' },
    children: [],
    parent: null,
    setAttribute(name, value) {
      attrs.set(name, String(value))
    },
    getAttribute(name) {
      return attrs.has(name) ? attrs.get(name) : null
    },
    append(...nodes) {
      for (const child of nodes) {
        child.parent = node
        node.children.push(child)
      }
    },
    appendChild(child) {
      node.append(child)
      return child
    },
    replaceChildren(...nodes) {
      for (const child of node.children) child.parent = null
      node.children = []
      node.append(...nodes)
    },
    remove() {
      if (!node.parent) return
      node.parent.children = node.parent.children.filter((c) => c !== node)
      node.parent = null
    },
    querySelector(selector) {
      const matchAttr = /^\[([^\]]+)\]$/.exec(selector)
      const walk = (el) => {
        if (matchAttr && el.getAttribute(matchAttr[1]) !== null) return el
        for (const child of el.children) {
          const found = walk(child)
          if (found) return found
        }
        return null
      }
      return walk(node)
    },
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, [])
      listeners.get(type).push(fn)
    },
    click() {
      for (const fn of listeners.get('click') || []) fn()
    },
  }
  return node
}

function installMinimalDocument() {
  const previous = globalThis.document
  globalThis.document = { createElement }
  return () => {
    if (previous === undefined) delete globalThis.document
    else globalThis.document = previous
  }
}

function createRoot() {
  return createElement('div')
}

function findButtonByLabel(root, label) {
  const walk = (el) => {
    if (el.tagName === 'BUTTON' && el.textContent === label) return el
    for (const child of el.children) {
      const found = walk(child)
      if (found) return found
    }
    return null
  }
  return walk(root)
}

function sampleEditedProject(seedProject) {
  return {
    ...seedProject,
    palette: [
      ...seedProject.palette,
      { id: 'custom', hex: '#112233', constantName: 'kCustom' },
    ],
  }
}

function sampleSession() {
  return {
    selectedObjectTypeId: 'ot-1',
    selectedStateId: 'idle',
    activeSkinId: 'black-green',
  }
}

/** Same exported helper main.ts uses, against injectable storage. */
function bootWithStorage(bootProjectStore, createStore, storage) {
  const store = createStore()
  const restored = bootProjectStore(store, storage)
  return { store, restored }
}

describe('boot seed I/O matrix', () => {
  it('first open: no envelope → seed + empty session; autosave writes project key', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const { bootProjectStore } = await importCompiledTs('src/boot-project.ts')

    const storage = persist.createMemoryStorage()
    assert.equal(storage.getItem(persist.PROJECT_ENVELOPE_KEY), null)

    const { store, restored } = bootWithStorage(
      bootProjectStore,
      model.createStore,
      storage,
    )
    assert.equal(restored, false)

    const expectedProject = seed.createSeedProject()
    const expectedSession = model.createEmptySession()
    assert.deepEqual(store.getState().project, expectedProject)
    assert.deepEqual(store.getState().session, expectedSession)
    assert.ok(store.getState().project.skins.length > 0)

    const raw = storage.getItem(persist.PROJECT_ENVELOPE_KEY)
    assert.notEqual(raw, null)
    const envelope = JSON.parse(raw)
    assert.deepEqual(envelope.project, expectedProject)
    assert.deepEqual(envelope.session, expectedSession)
  })

  it('cold reopen: valid envelope restores; seed not applied', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const { bootProjectStore } = await importCompiledTs('src/boot-project.ts')

    const storage = persist.createMemoryStorage()
    const writer = model.createStore()
    persist.attachAutosave(writer, storage)

    const edited = sampleEditedProject(seed.createSeedProject())
    const session = sampleSession()
    writer.apply({ project: edited, session })

    const saved = JSON.parse(storage.getItem(persist.PROJECT_ENVELOPE_KEY))
    const { store, restored } = bootWithStorage(
      bootProjectStore,
      model.createStore,
      storage,
    )

    assert.equal(restored, true)
    assert.deepEqual(store.getState().project, saved.project)
    assert.deepEqual(store.getState().session, saved.session)
    assert.notDeepEqual(store.getState().project, seed.createSeedProject())
    assert.equal(
      store.getState().project.palette.some((e) => e.id === 'custom'),
      true,
    )
  })

  it('corrupt then first-open: CLEAR → restore false → seed; boot does not throw', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const { bootProjectStore } = await importCompiledTs('src/boot-project.ts')

    const storage = persist.createMemoryStorage()
    storage.setItem(persist.PROJECT_ENVELOPE_KEY, '{ not json')

    let result
    assert.doesNotThrow(() => {
      result = bootWithStorage(bootProjectStore, model.createStore, storage)
    })

    assert.equal(result.restored, false)
    assert.deepEqual(result.store.getState().project, seed.createSeedProject())
    assert.deepEqual(result.store.getState().session, model.createEmptySession())

    const raw = storage.getItem(persist.PROJECT_ENVELOPE_KEY)
    assert.notEqual(raw, null)
    const envelope = JSON.parse(raw)
    assert.deepEqual(envelope.project, seed.createSeedProject())
  })

  it('New confirm: replaces store with seed + empty session; prefs untouched', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const { mountBootSurface } = await importCompiledTs('src/boot-surface.ts')
      const storage = persist.createMemoryStorage()
      storage.setItem(
        persist.PREFS_KEY,
        JSON.stringify({
          zoomStep: '125%',
          panXY: { x: 1, y: 2 },
          sidebarPaneHeights: {},
        }),
      )
      const prefsBefore = storage.getItem(persist.PREFS_KEY)

      const store = model.createStore()
      persist.attachAutosave(store, storage)
      store.apply({
        project: sampleEditedProject(seed.createSeedProject()),
        session: sampleSession(),
      })
      const before = store.getState()

      const root = createRoot()
      mountBootSurface(root, store)

      const newButton = findButtonByLabel(root, 'New')
      assert.ok(newButton, 'expected New control')
      newButton.click()

      const scrim = root.querySelector('[data-boot-confirm]')
      assert.ok(scrim, 'expected confirm modal')
      const body = scrim.children[0]?.children[0]
      assert.equal(body?.textContent, NEW_CONFIRM_BODY)

      const confirmNew = findButtonByLabel(scrim, 'New')
      assert.ok(confirmNew)
      // Destructive primary is the second New (panel actions), not the chrome New.
      confirmNew.click()

      assert.equal(root.querySelector('[data-boot-confirm]'), null)
      assert.deepEqual(store.getState().project, seed.createSeedProject())
      assert.deepEqual(store.getState().session, model.createEmptySession())
      assert.notDeepEqual(store.getState().project, before.project)
      assert.equal(storage.getItem(persist.PREFS_KEY), prefsBefore)

      const envelope = JSON.parse(storage.getItem(persist.PROJECT_ENVELOPE_KEY))
      assert.deepEqual(envelope.project, seed.createSeedProject())
      assert.deepEqual(envelope.session, model.createEmptySession())
    } finally {
      restoreDoc()
    }
  })

  it('New cancel: store and envelope unchanged; modal closed', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const { mountBootSurface } = await importCompiledTs('src/boot-surface.ts')
      const storage = persist.createMemoryStorage()
      const store = model.createStore()
      persist.attachAutosave(store, storage)
      store.apply({
        project: sampleEditedProject(seed.createSeedProject()),
        session: sampleSession(),
      })
      const before = store.getState()
      const envelopeBefore = storage.getItem(persist.PROJECT_ENVELOPE_KEY)

      const root = createRoot()
      mountBootSurface(root, store)
      findButtonByLabel(root, 'New').click()

      assert.ok(root.querySelector('[data-boot-confirm]'))
      const cancel = findButtonByLabel(root.querySelector('[data-boot-confirm]'), 'Cancel')
      assert.ok(cancel)
      cancel.click()

      assert.equal(root.querySelector('[data-boot-confirm]'), null)
      assert.deepEqual(store.getState(), before)
      assert.equal(storage.getItem(persist.PROJECT_ENVELOPE_KEY), envelopeBefore)
    } finally {
      restoreDoc()
    }
  })
})
