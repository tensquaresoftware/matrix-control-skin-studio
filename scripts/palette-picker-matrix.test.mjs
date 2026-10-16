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
      for (const fn of listeners.get(event.type) || []) fn(event)
    },
    click() {
      for (const fn of listeners.get('click') || []) fn()
    },
    focus() {
      node._focused = true
      node.dispatchEvent({ type: 'focus' })
    },
    blur() {
      node._focused = false
      node.dispatchEvent({ type: 'blur' })
    },
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

  it('select + recolour: seed duoLedYellow live write-through to #112233', async () => {
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

      const row = host.querySelector('[data-palette-row="duoLedYellow"]')
      assert.ok(row, 'expected duoLedYellow row')
      assert.equal(row.querySelector('[data-palette-label]')?.textContent, 'kDuoLedYellow')
      assert.equal(row.querySelector('[data-palette-hex]')?.textContent, '#FFCC00')
      row.click()
      const selected = host.querySelector('[data-palette-row="duoLedYellow"]')
      assert.ok(selected?.classList.contains('is-selected'))

      const hexField = host.querySelector('[data-picker-hex]')
      assert.ok(hexField)
      assert.equal(hexField.value, '#FFCC00')

      hexField.focus()
      hexField.value = '#112233'
      hexField.dispatchEvent({ type: 'input' })

      assert.equal(paletteHex(store, 'duoLedYellow'), '#112233')
      const entry = store.getState().project.palette.find((e) => e.id === 'duoLedYellow')
      assert.equal(entry.id, 'duoLedYellow')
      assert.equal(entry.constantName, 'kDuoLedYellow')
      const updatedRow = host.querySelector('[data-palette-row="duoLedYellow"]')
      assert.equal(updatedRow?.querySelector('[data-palette-hex]')?.textContent, '#112233')
      assert.equal(host.querySelector('[data-picker-swatch]')?.style.background, '#112233')
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

  it('idle picker: no selection → slider/hex do not commit', async () => {
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
      assert.equal(paletteHex(store, 'duoLedYellow'), '#FFCC00')
      assert.equal(host.querySelector('.is-selected'), null)

      const hue = host.querySelector('[data-picker-hue]')
      const hexField = host.querySelector('[data-picker-hex]')
      assert.ok(hue && hexField)

      hue.value = '120'
      hue.dispatchEvent({ type: 'input' })
      hexField.value = '#ABCDEF'
      hexField.dispatchEvent({ type: 'input' })

      assert.equal(paletteHex(store, 'duoLedYellow'), '#FFCC00')
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

      host.querySelector('[data-palette-row="duoLedYellow"]').click()
      host.querySelector('[data-palette-row="accentGreen"]').click()

      const hexField = host.querySelector('[data-picker-hex]')
      assert.equal(hexField.value, '#00AA55')
      hexField.value = '#112233'
      hexField.dispatchEvent({ type: 'input' })

      assert.equal(paletteHex(store, 'duoLedYellow'), '#FFCC00')
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
      host.querySelector('[data-palette-row="duoLedYellow"]').click()
      const hexField = host.querySelector('[data-picker-hex]')

      for (const bad of ['#GG', '', '#FFCC00AA', '#11223']) {
        hexField.focus()
        hexField.value = bad
        hexField.dispatchEvent({ type: 'input' })
        assert.equal(
          paletteHex(store, 'duoLedYellow'),
          '#FFCC00',
          `store must stay unchanged for ${JSON.stringify(bad)}`,
        )
        hexField.blur()
        assert.equal(hexField.value, '#FFCC00')
      }

      // Case-insensitive valid write normalizes uppercase.
      hexField.focus()
      hexField.value = '#aabbcc'
      hexField.dispatchEvent({ type: 'input' })
      assert.equal(paletteHex(store, 'duoLedYellow'), '#AABBCC')
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

      const sat = host.querySelector('[data-picker-sat]')
      assert.ok(sat)
      // Force a distinct hex via the hex field for deterministic assert.
      const hexField = host.querySelector('[data-picker-hex]')
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

      const freeHexInputs = []
      const walk = (el) => {
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

  it('slider live write-through updates selected entry hex', async () => {
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
      host.querySelector('[data-palette-row="duoLedYellow"]').click()

      const hue = host.querySelector('[data-picker-hue]')
      const sat = host.querySelector('[data-picker-sat]')
      const val = host.querySelector('[data-picker-val]')
      hue.value = '200'
      sat.value = '50'
      val.value = '60'
      hue.dispatchEvent({ type: 'input' })

      // Golden opaque hex for HSV (200, 50, 60) — not derived from hsvToHex under test.
      assert.equal(paletteHex(store, 'duoLedYellow'), '#4C7F99')
    } finally {
      restore()
    }
  })
})
