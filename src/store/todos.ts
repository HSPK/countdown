import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '../lib/id'
import { addMonthsClamped, nextOccurrence } from '../lib/recurrence'

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom'

export interface Todo {
  id: string
  title: string
  notes?: string                // Markdown
  tags: string[]
  sourceId: string              // 'local' for own todos, otherwise a subscription source id
  createdAt: number
  deadline: number
  completedAt?: number
  pinned: boolean
  recurrence?: Recurrence
  /** Cron expression "M H D MON DOW" — only used when recurrence === 'custom' */
  cronExpr?: string
}

export interface NewTodoInput {
  title: string
  deadline: number
  notes?: string
  tags?: string[]
  sourceId?: string
  createdAt?: number
  recurrence?: Recurrence
  cronExpr?: string
}

interface TodoState {
  todos: Todo[]
  addTodo: (input: NewTodoInput) => string
  updateTodo: (id: string, patch: Partial<Omit<Todo, 'id'>>) => void
  removeTodo: (id: string) => void
  toggleComplete: (id: string) => void
  /** Complete a specific virtual occurrence of a recurring todo. Advances
   *  the parent deadline until it is strictly past `occurrenceTs` (or now). */
  completeOccurrence: (id: string, occurrenceTs: number) => void
  togglePin: (id: string) => void
  clearCompleted: () => void
  /** Replace all todos that belong to a given sourceId (used by subscription refresh). */
  replaceSource: (sourceId: string, items: Todo[]) => void
  /** Import a list of todos with conflict resolution by id (replace-on-id). */
  importTodos: (items: Todo[]) => number
  /** Drop all todos that belong to the given sourceId. */
  dropSource: (sourceId: string) => void
}

function advanceDeadline(ts: number, kind: Recurrence, cronExpr?: string): number {
  if (kind === 'none' || !kind) return ts
  if (kind === 'monthly') return addMonthsClamped(ts, 1)
  const next = nextOccurrence(ts, kind, cronExpr)
  return next ?? ts
}

export const useTodos = create<TodoState>()(
  persist(
    (set, get) => ({
      todos: [],
      addTodo: (input) => {
        const id = uid()
        const todo: Todo = {
          id,
          title: input.title.trim(),
          notes: input.notes,
          tags: input.tags ?? [],
          sourceId: input.sourceId ?? 'local',
          deadline: input.deadline,
          createdAt: input.createdAt ?? Date.now(),
          pinned: false,
          recurrence: input.recurrence ?? 'none',
          cronExpr: input.cronExpr,
        }
        set({ todos: [...get().todos, todo] })
        return id
      },
      updateTodo: (id, patch) =>
        set({
          todos: get().todos.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }),
      removeTodo: (id) => set({ todos: get().todos.filter((t) => t.id !== id) }),
      toggleComplete: (id) => {
        const t = get().todos.find((x) => x.id === id)
        if (!t) return

        /* Recurring task: advance deadline forward instead of completing it.
           Already-completed recurring items still toggle back to active. */
        const isRec = t.recurrence && t.recurrence !== 'none'
        if (isRec && !t.completedAt) {
          const nextDeadline = advanceDeadline(t.deadline, t.recurrence as Recurrence, t.cronExpr)
          set({
            todos: get().todos.map((x) =>
              x.id === id ? { ...x, deadline: nextDeadline, createdAt: Date.now() } : x,
            ),
          })
          return
        }
        set({
          todos: get().todos.map((x) =>
            x.id === id
              ? { ...x, completedAt: x.completedAt ? undefined : Date.now() }
              : x,
          ),
        })
      },
      completeOccurrence: (id, occurrenceTs) => {
        const t = get().todos.find((x) => x.id === id)
        if (!t) return
        const isRec = t.recurrence && t.recurrence !== 'none'
        if (!isRec) {
          /* Non-recurring: just mark complete. */
          set({
            todos: get().todos.map((x) =>
              x.id === id ? { ...x, completedAt: Date.now() } : x,
            ),
          })
          return
        }
        /* Advance the parent forward (strictly) past the completed
           occurrence. Cap iterations to keep us safe from weird crons. */
        let d = t.deadline
        let guard = 0
        const target = Math.max(occurrenceTs, Date.now() - 60_000)
        while (d <= target && guard++ < 500) {
          const nd = advanceDeadline(d, t.recurrence as Recurrence, t.cronExpr)
          if (nd <= d) break
          d = nd
        }
        set({
          todos: get().todos.map((x) =>
            x.id === id ? { ...x, deadline: d, createdAt: Date.now() } : x,
          ),
        })
      },
      togglePin: (id) =>
        set({
          todos: get().todos.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t)),
        }),
      clearCompleted: () =>
        set({ todos: get().todos.filter((t) => !t.completedAt) }),
      replaceSource: (sourceId, items) =>
        set({
          todos: [
            ...get().todos.filter((t) => t.sourceId !== sourceId),
            ...items.map((t) => ({ ...t, sourceId })),
          ],
        }),
      importTodos: (items) => {
        const existing = new Map(get().todos.map((t) => [t.id, t]))
        for (const t of items) existing.set(t.id, t)
        set({ todos: Array.from(existing.values()) })
        return items.length
      },
      dropSource: (sourceId) =>
        set({ todos: get().todos.filter((t) => t.sourceId !== sourceId) }),
    }),
    {
      name: 'countdown.todos.v1',
      version: 3,
      migrate: (persisted: unknown) => {
        const s = persisted as { todos?: Partial<Todo>[] } | null
        if (!s || !Array.isArray(s.todos)) return { todos: [] }
        const todos: Todo[] = s.todos.map((t) => ({
          id: t.id ?? uid(),
          title: t.title ?? '',
          notes: t.notes,
          tags: Array.isArray(t.tags) ? t.tags : [],
          sourceId: t.sourceId ?? 'local',
          createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now(),
          deadline: typeof t.deadline === 'number' ? t.deadline : Date.now(),
          completedAt: t.completedAt,
          pinned: !!t.pinned,
          recurrence: (t.recurrence as Recurrence) ?? 'none',
          cronExpr: t.cronExpr,
        }))
        return { todos }
      },
    },
  ),
)

/* Selectors */
export const selectActive = (s: TodoState) =>
  s.todos
    .filter((t) => !t.completedAt)
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return a.deadline - b.deadline
    })

export const selectCompleted = (s: TodoState) =>
  s.todos
    .filter((t) => !!t.completedAt)
    .slice()
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))

export const selectNext = (s: TodoState): Todo | undefined => selectActive(s)[0]

export const selectAllTags = (s: TodoState): string[] => {
  const set = new Set<string>()
  for (const t of s.todos) for (const tag of t.tags) set.add(tag)
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}


