import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import { execFileSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const deps = { ...pkg.dependencies, ...pkg.devDependencies }
const tscJs = join(root, 'node_modules/typescript/lib/tsc.js')
const modules = [
  'model',
  'history',
  'persist',
  'io',
  'seed',
  'chrome',
  'canvas',
  'sidebar',
  'styles',
]
const frameworks = ['react', 'preact', 'lit', 'vue', 'svelte']

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

/**
 * Emit a src/*.ts entry (and its relative imports) via tsc, then import the JS.
 * Avoids --experimental-strip-types (Node 22+) so Node 20.19 matches engines.
 */
async function importCompiledTs(relPath) {
  const absPath = join(root, relPath)
  const dir = mkdtempSync(join(tmpdir(), 'skin-studio-scaffold-'))
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

/** Minimal DOM so mountChromeShell can run under Node without a browser. */
function installMinimalDocument() {
  function createElement(tagName) {
    const attrs = new Map()
    const listeners = new Map()
    const classSet = new Set()
    const node = {
      tagName: String(tagName).toUpperCase(),
      type: '',
      textContent: '',
      disabled: false,
      style: { cssText: '', height: '' },
      children: [],
      parent: null,
      classList: {
        add(...names) {
          for (const n of names) classSet.add(n)
        },
        remove(...names) {
          for (const n of names) classSet.delete(n)
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
        const attrEq = /^\[([^=\]]+)="([^"]*)"\]$/.exec(selector)
        const matchAttr = attrEq ? null : /^\[([^\]]+)\]$/.exec(selector)
        const walk = (el) => {
          if (attrEq && el.getAttribute(attrEq[1]) === attrEq[2]) return el
          if (matchAttr && el.getAttribute(matchAttr[1]) !== null) return el
          for (const child of el.children) {
            const found = walk(child)
            if (found) return found
          }
          return null
        }
        return walk(node)
      },
      addEventListener(type, fn) {
        if (!listeners.has(type)) listeners.set(type, [])
        listeners.get(type).push(fn)
      },
      click() {
        for (const fn of listeners.get('click') || []) fn()
      },
      setPointerCapture() {},
      releasePointerCapture() {},
    }
    return node
  }

  const previous = globalThis.document
  const previousWindow = globalThis.window
  globalThis.document = { createElement }
  globalThis.window = {
    addEventListener() {},
    removeEventListener() {},
  }
  return () => {
    if (previous === undefined) delete globalThis.document
    else globalThis.document = previous
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
}

function hasFrameworkDependency(depName, framework) {
  return (
    depName === framework ||
    depName.startsWith(`${framework}/`) ||
    depName.startsWith(`${framework}-`) ||
    depName === `@${framework}` ||
    depName.startsWith(`@${framework}/`)
  )
}

describe('scaffold I/O matrix', () => {
  it('wrong Node row: engines.node matches AD-2 pin', () => {
    assert.equal(pkg.engines?.node, '^20.19.0 || >=22.12.0')
  })

  it('happy-path boot row: pins, no UI framework, module stubs, chrome shell', async () => {
    assert.equal(pkg.scripts?.dev, 'vite')
    assert.equal(pkg.scripts?.preview, 'vite preview')
    assert.match(pkg.scripts?.test ?? '', /scaffold-matrix\.test\.mjs/)
    assert.match(pkg.scripts?.test ?? '', /store-matrix\.test\.mjs/)
    assert.match(pkg.scripts?.test ?? '', /seed-matrix\.test\.mjs/)
    assert.match(pkg.scripts?.test ?? '', /persist-matrix\.test\.mjs/)
    assert.match(pkg.scripts?.test ?? '', /boot-seed-matrix\.test\.mjs/)
    assert.match(pkg.scripts?.test ?? '', /chrome-shell-matrix\.test\.mjs/)
    assert.equal(deps.vite, '8.3.4')
    assert.equal(deps.typescript, '7.0.2')
    for (const name of frameworks) {
      assert.equal(
        Object.keys(deps).some((d) => hasFrameworkDependency(d, name)),
        false,
        `unexpected framework dependency: ${name}`,
      )
    }
    assert.ok(existsSync(join(root, 'vite.config.ts')))
    assert.ok(existsSync(join(root, 'index.html')))
    const html = readFileSync(join(root, 'index.html'), 'utf8')
    assert.match(html, /id="app"/)
    assert.match(html, /\/src\/main\.ts/)

    const main = readFileSync(join(root, 'src/main.ts'), 'utf8')
    for (const mod of modules) {
      assert.ok(existsSync(join(root, 'src', mod, 'index.ts')), `missing stub: ${mod}`)
      assert.match(
        main,
        new RegExp(`import\\s+(?:[^'"\\n]+\\s+from\\s+)?['"]\\./${mod}['"]`),
      )
    }

    // Entry wires the shared helper (seed-if-empty lives inside bootProjectStore).
    assert.match(
      main,
      /import\s*\{[^}]*\bbootProjectStore\b[^}]*\}\s*from\s*['"]\.\/boot-project['"]/,
    )
    assert.match(
      main,
      /(?:const|let)\s+(\w+)\s*=\s*initProjectStore\s*\(\s*\)\s*;?\s*bootProjectStore\s*\(\s*\1\s*\)\s*;?\s*mountChromeShell\s*\(\s*document\.querySelector(?:<[^>]+>)?\s*\(\s*['"]#app['"]\s*\)\s*,\s*\1\s*\)/,
    )
    assert.doesNotMatch(main, /if\s*\(\s*app\s*\)/)
    assert.doesNotMatch(main, /mountBootSurface/)

    assert.ok(existsSync(join(root, 'src/styles/base.css')))
    const stylesIndex = readFileSync(join(root, 'src/styles/index.ts'), 'utf8')
    assert.match(stylesIndex, /base\.css/)
    assert.ok(existsSync(join(root, 'public/.gitkeep')))

    const restoreDoc = installMinimalDocument()
    try {
      const { createStore, createEmptySession } = await importCompiledTs(
        'src/model/index.ts',
      )
      const { createMemoryStorage, PROJECT_ENVELOPE_KEY } = await importCompiledTs(
        'src/persist/index.ts',
      )
      const { createSeedProject } = await importCompiledTs('src/seed/index.ts')
      const { bootProjectStore } = await importCompiledTs('src/boot-project.ts')
      const { mountChromeShell } = await importCompiledTs('src/chrome/index.ts')

      const storage = createMemoryStorage()
      const store = createStore()
      assert.equal(bootProjectStore(store, storage), false)
      assert.deepEqual(store.getState().project, createSeedProject())
      assert.deepEqual(store.getState().session, createEmptySession())
      assert.notEqual(storage.getItem(PROJECT_ENVELOPE_KEY), null)

      const el = {
        children: [],
        replaceChildren() {
          el.children = []
        },
        append(...nodes) {
          el.children.push(...nodes)
        },
        querySelector() {
          return null
        },
      }
      mountChromeShell(/** @type {HTMLElement} */ (el), createStore(), { storage })
      assert.equal(el.children[0]?.getAttribute?.('data-chrome-shell'), '')
      assert.ok(el.children[0]?.querySelector?.('[data-chrome-top-bar]'))
      assert.throws(() => mountChromeShell(null, createStore()))
    } finally {
      restoreDoc()
    }
  })

  it('production build row: npm run build emits dist with Skin Studio', () => {
    execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'pipe' })
    assert.ok(existsSync(join(root, 'dist/index.html')))
    const distHtml = readFileSync(join(root, 'dist/index.html'), 'utf8')
    assert.match(distHtml, /id="app"/)
    const assetsDir = join(root, 'dist/assets')
    assert.ok(existsSync(assetsDir), 'expected dist/assets to exist')
    const distFiles = readdirSync(assetsDir)
    const jsName = distFiles.find((f) => f.endsWith('.js'))
    assert.ok(jsName, 'expected a JS asset in dist/assets')
    const js = readFileSync(join(assetsDir, jsName), 'utf8')
    assert.match(js, /Skin Studio/)
  })
})
