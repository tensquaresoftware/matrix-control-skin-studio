import assert from 'node:assert/strict'
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
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
  const dir = mkdtempSync(join(tmpdir(), 'skin-studio-canvas-board-'))
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

const REQUIRED_KINDS = [
  'slider',
  'combo',
  'button',
  'toggle',
  'label',
  'groupLabel',
  'moduleHeader',
  'modulationBusHeader',
  'sectionHeader',
  'envelopeDisplay',
  'trackGeneratorDisplay',
  'patchNameDisplay',
  'horizontalSeparator',
]

describe('canvas exemplar board I/O matrix (spike)', () => {
  it('Black / Orbital faces: slider 48 @ 60×16, combo PRESSURE @ 60×16, patch ORBITAL', async () => {
    const canvas = await importCompiledTs('src/canvas/index.ts')
    const restore = installMinimalDocument()
    try {
      const host = createElement('div')
      canvas.mountCanvas(host, { storage: memoryStorage() })

      const sliderDesc = canvas.EXEMPLAR_BOARD.find((d) => d.kind === 'slider')
      assert.ok(sliderDesc)
      assert.equal(sliderDesc.width, 60)
      assert.equal(sliderDesc.height, 16)
      assert.equal(sliderDesc.valueText, '48')
      assert.equal(sliderDesc.value, 48)
      assert.equal(sliderDesc.valueMin, 0)
      assert.equal(sliderDesc.valueMax, 63)
      assert.equal(sliderDesc.faceText, undefined)

      const expectedFill = canvas.sliderValueBarWidthPx(60, 48, 0, 63)
      assert.equal(expectedFill, 44)

      const fillEl = host.querySelector('[data-exemplar-slider-fill-width]')
      assert.ok(fillEl)
      assert.equal(fillEl.getAttribute('data-exemplar-slider-fill-width'), '44')
      assert.equal(fillEl.style.width, '44px')

      const sliderValue = host.querySelector('[data-exemplar-slider-value]')
      assert.ok(sliderValue)
      assert.equal(sliderValue.textContent, '48')

      const comboDesc = canvas.EXEMPLAR_BOARD.find((d) => d.kind === 'combo')
      assert.ok(comboDesc)
      assert.equal(comboDesc.width, 60)
      assert.equal(comboDesc.height, 16)
      assert.equal(comboDesc.faceText, 'PRESSURE')

      const comboBrick = host.querySelector('[data-exemplar-kind="combo"]')
      assert.ok(comboBrick)
      assert.equal(comboBrick.style.width, '60px')
      assert.equal(comboBrick.style.height, '16px')
      assert.equal(
        host.querySelector('[data-exemplar-combo-text]')?.textContent,
        'PRESSURE',
      )

      const patchDesc = canvas.EXEMPLAR_BOARD.find(
        (d) => d.kind === 'patchNameDisplay',
      )
      assert.ok(patchDesc)
      assert.equal(patchDesc.faceText, 'ORBITAL')
      const patchBrick = host.querySelector(
        '[data-exemplar-kind="patchNameDisplay"]',
      )
      assert.ok(patchBrick)
      assert.equal(patchBrick.textContent, 'ORBITAL')
    } finally {
      restore()
    }
  })

  it('Black ColourChart greens + PT Sans Narrow wired for gallery bricks', () => {
    assert.match(baseCss, /--mc-green1:\s*#002D0E/)
    assert.match(baseCss, /--mc-green2:\s*#06471C/)
    assert.match(baseCss, /--mc-green3:\s*#00785E/)
    assert.match(baseCss, /--mc-green4:\s*#00DDAD/)
    assert.match(baseCss, /--mc-font:\s*'PT Sans Narrow'/)
    assert.match(baseCss, /\.exemplar-brick-slider[\s\S]*background:\s*var\(--mc-green1\)/)
    assert.match(baseCss, /\.exemplar-slider-fill[\s\S]*background:\s*var\(--mc-green3\)/)
    assert.match(
      baseCss,
      /\.exemplar-slider-fill[\s\S]*left:\s*1px[\s\S]*top:\s*1px[\s\S]*bottom:\s*1px/,
    )
    assert.match(baseCss, /\.exemplar-slider-value[\s\S]*color:\s*var\(--mc-green4\)/)
    assert.match(baseCss, /\.exemplar-brick-toggle[\s\S]*background:\s*var\(--mc-green2\)/)
    assert.match(
      baseCss,
      /\.exemplar-combo-chevron[\s\S]*border-top:\s*5px solid var\(--mc-green3\)/,
    )
    assert.doesNotMatch(baseCss, /\.exemplar-[\w-]+\s*\{[^}]*#00aa55/i)

    const fontsCss = readFileSync(
      join(root, 'src/styles/matrix-control-fonts.css'),
      'utf8',
    )
    assert.match(fontsCss, /font-family:\s*'PT Sans Narrow'/)
    assert.match(fontsCss, /PTSansNarrow-Regular\.ttf/)
    assert.match(fontsCss, /PTSansNarrow-Bold\.ttf/)

    const fontDir = join(root, 'public/fonts/matrix-control')
    assert.ok(existsSync(join(fontDir, 'PTSansNarrow-Regular.ttf')))
    assert.ok(existsSync(join(fontDir, 'PTSansNarrow-Bold.ttf')))
    assert.ok(existsSync(join(fontDir, 'SOURCE.txt')))

    const stylesIndex = readFileSync(join(root, 'src/styles/index.ts'), 'utf8')
    assert.match(stylesIndex, /matrix-control-fonts\.css/)
  })

  it('board mounts: labeled exemplars for all base widgets; mock composition gone', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const canvas = await importCompiledTs('src/canvas/index.ts')
    const restore = installMinimalDocument()
    try {
      const host = createElement('div')
      host.classList.add('chrome-canvas-slot')
      const store = model.createStore({ project: seed.createSeedProject() })
      canvas.mountCanvas(host, { storage: memoryStorage(), store })

      const surface = host.querySelector('[data-canvas-surface]')
      assert.ok(surface)
      assert.ok(host.querySelector('[data-exemplar-board]'))
      // No inline raised-plaque fill on the pan surface.
      assert.equal(surface.style.backgroundColor, '')
      assert.notEqual(surface.style.backgroundColor, '#3a3a3a')

      for (const kind of REQUIRED_KINDS) {
        assert.ok(
          host.querySelector(`[data-exemplar-kind="${kind}"]`),
          `expected exemplar kind ${kind}`,
        )
      }
      assert.deepEqual(
        [...canvas.exemplarBoardKinds()],
        REQUIRED_KINDS,
      )

      for (const descriptor of canvas.EXEMPLAR_BOARD) {
        const caption = host.querySelector(
          `[data-exemplar-caption="${descriptor.id}"]`,
        )
        assert.ok(caption, `expected caption for ${descriptor.id}`)
        assert.equal(caption.textContent, descriptor.caption)
        assert.ok(
          String(caption.textContent).length > 0,
          `caption must be non-empty for ${descriptor.id}`,
        )

        const brick = host.querySelector(
          `[data-exemplar-widget="${descriptor.id}"]`,
        )
        assert.ok(brick, `expected brick for ${descriptor.id}`)
        assert.equal(brick.style.width, `${descriptor.width}px`)
        assert.equal(brick.style.height, `${descriptor.height}px`)
      }

      assert.equal(host.querySelector('[data-canvas-mock]'), null)
      assert.equal(host.querySelector('[data-mock-header]'), null)
      assert.equal(host.querySelector('[data-mock-body]'), null)
      assert.equal(host.querySelector('[data-mock-footer]'), null)
      assert.equal(host.querySelector('[data-orch-zone]'), null)
      assert.equal(host.querySelector('[data-object-type-id]'), null)
      assert.equal(host.querySelector('[data-zone-object-type-id]'), null)
      assert.equal(host.querySelector('.canvas-placeholder-label'), null)
    } finally {
      restore()
    }
  })

  it('no grey raised plaque: pan surface is transparent; host keeps app background', () => {
    assert.match(
      baseCss,
      /\.canvas-surface\s*\{[^}]*background:\s*transparent/s,
    )
    assert.doesNotMatch(
      baseCss,
      /\.canvas-surface\s*\{[^}]*background:\s*var\(--color-surface-raised\)/s,
    )
    assert.doesNotMatch(baseCss, /\.canvas-mock\s*\{/)
    assert.doesNotMatch(baseCss, /\.mock-header\s*\{/)
    assert.doesNotMatch(baseCss, /\.mock-orch\s*\{/)
    assert.match(baseCss, /\.canvas-host\s*\{[^}]*background:\s*var\(--color-surface-app\)/s)
    assert.match(baseCss, /\.exemplar-board\s*\{/)
    assert.match(baseCss, /\.exemplar-brick\s*\{/)
  })

  it('pan/Zoom prefs still apply transform on surface with board present', async () => {
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
      assert.ok(host.querySelector('[data-exemplar-board]'))
      assert.equal(
        surface.style.transform,
        'translate(24px, -8px) scale(1.5)',
      )
    } finally {
      restore()
    }
  })

  it('selection dormancy: board has no Object-type / zone hit targets', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const canvas = await importCompiledTs('src/canvas/index.ts')
    const restore = installMinimalDocument()
    try {
      const host = createElement('div')
      const store = model.createStore({ project: seed.createSeedProject() })
      canvas.mountCanvas(host, { storage: memoryStorage(), store })

      assert.equal(host.querySelectorAll('[data-object-type-id]').length, 0)
      assert.equal(host.querySelector('[data-orch-zone]'), null)
      assert.equal(host.querySelector('[data-zone-object-type-id]'), null)
      assert.ok(host.querySelector('[data-exemplar-board]'))
    } finally {
      restore()
    }
  })

  it('seed Palette Patch/Master entries remain unused on canvas (not deleted)', async () => {
    const seed = await importCompiledTs('src/seed/index.ts')
    const doc = seed.createSeedProject()
    const byId = Object.fromEntries(doc.palette.map((e) => [e.id, e]))

    assert.equal(doc.palette.length, 3)
    assert.equal(byId.yellow.hex, '#FFCC00')
    assert.equal(byId.blue.hex, '#3D7EFF')
    assert.equal(byId.orange.hex, '#FF8A1F')
    assert.deepEqual(
      doc.inventory.objectTypes.map((ot) => ot.id),
      ['headerLed', 'patchBand', 'masterBand'],
    )
  })
})
