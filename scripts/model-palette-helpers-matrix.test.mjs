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
        ],
      },
    ],
    inventory: { objectTypes: [] },
    ...overrides,
  }
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

  it('deriveUnbound: null and dangling ids count; bound resolvable does not', async () => {
    const { deriveUnbound, isMappingUnbound } = await importCompiledTs(
      'src/model/index.ts',
    )
    const project = sampleProject()
    const hits = deriveUnbound(project)
    assert.equal(hits.length, 2)
    assert.equal(hits[0].mapping.paletteEntryId, null)
    assert.equal(hits[1].mapping.paletteEntryId, 'missingId')
    assert.equal(
      isMappingUnbound(project, project.skins[0].mappings[0]),
      false,
    )
    assert.equal(
      isMappingUnbound(project, project.skins[0].mappings[1]),
      true,
    )
  })
})
