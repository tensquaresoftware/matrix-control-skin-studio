import assert from 'node:assert/strict'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import { execFileSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tscJs = join(root, 'node_modules/typescript/lib/tsc.js')
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
  const dir = mkdtempSync(join(tmpdir(), 'skin-studio-canvas-mock-'))
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

function zoneFill(root, zoneId) {
  const el = root.querySelector(`[data-orch-zone="${zoneId}"]`)
  assert.ok(el, `expected zone ${zoneId}`)
  return el.style.backgroundColor
}

describe('canvas mock I/O matrix (story 4.1)', () => {
  it('composition: Header / Body Patch|Master / Footer — placeholder label gone', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const canvas = await importCompiledTs('src/canvas/index.ts')
    const restore = installMinimalDocument()
    try {
      const host = createElement('div')
      host.classList.add('chrome-canvas-slot')
      const store = model.createStore({ project: seed.createSeedProject() })
      canvas.mountCanvas(host, { storage: memoryStorage(), store })

      assert.ok(host.querySelector('[data-canvas-surface]'))
      assert.ok(host.querySelector('[data-canvas-mock]'))
      assert.ok(host.querySelector('[data-mock-header]'))
      assert.ok(host.querySelector('[data-mock-body]'))
      assert.ok(host.querySelector('[data-mock-footer]'))
      assert.ok(host.querySelector('[data-mock-col="patch"]'))
      assert.ok(host.querySelector('[data-mock-col="master"]'))
      assert.equal(
        host.querySelector('[data-mock-title]')?.textContent,
        'Matrix-Control',
      )
      assert.equal(host.querySelector('.canvas-placeholder-label'), null)
      const texts = []
      const walkText = (el) => {
        if (el.textContent === 'GUI view') texts.push(el.textContent)
        for (const child of el.children) walkText(child)
      }
      walkText(host)
      assert.equal(texts.length, 0, 'placeholder-only GUI view label must be gone')
    } finally {
      restore()
    }
  })

  it('zone metadata: Orchestrator bands reference Palette ids; not inventory ObjectTypes', async () => {
    const seed = await importCompiledTs('src/seed/index.ts')
    const canvas = await importCompiledTs('src/canvas/index.ts')
    const project = seed.createSeedProject()

    assert.equal(project.inventory.objectTypes.length, 3)
    for (const zone of canvas.ORCHESTRATOR_ZONES) {
      assert.equal(
        project.inventory.objectTypes.some((ot) => ot.id === zone.id),
        false,
        `zone ${zone.id} must not be an inventory ObjectType`,
      )
      assert.ok(
        project.palette.some((e) => e.id === zone.paletteEntryId),
        `zone ${zone.id} palette id ${zone.paletteEntryId} must exist in seed`,
      )
      const bridgeId = canvas.resolveZoneSelectableObjectTypeId(
        zone.role,
        project.inventory,
      )
      assert.ok(bridgeId, `zone role ${zone.role} should bridge to a seed ObjectType`)
      assert.ok(
        project.inventory.objectTypes.some((ot) => ot.id === bridgeId),
      )
    }
    assert.equal(
      canvas.resolveZoneSelectableObjectTypeId('patch', {
        source: 'fixture',
        objectTypes: [{ id: 'patchBand', states: [], properties: ['fill'] }],
      }),
      null,
      'ObjectType with empty states must not be selectable',
    )
    assert.ok(canvas.isOrchestratorZoneId('zone-patch'))
    assert.equal(canvas.isOrchestratorZoneId('yellow'), false)
  })

  it('seed Palette: colour-only yellow / blue / orange; provisional inventory ObjectTypes', async () => {
    const seed = await importCompiledTs('src/seed/index.ts')
    const doc = seed.createSeedProject()
    const byId = Object.fromEntries(doc.palette.map((e) => [e.id, e]))

    assert.equal(doc.palette.length, 3)
    assert.equal(byId.yellow.hex, '#FFCC00')
    assert.equal(byId.blue.hex, '#3D7EFF')
    assert.equal(byId.blue.constantName, 'kBlue')
    assert.equal(byId.orange.hex, '#FF8A1F')
    assert.equal(byId.orange.constantName, 'kOrange')
    assert.deepEqual(
      doc.inventory.objectTypes.map((ot) => ot.id),
      ['headerLed', 'patchBand', 'masterBand'],
    )
    assert.equal(doc.inventory.source, 'seed-placeholder')
  })

  it('Palette band paint + recolour via resolvePaletteHex on any Skin (ALWAYS_ON)', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const canvas = await importCompiledTs('src/canvas/index.ts')
    const { resolvePaletteHex } = await importCompiledTs('src/model/palette-helpers.ts')
    const restore = installMinimalDocument()
    try {
      const host = createElement('div')
      const project = seed.createSeedProject()
      const store = model.createStore({
        project,
        session: {
          selectedObjectTypeId: null,
          selectedStateId: null,
          activeSkinId: 'cream-green',
        },
      })
      canvas.mountCanvas(host, { storage: memoryStorage(), store })

      assert.equal(zoneFill(host, 'zone-patch'), '#3D7EFF')
      assert.equal(zoneFill(host, 'zone-master'), '#FF8A1F')
      assert.equal(zoneFill(host, 'zone-header-duo-led'), '#FFCC00')
      assert.equal(
        zoneFill(host, 'zone-patch'),
        resolvePaletteHex(store.getState().project, 'blue'),
      )

      const next = store.getState().project
      next.palette = next.palette.map((e) =>
        e.id === 'blue' ? { ...e, hex: '#112233' } : e,
      )
      store.apply({ project: next })

      assert.equal(zoneFill(host, 'zone-patch'), '#112233')
      assert.equal(zoneFill(host, 'zone-master'), '#FF8A1F')
      // Skin name is irrelevant — bands stay painted (ALWAYS_ON)
      assert.equal(store.getState().session.activeSkinId, 'cream-green')
    } finally {
      restore()
    }
  })

  it('empty inventory → zero Object-type hit regions; seed / fixture inventory → only those ids', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const canvas = await importCompiledTs('src/canvas/index.ts')
    const restore = installMinimalDocument()
    try {
      const host = createElement('div')
      const emptyProject = seed.createSeedProject()
      emptyProject.inventory = { source: 'seed-placeholder', objectTypes: [] }
      const store = model.createStore({ project: emptyProject })
      canvas.mountCanvas(host, { storage: memoryStorage(), store })

      assert.deepEqual(canvas.listObjectTypeHitRegions(store.getState().project.inventory), [])
      assert.equal(host.querySelectorAll('[data-object-type-id]').length, 0)
      assert.equal(host.querySelector('[data-zone-object-type-id]'), null)

      const withSeed = seed.createSeedProject()
      store.apply({ project: withSeed })

      const seedHits = host.querySelectorAll('[data-object-type-id]')
      assert.equal(seedHits.length, 3)
      assert.ok(host.querySelector('[data-zone-object-type-id="patchBand"]'))
      const patchZone = host.querySelector('[data-orch-zone="zone-patch"]')
      assert.ok(patchZone)
      assert.equal(patchZone.classList.contains('is-selectable'), true)

      const withTypes = store.getState().project
      withTypes.inventory = {
        source: 'fixture',
        objectTypes: [
          { id: 'knobLarge', states: ['normal'], properties: ['face'] },
          { id: 'bypassBtn', states: ['normal'], properties: ['fill'] },
        ],
      }
      store.apply({ project: withTypes })

      const hits = host.querySelectorAll('[data-object-type-id]')
      assert.equal(hits.length, 2)
      assert.equal(hits[0].getAttribute('data-object-type-id'), 'knobLarge')
      assert.equal(hits[1].getAttribute('data-object-type-id'), 'bypassBtn')
      // Bands remain layout metadata, not ObjectTypes; no seed bridge without seed ids
      assert.equal(host.querySelector('[data-object-type-id="zone-patch"]'), null)
      assert.ok(host.querySelector('[data-orch-zone="zone-patch"]'))
      assert.equal(host.querySelector('[data-zone-object-type-id]'), null)
    } finally {
      restore()
    }
  })

  it('pan/Zoom prefs still apply transform on surface with mock present', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const canvas = await importCompiledTs('src/canvas/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const restore = installMinimalDocument()
    try {
      const storage = persist.createMemoryStorage()
      storage.setItem(
        persist.PREFS_KEY,
        JSON.stringify({
          zoomStep: '150%',
          panXY: { x: 24, y: -8 },
          sidebarPaneHeights: { palette: 140, mappings: 160, unbound: 120 },
        }),
      )
      const host = createElement('div')
      const store = model.createStore({ project: seed.createSeedProject() })
      canvas.mountCanvas(host, { storage, store })

      const surface = host.querySelector('[data-canvas-surface]')
      assert.ok(surface)
      assert.ok(host.querySelector('[data-canvas-mock]'))
      assert.equal(
        surface.style.transform,
        'translate(24px, -8px) scale(1.5)',
      )
    } finally {
      restore()
    }
  })

  it('CSS keeps selection tokens and mock composition styles', () => {
    assert.match(baseCss, /--comp-canvas-selection-outline/)
    assert.match(baseCss, /\.canvas-mock\s*\{/)
    assert.match(baseCss, /\.mock-header\s*\{/)
    assert.match(baseCss, /\.mock-orch\s*\{/)
    assert.match(baseCss, /\.mock-footer\s*\{/)
  })

  it('unresolvable Palette id → unbound stub, no throw', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const canvas = await importCompiledTs('src/canvas/index.ts')
    const restore = installMinimalDocument()
    try {
      const host = createElement('div')
      const store = model.createStore({
        project: {
          formatVersion: 1,
          palette: [],
          skins: [{ id: 'monochrome', displayName: 'Monochrome', mappings: [] }],
          inventory: { objectTypes: [], source: 'seed-placeholder' },
        },
      })
      assert.doesNotThrow(() => {
        canvas.mountCanvas(host, { storage: memoryStorage(), store })
      })
      const patch = host.querySelector('[data-orch-zone="zone-patch"]')
      assert.ok(patch)
      assert.equal(patch.getAttribute('data-zone-unbound'), '')
      assert.equal(patch.style.backgroundColor, '')
    } finally {
      restore()
    }
  })
})
