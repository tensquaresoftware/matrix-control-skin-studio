import assert from 'node:assert/strict'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import { execFileSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tscJs = join(root, 'node_modules/typescript/lib/tsc.js')

const V1_DISPLAY_NAMES = [
  'Black/Green',
  'Cream/Green',
  'Black/Duo',
  'Cream/Duo',
  'Monochrome',
]

const V1_SKIN_IDS = [
  'black-green',
  'cream-green',
  'black-duo',
  'cream-duo',
  'monochrome',
]

const REJECTED_NAMES = ['Black/Two-tone', 'Cream/Two-tone', 'Split']

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
 * Nested paths under src/ keep their relative layout under outDir.
 */
async function importCompiledTs(relPath) {
  const absPath = join(root, relPath)
  const dir = mkdtempSync(join(tmpdir(), 'skin-studio-seed-'))
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

describe('seed I/O matrix', () => {
  it('happy seed build: formatVersion 1, five skins, colour Palette, provisional inventory + fill bindings', async () => {
    const { createSeedProject } = await importCompiledTs('src/seed/index.ts')
    const doc = createSeedProject()

    assert.equal(doc.formatVersion, 1)
    assert.equal(doc.skins.length, 5)
    assert.deepEqual(
      doc.skins.map((s) => s.displayName),
      V1_DISPLAY_NAMES,
    )
    assert.deepEqual(
      doc.skins.map((s) => s.id),
      V1_SKIN_IDS,
    )
    assert.equal(doc.palette.length, 3)
    const byId = Object.fromEntries(doc.palette.map((e) => [e.id, e]))
    assert.equal(byId.yellow.hex, '#FFCC00')
    assert.equal(byId.yellow.constantName, 'kYellow')
    assert.equal(byId.blue.hex, '#3D7EFF')
    assert.equal(byId.blue.constantName, 'kBlue')
    assert.equal(byId.orange.hex, '#FF8A1F')
    assert.equal(byId.orange.constantName, 'kOrange')
    assert.equal(doc.inventory.source, 'seed-placeholder')
    assert.deepEqual(
      doc.inventory.objectTypes.map((ot) => ot.id),
      ['headerLed', 'patchBand', 'masterBand'],
    )
    for (const ot of doc.inventory.objectTypes) {
      assert.deepEqual(ot.states, ['default'])
      assert.deepEqual(ot.properties, ['fill'])
    }
  })

  it('rejected names absent from skins[].displayName', async () => {
    const { createSeedProject } = await importCompiledTs('src/seed/index.ts')
    const names = createSeedProject().skins.map((s) => s.displayName)

    for (const rejected of REJECTED_NAMES) {
      assert.equal(names.includes(rejected), false, `rejected name present: ${rejected}`)
    }
  })

  it('mapping discipline: each skin has three fill bindings; no raw-hex mapping fields', async () => {
    const { createSeedProject } = await importCompiledTs('src/seed/index.ts')
    const doc = createSeedProject()
    const expected = [
      {
        objectTypeId: 'headerLed',
        stateId: 'default',
        propertyId: 'fill',
        paletteEntryId: 'yellow',
      },
      {
        objectTypeId: 'patchBand',
        stateId: 'default',
        propertyId: 'fill',
        paletteEntryId: 'blue',
      },
      {
        objectTypeId: 'masterBand',
        stateId: 'default',
        propertyId: 'fill',
        paletteEntryId: 'orange',
      },
    ]

    for (const skin of doc.skins) {
      assert.deepEqual(skin.mappings, expected)
      for (const mapping of skin.mappings) {
        assert.equal('hex' in mapping, false)
        assert.ok('paletteEntryId' in mapping)
        assert.equal(typeof mapping.paletteEntryId, 'string')
        assert.match(mapping.paletteEntryId, /^[a-zA-Z]/)
      }
    }
  })

  it('exported SEED_* are frozen; mutation cannot poison later createSeedProject', async () => {
    const {
      createSeedProject,
      SEED_PALETTE,
      SEED_SKINS,
      SEED_INVENTORY,
    } = await importCompiledTs('src/seed/index.ts')

    assert.equal(Object.isFrozen(SEED_PALETTE), true)
    assert.equal(Object.isFrozen(SEED_PALETTE[0]), true)
    assert.equal(Object.isFrozen(SEED_SKINS), true)
    assert.equal(Object.isFrozen(SEED_SKINS[0]), true)
    assert.equal(Object.isFrozen(SEED_SKINS[0].mappings), true)
    assert.equal(Object.isFrozen(SEED_INVENTORY), true)
    assert.equal(Object.isFrozen(SEED_INVENTORY.objectTypes), true)

    assert.throws(() => {
      SEED_PALETTE[0].hex = '#000000'
    }, TypeError)
    assert.throws(() => {
      SEED_SKINS.push({ id: 'extra', displayName: 'Extra', mappings: [] })
    }, TypeError)
    assert.throws(() => {
      SEED_INVENTORY.source = 'mutated'
    }, TypeError)

    const doc = createSeedProject()
    assert.equal(doc.palette.length, 3)
    assert.equal(doc.palette.find((e) => e.id === 'yellow')?.hex, '#FFCC00')
    assert.equal(doc.skins.length, 5)
    assert.deepEqual(
      doc.skins.map((s) => s.displayName),
      V1_DISPLAY_NAMES,
    )
    assert.equal(doc.inventory.source, 'seed-placeholder')
    assert.equal(doc.inventory.objectTypes.length, 3)
  })

  it('apply path: caller store.apply holds seeded document; seed does not mutate store', async () => {
    const { createSeedProject } = await importCompiledTs('src/seed/index.ts')
    const { createStore, createEmptyProject } = await importCompiledTs('src/model/index.ts')

    const store = createStore()
    assert.deepEqual(store.getState().project, createEmptyProject())

    const seeded = createSeedProject()
    store.apply({ project: seeded })

    const held = store.getState().project
    assert.equal(held.formatVersion, 1)
    assert.equal(held.skins.length, 5)
    assert.deepEqual(
      held.skins.map((s) => s.displayName),
      V1_DISPLAY_NAMES,
    )
    assert.deepEqual(
      held.skins.map((s) => s.id),
      V1_SKIN_IDS,
    )
    assert.equal(held.palette.length, 3)
    assert.equal(held.palette.find((e) => e.id === 'yellow')?.hex, '#FFCC00')
    assert.ok(held.palette.some((e) => e.id === 'blue'))
    assert.ok(held.palette.some((e) => e.id === 'orange'))
    assert.equal(held.inventory.source, 'seed-placeholder')
    assert.equal(held.inventory.objectTypes.length, 3)
    assert.equal(held.skins[0].mappings.length, 3)

    // Mutation after apply must not leak into store (clone ownership)
    seeded.palette.push({ id: 'leak', hex: '#000000' })
    assert.equal(store.getState().project.palette.length, 3)

    // createSeedProject alone never touches store
    const other = createStore()
    createSeedProject()
    assert.deepEqual(other.getState().project, createEmptyProject())
  })
})
