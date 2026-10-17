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
  const dir = mkdtempSync(join(tmpdir(), 'skin-studio-io-import-'))
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

function fixtureInventory() {
  return {
    source: 'test-fixture',
    objectTypes: [
      {
        id: 'headerLed',
        states: ['off', 'on'],
        properties: ['fill'],
      },
    ],
  }
}

function validProject() {
  return {
    formatVersion: 1,
    palette: [{ id: 'duoLedYellow', hex: '#FFCC00' }],
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
    inventory: fixtureInventory(),
  }
}

describe('io import I/O matrix', () => {
  it('package.json registers io-import-matrix', () => {
    assert.match(pkg.scripts?.test ?? '', /io-import-matrix\.test\.mjs/)
  })

  it('v1 happy path: parseProjectDocument returns project', async () => {
    const io = await importCompiledTs('src/io/index.ts')
    const project = validProject()
    const result = io.parseProjectDocument(JSON.stringify(project))
    assert.equal(result.ok, true)
    assert.deepEqual(result.project, project)
  })

  it('v1 with UTF-8 BOM prefix still parses', async () => {
    const io = await importCompiledTs('src/io/index.ts')
    const project = validProject()
    const result = io.parseProjectDocument(
      `\uFEFF${JSON.stringify(project)}`,
    )
    assert.equal(result.ok, true)
    assert.deepEqual(result.project, project)
  })

  it('serialize ↔ parse symmetry for valid docs', async () => {
    const io = await importCompiledTs('src/io/index.ts')
    const project = validProject()
    const json = io.serializeProject(project)
    const result = io.parseProjectDocument(json)
    assert.equal(result.ok, true)
    assert.deepEqual(result.project, {
      formatVersion: 1,
      palette: project.palette,
      skins: project.skins,
      inventory: project.inventory,
    })
  })

  it('unsupported formatVersion: missing / non-1 / newer → fail closed', async () => {
    const io = await importCompiledTs('src/io/index.ts')
    const base = validProject()

    const missing = { ...base }
    delete missing.formatVersion
    assert.deepEqual(io.parseProjectDocument(JSON.stringify(missing)), {
      ok: false,
      reason: 'unsupported-format-version',
    })

    assert.deepEqual(
      io.parseProjectDocument(JSON.stringify({ ...base, formatVersion: 2 })),
      { ok: false, reason: 'unsupported-format-version' },
    )

    assert.deepEqual(
      io.parseProjectDocument(JSON.stringify({ ...base, formatVersion: '1' })),
      { ok: false, reason: 'unsupported-format-version' },
    )

    assert.deepEqual(
      io.parseProjectDocument(JSON.stringify({ ...base, formatVersion: 0 })),
      { ok: false, reason: 'unsupported-format-version' },
    )
  })

  it('envelope { project, session } → invalid-project (not handoff)', async () => {
    const io = await importCompiledTs('src/io/index.ts')
    const envelope = {
      project: validProject(),
      session: {
        selectedObjectTypeId: 'headerLed',
        selectedStateId: 'on',
        activeSkinId: 'black-duo',
      },
    }
    assert.deepEqual(io.parseProjectDocument(JSON.stringify(envelope)), {
      ok: false,
      reason: 'invalid-project',
    })
  })

  it('non-JSON / unreadable → invalid-project', async () => {
    const io = await importCompiledTs('src/io/index.ts')
    assert.deepEqual(io.parseProjectDocument('not-json{{{'), {
      ok: false,
      reason: 'invalid-project',
    })
    assert.deepEqual(io.parseProjectDocument('null'), {
      ok: false,
      reason: 'invalid-project',
    })
    assert.deepEqual(io.parseProjectDocument('[]'), {
      ok: false,
      reason: 'invalid-project',
    })
  })

  it('malformed v1 (bad shapes / hex mapping id) → invalid-project', async () => {
    const io = await importCompiledTs('src/io/index.ts')

    assert.deepEqual(
      io.parseProjectDocument(
        JSON.stringify({
          formatVersion: 1,
          palette: 'nope',
          skins: [],
          inventory: { objectTypes: [] },
        }),
      ),
      { ok: false, reason: 'invalid-project' },
    )

    assert.deepEqual(
      io.parseProjectDocument(
        JSON.stringify({
          formatVersion: 1,
          palette: [{ id: 'x', hex: 'not-hex' }],
          skins: [],
          inventory: { objectTypes: [] },
        }),
      ),
      { ok: false, reason: 'invalid-project' },
    )

    assert.deepEqual(
      io.parseProjectDocument(
        JSON.stringify({
          formatVersion: 1,
          palette: [{ id: 'x', hex: '#FFCC00' }],
          skins: [
            {
              id: 's',
              displayName: 'S',
              mappings: [
                {
                  objectTypeId: 'ot',
                  stateId: 'st',
                  propertyId: 'p',
                  paletteEntryId: '#FFCC00',
                },
              ],
            },
          ],
          inventory: { objectTypes: [] },
        }),
      ),
      { ok: false, reason: 'invalid-project' },
    )

    assert.deepEqual(
      io.parseProjectDocument(
        JSON.stringify({
          formatVersion: 1,
          palette: [],
          skins: [],
          inventory: { objectTypes: 'nope' },
        }),
      ),
      { ok: false, reason: 'invalid-project' },
    )
  })
})
