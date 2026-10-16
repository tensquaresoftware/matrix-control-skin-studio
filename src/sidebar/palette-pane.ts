import type { ProjectStore } from '../model/store'
import type { PaletteEntry } from '../model/types'
import type { PaletteSelectionController } from './palette-selection'

/**
 * Render Palette swatch rows from `project.palette`. Selection is sidebar-local
 * (not SessionUiState). Rows refresh on store and selection changes.
 */
export function mountPalettePane(
  body: HTMLElement,
  store: ProjectStore,
  selection: PaletteSelectionController,
): void {
  body.classList.add('palette-pane-body')
  body.replaceChildren()

  const list = document.createElement('div')
  list.className = 'palette-swatch-list'
  list.setAttribute('data-palette-list', '')
  body.append(list)

  const render = (): void => {
    const { project } = store.getState()
    const selectedId = selection.getSelectedId()
    if (
      selectedId != null &&
      !project.palette.some((entry) => entry.id === selectedId)
    ) {
      selection.setSelectedId(null)
      return
    }
    const activeId = selection.getSelectedId()
    list.replaceChildren()
    for (const entry of project.palette) {
      list.append(
        buildRow(entry, entry.id === activeId, () => {
          selection.setSelectedId(entry.id)
        }),
      )
    }
  }

  render()
  store.subscribe(render)
  selection.subscribe(render)
}

function buildRow(
  entry: PaletteEntry,
  selected: boolean,
  onSelect: () => void,
): HTMLElement {
  const row = document.createElement('button')
  row.type = 'button'
  row.className = 'palette-swatch-row'
  row.setAttribute('data-palette-row', entry.id)
  if (selected) {
    row.classList.add('is-selected')
    row.setAttribute('aria-pressed', 'true')
  } else {
    row.setAttribute('aria-pressed', 'false')
  }

  const chip = document.createElement('span')
  chip.className = 'palette-swatch-chip'
  chip.setAttribute('data-palette-chip', '')
  chip.style.background = entry.hex

  const label = document.createElement('span')
  label.className = 'palette-swatch-label'
  label.setAttribute('data-palette-label', '')
  label.textContent = entry.constantName || entry.id

  const hex = document.createElement('span')
  hex.className = 'palette-swatch-hex type-mono-sm'
  hex.setAttribute('data-palette-hex', '')
  hex.textContent = entry.hex

  row.append(chip, label, hex)
  row.addEventListener('click', () => {
    onSelect()
  })
  return row
}
