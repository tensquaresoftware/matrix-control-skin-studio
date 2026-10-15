import { createEmptyProject, createEmptySession } from './empty-project'
import type { ProjectDocument, SessionUiState } from './types'

export type StoreState = {
  project: ProjectDocument
  session: SessionUiState
}

/** Partial replacement of project and/or session (no deep-merge). */
export type ApplyPayload = {
  project?: ProjectDocument
  session?: SessionUiState
}

export type Unsubscribe = () => void

export type ProjectStore = {
  getState: () => StoreState
  subscribe: (listener: () => void) => Unsubscribe
  apply: (payload: ApplyPayload) => void
}

function cloneProject(project: ProjectDocument): ProjectDocument {
  return structuredClone(project)
}

function cloneSession(session: SessionUiState): SessionUiState {
  return structuredClone(session)
}

export function createStore(initial?: Partial<StoreState>): ProjectStore {
  let state: StoreState = {
    project: cloneProject(initial?.project ?? createEmptyProject()),
    session: cloneSession(initial?.session ?? createEmptySession()),
  }
  const listeners = new Set<() => void>()

  return {
    getState() {
      return {
        project: cloneProject(state.project),
        session: cloneSession(state.session),
      }
    },

    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    apply(payload) {
      const nextProject =
        payload.project !== undefined ? cloneProject(payload.project) : state.project
      const nextSession =
        payload.session !== undefined ? cloneSession(payload.session) : state.session

      if (nextProject === state.project && nextSession === state.session) {
        return
      }

      state = {
        project: nextProject,
        session: nextSession,
      }

      for (const listener of listeners) {
        listener()
      }
    },
  }
}

/** Module-level singleton — empty document + null session until seed/persist apply. */
export const store: ProjectStore = createStore()

/** Boot entry: returns the singleton (already initialized with empty baseline). */
export function initProjectStore(): ProjectStore {
  return store
}
