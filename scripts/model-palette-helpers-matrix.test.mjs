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
  const dir = mkdtempSync(join(tmpdir(), 'skin-studio-palette-helpers-'))
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

/** Fixture inventory — seed stays empty; matrices inject objectTypes. */
function fixtureInventory() {
  return {
    source: 'test-fixture',
    objectTypes: [
      {
        id: 'headerLed',
        states: ['off', 'on'],
        properties: ['fill'],
      },
      {
        id: 'knob',
        states: ['normal'],
        properties: ['ring'],
      },
    ],
  }
}

function sampleProject(overrides = {}) {
  return {
    formatVersion: 1,
    palette: [{ id: 'duoLedYellow', hex: '#FFCC00', constantName: 'kDuoLedYellow' }],
    skins: [
      {
        id: 'black-duo',
        displayName: 'Black/Duo',
        mappings: [
          {
            objectTypeId: 'headerLed',
            stateId: 'on',
            propertyId: 'fill',
            paletteEntryId: 'duoLedYellow',
          },
          {
            objectTypeId: 'headerLed',
            stateId: 'off',
            propertyId: 'fill',
            paletteEntryId: null,
          },
          {
            objectTypeId: 'knob',
            stateId: 'normal',
            propertyId: 'ring',
            paletteEntryId: 'missingId',
          },
          // Orphan — outside loaded inventory; must not count.
          {
            objectTypeId: 'orphanType',
            stateId: 'x',
            propertyId: 'y',
            paletteEntryId: null,
          },
        ],
      },
    ],
    inventory: fixtureInventory(),
    ...overrides,
  }
}

function hitKey(hit) {
  return `${hit.skinId}|${hit.objectTypeId}|${hit.stateId}|${hit.propertyId}`
}

describe('model palette helpers matrix', () => {
  it('registers model-palette-helpers-matrix in npm test', () => {
    assert.match(pkg.scripts?.test ?? '', /model-palette-helpers-matrix\.test\.mjs/)
  })

  it('resolvePaletteHex: id → opaque hex; null / missing / bad hex → null', async () => {
    const {
      resolvePaletteHex,
      parseOpaqueHex,
      looksLikeOpaqueHexToken,
    } = await importCompiledTs('src/model/index.ts')
    const project = sampleProject()

    assert.equal(resolvePaletteHex(project, 'duoLedYellow'), '#FFCC00')
    assert.equal(resolvePaletteHex(project, null), null)
    assert.equal(resolvePaletteHex(project, 'missingId'), null)
    assert.equal(
      resolvePaletteHex(
        sampleProject({
          palette: [{ id: 'bad', hex: 'not-hex' }],
        }),
        'bad',
      ),
      null,
    )
    assert.equal(parseOpaqueHex('#aabbcc'), '#AABBCC')
    assert.equal(looksLikeOpaqueHexToken('FFCC00'), true)
    assert.equal(looksLikeOpaqueHexToken('#FFCC00'), true)
    assert.equal(looksLikeOpaqueHexToken('duoLedYellow'), false)
  })

  it('deriveUnbound: empty inventory ⇒ 0 unbound', async () => {
    const { deriveUnbound } = await importCompiledTs('src/model/index.ts')
    const project = sampleProject({ inventory: { objectTypes: [] } })
    assert.deepEqual(deriveUnbound(project), [])
  })

  it('deriveUnbound: missing / null / dangling count; bound and orphan do not', async () => {
    const { deriveUnbound, isMappingUnbound } = await importCompiledTs(
      'src/model/index.ts',
    )
    const project = sampleProject()
    // Required slots: headerLed×{off,on}×fill + knob×normal×ring = 3
    // Bound: on/fill; null: off/fill; dangling: knob/ring; missing: none extra
    // Wait — all three inventory slots have mappings. Bound on/fill excluded.
    const hits = deriveUnbound(project)
    assert.equal(hits.length, 2)
    const keys = new Set(hits.map(hitKey))
    assert.ok(keys.has('black-duo|headerLed|off|fill'))
    assert.ok(keys.has('black-duo|knob|normal|ring'))
    assert.equal(keys.has('black-duo|headerLed|on|fill'), false)
    assert.equal(keys.has('black-duo|orphanType|x|y'), false)

    assert.equal(
      isMappingUnbound(project, project.skins[0].mappings[0]),
      false,
    )
    assert.equal(
      isMappingUnbound(project, project.skins[0].mappings[1]),
      true,
    )
  })

  it('deriveUnbound: missing Mapping row counts as unbound', async () => {
    const { deriveUnbound } = await importCompiledTs('src/model/index.ts')
    const project = sampleProject({
      skins: [
        {
          id: 'black-duo',
          displayName: 'Black/Duo',
          mappings: [],
        },
      ],
    })
    // 2 states × 1 prop for headerLed + 1 for knob = 3
    const hits = deriveUnbound(project)
    assert.equal(hits.length, 3)
    assert.ok(
      hits.every(
        (hit) =>
          hit.skinId === 'black-duo' &&
          hit.objectTypeId != null &&
          hit.stateId != null &&
          hit.propertyId != null,
      ),
    )
    assert.equal(
      hits.some((hit) => hit.objectTypeId === 'headerLed' && hit.stateId === 'off'),
      true,
    )
  })

  it('resolvePaletteLabel: constantName SSOT, else id; missing → raw id', async () => {
    const { resolvePaletteLabel, paletteEntryDisplayName } =
      await importCompiledTs('src/model/index.ts')
    const project = sampleProject({
      palette: [
        { id: 'blue', hex: '#3D7EFF', constantName: 'kBlue' },
        { id: 'anon', hex: '#111111' },
      ],
    })
    assert.equal(resolvePaletteLabel(project, 'blue'), 'kBlue')
    assert.equal(resolvePaletteLabel(project, 'anon'), 'anon')
    assert.equal(resolvePaletteLabel(project, 'missing'), 'missing')
    assert.equal(resolvePaletteLabel(project, null), '')
    assert.equal(
      paletteEntryDisplayName({ id: 'blue', hex: '#3D7EFF', constantName: 'kBlue' }),
      'kBlue',
    )
  })

  it('upsertMapping: identical binding keeps the same array reference', async () => {
    const { upsertMapping } = await importCompiledTs('src/model/index.ts')
    const before = [
      {
        objectTypeId: 'headerLed',
        stateId: 'on',
        propertyId: 'fill',
        paletteEntryId: 'duoLedYellow',
      },
    ]
    const same = upsertMapping(before, {
      objectTypeId: 'headerLed',
      stateId: 'on',
      propertyId: 'fill',
      paletteEntryId: 'duoLedYellow',
    })
    assert.equal(same, before)

    const rebound = upsertMapping(before, {
      objectTypeId: 'headerLed',
      stateId: 'on',
      propertyId: 'fill',
      paletteEntryId: 'other',
    })
    assert.notEqual(rebound, before)
    assert.equal(rebound[0].paletteEntryId, 'other')
  })

  it('deriveUnbound: unreadable palette hex counts; valid hex clears the hit', async () => {
    const { deriveUnbound } = await importCompiledTs('src/model/index.ts')
    const inventory = {
      source: 'test-fixture',
      objectTypes: [
        { id: 'headerLed', states: ['on'], properties: ['fill'] },
      ],
    }
    const withBadHex = sampleProject({
      inventory,
      palette: [{ id: 'badHex', hex: 'not-a-colour', constantName: 'Bad' }],
      skins: [
        {
          id: 'black-duo',
          displayName: 'Black/Duo',
          mappings: [
            {
              objectTypeId: 'headerLed',
              stateId: 'on',
              propertyId: 'fill',
              paletteEntryId: 'badHex',
            },
          ],
        },
      ],
    })
    const badHits = deriveUnbound(withBadHex)
    assert.equal(badHits.length, 1)
    assert.equal(hitKey(badHits[0]), 'black-duo|headerLed|on|fill')

    const withValidHex = sampleProject({
      inventory,
      palette: [{ id: 'okHex', hex: '#AABBCC', constantName: 'Ok' }],
      skins: [
        {
          id: 'black-duo',
          displayName: 'Black/Duo',
          mappings: [
            {
              objectTypeId: 'headerLed',
              stateId: 'on',
              propertyId: 'fill',
              paletteEntryId: 'okHex',
            },
          ],
        },
      ],
    })
    assert.deepEqual(deriveUnbound(withValidHex), [])
  })

  it('deriveUnbound: multi-skin project totals every Skin slot', async () => {
    const { deriveUnbound } = await importCompiledTs('src/model/index.ts')
    const project = sampleProject({
      skins: [
        {
          id: 'black',
          displayName: 'Black',
          mappings: [],
        },
        {
          id: 'green',
          displayName: 'Green',
          mappings: [
            {
              objectTypeId: 'headerLed',
              stateId: 'on',
              propertyId: 'fill',
              paletteEntryId: 'duoLedYellow',
            },
          ],
        },
      ],
    })
    // Black: 3 unbound; Green: 2 unbound (on/fill bound) → 5
    const hits = deriveUnbound(project)
    assert.equal(hits.length, 5)
    assert.equal(hits.filter((h) => h.skinId === 'black').length, 3)
    assert.equal(hits.filter((h) => h.skinId === 'green').length, 2)
  })
})
