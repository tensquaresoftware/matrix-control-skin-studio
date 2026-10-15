import assert from 'node:assert/strict'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import { execFileSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tscJs = join(root, 'node_modules/typescript/lib/tsc.js')

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
  const dir = mkdtempSync(join(tmpdir(), 'skin-studio-store-'))
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

describe('store I/O matrix', () => {
  it('boot init: empty ProjectDocument + null session ids', async () => {
    const { createStore, createEmptyProject, createEmptySession } =
      await importCompiledTs('src/model/index.ts')

    const store = createStore()
    const { project, session } = store.getState()

    assert.deepEqual(project, createEmptyProject())
    assert.equal(project.formatVersion, 1)
    assert.deepEqual(project.palette, [])
    assert.deepEqual(project.skins, [])
    assert.deepEqual(project.inventory.objectTypes, [])
    assert.deepEqual(session, createEmptySession())
    assert.equal(session.selectedObjectTypeId, null)
    assert.equal(session.selectedStateId, null)
    assert.equal(session.activeSkinId, null)
  })

  it('boot singleton: initProjectStore / store empty baseline; getState returns clones', async () => {
    const { initProjectStore, store, createEmptyProject, createEmptySession } =
      await importCompiledTs('src/model/index.ts')

    const boot = initProjectStore()
    assert.equal(boot, store)
    assert.deepEqual(boot.getState().project, createEmptyProject())
    assert.deepEqual(boot.getState().session, createEmptySession())

    const snapped = boot.getState()
    snapped.project.palette.push({ id: 'leak', hex: '#000000' })
    snapped.session.activeSkinId = 'leaked'
    assert.deepEqual(boot.getState().project, createEmptyProject())
    assert.deepEqual(boot.getState().session, createEmptySession())
  })

  it('apply project: replaces document, notifies, does not mutate prior nested objects; session unchanged', async () => {
    const { createStore } = await importCompiledTs('src/model/index.ts')
    const store = createStore()

    store.apply({
      session: {
        selectedObjectTypeId: 'ot-1',
        selectedStateId: 'on',
        activeSkinId: 'skin-1',
      },
    })
    const sessionBefore = store.getState().session

    const prior = store.getState().project
    const priorPalette = prior.palette

    let notifyCount = 0
    store.subscribe(() => {
      notifyCount += 1
    })

    const replacement = {
      formatVersion: 1,
      palette: [{ id: 'p1', hex: '#FFCC00' }],
      skins: [
        {
          id: 'skin-1',
          displayName: 'Black/Green',
          mappings: [
            {
              objectTypeId: 'obj',
              stateId: 'idle',
              propertyId: 'fill',
              paletteEntryId: null,
            },
          ],
        },
      ],
      inventory: { objectTypes: [] },
    }

    store.apply({ project: replacement })

    assert.equal(notifyCount, 1)
    const next = store.getState().project
    assert.notEqual(next, prior)
    assert.equal(next.skins.length, 1)
    assert.equal(next.skins[0].mappings[0].paletteEntryId, null)
    assert.deepEqual(prior.palette, priorPalette)
    assert.equal(prior.skins.length, 0)
    // Store owns a clone — mutating the payload after apply must not change state
    replacement.palette.push({ id: 'p2', hex: '#000000' })
    assert.equal(store.getState().project.palette.length, 1)
    // Project-only apply must leave session slice untouched
    assert.deepEqual(store.getState().session, sessionBefore)
    assert.equal(store.getState().session.activeSkinId, 'skin-1')
    assert.equal(store.getState().session.selectedObjectTypeId, 'ot-1')
    assert.equal(store.getState().session.selectedStateId, 'on')
  })

  it('apply session: updates session only; project unchanged; payload isolated', async () => {
    const { createStore } = await importCompiledTs('src/model/index.ts')
    const store = createStore()
    const projectBefore = store.getState().project

    let notifyCount = 0
    store.subscribe(() => {
      notifyCount += 1
    })

    const sessionPayload = {
      selectedObjectTypeId: null,
      selectedStateId: null,
      activeSkinId: 'skin-1',
    }
    store.apply({ session: sessionPayload })

    assert.equal(notifyCount, 1)
    assert.deepEqual(store.getState().project, projectBefore)
    assert.equal(store.getState().session.activeSkinId, 'skin-1')
    assert.equal(store.getState().session.selectedObjectTypeId, null)
    assert.equal(store.getState().session.selectedStateId, null)
    sessionPayload.activeSkinId = 'mutated-after-apply'
    assert.equal(store.getState().session.activeSkinId, 'skin-1')
  })

  it('apply project and session together: both slices update', async () => {
    const { createStore } = await importCompiledTs('src/model/index.ts')
    const store = createStore()

    let notifyCount = 0
    store.subscribe(() => {
      notifyCount += 1
    })

    const projectPayload = {
      formatVersion: 1,
      palette: [{ id: 'p1', hex: '#112233' }],
      skins: [{ id: 'skin-a', displayName: 'Monochrome', mappings: [] }],
      inventory: { objectTypes: [] },
    }
    const sessionPayload = {
      selectedObjectTypeId: 'ot',
      selectedStateId: 'idle',
      activeSkinId: 'skin-a',
    }

    store.apply({ project: projectPayload, session: sessionPayload })

    assert.equal(notifyCount, 1)
    assert.equal(store.getState().project.skins[0].id, 'skin-a')
    assert.equal(store.getState().project.palette[0].id, 'p1')
    assert.equal(store.getState().session.activeSkinId, 'skin-a')
    assert.equal(store.getState().session.selectedObjectTypeId, 'ot')
    assert.equal(store.getState().session.selectedStateId, 'idle')
    projectPayload.palette.push({ id: 'leak', hex: '#000000' })
    sessionPayload.activeSkinId = 'mutated'
    assert.equal(store.getState().project.palette.length, 1)
    assert.equal(store.getState().session.activeSkinId, 'skin-a')
  })

  it('mapping type shape: paletteEntryId string | null; SessionUiState keys only; inventory round-trip', async () => {
    const { createStore } = await importCompiledTs('src/model/index.ts')
    const store = createStore()

    const mappingNull = {
      objectTypeId: 'a',
      stateId: 'b',
      propertyId: 'c',
      paletteEntryId: null,
    }
    const mappingId = {
      objectTypeId: 'a',
      stateId: 'b',
      propertyId: 'c',
      paletteEntryId: 'entry-1',
    }

    store.apply({
      project: {
        formatVersion: 1,
        palette: [{ id: 'entry-1', hex: '#AABBCC' }],
        skins: [
          {
            id: 's',
            displayName: 'Monochrome',
            mappings: [mappingNull, mappingId],
          },
        ],
        inventory: {
          source: 'seed-placeholder',
          objectTypes: [
            {
              id: 'ot',
              states: ['on'],
              properties: ['color'],
            },
          ],
        },
      },
    })

    const { project } = store.getState()
    const skin = project.skins[0]
    assert.equal(skin.mappings[0].paletteEntryId, null)
    assert.equal(skin.mappings[1].paletteEntryId, 'entry-1')
    assert.equal('hex' in skin.mappings[0], false)

    assert.equal(project.inventory.source, 'seed-placeholder')
    assert.equal(project.inventory.objectTypes.length, 1)
    assert.equal(project.inventory.objectTypes[0].id, 'ot')
    assert.deepEqual(project.inventory.objectTypes[0].states, ['on'])
    assert.deepEqual(project.inventory.objectTypes[0].properties, ['color'])

    const sessionKeys = Object.keys(store.getState().session).sort()
    assert.deepEqual(sessionKeys, [
      'activeSkinId',
      'selectedObjectTypeId',
      'selectedStateId',
    ])
  })
})
