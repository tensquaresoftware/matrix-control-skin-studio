/**
 * Spike exemplar board — one labeled brick per Matrix-Control base widget
 * at DesignAtoms UI Scale 100%, painted for skin Black with Orbital demo faces.
 * Not Inventory ObjectTypes; not selectable hit regions.
 */

export type ExemplarWidgetKind =
  | 'slider'
  | 'combo'
  | 'button'
  | 'toggle'
  | 'label'
  | 'groupLabel'
  | 'moduleHeader'
  | 'modulationBusHeader'
  | 'sectionHeader'
  | 'envelopeDisplay'
  | 'trackGeneratorDisplay'
  | 'patchNameDisplay'
  | 'horizontalSeparator'

export type ExemplarDescriptor = {
  /** Stable DOM / matrix id (kebab). */
  id: string
  kind: ExemplarWidgetKind
  /** English caption beside the brick for scanning. */
  caption: string
  width: number
  height: number
  /** Primary face text when the brick shows a string. */
  faceText?: string
  /** Secondary value (slider readout, combo selection, etc.). */
  valueText?: string
  /** Slider range (Matrix-Control style 0–63 when set). */
  valueMin?: number
  valueMax?: number
  /** Slider numeric value used for value-bar width. */
  value?: number
}

/**
 * Flat board order for readable scanning (controls → labels → headers → displays).
 * Sizes: DesignAtoms Heights / ParameterCell. Demo faces from Orbital / Black.
 */
export const EXEMPLAR_BOARD: readonly ExemplarDescriptor[] = Object.freeze([
  {
    id: 'slider',
    kind: 'slider',
    caption: 'Slider · PULSE WIDTH',
    width: 60,
    height: 16,
    valueText: '48',
    valueMin: 0,
    valueMax: 63,
    value: 48,
  },
  {
    id: 'combo',
    kind: 'combo',
    caption: 'Combo · TRACK INPUT',
    width: 60,
    height: 16,
    faceText: 'PRESSURE',
  },
  {
    id: 'button',
    kind: 'button',
    caption: 'Button',
    width: 44,
    height: 20,
    faceText: 'COPY',
  },
  {
    id: 'toggle',
    kind: 'toggle',
    caption: 'Toggle',
    width: 20,
    height: 20,
    faceText: 'ON',
  },
  {
    id: 'label',
    kind: 'label',
    caption: 'Label',
    width: 92,
    height: 16,
    faceText: 'FREQUENCY',
  },
  {
    id: 'group-label',
    kind: 'groupLabel',
    caption: 'GroupLabel',
    width: 104,
    height: 24,
    faceText: 'INTERNAL PATCHES',
  },
  {
    id: 'module-header',
    kind: 'moduleHeader',
    caption: 'ModuleHeader',
    width: 152,
    height: 32,
    faceText: 'DCO 1',
  },
  {
    id: 'modulation-bus-header',
    kind: 'modulationBusHeader',
    caption: 'ModulationBusHeader',
    width: 196,
    height: 32,
    faceText: '0',
    valueText: 'SOURCE  AMOUNT  DESTINATION',
  },
  {
    id: 'section-header',
    kind: 'sectionHeader',
    caption: 'SectionHeader',
    width: 152,
    height: 32,
    faceText: 'PATCH EDIT',
  },
  {
    id: 'envelope-display',
    kind: 'envelopeDisplay',
    caption: 'EnvelopeDisplay',
    width: 152,
    height: 128,
    faceText: 'ENV 1',
  },
  {
    id: 'track-generator-display',
    kind: 'trackGeneratorDisplay',
    caption: 'TrackGeneratorDisplay',
    width: 152,
    height: 128,
    faceText: 'RAMP 1',
  },
  {
    id: 'patch-name-display',
    kind: 'patchNameDisplay',
    caption: 'PatchNameDisplay',
    width: 152,
    height: 72,
    faceText: 'ORBITAL',
  },
  {
    id: 'horizontal-separator',
    kind: 'horizontalSeparator',
    caption: 'HorizontalSeparator',
    width: 152,
    height: 8,
  },
])

/** Widget kinds required on the spike board (matrix assert helper). */
export function exemplarBoardKinds(): readonly ExemplarWidgetKind[] {
  return EXEMPLAR_BOARD.map((entry) => entry.kind)
}

/** Value-bar width in px: round((w − 2×inset) × (value − min) / (max − min)). */
export function sliderValueBarWidthPx(
  width: number,
  value: number,
  valueMin: number,
  valueMax: number,
  insetPerSide = 1,
): number {
  const widthFull = Math.max(0, width - insetPerSide * 2)
  const range = valueMax - valueMin
  if (range <= 0) return 0
  const normalized = Math.min(1, Math.max(0, (value - valueMin) / range))
  return Math.max(0, Math.round(widthFull * normalized))
}
