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
  const dir = mkdtempSync(join(tmpdir(), 'skin-studio-epic3-crossflow-'))
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

function fixtureMappings() {
  return [
    {
      objectTypeId: 'knobLarge',
      stateId: 'normal',
      propertyId: 'led_on',
      paletteEntryId: 'duoLedYellow',
    },
    {
      objectTypeId: 'led',
      stateId: 'on',
      propertyId: 'fill',
      paletteEntryId: 'duoLedYellow',
    },
  ]
}

function projectWithActiveSkin(overrides = {}) {
  return {
    formatVersion: 1,
    palette: [{ id: 'duoLedYellow', hex: '#FFCC00', constantName: 'kDuoLedYellow' }],
    skins: [
      {
        id: 'black-green',
        displayName: 'Black/Green',
        mappings: fixtureMappings(),
      },
      {
        id: 'cream-green',
        displayName: 'Cream/Green',
        mappings: [],
      },
    ],
    inventory: { objectTypes: [] },
    ...overrides,
  }
}

function defaultSession(activeSkinId = 'black-green') {
  return {
    selectedObjectTypeId: null,
    selectedStateId: null,
    activeSkinId,
  }
}

function mountSidebarWithStore(sidebar, storeMod, project, session) {
  const store = storeMod.createStore({ project, session })
  const host = createRoot()
  host.setAttribute('data-sidebar', '')
  sidebar.mountSidebar(host, { storage: memoryStorage(), store })
  return { store, host }
}

function mountChromeWithStore(chrome, storeMod, project, session) {
  const store = storeMod.createStore({ project, session })
  const root = createRoot()
  root.id = 'app'
  chrome.mountChromeShell(root, store, { storage: memoryStorage() })
  return { store, root }
}

function selectSkinTab(host) {
  const skinTab = host.querySelector('[data-skin-seg-tab="skin"]')
  assert.ok(skinTab)
  skinTab.click()
}


function findButtonByLabel(root, label) {
  const out = []
  const walk = (el) => {
    for (const child of el.children || []) {
      if (child.tagName === 'BUTTON' && child.textContent === label) out.push(child)
      walk(child)
    }
  }
  walk(root)
  return out[0] ?? null
}

describe('epic 3 crossflow matrix', () => {
  it('registers epic-3-crossflow-matrix in npm test', () => {
    assert.match(pkg.scripts?.test ?? '', /epic-3-crossflow-matrix\.test\.mjs/)
  })

  it('duplicate then referenced palette delete: both skins unbound (null, no hex)', async () => {
    const restore = installMinimalDocument()
    try {
      const [chrome, model] = await Promise.all([
        importCompiledTs('src/chrome/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const sharedMappings = [
        {
          objectTypeId: 'headerLed',
          stateId: 'on',
          propertyId: 'fill',
          paletteEntryId: 'duoLedYellow',
        },
      ]
      const { store, root } = mountChromeWithStore(
        chrome,
        model,
        {
          formatVersion: 1,
          palette: [
            { id: 'duoLedYellow', hex: '#FFCC00', constantName: 'kDuoLedYellow' },
          ],
          skins: [
            {
              id: 'black-duo',
              displayName: 'Black/Duo',
              mappings: sharedMappings,
            },
            {
              id: 'cream-duo',
              displayName: 'Cream/Duo',
              mappings: [],
            },
          ],
          inventory: { objectTypes: [] },
        },
        defaultSession('black-duo'),
      )
      selectSkinTab(root)
      const beforeIds = new Set(store.getState().project.skins.map((s) => s.id))
      root.querySelector('[data-skin-duplicate]').click()
      const copy = store.getState().project.skins.find((s) => !beforeIds.has(s.id))
      assert.ok(copy)
      assert.equal(copy.mappings[0].paletteEntryId, 'duoLedYellow')

      root.querySelector('[data-palette-row="duoLedYellow"]').click()
      root.querySelector('[data-palette-delete]').click()
      const modal = root.querySelector('[data-palette-delete-confirm]')
      assert.ok(modal)
      modal.querySelector('[data-palette-delete-apply]').click()

      const skins = store.getState().project.skins
      const source = skins.find((s) => s.id === 'black-duo')
      const duplicated = skins.find((s) => s.id === copy.id)
      assert.equal(source.mappings[0].paletteEntryId, null)
      assert.equal(duplicated.mappings[0].paletteEntryId, null)
      assert.equal('hex' in source.mappings[0], false)
      assert.equal('hex' in duplicated.mappings[0], false)
      assert.equal(
        store.getState().project.palette.some((e) => e.id === 'duoLedYellow'),
        false,
      )
    } finally {
      restore()
    }
  })

  it('New confirm dismisses open Skin delete confirm; seed keeps v1 skins', async () => {
    const restore = installMinimalDocument()
    try {
      const [chrome, model, seed] = await Promise.all([
        importCompiledTs('src/chrome/index.ts'),
        importCompiledTs('src/model/index.ts'),
        importCompiledTs('src/seed/index.ts'),
      ])
      const seeded = seed.createSeedProject()
      const { store, root } = mountChromeWithStore(
        chrome,
        model,
        seeded,
        defaultSession(seeded.skins[0].id),
      )
      selectSkinTab(root)
      root.querySelector('[data-skin-delete]').click()
      assert.ok(root.querySelector('[data-skin-delete-confirm]'))

      const newButton = findButtonByLabel(root, 'New')
      assert.ok(newButton)
      newButton.click()
      const newScrim = root.querySelector('[data-boot-confirm]')
      assert.ok(newScrim)
      findButtonByLabel(newScrim, 'New').click()

      assert.equal(root.querySelector('[data-skin-delete-confirm]'), null)
      assert.equal(root.querySelector('[data-boot-confirm]'), null)
      assert.deepEqual(store.getState().project, seed.createSeedProject())
      assert.equal(store.getState().project.skins.length, 5)
      assert.ok(
        store.getState().project.palette.some((e) => e.id === 'duoLedYellow'),
      )
    } finally {
      restore()
    }
  })
})
