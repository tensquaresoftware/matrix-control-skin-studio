import { execute } from '../history/index'
import { deriveUnbound, type UnboundHit } from '../model/palette-helpers'
import type { ProjectStore } from '../model/store'
import type { SessionUiState } from '../model/types'
import type { CanvasSelectionSync } from './canvas-selection-sync'
import type { MappingFocusController } from './mapping-focus'

export const UNBOUND_SUCCESS_COPY = 'All required mappings bound'

export type MountUnboundPaneOptions = {
  mappingFocus: MappingFocusController
  selectionSync?: CanvasSelectionSync
  /** Pane head — badge mounts here so it stays visible while the body scrolls. */
  head: HTMLElement
}

/**
 * Pane 4: project-total `{n} unbound` badge + active-Skin-filtered clickable
 * list (`Object type · State · Property`). Success copy only when project-total
 * is 0 (PANE_SCOPE / ROW_DISAMBIG / AD-16).
 */
export function mountUnboundPane(
  body: HTMLElement,
  store: ProjectStore,
  options: MountUnboundPaneOptions,
): void {
  const { mappingFocus, selectionSync, head } = options
  body.classList.add('unbound-pane-body')
  body.replaceChildren()

  const badge = document.createElement('span')
  badge.className = 'unbound-pane-badge'
  badge.setAttribute('data-unbound-badge', '')
  badge.hidden = true
  head.append(badge)

  const list = document.createElement('div')
  list.className = 'unbound-pane-list'
  list.setAttribute('data-unbound-list', '')

  const empty = document.createElement('p')
  empty.className = 'unbound-pane-empty'
  empty.setAttribute('data-unbound-empty', '')
  empty.hidden = true

  body.append(list, empty)

  const render = (): void => {
    const { project, session } = store.getState()
    const hits = deriveUnbound(project)
    const projectTotal = hits.length
    const activeSkinId = session.activeSkinId
    const activeHits =
      activeSkinId == null
        ? []
        : hits.filter((hit) => hit.skinId === activeSkinId)

    if (projectTotal === 0) {
      badge.hidden = true
      badge.textContent = ''
      list.replaceChildren()
      empty.hidden = false
      empty.textContent = UNBOUND_SUCCESS_COPY
      return
    }

    badge.hidden = false
    badge.textContent = `${projectTotal} unbound`
    empty.hidden = true
    empty.textContent = ''

    list.replaceChildren()
    for (const hit of activeHits) {
      list.append(createRow(hit, store, mappingFocus, selectionSync, body))
    }
  }

  render()
  store.subscribe(render)
}

function createRow(
  hit: UnboundHit,
  store: ProjectStore,
  mappingFocus: MappingFocusController,
  selectionSync: CanvasSelectionSync | undefined,
  body: HTMLElement,
): HTMLElement {
  const row = document.createElement('button')
  row.type = 'button'
  row.className = 'unbound-pane-row'
  row.setAttribute('data-unbound-row', '')
  row.setAttribute('data-unbound-object-type', hit.objectTypeId)
  row.setAttribute('data-unbound-state', hit.stateId)
  row.setAttribute('data-unbound-property', hit.propertyId)
  row.textContent = formatUnboundRowLabel(hit)

  row.addEventListener('click', () => {
    jumpToHit(store, hit, mappingFocus, selectionSync, body)
  })

  return row
}

/** ROW_DISAMBIG = INCLUDE_STATE — middot separators. */
export function formatUnboundRowLabel(hit: UnboundHit): string {
  return `${hit.objectTypeId} · ${hit.stateId} · ${hit.propertyId}`
}

function jumpToHit(
  store: ProjectStore,
  hit: UnboundHit,
  mappingFocus: MappingFocusController,
  selectionSync: CanvasSelectionSync | undefined,
  body: HTMLElement,
): void {
  const { session } = store.getState()
  const nextSession: SessionUiState = {
    ...session,
    selectedObjectTypeId: hit.objectTypeId,
    selectedStateId: hit.stateId,
  }
  execute(store, { session: nextSession })
  mappingFocus.setFocused({
    objectTypeId: hit.objectTypeId,
    stateId: hit.stateId,
    propertyId: hit.propertyId,
  })
  selectionSync?.switchToMappings()
  scrollFocusedMappingIntoView(body)
}

function scrollFocusedMappingIntoView(body: HTMLElement): void {
  const root =
    typeof body.closest === 'function'
      ? (body.closest('[data-sidebar]') ?? body)
      : body
  const rows = root.querySelectorAll('[data-mapping-row]')
  for (const row of rows) {
    const el = row as HTMLElement & {
      scrollIntoView?: (opts?: ScrollIntoViewOptions) => void
    }
    if (!el.classList?.contains('is-focused')) continue
    el.scrollIntoView?.({ block: 'nearest' })
    return
  }
}
