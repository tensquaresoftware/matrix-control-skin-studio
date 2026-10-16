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
  const dir = mkdtempSync(join(tmpdir(), 'skin-studio-skin-tab-'))
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

function skinOptionValues(root) {
  const select = root.querySelector('[data-chrome-skin-select]')
  assert.ok(select)
  return select.children.map((opt) => opt.value).filter((v) => v !== '')
}

describe('skin tab I/O matrix', () => {
  it('registers skin-tab-matrix in npm test', () => {
    assert.match(pkg.scripts?.test ?? '', /skin-tab-matrix\.test\.mjs/)
  })

  it('segment default: Mappings selected; Skin body hidden until Skin chosen', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model, seed] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
        importCompiledTs('src/seed/index.ts'),
      ])
      const { host } = mountSidebarWithStore(
        sidebar,
        model,
        seed.createSeedProject(),
        defaultSession(),
      )

      const mappingsBtn = host.querySelector('[data-skin-seg-tab="mappings"]')
      const skinBtn = host.querySelector('[data-skin-seg-tab="skin"]')
      const mappingsPanel = host.querySelector('[data-mappings-tab]')
      const skinPanel = host.querySelector('[data-skin-tab]')
      assert.ok(mappingsBtn?.classList.contains('is-on'))
      assert.equal(skinBtn?.classList.contains('is-on'), false)
      assert.equal(mappingsPanel?.hidden, false)
      assert.equal(skinPanel?.hidden, true)
      assert.equal(mappingsPanel?.children.length, 0)

      selectSkinTab(host)
      assert.equal(mappingsBtn?.classList.contains('is-on'), false)
      assert.ok(skinBtn?.classList.contains('is-on'))
      assert.equal(mappingsPanel?.hidden, true)
      assert.equal(skinPanel?.hidden, false)
    } finally {
      restore()
    }
  })

  it('open Skin tab: name shows active displayName; Create / Duplicate / Delete enabled', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { host } = mountSidebarWithStore(
        sidebar,
        model,
        projectWithActiveSkin(),
        defaultSession('black-green'),
      )
      selectSkinTab(host)

      const name = host.querySelector('[data-skin-name]')
      assert.ok(name)
      assert.equal(name.value, 'Black/Green')
      assert.equal(name.disabled, false)
      const createBtn = host.querySelector('[data-skin-create]')
      assert.equal(createBtn?.textContent, 'Create Skin')
      assert.equal(createBtn?.disabled, false)
      assert.equal(host.querySelector('[data-skin-duplicate]')?.disabled, false)
      assert.equal(host.querySelector('[data-skin-delete]')?.disabled, false)
    } finally {
      restore()
    }
  })

  it('rename: blur commits displayName; id stays stable; empty restores prior', async () => {
    const restore = installMinimalDocument()
    try {
      const [chrome, model] = await Promise.all([
        importCompiledTs('src/chrome/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, root } = mountChromeWithStore(
        chrome,
        model,
        projectWithActiveSkin(),
        defaultSession('black-green'),
      )
      selectSkinTab(root)

      const name = root.querySelector('[data-skin-name]')
      assert.ok(name)
      name.focus()
      name.value = 'Night/Green'
      name.dispatchEvent({ type: 'keydown', key: 'Enter' })

      const skin = store.getState().project.skins.find((s) => s.id === 'black-green')
      assert.ok(skin)
      assert.equal(skin.id, 'black-green')
      assert.equal(skin.displayName, 'Night/Green')
      assert.equal(name.value, 'Night/Green')

      const select = root.querySelector('[data-chrome-skin-select]')
      assert.ok(select)
      const option = select.children.find((o) => o.value === 'black-green')
      assert.equal(option?.textContent, 'Night/Green')
      assert.equal(
        root.querySelector('[data-context-value="skin"]')?.textContent,
        'Night/Green',
      )

      name.focus()
      name.value = '   '
      name.blur()
      assert.equal(
        store.getState().project.skins.find((s) => s.id === 'black-green')
          ?.displayName,
        'Night/Green',
      )
      assert.equal(name.value, 'Night/Green')
    } finally {
      restore()
    }
  })

  it('rename: mid-edit keeps focused Skin id and draft across store tick', async () => {
    const restore = installMinimalDocument()
    try {
      const [chrome, model] = await Promise.all([
        importCompiledTs('src/chrome/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, root } = mountChromeWithStore(
        chrome,
        model,
        projectWithActiveSkin(),
        defaultSession('black-green'),
      )
      selectSkinTab(root)

      const name = root.querySelector('[data-skin-name]')
      assert.ok(name)
      name.focus()
      name.value = 'Night/Green'

      // Unrelated store tick while focused must not wipe the draft.
      const project = store.getState().project
      store.apply({
        project: {
          ...project,
          palette: project.palette.map((e) =>
            e.id === 'duoLedYellow' ? { ...e, hex: '#FFDD00' } : e,
          ),
        },
      })
      assert.equal(name.value, 'Night/Green')

      // Switching active Skin mid-edit must still rename the focused id.
      store.apply({
        session: {
          ...store.getState().session,
          activeSkinId: 'cream-green',
        },
      })
      assert.equal(name.value, 'Night/Green')
      name.blur()

      const skins = store.getState().project.skins
      assert.equal(
        skins.find((s) => s.id === 'black-green')?.displayName,
        'Night/Green',
      )
      assert.equal(
        skins.find((s) => s.id === 'cream-green')?.displayName,
        'Cream/Green',
      )
    } finally {
      restore()
    }
  })

  it('duplicate: new id, deep-copied mappings, (copy) name, activates copy, combo lists it', async () => {
    const restore = installMinimalDocument()
    try {
      const [chrome, model] = await Promise.all([
        importCompiledTs('src/chrome/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, root } = mountChromeWithStore(
        chrome,
        model,
        projectWithActiveSkin(),
        defaultSession('black-green'),
      )
      selectSkinTab(root)

      const beforeIds = new Set(store.getState().project.skins.map((s) => s.id))
      root.querySelector('[data-skin-duplicate]').click()

      const { project, session } = store.getState()
      const copy = project.skins.find((s) => !beforeIds.has(s.id))
      assert.ok(copy)
      assert.equal(copy.displayName, 'Black/Green (copy)')
      assert.equal(session.activeSkinId, copy.id)
      assert.equal(copy.mappings.length, 2)
      assert.deepEqual(copy.mappings, fixtureMappings())
      assert.notEqual(copy.mappings, project.skins[0].mappings)
      assert.notEqual(copy.mappings[0], project.skins[0].mappings[0])

      const optionValues = skinOptionValues(root)
      assert.ok(optionValues.includes(copy.id))
      assert.equal(root.querySelector('[data-chrome-skin-select]')?.value, copy.id)
      assert.equal(root.querySelector('[data-skin-name]')?.value, 'Black/Green (copy)')
    } finally {
      restore()
    }
  })

  it('delete cancel: modal closes; project.skins unchanged', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, host } = mountSidebarWithStore(
        sidebar,
        model,
        projectWithActiveSkin(),
        defaultSession('black-green'),
      )
      selectSkinTab(host)
      const before = structuredClone(store.getState().project.skins)

      host.querySelector('[data-skin-delete]').click()
      const modal = host.querySelector('[data-skin-delete-confirm]')
      assert.ok(modal)
      assert.equal(
        modal.querySelector('[data-skin-delete-body]')?.textContent,
        'Delete skin “Black/Green”? This cannot be undone.',
      )
      assert.equal(
        modal.querySelector('[data-skin-delete-cancel]')?.textContent,
        'Cancel',
      )
      assert.equal(
        modal.querySelector('[data-skin-delete-apply]')?.textContent,
        'Delete',
      )

      modal.querySelector('[data-skin-delete-cancel]').click()
      assert.equal(host.querySelector('[data-skin-delete-confirm]'), null)
      assert.deepEqual(store.getState().project.skins, before)
    } finally {
      restore()
    }
  })

  it('delete confirm: removes skin; combo refreshes; activeSkinId cleared by chrome', async () => {
    const restore = installMinimalDocument()
    try {
      const [chrome, model] = await Promise.all([
        importCompiledTs('src/chrome/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, root } = mountChromeWithStore(
        chrome,
        model,
        projectWithActiveSkin(),
        defaultSession('black-green'),
      )
      selectSkinTab(root)

      root.querySelector('[data-skin-delete]').click()
      const modal = root.querySelector('[data-skin-delete-confirm]')
      assert.ok(modal)
      modal.querySelector('[data-skin-delete-apply]').click()

      assert.equal(root.querySelector('[data-skin-delete-confirm]'), null)
      assert.equal(
        store.getState().project.skins.some((s) => s.id === 'black-green'),
        false,
      )
      assert.equal(store.getState().session.activeSkinId, null)
      assert.equal(skinOptionValues(root).includes('black-green'), false)
      assert.equal(root.querySelector('[data-chrome-skin-select]')?.value, '')
    } finally {
      restore()
    }
  })

  it('no active Skin: name empty/disabled; Create enabled; Duplicate / Delete disabled', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { host } = mountSidebarWithStore(
        sidebar,
        model,
        projectWithActiveSkin(),
        defaultSession(null),
      )
      selectSkinTab(host)

      const name = host.querySelector('[data-skin-name]')
      assert.ok(name)
      assert.equal(name.value, '')
      assert.equal(name.disabled, true)
      assert.equal(host.querySelector('[data-skin-create]')?.disabled, false)
      assert.equal(host.querySelector('[data-skin-duplicate]')?.disabled, true)
      assert.equal(host.querySelector('[data-skin-delete]')?.disabled, true)
    } finally {
      restore()
    }
  })

  it('stale activeSkinId: missing from skins → name empty/disabled; Create enabled; Duplicate / Delete disabled', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { host } = mountSidebarWithStore(
        sidebar,
        model,
        projectWithActiveSkin(),
        defaultSession('gone-skin-id'),
      )
      selectSkinTab(host)

      const name = host.querySelector('[data-skin-name]')
      assert.ok(name)
      assert.equal(name.value, '')
      assert.equal(name.disabled, true)
      assert.equal(host.querySelector('[data-skin-create]')?.disabled, false)
      assert.equal(host.querySelector('[data-skin-duplicate]')?.disabled, true)
      assert.equal(host.querySelector('[data-skin-delete]')?.disabled, true)
    } finally {
      restore()
    }
  })

  it('last skin delete: skins empty; combo empty; activeSkinId null; Create still enabled', async () => {
    const restore = installMinimalDocument()
    try {
      const [chrome, model] = await Promise.all([
        importCompiledTs('src/chrome/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, root } = mountChromeWithStore(
        chrome,
        model,
        {
          formatVersion: 1,
          palette: [],
          skins: [
            {
              id: 'only',
              displayName: 'Only Skin',
              mappings: [],
            },
          ],
          inventory: { objectTypes: [] },
        },
        defaultSession('only'),
      )
      selectSkinTab(root)

      root.querySelector('[data-skin-delete]').click()
      root.querySelector('[data-skin-delete-apply]').click()

      assert.deepEqual(store.getState().project.skins, [])
      assert.equal(store.getState().session.activeSkinId, null)
      assert.deepEqual(skinOptionValues(root), [])
      assert.equal(root.querySelector('[data-chrome-skin-select]')?.value, '')
      assert.equal(root.querySelector('[data-skin-name]')?.disabled, true)
      assert.equal(root.querySelector('[data-skin-create]')?.disabled, false)
      assert.equal(root.querySelector('[data-skin-duplicate]')?.disabled, true)
      assert.equal(root.querySelector('[data-skin-delete]')?.disabled, true)
    } finally {
      restore()
    }
  })

  it('create: appends Skin {n}, unique id, empty mappings, activates, combo lists it', async () => {
    const restore = installMinimalDocument()
    try {
      const [chrome, model] = await Promise.all([
        importCompiledTs('src/chrome/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      // Non-empty active mappings — Create must not copy them (unlike Duplicate).
      const { store, root } = mountChromeWithStore(
        chrome,
        model,
        projectWithActiveSkin(),
        defaultSession('black-green'),
      )
      selectSkinTab(root)

      const sourceMappings = store
        .getState()
        .project.skins.find((s) => s.id === 'black-green')?.mappings
      assert.ok(sourceMappings)
      assert.equal(sourceMappings.length > 0, true)

      const beforeIds = new Set(store.getState().project.skins.map((s) => s.id))
      const beforeCount = store.getState().project.skins.length
      root.querySelector('[data-skin-create]').click()

      const { project, session } = store.getState()
      assert.equal(project.skins.length, beforeCount + 1)
      const created = project.skins.find((s) => !beforeIds.has(s.id))
      assert.ok(created)
      assert.equal(created.displayName, 'Skin 1')
      assert.deepEqual(created.mappings, [])
      assert.notDeepEqual(created.mappings, sourceMappings)
      // Append-only: existing Skin mappings must remain unchanged after Create.
      assert.deepEqual(
        project.skins.find((s) => s.id === 'black-green')?.mappings,
        fixtureMappings(),
      )
      assert.equal(session.activeSkinId, created.id)
      assert.ok(skinOptionValues(root).includes(created.id))
      assert.equal(root.querySelector('[data-chrome-skin-select]')?.value, created.id)
      assert.equal(root.querySelector('[data-skin-name]')?.value, 'Skin 1')
    } finally {
      restore()
    }
  })

  it('create: Skin {n} gap-fill uses smallest unused positive integer', async () => {
    const restore = installMinimalDocument()
    try {
      const [chrome, model] = await Promise.all([
        importCompiledTs('src/chrome/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, root } = mountChromeWithStore(
        chrome,
        model,
        {
          formatVersion: 1,
          palette: [],
          skins: [
            { id: 's1', displayName: 'Skin 1', mappings: [] },
            { id: 's3', displayName: 'Skin 3', mappings: [] },
          ],
          inventory: { objectTypes: [] },
        },
        defaultSession('s1'),
      )
      selectSkinTab(root)
      root.querySelector('[data-skin-create]').click()

      const created = store
        .getState()
        .project.skins.find((s) => s.id !== 's1' && s.id !== 's3')
      assert.ok(created)
      assert.equal(created.displayName, 'Skin 2')
    } finally {
      restore()
    }
  })

  it('create without active / empty list: Create enabled; recovers with one activated Skin', async () => {
    const restore = installMinimalDocument()
    try {
      const [chrome, model] = await Promise.all([
        importCompiledTs('src/chrome/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, root } = mountChromeWithStore(
        chrome,
        model,
        {
          formatVersion: 1,
          palette: [],
          skins: [],
          inventory: { objectTypes: [] },
        },
        defaultSession(null),
      )
      selectSkinTab(root)

      assert.equal(root.querySelector('[data-skin-create]')?.disabled, false)
      assert.equal(root.querySelector('[data-skin-duplicate]')?.disabled, true)
      assert.equal(root.querySelector('[data-skin-delete]')?.disabled, true)

      root.querySelector('[data-skin-create]').click()

      const { project, session } = store.getState()
      assert.equal(project.skins.length, 1)
      const created = project.skins[0]
      assert.equal(created.displayName, 'Skin 1')
      assert.deepEqual(created.mappings, [])
      assert.equal(session.activeSkinId, created.id)
      assert.deepEqual(skinOptionValues(root), [created.id])
      assert.equal(root.querySelector('[data-skin-name]')?.value, 'Skin 1')
      assert.equal(root.querySelector('[data-skin-name]')?.disabled, false)
    } finally {
      restore()
    }
  })

  it('create: preserves v1 display names, rejects rejected names, Duo LED, empty objectTypes', async () => {
    const restore = installMinimalDocument()
    try {
      const [chrome, model, seed] = await Promise.all([
        importCompiledTs('src/chrome/index.ts'),
        importCompiledTs('src/model/index.ts'),
        importCompiledTs('src/seed/index.ts'),
      ])
      const V1_DISPLAY_NAMES = [
        'Black/Green',
        'Cream/Green',
        'Black/Duo',
        'Cream/Duo',
        'Monochrome',
      ]
      const REJECTED_NAMES = ['Black/Two-tone', 'Cream/Two-tone', 'Split']

      const seeded = seed.createSeedProject()
      const { store, root } = mountChromeWithStore(
        chrome,
        model,
        seeded,
        defaultSession(seeded.skins[0].id),
      )
      selectSkinTab(root)
      root.querySelector('[data-skin-create]').click()

      const { project } = store.getState()
      const names = project.skins.map((s) => s.displayName)
      for (const v1 of V1_DISPLAY_NAMES) {
        assert.ok(names.includes(v1), `missing v1 name after create: ${v1}`)
      }
      for (const rejected of REJECTED_NAMES) {
        assert.equal(
          names.includes(rejected),
          false,
          `rejected name introduced by create: ${rejected}`,
        )
      }

      const duo = project.palette.find((e) => e.id === 'duoLedYellow')
      assert.ok(duo)
      assert.equal(duo.hex, '#FFCC00')
      assert.equal(duo.constantName, 'kDuoLedYellow')

      // Calibratable: hex write-through on that id still works after create.
      store.apply({
        project: {
          ...project,
          palette: project.palette.map((e) =>
            e.id === 'duoLedYellow' ? { ...e, hex: '#AABB00' } : e,
          ),
        },
      })
      assert.equal(
        store.getState().project.palette.find((e) => e.id === 'duoLedYellow')
          ?.hex,
        '#AABB00',
      )

      assert.deepEqual(store.getState().project.inventory.objectTypes, [])
      for (const ot of store.getState().project.inventory.objectTypes) {
        assert.equal('hex' in ot, false)
        assert.equal('colour' in ot, false)
        assert.equal('color' in ot, false)
      }
    } finally {
      restore()
    }
  })
})
