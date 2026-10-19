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
  const dir = mkdtempSync(join(tmpdir(), 'skin-studio-unbound-pane-'))
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
    prepend(...nodes) {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const child = nodes[i]
        child.parent = node
        node.children.unshift(child)
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
    return el.classList.contains(selector.slice(1))
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

function createRoot() {
  return createElement('div')
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
        properties: ['fill'],
      },
      {
        id: 'knob',
        states: ['normal'],
        properties: ['ring'],
      },
    ],
  }
}

/** Black: all 3 slots unbound; Green: only knob/ring unbound (rest bound). */
function multiSkinProject(overrides = {}) {
  return {
    formatVersion: 1,
    palette: [{ id: 'duoLedYellow', hex: '#FFCC00', constantName: 'kDuoLedYellow' }],
    skins: [
      {
        id: 'black',
        displayName: 'Black',
        mappings: [],
      },
      {
        id: 'green',
        displayName: 'Green',
        mappings: [
          {
            objectTypeId: 'headerLed',
            stateId: 'off',
            propertyId: 'fill',
            paletteEntryId: 'duoLedYellow',
          },
          {
            objectTypeId: 'headerLed',
            stateId: 'on',
            propertyId: 'fill',
            paletteEntryId: 'duoLedYellow',
          },
        ],
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
    activeSkinId: 'black',
    ...overrides,
  }
}

function mountSidebarWithStore(sidebar, storeMod, project, session) {
  const store = storeMod.createStore({ project, session })
  const host = createRoot()
  host.setAttribute('data-sidebar', '')
  sidebar.mountSidebar(host, { storage: memoryStorage(), store })
  return { store, host }
}

function unboundBadge(host) {
  return host.querySelector('[data-unbound-badge]')
}

function unboundRows(host) {
  const list = host.querySelector('[data-unbound-list]')
  assert.ok(list)
  return list.querySelectorAll('[data-unbound-row]')
}

function unboundEmpty(host) {
  return host.querySelector('[data-unbound-empty]')
}

function setActiveSkin(store, history, activeSkinId) {
  const { session } = store.getState()
  history.execute(
    store,
    {
      session: {
        selectedObjectTypeId: session.selectedObjectTypeId,
        selectedStateId: session.selectedStateId,
        activeSkinId,
      },
    },
    { push: false },
  )
}

describe('unbound pane matrix', () => {
  it('registers unbound-pane-matrix in npm test', () => {
    assert.match(pkg.scripts?.test ?? '', /unbound-pane-matrix\.test\.mjs/)
  })

  it('empty inventory: project-total 0 → honest empty copy, no badge, no rows', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model, seed] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
        importCompiledTs('src/seed/index.ts'),
      ])
      const project = seed.createSeedProject()
      project.inventory = { source: 'seed-placeholder', objectTypes: [] }
      project.skins = project.skins.map((skin) => ({ ...skin, mappings: [] }))
      assert.deepEqual(project.inventory.objectTypes, [])

      const { host } = mountSidebarWithStore(
        sidebar,
        model,
        project,
        defaultSession({ activeSkinId: project.skins[0]?.id ?? null }),
      )

      const badge = unboundBadge(host)
      const empty = unboundEmpty(host)
      assert.ok(badge)
      assert.ok(empty)
      assert.equal(badge.hidden, true)
      assert.equal(empty.hidden, false)
      assert.equal(
        empty.textContent,
        'No Object types loaded — nothing required to bind',
      )
      assert.notEqual(empty.textContent, 'All required mappings bound')
      assert.equal(unboundRows(host).length, 0)
    } finally {
      restore()
    }
  })

  it('seed inventory fully bound: project-total 0 → success copy', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model, seed] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
        importCompiledTs('src/seed/index.ts'),
      ])
      const project = seed.createSeedProject()
      assert.equal(project.inventory.objectTypes.length, 3)

      const { host } = mountSidebarWithStore(
        sidebar,
        model,
        project,
        defaultSession({ activeSkinId: project.skins[0]?.id ?? null }),
      )

      const badge = unboundBadge(host)
      const empty = unboundEmpty(host)
      assert.equal(badge.hidden, true)
      assert.equal(empty.hidden, false)
      assert.equal(empty.textContent, 'All required mappings bound')
      assert.equal(unboundRows(host).length, 0)
    } finally {
      restore()
    }
  })

  it('ObjectTypes without slots: project-total 0 → no-bindable-slots copy', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model, seed] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
        importCompiledTs('src/seed/index.ts'),
      ])
      const project = seed.createSeedProject()
      project.inventory = {
        source: 'fixture',
        objectTypes: [{ id: 'headerLed', states: [], properties: [] }],
      }
      project.skins = project.skins.map((skin) => ({ ...skin, mappings: [] }))

      const { host } = mountSidebarWithStore(
        sidebar,
        model,
        project,
        defaultSession({ activeSkinId: project.skins[0]?.id ?? null }),
      )

      assert.equal(
        unboundEmpty(host).textContent,
        'Nothing required to bind — no bindable slots',
      )
      assert.notEqual(
        unboundEmpty(host).textContent,
        'No Object types loaded — nothing required to bind',
      )
    } finally {
      restore()
    }
  })

  it('required slots but no skins: project-total 0 → no-skins copy', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model, seed] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
        importCompiledTs('src/seed/index.ts'),
      ])
      const project = seed.createSeedProject()
      project.skins = []

      const { host } = mountSidebarWithStore(
        sidebar,
        model,
        project,
        defaultSession({ activeSkinId: null }),
      )

      assert.equal(unboundEmpty(host).textContent, 'No skins — nothing to bind')
      assert.notEqual(
        unboundEmpty(host).textContent,
        'All required mappings bound',
      )
    } finally {
      restore()
    }
  })

  it('multi-skin: badge = project total; list = active Skin only; INCLUDE_STATE labels', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      // Black 3 + Green 1 = 4
      const { host } = mountSidebarWithStore(
        sidebar,
        model,
        multiSkinProject(),
        defaultSession({ activeSkinId: 'black' }),
      )

      const badge = unboundBadge(host)
      assert.ok(badge)
      assert.equal(badge.hidden, false)
      assert.equal(badge.textContent, '4 unbound')

      const rows = unboundRows(host)
      assert.equal(rows.length, 3)
      const labels = rows.map((r) => r.textContent)
      assert.ok(labels.includes('headerLed · off · fill'))
      assert.ok(labels.includes('headerLed · on · fill'))
      assert.ok(labels.includes('knob · normal · ring'))
      assert.equal(
        labels.every((label) => label.includes(' · ')),
        true,
      )
    } finally {
      restore()
    }
  })

  it('active Skin clear / others dirty: badge stays; list empty; no success copy', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model, history] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
        importCompiledTs('src/history/index.ts'),
      ])
      const project = multiSkinProject({
        skins: [
          {
            id: 'black',
            displayName: 'Black',
            mappings: [
              {
                objectTypeId: 'headerLed',
                stateId: 'off',
                propertyId: 'fill',
                paletteEntryId: 'duoLedYellow',
              },
              {
                objectTypeId: 'headerLed',
                stateId: 'on',
                propertyId: 'fill',
                paletteEntryId: 'duoLedYellow',
              },
              {
                objectTypeId: 'knob',
                stateId: 'normal',
                propertyId: 'ring',
                paletteEntryId: 'duoLedYellow',
              },
            ],
          },
          {
            id: 'green',
            displayName: 'Green',
            mappings: [],
          },
        ],
      })
      // Black clear; Green 3 unbound → badge 3, list empty on Black
      const { store, host } = mountSidebarWithStore(
        sidebar,
        model,
        project,
        defaultSession({ activeSkinId: 'black' }),
      )

      const badge = unboundBadge(host)
      const empty = unboundEmpty(host)
      assert.equal(badge.textContent, '3 unbound')
      assert.equal(badge.hidden, false)
      assert.equal(unboundRows(host).length, 0)
      assert.equal(empty.hidden, true)
      assert.notEqual(empty.textContent, 'All required mappings bound')

      setActiveSkin(store, history, 'green')
      assert.equal(badge.textContent, '3 unbound')
      assert.equal(unboundRows(host).length, 3)
    } finally {
      restore()
    }
  })

  it('Skin switch refilters list; project badge unchanged', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model, history] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
        importCompiledTs('src/history/index.ts'),
      ])
      const { store, host } = mountSidebarWithStore(
        sidebar,
        model,
        multiSkinProject(),
        defaultSession({ activeSkinId: 'black' }),
      )

      assert.equal(unboundBadge(host).textContent, '4 unbound')
      assert.equal(unboundRows(host).length, 3)

      setActiveSkin(store, history, 'green')
      assert.equal(unboundBadge(host).textContent, '4 unbound')
      const rows = unboundRows(host)
      assert.equal(rows.length, 1)
      assert.equal(rows[0].textContent, 'knob · normal · ring')
    } finally {
      restore()
    }
  })

  it('row click: session Object/State + Mapping focus + switch to Mappings; undo restores prior', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model, history] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
        importCompiledTs('src/history/index.ts'),
      ])
      const { store, host } = mountSidebarWithStore(
        sidebar,
        model,
        multiSkinProject(),
        defaultSession({
          activeSkinId: 'black',
          selectedObjectTypeId: 'knob',
          selectedStateId: 'normal',
        }),
      )

      const headBadge = unboundBadge(host)
      assert.ok(headBadge)
      assert.ok(
        headBadge.parent?.getAttribute?.('data-skin-seg-tab') === 'unbound' ||
          headBadge.parent?.getAttribute?.('data-sidebar-tab') === 'unbound',
        'badge must live on the Unbound tab (Lot B)',
      )

      // Start on Skin segment so jump must switch back to Mappings.
      // Badge must remain visible on the Unbound tab while another tab is active.
      const skinTab = host.querySelector('[data-skin-seg-tab="skin"]')
      assert.ok(skinTab)
      skinTab.click()
      assert.equal(headBadge.hidden, false)
      assert.equal(headBadge.textContent, '4 unbound')
      const mappingsPanel = host.querySelector('[data-mappings-tab]')
      const skinPanel = host.querySelector('[data-skin-tab]')
      assert.equal(mappingsPanel.hidden, true)
      assert.equal(skinPanel.hidden, false)

      const row = unboundRows(host).find(
        (r) =>
          r.getAttribute('data-unbound-object-type') === 'headerLed' &&
          r.getAttribute('data-unbound-state') === 'on' &&
          r.getAttribute('data-unbound-property') === 'fill',
      )
      assert.ok(row)
      row.click()

      const session = store.getState().session
      assert.equal(session.selectedObjectTypeId, 'headerLed')
      assert.equal(session.selectedStateId, 'on')
      assert.equal(session.activeSkinId, 'black')

      assert.equal(mappingsPanel.hidden, false)
      assert.equal(skinPanel.hidden, true)

      const focused = host
        .querySelectorAll('[data-mapping-row]')
        .find((r) => r.classList.contains('is-focused'))
      assert.ok(focused)
      assert.equal(focused.getAttribute('data-mapping-row'), 'fill')
      assert.ok(
        focused._scrollIntoViewCalls >= 1,
        'Unbound jump must scroll the focused Mapping row into view',
      )

      history.undo(store)
      const restored = store.getState().session
      assert.equal(restored.selectedObjectTypeId, 'knob')
      assert.equal(restored.selectedStateId, 'normal')
      assert.equal(restored.activeSkinId, 'black')
    } finally {
      restore()
    }
  })

  it('bind all → success copy; clear/break a binding brings badge and list back', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model, history] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
        importCompiledTs('src/history/index.ts'),
      ])
      const boundMappings = [
        {
          objectTypeId: 'headerLed',
          stateId: 'off',
          propertyId: 'fill',
          paletteEntryId: 'duoLedYellow',
        },
        {
          objectTypeId: 'headerLed',
          stateId: 'on',
          propertyId: 'fill',
          paletteEntryId: 'duoLedYellow',
        },
        {
          objectTypeId: 'knob',
          stateId: 'normal',
          propertyId: 'ring',
          paletteEntryId: 'duoLedYellow',
        },
      ]
      const { store, host } = mountSidebarWithStore(
        sidebar,
        model,
        multiSkinProject(),
        defaultSession({ activeSkinId: 'black' }),
      )
      assert.equal(unboundBadge(host).textContent, '4 unbound')

      const { project } = store.getState()
      history.execute(store, {
        project: {
          ...project,
          skins: project.skins.map((skin) => ({
            ...skin,
            mappings: boundMappings.map((m) => ({ ...m })),
          })),
        },
      })

      const badge = unboundBadge(host)
      const empty = unboundEmpty(host)
      assert.equal(badge.hidden, true)
      assert.equal(empty.hidden, false)
      assert.equal(empty.textContent, 'All required mappings bound')
      assert.equal(unboundRows(host).length, 0)

      const afterBound = store.getState().project
      history.execute(store, {
        project: {
          ...afterBound,
          skins: afterBound.skins.map((skin) => ({
            ...skin,
            mappings: skin.mappings.map((m) =>
              m.objectTypeId === 'knob' &&
              m.stateId === 'normal' &&
              m.propertyId === 'ring'
                ? { ...m, paletteEntryId: null }
                : { ...m },
            ),
          })),
        },
      })

      assert.equal(badge.hidden, false)
      assert.equal(badge.textContent, '2 unbound')
      assert.equal(empty.hidden, true)
      const rows = unboundRows(host)
      assert.equal(rows.length, 1)
      assert.equal(rows[0].textContent, 'knob · normal · ring')
    } finally {
      restore()
    }
  })
})
