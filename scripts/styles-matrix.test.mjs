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
  '--color-surface-panel': '#323232',
  '--color-surface-gutter': '#1e1e1e',
  '--color-surface-sunken': '#242424',
  '--color-tab-inactive': '#262626',
  '--color-tab-active': '#323232',
  '--color-border-strong': '#4a4a4a',
  '--color-border-sidebar-rim': '#1e1e1e',
  '--color-text-primary': '#dedede',
  '--color-text-secondary': '#808080',
  '--color-accent': '#4c8dff',
  '--color-destructive': '#e05555',
  '--color-focus-ring': '#7aa8ff',
}

/** Layout / radius samples from DESIGN.md that must stay pinned. */
const SPACE_SAMPLES = {
  '--space-top-bar-height': '40px',
  '--space-sidebar-width': '236px',
  '--space-picker-sv-size': '186px',
  '--space-picker-hue-width': '16px',
  '--space-picker-stage-gap': '8px',
  '--space-picker-hue-trail': '6px',
  '--space-sidebar-float': '2px',
  '--space-sidebar-tab-height': '25px',
  '--space-unit': '4px',
}

const RADIUS_SAMPLES = {
  '--radius-sm': '2px',
  '--radius-default': '4px',
  '--radius-md': '6px',
}

const REQUIRED_COLOR_VARS = [
  '--color-surface-app',
  '--color-surface-chrome',
  '--color-surface-panel',
  '--color-surface-raised',
  '--color-surface-sunken',
  '--color-surface-gutter',
  '--color-tab-inactive',
  '--color-tab-active',
  '--color-border-subtle',
  '--color-border-strong',
  '--color-border-sidebar-rim',
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
  '--space-sidebar-width',
  '--space-picker-sv-size',
  '--space-picker-hue-width',
  '--space-picker-stage-gap',
  '--space-picker-hue-trail',
  '--space-sidebar-float',
  '--space-sidebar-tab-height',
  '--space-pane-gutter',
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

const REQUIRED_COMP_VARS = [
  '--comp-top-bar-background',
  '--comp-top-bar-border-bottom',
  '--comp-top-bar-height',
  '--comp-top-bar-padding-x',
  '--comp-top-bar-text',
  '--comp-top-bar-control-gap',
  '--comp-top-bar-group-separator',
  '--comp-canvas-selection-outline',
  '--comp-canvas-selection-outline-width',
  '--comp-canvas-selection-outline-offset',
  '--comp-canvas-selection-fill',
  '--comp-sidebar-splitter-track',
  '--comp-sidebar-splitter-hover',
  '--comp-sidebar-splitter-active',
  '--comp-sidebar-splitter-hit-height',
  '--comp-sidebar-splitter-gutter-thickness',
  '--comp-sidebar-tab-inactive-bg',
  '--comp-sidebar-tab-active-bg',
  '--comp-sidebar-tab-inactive-text',
  '--comp-sidebar-tab-active-text',
  '--comp-sidebar-tab-height',
  '--comp-sidebar-float-gap',
  '--comp-sidebar-panel-rim',
  '--comp-picker-pane-background',
  '--comp-picker-pane-padding',
  '--comp-picker-pane-sv-size',
  '--comp-picker-pane-hue-width',
  '--comp-picker-pane-stage-gap',
  '--comp-picker-pane-hue-trail',
  '--comp-picker-pane-field-bg',
  '--comp-picker-pane-hex-field-bg',
  '--comp-picker-pane-field-border',
  '--comp-picker-pane-sv-border',
  '--comp-picker-pane-hex-text',
  '--comp-picker-pane-typography-hex',
  '--comp-picker-pane-typography-hex-font-size',
  '--comp-picker-pane-typography-hex-font-weight',
  '--comp-picker-pane-typography-hex-line-height',
  '--comp-palette-swatch-size',
  '--comp-mapping-swatch-size',
  '--comp-palette-swatch-radius',
  '--comp-palette-swatch-border',
  '--comp-palette-swatch-selected-ring',
  '--comp-palette-swatch-label',
  '--comp-palette-swatch-hex',
  '--comp-palette-swatch-row-hover',
  '--comp-palette-swatch-typography-label',
  '--comp-palette-swatch-typography-label-font-size',
  '--comp-palette-swatch-typography-label-font-weight',
  '--comp-palette-swatch-typography-label-line-height',
  '--comp-palette-swatch-typography-hex',
  '--comp-palette-swatch-typography-hex-font-size',
  '--comp-palette-swatch-typography-hex-font-weight',
  '--comp-palette-swatch-typography-hex-line-height',
  '--comp-mapping-row-background',
  '--comp-mapping-row-hover',
  '--comp-mapping-row-selected',
  '--comp-mapping-row-unbound-marker',
  '--comp-mapping-row-property-text',
  '--comp-mapping-row-palette-text',
  '--comp-mapping-row-typography',
  '--comp-mapping-row-typography-font-size',
  '--comp-mapping-row-typography-font-weight',
  '--comp-mapping-row-typography-line-height',
  '--comp-unbound-pane-background',
  '--comp-unbound-pane-count-color',
  '--comp-unbound-pane-count-bg',
  '--comp-unbound-pane-row-text',
  '--comp-unbound-pane-empty-text',
  '--comp-unbound-pane-border-top',
  '--comp-export-disabled-background',
  '--comp-export-disabled-text',
  '--comp-export-disabled-border',
  '--comp-export-disabled-opacity',
  '--comp-modal-confirm-scrim',
  '--comp-modal-confirm-surface',
  '--comp-modal-confirm-border',
  '--comp-modal-confirm-title',
  '--comp-modal-confirm-body',
  '--comp-modal-confirm-primary-destructive-bg',
  '--comp-modal-confirm-primary-destructive-text',
  '--comp-modal-confirm-secondary-bg',
  '--comp-modal-confirm-secondary-text',
  '--comp-modal-confirm-radius',
  '--comp-pulse-highlight-outline',
  '--comp-pulse-highlight-outline-width',
  '--comp-pulse-highlight-duration',
  '--comp-pulse-highlight-repeats',
  '--comp-pulse-highlight-easing',
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
    for (const [name, value] of Object.entries(SPACE_SAMPLES)) {
      assert.match(
        baseCss,
        new RegExp(
          `${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*${value}`,
          'i',
        ),
        `expected ${name} = ${value}`,
      )
    }
    for (const name of REQUIRED_RADIUS_VARS) {
      assert.match(baseCss, declareVar(name), `missing radius token ${name}`)
    }
    for (const [name, value] of Object.entries(RADIUS_SAMPLES)) {
      assert.match(
        baseCss,
        new RegExp(
          `${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*${value}`,
          'i',
        ),
        `expected ${name} = ${value}`,
      )
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
      assert.match(
        baseCss,
        declareVar(`--type-${role}-line-height`),
        `missing type line-height for ${role}`,
      )
    }
    assert.match(baseCss, declareVar('--type-label-letter-spacing'))
    assert.match(baseCss, /--type-label-font-weight\s*:\s*500/)
    assert.match(baseCss, /--type-title-bar-font-weight\s*:\s*500/)
    assert.match(baseCss, /--type-ui-strong-font-weight\s*:\s*600/)
    for (const name of REQUIRED_COMP_VARS) {
      assert.match(baseCss, declareVar(name), `missing component token ${name}`)
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

  it('typography: Inter / JetBrains Mono wired via Fontsource + type-scale roles', () => {
    assert.ok(deps['@fontsource/inter'], 'missing @fontsource/inter')
    assert.ok(deps['@fontsource/jetbrains-mono'], 'missing @fontsource/jetbrains-mono')
    assert.match(stylesIndex, /@fontsource\/inter\/400\.css/)
    assert.match(stylesIndex, /@fontsource\/inter\/500\.css/)
    assert.match(stylesIndex, /@fontsource\/inter\/600\.css/)
    assert.match(stylesIndex, /@fontsource\/jetbrains-mono\/400\.css/)
    assert.match(stylesIndex, /base\.css/)

    assert.match(baseCss, /Inter/)
    assert.match(baseCss, /JetBrains Mono/)
    assert.match(baseCss, /body\s*\{[^}]*background:\s*var\(--color-surface-app\)/s)
    assert.match(baseCss, /body\s*\{[^}]*color:\s*var\(--color-text-primary\)/s)
    assert.match(baseCss, /body\s*\{[^}]*font-family:\s*var\(--type-ui-font-family\)/s)
    assert.match(baseCss, /body\s*\{[^}]*font-size:\s*var\(--type-ui-font-size\)/s)
    assert.match(baseCss, /body\s*\{[^}]*font-weight:\s*var\(--type-ui-font-weight\)/s)
    assert.match(baseCss, /body\s*\{[^}]*line-height:\s*var\(--type-ui-line-height\)/s)

    for (const role of TYPE_ROLES) {
      assert.match(
        baseCss,
        new RegExp(`\\.type-${role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{`),
        `missing type utility .type-${role}`,
      )
    }
  })

  it('Color picker: 12×12 live preview; enlarged SV crosshair; Unbound tab gap', () => {
    assert.match(
      baseCss,
      /\.picker-color-preview\s*\{[^}]*width:\s*12px[^}]*height:\s*12px/s,
    )
    assert.match(
      baseCss,
      /\.picker-sv-crosshair\s*\{[^}]*width:\s*14px[^}]*height:\s*14px/s,
    )
    assert.match(
      baseCss,
      /\.sidebar-tab\[data-sidebar-tab='unbound'\]\s*\{[^}]*gap:\s*5px/s,
    )
  })

  it('Mappings Unbound marker: warning triangle with punched-out !', () => {
    assert.match(
      baseCss,
      /--comp-mapping-row-unbound-marker\s*:\s*var\(--color-warning\)/,
    )
    assert.match(
      baseCss,
      /\.mapping-row-unbound-marker\s*\{[^}]*mask-image:\s*url\("data:image\/svg\+xml/s,
    )
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
    const newConfirm = readFileSync(join(root, 'src/chrome/new-confirm.ts'), 'utf8')
    assert.match(newConfirm, /className\s*=\s*'boot-confirm-scrim'/)
    assert.match(newConfirm, /className\s*=\s*'boot-confirm-panel'/)
    assert.match(newConfirm, /className\s*=\s*'boot-confirm-body'/)
    assert.match(newConfirm, /className\s*=\s*'boot-confirm-actions'/)
    assert.match(newConfirm, /className\s*=\s*'boot-confirm-secondary'/)
    assert.match(
      newConfirm,
      /className\s*=\s*'boot-confirm-primary-destructive'/,
    )
    assert.doesNotMatch(newConfirm, /style\.cssText/)
    assert.doesNotMatch(newConfirm, /\.style\b/)
    assert.doesNotMatch(newConfirm, /background:\s*#fff/i)

    const chromeIndex = readFileSync(join(root, 'src/chrome/index.ts'), 'utf8')
    assert.match(chromeIndex, /className\s*=\s*'chrome-top-btn'/)
    assert.doesNotMatch(chromeIndex, /style\.cssText/)

    // Skin+Zoom budget: Zoom forced to 60px (select ignores min-width alone).
    assert.match(
      baseCss,
      /\.chrome-combo-select\s*\{[^}]*min-width:\s*72px/s,
    )
    assert.match(
      baseCss,
      /\.chrome-zoom\s+\.chrome-combo-select\s*\{[^}]*width:\s*60px/s,
    )
    assert.match(
      baseCss,
      /\.chrome-zoom\s+\.chrome-combo-select\s*\{[^}]*max-width:\s*60px/s,
    )
    assert.match(
      baseCss,
      /\.chrome-skin-combo\s+\.chrome-combo-select\s*\{[^}]*min-width:\s*88px/s,
    )
    assert.match(
      baseCss,
      /\.chrome-top-btn\s*\{[^}]*background:\s*var\(--comp-btn-background\)/s,
    )
    assert.match(baseCss, /--comp-btn-background\s*:\s*transparent/)
    // Hover fill must sit above surface-raised (#3A3A3A) so Clear shows on mapping rows.
    assert.match(baseCss, /--comp-btn-hover-background\s*:\s*#4a4a4a/)
    assert.match(
      baseCss,
      /\.chrome-top-btn:hover:not\(:disabled\):not\(\[aria-disabled='true'\]\)\s*\{[^}]*background:\s*var\(--comp-btn-hover-background\)/s,
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
      /\.boot-confirm-secondary,\s*\.boot-confirm-primary-destructive\s*\{[^}]*background:\s*var\(--comp-btn-background\)/s,
    )
  })
})
