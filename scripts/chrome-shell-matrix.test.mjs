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
const mainSrc = readFileSync(join(root, 'src/main.ts'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

const NEW_CONFIRM_BODY =
  'Replace the current project with the seed baseline? The saved browser project will be replaced. Preferences stay unchanged.'

const IMPORT_CONFIRM_BODY =
  'Replace the current project with this file? Unsaved browser state will be overwritten.'

const IMPORT_UNSUPPORTED_VERSION_ERROR =
  'Import failed — this file uses an unsupported format version.'

const IMPORT_INVALID_PROJECT_ERROR =
  'Import failed — this file is not a valid Skin Studio project.'

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
  const dir = mkdtempSync(join(tmpdir(), 'skin-studio-chrome-shell-'))
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
    textContent: '',
    disabled: false,
    clientHeight: 0,
    style: {
      cssText: '',
      height: '',
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
    },
    blur() {
      node._focused = false
    },
    setPointerCapture() {},
    releasePointerCapture() {},
  }
  return node
}

function canvasSurfaceTransform(root) {
  const surface = root.querySelector('[data-canvas-surface]')
  assert.ok(surface, 'expected [data-canvas-surface]')
  return surface.style.transform
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
  const body = createElement('body')
  globalThis.document = { createElement, body }
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

function findButtonByLabel(root, label) {
  const walk = (el) => {
    if (el.tagName === 'BUTTON' && el.textContent === label) return el
    for (const child of el.children) {
      const found = walk(child)
      if (found) return found
    }
    return null
  }
  return walk(root)
}

function paneHeight(root, id) {
  const pane = root.querySelector(`[data-sidebar-pane="${id}"]`)
  assert.ok(pane, `expected pane ${id}`)
  return pane.style.height
}

function sampleEditedProject(seedProject) {
  return {
    ...seedProject,
    palette: [
      ...seedProject.palette,
      { id: 'custom', hex: '#112233', constantName: 'kCustom' },
    ],
  }
}

function sampleSession() {
  return {
    selectedObjectTypeId: 'ot-1',
    selectedStateId: 'idle',
    activeSkinId: 'black-green',
  }
}

describe('chrome shell I/O matrix', () => {
  it('main mounts chrome shell after boot (not Epic 1 title+New)', () => {
    assert.match(
      mainSrc,
      /import\s*\{[^}]*\bmountChromeShell\b[^}]*\}\s*from\s*['"]\.\/chrome['"]/,
    )
    assert.match(
      mainSrc,
      /(?:const|let)\s+(\w+)\s*=\s*initProjectStore\s*\(\s*\)\s*;?\s*bootProjectStore\s*\(\s*\1\s*\)\s*;?\s*mountChromeShell\s*\(\s*document\.querySelector(?:<[^>]+>)?\s*\(\s*['"]#app['"]\s*\)\s*,\s*\1\s*\)/,
    )
    assert.doesNotMatch(mainSrc, /mountBootSurface/)
    assert.match(pkg.scripts?.test ?? '', /chrome-shell-matrix\.test\.mjs/)
  })

  it('layout tokens + flex caps: top bar 40px, context 28px, sidebar 320px (no canvas crush), splitter hit 6px', () => {
    assert.match(baseCss, /--space-top-bar-height\s*:\s*40px/)
    assert.match(baseCss, /--space-context-strip-height\s*:\s*28px/)
    assert.match(baseCss, /--space-sidebar-width\s*:\s*320px/)
    assert.match(baseCss, /--space-splitter-hit\s*:\s*6px/)
    assert.match(
      baseCss,
      /\.chrome-top-bar\s*\{[^}]*height:\s*var\(--space-top-bar-height\)/s,
    )
    assert.match(
      baseCss,
      /\.chrome-context-strip\s*\{[^}]*height:\s*var\(--space-context-strip-height\)/s,
    )
    assert.match(
      baseCss,
      /\.chrome-sidebar-slot\s*\{[^}]*width:\s*var\(--space-sidebar-width\)/s,
    )
    // Sidebar must not grow past the token (min-width:auto content crush).
    assert.match(
      baseCss,
      /\.chrome-sidebar-slot\s*\{[^}]*flex:\s*0\s+0\s+var\(--space-sidebar-width\)/s,
    )
    assert.match(
      baseCss,
      /\.chrome-sidebar-slot\s*\{[^}]*max-width:\s*var\(--space-sidebar-width\)/s,
    )
    assert.match(
      baseCss,
      /\.chrome-sidebar-slot\s*\{[^}]*min-width:\s*0/s,
    )
    assert.match(
      baseCss,
      /\.chrome-sidebar-slot\s*\{[^}]*overflow:\s*hidden/s,
    )
    assert.match(
      baseCss,
      /\.chrome-canvas-slot\s*\{[^}]*flex:\s*1/s,
    )
    assert.match(
      baseCss,
      /\.chrome-canvas-slot\s*\{[^}]*min-width:\s*0/s,
    )
    assert.match(
      baseCss,
      /\.canvas-host\s*\{[^}]*min-width:\s*0/s,
    )
    assert.match(
      baseCss,
      /\.canvas-surface\s*\{[^}]*min-width:\s*0/s,
    )
    assert.match(
      baseCss,
      /\.sidebar\s*\{[^}]*min-width:\s*0/s,
    )
  })

  it('fresh shell mount: chrome geometry, four panes, live Zoom/Skin + stub ops', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const sidebar = await importCompiledTs('src/sidebar/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const store = model.createStore({ project: seed.createSeedProject() })
      const storage = persist.createMemoryStorage()
      const root = createRoot()
      mountChromeShell(root, store, { storage })

      assert.ok(root.querySelector('[data-chrome-shell]'))
      assert.ok(root.querySelector('[data-chrome-top-bar]'))
      assert.ok(root.querySelector('[data-chrome-context-strip]'))
      assert.ok(root.querySelector('[data-chrome-body]'))
      assert.ok(root.querySelector('[data-canvas-host]'))
      assert.ok(root.querySelector('[data-sidebar]'))
      assert.ok(root.querySelector('[data-palette-row="duoLedYellow"]'))
      assert.ok(root.querySelector('[data-picker-hex]'))

      // Product path: chrome → mountCanvas(store) must paint Orchestrator zones from seed Palette.
      const zonePatch = root.querySelector('[data-orch-zone="zone-patch"]')
      const zoneMaster = root.querySelector('[data-orch-zone="zone-master"]')
      const zoneDuoLed = root.querySelector('[data-orch-zone="zone-header-duo-led"]')
      assert.ok(zonePatch, 'expected zone-patch')
      assert.ok(zoneMaster, 'expected zone-master')
      assert.ok(zoneDuoLed, 'expected zone-header-duo-led')
      assert.equal(zonePatch.style.backgroundColor, '#3D7EFF')
      assert.equal(zoneMaster.style.backgroundColor, '#FF8A1F')
      assert.equal(zoneDuoLed.style.backgroundColor, '#FFCC00')

      // Layout slot classes must survive mountCanvas / mountSidebar (flex:1 + 320px).
      const canvasHost = root.querySelector('[data-canvas-host]')
      const sidebarHost = root.querySelector('[data-sidebar]')
      assert.ok(canvasHost.classList.contains('chrome-canvas-slot'))
      assert.ok(canvasHost.classList.contains('canvas-host'))
      assert.ok(sidebarHost.classList.contains('chrome-sidebar-slot'))
      assert.ok(sidebarHost.classList.contains('sidebar'))

      assert.equal(paneHeight(root, 'picker'), `${sidebar.PICKER_PANE_HEIGHT_PX}px`)
      assert.equal(paneHeight(root, 'palette'), `${sidebar.DEFAULT_PALETTE_HEIGHT_PX}px`)
      assert.equal(paneHeight(root, 'mappings'), `${sidebar.MIN_MAPPINGS_HEIGHT_PX}px`)
      assert.equal(paneHeight(root, 'unbound'), `${sidebar.MIN_UNBOUND_HEIGHT_PX}px`)

      assert.ok(root.querySelector('[data-chrome-new]'))
      assert.ok(root.querySelector('[data-chrome-import]'))
      assert.equal(root.querySelector('[data-chrome-inert="import"]'), null)
      assert.ok(root.querySelector('[data-chrome-import-file]'))
      assert.ok(root.querySelector('[data-chrome-export]'))
      assert.equal(root.querySelector('[data-chrome-inert="export"]'), null)
      assert.ok(root.querySelector('[data-chrome-undo]'))
      assert.ok(root.querySelector('[data-chrome-redo]'))
      assert.equal(root.querySelector('[data-chrome-inert="undo"]'), null)
      assert.equal(root.querySelector('[data-chrome-inert="redo"]'), null)
      assert.equal(root.querySelector('[data-chrome-inert="zoom"]'), null)
      assert.equal(root.querySelector('[data-chrome-inert="skin"]'), null)

      // Seed empty inventory ⇒ unbound 0 ⇒ Export clear (accent, not aria-disabled).
      const exportReady = root.querySelector('[data-chrome-export]')
      assert.equal(exportReady?.disabled, false)
      assert.equal(exportReady?.getAttribute('aria-disabled'), null)
      assert.ok(exportReady?.classList.contains('chrome-top-btn-export-ready'))
      assert.match(baseCss, /\.chrome-top-btn-export-ready\b/)
      assert.match(
        baseCss,
        /\[data-chrome-export\]\[aria-disabled=['"]true['"]\]/,
      )
      assert.ok(root.querySelector('[data-chrome-zoom-select]'))
      assert.ok(root.querySelector('[data-chrome-skin-select]'))

      assert.equal(
        root.querySelector('[data-context-value="object"]')?.textContent,
        '—',
      )
      assert.equal(
        root.querySelector('[data-context-value="state"]')?.textContent,
        '—',
      )
      assert.equal(
        root.querySelector('[data-context-value="zoom"]')?.textContent,
        '100%',
      )
      assert.equal(
        root.querySelector('[data-context-value="skin"]')?.textContent,
        '—',
      )

      const splitters = root.querySelectorAll('[data-sidebar-splitter]')
      assert.equal(splitters.length, 3)

      assert.throws(
        () => mountChromeShell(null, store, { storage }),
        /Chrome root #app is missing/,
      )
    } finally {
      restoreDoc()
    }
  })

  it('Export hard gate: aria-disabled + tooltip when unbound; accent + download when clear', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const io = await importCompiledTs('src/io/index.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()
    const prevURL = globalThis.URL
    const prevCreateElement = globalThis.document.createElement

    try {
      const inventory = {
        source: 'test-fixture',
        objectTypes: [
          {
            id: 'headerLed',
            states: ['off', 'on'],
            properties: ['fill'],
          },
        ],
      }
      const palette = [{ id: 'duoLedYellow', hex: '#FFCC00' }]
      const blockedProject = {
        formatVersion: 1,
        palette,
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
              {
                objectTypeId: 'headerLed',
                stateId: 'on',
                propertyId: 'fill',
                paletteEntryId: null,
              },
            ],
          },
        ],
        inventory,
      }

      const store = model.createStore({ project: blockedProject })
      const root = createRoot()
      mountChromeShell(root, store, { storage: persist.createMemoryStorage() })

      const exportBtn = root.querySelector('[data-chrome-export]')
      assert.ok(exportBtn)
      assert.equal(exportBtn.disabled, false)
      assert.equal(exportBtn.getAttribute('aria-disabled'), 'true')
      assert.equal(
        exportBtn.getAttribute('title'),
        'Export blocked — 1 unbound mapping(s)',
      )
      assert.equal(exportBtn.classList.contains('chrome-top-btn-export-ready'), false)

      // Guard: click while blocked must not start a download.
      const clicksBlocked = []
      globalThis.URL = {
        createObjectURL() {
          clicksBlocked.push('createObjectURL')
          return 'blob:blocked'
        },
        revokeObjectURL() {},
      }
      exportBtn.click()
      assert.deepEqual(clicksBlocked, [])
      globalThis.URL = prevURL

      // Bind remaining slot → Export clears live from store.
      const clearProject = structuredClone(blockedProject)
      clearProject.skins[0].mappings[1].paletteEntryId = 'duoLedYellow'
      store.apply({ project: clearProject })

      assert.equal(exportBtn.getAttribute('aria-disabled'), null)
      assert.equal(exportBtn.getAttribute('title'), null)
      assert.ok(exportBtn.classList.contains('chrome-top-btn-export-ready'))
      assert.equal(io.isExportBlocked(store.getState().project), false)

      const clicks = []
      globalThis.URL = {
        createObjectURL() {
          return 'blob:export-test'
        },
        revokeObjectURL() {},
      }
      globalThis.document.createElement = (tag) => {
        const el = prevCreateElement(tag)
        if (String(tag).toLowerCase() === 'a') {
          const origClick = el.click.bind(el)
          el.click = () => {
            clicks.push({
              download: el.getAttribute('download'),
              href: el.getAttribute('href'),
            })
            origClick()
          }
        }
        return el
      }

      exportBtn.click()
      assert.equal(clicks.length, 1)
      assert.equal(clicks[0].download, 'matrix-control-skin-studio.json')
      assert.equal(clicks[0].href, 'blob:export-test')

      // After clear, unbind again → blocked UI returns.
      const rebound = structuredClone(clearProject)
      rebound.skins[0].mappings[1].paletteEntryId = null
      store.apply({ project: rebound })
      assert.equal(exportBtn.getAttribute('aria-disabled'), 'true')
      assert.equal(
        exportBtn.getAttribute('title'),
        'Export blocked — 1 unbound mapping(s)',
      )
      assert.equal(exportBtn.classList.contains('chrome-top-btn-export-ready'), false)
      const clicksAfterUnbind = clicks.length
      exportBtn.click()
      assert.equal(clicks.length, clicksAfterUnbind)

      // Multi-skin: active Skin clear, sibling unbound → project-total gate.
      const multiBlocked = {
        formatVersion: 1,
        palette,
        skins: [
          {
            id: 'active-clear',
            displayName: 'Active Clear',
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
          {
            id: 'sibling-unbound',
            displayName: 'Sibling Unbound',
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
                paletteEntryId: null,
              },
            ],
          },
        ],
        inventory,
      }
      store.apply({
        project: multiBlocked,
        session: {
          selectedObjectTypeId: null,
          selectedStateId: null,
          activeSkinId: 'active-clear',
        },
      })
      assert.equal(io.unboundExportCount(store.getState().project), 1)
      assert.equal(exportBtn.getAttribute('aria-disabled'), 'true')
      assert.equal(
        exportBtn.getAttribute('title'),
        'Export blocked — 1 unbound mapping(s)',
      )
      assert.equal(exportBtn.classList.contains('chrome-top-btn-export-ready'), false)
      const clicksMultiBlocked = clicks.length
      exportBtn.click()
      assert.equal(clicks.length, clicksMultiBlocked)

      // Clear sibling → Export downloads.
      const multiClear = structuredClone(multiBlocked)
      multiClear.skins[1].mappings[1].paletteEntryId = 'duoLedYellow'
      store.apply({ project: multiClear })
      assert.equal(exportBtn.getAttribute('aria-disabled'), null)
      assert.ok(exportBtn.classList.contains('chrome-top-btn-export-ready'))
      exportBtn.click()
      assert.equal(clicks.length, clicksMultiBlocked + 1)
      assert.equal(
        clicks[clicks.length - 1].download,
        'matrix-control-skin-studio.json',
      )
    } finally {
      globalThis.document.createElement = prevCreateElement
      globalThis.URL = prevURL
      restoreDoc()
    }
  })

  it('top-bar order: New Import Export · Undo Redo · Zoom · spacer · Skin', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const root = createRoot()
      mountChromeShell(root, model.createStore(), {
        storage: persist.createMemoryStorage(),
      })
      const topBar = root.querySelector('[data-chrome-top-bar]')
      assert.ok(topBar)
      const markers = topBar.children.map((child) => {
        if (child.getAttribute('data-chrome-new') !== null) return 'new'
        if (child.getAttribute('data-chrome-import') !== null) return 'import'
        if (child.getAttribute('data-chrome-export') !== null) return 'export'
        if (child.classList.contains('chrome-top-sep')) return 'sep'
        if (child.getAttribute('data-chrome-undo') !== null) return 'undo'
        if (child.getAttribute('data-chrome-redo') !== null) return 'redo'
        if (child.getAttribute('data-chrome-zoom') !== null) return 'zoom'
        if (child.getAttribute('data-chrome-spacer') !== null) return 'spacer'
        if (child.getAttribute('data-chrome-skin') !== null) return 'skin'
        return 'other'
      })
      assert.deepEqual(markers, [
        'new',
        'import',
        'export',
        'sep',
        'undo',
        'redo',
        'zoom',
        'spacer',
        'skin',
      ])
      assert.equal(findButtonByLabel(root, 'New')?.disabled, false)
      assert.equal(findButtonByLabel(root, 'Import')?.disabled, false)
      // Empty project inventory ⇒ Export enabled (not native disabled).
      const exportBtn = findButtonByLabel(root, 'Export')
      assert.equal(exportBtn?.disabled, false)
      assert.equal(exportBtn?.getAttribute('aria-disabled'), null)
      assert.ok(exportBtn?.classList.contains('chrome-top-btn-export-ready'))
      assert.equal(findButtonByLabel(root, 'Undo')?.disabled, true)
      assert.equal(findButtonByLabel(root, 'Redo')?.disabled, true)
      assert.match(baseCss, /\.chrome-combo-select\b/)
      assert.doesNotMatch(baseCss, /\.chrome-combo-value\b/)
    } finally {
      restoreDoc()
    }
  })

  it('Zoom combo: steps, default 100%, prefs round-trip, corrupt clamp, envelope isolation', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const { bootProjectStore } = await importCompiledTs('src/boot-project.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      assert.deepEqual([...persist.ZOOM_STEPS], [
        '50%',
        '75%',
        '100%',
        '125%',
        '150%',
        '175%',
        '200%',
      ])
      assert.equal(persist.clampZoomStep('bogus'), '100%')
      assert.equal(persist.clampZoomStep('150%'), '150%')

      const storage = persist.createMemoryStorage()
      storage.setItem(
        persist.PREFS_KEY,
        JSON.stringify({
          zoomStep: '100%',
          panXY: { x: 9, y: 8 },
          sidebarPaneHeights: { palette: 140, mappings: 160, unbound: 120 },
        }),
      )
      const store = model.createStore()
      bootProjectStore(store, storage)
      const envelopeBefore = storage.getItem(persist.PROJECT_ENVELOPE_KEY)
      assert.notEqual(envelopeBefore, null)
      const sessionBefore = store.getState().session

      const root = createRoot()
      mountChromeShell(root, store, { storage })

      const zoomSelect = root.querySelector('[data-chrome-zoom-select]')
      assert.ok(zoomSelect)
      assert.equal(zoomSelect.tagName, 'SELECT')
      assert.equal(zoomSelect.value, '100%')
      assert.equal(
        root.querySelector('[data-context-value="zoom"]')?.textContent,
        '100%',
      )

      const stepOptions = zoomSelect.children
        .filter((c) => c.tagName === 'OPTION')
        .map((o) => o.value)
      assert.deepEqual(stepOptions, [...persist.ZOOM_STEPS])

      zoomSelect.value = '150%'
      zoomSelect.dispatchEvent({ type: 'change' })

      const prefs = JSON.parse(storage.getItem(persist.PREFS_KEY))
      assert.equal(prefs.zoomStep, '150%')
      assert.deepEqual(prefs.panXY, { x: 9, y: 8 })
      assert.deepEqual(prefs.sidebarPaneHeights, {
        palette: 140,
        mappings: 160,
        unbound: 120,
      })
      assert.equal(
        root.querySelector('[data-context-value="zoom"]')?.textContent,
        '150%',
      )
      assert.equal(storage.getItem(persist.PROJECT_ENVELOPE_KEY), envelopeBefore)
      assert.deepEqual(store.getState().session, sessionBefore)
      const envelope = JSON.parse(envelopeBefore)
      assert.equal(Object.hasOwn(envelope, 'zoomStep'), false)
      assert.equal(Object.hasOwn(envelope.project ?? {}, 'zoomStep'), false)
      assert.deepEqual(envelope.project, seed.createSeedProject())

      // Corrupt stored zoomStep → combo + strip clamp to 100% (no throw; write on next change).
      storage.setItem(
        persist.PREFS_KEY,
        JSON.stringify({
          zoomStep: 'not-a-step',
          panXY: { x: 0, y: 0 },
          sidebarPaneHeights: {},
        }),
      )
      const rootCorrupt = createRoot()
      mountChromeShell(rootCorrupt, model.createStore(), { storage })
      const corruptSelect = rootCorrupt.querySelector('[data-chrome-zoom-select]')
      assert.equal(corruptSelect.value, '100%')
      assert.equal(
        rootCorrupt.querySelector('[data-context-value="zoom"]')?.textContent,
        '100%',
      )
      assert.equal(
        JSON.parse(storage.getItem(persist.PREFS_KEY)).zoomStep,
        'not-a-step',
      )
      corruptSelect.value = '125%'
      corruptSelect.dispatchEvent({ type: 'change' })
      assert.equal(JSON.parse(storage.getItem(persist.PREFS_KEY)).zoomStep, '125%')

      // savePrefs fail-soft on Zoom change
      const throwingStorage = {
        getItem(key) {
          if (key === persist.PREFS_KEY) {
            return JSON.stringify({
              zoomStep: '100%',
              panXY: { x: 0, y: 0 },
              sidebarPaneHeights: {},
            })
          }
          return null
        },
        setItem() {
          throw new Error('quota exceeded')
        },
        removeItem() {},
      }
      const rootThrow = createRoot()
      mountChromeShell(rootThrow, model.createStore(), { storage: throwingStorage })
      const throwSelect = rootThrow.querySelector('[data-chrome-zoom-select]')
      assert.doesNotThrow(() => {
        throwSelect.value = '200%'
        throwSelect.dispatchEvent({ type: 'change' })
      })
      assert.equal(
        rootThrow.querySelector('[data-context-value="zoom"]')?.textContent,
        '200%',
      )
    } finally {
      restoreDoc()
    }
  })

  it('Skin combo: lists displayNames, sticky Object/State strip, prefs isolation', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const seedProject = seed.createSeedProject()
      assert.equal(seedProject.skins.length, 5)

      // Null Object/State/Skin → strip —; Skin switch must not invent selection
      const storageNull = persist.createMemoryStorage()
      const storeNull = model.createStore()
      storeNull.apply({
        project: seedProject,
        session: model.createEmptySession(),
      })
      const rootNull = createRoot()
      mountChromeShell(rootNull, storeNull, { storage: storageNull })

      const skinSelectNull = rootNull.querySelector('[data-chrome-skin-select]')
      assert.ok(skinSelectNull)
      assert.equal(skinSelectNull.tagName, 'SELECT')
      assert.equal(skinSelectNull.value, '')
      const optionLabels = skinSelectNull.children
        .filter((c) => c.tagName === 'OPTION')
        .map((o) => ({ value: o.value, label: o.textContent }))
      assert.equal(optionLabels[0].value, '')
      assert.equal(optionLabels[0].label, '—')
      assert.deepEqual(
        optionLabels.slice(1).map((o) => o.label),
        seedProject.skins.map((s) => s.displayName),
      )
      assert.deepEqual(
        optionLabels.slice(1).map((o) => o.value),
        seedProject.skins.map((s) => s.id),
      )
      assert.equal(
        rootNull.querySelector('[data-context-value="skin"]')?.textContent,
        '—',
      )
      assert.equal(
        rootNull.querySelector('[data-context-value="object"]')?.textContent,
        '—',
      )
      assert.equal(
        rootNull.querySelector('[data-context-value="state"]')?.textContent,
        '—',
      )
      assert.ok(rootNull.querySelector('[data-chrome-skin]')?.classList.contains('chrome-skin-combo'))

      skinSelectNull.value = 'monochrome'
      skinSelectNull.dispatchEvent({ type: 'change' })
      const afterNullSwitch = storeNull.getState().session
      assert.equal(afterNullSwitch.activeSkinId, 'monochrome')
      assert.equal(afterNullSwitch.selectedObjectTypeId, null)
      assert.equal(afterNullSwitch.selectedStateId, null)
      assert.equal(
        rootNull.querySelector('[data-context-value="object"]')?.textContent,
        '—',
      )
      assert.equal(
        rootNull.querySelector('[data-context-value="state"]')?.textContent,
        '—',
      )
      assert.equal(
        rootNull.querySelector('[data-context-value="skin"]')?.textContent,
        'Monochrome',
      )

      // Sticky switch: Object/State/Zoom/pan prefs preserved; strip shows session ids
      const storage = persist.createMemoryStorage()
      const stickyPrefs = {
        zoomStep: '150%',
        panXY: { x: 12, y: 34 },
        sidebarPaneHeights: { palette: 160, mappings: 200, unbound: 140 },
      }
      storage.setItem(persist.PREFS_KEY, JSON.stringify(stickyPrefs))
      const prefsBefore = storage.getItem(persist.PREFS_KEY)

      const store = model.createStore()
      persist.attachAutosave(store, storage)
      store.apply({
        project: seedProject,
        session: {
          selectedObjectTypeId: 'ot-1',
          selectedStateId: 'idle',
          activeSkinId: 'black-green',
        },
      })
      const envelopeBefore = storage.getItem(persist.PROJECT_ENVELOPE_KEY)

      const root = createRoot()
      mountChromeShell(root, store, { storage })
      const objectVal = root.querySelector('[data-context-value="object"]')
      const stateVal = root.querySelector('[data-context-value="state"]')
      assert.equal(objectVal?.tagName, 'SPAN')
      assert.equal(stateVal?.tagName, 'SPAN')
      assert.equal(objectVal.hasAttribute('contenteditable'), false)
      assert.equal(stateVal.hasAttribute('contenteditable'), false)

      const skinSelect = root.querySelector('[data-chrome-skin-select]')
      assert.equal(skinSelect.value, 'black-green')
      assert.equal(
        root.querySelector('[data-context-value="skin"]')?.textContent,
        'Black/Green',
      )
      assert.equal(objectVal.textContent, 'ot-1')
      assert.equal(stateVal.textContent, 'idle')
      assert.equal(
        root.querySelector('[data-context-value="zoom"]')?.textContent,
        '150%',
      )

      skinSelect.value = 'monochrome'
      skinSelect.dispatchEvent({ type: 'change' })

      const after = store.getState().session
      assert.equal(after.activeSkinId, 'monochrome')
      assert.equal(after.selectedObjectTypeId, 'ot-1')
      assert.equal(after.selectedStateId, 'idle')
      assert.equal(
        root.querySelector('[data-context-value="skin"]')?.textContent,
        'Monochrome',
      )
      assert.equal(
        root.querySelector('[data-context-value="object"]')?.textContent,
        'ot-1',
      )
      assert.equal(
        root.querySelector('[data-context-value="state"]')?.textContent,
        'idle',
      )
      assert.equal(storage.getItem(persist.PREFS_KEY), prefsBefore)
      assert.deepEqual(JSON.parse(storage.getItem(persist.PREFS_KEY)), stickyPrefs)
      assert.notEqual(storage.getItem(persist.PROJECT_ENVELOPE_KEY), envelopeBefore)
      const envelope = JSON.parse(storage.getItem(persist.PROJECT_ENVELOPE_KEY))
      assert.equal(envelope.session.activeSkinId, 'monochrome')
      assert.equal(envelope.session.selectedObjectTypeId, 'ot-1')
      assert.equal(envelope.session.selectedStateId, 'idle')
      assert.equal(Object.hasOwn(envelope, 'zoomStep'), false)
      assert.equal(Object.hasOwn(envelope, 'panXY'), false)

      // Live strip sync via store.apply (no selection UI)
      store.apply({
        session: {
          selectedObjectTypeId: 'ot-live',
          selectedStateId: 'pressed',
          activeSkinId: 'monochrome',
        },
      })
      assert.equal(
        root.querySelector('[data-context-value="object"]')?.textContent,
        'ot-live',
      )
      assert.equal(
        root.querySelector('[data-context-value="state"]')?.textContent,
        'pressed',
      )

      store.apply({
        session: {
          selectedObjectTypeId: null,
          selectedStateId: null,
          activeSkinId: 'monochrome',
        },
      })
      assert.equal(
        root.querySelector('[data-context-value="object"]')?.textContent,
        '—',
      )
      assert.equal(
        root.querySelector('[data-context-value="state"]')?.textContent,
        '—',
      )

      // Restore sticky ids for clear-skin path
      store.apply({
        session: {
          selectedObjectTypeId: 'ot-1',
          selectedStateId: 'idle',
          activeSkinId: 'monochrome',
        },
      })

      // Unknown id ignored
      const beforeUnknown = store.getState().session
      skinSelect.value = 'no-such-skin'
      skinSelect.dispatchEvent({ type: 'change' })
      assert.deepEqual(store.getState().session, beforeUnknown)
      assert.equal(skinSelect.value, 'monochrome')

      // Clear to null via empty/— after a real skin
      skinSelect.value = ''
      skinSelect.dispatchEvent({ type: 'change' })
      const afterClear = store.getState().session
      assert.equal(afterClear.activeSkinId, null)
      assert.equal(afterClear.selectedObjectTypeId, 'ot-1')
      assert.equal(afterClear.selectedStateId, 'idle')
      assert.equal(skinSelect.value, '')
      assert.equal(
        root.querySelector('[data-context-value="skin"]')?.textContent,
        '—',
      )
      assert.equal(
        root.querySelector('[data-context-value="object"]')?.textContent,
        'ot-1',
      )
      assert.equal(
        root.querySelector('[data-context-value="state"]')?.textContent,
        'idle',
      )
      assert.equal(storage.getItem(persist.PREFS_KEY), prefsBefore)

      // Orphan activeSkinId on mount → Skin cleared; Object/State sticky + live on strip
      const storageOrphan = persist.createMemoryStorage()
      const storeOrphan = model.createStore()
      storeOrphan.apply({
        project: seedProject,
        session: {
          selectedObjectTypeId: 'ot-orphan',
          selectedStateId: 'state-orphan',
          activeSkinId: 'missing-skin-id',
        },
      })
      const rootOrphan = createRoot()
      mountChromeShell(rootOrphan, storeOrphan, { storage: storageOrphan })
      const skinSelectOrphan = rootOrphan.querySelector('[data-chrome-skin-select]')
      const orphanSession = storeOrphan.getState().session
      assert.equal(orphanSession.activeSkinId, null)
      assert.equal(orphanSession.selectedObjectTypeId, 'ot-orphan')
      assert.equal(orphanSession.selectedStateId, 'state-orphan')
      assert.equal(skinSelectOrphan.value, '')
      assert.equal(
        rootOrphan.querySelector('[data-context-value="skin"]')?.textContent,
        '—',
      )
      assert.equal(
        rootOrphan.querySelector('[data-context-value="object"]')?.textContent,
        'ot-orphan',
      )
      assert.equal(
        rootOrphan.querySelector('[data-context-value="state"]')?.textContent,
        'state-orphan',
      )
      const orphanLabels = skinSelectOrphan.children
        .filter((c) => c.tagName === 'OPTION')
        .map((o) => ({ value: o.value, label: o.textContent }))
      assert.equal(orphanLabels[0].value, '')
      assert.equal(orphanLabels[0].label, '—')
      assert.deepEqual(
        orphanLabels.slice(1).map((o) => o.label),
        seedProject.skins.map((s) => s.displayName),
      )
    } finally {
      restoreDoc()
    }
  })

  it('forbidden chrome: no left layers tree, bottom chrome, or left Palette rail', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const root = createRoot()
      mountChromeShell(root, model.createStore(), {
        storage: persist.createMemoryStorage(),
      })

      assert.equal(root.querySelector('[data-layers-tree]'), null)
      assert.equal(root.querySelector('[data-bottom-chrome]'), null)
      assert.equal(root.querySelector('[data-palette-rail]'), null)
      assert.equal(root.querySelector('[data-left-rail]'), null)
      assert.doesNotMatch(baseCss, /\.layers-tree\b/)
      assert.doesNotMatch(baseCss, /\.bottom-chrome\b/)
      assert.doesNotMatch(baseCss, /\.palette-rail\b/)
    } finally {
      restoreDoc()
    }
  })

  it('splitter resize: heights update; prefs sidebarPaneHeights written on commit', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const sidebar = await importCompiledTs('src/sidebar/index.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const storage = persist.createMemoryStorage()
      // Headroom on mappings so palette↔mappings drag can move without hitting mins.
      storage.setItem(
        persist.PREFS_KEY,
        JSON.stringify({
          zoomStep: '100%',
          panXY: { x: 0, y: 0 },
          sidebarPaneHeights: {
            palette: 140,
            mappings: 220,
            unbound: 180,
          },
        }),
      )
      const store = model.createStore()
      const root = createRoot()
      mountChromeShell(root, store, { storage })

      const splitter1 = root.querySelector('[data-sidebar-splitter="1"]')
      assert.ok(splitter1)

      splitter1.dispatchEvent({
        type: 'pointerdown',
        button: 0,
        clientY: 200,
        pointerId: 1,
        preventDefault() {},
      })
      globalThis.window.dispatchEvent({
        type: 'pointermove',
        clientY: 240,
        pointerId: 1,
      })
      assert.equal(paneHeight(root, 'picker'), `${sidebar.PICKER_PANE_HEIGHT_PX}px`)
      assert.equal(paneHeight(root, 'palette'), '180px')
      assert.equal(paneHeight(root, 'mappings'), '180px')

      globalThis.window.dispatchEvent({
        type: 'pointerup',
        pointerId: 1,
      })

      const saved = JSON.parse(storage.getItem(persist.PREFS_KEY))
      assert.equal(saved.sidebarPaneHeights.palette, 180)
      assert.equal(saved.sidebarPaneHeights.mappings, 180)
      assert.equal(saved.sidebarPaneHeights.unbound, 180)
      assert.equal(saved.zoomStep, '100%')
      assert.deepEqual(saved.panXY, { x: 0, y: 0 })

      // Remount restores the committed prefs heights.
      const remount = createRoot()
      mountChromeShell(remount, model.createStore(), { storage })
      assert.equal(paneHeight(remount, 'palette'), '180px')
      assert.equal(paneHeight(remount, 'mappings'), '180px')
      assert.equal(paneHeight(remount, 'unbound'), '180px')

      // Non-finite deltaY leaves heights unchanged.
      assert.deepEqual(
        sidebar.resizeFromDrag(1, Number.NaN, {
          palette: 140,
          mappings: 220,
          unbound: 180,
        }),
        { palette: 140, mappings: 220, unbound: 180 },
      )

      // Splitter-0 grow: picker stays 220px; panes 2–4 actually move.
      const before0 = {
        palette: paneHeight(root, 'palette'),
        mappings: paneHeight(root, 'mappings'),
        unbound: paneHeight(root, 'unbound'),
      }
      const splitter0 = root.querySelector('[data-sidebar-splitter="0"]')
      splitter0.dispatchEvent({
        type: 'pointerdown',
        button: 0,
        clientY: 100,
        pointerId: 2,
        preventDefault() {},
      })
      globalThis.window.dispatchEvent({
        type: 'pointermove',
        clientY: 130,
        pointerId: 2,
      })
      globalThis.window.dispatchEvent({ type: 'pointerup', pointerId: 2 })
      assert.equal(paneHeight(root, 'picker'), `${sidebar.PICKER_PANE_HEIGHT_PX}px`)
      assert.notEqual(paneHeight(root, 'palette'), before0.palette)
      assert.notEqual(
        `${paneHeight(root, 'mappings')}|${paneHeight(root, 'unbound')}`,
        `${before0.mappings}|${before0.unbound}`,
      )

      // Grow-beyond-absorb: palette only grows by what mappings/unbound free.
      const capped = sidebar.resizeFromDrag(
        0,
        500,
        { palette: 140, mappings: 160, unbound: 120 },
      )
      assert.equal(capped.palette, 140)
      assert.equal(capped.mappings, 160)
      assert.equal(capped.unbound, 120)

      // Splitter-0 shrink: palette decreases; mappings+unbound absorb the freed space.
      const shrunk = sidebar.resizeFromDrag(0, -40, {
        palette: 140,
        mappings: 200,
        unbound: 180,
      })
      assert.equal(shrunk.palette, 100)
      assert.equal(
        shrunk.mappings + shrunk.unbound,
        200 + 180 + 40,
      )

      // Splitter-2: mappings ↔ unbound boundary moves with mins.
      const split2 = sidebar.resizeFromDrag(2, 30, {
        palette: 140,
        mappings: 200,
        unbound: 180,
      })
      assert.equal(split2.palette, 140)
      assert.equal(split2.mappings, 230)
      assert.equal(split2.unbound, 150)

      const split2Dom = root.querySelector('[data-sidebar-splitter="2"]')
      const before2 = {
        mappings: paneHeight(root, 'mappings'),
        unbound: paneHeight(root, 'unbound'),
      }
      split2Dom.dispatchEvent({
        type: 'pointerdown',
        button: 0,
        clientY: 300,
        pointerId: 3,
        preventDefault() {},
      })
      globalThis.window.dispatchEvent({
        type: 'pointermove',
        clientY: 330,
        pointerId: 3,
      })
      globalThis.window.dispatchEvent({ type: 'pointerup', pointerId: 3 })
      assert.notEqual(paneHeight(root, 'mappings'), before2.mappings)
      assert.notEqual(paneHeight(root, 'unbound'), before2.unbound)
      assert.equal(paneHeight(root, 'picker'), `${sidebar.PICKER_PANE_HEIGHT_PX}px`)
    } finally {
      restoreDoc()
    }
  })

  it('prefs restore: saved heights, below-min clamp, and distribute defaults', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const sidebar = await importCompiledTs('src/sidebar/index.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const storage = persist.createMemoryStorage()
      storage.setItem(
        persist.PREFS_KEY,
        JSON.stringify({
          zoomStep: '125%',
          panXY: { x: 3, y: 4 },
          sidebarPaneHeights: {
            palette: 180,
            mappings: 200,
            unbound: 150,
          },
        }),
      )

      const root = createRoot()
      mountChromeShell(root, model.createStore(), { storage })

      assert.equal(paneHeight(root, 'palette'), '180px')
      assert.equal(paneHeight(root, 'mappings'), '200px')
      assert.equal(paneHeight(root, 'unbound'), '150px')
      assert.equal(paneHeight(root, 'picker'), '220px')
      assert.equal(root.querySelector('[data-chrome-zoom-select]')?.value, '125%')
      assert.equal(
        root.querySelector('[data-context-value="zoom"]')?.textContent,
        '125%',
      )

      // Below-min prefs → clamp to mins.
      storage.setItem(
        persist.PREFS_KEY,
        JSON.stringify({
          zoomStep: '100%',
          panXY: { x: 0, y: 0 },
          sidebarPaneHeights: {
            palette: 40,
            mappings: 50,
            unbound: 10,
          },
        }),
      )
      const rootClamp = createRoot()
      mountChromeShell(rootClamp, model.createStore(), { storage })
      assert.equal(paneHeight(rootClamp, 'palette'), `${sidebar.MIN_PALETTE_HEIGHT_PX}px`)
      assert.equal(paneHeight(rootClamp, 'mappings'), `${sidebar.MIN_MAPPINGS_HEIGHT_PX}px`)
      assert.equal(paneHeight(rootClamp, 'unbound'), `${sidebar.MIN_UNBOUND_HEIGHT_PX}px`)

      // Corrupt prefs → defaults
      storage.setItem(persist.PREFS_KEY, '{not-json')
      const root2 = createRoot()
      mountChromeShell(root2, model.createStore(), { storage })
      assert.equal(paneHeight(root2, 'palette'), '140px')

      // resolvePaneHeights distribute branch when host has measurable height.
      const distributed = sidebar.resolvePaneHeights({}, { clientHeight: 800 })
      assert.equal(distributed.palette, sidebar.DEFAULT_PALETTE_HEIGHT_PX)
      assert.ok(distributed.mappings > sidebar.MIN_MAPPINGS_HEIGHT_PX)
      assert.ok(distributed.unbound > sidebar.MIN_UNBOUND_HEIGHT_PX)
      assert.equal(
        distributed.mappings + distributed.unbound,
        800 - sidebar.PICKER_PANE_HEIGHT_PX - 3 - sidebar.DEFAULT_PALETTE_HEIGHT_PX,
      )

      // Mount path with measurable host height (not only the helper call).
      const emptyStorage = persist.createMemoryStorage()
      const measurableHost = createElement('aside')
      measurableHost.clientHeight = 800
      sidebar.mountSidebar(measurableHost, { storage: emptyStorage })
      assert.equal(
        paneHeight(measurableHost, 'palette'),
        `${sidebar.DEFAULT_PALETTE_HEIGHT_PX}px`,
      )
      assert.equal(
        paneHeight(measurableHost, 'mappings'),
        `${distributed.mappings}px`,
      )
      assert.equal(
        paneHeight(measurableHost, 'unbound'),
        `${distributed.unbound}px`,
      )
    } finally {
      restoreDoc()
    }
  })

  it('prefs isolation: splitter commit does not mutate project envelope', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const { bootProjectStore } = await importCompiledTs('src/boot-project.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const storage = persist.createMemoryStorage()
      storage.setItem(
        persist.PREFS_KEY,
        JSON.stringify({
          zoomStep: '100%',
          panXY: { x: 0, y: 0 },
          sidebarPaneHeights: {
            palette: 140,
            mappings: 220,
            unbound: 180,
          },
        }),
      )
      const store = model.createStore()
      bootProjectStore(store, storage)
      const envelopeBefore = storage.getItem(persist.PROJECT_ENVELOPE_KEY)
      assert.notEqual(envelopeBefore, null)

      const root = createRoot()
      mountChromeShell(root, store, { storage })

      const splitter1 = root.querySelector('[data-sidebar-splitter="1"]')
      splitter1.dispatchEvent({
        type: 'pointerdown',
        button: 0,
        clientY: 200,
        pointerId: 1,
        preventDefault() {},
      })
      globalThis.window.dispatchEvent({
        type: 'pointermove',
        clientY: 240,
        pointerId: 1,
      })
      globalThis.window.dispatchEvent({ type: 'pointerup', pointerId: 1 })

      assert.equal(storage.getItem(persist.PROJECT_ENVELOPE_KEY), envelopeBefore)
      const envelope = JSON.parse(envelopeBefore)
      assert.deepEqual(envelope.project, seed.createSeedProject())
      assert.equal(Object.hasOwn(envelope, 'zoomStep'), false)
      assert.equal(Object.hasOwn(envelope, 'sidebarPaneHeights'), false)

      const remount = createRoot()
      mountChromeShell(remount, model.createStore(), { storage })
      const prefs = JSON.parse(storage.getItem(persist.PREFS_KEY))
      assert.equal(paneHeight(remount, 'palette'), `${prefs.sidebarPaneHeights.palette}px`)
      assert.equal(paneHeight(remount, 'mappings'), `${prefs.sidebarPaneHeights.mappings}px`)
      assert.equal(paneHeight(remount, 'unbound'), `${prefs.sidebarPaneHeights.unbound}px`)
    } finally {
      restoreDoc()
    }
  })

  it('savePrefs / splitter commit fail soft when setItem throws', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      assert.doesNotThrow(() => {
        persist.savePrefs(
          {
            zoomStep: '100%',
            panXY: { x: 0, y: 0 },
            sidebarPaneHeights: { palette: 140, mappings: 160, unbound: 120 },
          },
          {
            getItem() {
              return null
            },
            setItem() {
              throw new Error('quota exceeded')
            },
            removeItem() {},
          },
        )
      })

      const throwingStorage = {
        getItem(key) {
          if (key === persist.PREFS_KEY) {
            return JSON.stringify({
              zoomStep: '100%',
              panXY: { x: 0, y: 0 },
              sidebarPaneHeights: {
                palette: 140,
                mappings: 220,
                unbound: 180,
              },
            })
          }
          return null
        },
        setItem() {
          throw new Error('quota exceeded')
        },
        removeItem() {},
      }

      const root = createRoot()
      mountChromeShell(root, model.createStore(), { storage: throwingStorage })
      const splitter1 = root.querySelector('[data-sidebar-splitter="1"]')
      assert.doesNotThrow(() => {
        splitter1.dispatchEvent({
          type: 'pointerdown',
          button: 0,
          clientY: 200,
          pointerId: 1,
          preventDefault() {},
        })
        globalThis.window.dispatchEvent({
          type: 'pointermove',
          clientY: 240,
          pointerId: 1,
        })
        globalThis.window.dispatchEvent({ type: 'pointerup', pointerId: 1 })
      })
    } finally {
      restoreDoc()
    }
  })

  it('pointercancel ends drag without prefs commit; release throw still cleans up', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const storage = persist.createMemoryStorage()
      const prefsBefore = {
        zoomStep: '100%',
        panXY: { x: 0, y: 0 },
        sidebarPaneHeights: {
          palette: 140,
          mappings: 220,
          unbound: 180,
        },
      }
      storage.setItem(persist.PREFS_KEY, JSON.stringify(prefsBefore))

      const root = createRoot()
      mountChromeShell(root, model.createStore(), { storage })
      const splitter1 = root.querySelector('[data-sidebar-splitter="1"]')

      splitter1.dispatchEvent({
        type: 'pointerdown',
        button: 0,
        clientY: 200,
        pointerId: 1,
        preventDefault() {},
      })
      globalThis.window.dispatchEvent({
        type: 'pointermove',
        clientY: 240,
        pointerId: 1,
      })
      assert.equal(paneHeight(root, 'palette'), '180px')

      globalThis.window.dispatchEvent({
        type: 'pointercancel',
        pointerId: 1,
      })

      // Cancel must not commit prefs (spec: write on pointer-up only).
      assert.deepEqual(JSON.parse(storage.getItem(persist.PREFS_KEY)), prefsBefore)
      assert.equal(splitter1.classList.contains('is-dragging'), false)
      // Live heights must snap back (same contract as canvas pan cancel).
      assert.equal(paneHeight(root, 'palette'), '140px')
      assert.equal(paneHeight(root, 'mappings'), '220px')
      assert.equal(paneHeight(root, 'unbound'), '180px')

      // Remount from saved prefs; a full pointerup cycle must commit.
      const root2 = createRoot()
      mountChromeShell(root2, model.createStore(), { storage })
      const splitter2 = root2.querySelector('[data-sidebar-splitter="1"]')
      splitter2.dispatchEvent({
        type: 'pointerdown',
        button: 0,
        clientY: 200,
        pointerId: 2,
        preventDefault() {},
      })
      globalThis.window.dispatchEvent({
        type: 'pointermove',
        clientY: 240,
        pointerId: 2,
      })
      globalThis.window.dispatchEvent({ type: 'pointerup', pointerId: 2 })
      const afterUp = JSON.parse(storage.getItem(persist.PREFS_KEY))
      assert.equal(afterUp.sidebarPaneHeights.palette, 180)
      assert.equal(afterUp.sidebarPaneHeights.mappings, 180)

      // releasePointerCapture throw must not skip listener cleanup / commit.
      storage.setItem(persist.PREFS_KEY, JSON.stringify(prefsBefore))
      const root3 = createRoot()
      mountChromeShell(root3, model.createStore(), { storage })
      const splitterThrow = root3.querySelector('[data-sidebar-splitter="1"]')
      splitterThrow.releasePointerCapture = () => {
        throw new Error('already released')
      }
      assert.doesNotThrow(() => {
        splitterThrow.dispatchEvent({
          type: 'pointerdown',
          button: 0,
          clientY: 200,
          pointerId: 7,
          preventDefault() {},
        })
        globalThis.window.dispatchEvent({
          type: 'pointermove',
          clientY: 230,
          pointerId: 7,
        })
        globalThis.window.dispatchEvent({ type: 'pointerup', pointerId: 7 })
      })
      assert.equal(splitterThrow.classList.contains('is-dragging'), false)
      const afterThrow = JSON.parse(storage.getItem(persist.PREFS_KEY))
      assert.equal(afterThrow.sidebarPaneHeights.palette, 170)
    } finally {
      restoreDoc()
    }
  })

  it('splitter drag ignores foreign pointerId and re-entrant pointerdown', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const storage = persist.createMemoryStorage()
      storage.setItem(
        persist.PREFS_KEY,
        JSON.stringify({
          zoomStep: '100%',
          panXY: { x: 0, y: 0 },
          sidebarPaneHeights: {
            palette: 140,
            mappings: 220,
            unbound: 180,
          },
        }),
      )
      const root = createRoot()
      mountChromeShell(root, model.createStore(), { storage })
      const splitter1 = root.querySelector('[data-sidebar-splitter="1"]')

      splitter1.dispatchEvent({
        type: 'pointerdown',
        button: 0,
        clientY: 200,
        pointerId: 1,
        preventDefault() {},
      })

      // Foreign move must not resize.
      globalThis.window.dispatchEvent({
        type: 'pointermove',
        clientY: 280,
        pointerId: 99,
      })
      assert.equal(paneHeight(root, 'palette'), '140px')

      // Re-entrant pointerdown must not stack a second session.
      splitter1.dispatchEvent({
        type: 'pointerdown',
        button: 0,
        clientY: 200,
        pointerId: 2,
        preventDefault() {},
      })
      globalThis.window.dispatchEvent({
        type: 'pointermove',
        clientY: 240,
        pointerId: 1,
      })
      assert.equal(paneHeight(root, 'palette'), '180px')

      // Foreign up must not end the active drag.
      globalThis.window.dispatchEvent({ type: 'pointerup', pointerId: 99 })
      assert.equal(splitter1.classList.contains('is-dragging'), true)

      globalThis.window.dispatchEvent({ type: 'pointerup', pointerId: 1 })
      assert.equal(splitter1.classList.contains('is-dragging'), false)
      const saved = JSON.parse(storage.getItem(persist.PREFS_KEY))
      assert.equal(saved.sidebarPaneHeights.palette, 180)
    } finally {
      restoreDoc()
    }
  })

  it('New confirm: replaces store via applySeedBaseline; prefs untouched', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const storage = persist.createMemoryStorage()
      storage.setItem(
        persist.PREFS_KEY,
        JSON.stringify({
          zoomStep: '125%',
          panXY: { x: 1, y: 2 },
          sidebarPaneHeights: { palette: 150, mappings: 170, unbound: 130 },
        }),
      )
      const prefsBefore = storage.getItem(persist.PREFS_KEY)

      const store = model.createStore()
      persist.attachAutosave(store, storage)
      store.apply({
        project: sampleEditedProject(seed.createSeedProject()),
        session: sampleSession(),
      })

      const root = createRoot()
      mountChromeShell(root, store, { storage })

      const newButton = findButtonByLabel(root, 'New')
      assert.ok(newButton)
      assert.equal(newButton.disabled, false)
      newButton.click()

      const scrim = root.querySelector('[data-boot-confirm]')
      assert.ok(scrim)
      const body = scrim.children[0]?.children[0]
      assert.equal(body?.textContent, NEW_CONFIRM_BODY)

      findButtonByLabel(scrim, 'New').click()

      assert.equal(root.querySelector('[data-boot-confirm]'), null)
      assert.deepEqual(store.getState().project, seed.createSeedProject())
      assert.deepEqual(store.getState().session, model.createEmptySession())
      assert.equal(storage.getItem(persist.PREFS_KEY), prefsBefore)
      assert.equal(root.querySelector('[data-chrome-skin-select]')?.value, '')
      assert.equal(
        root.querySelector('[data-context-value="skin"]')?.textContent,
        '—',
      )
      assert.equal(
        root.querySelector('[data-context-value="object"]')?.textContent,
        '—',
      )
      assert.equal(
        root.querySelector('[data-context-value="state"]')?.textContent,
        '—',
      )
    } finally {
      restoreDoc()
    }
  })

  it('canvas pan drag + arrow: prefs merge-write, transform live, envelope isolation', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const canvas = await importCompiledTs('src/canvas/index.ts')
    const { bootProjectStore } = await importCompiledTs('src/boot-project.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      assert.match(baseCss, /\[data-canvas-host\]:focus/)
      assert.match(baseCss, /\.canvas-host\s*\{[^}]*overflow:\s*hidden/s)

      const storage = persist.createMemoryStorage()
      storage.setItem(
        persist.PREFS_KEY,
        JSON.stringify({
          zoomStep: '100%',
          panXY: { x: 10, y: 20 },
          sidebarPaneHeights: { palette: 140, mappings: 160, unbound: 120 },
        }),
      )
      const store = model.createStore()
      bootProjectStore(store, storage)
      const envelopeBefore = storage.getItem(persist.PROJECT_ENVELOPE_KEY)
      assert.notEqual(envelopeBefore, null)

      const root = createRoot()
      mountChromeShell(root, store, { storage })

      const canvasHost = root.querySelector('[data-canvas-host]')
      assert.ok(canvasHost)
      assert.equal(canvasHost.tabIndex, 0)
      assert.equal(
        canvasSurfaceTransform(root),
        'translate(10px, 20px) scale(1)',
      )

      // Click-drag pan: visual updates on move; prefs commit on pointer-up only.
      canvasHost.dispatchEvent({
        type: 'pointerdown',
        button: 0,
        clientX: 100,
        clientY: 100,
        pointerId: 1,
        preventDefault() {},
      })
      assert.equal(canvasHost._focused, true)
      globalThis.window.dispatchEvent({
        type: 'pointermove',
        clientX: 130,
        clientY: 115,
        pointerId: 1,
      })
      assert.equal(
        canvasSurfaceTransform(root),
        'translate(40px, 35px) scale(1)',
      )
      assert.deepEqual(JSON.parse(storage.getItem(persist.PREFS_KEY)).panXY, {
        x: 10,
        y: 20,
      })

      globalThis.window.dispatchEvent({
        type: 'pointerup',
        clientX: 130,
        clientY: 115,
        pointerId: 1,
      })

      const afterDrag = JSON.parse(storage.getItem(persist.PREFS_KEY))
      assert.deepEqual(afterDrag.panXY, { x: 40, y: 35 })
      assert.equal(afterDrag.zoomStep, '100%')
      assert.deepEqual(afterDrag.sidebarPaneHeights, {
        palette: 140,
        mappings: 160,
        unbound: 120,
      })
      assert.equal(
        canvasSurfaceTransform(root),
        'translate(40px, 35px) scale(1)',
      )
      assert.equal(storage.getItem(persist.PROJECT_ENVELOPE_KEY), envelopeBefore)

      // Arrow pan when focused: ±16px, preventDefault, prefs commit each step.
      let prevented = false
      canvasHost.dispatchEvent({
        type: 'keydown',
        key: 'ArrowRight',
        preventDefault() {
          prevented = true
        },
      })
      assert.equal(prevented, true)
      assert.deepEqual(JSON.parse(storage.getItem(persist.PREFS_KEY)).panXY, {
        x: 40 + canvas.ARROW_PAN_STEP_PX,
        y: 35,
      })
      assert.equal(
        canvasSurfaceTransform(root),
        `translate(${40 + canvas.ARROW_PAN_STEP_PX}px, 35px) scale(1)`,
      )

      canvasHost.dispatchEvent({
        type: 'keydown',
        key: 'ArrowUp',
        preventDefault() {},
      })
      assert.deepEqual(JSON.parse(storage.getItem(persist.PREFS_KEY)).panXY, {
        x: 40 + canvas.ARROW_PAN_STEP_PX,
        y: 35 - canvas.ARROW_PAN_STEP_PX,
      })
      assert.equal(
        canvasSurfaceTransform(root),
        `translate(${40 + canvas.ARROW_PAN_STEP_PX}px, ${35 - canvas.ARROW_PAN_STEP_PX}px) scale(1)`,
      )

      canvasHost.dispatchEvent({
        type: 'keydown',
        key: 'ArrowLeft',
        preventDefault() {},
      })
      assert.deepEqual(JSON.parse(storage.getItem(persist.PREFS_KEY)).panXY, {
        x: 40,
        y: 35 - canvas.ARROW_PAN_STEP_PX,
      })
      assert.equal(
        canvasSurfaceTransform(root),
        `translate(40px, ${35 - canvas.ARROW_PAN_STEP_PX}px) scale(1)`,
      )

      canvasHost.dispatchEvent({
        type: 'keydown',
        key: 'ArrowDown',
        preventDefault() {},
      })
      assert.deepEqual(JSON.parse(storage.getItem(persist.PREFS_KEY)).panXY, {
        x: 40,
        y: 35,
      })
      assert.equal(
        canvasSurfaceTransform(root),
        'translate(40px, 35px) scale(1)',
      )

      // Non-arrow key must not pan.
      const panBeforeOther = JSON.parse(storage.getItem(persist.PREFS_KEY)).panXY
      canvasHost.dispatchEvent({
        type: 'keydown',
        key: 'a',
        preventDefault() {},
      })
      assert.deepEqual(
        JSON.parse(storage.getItem(persist.PREFS_KEY)).panXY,
        panBeforeOther,
      )

      // Unfocused arrows: keydown on another focusable must not pan the canvas.
      const panBeforeUnfocused = JSON.parse(storage.getItem(persist.PREFS_KEY)).panXY
      const zoomSelect = root.querySelector('[data-chrome-zoom-select]')
      assert.ok(zoomSelect)
      zoomSelect.focus?.()
      zoomSelect.dispatchEvent({
        type: 'keydown',
        key: 'ArrowRight',
        preventDefault() {},
      })
      assert.deepEqual(
        JSON.parse(storage.getItem(persist.PREFS_KEY)).panXY,
        panBeforeUnfocused,
      )

      // Envelope isolation after pan writes.
      const envelope = JSON.parse(storage.getItem(persist.PROJECT_ENVELOPE_KEY))
      assert.equal(Object.hasOwn(envelope, 'zoomStep'), false)
      assert.equal(Object.hasOwn(envelope, 'panXY'), false)
      assert.deepEqual(envelope.project, seed.createSeedProject())

      // Drag that never reaches pointer-up (cancel) must not commit.
      // Arrow during open drag must not commit prefs or step the live transform.
      storage.setItem(
        persist.PREFS_KEY,
        JSON.stringify({
          zoomStep: '100%',
          panXY: { x: 0, y: 0 },
          sidebarPaneHeights: {},
        }),
      )
      const rootCancel = createRoot()
      mountChromeShell(rootCancel, model.createStore(), { storage })
      const hostCancel = rootCancel.querySelector('[data-canvas-host]')
      hostCancel.dispatchEvent({
        type: 'pointerdown',
        button: 0,
        clientX: 0,
        clientY: 0,
        pointerId: 2,
        preventDefault() {},
      })
      globalThis.window.dispatchEvent({
        type: 'pointermove',
        clientX: 50,
        clientY: 50,
        pointerId: 2,
      })
      assert.equal(
        canvasSurfaceTransform(rootCancel),
        'translate(50px, 50px) scale(1)',
      )
      hostCancel.dispatchEvent({
        type: 'keydown',
        key: 'ArrowRight',
        preventDefault() {},
      })
      assert.deepEqual(JSON.parse(storage.getItem(persist.PREFS_KEY)).panXY, {
        x: 0,
        y: 0,
      })
      assert.equal(
        canvasSurfaceTransform(rootCancel),
        'translate(50px, 50px) scale(1)',
      )
      globalThis.window.dispatchEvent({
        type: 'pointercancel',
        clientX: 50,
        clientY: 50,
        pointerId: 2,
      })
      assert.deepEqual(JSON.parse(storage.getItem(persist.PREFS_KEY)).panXY, {
        x: 0,
        y: 0,
      })
      assert.equal(
        canvasSurfaceTransform(rootCancel),
        'translate(0px, 0px) scale(1)',
      )

      // Mid-drag live scale must keep non-100% Zoom (applyLiveTransform path).
      storage.setItem(
        persist.PREFS_KEY,
        JSON.stringify({
          zoomStep: '150%',
          panXY: { x: 5, y: 10 },
          sidebarPaneHeights: {},
        }),
      )
      const rootZoomDrag = createRoot()
      mountChromeShell(rootZoomDrag, model.createStore(), { storage })
      const hostZoomDrag = rootZoomDrag.querySelector('[data-canvas-host]')
      assert.equal(
        canvasSurfaceTransform(rootZoomDrag),
        'translate(5px, 10px) scale(1.5)',
      )
      hostZoomDrag.dispatchEvent({
        type: 'pointerdown',
        button: 0,
        clientX: 20,
        clientY: 30,
        pointerId: 3,
        preventDefault() {},
      })
      globalThis.window.dispatchEvent({
        type: 'pointermove',
        clientX: 60,
        clientY: 70,
        pointerId: 3,
      })
      assert.equal(
        canvasSurfaceTransform(rootZoomDrag),
        'translate(45px, 50px) scale(1.5)',
      )
      assert.deepEqual(JSON.parse(storage.getItem(persist.PREFS_KEY)).panXY, {
        x: 5,
        y: 10,
      })
      globalThis.window.dispatchEvent({
        type: 'pointerup',
        clientX: 60,
        clientY: 70,
        pointerId: 3,
      })
      const afterZoomDrag = JSON.parse(storage.getItem(persist.PREFS_KEY))
      assert.deepEqual(afterZoomDrag.panXY, { x: 45, y: 50 })
      assert.equal(afterZoomDrag.zoomStep, '150%')
      assert.equal(
        canvasSurfaceTransform(rootZoomDrag),
        'translate(45px, 50px) scale(1.5)',
      )
    } finally {
      restoreDoc()
    }
  })

  it('canvas Zoom live scale + strip + reopen restore of pan/Zoom transform', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const { bootProjectStore } = await importCompiledTs('src/boot-project.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const storage = persist.createMemoryStorage()
      storage.setItem(
        persist.PREFS_KEY,
        JSON.stringify({
          zoomStep: '100%',
          panXY: { x: 12, y: 34 },
          sidebarPaneHeights: { palette: 140, mappings: 160, unbound: 120 },
        }),
      )
      const store = model.createStore()
      bootProjectStore(store, storage)
      const envelopeBefore = storage.getItem(persist.PROJECT_ENVELOPE_KEY)
      const sessionBefore = store.getState().session

      const root = createRoot()
      mountChromeShell(root, store, { storage })
      assert.equal(
        canvasSurfaceTransform(root),
        'translate(12px, 34px) scale(1)',
      )

      const zoomSelect = root.querySelector('[data-chrome-zoom-select]')
      zoomSelect.value = '150%'
      zoomSelect.dispatchEvent({ type: 'change' })

      assert.equal(
        root.querySelector('[data-context-value="zoom"]')?.textContent,
        '150%',
      )
      assert.equal(
        canvasSurfaceTransform(root),
        'translate(12px, 34px) scale(1.5)',
      )
      const prefs = JSON.parse(storage.getItem(persist.PREFS_KEY))
      assert.equal(prefs.zoomStep, '150%')
      assert.deepEqual(prefs.panXY, { x: 12, y: 34 })
      assert.equal(storage.getItem(persist.PROJECT_ENVELOPE_KEY), envelopeBefore)
      assert.deepEqual(store.getState().session, sessionBefore)
      const envelope = JSON.parse(envelopeBefore)
      assert.equal(Object.hasOwn(envelope, 'zoomStep'), false)
      assert.equal(Object.hasOwn(envelope, 'panXY'), false)

      // Cold reopen: same transform restored from prefs.
      const remount = createRoot()
      mountChromeShell(remount, model.createStore(), { storage })
      assert.equal(
        remount.querySelector('[data-chrome-zoom-select]')?.value,
        '150%',
      )
      assert.equal(
        remount.querySelector('[data-context-value="zoom"]')?.textContent,
        '150%',
      )
      assert.equal(
        canvasSurfaceTransform(remount),
        'translate(12px, 34px) scale(1.5)',
      )
    } finally {
      restoreDoc()
    }
  })

  it('New cancel: store and envelope unchanged; modal closed', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const storage = persist.createMemoryStorage()
      const store = model.createStore()
      persist.attachAutosave(store, storage)
      store.apply({
        project: sampleEditedProject(seed.createSeedProject()),
        session: sampleSession(),
      })
      const before = store.getState()
      const envelopeBefore = storage.getItem(persist.PROJECT_ENVELOPE_KEY)

      const root = createRoot()
      mountChromeShell(root, store, { storage })
      findButtonByLabel(root, 'New').click()
      findButtonByLabel(root.querySelector('[data-boot-confirm]'), 'Cancel').click()

      assert.equal(root.querySelector('[data-boot-confirm]'), null)
      assert.deepEqual(store.getState(), before)
      assert.equal(storage.getItem(persist.PROJECT_ENVELOPE_KEY), envelopeBefore)
    } finally {
      restoreDoc()
    }
  })

  it('Import confirm: replace-all + empty session + history clear; prefs untouched', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const history = await importCompiledTs('src/history/index.ts')
    const io = await importCompiledTs('src/io/index.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const storage = persist.createMemoryStorage()
      storage.setItem(
        persist.PREFS_KEY,
        JSON.stringify({
          zoomStep: '150%',
          panXY: { x: 9, y: 8 },
          sidebarPaneHeights: { palette: 150, mappings: 170, unbound: 130 },
        }),
      )
      const prefsBefore = storage.getItem(persist.PREFS_KEY)

      const store = model.createStore()
      persist.attachAutosave(store, storage)
      store.apply({
        project: sampleEditedProject(seed.createSeedProject()),
        session: sampleSession(),
      })
      history.execute(store, {
        session: {
          selectedObjectTypeId: 'ot-keep',
          selectedStateId: 'st-keep',
          activeSkinId: store.getState().session.activeSkinId,
        },
      })
      assert.equal(history.canUndo(store), true)

      const imported = {
        formatVersion: 1,
        palette: [{ id: 'importedYellow', hex: '#FFCC00' }],
        skins: [
          {
            id: 'imported-skin',
            displayName: 'Imported',
            mappings: [
              {
                objectTypeId: 'headerLed',
                stateId: 'off',
                propertyId: 'fill',
                paletteEntryId: 'importedYellow',
              },
            ],
          },
        ],
        inventory: {
          source: 'import-fixture',
          objectTypes: [
            { id: 'headerLed', states: ['off'], properties: ['fill'] },
          ],
        },
      }

      const root = createRoot()
      mountChromeShell(root, store, { storage })

      const importBtn = findButtonByLabel(root, 'Import')
      assert.ok(importBtn)
      assert.equal(importBtn.disabled, false)
      assert.equal(root.querySelector('[data-chrome-inert="import"]'), null)

      await pickImportJson(root, io.serializeProject(imported))

      const scrim = root.querySelector('[data-import-confirm]')
      assert.ok(scrim)
      const body = scrim.children[0]?.children[0]
      assert.equal(body?.textContent, IMPORT_CONFIRM_BODY)

      findButtonByLabel(scrim, 'Import').click()

      assert.equal(root.querySelector('[data-import-confirm]'), null)
      assert.deepEqual(store.getState().project, imported)
      assert.deepEqual(store.getState().session, model.createEmptySession())
      assert.equal(history.canUndo(store), false)
      assert.equal(history.canRedo(store), false)
      assert.equal(storage.getItem(persist.PREFS_KEY), prefsBefore)
      assert.equal(
        root.querySelector('[data-chrome-zoom-select]')?.value,
        '150%',
      )
      assert.equal(
        root.querySelector('[data-context-value="zoom"]')?.textContent,
        '150%',
      )
    } finally {
      restoreDoc()
    }
  })

  it('Import cancel: store unchanged; prefs untouched', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const io = await importCompiledTs('src/io/index.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const storage = persist.createMemoryStorage()
      storage.setItem(
        persist.PREFS_KEY,
        JSON.stringify({
          zoomStep: '125%',
          panXY: { x: 1, y: 2 },
          sidebarPaneHeights: { palette: 140, mappings: 160, unbound: 120 },
        }),
      )
      const prefsBefore = storage.getItem(persist.PREFS_KEY)

      const store = model.createStore()
      const beforeProject = sampleEditedProject(seed.createSeedProject())
      const beforeSession = sampleSession()
      store.apply({ project: beforeProject, session: beforeSession })

      const root = createRoot()
      mountChromeShell(root, store, { storage })

      await pickImportJson(
        root,
        io.serializeProject({
          formatVersion: 1,
          palette: [],
          skins: [],
          inventory: { objectTypes: [] },
        }),
      )

      findButtonByLabel(root.querySelector('[data-import-confirm]'), 'Cancel').click()

      assert.equal(root.querySelector('[data-import-confirm]'), null)
      assert.deepEqual(store.getState().project, beforeProject)
      assert.deepEqual(store.getState().session, beforeSession)
      assert.equal(storage.getItem(persist.PREFS_KEY), prefsBefore)
    } finally {
      restoreDoc()
    }
  })

  it('Import fail-closed: unsupported formatVersion → MODAL_ACK; no confirm; store unchanged', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const storage = persist.createMemoryStorage()
      const store = model.createStore()
      const before = {
        project: sampleEditedProject(seed.createSeedProject()),
        session: sampleSession(),
      }
      store.apply(before)

      const root = createRoot()
      mountChromeShell(root, store, { storage })

      await pickImportJson(
        root,
        JSON.stringify({
          formatVersion: 99,
          palette: [],
          skins: [],
          inventory: { objectTypes: [] },
        }),
      )

      assert.equal(root.querySelector('[data-import-confirm]'), null)
      const errorScrim = root.querySelector('[data-import-error]')
      assert.ok(errorScrim)
      assert.equal(
        errorScrim.children[0]?.children[0]?.textContent,
        IMPORT_UNSUPPORTED_VERSION_ERROR,
      )
      findButtonByLabel(errorScrim, 'OK').click()
      assert.equal(root.querySelector('[data-import-error]'), null)
      assert.deepEqual(store.getState().project, before.project)
      assert.deepEqual(store.getState().session, before.session)
    } finally {
      restoreDoc()
    }
  })

  it('Import fail-closed: envelope / malformed → DISTINCT_INVALID MODAL_ACK', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const storage = persist.createMemoryStorage()
      const store = model.createStore()
      const beforeProject = sampleEditedProject(seed.createSeedProject())
      store.apply({ project: beforeProject, session: sampleSession() })

      const root = createRoot()
      mountChromeShell(root, store, { storage })

      await pickImportJson(
        root,
        JSON.stringify({
          project: beforeProject,
          session: sampleSession(),
        }),
      )

      assert.equal(root.querySelector('[data-import-confirm]'), null)
      let errorScrim = root.querySelector('[data-import-error]')
      assert.ok(errorScrim)
      assert.equal(
        errorScrim.children[0]?.children[0]?.textContent,
        IMPORT_INVALID_PROJECT_ERROR,
      )
      findButtonByLabel(errorScrim, 'OK').click()

      await pickImportJson(root, 'not-json{{{')
      errorScrim = root.querySelector('[data-import-error]')
      assert.ok(errorScrim)
      assert.equal(
        errorScrim.children[0]?.children[0]?.textContent,
        IMPORT_INVALID_PROJECT_ERROR,
      )
      assert.deepEqual(store.getState().project, beforeProject)
    } finally {
      restoreDoc()
    }
  })

  it('Import confirm dismisses open Skin delete confirm before apply', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const io = await importCompiledTs('src/io/index.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const storage = persist.createMemoryStorage()
      const store = model.createStore()
      store.apply({
        project: sampleEditedProject(seed.createSeedProject()),
        session: sampleSession(),
      })

      const imported = {
        formatVersion: 1,
        palette: [{ id: 'importedYellow', hex: '#FFCC00' }],
        skins: [
          {
            id: 'imported-skin',
            displayName: 'Imported',
            mappings: [],
          },
        ],
        inventory: { objectTypes: [] },
      }

      const root = createRoot()
      mountChromeShell(root, store, { storage })

      // Sibling delete scrim (same selector dismissDeleteConfirms removes).
      // Planted: chrome mock lacks Element.closest that Skin delete UI needs.
      const deleteScrim = createElement('div')
      deleteScrim.setAttribute('data-skin-delete-confirm', '')
      root.append(deleteScrim)
      assert.ok(root.querySelector('[data-skin-delete-confirm]'))

      await pickImportJson(root, io.serializeProject(imported))
      findButtonByLabel(root.querySelector('[data-import-confirm]'), 'Import').click()

      assert.equal(root.querySelector('[data-skin-delete-confirm]'), null)
      assert.equal(root.querySelector('[data-import-confirm]'), null)
      assert.deepEqual(store.getState().project, imported)
    } finally {
      restoreDoc()
    }
  })

  it('New↔Import one-deep: Import confirm/error dismisses open New', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const io = await importCompiledTs('src/io/index.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const storage = persist.createMemoryStorage()
      const store = model.createStore()
      store.apply({
        project: sampleEditedProject(seed.createSeedProject()),
        session: sampleSession(),
      })
      const root = createRoot()
      mountChromeShell(root, store, { storage })

      findButtonByLabel(root, 'New').click()
      assert.ok(root.querySelector('[data-boot-confirm]'))
      await pickImportJson(
        root,
        io.serializeProject({
          formatVersion: 1,
          palette: [],
          skins: [],
          inventory: { objectTypes: [] },
        }),
      )
      assert.equal(root.querySelector('[data-boot-confirm]'), null)
      assert.ok(root.querySelector('[data-import-confirm]'))
      findButtonByLabel(root.querySelector('[data-import-confirm]'), 'Cancel').click()

      findButtonByLabel(root, 'New').click()
      assert.ok(root.querySelector('[data-boot-confirm]'))
      await pickImportJson(
        root,
        JSON.stringify({
          formatVersion: 99,
          palette: [],
          skins: [],
          inventory: { objectTypes: [] },
        }),
      )
      assert.equal(root.querySelector('[data-boot-confirm]'), null)
      assert.equal(root.querySelector('[data-import-confirm]'), null)
      assert.ok(root.querySelector('[data-import-error]'))
    } finally {
      restoreDoc()
    }
  })

  it('New↔Import one-deep: New dismisses open Import confirm/error', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const io = await importCompiledTs('src/io/index.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const storage = persist.createMemoryStorage()
      const store = model.createStore()
      store.apply({
        project: sampleEditedProject(seed.createSeedProject()),
        session: sampleSession(),
      })
      const root = createRoot()
      mountChromeShell(root, store, { storage })

      await pickImportJson(
        root,
        io.serializeProject({
          formatVersion: 1,
          palette: [],
          skins: [],
          inventory: { objectTypes: [] },
        }),
      )
      assert.ok(root.querySelector('[data-import-confirm]'))
      findButtonByLabel(root, 'New').click()
      assert.equal(root.querySelector('[data-import-confirm]'), null)
      assert.ok(root.querySelector('[data-boot-confirm]'))
      findButtonByLabel(root.querySelector('[data-boot-confirm]'), 'Cancel').click()

      await pickImportJson(
        root,
        JSON.stringify({
          formatVersion: 99,
          palette: [],
          skins: [],
          inventory: { objectTypes: [] },
        }),
      )
      assert.ok(root.querySelector('[data-import-error]'))
      findButtonByLabel(root, 'New').click()
      assert.equal(root.querySelector('[data-import-error]'), null)
      assert.ok(root.querySelector('[data-boot-confirm]'))
    } finally {
      restoreDoc()
    }
  })

  it('Import fail-closed: file.text() reject → DISTINCT_INVALID MODAL_ACK; store unchanged', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const storage = persist.createMemoryStorage()
      const store = model.createStore()
      const beforeProject = sampleEditedProject(seed.createSeedProject())
      const beforeSession = sampleSession()
      store.apply({ project: beforeProject, session: beforeSession })

      const root = createRoot()
      mountChromeShell(root, store, { storage })

      await pickImportFile(root, {
        name: 'unreadable.json',
        async text() {
          throw new Error('read failed')
        },
      })

      assert.equal(root.querySelector('[data-import-confirm]'), null)
      const errorScrim = root.querySelector('[data-import-error]')
      assert.ok(errorScrim)
      assert.equal(
        errorScrim.children[0]?.children[0]?.textContent,
        IMPORT_INVALID_PROJECT_ERROR,
      )
      assert.deepEqual(store.getState().project, beforeProject)
      assert.deepEqual(store.getState().session, beforeSession)
    } finally {
      restoreDoc()
    }
  })
})

/** Simulate hidden file-input change with a project JSON string. */
async function pickImportJson(root, text) {
  await pickImportFile(root, {
    name: 'matrix-control-skin-studio.json',
    async text() {
      return text
    },
  })
}

/** Simulate hidden file-input change with a custom File-like object. */
async function pickImportFile(root, file) {
  const input = root.querySelector('[data-chrome-import-file]')
  assert.ok(input, 'expected [data-chrome-import-file]')
  input.files = [file]
  input.dispatchEvent({ type: 'change' })
  // handleImportFilePicked is async (void); flush microtasks + macrotask.
  await Promise.resolve()
  await Promise.resolve()
  await new Promise((resolve) => setTimeout(resolve, 0))
}
