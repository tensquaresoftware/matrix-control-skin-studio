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
  const dir = mkdtempSync(join(tmpdir(), 'skin-studio-palette-picker-'))
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
  const node = {
    tagName: String(tagName).toUpperCase(),
    type: '',
    min: '',
    max: '',
    step: '',
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
    setAttribute(name, value) {
      attrs.set(name, String(value))
      if (name === 'value') valueProp = String(value)
      if (name === 'type') node.type = String(value)
    },
    getAttribute(name) {
      return attrs.has(name) ? attrs.get(name) : null
    },
    hasAttribute(name) {
      return attrs.has(name)
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

function mountWithProject(sidebar, storeMod, project) {
  const store = storeMod.createStore({ project })
  const host = createRoot()
  sidebar.mountSidebar(host, { storage: memoryStorage(), store })
  return { store, host }
}

function paletteHex(store, id) {
  const entry = store.getState().project.palette.find((e) => e.id === id)
  assert.ok(entry, `expected palette entry ${id}`)
  return entry.hex
}

describe('palette picker I/O matrix', () => {
  it('registers palette-picker-matrix in npm test', () => {
    assert.match(pkg.scripts?.test ?? '', /palette-picker-matrix\.test\.mjs/)
  })

  it('zone-1 tabs: Color default; Palette click + ArrowRight switch panels', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model, seed] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
        importCompiledTs('src/seed/index.ts'),
      ])
      const { host } = mountWithProject(
        sidebar,
        model,
        seed.createSeedProject(),
      )

      const colorTab = host.querySelector('[data-sidebar-tab="color"]')
      const paletteTab = host.querySelector('[data-sidebar-tab="palette"]')
      const colorPanel = host.querySelector('[data-sidebar-tab-panel="color"]')
      const palettePanel = host.querySelector('[data-sidebar-tab-panel="palette"]')
      assert.ok(colorTab && paletteTab && colorPanel && palettePanel)
      assert.ok(colorTab.classList.contains('is-on'))
      assert.equal(paletteTab.classList.contains('is-on'), false)
      assert.equal(colorPanel.hidden, false)
      assert.equal(palettePanel.hidden, true)
      assert.ok(colorPanel.querySelector('[data-picker-sv]'))
      assert.ok(colorPanel.querySelector('[data-picker-hex]'))

      paletteTab.click()
      assert.equal(colorTab.classList.contains('is-on'), false)
      assert.ok(paletteTab.classList.contains('is-on'))
      assert.equal(colorPanel.hidden, true)
      assert.equal(palettePanel.hidden, false)
      assert.ok(palettePanel.querySelector('[data-palette-row="yellow"]'))

      paletteTab.dispatchEvent({
        type: 'keydown',
        key: 'ArrowLeft',
        preventDefault() {},
      })
      assert.ok(colorTab.classList.contains('is-on'))
      assert.equal(paletteTab.classList.contains('is-on'), false)
      assert.equal(colorPanel.hidden, false)
      assert.equal(palettePanel.hidden, true)
    } finally {
      restore()
    }
  })

  it('select + recolour: seed yellow live write-through to #112233', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model, seed] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
        importCompiledTs('src/seed/index.ts'),
      ])
      const { store, host } = mountWithProject(
        sidebar,
        model,
        seed.createSeedProject(),
      )

      const row = host.querySelector('[data-palette-row="yellow"]')
      assert.ok(row, 'expected yellow row')
      assert.equal(row.querySelector('[data-palette-label]')?.textContent, 'kYellow')
      assert.equal(row.querySelector('[data-palette-hex]')?.textContent, '#FFCC00')
      row.click()
      const selected = host.querySelector('[data-palette-row="yellow"]')
      assert.ok(selected?.classList.contains('is-selected'))

      const hexField = host.querySelector('[data-picker-hex]')
      assert.ok(hexField)
      assert.equal(hexField.value, 'FFCC00')

      hexField.focus()
      hexField.value = '#112233'
      hexField.dispatchEvent({ type: 'input' })

      assert.equal(paletteHex(store, 'yellow'), '#112233')
      const entry = store.getState().project.palette.find((e) => e.id === 'yellow')
      assert.equal(entry.id, 'yellow')
      assert.equal(entry.constantName, 'kYellow')
      const updatedRow = host.querySelector('[data-palette-row="yellow"]')
      assert.equal(updatedRow?.querySelector('[data-palette-hex]')?.textContent, '#112233')
      assert.equal(host.querySelector('[data-picker-hex]')?.value, '112233')
    } finally {
      restore()
    }
  })

  it('select + recolour: mapped entry keeps Mapping.paletteEntryId (no hex on mappings)', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const project = {
        formatVersion: 1,
        palette: [{ id: 'shared', hex: '#FFCC00', constantName: 'led_duo' }],
        skins: [
          {
            id: 'black-duo',
            displayName: 'Black/Duo',
            mappings: [
              {
                objectTypeId: 'headerLed',
                stateId: 'on',
                propertyId: 'fill',
                paletteEntryId: 'shared',
              },
            ],
          },
        ],
        inventory: { objectTypes: [] },
      }
      const { store, host } = mountWithProject(sidebar, model, project)
      host.querySelector('[data-palette-row="shared"]').click()
      const hexField = host.querySelector('[data-picker-hex]')
      hexField.focus()
      hexField.value = '#112233'
      hexField.dispatchEvent({ type: 'input' })

      assert.equal(paletteHex(store, 'shared'), '#112233')
      const mapping = store.getState().project.skins[0].mappings[0]
      assert.equal(mapping.paletteEntryId, 'shared')
      assert.equal('hex' in mapping, false)
    } finally {
      restore()
    }
  })

  it('row label: constantName when present, else id', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { host } = mountWithProject(sidebar, model, {
        formatVersion: 1,
        palette: [
          { id: 'namedEntry', hex: '#111111', constantName: 'kNamed' },
          { id: 'idOnlyEntry', hex: '#222222' },
        ],
        skins: [],
        inventory: { objectTypes: [] },
      })
      assert.equal(
        host.querySelector('[data-palette-row="namedEntry"]')?.querySelector(
          '[data-palette-label]',
        )?.textContent,
        'kNamed',
      )
      assert.equal(
        host.querySelector('[data-palette-row="idOnlyEntry"]')?.querySelector(
          '[data-palette-label]',
        )?.textContent,
        'idOnlyEntry',
      )
    } finally {
      restore()
    }
  })

  it('idle picker: no selection → hue/hex/RGB/SV do not commit', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model, seed] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
        importCompiledTs('src/seed/index.ts'),
      ])
      const { store, host } = mountWithProject(
        sidebar,
        model,
        seed.createSeedProject(),
      )
      assert.equal(paletteHex(store, 'yellow'), '#FFCC00')
      assert.equal(host.querySelector('.is-selected'), null)

      const hue = host.querySelector('[data-picker-hue]')
      const hexField = host.querySelector('[data-picker-hex]')
      const sv = host.querySelector('[data-picker-sv]')
      const rField = host.querySelector('[data-picker-r]')
      assert.ok(hue && hexField && sv && rField)

      hue.value = '120'
      hue.dispatchEvent({ type: 'input' })
      assert.equal(paletteHex(store, 'yellow'), '#FFCC00')
      assert.equal(hue.value, '0')
      assert.equal(hexField.value, '000000')

      hexField.value = 'ABCDEF'
      hexField.dispatchEvent({ type: 'input' })
      assert.equal(paletteHex(store, 'yellow'), '#FFCC00')
      assert.equal(hue.value, '0')
      assert.equal(hexField.value, '000000')

      rField.value = '10'
      rField.dispatchEvent({ type: 'input' })
      assert.equal(paletteHex(store, 'yellow'), '#FFCC00')
      assert.equal(rField.value, '0')

      sv.dispatchEvent({
        type: 'pointerdown',
        button: 0,
        clientX: 10,
        clientY: 10,
        pointerId: 1,
        preventDefault() {},
      })
      assert.equal(paletteHex(store, 'yellow'), '#FFCC00')
    } finally {
      restore()
    }
  })

  it('RGB fields: selected entry live write-through + hex sync', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model, seed] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
        importCompiledTs('src/seed/index.ts'),
      ])
      const { store, host } = mountWithProject(
        sidebar,
        model,
        seed.createSeedProject(),
      )
      host.querySelector('[data-palette-row="yellow"]').click()

      const hexField = host.querySelector('[data-picker-hex]')
      const rField = host.querySelector('[data-picker-r]')
      const gField = host.querySelector('[data-picker-g]')
      const bField = host.querySelector('[data-picker-b]')
      assert.ok(hexField && rField && gField && bField)
      assert.equal(hexField.value, 'FFCC00')
      assert.equal(rField.value, '255')
      assert.equal(gField.value, '204')
      assert.equal(bField.value, '0')

      rField.value = '17'
      gField.value = '34'
      bField.value = '51'
      rField.dispatchEvent({ type: 'input' })
      assert.equal(paletteHex(store, 'yellow'), '#112233')
      assert.equal(hexField.value, '112233')
    } finally {
      restore()
    }
  })

  it('SV square pointer: selected entry commits (headless centre fallback)', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model, seed] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
        importCompiledTs('src/seed/index.ts'),
      ])
      const { store, host } = mountWithProject(
        sidebar,
        model,
        seed.createSeedProject(),
      )
      host.querySelector('[data-palette-row="yellow"]').click()
      const before = paletteHex(store, 'yellow')
      const sv = host.querySelector('[data-picker-sv]')
      assert.ok(sv)
      sv.dispatchEvent({
        type: 'pointerdown',
        button: 0,
        clientX: 0,
        clientY: 0,
        pointerId: 1,
        preventDefault() {},
      })
      sv.dispatchEvent({
        type: 'pointerup',
        button: 0,
        pointerId: 1,
        preventDefault() {},
      })
      const after = paletteHex(store, 'yellow')
      assert.notEqual(after, before)
      assert.match(after, /^#[0-9A-F]{6}$/)
    } finally {
      restore()
    }
  })

  it('reselect: edits target only the newly selected entry', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model, seed] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
        importCompiledTs('src/seed/index.ts'),
      ])
      const project = seed.createSeedProject()
      project.palette = [
        ...project.palette,
        { id: 'accentGreen', hex: '#00AA55', constantName: 'kAccentGreen' },
      ]
      const { store, host } = mountWithProject(sidebar, model, project)

      host.querySelector('[data-palette-row="yellow"]').click()
      host.querySelector('[data-palette-row="accentGreen"]').click()

      const hexField = host.querySelector('[data-picker-hex]')
      assert.equal(hexField.value, '00AA55')
      hexField.value = '#112233'
      hexField.dispatchEvent({ type: 'input' })

      assert.equal(paletteHex(store, 'yellow'), '#FFCC00')
      assert.equal(paletteHex(store, 'accentGreen'), '#112233')
    } finally {
      restore()
    }
  })

  it('invalid hex: reject write and restore last valid on blur', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model, seed] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
        importCompiledTs('src/seed/index.ts'),
      ])
      const { store, host } = mountWithProject(
        sidebar,
        model,
        seed.createSeedProject(),
      )
      host.querySelector('[data-palette-row="yellow"]').click()
      const hexField = host.querySelector('[data-picker-hex]')

      for (const bad of ['#GG', '', '#FFCC00AA', '#11223']) {
        hexField.focus()
        hexField.value = bad
        hexField.dispatchEvent({ type: 'input' })
        assert.equal(
          paletteHex(store, 'yellow'),
          '#FFCC00',
          `store must stay unchanged for ${JSON.stringify(bad)}`,
        )
        hexField.blur()
        assert.equal(hexField.value, 'FFCC00')
      }

      // Case-insensitive valid write normalizes uppercase.
      hexField.focus()
      hexField.value = '#aabbcc'
      hexField.dispatchEvent({ type: 'input' })
      assert.equal(paletteHex(store, 'yellow'), '#AABBCC')
    } finally {
      restore()
    }
  })

  it('multi-entry isolation: only selected second entry hex changes', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const project = {
        formatVersion: 1,
        palette: [
          { id: 'a', hex: '#111111', constantName: 'kA' },
          { id: 'b', hex: '#222222', constantName: 'kB' },
        ],
        skins: [],
        inventory: { objectTypes: [] },
      }
      const { store, host } = mountWithProject(sidebar, model, project)
      host.querySelector('[data-palette-row="b"]').click()

      const hexField = host.querySelector('[data-picker-hex]')
      assert.ok(hexField)
      hexField.value = '#333333'
      hexField.dispatchEvent({ type: 'input' })

      assert.equal(paletteHex(store, 'a'), '#111111')
      assert.equal(paletteHex(store, 'b'), '#333333')
    } finally {
      restore()
    }
  })

  it('Mapping pane body has no free-hex text/color input', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model, seed] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
        importCompiledTs('src/seed/index.ts'),
      ])
      const { host } = mountWithProject(sidebar, model, seed.createSeedProject())
      const mappingsBody = host.querySelector('[data-sidebar-pane-body="mappings"]')
      assert.ok(mappingsBody)

      // Mapping bind UI must not accept free #RRGGBB typed into a mapping slot.
      const freeHexInputs = []
      const walk = (el) => {
        if (el.getAttribute?.('data-skin-name') != null) return
        if (el.tagName === 'INPUT') {
          const type = (el.type || el.getAttribute('type') || 'text').toLowerCase()
          if (type === 'text' || type === 'color' || type === '') {
            freeHexInputs.push(el)
          }
        }
        if (el.tagName === 'TEXTAREA') freeHexInputs.push(el)
        for (const child of el.children) walk(child)
      }
      walk(mappingsBody)
      assert.equal(freeHexInputs.length, 0)
      // Skin rename lives on the Skin tab, not under Mappings.
      assert.equal(mappingsBody.querySelector('[data-skin-name]'), null)
      assert.ok(host.querySelector('[data-skin-name]'))

      // SessionUiState remains Object / State / Skin only (no palette selection).
      const session = model.createEmptySession()
      assert.deepEqual(Object.keys(session).sort(), [
        'activeSkinId',
        'selectedObjectTypeId',
        'selectedStateId',
      ])
    } finally {
      restore()
    }
  })

  it('hue strip live write-through updates selected entry hex', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model, seed] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
        importCompiledTs('src/seed/index.ts'),
      ])
      const { store, host } = mountWithProject(
        sidebar,
        model,
        seed.createSeedProject(),
      )
      host.querySelector('[data-palette-row="yellow"]').click()

      const hexField = host.querySelector('[data-picker-hex]')
      // Golden opaque hex for HSV (200, 50, 60) — typed via Lot B hex digits field.
      hexField.value = '4C7F99'
      hexField.dispatchEvent({ type: 'input' })
      assert.equal(paletteHex(store, 'yellow'), '#4C7F99')
      assert.equal(hexField.value, '4C7F99')

      const hue = host.querySelector('[data-picker-hue]')
      assert.ok(hue)
      hue.value = '90'
      hue.dispatchEvent({ type: 'input' })
      assert.notEqual(paletteHex(store, 'yellow'), '#4C7F99')
    } finally {
      restore()
    }
  })

  it('hex blur flushes coalesce so a later edit is a separate undo step', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model, seed, history] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
        importCompiledTs('src/seed/index.ts'),
        importCompiledTs('src/history/index.ts'),
      ])
      const { store, host } = mountWithProject(
        sidebar,
        model,
        seed.createSeedProject(),
      )
      host.querySelector('[data-palette-row="yellow"]').click()
      const hexField = host.querySelector('[data-picker-hex]')
      assert.ok(hexField)

      hexField.focus()
      hexField.value = '#112233'
      hexField.dispatchEvent({ type: 'input' })
      hexField.blur()
      assert.equal(paletteHex(store, 'yellow'), '#112233')

      hexField.focus()
      hexField.value = '#445566'
      hexField.dispatchEvent({ type: 'input' })
      hexField.blur()
      assert.equal(paletteHex(store, 'yellow'), '#445566')

      history.undo(store)
      assert.equal(paletteHex(store, 'yellow'), '#112233')
      history.undo(store)
      assert.equal(paletteHex(store, 'yellow'), '#FFCC00')
      assert.equal(history.canUndo(store), false)
    } finally {
      restore()
    }
  })

  it('rapid hex/hue + pointerup coalesce into one undo step', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model, seed, history] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
        importCompiledTs('src/seed/index.ts'),
        importCompiledTs('src/history/index.ts'),
      ])
      const { store, host } = mountWithProject(
        sidebar,
        model,
        seed.createSeedProject(),
      )
      host.querySelector('[data-palette-row="yellow"]').click()
      assert.equal(paletteHex(store, 'yellow'), '#FFCC00')

      const hexField = host.querySelector('[data-picker-hex]')
      const hue = host.querySelector('[data-picker-hue]')
      assert.ok(hexField && hue)

      hexField.value = '#112233'
      hexField.dispatchEvent({ type: 'input' })
      hexField.value = '#445566'
      hexField.dispatchEvent({ type: 'input' })
      hue.value = '90'
      hue.dispatchEvent({ type: 'input' })
      hue.dispatchEvent({ type: 'pointerup' })

      assert.equal(history.canUndo(store), true)
      const afterBurst = paletteHex(store, 'yellow')
      history.undo(store)
      assert.equal(paletteHex(store, 'yellow'), '#FFCC00')
      history.redo(store)
      assert.equal(paletteHex(store, 'yellow'), afterBurst)
      assert.equal(history.canUndo(store), true)
      // One coalesced step only — second undo does not change hex further.
      history.undo(store)
      assert.equal(paletteHex(store, 'yellow'), '#FFCC00')
      assert.equal(history.canUndo(store), false)
    } finally {
      restore()
    }
  })

  it('create: + Add appends Colour {n} #808080, unique id, and selects it', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model, seed] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
        importCompiledTs('src/seed/index.ts'),
      ])
      const { store, host } = mountWithProject(
        sidebar,
        model,
        seed.createSeedProject(),
      )
      const beforeIds = new Set(store.getState().project.palette.map((e) => e.id))
      const addBtn = host.querySelector('[data-palette-add]')
      assert.ok(addBtn)
      assert.equal(addBtn.textContent, '+ Add')
      addBtn.click()

      const palette = store.getState().project.palette
      assert.equal(palette.length, beforeIds.size + 1)
      const created = palette[palette.length - 1]
      assert.ok(created.id)
      assert.equal(beforeIds.has(created.id), false)
      assert.equal(created.hex, '#808080')
      assert.equal(created.constantName, 'Colour 1')

      const row = host.querySelector(`[data-palette-row="${created.id}"]`)
      assert.ok(row?.classList.contains('is-selected'))
      const hexField = host.querySelector('[data-picker-hex]')
      assert.equal(hexField.value, '808080')

      // Sequential create fills Colour 2 next.
      addBtn.click()
      const second = store.getState().project.palette.at(-1)
      assert.equal(second.constantName, 'Colour 2')
      assert.equal(second.hex, '#808080')
      assert.notEqual(second.id, created.id)
    } finally {
      restore()
    }
  })

  it('create: Colour {n} gap-fill uses smallest unused positive integer', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, host } = mountWithProject(sidebar, model, {
        formatVersion: 1,
        palette: [
          { id: 'c1', hex: '#111111', constantName: 'Colour 1' },
          { id: 'c3', hex: '#333333', constantName: 'Colour 3' },
        ],
        skins: [],
        inventory: { objectTypes: [] },
      })
      host.querySelector('[data-palette-add]').click()
      const created = store.getState().project.palette.at(-1)
      assert.equal(created.constantName, 'Colour 2')
      assert.equal(created.hex, '#808080')
    } finally {
      restore()
    }
  })

  it('rename: double-click label updates constantName; id and hex stay stable', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, host } = mountWithProject(sidebar, model, {
        formatVersion: 1,
        palette: [{ id: 'accentId', hex: '#AABBCC', constantName: 'OldName' }],
        skins: [],
        inventory: { objectTypes: [] },
      })
      const label = host
        .querySelector('[data-palette-row="accentId"]')
        ?.querySelector('[data-palette-label]')
      assert.ok(label)
      label.dispatchEvent({ type: 'dblclick' })
      await Promise.resolve()

      const input = host.querySelector('[data-palette-rename]')
      assert.ok(input)
      input.value = 'Accent'
      input.dispatchEvent({ type: 'keydown', key: 'Enter' })

      const entry = store.getState().project.palette.find((e) => e.id === 'accentId')
      assert.ok(entry)
      assert.equal(entry.id, 'accentId')
      assert.equal(entry.hex, '#AABBCC')
      assert.equal(entry.constantName, 'Accent')
      assert.equal(
        host
          .querySelector('[data-palette-row="accentId"]')
          ?.querySelector('[data-palette-label]')?.textContent,
        'Accent',
      )
    } finally {
      restore()
    }
  })

  it('rename: empty/whitespace rejected; prior label restored', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, host } = mountWithProject(sidebar, model, {
        formatVersion: 1,
        palette: [{ id: 'keepId', hex: '#111111', constantName: 'KeepMe' }],
        skins: [],
        inventory: { objectTypes: [] },
      })
      const label = host
        .querySelector('[data-palette-row="keepId"]')
        ?.querySelector('[data-palette-label]')
      label.dispatchEvent({ type: 'dblclick' })
      await Promise.resolve()
      const input = host.querySelector('[data-palette-rename]')
      input.value = '   '
      input.dispatchEvent({ type: 'blur' })

      const entry = store.getState().project.palette.find((e) => e.id === 'keepId')
      assert.equal(entry.constantName, 'KeepMe')
      assert.equal(
        host
          .querySelector('[data-palette-row="keepId"]')
          ?.querySelector('[data-palette-label]')?.textContent,
        'KeepMe',
      )
    } finally {
      restore()
    }
  })

  it('rename: unchanged commit when constantName missing does not write', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, host } = mountWithProject(sidebar, model, {
        formatVersion: 1,
        palette: [{ id: 'rawOnly', hex: '#ABCDEF' }],
        skins: [],
        inventory: { objectTypes: [] },
      })
      const label = host
        .querySelector('[data-palette-row="rawOnly"]')
        ?.querySelector('[data-palette-label]')
      label.dispatchEvent({ type: 'dblclick' })
      await Promise.resolve()
      const input = host.querySelector('[data-palette-rename]')
      assert.ok(input)
      assert.equal(input.value, 'rawOnly')
      input.dispatchEvent({ type: 'blur' })
      const entry = store.getState().project.palette.find((e) => e.id === 'rawOnly')
      assert.equal(entry.constantName, undefined)
      assert.equal(entry.hex, '#ABCDEF')
    } finally {
      restore()
    }
  })

  it('rename: creates constantName when missing', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, host } = mountWithProject(sidebar, model, {
        formatVersion: 1,
        palette: [{ id: 'rawOnly', hex: '#ABCDEF' }],
        skins: [],
        inventory: { objectTypes: [] },
      })
      const label = host
        .querySelector('[data-palette-row="rawOnly"]')
        ?.querySelector('[data-palette-label]')
      label.dispatchEvent({ type: 'dblclick' })
      await Promise.resolve()
      const input = host.querySelector('[data-palette-rename]')
      assert.ok(input)
      input.value = 'Accent'
      input.dispatchEvent({ type: 'blur' })

      const entry = store.getState().project.palette.find((e) => e.id === 'rawOnly')
      assert.equal(entry.id, 'rawOnly')
      assert.equal(entry.hex, '#ABCDEF')
      assert.equal(entry.constantName, 'Accent')
    } finally {
      restore()
    }
  })

  it('rename: survives mid-edit store rebuild', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, host } = mountWithProject(sidebar, model, {
        formatVersion: 1,
        palette: [
          { id: 'editMe', hex: '#111111', constantName: 'Before' },
          { id: 'other', hex: '#222222', constantName: 'Other' },
        ],
        skins: [],
        inventory: { objectTypes: [] },
      })
      const label = host
        .querySelector('[data-palette-row="editMe"]')
        ?.querySelector('[data-palette-label]')
      label.dispatchEvent({ type: 'dblclick' })
      await Promise.resolve()
      const input = host.querySelector('[data-palette-rename]')
      assert.ok(input)
      input.value = 'After'

      const project = store.getState().project
      store.apply({
        project: {
          ...project,
          palette: project.palette.map((e) =>
            e.id === 'other' ? { ...e, hex: '#333333' } : e,
          ),
        },
      })
      assert.ok(host.querySelector('[data-palette-rename]'))
      input.dispatchEvent({ type: 'keydown', key: 'Enter' })

      const entry = store.getState().project.palette.find((e) => e.id === 'editMe')
      assert.equal(entry.constantName, 'After')
    } finally {
      restore()
    }
  })

  it('keyboard: Enter and Space on focused row select the entry', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { host } = mountWithProject(sidebar, model, {
        formatVersion: 1,
        palette: [
          { id: 'a', hex: '#111111', constantName: 'A' },
          { id: 'b', hex: '#222222', constantName: 'B' },
        ],
        skins: [],
        inventory: { objectTypes: [] },
      })
      const rowB = host.querySelector('[data-palette-row="b"]')
      assert.ok(rowB)
      rowB.dispatchEvent({ type: 'keydown', key: 'Enter' })
      assert.ok(
        host.querySelector('[data-palette-row="b"]')?.classList.contains(
          'is-selected',
        ),
      )

      const rowA = host.querySelector('[data-palette-row="a"]')
      rowA.dispatchEvent({ type: 'keydown', key: ' ' })
      assert.ok(
        host.querySelector('[data-palette-row="a"]')?.classList.contains(
          'is-selected',
        ),
      )
    } finally {
      restore()
    }
  })

  it('keyboard: Space while renaming inserts and does not steal selection', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, host } = mountWithProject(sidebar, model, {
        formatVersion: 1,
        palette: [
          { id: 'a', hex: '#111111', constantName: 'Soft' },
          { id: 'b', hex: '#222222', constantName: 'B' },
        ],
        skins: [],
        inventory: { objectTypes: [] },
      })
      host.querySelector('[data-palette-row="a"]').click()
      const label = host
        .querySelector('[data-palette-row="a"]')
        ?.querySelector('[data-palette-label]')
      label.dispatchEvent({ type: 'dblclick' })
      await Promise.resolve()
      const input = host.querySelector('[data-palette-rename]')
      assert.ok(input)
      input.value = 'Soft'
      input.dispatchEvent({ type: 'keydown', key: ' ' })
      // Harness does not insert characters; assert row handler did not re-select away.
      assert.ok(
        host.querySelector('[data-palette-row="a"]')?.classList.contains(
          'is-selected',
        ),
      )
      input.value = 'Soft Red'
      input.dispatchEvent({ type: 'keydown', key: 'Enter' })
      const entry = store.getState().project.palette.find((e) => e.id === 'a')
      assert.equal(entry.constantName, 'Soft Red')
    } finally {
      restore()
    }
  })

  it('orphan clear rebuilds list even if rename was open', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, host } = mountWithProject(sidebar, model, {
        formatVersion: 1,
        palette: [
          { id: 'keep', hex: '#111111', constantName: 'Keep' },
          { id: 'gone', hex: '#222222', constantName: 'Gone' },
        ],
        skins: [],
        inventory: { objectTypes: [] },
      })
      host.querySelector('[data-palette-row="gone"]').click()
      const label = host
        .querySelector('[data-palette-row="gone"]')
        ?.querySelector('[data-palette-label]')
      label.dispatchEvent({ type: 'dblclick' })
      await Promise.resolve()
      assert.ok(host.querySelector('[data-palette-rename]'))

      const project = store.getState().project
      store.apply({
        project: {
          ...project,
          palette: project.palette.filter((e) => e.id !== 'gone'),
        },
      })
      assert.equal(host.querySelector('[data-palette-row="gone"]'), null)
      assert.equal(host.querySelector('[data-palette-rename]'), null)
    } finally {
      restore()
    }
  })

  it('delete unreferenced: removes entry, clears selection, no modal', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, host } = mountWithProject(sidebar, model, {
        formatVersion: 1,
        palette: [
          { id: 'keep', hex: '#111111', constantName: 'Keep' },
          { id: 'gone', hex: '#222222', constantName: 'Gone' },
        ],
        skins: [],
        inventory: { objectTypes: [] },
      })
      host.querySelector('[data-palette-row="gone"]').click()
      assert.ok(
        host.querySelector('[data-palette-row="gone"]')?.classList.contains(
          'is-selected',
        ),
      )
      host.querySelector('[data-palette-delete]').click()

      assert.equal(host.querySelector('[data-palette-delete-confirm]'), null)
      assert.equal(
        store.getState().project.palette.some((e) => e.id === 'gone'),
        false,
      )
      assert.equal(host.querySelector('[data-palette-row="gone"]'), null)
      assert.equal(host.querySelector('.is-selected'), null)
      assert.equal(host.querySelector('[data-palette-delete]').disabled, true)
    } finally {
      restore()
    }
  })

  it('delete referenced cancel: modal lists n; Cancel leaves palette + mappings', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const project = {
        formatVersion: 1,
        palette: [{ id: 'shared', hex: '#FFCC00', constantName: 'led_duo' }],
        skins: [
          {
            id: 'black-green',
            displayName: 'Black/Green',
            mappings: [
              {
                objectTypeId: 'knobLarge',
                stateId: 'normal',
                propertyId: 'led_on',
                paletteEntryId: 'shared',
              },
              {
                objectTypeId: 'led',
                stateId: 'on',
                propertyId: 'fill',
                paletteEntryId: 'shared',
              },
            ],
          },
        ],
        inventory: { objectTypes: [] },
      }
      const { store, host } = mountWithProject(sidebar, model, project)
      host.querySelector('[data-palette-row="shared"]').click()
      host.querySelector('[data-palette-delete]').click()

      const modal = host.querySelector('[data-palette-delete-confirm]')
      assert.ok(modal)
      assert.equal(
        modal.querySelector('[data-palette-delete-title]')?.textContent,
        'Delete colour “led_duo”?',
      )
      assert.equal(
        modal.querySelector('[data-palette-delete-body]')?.textContent,
        '2 mapping(s) will become Unbound:',
      )
      const refList = modal.querySelector('[data-palette-delete-refs]')
      assert.ok(refList)
      assert.equal(refList.children.length, 2)
      assert.equal(
        refList.children[0].textContent,
        'Black/Green · knobLarge · led_on',
      )
      assert.equal(refList.children[1].textContent, 'Black/Green · led · fill')
      assert.equal(
        modal.querySelector('[data-palette-delete-cancel]')?.textContent,
        'Cancel',
      )
      assert.equal(
        modal.querySelector('[data-palette-delete-apply]')?.textContent,
        'Delete and unbind',
      )

      modal.querySelector('[data-palette-delete-cancel]').click()
      assert.equal(host.querySelector('[data-palette-delete-confirm]'), null)
      assert.ok(store.getState().project.palette.some((e) => e.id === 'shared'))
      const mappings = store.getState().project.skins[0].mappings
      assert.equal(mappings[0].paletteEntryId, 'shared')
      assert.equal(mappings[1].paletteEntryId, 'shared')
    } finally {
      restore()
    }
  })

  it('delete referenced: list includes stateId when needed to disambiguate', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const project = {
        formatVersion: 1,
        palette: [{ id: 'shared', hex: '#FFCC00', constantName: 'led_duo' }],
        skins: [
          {
            id: 'black-green',
            displayName: 'Black/Green',
            mappings: [
              {
                objectTypeId: 'knobLarge',
                stateId: 'normal',
                propertyId: 'fill',
                paletteEntryId: 'shared',
              },
              {
                objectTypeId: 'knobLarge',
                stateId: 'hover',
                propertyId: 'fill',
                paletteEntryId: 'shared',
              },
            ],
          },
        ],
        inventory: { objectTypes: [] },
      }
      const { host } = mountWithProject(sidebar, model, project)
      host.querySelector('[data-palette-row="shared"]').click()
      host.querySelector('[data-palette-delete]').click()

      const refList = host.querySelector('[data-palette-delete-refs]')
      assert.ok(refList)
      assert.equal(refList.children.length, 2)
      assert.equal(
        refList.children[0].textContent,
        'Black/Green · knobLarge · normal · fill',
      )
      assert.equal(
        refList.children[1].textContent,
        'Black/Green · knobLarge · hover · fill',
      )
      assert.equal(
        host.querySelector('[data-palette-delete-cancel]')?.textContent,
        'Cancel',
      )
      assert.equal(
        host.querySelector('[data-palette-delete-apply]')?.textContent,
        'Delete and unbind',
      )
    } finally {
      restore()
    }
  })

  it('delete referenced title uses id when constantName is missing', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const project = {
        formatVersion: 1,
        palette: [{ id: 'rawIdOnly', hex: '#112233' }],
        skins: [
          {
            id: 'black-green',
            displayName: 'Black/Green',
            mappings: [
              {
                objectTypeId: 'led',
                stateId: 'on',
                propertyId: 'fill',
                paletteEntryId: 'rawIdOnly',
              },
            ],
          },
        ],
        inventory: { objectTypes: [] },
      }
      const { host } = mountWithProject(sidebar, model, project)
      host.querySelector('[data-palette-row="rawIdOnly"]').click()
      host.querySelector('[data-palette-delete]').click()

      assert.equal(
        host.querySelector('[data-palette-delete-title]')?.textContent,
        'Delete colour “rawIdOnly”?',
      )
    } finally {
      restore()
    }
  })

  it('delete referenced confirm: removes entry, nulls paletteEntryId, no hex on mappings', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const project = {
        formatVersion: 1,
        palette: [
          { id: 'shared', hex: '#FFCC00', constantName: 'led_duo' },
          { id: 'other', hex: '#00AA55', constantName: 'accent' },
        ],
        skins: [
          {
            id: 'black-green',
            displayName: 'Black/Green',
            mappings: [
              {
                objectTypeId: 'knobLarge',
                stateId: 'normal',
                propertyId: 'led_on',
                paletteEntryId: 'shared',
              },
              {
                objectTypeId: 'knobLarge',
                stateId: 'normal',
                propertyId: 'ring',
                paletteEntryId: 'other',
              },
            ],
          },
          {
            id: 'cream-duo',
            displayName: 'Cream/Duo',
            mappings: [
              {
                objectTypeId: 'led',
                stateId: 'on',
                propertyId: 'fill',
                paletteEntryId: 'shared',
              },
            ],
          },
        ],
        inventory: { objectTypes: [] },
      }
      const { store, host } = mountWithProject(sidebar, model, project)
      host.querySelector('[data-palette-row="shared"]').click()
      host.querySelector('[data-palette-delete]').click()

      const modal = host.querySelector('[data-palette-delete-confirm]')
      assert.ok(modal)
      modal.querySelector('[data-palette-delete-apply]').click()

      assert.equal(host.querySelector('[data-palette-delete-confirm]'), null)
      assert.equal(
        store.getState().project.palette.some((e) => e.id === 'shared'),
        false,
      )
      assert.ok(store.getState().project.palette.some((e) => e.id === 'other'))
      const blackGreen = store.getState().project.skins[0].mappings
      assert.equal(blackGreen[0].paletteEntryId, null)
      assert.equal(blackGreen[1].paletteEntryId, 'other')
      assert.equal('hex' in blackGreen[0], false)
      assert.equal('hex' in blackGreen[1], false)
      assert.equal(store.getState().project.skins[1].mappings[0].paletteEntryId, null)
      assert.equal(host.querySelector('.is-selected'), null)
    } finally {
      restore()
    }
  })

  it('delete disabled: no selection → Delete… disabled / no-op', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model, seed] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
        importCompiledTs('src/seed/index.ts'),
      ])
      const { store, host } = mountWithProject(
        sidebar,
        model,
        seed.createSeedProject(),
      )
      const deleteBtn = host.querySelector('[data-palette-delete]')
      assert.ok(deleteBtn)
      assert.equal(deleteBtn.disabled, true)
      assert.equal(host.querySelector('.is-selected'), null)
      const before = store.getState().project.palette.length
      deleteBtn.click()
      assert.equal(store.getState().project.palette.length, before)
      assert.equal(host.querySelector('[data-palette-delete-confirm]'), null)
    } finally {
      restore()
    }
  })

  it('orphan selection: after delete, selection clears and picker stays idle', async () => {
    const restore = installMinimalDocument()
    try {
      const [sidebar, model] = await Promise.all([
        importCompiledTs('src/sidebar/index.ts'),
        importCompiledTs('src/model/index.ts'),
      ])
      const { store, host } = mountWithProject(sidebar, model, {
        formatVersion: 1,
        palette: [
          { id: 'a', hex: '#111111', constantName: 'A' },
          { id: 'orphan', hex: '#222222', constantName: 'Orphan' },
        ],
        skins: [],
        inventory: { objectTypes: [] },
      })
      host.querySelector('[data-palette-row="orphan"]').click()
      const hexField = host.querySelector('[data-picker-hex]')
      assert.equal(hexField.value, '222222')

      host.querySelector('[data-palette-delete]').click()

      assert.equal(host.querySelector('.is-selected'), null)
      assert.equal(hexField.value, '000000')
      hexField.value = '#ABCDEF'
      hexField.dispatchEvent({ type: 'input' })
      assert.equal(paletteHex(store, 'a'), '#111111')
      assert.equal(
        store.getState().project.palette.some((e) => e.id === 'orphan'),
        false,
      )
    } finally {
      restore()
    }
  })
})
