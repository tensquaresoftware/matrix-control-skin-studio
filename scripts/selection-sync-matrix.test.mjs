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
        return classSet.has(name)
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
    get id() {
      return attrs.get('id') ?? ''
    },
    set id(value) {
      attrs.set('id', String(value))
    },
    get value() {
      return valueProp
    },
    set value(next) {
      valueProp = String(next)
    },
    get hidden() {
      return hiddenProp
    },
    set hidden(next) {
      hiddenProp = Boolean(next)
      if (hiddenProp) attrs.set('hidden', '')
      else attrs.delete('hidden')
    },
    setAttribute(name, value) {
      attrs.set(name, String(value))
      if (name === 'value') valueProp = String(value)
      if (name === 'type') node.type = String(value)
      if (name === 'hidden') hiddenProp = true
    },
    getAttribute(name) {
      return attrs.has(name) ? attrs.get(name) : null
    },
    hasAttribute(name) {
      return attrs.has(name)
    },
    removeAttribute(name) {
      attrs.delete(name)
      if (name === 'hidden') hiddenProp = false
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
      return querySelectorDeep(node, selector)
    },
    querySelectorAll(selector) {
      const out = []
      walkCollect(node, selector, out)
      return out
    },
    closest(selector) {
      let el = node
      while (el) {
        if (matchesSelector(el, selector)) return el
        el = el.parent
      }
      return null
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

function querySelectorDeep(root, selector) {
  const walk = (el) => {
    if (el !== root && matchesSelector(el, selector)) return el
    for (const child of el.children) {
      const found = walk(child)
      if (found) return found
    }
    return null
  }
  return walk(root)
}

function walkCollect(root, selector, out) {
  for (const child of root.children) {
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

/** Fixture inventory — tests only; seed stays empty (KEEP_EMPTY). */
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
      { id: 'duoLedYellow', hex: '#FFCC00', constantName: 'kDuoLedYellow' },
      { id: 'patchZoneBlue', hex: '#3D7EFF', constantName: 'kPatchZoneBlue' },
      { id: 'masterZoneOrange', hex: '#FF8A1F', constantName: 'kMasterZoneOrange' },
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

function createRoot() {
  return createElement('div')
}

function mountSyncedShell(chrome, model, project, session) {
  const store = model.createStore({ project, session })
  const root = createRoot()
  root.id = 'app'
  chrome.mountChromeShell(root, store, { storage: memoryStorage() })
  return { store, root }
}

function clickHit(root, objectTypeId) {
  const hit = root.querySelector(`[data-object-type-id="${objectTypeId}"]`)
  assert.ok(hit, `expected hit for ${objectTypeId}`)
  hit.dispatchEvent({ type: 'click' })
  return hit
}

function propertyRows(root) {
  const list = root.querySelector('[data-mappings-property-list]')
  assert.ok(list)
  return list.querySelectorAll('[data-mapping-row]')
}

describe('selection-sync I/O matrix (story 4.3)', () => {
  it('registers selection-sync-matrix in npm test', () => {
    assert.match(pkg.scripts?.test ?? '', /selection-sync-matrix\.test\.mjs/)
  })

  it('CSS: selected hit outline + canvas-highlighted Mapping row', () => {
    assert.match(baseCss, /\.mock-object-type-hit\.is-selected/)
    assert.match(baseCss, /--comp-canvas-selection-outline/)
    assert.match(baseCss, /--comp-canvas-selection-fill/)
    assert.match(baseCss, /\.mapping-row\.is-canvas-highlighted/)
    assert.match(baseCss, /\.mock-object-type-hit\s*\{[^}]*cursor:\s*pointer/s)
  })

  it('canvas → type: session Object type + sticky State; AUTO_MAPPINGS; HIGHLIGHT_SCROLL_ONLY', async () => {
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
        defaultSession({ selectedStateId: 'off' }),
      )

      // Start on Skin segment so AUTO_MAPPINGS is observable.
      const skinTab = root.querySelector('[data-skin-seg-tab="skin"]')
      assert.ok(skinTab)
      skinTab.dispatchEvent({ type: 'click' })
      assert.equal(root.querySelector('[data-skin-tab]')?.hidden, false)
      assert.equal(root.querySelector('[data-mappings-tab]')?.hidden, true)

      clickHit(root, 'headerLed')

      const session = store.getState().session
      assert.equal(session.selectedObjectTypeId, 'headerLed')
      assert.equal(session.selectedStateId, 'off')

      // AUTO_MAPPINGS
      assert.equal(root.querySelector('[data-mappings-tab]')?.hidden, false)
      assert.equal(root.querySelector('[data-skin-tab]')?.hidden, true)

      const rows = propertyRows(root)
      assert.equal(rows.length, 2)
      for (const row of rows) {
        assert.ok(row.classList.contains('is-canvas-highlighted'))
        assert.equal(row.classList.contains('is-focused'), false)
      }
      assert.ok(rows[0]._scrollIntoViewCalls >= 1)

      // Context strip follows session
      assert.equal(
        root.querySelector('[data-context-value="object"]')?.textContent,
        'headerLed',
      )
      assert.equal(
        root.querySelector('[data-context-value="state"]')?.textContent,
        'off',
      )
    } finally {
      restore()
    }
  })

  it('sidebar → outline: selected Object type outlines matching hit', async () => {
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

      const objectSelect = root.querySelector('[data-mappings-object-type]')
      assert.ok(objectSelect)
      objectSelect.value = 'knobLarge'
      objectSelect.dispatchEvent({ type: 'change' })

      const selected = root.querySelector('[data-object-type-id="knobLarge"]')
      assert.ok(selected)
      assert.ok(selected.classList.contains('is-selected'))
      const other = root.querySelector('[data-object-type-id="headerLed"]')
      assert.ok(other)
      assert.equal(other.classList.contains('is-selected'), false)
    } finally {
      restore()
    }
  })

  it('empty inventory: no hits; no click selection path', async () => {
    const restore = installMinimalDocument()
    try {
      const [chrome, model, seed] = await Promise.all([
        importCompiledTs('src/chrome/index.ts'),
        importCompiledTs('src/model/index.ts'),
        importCompiledTs('src/seed/index.ts'),
      ])
      const project = seed.createSeedProject()
      assert.deepEqual(project.inventory.objectTypes, [])
      const { store, root } = mountSyncedShell(
        chrome,
        model,
        project,
        defaultSession(),
      )

      assert.equal(root.querySelectorAll('[data-object-type-id]').length, 0)
      assert.equal(store.getState().session.selectedObjectTypeId, null)
    } finally {
      restore()
    }
  })

  it('missing hit: session type absent from inventory → no outline; session unchanged by canvas', async () => {
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
          selectedObjectTypeId: 'ghostType',
          selectedStateId: 'off',
        }),
      )

      assert.equal(root.querySelector('[data-object-type-id="ghostType"]'), null)
      assert.equal(
        root.querySelectorAll('.mock-object-type-hit.is-selected').length,
        0,
      )
      assert.equal(store.getState().session.selectedObjectTypeId, 'ghostType')
      assert.equal(store.getState().session.selectedStateId, 'off')
    } finally {
      restore()
    }
  })

  it('same-type re-click: session unchanged; still AUTO_MAPPINGS + highlight; no MappingFocus', async () => {
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
          selectedStateId: 'on',
        }),
      )

      const skinTab = root.querySelector('[data-skin-seg-tab="skin"]')
      skinTab.dispatchEvent({ type: 'click' })

      let applyCount = 0
      const prevApply = store.apply.bind(store)
      store.apply = (payload) => {
        applyCount += 1
        return prevApply(payload)
      }

      clickHit(root, 'headerLed')

      assert.equal(applyCount, 0)
      assert.equal(store.getState().session.selectedObjectTypeId, 'headerLed')
      assert.equal(store.getState().session.selectedStateId, 'on')
      assert.equal(root.querySelector('[data-mappings-tab]')?.hidden, false)

      const rows = propertyRows(root)
      assert.ok(rows.every((row) => row.classList.contains('is-canvas-highlighted')))
      assert.ok(rows.every((row) => !row.classList.contains('is-focused')))
      assert.ok(
        rows[0]._scrollIntoViewCalls >= 1,
        'same-type re-click must scroll Mapping row(s) into view again',
      )
    } finally {
      restore()
    }
  })

  it('non-sticky State: canvas type switch falls back to destination first state', async () => {
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
          selectedStateId: 'on',
        }),
      )

      clickHit(root, 'knobLarge')

      assert.equal(store.getState().session.selectedObjectTypeId, 'knobLarge')
      assert.equal(store.getState().session.selectedStateId, 'normal')
    } finally {
      restore()
    }
  })

  it('Enter/Space on hit selects Object type like click', async () => {
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
        defaultSession({ selectedStateId: 'off' }),
      )

      // Start on Skin so AUTO_MAPPINGS is observable (same as click path).
      const skinTab = root.querySelector('[data-skin-seg-tab="skin"]')
      assert.ok(skinTab)
      skinTab.dispatchEvent({ type: 'click' })
      assert.equal(root.querySelector('[data-mappings-tab]')?.hidden, true)

      const hit = root.querySelector('[data-object-type-id="headerLed"]')
      assert.ok(hit)
      hit.dispatchEvent({ type: 'keydown', key: 'Enter', repeat: false })

      assert.equal(store.getState().session.selectedObjectTypeId, 'headerLed')
      assert.equal(store.getState().session.selectedStateId, 'off')
      assert.ok(
        root
          .querySelector('[data-object-type-id="headerLed"]')
          ?.classList.contains('is-selected'),
      )
      assert.equal(root.querySelector('[data-mappings-tab]')?.hidden, false)
      assert.equal(root.querySelector('[data-skin-tab]')?.hidden, true)

      const rows = propertyRows(root)
      assert.ok(rows.every((row) => row.classList.contains('is-canvas-highlighted')))
      assert.ok(rows.every((row) => !row.classList.contains('is-focused')))
      assert.ok(rows[0]._scrollIntoViewCalls >= 1)

      // Held key must not re-notify (event.repeat) — pin via scroll, not applyCount
      // (same-type already no-ops store.apply).
      const scrollBefore = rows[0]._scrollIntoViewCalls
      const liveHit = root.querySelector('[data-object-type-id="headerLed"]')
      assert.ok(liveHit)
      liveHit.dispatchEvent({ type: 'keydown', key: 'Enter', repeat: true })
      assert.equal(
        propertyRows(root)[0]._scrollIntoViewCalls,
        scrollBefore,
        'event.repeat must not re-run highlight/scroll',
      )

      // Space selects a different type the same way as click (bridge + highlight).
      const knob = root.querySelector('[data-object-type-id="knobLarge"]')
      assert.ok(knob)
      knob.dispatchEvent({ type: 'keydown', key: ' ', repeat: false })
      assert.equal(store.getState().session.selectedObjectTypeId, 'knobLarge')
      const afterSpace = propertyRows(root)
      assert.ok(
        afterSpace.every((row) => row.classList.contains('is-canvas-highlighted')),
      )
    } finally {
      restore()
    }
  })

  it('AUTO_MAPPINGS runs before highlightScroll on canvas hit', async () => {
    const restore = installMinimalDocument()
    try {
      const [canvas, sidebar, model] = await Promise.all([
        importCompiledTs('src/canvas/index.ts'),
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const order = []
      const real = sidebar.createCanvasSelectionSync()
      const selectionSync = {
        notifyCanvasHit: () => real.notifyCanvasHit(),
        setSwitchToMappings: (fn) => {
          real.setSwitchToMappings(() => {
            order.push('switchToMappings')
            fn?.()
          })
        },
        setHighlightScroll: (fn) => {
          real.setHighlightScroll(() => {
            order.push('highlightScroll')
            fn?.()
          })
        },
      }

      const store = model.createStore({
        project: fixtureProject(),
        session: defaultSession(),
      })
      const canvasHost = createRoot()
      const sidebarHost = createRoot()
      sidebarHost.setAttribute('data-sidebar', '')
      canvas.mountCanvas(canvasHost, {
        storage: memoryStorage(),
        store,
        selectionSync,
      })
      sidebar.mountSidebar(sidebarHost, {
        storage: memoryStorage(),
        store,
        selectionSync,
      })

      // Start on Skin so switchToMappings must run.
      const skinTab = sidebarHost.querySelector('[data-skin-seg-tab="skin"]')
      assert.ok(skinTab)
      skinTab.dispatchEvent({ type: 'click' })

      order.length = 0
      const hit = canvasHost.querySelector('[data-object-type-id="headerLed"]')
      assert.ok(hit)
      hit.dispatchEvent({ type: 'click' })

      assert.deepEqual(order, ['switchToMappings', 'highlightScroll'])
    } finally {
      restore()
    }
  })

  it('hit pointerdown stops pan (no drag session on host)', async () => {
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

      const host = root.querySelector('[data-canvas-host]')
      const hit = root.querySelector('[data-object-type-id="headerLed"]')
      assert.ok(host)
      assert.ok(hit)

      // Hit stops propagation — host pointerdown handler must not run.
      let hostPointerDowns = 0
      const originalDispatch = host.dispatchEvent.bind(host)
      host.dispatchEvent = (event) => {
        if (event.type === 'pointerdown') hostPointerDowns += 1
        return originalDispatch(event)
      }

      hit.dispatchEvent({
        type: 'pointerdown',
        button: 0,
        pointerId: 7,
        clientX: 10,
        clientY: 10,
      })
      assert.equal(hostPointerDowns, 0)

      // Empty mock / host still receives pan pointerdown.
      host.dispatchEvent({
        type: 'pointerdown',
        button: 0,
        pointerId: 8,
        clientX: 20,
        clientY: 20,
      })
      assert.equal(hostPointerDowns, 1)
    } finally {
      restore()
    }
  })

  it('sticky State across canvas type switch when shared state remains valid', async () => {
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

      clickHit(root, 'knobLarge')

      assert.equal(store.getState().session.selectedObjectTypeId, 'knobLarge')
      assert.equal(store.getState().session.selectedStateId, 'off')
    } finally {
      restore()
    }
  })

  it('Property-row click still sets MappingFocus and clears canvas highlight', async () => {
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

      clickHit(root, 'headerLed')
      const rows = propertyRows(root)
      assert.ok(rows[0].classList.contains('is-canvas-highlighted'))

      rows[0].dispatchEvent({ type: 'click' })
      const after = propertyRows(root)
      assert.ok(after[0].classList.contains('is-focused'))
      assert.equal(after[0].classList.contains('is-canvas-highlighted'), false)
    } finally {
      restore()
    }
  })

  it('Sidebar Object/State change clears canvas highlight after canvas hit', async () => {
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

      clickHit(root, 'headerLed')
      assert.ok(
        propertyRows(root).every((row) =>
          row.classList.contains('is-canvas-highlighted'),
        ),
      )

      const objectSelect = root.querySelector('[data-mappings-object-type]')
      assert.ok(objectSelect)
      objectSelect.value = 'knobLarge'
      objectSelect.dispatchEvent({ type: 'change' })

      const afterType = propertyRows(root)
      assert.ok(afterType.length >= 1)
      assert.ok(
        afterType.every((row) => !row.classList.contains('is-canvas-highlighted')),
      )

      clickHit(root, 'knobLarge')
      assert.ok(
        propertyRows(root).every((row) =>
          row.classList.contains('is-canvas-highlighted'),
        ),
      )

      const stateSelect = root.querySelector('[data-mappings-state]')
      assert.ok(stateSelect)
      stateSelect.value = 'normal'
      stateSelect.dispatchEvent({ type: 'change' })

      const afterState = propertyRows(root)
      assert.ok(afterState.length >= 1)
      assert.ok(
        afterState.every((row) => !row.classList.contains('is-canvas-highlighted')),
      )
    } finally {
      restore()
    }
  })

  it('Skin switch / null clears canvas highlight after canvas hit', async () => {
    const restore = installMinimalDocument()
    try {
      const [chrome, model] = await Promise.all([
        importCompiledTs('src/chrome/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const project = fixtureProject({
        skins: [
          { id: 'black-duo', displayName: 'Black/Duo', mappings: [] },
          { id: 'cream-duo', displayName: 'Cream/Duo', mappings: [] },
        ],
      })
      const { store, root } = mountSyncedShell(
        chrome,
        model,
        project,
        defaultSession(),
      )

      clickHit(root, 'headerLed')
      assert.ok(
        propertyRows(root).every((row) =>
          row.classList.contains('is-canvas-highlighted'),
        ),
      )

      const session = store.getState().session
      store.apply({
        session: { ...session, activeSkinId: 'cream-duo' },
      })
      const afterSwitch = propertyRows(root)
      assert.ok(afterSwitch.length >= 1)
      assert.ok(
        afterSwitch.every(
          (row) => !row.classList.contains('is-canvas-highlighted'),
        ),
      )

      clickHit(root, 'headerLed')
      assert.ok(
        propertyRows(root).every((row) =>
          row.classList.contains('is-canvas-highlighted'),
        ),
      )

      store.apply({
        session: {
          ...store.getState().session,
          activeSkinId: null,
        },
      })
      assert.equal(propertyRows(root).length, 0)

      store.apply({
        session: {
          ...store.getState().session,
          activeSkinId: 'black-duo',
        },
      })
      const restored = propertyRows(root)
      assert.ok(restored.length >= 1)
      assert.ok(
        restored.every((row) => !row.classList.contains('is-canvas-highlighted')),
        'highlight must stay off until a new canvas hit',
      )
    } finally {
      restore()
    }
  })
})
