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
  const dir = mkdtempSync(join(tmpdir(), 'skin-studio-mappings-'))
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
        // Shares `off` with headerLed so sticky State can be asserted on type switch.
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
    ],
    skins: [
      {
        id: 'black-duo',
        displayName: 'Black/Duo',
        mappings: [],
      },
      {
        id: 'cream-duo',
        displayName: 'Cream/Duo',
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

function mountSidebarWithStore(sidebar, storeMod, project, session) {
  const store = storeMod.createStore({ project, session })
  const host = createRoot()
  host.setAttribute('data-sidebar', '')
  sidebar.mountSidebar(host, { storage: memoryStorage(), store })
  return { store, host }
}

function selectObjectType(host, objectTypeId) {
  const select = host.querySelector('[data-mappings-object-type]')
  assert.ok(select)
  select.value = objectTypeId
  select.dispatchEvent({ type: 'change' })
}

function selectState(host, stateId) {
  const select = host.querySelector('[data-mappings-state]')
  assert.ok(select)
  select.value = stateId
  select.dispatchEvent({ type: 'change' })
}

function propertyRows(host) {
  const list = host.querySelector('[data-mappings-property-list]')
  assert.ok(list)
  return list.querySelectorAll('[data-mapping-row]')
}

function findMappingInSkin(store, triple, skinId = 'black-duo') {
  const skin = store.getState().project.skins.find((s) => s.id === skinId)
  assert.ok(skin)
  return skin.mappings.find(
    (m) =>
      m.objectTypeId === triple.objectTypeId &&
      m.stateId === triple.stateId &&
      m.propertyId === triple.propertyId,
  )
}

function skinMappings(store, skinId = 'black-duo') {
  const skin = store.getState().project.skins.find((s) => s.id === skinId)
  assert.ok(skin)
  return skin.mappings
}

describe('mappings I/O matrix', () => {
  it('registers mappings-matrix in npm test', () => {
    assert.match(pkg.scripts?.test ?? '', /mappings-matrix\.test\.mjs/)
  })

  it('empty inventory: no selectable Object types; empty Property list; no invented types', async () => {
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
        defaultSession(),
      )

      const objectSelect = host.querySelector('[data-mappings-object-type]')
      const stateSelect = host.querySelector('[data-mappings-state]')
      const list = host.querySelector('[data-mappings-property-list]')
      assert.ok(objectSelect)
      assert.ok(stateSelect)
      assert.ok(list)
      assert.equal(objectSelect.disabled, true)
      assert.equal(stateSelect.disabled, true)
      // Only the empty "—" option — no Collect / invented types.
      assert.equal(objectSelect.children.length, 1)
      assert.equal(objectSelect.children[0].value, '')
      assert.equal(list.children.length, 0)
    } finally {
      restore()
    }
  })

  it('happy bind: focus Unbound row → click Palette entry upserts paletteEntryId only', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, host } = mountSidebarWithStore(
        sidebar,
        model,
        fixtureProject(),
        defaultSession(),
      )

      selectObjectType(host, 'headerLed')
      assert.equal(store.getState().session.selectedObjectTypeId, 'headerLed')
      // Type change picks first state when none was sticky.
      assert.equal(store.getState().session.selectedStateId, 'off')

      const rows = propertyRows(host)
      assert.equal(rows.length, 2)
      const fillRow = rows.find(
        (row) => row.getAttribute('data-mapping-row') === 'fill',
      )
      assert.ok(fillRow)
      assert.ok(fillRow.classList.contains('is-unbound'))
      assert.ok(fillRow.querySelector('[data-mapping-unbound-marker]'))
      assert.equal(
        fillRow.querySelector('[data-mapping-unbound-label]')?.textContent,
        'Unbound',
      )

      fillRow.click()
      const focusedRow = propertyRows(host).find(
        (row) => row.getAttribute('data-mapping-row') === 'fill',
      )
      assert.ok(focusedRow?.classList.contains('is-focused'))

      const paletteRow = host.querySelector('[data-palette-row="duoLedYellow"]')
      assert.ok(paletteRow)
      paletteRow.click()

      const mapping = findMappingInSkin(store, {
        objectTypeId: 'headerLed',
        stateId: 'off',
        propertyId: 'fill',
      })
      assert.ok(mapping)
      assert.equal(mapping.paletteEntryId, 'duoLedYellow')
      assert.equal('hex' in mapping, false)

      const boundRow = propertyRows(host).find(
        (row) => row.getAttribute('data-mapping-row') === 'fill',
      )
      assert.ok(boundRow)
      assert.equal(boundRow.classList.contains('is-unbound'), false)
      assert.equal(
        boundRow.querySelector('[data-mapping-palette-id]')?.textContent,
        'duoLedYellow',
      )
      assert.ok(boundRow.querySelector('[data-mapping-swatch]'))
    } finally {
      restore()
    }
  })

  it('unbind: Clear on bound row → paletteEntryId null + Unbound marker', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, host } = mountSidebarWithStore(
        sidebar,
        model,
        fixtureProject({
          skins: [
            {
              id: 'black-duo',
              displayName: 'Black/Duo',
              mappings: [
                {
                  objectTypeId: 'headerLed',
                  stateId: 'on',
                  propertyId: 'fill',
                  paletteEntryId: 'duoLedYellow',
                },
              ],
            },
          ],
        }),
        defaultSession({
          selectedObjectTypeId: 'headerLed',
          selectedStateId: 'on',
        }),
      )

      const fillRow = propertyRows(host).find(
        (row) => row.getAttribute('data-mapping-row') === 'fill',
      )
      assert.ok(fillRow)
      assert.equal(fillRow.classList.contains('is-unbound'), false)

      const clearBtn = fillRow.querySelector('[data-mapping-clear]')
      assert.ok(clearBtn)
      clearBtn.click()

      const mapping = findMappingInSkin(store, {
        objectTypeId: 'headerLed',
        stateId: 'on',
        propertyId: 'fill',
      })
      assert.ok(mapping)
      assert.equal(mapping.paletteEntryId, null)

      const unboundRow = propertyRows(host).find(
        (row) => row.getAttribute('data-mapping-row') === 'fill',
      )
      assert.ok(unboundRow?.classList.contains('is-unbound'))
      assert.equal(
        unboundRow.querySelector('[data-mapping-unbound-label]')?.textContent,
        'Unbound',
      )
    } finally {
      restore()
    }
  })

  it('unbound display: missing mapping and dangling id show warning + Unbound', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { host } = mountSidebarWithStore(
        sidebar,
        model,
        fixtureProject({
          skins: [
            {
              id: 'black-duo',
              displayName: 'Black/Duo',
              mappings: [
                {
                  objectTypeId: 'headerLed',
                  stateId: 'off',
                  propertyId: 'ring',
                  paletteEntryId: 'missingId',
                },
              ],
            },
          ],
        }),
        defaultSession({
          selectedObjectTypeId: 'headerLed',
          selectedStateId: 'off',
        }),
      )

      const rows = propertyRows(host)
      const fillRow = rows.find(
        (row) => row.getAttribute('data-mapping-row') === 'fill',
      )
      const ringRow = rows.find(
        (row) => row.getAttribute('data-mapping-row') === 'ring',
      )
      assert.ok(fillRow?.classList.contains('is-unbound'))
      assert.ok(fillRow?.querySelector('[data-mapping-unbound-marker]'))
      assert.ok(ringRow?.classList.contains('is-unbound'))
      assert.equal(
        ringRow?.querySelector('[data-mapping-unbound-label]')?.textContent,
        'Unbound',
      )
    } finally {
      restore()
    }
  })

  it('state switch: Property rows refresh; session selectedStateId updates', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, host } = mountSidebarWithStore(
        sidebar,
        model,
        fixtureProject({
          skins: [
            {
              id: 'black-duo',
              displayName: 'Black/Duo',
              mappings: [
                {
                  objectTypeId: 'headerLed',
                  stateId: 'on',
                  propertyId: 'fill',
                  paletteEntryId: 'duoLedYellow',
                },
              ],
            },
          ],
        }),
        defaultSession({
          selectedObjectTypeId: 'headerLed',
          selectedStateId: 'off',
        }),
      )

      let fillRow = propertyRows(host).find(
        (row) => row.getAttribute('data-mapping-row') === 'fill',
      )
      assert.ok(fillRow?.classList.contains('is-unbound'))

      selectState(host, 'on')
      assert.equal(store.getState().session.selectedStateId, 'on')

      fillRow = propertyRows(host).find(
        (row) => row.getAttribute('data-mapping-row') === 'fill',
      )
      assert.ok(fillRow)
      assert.equal(fillRow.classList.contains('is-unbound'), false)
      assert.equal(
        fillRow.querySelector('[data-mapping-palette-id]')?.textContent,
        'duoLedYellow',
      )
    } finally {
      restore()
    }
  })

  it('no free hex: upsertMapping rejects hex-shaped ids; UI binds Palette ids only', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const before = [
      {
        objectTypeId: 'headerLed',
        stateId: 'off',
        propertyId: 'fill',
        paletteEntryId: 'duoLedYellow',
      },
    ]
    const rejected = model.upsertMapping(before, {
      objectTypeId: 'headerLed',
      stateId: 'off',
      propertyId: 'fill',
      paletteEntryId: '#FFCC00',
    })
    assert.equal(rejected, before)
    assert.equal(before[0].paletteEntryId, 'duoLedYellow')

    const bare = model.upsertMapping(before, {
      objectTypeId: 'headerLed',
      stateId: 'off',
      propertyId: 'fill',
      paletteEntryId: 'AABBCC',
    })
    assert.equal(bare, before)

    const restore = installMinimalDocument()
    try {
      const sidebar = await importCompiledTs('src/sidebar/index.ts')
      const { store, host } = mountSidebarWithStore(
        sidebar,
        model,
        fixtureProject(),
        defaultSession({
          selectedObjectTypeId: 'headerLed',
          selectedStateId: 'off',
        }),
      )

      const fillRow = propertyRows(host).find(
        (row) => row.getAttribute('data-mapping-row') === 'fill',
      )
      assert.ok(fillRow)
      assert.equal(fillRow.querySelector('[data-mapping-hex]'), null)
      fillRow.click()

      // Palette click path only offers real entry ids — never hex fields on Mapping rows.
      const paletteRow = host.querySelector('[data-palette-row="duoLedYellow"]')
      assert.ok(paletteRow)
      paletteRow.click()
      const mapping = findMappingInSkin(store, {
        objectTypeId: 'headerLed',
        stateId: 'off',
        propertyId: 'fill',
      })
      assert.equal(mapping?.paletteEntryId, 'duoLedYellow')
      assert.equal(typeof mapping?.paletteEntryId, 'string')
      assert.equal(mapping?.paletteEntryId?.startsWith('#'), false)
    } finally {
      restore()
    }
  })

  it('uniqueness: two upserts for the same triple leave one Mapping entry', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    let mappings = []
    mappings = model.upsertMapping(mappings, {
      objectTypeId: 'headerLed',
      stateId: 'off',
      propertyId: 'fill',
      paletteEntryId: 'duoLedYellow',
    })
    mappings = model.upsertMapping(mappings, {
      objectTypeId: 'headerLed',
      stateId: 'off',
      propertyId: 'fill',
      paletteEntryId: 'patchZoneBlue',
    })
    assert.equal(mappings.length, 1)
    assert.equal(mappings[0].paletteEntryId, 'patchZoneBlue')
  })

  it('type-level only: Mappings UI has no per-instance override path', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { host } = mountSidebarWithStore(
        sidebar,
        model,
        fixtureProject(),
        defaultSession({
          selectedObjectTypeId: 'headerLed',
          selectedStateId: 'off',
        }),
      )
      assert.equal(host.querySelector('[data-mapping-instance]'), null)
      assert.equal(host.querySelector('[data-per-instance]'), null)
      // Skin tab reminder still documents type-level rule.
      const skinTab = host.querySelector('[data-skin-seg-tab="skin"]')
      skinTab.click()
      assert.match(
        host.querySelector('[data-skin-reminder]')?.textContent ?? '',
        /Type-level only/,
      )
    } finally {
      restore()
    }
  })

  it('Palette click with no focused Mapping row leaves mappings unchanged', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, host } = mountSidebarWithStore(
        sidebar,
        model,
        fixtureProject(),
        defaultSession({
          selectedObjectTypeId: 'headerLed',
          selectedStateId: 'off',
        }),
      )

      assert.deepEqual(skinMappings(store), [])
      const paletteRow = host.querySelector('[data-palette-row="duoLedYellow"]')
      assert.ok(paletteRow)
      paletteRow.click()
      assert.deepEqual(skinMappings(store), [])
    } finally {
      restore()
    }
  })

  it('State switch clears focus; Palette click must not bind previous State', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, host } = mountSidebarWithStore(
        sidebar,
        model,
        fixtureProject(),
        defaultSession({
          selectedObjectTypeId: 'headerLed',
          selectedStateId: 'off',
        }),
      )

      const fillRow = propertyRows(host).find(
        (row) => row.getAttribute('data-mapping-row') === 'fill',
      )
      assert.ok(fillRow)
      fillRow.click()
      assert.ok(
        propertyRows(host)
          .find((row) => row.getAttribute('data-mapping-row') === 'fill')
          ?.classList.contains('is-focused'),
      )

      selectState(host, 'on')
      assert.equal(store.getState().session.selectedStateId, 'on')
      assert.equal(
        propertyRows(host).some((row) => row.classList.contains('is-focused')),
        false,
      )

      host.querySelector('[data-palette-row="duoLedYellow"]').click()
      assert.equal(
        findMappingInSkin(store, {
          objectTypeId: 'headerLed',
          stateId: 'off',
          propertyId: 'fill',
        }),
        undefined,
      )
      assert.equal(
        findMappingInSkin(store, {
          objectTypeId: 'headerLed',
          stateId: 'on',
          propertyId: 'fill',
        }),
        undefined,
      )
      assert.deepEqual(skinMappings(store), [])
    } finally {
      restore()
    }
  })

  it('Object type knobLarge shows only led_on property row', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { host } = mountSidebarWithStore(
        sidebar,
        model,
        fixtureProject(),
        defaultSession(),
      )

      selectObjectType(host, 'knobLarge')
      const rows = propertyRows(host)
      assert.equal(rows.length, 1)
      assert.equal(rows[0].getAttribute('data-mapping-row'), 'led_on')
    } finally {
      restore()
    }
  })

  it('sticky State: shared state id kept when switching Object type', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, host } = mountSidebarWithStore(
        sidebar,
        model,
        fixtureProject(),
        defaultSession({
          selectedObjectTypeId: 'headerLed',
          selectedStateId: 'off',
        }),
      )

      selectObjectType(host, 'knobLarge')
      assert.equal(store.getState().session.selectedObjectTypeId, 'knobLarge')
      assert.equal(store.getState().session.selectedStateId, 'off')
      assert.equal(
        host.querySelector('[data-mappings-state]')?.value,
        'off',
      )
      assert.equal(propertyRows(host).length, 1)
      assert.equal(
        propertyRows(host)[0].getAttribute('data-mapping-row'),
        'led_on',
      )
    } finally {
      restore()
    }
  })

  it('Object type change: State not on destination falls back to first state', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, host } = mountSidebarWithStore(
        sidebar,
        model,
        fixtureProject(),
        defaultSession({
          selectedObjectTypeId: 'headerLed',
          selectedStateId: 'on',
        }),
      )

      selectObjectType(host, 'knobLarge')
      assert.equal(store.getState().session.selectedObjectTypeId, 'knobLarge')
      // `on` is not in knobLarge.states → first state `normal`.
      assert.equal(store.getState().session.selectedStateId, 'normal')
      assert.equal(
        host.querySelector('[data-mappings-state]')?.value,
        'normal',
      )
      const rows = propertyRows(host)
      assert.equal(rows.length, 1)
      assert.equal(rows[0].getAttribute('data-mapping-row'), 'led_on')
    } finally {
      restore()
    }
  })

  it('UI rebind: focused bound row → different Palette id replaces mapping', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, host } = mountSidebarWithStore(
        sidebar,
        model,
        fixtureProject({
          skins: [
            {
              id: 'black-duo',
              displayName: 'Black/Duo',
              mappings: [
                {
                  objectTypeId: 'headerLed',
                  stateId: 'off',
                  propertyId: 'fill',
                  paletteEntryId: 'duoLedYellow',
                },
              ],
            },
            {
              id: 'cream-duo',
              displayName: 'Cream/Duo',
              mappings: [],
            },
          ],
        }),
        defaultSession({
          selectedObjectTypeId: 'headerLed',
          selectedStateId: 'off',
        }),
      )

      const fillRow = propertyRows(host).find(
        (row) => row.getAttribute('data-mapping-row') === 'fill',
      )
      assert.ok(fillRow)
      assert.equal(fillRow.classList.contains('is-unbound'), false)
      fillRow.click()

      const paletteRow = host.querySelector('[data-palette-row="patchZoneBlue"]')
      assert.ok(paletteRow)
      paletteRow.click()

      const mappings = skinMappings(store)
      assert.equal(mappings.length, 1)
      assert.equal(mappings[0].paletteEntryId, 'patchZoneBlue')
      assert.equal(mappings[0].propertyId, 'fill')

      const rebound = propertyRows(host).find(
        (row) => row.getAttribute('data-mapping-row') === 'fill',
      )
      assert.equal(
        rebound?.querySelector('[data-mapping-palette-id]')?.textContent,
        'patchZoneBlue',
      )
    } finally {
      restore()
    }
  })

  it('Object type change clears focus; Palette must not bind prior type', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, host } = mountSidebarWithStore(
        sidebar,
        model,
        fixtureProject(),
        defaultSession({
          selectedObjectTypeId: 'headerLed',
          selectedStateId: 'off',
        }),
      )

      const fillRow = propertyRows(host).find(
        (row) => row.getAttribute('data-mapping-row') === 'fill',
      )
      assert.ok(fillRow)
      fillRow.click()
      assert.ok(
        propertyRows(host)
          .find((row) => row.getAttribute('data-mapping-row') === 'fill')
          ?.classList.contains('is-focused'),
      )

      selectObjectType(host, 'knobLarge')
      assert.equal(store.getState().session.selectedObjectTypeId, 'knobLarge')
      assert.equal(
        propertyRows(host).some((row) => row.classList.contains('is-focused')),
        false,
      )

      host.querySelector('[data-palette-row="duoLedYellow"]').click()
      assert.equal(
        findMappingInSkin(store, {
          objectTypeId: 'headerLed',
          stateId: 'off',
          propertyId: 'fill',
        }),
        undefined,
      )
      assert.equal(
        findMappingInSkin(store, {
          objectTypeId: 'knobLarge',
          stateId: 'off',
          propertyId: 'led_on',
        }),
        undefined,
      )
      assert.deepEqual(skinMappings(store), [])
    } finally {
      restore()
    }
  })

  it('Skin segment clears Mapping focus; Palette cannot bind while Skin tab shown', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, host } = mountSidebarWithStore(
        sidebar,
        model,
        fixtureProject(),
        defaultSession({
          selectedObjectTypeId: 'headerLed',
          selectedStateId: 'off',
        }),
      )

      const fillRow = propertyRows(host).find(
        (row) => row.getAttribute('data-mapping-row') === 'fill',
      )
      assert.ok(fillRow)
      fillRow.click()
      assert.ok(
        propertyRows(host)
          .find((row) => row.getAttribute('data-mapping-row') === 'fill')
          ?.classList.contains('is-focused'),
      )

      host.querySelector('[data-skin-seg-tab="skin"]').click()
      assert.equal(
        host.querySelector('[data-mappings-tab]')?.hidden,
        true,
      )

      host.querySelector('[data-palette-row="duoLedYellow"]').click()
      assert.deepEqual(skinMappings(store), [])
    } finally {
      restore()
    }
  })

  it('Skin switch clears Mapping focus; Palette cannot bind onto new Skin without re-focus', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, host } = mountSidebarWithStore(
        sidebar,
        model,
        fixtureProject(),
        defaultSession({
          selectedObjectTypeId: 'headerLed',
          selectedStateId: 'off',
        }),
      )

      const fillRow = propertyRows(host).find(
        (row) => row.getAttribute('data-mapping-row') === 'fill',
      )
      assert.ok(fillRow)
      fillRow.click()
      assert.ok(
        propertyRows(host)
          .find((row) => row.getAttribute('data-mapping-row') === 'fill')
          ?.classList.contains('is-focused'),
      )

      const { session } = store.getState()
      store.apply({
        session: { ...session, activeSkinId: 'cream-duo' },
      })
      assert.equal(store.getState().session.activeSkinId, 'cream-duo')
      assert.equal(
        propertyRows(host).some((row) => row.classList.contains('is-focused')),
        false,
      )

      host.querySelector('[data-palette-row="duoLedYellow"]').click()
      assert.deepEqual(skinMappings(store, 'cream-duo'), [])
      assert.deepEqual(skinMappings(store, 'black-duo'), [])
    } finally {
      restore()
    }
  })
})
