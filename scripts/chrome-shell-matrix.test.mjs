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
    },
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

  it('layout tokens: top bar 40px, context 28px, sidebar 320px, splitter hit 6px', () => {
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
    assert.match(
      baseCss,
      /\.chrome-canvas-slot\s*\{[^}]*flex:\s*1/s,
    )
  })

  it('fresh shell mount: chrome geometry, four panes, live Zoom/Skin + stub ops', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const sidebar = await importCompiledTs('src/sidebar/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const store = model.createStore()
      const storage = persist.createMemoryStorage()
      const root = createRoot()
      mountChromeShell(root, store, { storage })

      assert.ok(root.querySelector('[data-chrome-shell]'))
      assert.ok(root.querySelector('[data-chrome-top-bar]'))
      assert.ok(root.querySelector('[data-chrome-context-strip]'))
      assert.ok(root.querySelector('[data-chrome-body]'))
      assert.ok(root.querySelector('[data-canvas-host]'))
      assert.ok(root.querySelector('[data-sidebar]'))

      assert.equal(paneHeight(root, 'picker'), `${sidebar.PICKER_PANE_HEIGHT_PX}px`)
      assert.equal(paneHeight(root, 'palette'), `${sidebar.DEFAULT_PALETTE_HEIGHT_PX}px`)
      assert.equal(paneHeight(root, 'mappings'), `${sidebar.MIN_MAPPINGS_HEIGHT_PX}px`)
      assert.equal(paneHeight(root, 'unbound'), `${sidebar.MIN_UNBOUND_HEIGHT_PX}px`)

      assert.ok(root.querySelector('[data-chrome-new]'))
      assert.ok(root.querySelector('[data-chrome-inert="import"]'))
      assert.ok(root.querySelector('[data-chrome-inert="export"]'))
      assert.ok(root.querySelector('[data-chrome-inert="undo"]'))
      assert.ok(root.querySelector('[data-chrome-inert="redo"]'))
      assert.equal(root.querySelector('[data-chrome-inert="zoom"]'), null)
      assert.equal(root.querySelector('[data-chrome-inert="skin"]'), null)
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
        if (child.getAttribute('data-chrome-inert') === 'import') return 'import'
        if (child.getAttribute('data-chrome-inert') === 'export') return 'export'
        if (child.classList.contains('chrome-top-sep')) return 'sep'
        if (child.getAttribute('data-chrome-inert') === 'undo') return 'undo'
        if (child.getAttribute('data-chrome-inert') === 'redo') return 'redo'
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
      assert.equal(findButtonByLabel(root, 'Import')?.disabled, true)
      assert.equal(findButtonByLabel(root, 'Export')?.disabled, true)
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

  it('Skin combo: lists displayNames, null stays empty, switch preserves Object/State', async () => {
    const model = await importCompiledTs('src/model/index.ts')
    const persist = await importCompiledTs('src/persist/index.ts')
    const seed = await importCompiledTs('src/seed/index.ts')
    const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')
    const restoreDoc = installMinimalDocument()

    try {
      const seedProject = seed.createSeedProject()
      assert.equal(seedProject.skins.length, 5)

      // Null activeSkinId → empty/—; Object/State stay —
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
      assert.ok(rootNull.querySelector('[data-chrome-skin]')?.classList.contains('chrome-skin-combo'))

      // Switch skin: only activeSkinId changes; strip shows displayName
      const storage = persist.createMemoryStorage()
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
      const skinSelect = root.querySelector('[data-chrome-skin-select]')
      assert.equal(skinSelect.value, 'black-green')
      assert.equal(
        root.querySelector('[data-context-value="skin"]')?.textContent,
        'Black/Green',
      )
      assert.equal(
        root.querySelector('[data-context-value="object"]')?.textContent,
        '—',
      )
      assert.equal(
        root.querySelector('[data-context-value="state"]')?.textContent,
        '—',
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
      assert.notEqual(storage.getItem(persist.PROJECT_ENVELOPE_KEY), envelopeBefore)
      const envelope = JSON.parse(storage.getItem(persist.PROJECT_ENVELOPE_KEY))
      assert.equal(envelope.session.activeSkinId, 'monochrome')
      assert.equal(envelope.session.selectedObjectTypeId, 'ot-1')
      assert.equal(Object.hasOwn(envelope, 'zoomStep'), false)

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

      // Orphan activeSkinId on mount → session cleared; combo still lists — + skins
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
})
