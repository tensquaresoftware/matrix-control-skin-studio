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

/** Fixture inventory — tests only; seed stays empty (KEEP_EMPTY). */
function fixtureInventory() {
  return {
    source: 'test-fixture',
    objectTypes: [
      {
        id: 'knobLarge',
        states: ['normal', 'pressed'],
        properties: ['face', 'ring'],
      },
      {
        id: 'bypassBtn',
        states: ['normal'],
        properties: ['fill'],
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
      { id: 'faceRed', hex: '#CC2244', constantName: 'kFaceRed' },
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

function hitFill(root, objectTypeId) {
  const el = root.querySelector(`[data-object-type-id="${objectTypeId}"]`)
  assert.ok(el, `expected hit ${objectTypeId}`)
  return el.style.backgroundColor
}

function zoneFill(root, zoneId) {
  const el = root.querySelector(`[data-orch-zone="${zoneId}"]`)
  assert.ok(el, `expected zone ${zoneId}`)
  return el.style.backgroundColor
}

function withMappedFace(project, paletteEntryId = 'faceRed') {
  const skins = project.skins.map((skin) =>
    skin.id === 'black-duo'
      ? {
          ...skin,
          mappings: [
            {
              objectTypeId: 'knobLarge',
              stateId: 'normal',
              propertyId: 'face',
              paletteEntryId,
            },
          ],
        }
      : skin,
  )
  return { ...project, skins }
}

describe('live preview I/O matrix (story 4.4)', () => {
  it('registers live-preview-matrix in npm test', () => {
    assert.match(pkg.scripts?.test ?? '', /live-preview-matrix\.test\.mjs/)
  })

  it('CSS: pulse-outline keyframes + .is-pulsing from chrome pulse tokens', () => {
    assert.match(baseCss, /@keyframes\s+mock-hit-pulse-outline/)
    assert.match(baseCss, /\.mock-object-type-hit\.is-pulsing/)
    assert.match(baseCss, /--comp-pulse-highlight-outline/)
    assert.match(baseCss, /--comp-pulse-highlight-duration:\s*400ms/)
    assert.match(baseCss, /--comp-pulse-highlight-repeats:\s*2/)
    assert.match(baseCss, /animation-duration:\s*var\(--comp-pulse-highlight-duration\)/)
    assert.match(
      baseCss,
      /animation-iteration-count:\s*var\(--comp-pulse-highlight-repeats\)/,
    )
  })

  it('ZONE_PLUS_RULE: Duo full hex; greens stay stubs; no intensity/dim UI', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const canvas = await importCompiledTs('src/canvas/index.ts')
    const restore = installMinimalDocument()
    try {
      const host = createElement('div')
      const store = model.createStore({
        project: seed.createSeedProject(),
        session: defaultSession({ activeSkinId: 'black-duo' }),
      })
      canvas.mountCanvas(host, { storage: memoryStorage(), store })

      assert.equal(zoneFill(host, 'zone-header-duo-led'), '#FFCC00')
      const greens = host.querySelectorAll('[data-mock-led="green"]')
      assert.equal(greens.length, 2)
      for (const green of greens) {
        assert.equal(green.classList.contains('mock-led-green'), true)
        assert.equal(green.style.backgroundColor, '')
      }
      assert.equal(baseCss.includes('intensity'), false)
      assert.equal(/dim[-_]?led|led[-_]?dim|led[-_]?intensity/i.test(baseCss), false)
      assert.equal(
        host.querySelector('[data-led-intensity],[data-intensity],[name="intensity"]'),
        null,
      )
    } finally {
      restore()
    }
  })

  it('empty inventory: zones still live-paint; zero hits → no Mapping faces / no pulse', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const canvas = await importCompiledTs('src/canvas/index.ts')
    const restore = installMinimalDocument()
    try {
      const host = createElement('div')
      const store = model.createStore({
        project: seed.createSeedProject(),
        session: defaultSession({ activeSkinId: 'black-duo' }),
      })
      canvas.mountCanvas(host, { storage: memoryStorage(), store })

      assert.deepEqual(store.getState().project.inventory.objectTypes, [])
      assert.equal(host.querySelectorAll('[data-object-type-id]').length, 0)
      assert.equal(zoneFill(host, 'zone-patch'), '#3D7EFF')

      const next = store.getState().project
      next.skins = next.skins.map((skin) =>
        skin.id === 'black-duo'
          ? {
              ...skin,
              mappings: [
                {
                  objectTypeId: 'ghostType',
                  stateId: 'normal',
                  propertyId: 'face',
                  paletteEntryId: 'duoLedYellow',
                },
              ],
            }
          : skin,
      )
      assert.doesNotThrow(() => store.apply({ project: next }))
      assert.equal(host.querySelectorAll('.is-pulsing').length, 0)
      assert.equal(zoneFill(host, 'zone-patch'), '#3D7EFF')
    } finally {
      restore()
    }
  })

  it('Mapping bind → first-Property hit fill paints hex same turn', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const { upsertMapping } = await importCompiledTs('src/model/palette-helpers.ts')
    const canvas = await importCompiledTs('src/canvas/index.ts')
    const restore = installMinimalDocument()
    try {
      const host = createElement('div')
      const store = model.createStore({
        project: fixtureProject(),
        session: defaultSession(),
      })
      canvas.mountCanvas(host, { storage: memoryStorage(), store })

      assert.equal(hitFill(host, 'knobLarge'), '')
      assert.ok(host.querySelector('[data-object-type-id="knobLarge"]')?.hasAttribute('data-hit-unbound'))

      const project = store.getState().project
      const skinIndex = project.skins.findIndex((s) => s.id === 'black-duo')
      const skin = project.skins[skinIndex]
      const mappings = upsertMapping(skin.mappings, {
        objectTypeId: 'knobLarge',
        stateId: 'normal',
        propertyId: 'face',
        paletteEntryId: 'faceRed',
      })
      project.skins = project.skins.map((s, i) =>
        i === skinIndex ? { ...s, mappings } : s,
      )
      store.apply({ project })

      assert.equal(hitFill(host, 'knobLarge'), '#CC2244')
      assert.equal(
        host
          .querySelector('[data-object-type-id="knobLarge"]')
          ?.hasAttribute('data-hit-unbound'),
        false,
      )
      // Second property does not drive fill when first is unbound for that state alone —
      // face is first Property; ring is ignored for HIT_FILL_FIRST_PROPERTY.
      assert.equal(hitFill(host, 'bypassBtn'), '')
    } finally {
      restore()
    }
  })

  it('Palette hex → mapped face updates same turn; no pulse', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const canvas = await importCompiledTs('src/canvas/index.ts')
    const restore = installMinimalDocument()
    try {
      const host = createElement('div')
      const store = model.createStore({
        project: withMappedFace(fixtureProject()),
        session: defaultSession({
          selectedObjectTypeId: 'knobLarge',
          selectedStateId: 'normal',
        }),
      })
      canvas.mountCanvas(host, { storage: memoryStorage(), store })

      assert.equal(hitFill(host, 'knobLarge'), '#CC2244')
      assert.equal(
        host
          .querySelector('[data-object-type-id="knobLarge"]')
          ?.classList.contains('is-pulsing'),
        false,
      )

      const project = store.getState().project
      project.palette = project.palette.map((entry) =>
        entry.id === 'faceRed' ? { ...entry, hex: '#00AABB' } : entry,
      )
      store.apply({ project })

      assert.equal(hitFill(host, 'knobLarge'), '#00AABB')
      assert.equal(
        host
          .querySelector('[data-object-type-id="knobLarge"]')
          ?.classList.contains('is-pulsing'),
        false,
      )
      assert.equal(host.querySelectorAll('.is-pulsing').length, 0)
    } finally {
      restore()
    }
  })

  it('Mapping change → pulse on affected hit; clear also pulses; then steady if selected', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const { upsertMapping } = await importCompiledTs('src/model/palette-helpers.ts')
    const canvas = await importCompiledTs('src/canvas/index.ts')
    const restore = installMinimalDocument()
    try {
      const host = createElement('div')
      const store = model.createStore({
        project: fixtureProject(),
        session: defaultSession({
          selectedObjectTypeId: 'knobLarge',
          selectedStateId: 'normal',
        }),
      })
      canvas.mountCanvas(host, { storage: memoryStorage(), store })

      const knob = () => host.querySelector('[data-object-type-id="knobLarge"]')
      assert.ok(knob()?.classList.contains('is-selected'))
      assert.equal(knob()?.classList.contains('is-pulsing'), false)

      let project = store.getState().project
      let skinIndex = project.skins.findIndex((s) => s.id === 'black-duo')
      let skin = project.skins[skinIndex]
      project.skins = project.skins.map((s, i) =>
        i === skinIndex
          ? {
              ...s,
              mappings: upsertMapping(skin.mappings, {
                objectTypeId: 'knobLarge',
                stateId: 'normal',
                propertyId: 'face',
                paletteEntryId: 'faceRed',
              }),
            }
          : s,
      )
      store.apply({ project })

      assert.equal(hitFill(host, 'knobLarge'), '#CC2244')
      assert.ok(knob()?.classList.contains('is-pulsing'))
      assert.ok(knob()?.classList.contains('is-selected'))
      assert.equal(
        host
          .querySelector('[data-object-type-id="bypassBtn"]')
          ?.classList.contains('is-pulsing'),
        false,
      )

      // Clear Mapping → pulse again on that type.
      project = store.getState().project
      skinIndex = project.skins.findIndex((s) => s.id === 'black-duo')
      skin = project.skins[skinIndex]
      project.skins = project.skins.map((s, i) =>
        i === skinIndex
          ? {
              ...s,
              mappings: upsertMapping(skin.mappings, {
                objectTypeId: 'knobLarge',
                stateId: 'normal',
                propertyId: 'face',
                paletteEntryId: null,
              }),
            }
          : s,
      )
      store.apply({ project })

      assert.equal(hitFill(host, 'knobLarge'), '')
      assert.ok(knob()?.classList.contains('is-pulsing'))
      assert.ok(knob()?.classList.contains('is-selected'))
    } finally {
      restore()
    }
  })

  it('session State drives first-Property paint when type is selected', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const canvas = await importCompiledTs('src/canvas/index.ts')
    const restore = installMinimalDocument()
    try {
      const host = createElement('div')
      const project = fixtureProject({
        skins: [
          {
            id: 'black-duo',
            displayName: 'Black/Duo',
            mappings: [
              {
                objectTypeId: 'knobLarge',
                stateId: 'normal',
                propertyId: 'face',
                paletteEntryId: 'faceRed',
              },
              {
                objectTypeId: 'knobLarge',
                stateId: 'pressed',
                propertyId: 'face',
                paletteEntryId: 'duoLedYellow',
              },
            ],
          },
        ],
      })
      const store = model.createStore({
        project,
        session: defaultSession({
          selectedObjectTypeId: 'knobLarge',
          selectedStateId: 'pressed',
        }),
      })
      canvas.mountCanvas(host, { storage: memoryStorage(), store })

      assert.equal(hitFill(host, 'knobLarge'), '#FFCC00')

      store.apply({
        session: {
          ...store.getState().session,
          selectedStateId: 'normal',
        },
      })
      assert.equal(hitFill(host, 'knobLarge'), '#CC2244')
      assert.equal(host.querySelectorAll('.is-pulsing').length, 0)
    } finally {
      restore()
    }
  })

  it('ring-only bind leaves knobLarge unbound (HIT_FILL_FIRST_PROPERTY)', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const { upsertMapping } = await importCompiledTs('src/model/palette-helpers.ts')
    const canvas = await importCompiledTs('src/canvas/index.ts')
    const restore = installMinimalDocument()
    try {
      const host = createElement('div')
      const store = model.createStore({
        project: fixtureProject(),
        session: defaultSession(),
      })
      canvas.mountCanvas(host, { storage: memoryStorage(), store })

      const project = store.getState().project
      const skinIndex = project.skins.findIndex((s) => s.id === 'black-duo')
      const skin = project.skins[skinIndex]
      project.skins = project.skins.map((s, i) =>
        i === skinIndex
          ? {
              ...s,
              mappings: upsertMapping(skin.mappings, {
                objectTypeId: 'knobLarge',
                stateId: 'normal',
                propertyId: 'ring',
                paletteEntryId: 'faceRed',
              }),
            }
          : s,
      )
      store.apply({ project })

      assert.equal(hitFill(host, 'knobLarge'), '')
      assert.ok(
        host
          .querySelector('[data-object-type-id="knobLarge"]')
          ?.hasAttribute('data-hit-unbound'),
      )
    } finally {
      restore()
    }
  })

  it('ring Mapping upsert/clear still pulses knobLarge', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const { upsertMapping } = await importCompiledTs('src/model/palette-helpers.ts')
    const canvas = await importCompiledTs('src/canvas/index.ts')
    const restore = installMinimalDocument()
    try {
      const host = createElement('div')
      const store = model.createStore({
        project: fixtureProject(),
        session: defaultSession({
          selectedObjectTypeId: 'knobLarge',
          selectedStateId: 'normal',
        }),
      })
      canvas.mountCanvas(host, { storage: memoryStorage(), store })

      const knob = () => host.querySelector('[data-object-type-id="knobLarge"]')

      let project = store.getState().project
      let skinIndex = project.skins.findIndex((s) => s.id === 'black-duo')
      let skin = project.skins[skinIndex]
      project.skins = project.skins.map((s, i) =>
        i === skinIndex
          ? {
              ...s,
              mappings: upsertMapping(skin.mappings, {
                objectTypeId: 'knobLarge',
                stateId: 'normal',
                propertyId: 'ring',
                paletteEntryId: 'faceRed',
              }),
            }
          : s,
      )
      store.apply({ project })

      assert.equal(hitFill(host, 'knobLarge'), '')
      assert.ok(knob()?.classList.contains('is-pulsing'))

      project = store.getState().project
      skinIndex = project.skins.findIndex((s) => s.id === 'black-duo')
      skin = project.skins[skinIndex]
      project.skins = project.skins.map((s, i) =>
        i === skinIndex
          ? {
              ...s,
              mappings: upsertMapping(skin.mappings, {
                objectTypeId: 'knobLarge',
                stateId: 'normal',
                propertyId: 'ring',
                paletteEntryId: null,
              }),
            }
          : s,
      )
      store.apply({ project })

      assert.equal(hitFill(host, 'knobLarge'), '')
      assert.ok(knob()?.classList.contains('is-pulsing'))
    } finally {
      restore()
    }
  })

  it('hit fill follows activeSkinId across two Skins with different face mappings', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const canvas = await importCompiledTs('src/canvas/index.ts')
    const restore = installMinimalDocument()
    try {
      const host = createElement('div')
      const project = fixtureProject({
        skins: [
          {
            id: 'black-duo',
            displayName: 'Black/Duo',
            mappings: [
              {
                objectTypeId: 'knobLarge',
                stateId: 'normal',
                propertyId: 'face',
                paletteEntryId: 'faceRed',
              },
            ],
          },
          {
            id: 'cream-duo',
            displayName: 'Cream/Duo',
            mappings: [
              {
                objectTypeId: 'knobLarge',
                stateId: 'normal',
                propertyId: 'face',
                paletteEntryId: 'duoLedYellow',
              },
            ],
          },
        ],
      })
      const store = model.createStore({
        project,
        session: defaultSession({
          activeSkinId: 'black-duo',
          selectedObjectTypeId: 'knobLarge',
          selectedStateId: 'normal',
        }),
      })
      canvas.mountCanvas(host, { storage: memoryStorage(), store })

      assert.equal(hitFill(host, 'knobLarge'), '#CC2244')

      store.apply({
        session: {
          ...store.getState().session,
          activeSkinId: 'cream-duo',
        },
      })
      assert.equal(hitFill(host, 'knobLarge'), '#FFCC00')
      assert.equal(host.querySelectorAll('.is-pulsing').length, 0)

      store.apply({
        session: {
          ...store.getState().session,
          activeSkinId: 'black-duo',
        },
      })
      assert.equal(hitFill(host, 'knobLarge'), '#CC2244')
      assert.equal(host.querySelectorAll('.is-pulsing').length, 0)
    } finally {
      restore()
    }
  })

  it('Palette hex → zone still live-paints (FR-19 zone path unchanged)', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const canvas = await importCompiledTs('src/canvas/index.ts')
    const restore = installMinimalDocument()
    try {
      const host = createElement('div')
      const store = model.createStore({
        project: seed.createSeedProject(),
        session: defaultSession({ activeSkinId: 'black-duo' }),
      })
      canvas.mountCanvas(host, { storage: memoryStorage(), store })

      const project = store.getState().project
      project.palette = project.palette.map((entry) =>
        entry.id === 'duoLedYellow' ? { ...entry, hex: '#AABBCC' } : entry,
      )
      store.apply({ project })
      assert.equal(zoneFill(host, 'zone-header-duo-led'), '#AABBCC')
    } finally {
      restore()
    }
  })
})
