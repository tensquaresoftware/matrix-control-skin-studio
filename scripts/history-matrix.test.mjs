import assert from 'node:assert/strict'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import { execFileSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tscJs = join(root, 'node_modules/typescript/lib/tsc.js')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

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
  const dir = mkdtempSync(join(tmpdir(), 'skin-studio-history-'))
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function baseProject(overrides = {}) {
  return {
    formatVersion: 1,
    palette: [
      { id: 'c1', hex: '#111111', constantName: 'Colour 1' },
      { id: 'c2', hex: '#222222', constantName: 'Colour 2' },
    ],
    skins: [
      {
        id: 'skin-a',
        displayName: 'Skin A',
        mappings: [
          {
            objectTypeId: 'ot',
            stateId: 'idle',
            propertyId: 'fill',
            paletteEntryId: 'c1',
          },
        ],
      },
      {
        id: 'skin-b',
        displayName: 'Skin B',
        mappings: [],
      },
    ],
    inventory: {
      objectTypes: [
        { id: 'ot', states: ['idle', 'on'], properties: ['fill'] },
      ],
    },
    ...overrides,
  }
}

function baseSession(overrides = {}) {
  return {
    selectedObjectTypeId: null,
    selectedStateId: null,
    activeSkinId: 'skin-a',
    ...overrides,
  }
}

function withHex(project, entryId, hex) {
  return {
    ...project,
    palette: project.palette.map((entry) =>
      entry.id === entryId ? { ...entry, hex } : entry,
    ),
  }
}

function installMinimalDocument() {
  const previous = globalThis.document
  const listeners = new Map()

  const makeEl = (tag = 'div') => {
    const attrs = new Map()
    const children = []
    const classList = {
      _set: new Set(),
      add(...names) {
        for (const n of names) this._set.add(n)
      },
      contains(n) {
        return this._set.has(n)
      },
      remove(...names) {
        for (const n of names) this._set.delete(n)
      },
    }
    const el = {
      tagName: String(tag).toUpperCase(),
      style: {},
      children,
      classList,
      textContent: '',
      value: '',
      disabled: false,
      parentElement: null,
      ownerDocument: null,
      setAttribute(k, v) {
        attrs.set(k, String(v))
      },
      getAttribute(k) {
        return attrs.has(k) ? attrs.get(k) : null
      },
      hasAttribute(k) {
        return attrs.has(k)
      },
      removeAttribute(k) {
        attrs.delete(k)
      },
      append(...nodes) {
        for (const n of nodes) {
          if (n == null) continue
          n.parentElement = el
          children.push(n)
        }
      },
      appendChild(n) {
        el.append(n)
        return n
      },
      replaceChildren(...nodes) {
        children.length = 0
        el.append(...nodes)
      },
      remove() {
        if (!el.parentElement) return
        const sibs = el.parentElement.children
        const i = sibs.indexOf(el)
        if (i >= 0) sibs.splice(i, 1)
        el.parentElement = null
      },
      addEventListener(type, fn) {
        if (!listeners.has(el)) listeners.set(el, [])
        listeners.get(el).push({ type, fn })
      },
      dispatchEvent(event) {
        const list = listeners.get(el) ?? []
        for (const { type, fn } of list) {
          if (type === event.type) fn(event)
        }
      },
      querySelector(sel) {
        return queryAll(el, sel)[0] ?? null
      },
      querySelectorAll(sel) {
        return queryAll(el, sel)
      },
      closest() {
        return null
      },
      focus() {},
      blur() {},
      click() {
        el.dispatchEvent({ type: 'click' })
      },
    }
    el.ownerDocument = doc
    return el
  }

  function matchSel(node, sel) {
    if (sel.startsWith('[') && sel.endsWith(']')) {
      const inner = sel.slice(1, -1)
      const eq = inner.indexOf('=')
      if (eq < 0) return node.getAttribute(inner) !== null
      const key = inner.slice(0, eq)
      let val = inner.slice(eq + 1)
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      return node.getAttribute(key) === val
    }
    if (sel.startsWith('.')) return node.classList.contains(sel.slice(1))
    return node.tagName === sel.toUpperCase()
  }

  function queryAll(rootEl, sel) {
    const out = []
    const walk = (node) => {
      if (matchSel(node, sel)) out.push(node)
      for (const child of node.children) walk(child)
    }
    walk(rootEl)
    return out
  }

  const doc = {
    createElement: makeEl,
    querySelector() {
      return null
    },
  }

  globalThis.document = doc
  return () => {
    globalThis.document = previous
  }
}

describe('history I/O matrix', () => {
  it('registers history-matrix in npm test', () => {
    assert.match(pkg.scripts?.test ?? '', /history-matrix\.test\.mjs/)
  })

  it('discrete commit: one undo step; redo cleared on new execute', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const history = await importCompiledTs('src/history/index.ts')
    const store = model.createStore({
      project: baseProject(),
      session: baseSession(),
    })

    const renamed = {
      ...store.getState().project,
      skins: store.getState().project.skins.map((s) =>
        s.id === 'skin-a' ? { ...s, displayName: 'Renamed' } : s,
      ),
    }
    history.execute(store, { project: renamed })
    assert.equal(history.canUndo(store), true)
    assert.equal(history.canRedo(store), false)
    assert.equal(store.getState().project.skins[0].displayName, 'Renamed')

    history.undo(store)
    assert.equal(store.getState().project.skins[0].displayName, 'Skin A')
    assert.equal(history.canRedo(store), true)

    history.redo(store)
    assert.equal(store.getState().project.skins[0].displayName, 'Renamed')

    // Branch edit clears redo
    history.undo(store)
    history.execute(store, {
      project: {
        ...store.getState().project,
        skins: store.getState().project.skins.map((s) =>
          s.id === 'skin-a' ? { ...s, displayName: 'Branch' } : s,
        ),
      },
    })
    assert.equal(history.canRedo(store), false)
    assert.equal(store.getState().project.skins[0].displayName, 'Branch')
  })

  it('hex coalesce idle: rapid same-entry writes → one undo after 400 ms', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const history = await importCompiledTs('src/history/index.ts')
    const store = model.createStore({
      project: baseProject(),
      session: baseSession(),
    })
    const idleMs = history.COALESCE_IDLE_MS
    assert.equal(idleMs, 400)

    const beforeHex = store.getState().project.palette[0].hex
    for (const hex of ['#101010', '#202020', '#303030']) {
      history.execute(
        store,
        { project: withHex(store.getState().project, 'c1', hex) },
        { coalesceKey: 'hex:c1' },
      )
    }
    assert.equal(store.getState().project.palette[0].hex, '#303030')
    // Burst still open — undo enabled via open coalesce, but one flush → one step
    await sleep(idleMs + 50)
    assert.equal(history.canUndo(store), true)

    history.undo(store)
    assert.equal(store.getState().project.palette[0].hex, beforeHex)
    assert.equal(history.canRedo(store), true)
    history.redo(store)
    assert.equal(store.getState().project.palette[0].hex, '#303030')
  })

  it('hex coalesce pointer-up: flush mid-burst → one undo step', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const history = await importCompiledTs('src/history/index.ts')
    const store = model.createStore({
      project: baseProject(),
      session: baseSession(),
    })

    history.execute(
      store,
      { project: withHex(store.getState().project, 'c1', '#AABBCC') },
      { coalesceKey: 'hex:c1' },
    )
    history.execute(
      store,
      { project: withHex(store.getState().project, 'c1', '#DDEEFF') },
      { coalesceKey: 'hex:c1' },
    )
    history.flushCoalesce(store)

    history.undo(store)
    assert.equal(store.getState().project.palette[0].hex, '#111111')
    history.redo(store)
    assert.equal(store.getState().project.palette[0].hex, '#DDEEFF')
  })

  it('hex different entry: prior coalesce closes; new entry starts new step', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const history = await importCompiledTs('src/history/index.ts')
    const store = model.createStore({
      project: baseProject(),
      session: baseSession(),
    })

    history.execute(
      store,
      { project: withHex(store.getState().project, 'c1', '#AAAAAA') },
      { coalesceKey: 'hex:c1' },
    )
    history.execute(
      store,
      { project: withHex(store.getState().project, 'c2', '#BBBBBB') },
      { coalesceKey: 'hex:c2' },
    )
    history.flushCoalesce(store)

    // Two steps: undo c2, then undo c1
    history.undo(store)
    assert.equal(store.getState().project.palette[1].hex, '#222222')
    assert.equal(store.getState().project.palette[0].hex, '#AAAAAA')
    history.undo(store)
    assert.equal(store.getState().project.palette[0].hex, '#111111')
  })

  it('undo selection: Object-type / State restored', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const history = await importCompiledTs('src/history/index.ts')
    const store = model.createStore({
      project: baseProject(),
      session: baseSession(),
    })

    history.execute(store, {
      session: {
        ...store.getState().session,
        selectedObjectTypeId: 'ot',
        selectedStateId: 'idle',
      },
    })
    assert.equal(store.getState().session.selectedObjectTypeId, 'ot')
    history.undo(store)
    assert.equal(store.getState().session.selectedObjectTypeId, null)
    assert.equal(store.getState().session.selectedStateId, null)
    history.redo(store)
    assert.equal(store.getState().session.selectedObjectTypeId, 'ot')
    assert.equal(store.getState().session.selectedStateId, 'idle')
  })

  it('Skin switch EXCLUDE: activeSkinId change does not push undo', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const history = await importCompiledTs('src/history/index.ts')
    const store = model.createStore({
      project: baseProject(),
      session: baseSession({ activeSkinId: 'skin-a' }),
    })

    history.execute(
      store,
      {
        session: {
          ...store.getState().session,
          activeSkinId: 'skin-b',
        },
      },
      { push: false },
    )
    assert.equal(store.getState().session.activeSkinId, 'skin-b')
    assert.equal(history.canUndo(store), false)
  })

  it('Skin switch EXCLUDE: undo of prior project edit keeps live activeSkinId', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const history = await importCompiledTs('src/history/index.ts')
    const store = model.createStore({
      project: baseProject(),
      session: baseSession({ activeSkinId: 'skin-a' }),
    })

    history.execute(store, {
      project: {
        ...store.getState().project,
        skins: store.getState().project.skins.map((s) =>
          s.id === 'skin-a' ? { ...s, displayName: 'Renamed' } : s,
        ),
      },
    })
    history.execute(
      store,
      {
        session: {
          ...store.getState().session,
          activeSkinId: 'skin-b',
        },
      },
      { push: false },
    )
    history.undo(store)
    assert.equal(store.getState().project.skins[0].displayName, 'Skin A')
    assert.equal(store.getState().session.activeSkinId, 'skin-b')
  })

  it('Zoom/pan prefs: stack unchanged when prefs mutate', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const history = await importCompiledTs('src/history/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const store = model.createStore({
      project: baseProject(),
      session: baseSession(),
    })
    const storage = persist.createMemoryStorage()

    history.execute(store, {
      project: {
        ...store.getState().project,
        skins: store.getState().project.skins.map((s) =>
          s.id === 'skin-a' ? { ...s, displayName: 'Tracked' } : s,
        ),
      },
    })
    assert.equal(history.canUndo(store), true)

    const prefs = persist.loadPrefs(storage)
    prefs.zoomStep = '150%'
    prefs.panXY = { x: 40, y: -12 }
    persist.savePrefs(prefs, storage)

    assert.equal(history.canUndo(store), true)
    history.undo(store)
    assert.equal(store.getState().project.skins[0].displayName, 'Skin A')
    const after = persist.loadPrefs(storage)
    assert.equal(after.zoomStep, '150%')
    assert.deepEqual(after.panXY, { x: 40, y: -12 })
  })

  it('New clears history stack after seed baseline', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const history = await importCompiledTs('src/history/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const chrome = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const store = model.createStore({
        project: baseProject(),
        session: baseSession(),
      })
      history.execute(store, {
        project: {
          ...store.getState().project,
          skins: store.getState().project.skins.map((s) =>
            s.id === 'skin-a' ? { ...s, displayName: 'Dirty' } : s,
          ),
        },
      })
      assert.equal(history.canUndo(store), true)

      const root = document.createElement('div')
      chrome.openNewConfirmModal(root, store)
      const panel = root.querySelector('[data-boot-confirm]')
      assert.ok(panel)
      let newBtn = null
      const walk = (node) => {
        if (node.textContent === 'New' && node.tagName === 'BUTTON') newBtn = node
        for (const child of node.children) walk(child)
      }
      walk(panel)
      assert.ok(newBtn, 'expected New confirm button')
      newBtn.dispatchEvent({ type: 'click' })

      assert.deepEqual(
        store.getState().project.palette.map((e) => e.id),
        seed.createSeedProject().palette.map((e) => e.id),
      )
      assert.equal(history.canUndo(store), false)
      assert.equal(history.canRedo(store), false)
    } finally {
      restoreDoc()
    }
  })

  it('top-bar Undo/Redo: live enablement and invoke history', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const history = await importCompiledTs('src/history/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const store = model.createStore({
        project: baseProject(),
        session: baseSession(),
      })
      const root = document.createElement('div')
      root.id = 'app'
      mountChromeShell(root, store, {
        storage: persist.createMemoryStorage(),
      })

      const undoBtn = root.querySelector('[data-chrome-undo]')
      const redoBtn = root.querySelector('[data-chrome-redo]')
      assert.ok(undoBtn)
      assert.ok(redoBtn)
      assert.equal(root.querySelector('[data-chrome-inert="undo"]'), null)
      assert.equal(root.querySelector('[data-chrome-inert="redo"]'), null)
      assert.equal(undoBtn.disabled, true)
      assert.equal(redoBtn.disabled, true)

      history.execute(store, {
        project: {
          ...store.getState().project,
          skins: store.getState().project.skins.map((s) =>
            s.id === 'skin-a' ? { ...s, displayName: 'Live' } : s,
          ),
        },
      })
      assert.equal(undoBtn.disabled, false)
      assert.equal(redoBtn.disabled, true)

      undoBtn.dispatchEvent({ type: 'click' })
      assert.equal(store.getState().project.skins[0].displayName, 'Skin A')
      assert.equal(redoBtn.disabled, false)

      redoBtn.dispatchEvent({ type: 'click' })
      assert.equal(store.getState().project.skins[0].displayName, 'Live')
    } finally {
      restoreDoc()
    }
  })

  it('golden coalesce: ten rapid writes → one undo; second burst → second step', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const history = await importCompiledTs('src/history/index.ts')
    const store = model.createStore({
      project: baseProject(),
      session: baseSession(),
    })
    const idleMs = history.COALESCE_IDLE_MS

    for (let i = 0; i < 10; i += 1) {
      const hex = `#${String(i).padStart(6, '0')}`
      history.execute(
        store,
        { project: withHex(store.getState().project, 'c1', hex) },
        { coalesceKey: 'hex:c1' },
      )
    }
    await sleep(idleMs + 50)

    history.execute(
      store,
      { project: withHex(store.getState().project, 'c1', '#FFFFFF') },
      { coalesceKey: 'hex:c1' },
    )
    history.execute(
      store,
      { project: withHex(store.getState().project, 'c1', '#EEEEEE') },
      { coalesceKey: 'hex:c1' },
    )
    await sleep(idleMs + 50)

    assert.equal(store.getState().project.palette[0].hex, '#EEEEEE')
    history.undo(store)
    assert.equal(store.getState().project.palette[0].hex, '#000009')
    history.undo(store)
    assert.equal(store.getState().project.palette[0].hex, '#111111')
  })

  it('coalesce-after-undo: clears redo immediately; canRedo false mid-burst', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const history = await importCompiledTs('src/history/index.ts')
    const store = model.createStore({
      project: baseProject(),
      session: baseSession(),
    })

    history.execute(store, {
      project: {
        ...store.getState().project,
        skins: store.getState().project.skins.map((s) =>
          s.id === 'skin-a' ? { ...s, displayName: 'First' } : s,
        ),
      },
    })
    history.undo(store)
    assert.equal(history.canRedo(store), true)

    history.execute(
      store,
      { project: withHex(store.getState().project, 'c1', '#ABCDEF') },
      { coalesceKey: 'hex:c1' },
    )
    assert.equal(history.canRedo(store), false)
    assert.equal(history.canUndo(store), true)
  })

  it('chrome Skin combo change keeps canUndo false (EXCLUDE)', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const history = await importCompiledTs('src/history/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const store = model.createStore({
        project: baseProject(),
        session: baseSession({ activeSkinId: 'skin-a' }),
      })
      const root = document.createElement('div')
      root.id = 'app'
      mountChromeShell(root, store, {
        storage: persist.createMemoryStorage(),
      })

      assert.equal(history.canUndo(store), false)
      const select = root.querySelector('[data-chrome-skin-select]')
      assert.ok(select)
      select.value = 'skin-b'
      select.dispatchEvent({ type: 'change' })
      assert.equal(store.getState().session.activeSkinId, 'skin-b')
      assert.equal(history.canUndo(store), false)
    } finally {
      restoreDoc()
    }
  })

  it('Skin-CRUD execute that changes activeSkinId: undo restores prior Skin id', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const history = await importCompiledTs('src/history/index.ts')
    const store = model.createStore({
      project: baseProject(),
      session: baseSession({ activeSkinId: 'skin-a' }),
    })

    const created = {
      id: 'skin-c',
      displayName: 'Skin C',
      mappings: [],
    }
    history.execute(store, {
      project: {
        ...store.getState().project,
        skins: [...store.getState().project.skins, created],
      },
      session: {
        ...store.getState().session,
        activeSkinId: 'skin-c',
      },
    })
    assert.equal(store.getState().session.activeSkinId, 'skin-c')
    history.undo(store)
    assert.equal(store.getState().session.activeSkinId, 'skin-a')
    assert.equal(
      store.getState().project.skins.some((s) => s.id === 'skin-c'),
      false,
    )
  })

  it('UI canvas Object-type selection: canUndo then Undo restores', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const history = await importCompiledTs('src/history/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const store = model.createStore({
        project: baseProject({
          inventory: {
            objectTypes: [
              {
                id: 'knobLarge',
                states: ['idle', 'on'],
                properties: ['led_on'],
              },
            ],
          },
        }),
        session: baseSession(),
      })
      const root = document.createElement('div')
      root.id = 'app'
      mountChromeShell(root, store, {
        storage: persist.createMemoryStorage(),
      })

      const hit = root.querySelector('[data-object-type-id="knobLarge"]')
      assert.ok(hit)
      hit.dispatchEvent({ type: 'click' })
      assert.equal(store.getState().session.selectedObjectTypeId, 'knobLarge')
      assert.equal(history.canUndo(store), true)

      history.undo(store)
      assert.equal(store.getState().session.selectedObjectTypeId, null)
    } finally {
      restoreDoc()
    }
  })
})
