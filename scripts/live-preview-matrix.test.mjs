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
  const dir = mkdtempSync(join(tmpdir(), 'skin-studio-live-preview-'))
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
  const node = {
    tagName: String(tagName).toUpperCase(),
    type: '',
    textContent: '',
    disabled: false,
    style: {
      cssText: '',
      height: '',
      width: '',
      transform: '',
      transformOrigin: '',
      backgroundColor: '',
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
    focus() {
      node._focused = true
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

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial))
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

function defaultSession(overrides = {}) {
  return {
    selectedObjectTypeId: null,
    selectedStateId: null,
    activeSkinId: 'black-duo',
    ...overrides,
  }
}

describe('live preview I/O matrix (story 4.4 — spike dormancy)', () => {
  it('registers live-preview-matrix in npm test', () => {
    assert.match(pkg.scripts?.test ?? '', /live-preview-matrix\.test\.mjs/)
  })

  it('CSS: pulse chrome tokens remain; mock pulse / hit styles gone', () => {
    assert.match(baseCss, /--comp-pulse-highlight-outline/)
    assert.match(baseCss, /--comp-pulse-highlight-duration:\s*400ms/)
    assert.match(baseCss, /--comp-pulse-highlight-repeats:\s*2/)
    assert.doesNotMatch(baseCss, /@keyframes\s+mock-hit-pulse-outline/)
    assert.doesNotMatch(baseCss, /\.mock-object-type-hit/)
    assert.doesNotMatch(baseCss, /\.mock-orch/)
  })

  it('canvas board mounts; zero hits / zones → no Mapping face paint / no pulse targets', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const canvas = await importCompiledTs('src/canvas/index.ts')
    const restore = installMinimalDocument()
    try {
      const host = createElement('div')
      const store = model.createStore({
        project: seed.createSeedProject(),
        session: defaultSession({ activeSkinId: 'cream-green' }),
      })
      canvas.mountCanvas(host, { storage: memoryStorage(), store })

      assert.ok(host.querySelector('[data-exemplar-board]'))
      assert.equal(host.querySelectorAll('[data-object-type-id]').length, 0)
      assert.equal(host.querySelector('[data-orch-zone]'), null)
      assert.equal(host.querySelector('[data-zone-object-type-id]'), null)
      assert.equal(host.querySelector('.is-pulsing'), null)
      assert.equal(baseCss.includes('intensity'), false)
      assert.equal(/dim[-_]?led|led[-_]?dim|led[-_]?intensity/i.test(baseCss), false)
    } finally {
      restore()
    }
  })

  it('Mapping / Palette edits do not invent canvas hit paint during dormancy', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const canvas = await importCompiledTs('src/canvas/index.ts')
    const restore = installMinimalDocument()
    try {
      const host = createElement('div')
      const project = seed.createSeedProject()
      const store = model.createStore({
        project,
        session: defaultSession({ activeSkinId: project.skins[0]?.id ?? null }),
      })
      canvas.mountCanvas(host, { storage: memoryStorage(), store })

      const next = store.getState().project
      next.palette = next.palette.map((e) =>
        e.id === 'yellow' ? { ...e, hex: '#112233' } : e,
      )
      store.apply({ project: next })

      assert.equal(host.querySelectorAll('[data-object-type-id]').length, 0)
      assert.equal(host.querySelector('[data-orch-zone]'), null)
      assert.ok(host.querySelector('[data-exemplar-board]'))
    } finally {
      restore()
    }
  })
})
