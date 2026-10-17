import {
  store as singletonStore,
  type ApplyPayload,
  type ProjectStore,
  type StoreState,
  type Unsubscribe,
} from '../model/store'

/** Idle window for coalescing picker / Palette hex micro-edits (AD-7). */
export const COALESCE_IDLE_MS = 400

export type ExecuteOptions = {
  /**
   * When false, apply without pushing an undo step (Skin-only `activeSkinId`
   * switch — SKIN_SWITCH_UNDO = EXCLUDE). Default true.
   */
  push?: boolean
  /**
   * When set, rapid applies with the same key coalesce into one undo step
   * (400 ms idle or explicit `flushCoalesce` / pointer-up).
   */
  coalesceKey?: string
}

export type HistoryController = {
  execute: (payload: ApplyPayload, options?: ExecuteOptions) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  clear: () => void
  /** Flush an open coalesce burst into one undo step (pointer-up). */
  flushCoalesce: () => void
  subscribe: (listener: () => void) => Unsubscribe
}

type StackEntry = {
  before: StoreState
  after: StoreState
}

type OpenCoalesce = {
  key: string
  before: StoreState
  timer: ReturnType<typeof setTimeout> | null
}

function statesEqual(a: StoreState, b: StoreState): boolean {
  return (
    JSON.stringify(a.project) === JSON.stringify(b.project) &&
    JSON.stringify(a.session) === JSON.stringify(b.session)
  )
}

function createHistoryController(target: ProjectStore): HistoryController {
  const undoStack: StackEntry[] = []
  const redoStack: StackEntry[] = []
  const listeners = new Set<() => void>()
  let open: OpenCoalesce | null = null

  const notify = (): void => {
    for (const listener of listeners) {
      listener()
    }
  }

  const capture = (): StoreState => target.getState()

  const flushCoalesce = (): void => {
    if (open == null) return
    if (open.timer != null) {
      clearTimeout(open.timer)
      open.timer = null
    }
    const before = open.before
    open = null
    const after = capture()
    if (!statesEqual(before, after)) {
      undoStack.push({ before, after })
      redoStack.length = 0
    }
    notify()
  }

  const scheduleCoalesceFlush = (): void => {
    if (open == null) return
    if (open.timer != null) {
      clearTimeout(open.timer)
    }
    open.timer = setTimeout(() => {
      flushCoalesce()
    }, COALESCE_IDLE_MS)
  }

  const hasOpenCoalesceChange = (): boolean => {
    if (open == null) return false
    return !statesEqual(open.before, capture())
  }

  /**
   * Restore a stack snapshot. Object/State always come from the snapshot.
   * `activeSkinId` restores only when the command itself changed it (Skin CRUD);
   * otherwise keep the live Skin combo (SKIN_SWITCH_UNDO = EXCLUDE).
   */
  const applySnapshot = (
    snapshot: StoreState,
    entry: StackEntry,
  ): void => {
    const commandChangedSkin =
      entry.before.session.activeSkinId !== entry.after.session.activeSkinId
    const liveSkin = target.getState().session.activeSkinId
    target.apply({
      project: snapshot.project,
      session: {
        selectedObjectTypeId: snapshot.session.selectedObjectTypeId,
        selectedStateId: snapshot.session.selectedStateId,
        activeSkinId: commandChangedSkin
          ? snapshot.session.activeSkinId
          : liveSkin,
      },
    })
  }

  return {
    execute(payload, options = {}) {
      const push = options.push !== false
      const coalesceKey = options.coalesceKey

      if (!push) {
        flushCoalesce()
        target.apply(payload)
        return
      }

      if (coalesceKey != null) {
        if (open != null && open.key !== coalesceKey) {
          flushCoalesce()
        }
        if (open == null) {
          open = { key: coalesceKey, before: capture(), timer: null }
        }
        target.apply(payload)
        // Do not clear redo mid-burst: a net-zero flush must preserve redo.
        // Mid-burst canRedo stays false via hasOpenCoalesceChange().
        scheduleCoalesceFlush()
        notify()
        return
      }

      flushCoalesce()
      const before = capture()
      target.apply(payload)
      const after = capture()
      if (!statesEqual(before, after)) {
        undoStack.push({ before, after })
        redoStack.length = 0
        notify()
      }
    },

    undo() {
      flushCoalesce()
      const entry = undoStack.pop()
      if (entry == null) {
        notify()
        return
      }
      applySnapshot(entry.before, entry)
      redoStack.push(entry)
      notify()
    },

    redo() {
      flushCoalesce()
      const entry = redoStack.pop()
      if (entry == null) {
        notify()
        return
      }
      applySnapshot(entry.after, entry)
      undoStack.push(entry)
      notify()
    },

    canUndo() {
      return undoStack.length > 0 || hasOpenCoalesceChange()
    },

    canRedo() {
      // Mid-burst Redo would flush then no-op — keep the top bar disabled.
      return redoStack.length > 0 && !hasOpenCoalesceChange()
    },

    clear() {
      if (open?.timer != null) {
        clearTimeout(open.timer)
      }
      open = null
      undoStack.length = 0
      redoStack.length = 0
      notify()
    },

    flushCoalesce,

    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

/**
 * Attach controller on the store object (not a module WeakMap) so separately
 * compiled test graphs that share one store instance still share one stack.
 */
const HISTORY_KEY = Symbol.for('matrix-control-skin-studio.history')

type StoreWithHistory = ProjectStore & {
  [HISTORY_KEY]?: HistoryController
}

/** Per-store history controller (tests use fresh stores; boot uses singleton). */
export function getHistory(target: ProjectStore): HistoryController {
  const keyed = target as StoreWithHistory
  let controller = keyed[HISTORY_KEY]
  if (controller == null) {
    controller = createHistoryController(target)
    keyed[HISTORY_KEY] = controller
  }
  return controller
}

/** Convenience wrappers bound to the module singleton store. */
export const history: HistoryController = getHistory(singletonStore)

export function execute(
  target: ProjectStore,
  payload: ApplyPayload,
  options?: ExecuteOptions,
): void {
  getHistory(target).execute(payload, options)
}

export function undo(target: ProjectStore): void {
  getHistory(target).undo()
}

export function redo(target: ProjectStore): void {
  getHistory(target).redo()
}

export function clearHistory(target: ProjectStore): void {
  getHistory(target).clear()
}

export function flushCoalesce(target: ProjectStore): void {
  getHistory(target).flushCoalesce()
}

export function canUndo(target: ProjectStore): boolean {
  return getHistory(target).canUndo()
}

export function canRedo(target: ProjectStore): boolean {
  return getHistory(target).canRedo()
}

export function subscribeHistory(
  target: ProjectStore,
  listener: () => void,
): Unsubscribe {
  return getHistory(target).subscribe(listener)
}
