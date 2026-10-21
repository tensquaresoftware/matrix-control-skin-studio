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
const baseCss = readFileSync(join(root, 'src/styles/base.css'), 'utf8')

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
  const dir = mkdtempSync(join(tmpdir(), 'skin-studio-selection-sync-'))
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
  const classSet = new Set()
  let valueProp = ''
  let hiddenProp = false
  const node = {
    tagName: String(tagName).toUpperCase(),
    type: '',
    textContent: '',
    disabled: false,
    clientHeight: 0,
    style: {
      cssText: '',
      height: '',
      background: '',
      backgroundColor: '',
      transform: '',
      transformOrigin: '',
    },
    tabIndex: -1,
    children: [],
    parent: null,
    _scrollIntoViewCalls: 0,
    classList: {
      add(...names) {
        for (const n of names) classSet.add(n)
      },
      remove(...names) {
        for (const n of names) classSet.delete(n)
      },
      toggle(name, force) {
        if (force === true) classSet.add(name)
        else if (force === false) classSet.delete(name)
        else if (classSet.has(name)) classSet.delete(name)
        else classSet.add(name)
      },
      contains(name) {
        return classSet.has(name)
      },
    },
    set className(value) {
      classSet.clear()
      for (const n of String(value).split(/\s+/).filter(Boolean)) classSet.add(n)
    },
    get className() {
      return [...classSet].join(' ')
    },
    get value() {
      return valueProp
    },
    set value(v) {
      valueProp = String(v)
    },
    get hidden() {
      return hiddenProp
    },
    set hidden(v) {
      hiddenProp = Boolean(v)
    },
    setAttribute(name, value) {
      attrs.set(name, String(value))
    },
    getAttribute(name) {
      return attrs.has(name) ? attrs.get(name) : null
    },
    removeAttribute(name) {
      attrs.delete(name)
    },
    hasAttribute(name) {
      return attrs.has(name)
    },
    closest(sel) {
      let current = node
      while (current != null) {
        if (matchesSelector(current, sel)) return current
        current = current.parent
      }
      return null
    },
    append(...kids) {
      for (const kid of kids) {
        if (kid == null) continue
        if (typeof kid === 'string') continue
        kid.parent = node
        node.children.push(kid)
      }
    },
    replaceChildren(...kids) {
      for (const child of node.children) child.parent = null
      node.children = []
      node.append(...kids)
    },
    querySelector(selector) {
      return querySelectorDeep(node, selector)
    },
    querySelectorAll(selector) {
      const out = []
      walkCollect(node, selector, out)
      return out
    },
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, [])
      listeners.get(type).push(fn)
    },
    removeEventListener(type, fn) {
      const list = listeners.get(type)
      if (!list) return
      listeners.set(
        type,
        list.filter((f) => f !== fn),
      )
    },
    dispatchEvent(event) {
      const ev = event && typeof event === 'object' ? event : { type: event }
      if (ev.target == null) ev.target = node
      if (typeof ev.preventDefault !== 'function') {
        ev.preventDefault = () => {}
      }
      let stopped = false
      const priorStop =
        typeof ev.stopPropagation === 'function' ? ev.stopPropagation : null
      ev.stopPropagation = () => {
        stopped = true
        if (priorStop) priorStop.call(ev)
      }
      for (const fn of listeners.get(ev.type) || []) fn(ev)
      if (!stopped && node.parent && typeof node.parent.dispatchEvent === 'function') {
        node.parent.dispatchEvent(ev)
      }
    },
    click() {
      if (node.disabled) return
      node.dispatchEvent({ type: 'click' })
    },
    focus() {
      node._focused = true
      node.dispatchEvent({ type: 'focus' })
    },
    blur() {
      node._focused = false
      node.dispatchEvent({ type: 'blur' })
    },
    scrollIntoView() {
      node._scrollIntoViewCalls += 1
    },
    select() {},
    setPointerCapture() {},
    releasePointerCapture() {},
  }
  return node
}

function matchesSelector(el, selector) {
  const attrEq = /^\[([^=\]]+)="([^"]*)"\]$/.exec(selector)
  if (attrEq) return el.getAttribute(attrEq[1]) === attrEq[2]
  const attr = /^\[([^\]]+)\]$/.exec(selector)
  if (attr) return el.getAttribute(attr[1]) !== null
  if (selector.startsWith('.')) {
    const classes = selector.slice(1).split('.').filter(Boolean)
    return classes.every((cls) => el.classList.contains(cls))
  }
  if (/^[a-zA-Z][\w-]*$/.test(selector)) {
    return el.tagName === selector.toUpperCase()
  }
  return false
}

function querySelectorDeep(rootEl, selector) {
  const walk = (el) => {
    if (el !== rootEl && matchesSelector(el, selector)) return el
    for (const child of el.children) {
      const found = walk(child)
      if (found) return found
    }
    return null
  }
  return walk(rootEl)
}

function walkCollect(rootEl, selector, out) {
  for (const child of rootEl.children) {
    if (matchesSelector(child, selector)) out.push(child)
    walkCollect(child, selector, out)
  }
}

function installMinimalDocument() {
  const previous = globalThis.document
  const previousWindow = globalThis.window
  const winListeners = new Map()
  globalThis.document = { createElement }
  globalThis.window = {
    addEventListener(type, fn) {
      if (!winListeners.has(type)) winListeners.set(type, [])
      winListeners.get(type).push(fn)
    },
    removeEventListener(type, fn) {
      const list = winListeners.get(type)
      if (!list) return
      winListeners.set(
        type,
        list.filter((f) => f !== fn),
      )
    },
    dispatchEvent(event) {
      for (const fn of winListeners.get(event.type) || []) fn(event)
    },
  }
  return () => {
    if (previous === undefined) delete globalThis.document
    else globalThis.document = previous
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
}

function memoryStorage() {
  const map = new Map()
  return {
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
}

function fixtureInventory() {
  return {
    source: 'test-fixture',
    objectTypes: [
      {
        id: 'headerLed',
        states: ['off', 'on'],
        properties: ['fill', 'ring'],
      },
      {
        id: 'knobLarge',
        states: ['normal', 'off'],
        properties: ['led_on'],
      },
    ],
  }
}

function fixtureProject(overrides = {}) {
  return {
    formatVersion: 1,
    palette: [
      { id: 'yellow', hex: '#FFCC00', constantName: 'kYellow' },
      { id: 'blue', hex: '#3D7EFF', constantName: 'kBlue' },
      { id: 'orange', hex: '#FF8A1F', constantName: 'kOrange' },
    ],
    skins: [
      {
        id: 'black-duo',
        displayName: 'Black/Duo',
        mappings: [],
      },
    ],
    inventory: fixtureInventory(),
    ...overrides,
  }
}

function defaultSession(overrides = {}) {
  return {
    selectedObjectTypeId: null,
    selectedStateId: null,
    activeSkinId: 'black-duo',
    ...overrides,
  }
}

function mountSyncedShell(chrome, model, project, session) {
  const store = model.createStore({ project, session })
  const root = createElement('div')
  root.id = 'app'
  chrome.mountChromeShell(root, store, { storage: memoryStorage() })
  return { store, root }
}

function propertyRows(root) {
  const list = root.querySelector('[data-mappings-property-list]')
  assert.ok(list)
  return list.querySelectorAll('[data-mapping-row]')
}

describe('selection-sync I/O matrix (story 4.3 — spike dormancy)', () => {
  it('registers selection-sync-matrix in npm test', () => {
    assert.match(pkg.scripts?.test ?? '', /selection-sync-matrix\.test\.mjs/)
  })

  it('CSS: Mapping-row canvas highlight tokens remain; mock hit styles gone', () => {
    assert.match(baseCss, /--comp-canvas-selection-outline/)
    assert.match(baseCss, /\.mapping-row\.is-canvas-highlighted/)
    assert.doesNotMatch(baseCss, /\.mock-object-type-hit/)
  })

  it('canvas dormancy: exemplar board present; zero Object-type / zone hit targets', async () => {
    const restore = installMinimalDocument()
    try {
      const [chrome, model] = await Promise.all([
        importCompiledTs('src/chrome/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { root } = mountSyncedShell(
        chrome,
        model,
        fixtureProject(),
        defaultSession(),
      )

      assert.ok(root.querySelector('[data-exemplar-board]'))
      assert.equal(root.querySelector('[data-canvas-mock]'), null)
      assert.equal(root.querySelectorAll('[data-object-type-id]').length, 0)
      assert.equal(root.querySelector('[data-orch-zone]'), null)
      assert.equal(root.querySelector('[data-zone-object-type-id]'), null)
    } finally {
      restore()
    }
  })

  it('CanvasSelectionSync module still callable (sidebar bridge idle without hits)', async () => {
    const sidebar = await importCompiledTs('src/sidebar/canvas-selection-sync.ts')
    const sync = sidebar.createCanvasSelectionSync()
    let switched = 0
    let highlighted = 0
    sync.setSwitchToMappings(() => {
      switched += 1
    })
    sync.setHighlightScroll(() => {
      highlighted += 1
    })
    sync.notifyCanvasHit()
    assert.equal(switched, 1)
    assert.equal(highlighted, 1)
  })

  it('sidebar Object select updates session without canvas outline targets', async () => {
    const restore = installMinimalDocument()
    try {
      const [chrome, model] = await Promise.all([
        importCompiledTs('src/chrome/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, root } = mountSyncedShell(
        chrome,
        model,
        fixtureProject(),
        defaultSession(),
      )

      const objectSelect = root.querySelector('[data-mappings-object-type]')
      assert.ok(objectSelect)
      objectSelect.value = 'knobLarge'
      objectSelect.dispatchEvent({ type: 'change' })

      assert.equal(store.getState().session.selectedObjectTypeId, 'knobLarge')
      assert.equal(root.querySelector('[data-object-type-id="knobLarge"]'), null)
    } finally {
      restore()
    }
  })

  it('canvas click outside board clears Object-type selection', async () => {
    const restore = installMinimalDocument()
    try {
      const [chrome, model] = await Promise.all([
        importCompiledTs('src/chrome/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, root } = mountSyncedShell(
        chrome,
        model,
        fixtureProject(),
        defaultSession({
          selectedObjectTypeId: 'headerLed',
          selectedStateId: 'off',
        }),
      )

      assert.equal(store.getState().session.selectedObjectTypeId, 'headerLed')

      const host = root.querySelector('[data-canvas-host]')
      assert.ok(host)
      host.dispatchEvent({ type: 'click', target: host })

      assert.equal(store.getState().session.selectedObjectTypeId, null)
    } finally {
      restore()
    }
  })

  it('canvas click inside exemplar board keeps Object-type selection', async () => {
    const restore = installMinimalDocument()
    try {
      const [chrome, model] = await Promise.all([
        importCompiledTs('src/chrome/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, root } = mountSyncedShell(
        chrome,
        model,
        fixtureProject(),
        defaultSession({
          selectedObjectTypeId: 'headerLed',
          selectedStateId: 'off',
        }),
      )

      assert.equal(store.getState().session.selectedObjectTypeId, 'headerLed')

      const host = root.querySelector('[data-canvas-host]')
      const board = root.querySelector('[data-exemplar-board]')
      const brick =
        root.querySelector('[data-exemplar-widget="slider"]') ?? board
      assert.ok(host)
      assert.ok(board)
      assert.ok(brick)
      // Bubble through host listeners; closest/parent walk must see the board.
      brick.dispatchEvent({ type: 'click', target: brick })

      assert.equal(store.getState().session.selectedObjectTypeId, 'headerLed')
    } finally {
      restore()
    }
  })

  it('pan drag does not clear Object-type selection via trailing host click', async () => {
    const restore = installMinimalDocument()
    try {
      const [chrome, model] = await Promise.all([
        importCompiledTs('src/chrome/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, root } = mountSyncedShell(
        chrome,
        model,
        fixtureProject(),
        defaultSession({
          selectedObjectTypeId: 'headerLed',
          selectedStateId: 'off',
        }),
      )

      const host = root.querySelector('[data-canvas-host]')
      assert.ok(host)

      host.dispatchEvent({
        type: 'pointerdown',
        button: 0,
        pointerId: 1,
        clientX: 10,
        clientY: 10,
      })
      globalThis.window.dispatchEvent({
        type: 'pointermove',
        pointerId: 1,
        clientX: 40,
        clientY: 10,
      })
      globalThis.window.dispatchEvent({
        type: 'pointerup',
        pointerId: 1,
        clientX: 40,
        clientY: 10,
      })
      // Synthesized trailing click after drag — pan guard must keep selection.
      host.dispatchEvent({ type: 'click', target: host })

      assert.equal(store.getState().session.selectedObjectTypeId, 'headerLed')
    } finally {
      restore()
    }
  })

  it('Property-row click still sets MappingFocus (sidebar path independent of hits)', async () => {
    const restore = installMinimalDocument()
    try {
      const [chrome, model] = await Promise.all([
        importCompiledTs('src/chrome/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, root } = mountSyncedShell(
        chrome,
        model,
        fixtureProject(),
        defaultSession({
          selectedObjectTypeId: 'headerLed',
          selectedStateId: 'off',
        }),
      )

      // Ensure Mappings segment visible with rows for selected type.
      const mappingsTab = root.querySelector('[data-skin-seg-tab="mappings"]')
      if (mappingsTab != null) {
        mappingsTab.dispatchEvent({ type: 'click' })
      }

      const rows = propertyRows(root)
      assert.ok(rows.length >= 1)
      rows[0].dispatchEvent({ type: 'click' })
      const after = propertyRows(root)
      assert.ok(after[0].classList.contains('is-focused'))
      assert.equal(store.getState().session.selectedObjectTypeId, 'headerLed')
    } finally {
      restore()
    }
  })
})
