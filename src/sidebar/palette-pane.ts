import { looksLikeOpaqueHexToken } from '../model/opaque-hex'
import type { ProjectStore } from '../model/store'
import type { PaletteEntry, ProjectDocument } from '../model/types'
import {
  applyDeleteAndUnbind,
  collectPaletteRefs,
  openPaletteDeleteConfirm,
} from './palette-delete-confirm'
import type { PaletteSelectionController } from './palette-selection'

const DEFAULT_NEW_HEX = '#808080'
const COLOUR_NAME_RE = /^Colour (\d+)$/

/**
 * Render Palette swatch rows from `project.palette`. Selection is sidebar-local
 * (not SessionUiState). Rows refresh on store and selection changes.
 * Actions: `+ Add`, `Delete…`, inline double-click rename (story 3-2).
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

  const actions = document.createElement('div')
  actions.className = 'palette-actions'
  actions.setAttribute('data-palette-actions', '')

  const addBtn = document.createElement('button')
  addBtn.type = 'button'
  addBtn.className = 'palette-action-btn'
  addBtn.setAttribute('data-palette-add', '')
  addBtn.textContent = '+ Add'

  const deleteBtn = document.createElement('button')
  deleteBtn.type = 'button'
  deleteBtn.className = 'palette-action-btn palette-action-btn-ghost'
  deleteBtn.setAttribute('data-palette-delete', '')
  deleteBtn.textContent = 'Delete…'

  actions.append(addBtn, deleteBtn)
  body.append(list, actions)

  const modalRoot = (): HTMLElement =>
    body.closest('[data-sidebar]') ?? body

  const openRenameFor = (entryId: string): void => {
    Promise.resolve().then(() => {
      const row = list.querySelector(`[data-palette-row="${entryId}"]`)
      const label = row?.querySelector('[data-palette-label]') as HTMLElement | null
      if (!label) return
      const entry = store
        .getState()
        .project.palette.find((item) => item.id === entryId)
      if (!entry) return
      startInlineRename(label, entry, store)
    })
  }

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
    deleteBtn.disabled = activeId == null
    // Keep an open inline rename; rebuilding the list would discard the edit.
    // If the renamed entry was removed, drop the guard and rebuild.
    const renameInput = list.querySelector('[data-palette-rename]')
    if (renameInput) {
      const renameRow = renameInput.closest('[data-palette-row]')
      const renameId = renameRow?.getAttribute('data-palette-row')
      if (
        renameId != null &&
        project.palette.some((entry) => entry.id === renameId)
      ) {
        return
      }
    }
    list.replaceChildren()
    for (const entry of project.palette) {
      list.append(
        buildRow(
          entry,
          entry.id === activeId,
          () => {
            selection.setSelectedId(entry.id)
          },
          () => {
            openRenameFor(entry.id)
          },
        ),
      )
    }
  }

  addBtn.addEventListener('click', () => {
    const { project } = store.getState()
    const entry = createPaletteEntry(project.palette)
    const next: ProjectDocument = {
      ...project,
      palette: [...project.palette, entry],
    }
    store.apply({ project: next })
    selection.setSelectedId(entry.id)
  })

  deleteBtn.addEventListener('click', () => {
    if (deleteBtn.disabled) return
    const selectedId = selection.getSelectedId()
    if (selectedId == null) return

    const { project } = store.getState()
    const entry = project.palette.find((e) => e.id === selectedId)
    if (!entry) return

    const refs = collectPaletteRefs(project, selectedId)
    if (refs.length === 0) {
      const next: ProjectDocument = {
        ...project,
        palette: project.palette.filter((e) => e.id !== selectedId),
      }
      store.apply({ project: next })
      return
    }

    const displayName = entry.constantName || entry.id
    openPaletteDeleteConfirm({
      root: modalRoot(),
      paletteEntryId: selectedId,
      displayName,
      refs,
      onConfirm: () => {
        const { project: live } = store.getState()
        if (!live.palette.some((e) => e.id === selectedId)) return
        const liveRefs = collectPaletteRefs(live, selectedId)
        // Stale list (mappings changed while modal open) → abort; operator re-opens Delete.
        if (liveRefs.length !== refs.length) return
        applyDeleteAndUnbind(store, selectedId)
      },
    })
  })

  render()
  store.subscribe(render)
  selection.subscribe(render)
}

function createPaletteEntry(palette: readonly PaletteEntry[]): PaletteEntry {
  return {
    id: allocatePaletteId(palette),
    hex: DEFAULT_NEW_HEX,
    constantName: nextColourName(palette),
  }
}

function allocatePaletteId(palette: readonly PaletteEntry[]): string {
  let id = newOpaqueId()
  while (palette.some((entry) => entry.id === id)) {
    id = newOpaqueId()
  }
  return id
}

function newOpaqueId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }
  return `palette-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/** Smallest unused positive integer among existing `Colour {n}` labels. */
function nextColourName(palette: readonly PaletteEntry[]): string {
  const used = new Set<number>()
  for (const entry of palette) {
    const name = entry.constantName
    if (name == null) continue
    const match = COLOUR_NAME_RE.exec(name)
    if (match) used.add(Number(match[1]))
  }
  let n = 1
  while (used.has(n)) n += 1
  return `Colour ${n}`
}

function buildRow(
  entry: PaletteEntry,
  selected: boolean,
  onSelect: () => void,
  onRename: () => void,
): HTMLElement {
  // div (not button) so inline rename input is valid interactive content
  const row = document.createElement('div')
  row.className = 'palette-swatch-row'
  row.setAttribute('data-palette-row', entry.id)
  row.setAttribute('role', 'button')
  row.tabIndex = 0
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

  row.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    // Ignore keys typed into the inline rename field (Space must insert).
    if (event.target !== row) return
    event.preventDefault()
    onSelect()
  })

  label.addEventListener('dblclick', (event) => {
    event.stopPropagation()
    event.preventDefault()
    // Select first (may rebuild the row); open rename on the post-render label.
    onSelect()
    onRename()
  })

  return row
}

function startInlineRename(
  label: HTMLElement,
  entry: PaletteEntry,
  store: ProjectStore,
): void {
  if (label.querySelector('[data-palette-rename]')) return

  const previousLabel = entry.constantName || entry.id
  const input = document.createElement('input')
  input.type = 'text'
  input.className = 'palette-swatch-label-input'
  input.setAttribute('data-palette-rename', '')
  input.value = previousLabel

  let cancelled = false
  let finished = false

  const finish = (commit: boolean): void => {
    if (finished) return
    finished = true
    if (commit && !cancelled) {
      const trimmed = input.value.trim()
      if (trimmed.length === 0) {
        label.textContent = previousLabel
        return
      }
      if (trimmed === previousLabel) {
        label.textContent = previousLabel
        return
      }
      // Hex belongs on the mono field — reject hex-shaped constant names.
      if (looksLikeOpaqueHexToken(trimmed)) {
        label.textContent = previousLabel
        return
      }
      // Detach the input before apply so store-driven render can rebuild the list.
      input.remove()
      applyRename(store, entry.id, trimmed)
      return
    }
    label.textContent = previousLabel
  }

  label.replaceChildren()
  label.append(input)
  input.focus()
  if (typeof input.select === 'function') {
    input.select()
  }

  input.addEventListener('click', (event) => {
    event.stopPropagation()
  })
  input.addEventListener('mousedown', (event) => {
    event.stopPropagation()
  })

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      input.blur()
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      cancelled = true
      input.blur()
    }
  })

  input.addEventListener('blur', () => {
    finish(true)
  })
}

function applyRename(
  store: ProjectStore,
  entryId: string,
  constantName: string,
): void {
  const { project } = store.getState()
  const index = project.palette.findIndex((e) => e.id === entryId)
  if (index < 0) return
  const next: ProjectDocument = {
    ...project,
    palette: project.palette.map((entry, i) =>
      i === index ? { ...entry, constantName } : entry,
    ),
  }
  store.apply({ project: next })
}
