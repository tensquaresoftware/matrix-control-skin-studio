import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
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

/**
 * Emit one src/*.ts file via the TypeScript CLI and import it.
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
    const outJs = join(dir, basename(relPath, '.ts') + '.js')
    return await import(pathToFileURL(outJs).href)
  } finally {
    rmSync(dir, { recursive: true, force: true })
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

  it('happy-path boot row: pins, no UI framework, module stubs, boot surface', async () => {
    assert.equal(pkg.scripts?.dev, 'vite')
    assert.equal(pkg.scripts?.preview, 'vite preview')
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
      assert.match(main, new RegExp(`import\\s+['"]\\./${mod}['"]`))
    }

    // Entry must call the helper with #app (no silent skip). Full main import
    // needs CSS/DOM loaders; assert wiring + execute the helper instead.
    assert.match(
      main,
      /mountBootSurface\s*\(\s*document\.querySelector(?:<[^>]+>)?\s*\(\s*['"]#app['"]\s*\)\s*\)/,
    )
    assert.doesNotMatch(main, /if\s*\(\s*app\s*\)/)

    assert.ok(existsSync(join(root, 'src/styles/base.css')))
    const stylesIndex = readFileSync(join(root, 'src/styles/index.ts'), 'utf8')
    assert.match(stylesIndex, /base\.css/)
    assert.ok(existsSync(join(root, 'public/.gitkeep')))

    const { mountBootSurface } = await importCompiledTs('src/boot-surface.ts')
    const el = { textContent: '' }
    mountBootSurface(/** @type {HTMLElement} */ (el))
    assert.equal(el.textContent, 'Skin Studio')
    assert.throws(() => mountBootSurface(null))
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
