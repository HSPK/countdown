import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '../lib/id'

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly'

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
}

export interface NewTodoInput {
  title: string
  deadline: number
  notes?: string
  tags?: string[]
  sourceId?: string
  createdAt?: number
  recurrence?: Recurrence
}

interface TodoState {
  todos: Todo[]
  addTodo: (input: NewTodoInput) => string
  updateTodo: (id: string, patch: Partial<Omit<Todo, 'id'>>) => void
  removeTodo: (id: string) => void
  toggleComplete: (id: string) => void
  togglePin: (id: string) => void
  clearCompleted: () => void
  /** Replace all todos that belong to a given sourceId (used by subscription refresh). */
  replaceSource: (sourceId: string, items: Todo[]) => void
  /** Import a list of todos with conflict resolution by id (replace-on-id). */
  importTodos: (items: Todo[]) => number
  /** Drop all todos that belong to the given sourceId. */
  dropSource: (sourceId: string) => void
}

function advanceDeadline(ts: number, kind: Recurrence): number {
  if (kind === 'none' || !kind) return ts
  const d = new Date(ts)
  switch (kind) {
    case 'daily':   d.setDate(d.getDate() + 1); break
    case 'weekly':  d.setDate(d.getDate() + 7); break
    case 'monthly': d.setMonth(d.getMonth() + 1); break
  }
  return d.getTime()
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
          const nextDeadline = advanceDeadline(t.deadline, t.recurrence as Recurrence)
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


