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
  const dir = mkdtempSync(join(tmpdir(), 'skin-studio-io-export-'))
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

function clearProject() {
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
            paletteEntryId: 'duoLedYellow',
          },
        ],
      },
    ],
    inventory: fixtureInventory(),
  }
}

function blockedProject() {
  const project = clearProject()
  project.skins[0].mappings[1].paletteEntryId = null
  return project
}

describe('io export I/O matrix', () => {
  it('package.json registers io-export-matrix', () => {
    assert.match(pkg.scripts?.test ?? '', /io-export-matrix\.test\.mjs/)
  })

  it('empty inventory ⇒ unbound 0 ⇒ export clear (interim Completeness)', async () => {
    const io = await importCompiledTs('src/io/index.ts')
    const project = {
      formatVersion: 1,
      palette: [],
      skins: [{ id: 's', displayName: 'S', mappings: [] }],
      inventory: { objectTypes: [] },
    }
    assert.equal(io.unboundExportCount(project), 0)
    assert.equal(io.isExportBlocked(project), false)
  })

  it('blocked: n > 0 ⇒ isExportBlocked + English tooltip', async () => {
    const io = await importCompiledTs('src/io/index.ts')
    const project = blockedProject()
    const n = io.unboundExportCount(project)
    assert.ok(n > 0)
    assert.equal(io.isExportBlocked(project), true)
    assert.equal(
      io.exportBlockedTooltip(n),
      `Export blocked — ${n} unbound mapping(s)`,
    )
  })

  it('clear: n = 0 ⇒ not blocked; serialize is project-only formatVersion 1', async () => {
    const io = await importCompiledTs('src/io/index.ts')
    const project = clearProject()
    assert.equal(io.unboundExportCount(project), 0)
    assert.equal(io.isExportBlocked(project), false)

    // Pollute input with session/prefs-like keys — output must stay project-only.
    const polluted = {
      ...project,
      session: {
        selectedObjectTypeId: 'headerLed',
        selectedStateId: 'on',
        activeSkinId: 'black-duo',
      },
      zoomStep: '150%',
      panXY: { x: 1, y: 2 },
      sidebarPaneHeights: { palette: 140, mappings: 160, unbound: 120 },
    }
    const json = io.serializeProject(polluted)
    const parsed = JSON.parse(json)
    assert.equal(parsed.formatVersion, 1)
    assert.deepEqual(Object.keys(parsed).sort(), [
      'formatVersion',
      'inventory',
      'palette',
      'skins',
    ])
    assert.equal(Object.hasOwn(parsed, 'session'), false)
    assert.equal(Object.hasOwn(parsed, 'zoomStep'), false)
    assert.equal(Object.hasOwn(parsed, 'panXY'), false)
    assert.equal(Object.hasOwn(parsed, 'sidebarPaneHeights'), false)
    assert.match(json, /\n {2}"formatVersion"/)
  })

  it('mappings stay paletteEntryId strings (or null), never hex', async () => {
    const io = await importCompiledTs('src/io/index.ts')
    const project = clearProject()
    project.skins[0].mappings.push({
      objectTypeId: 'orphan',
      stateId: 'x',
      propertyId: 'y',
      paletteEntryId: null,
    })
    const parsed = JSON.parse(io.serializeProject(project))
    for (const skin of parsed.skins) {
      for (const mapping of skin.mappings) {
        const id = mapping.paletteEntryId
        assert.ok(id === null || typeof id === 'string')
        if (typeof id === 'string') {
          assert.doesNotMatch(id, /^#[0-9A-Fa-f]{6}$/)
        }
      }
    }
    assert.equal(
      parsed.skins[0].mappings.find((m) => m.stateId === 'on').paletteEntryId,
      'duoLedYellow',
    )
  })

  it('multi-skin: gate uses project-total unbound', async () => {
    const io = await importCompiledTs('src/io/index.ts')
    const project = {
      formatVersion: 1,
      palette: [{ id: 'duoLedYellow', hex: '#FFCC00' }],
      skins: [
        {
          id: 'a',
          displayName: 'A',
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
          id: 'b',
          displayName: 'B',
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
    assert.equal(io.unboundExportCount(project), 1)
    assert.equal(io.isExportBlocked(project), true)
  })

  it('downloadProjectJson: filename + blob body; no session keys', async () => {
    const io = await importCompiledTs('src/io/index.ts')
    const project = clearProject()
    const polluted = {
      ...project,
      session: { selectedObjectTypeId: 'ot', selectedStateId: 'st', activeSkinId: 's' },
      zoomStep: '200%',
      panXY: { x: 9, y: 8 },
      sidebarPaneHeights: { palette: 1, mappings: 2, unbound: 3 },
    }
    /** @type {{ blob: Blob, filename: string } | null} */
    let captured = null
    io.downloadProjectJson(polluted, io.EXPORT_DOWNLOAD_FILENAME, {
      triggerDownload(blob, filename) {
        captured = { blob, filename }
      },
    })
    assert.ok(captured)
    assert.equal(captured.filename, 'matrix-control-skin-studio.json')
    const text = await captured.blob.text()
    const parsed = JSON.parse(text)
    assert.equal(parsed.formatVersion, 1)
    assert.deepEqual(Object.keys(parsed).sort(), [
      'formatVersion',
      'inventory',
      'palette',
      'skins',
    ])
    assert.equal(Object.hasOwn(parsed, 'session'), false)
    assert.equal(Object.hasOwn(parsed, 'zoomStep'), false)
    assert.equal(Object.hasOwn(parsed, 'panXY'), false)
    assert.equal(Object.hasOwn(parsed, 'sidebarPaneHeights'), false)
    assert.deepEqual(parsed.skins, project.skins)
  })

  it('writer pin: serialize forces formatVersion 1 even if project lied', async () => {
    const io = await importCompiledTs('src/io/index.ts')
    const project = clearProject()
    // @ts-expect-error intentional corrupt pin for matrix
    project.formatVersion = 99
    const parsed = JSON.parse(io.serializeProject(project))
    assert.equal(parsed.formatVersion, 1)
  })

  it('gate blocked: missing mapping slot (not only null paletteEntryId)', async () => {
    const io = await importCompiledTs('src/io/index.ts')
    const project = clearProject()
    // Inventory still requires off+on; remove the "on" mapping entirely.
    project.skins[0].mappings = project.skins[0].mappings.filter((m) => m.stateId !== 'on')
    assert.ok(io.unboundExportCount(project) > 0)
    assert.equal(io.isExportBlocked(project), true)
  })

  it('gate blocked: dangling paletteEntryId (missing palette entry)', async () => {
    const io = await importCompiledTs('src/io/index.ts')
    const project = clearProject()
    project.skins[0].mappings[1].paletteEntryId = 'missingId'
    assert.ok(io.unboundExportCount(project) > 0)
    assert.equal(io.isExportBlocked(project), true)
  })

  it('defaultTriggerDownload: appends anchor to body; revoke is deferred', async () => {
    const io = await importCompiledTs('src/io/index.ts')
    const project = clearProject()

    const bodyChildren = []
    const body = {
      children: bodyChildren,
      appendChild(child) {
        child.parent = body
        bodyChildren.push(child)
        return child
      },
    }
    function makeAnchor() {
      const attrs = new Map()
      const node = {
        parent: null,
        children: [],
        setAttribute(name, value) {
          attrs.set(name, String(value))
        },
        getAttribute(name) {
          return attrs.has(name) ? attrs.get(name) : null
        },
        click() {
          assert.equal(
            node.parent,
            body,
            'anchor must be under document.body at click time',
          )
        },
        remove() {
          if (!node.parent) return
          const idx = bodyChildren.indexOf(node)
          if (idx >= 0) bodyChildren.splice(idx, 1)
          node.parent = null
        },
      }
      return node
    }

    const prevDocument = globalThis.document
    const prevURL = globalThis.URL
    /** @type {string[]} */
    const revokeOrder = []
    let clickSawParent = false

    globalThis.document = {
      body,
      createElement(tag) {
        assert.equal(String(tag).toLowerCase(), 'a')
        const el = makeAnchor()
        const origClick = el.click.bind(el)
        el.click = () => {
          clickSawParent = el.parent === body
          origClick()
        }
        return el
      },
    }
    globalThis.URL = {
      createObjectURL() {
        return 'blob:default-trigger-test'
      },
      revokeObjectURL() {
        revokeOrder.push('revoke')
      },
    }

    try {
      io.downloadProjectJson(project)
      assert.equal(clickSawParent, true)
      assert.deepEqual(revokeOrder, [], 'revoke must not run synchronously')
      await new Promise((resolve) => setTimeout(resolve, 0))
      assert.deepEqual(revokeOrder, ['revoke'], 'revoke runs on next macrotask')
    } finally {
      globalThis.document = prevDocument
      globalThis.URL = prevURL
    }
  })
})
