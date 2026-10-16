import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const deps = { ...pkg.dependencies, ...pkg.devDependencies }
const baseCssPath = join(root, 'src/styles/base.css')
const stylesIndexPath = join(root, 'src/styles/index.ts')
const baseCss = readFileSync(baseCssPath, 'utf8')
const stylesIndex = readFileSync(stylesIndexPath, 'utf8')

/** Hex sample from DESIGN.md that must appear as chrome tokens. */
const COLOR_SAMPLES = {
  '--color-surface-app': '#1a1b1e',
  '--color-surface-chrome': '#222326',
  '--color-text-primary': '#e8e9ed',
  '--color-accent': '#4c8dff',
  '--color-destructive': '#e05555',
  '--color-focus-ring': '#7aa8ff',
}

const REQUIRED_COLOR_VARS = [
  '--color-surface-app',
  '--color-surface-chrome',
  '--color-surface-panel',
  '--color-surface-raised',
  '--color-surface-sunken',
  '--color-border-subtle',
  '--color-border-strong',
  '--color-text-primary',
  '--color-text-secondary',
  '--color-text-muted',
  '--color-text-on-accent',
  '--color-accent',
  '--color-accent-muted',
  '--color-warning',
  '--color-warning-muted',
  '--color-destructive',
  '--color-destructive-muted',
  '--color-focus-ring',
  '--color-selection-outline',
  '--color-pulse-outline',
  '--color-canvas-veil',
  '--color-scrollbar',
  '--color-scrollbar-thumb',
]

const REQUIRED_SPACE_VARS = [
  '--space-1',
  '--space-2',
  '--space-3',
  '--space-4',
  '--space-5',
  '--space-6',
  '--space-unit',
  '--space-chrome-pad-x',
  '--space-chrome-pad-y',
  '--space-top-bar-height',
  '--space-context-strip-height',
  '--space-sidebar-width',
  '--space-splitter-hit',
  '--space-pane-gap',
  '--space-control-gap',
  '--space-section-gap',
]

const REQUIRED_RADIUS_VARS = [
  '--radius-none',
  '--radius-sm',
  '--radius-default',
  '--radius-md',
  '--radius-lg',
  '--radius-full',
]

const TYPE_ROLES = [
  'ui',
  'ui-strong',
  'label',
  'title-bar',
  'mono',
  'mono-sm',
  'context',
]

const REQUIRED_COMP_PREFIXES = [
  '--comp-top-bar-',
  '--comp-context-strip-',
  '--comp-canvas-selection-',
  '--comp-sidebar-splitter-',
  '--comp-picker-pane-',
  '--comp-palette-swatch-',
  '--comp-mapping-row-',
  '--comp-unbound-pane-',
  '--comp-export-disabled-',
  '--comp-modal-confirm-',
  '--comp-pulse-highlight-',
]

function declareVar(name) {
  return new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`)
}

describe('styles I/O matrix', () => {
  it('tokens present: :root exposes DESIGN.md color, spacing, radius, type, component vars', () => {
    assert.ok(existsSync(baseCssPath), 'expected src/styles/base.css')
    assert.match(baseCss, /:root\s*\{/)

    for (const name of REQUIRED_COLOR_VARS) {
      assert.match(baseCss, declareVar(name), `missing color token ${name}`)
    }
    for (const [name, hex] of Object.entries(COLOR_SAMPLES)) {
      assert.match(
        baseCss,
        new RegExp(
          `${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*${hex}`,
          'i',
        ),
        `expected ${name} = ${hex}`,
      )
    }
    for (const name of REQUIRED_SPACE_VARS) {
      assert.match(baseCss, declareVar(name), `missing space token ${name}`)
    }
    for (const name of REQUIRED_RADIUS_VARS) {
      assert.match(baseCss, declareVar(name), `missing radius token ${name}`)
    }
    for (const role of TYPE_ROLES) {
      assert.match(
        baseCss,
        declareVar(`--type-${role}-font-family`),
        `missing type role ${role}`,
      )
      assert.match(
        baseCss,
        declareVar(`--type-${role}-font-size`),
        `missing type size for ${role}`,
      )
      assert.match(
        baseCss,
        declareVar(`--type-${role}-font-weight`),
        `missing type weight for ${role}`,
      )
    }
    assert.match(baseCss, /--type-label-font-weight\s*:\s*500/)
    assert.match(baseCss, /--type-title-bar-font-weight\s*:\s*500/)
    assert.match(baseCss, /--type-ui-strong-font-weight\s*:\s*600/)
    for (const prefix of REQUIRED_COMP_PREFIXES) {
      assert.match(
        baseCss,
        new RegExp(prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
        `missing component tokens ${prefix}*`,
      )
    }
    assert.match(
      baseCss,
      /--comp-modal-confirm-surface\s*:\s*var\(--color-surface-raised\)/,
    )
    assert.match(
      baseCss,
      /--comp-modal-confirm-scrim\s*:\s*rgba\(\s*14\s*,\s*15\s*,\s*18\s*,\s*0\.72\s*\)/,
    )
  })

  it('typography: IBM Plex Sans/Mono wired via Fontsource + type-scale roles', () => {
    assert.ok(deps['@fontsource/ibm-plex-sans'], 'missing @fontsource/ibm-plex-sans')
    assert.ok(deps['@fontsource/ibm-plex-mono'], 'missing @fontsource/ibm-plex-mono')
    assert.match(stylesIndex, /@fontsource\/ibm-plex-sans\/400\.css/)
    assert.match(stylesIndex, /@fontsource\/ibm-plex-sans\/500\.css/)
    assert.match(stylesIndex, /@fontsource\/ibm-plex-sans\/600\.css/)
    assert.match(stylesIndex, /@fontsource\/ibm-plex-mono\/400\.css/)
    assert.match(stylesIndex, /base\.css/)

    assert.match(baseCss, /IBM Plex Sans/)
    assert.match(baseCss, /IBM Plex Mono/)
    assert.match(baseCss, /body\s*\{[^}]*font-family:\s*var\(--type-ui-font-family\)/s)
    assert.match(baseCss, /body\s*\{[^}]*background:\s*var\(--color-surface-app\)/s)

    for (const role of TYPE_ROLES) {
      assert.match(
        baseCss,
        new RegExp(`\\.type-${role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{`),
        `missing type utility .type-${role}`,
      )
    }
  })

  it('focus ring: :focus-visible uses focus-ring token #7AA8FF', () => {
    assert.match(
      baseCss,
      /button:focus-visible[\s\S]*?\{[^}]*outline:[^;]*var\(--color-focus-ring\)/s,
    )
    assert.match(baseCss, /--color-focus-ring\s*:\s*#7aa8ff/i)
  })

  it('Palette exclusion: Duo #FFCC00 is not a chrome brand token', () => {
    // Only inspect token declarations (property lines), not comments.
    const tokenLines = baseCss
      .split('\n')
      .filter((line) => /^\s*--[\w-]+\s*:/.test(line))
      .join('\n')
    assert.doesNotMatch(tokenLines, /#ffcc00/i)
    assert.doesNotMatch(tokenLines, /--color-duo/i)
    assert.doesNotMatch(baseCss, /--color-[\w-]*:\s*#ffcc00/i)
  })

  it('boot modal restyle: New confirm uses modal-confirm tokens (no light inline hex)', () => {
    const bootSurface = readFileSync(join(root, 'src/boot-surface.ts'), 'utf8')
    assert.match(bootSurface, /className\s*=\s*'boot-title'/)
    assert.match(bootSurface, /className\s*=\s*'boot-new-button'/)
    assert.match(bootSurface, /className\s*=\s*'boot-confirm-scrim'/)
    assert.match(bootSurface, /className\s*=\s*'boot-confirm-panel'/)
    assert.match(bootSurface, /className\s*=\s*'boot-confirm-body'/)
    assert.match(bootSurface, /className\s*=\s*'boot-confirm-actions'/)
    assert.match(bootSurface, /className\s*=\s*'boot-confirm-secondary'/)
    assert.match(
      bootSurface,
      /className\s*=\s*'boot-confirm-primary-destructive'/,
    )
    assert.doesNotMatch(bootSurface, /style\.cssText/)
    assert.doesNotMatch(bootSurface, /background:\s*#fff/i)

    assert.match(
      baseCss,
      /\.boot-title\s*\{[^}]*font-family:\s*var\(--type-title-bar-font-family\)/s,
    )
    assert.match(
      baseCss,
      /\.boot-new-button\s*\{[^}]*background:\s*var\(--color-surface-panel\)/s,
    )
    assert.match(
      baseCss,
      /\.boot-confirm-scrim\s*\{[^}]*background:\s*var\(--comp-modal-confirm-scrim\)/s,
    )
    assert.match(
      baseCss,
      /\.boot-confirm-panel\s*\{[^}]*background:\s*var\(--comp-modal-confirm-surface\)/s,
    )
    assert.match(
      baseCss,
      /\.boot-confirm-body\s*\{[^}]*color:\s*var\(--comp-modal-confirm-body\)/s,
    )
    assert.match(
      baseCss,
      /\.boot-confirm-actions\s*\{[^}]*gap:\s*var\(--space-3\)/s,
    )
    assert.match(
      baseCss,
      /\.boot-confirm-primary-destructive\s*\{[^}]*background:\s*var\(--comp-modal-confirm-primary-destructive-bg\)/s,
    )
    assert.match(
      baseCss,
      /\.boot-confirm-secondary\s*\{[^}]*background:\s*var\(--comp-modal-confirm-secondary-bg\)/s,
    )
  })
})
