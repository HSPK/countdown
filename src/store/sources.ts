import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '../lib/id'

export type SourceType = 'local' | 'url'
export type SourceStatus = 'idle' | 'fetching' | 'ok' | 'error'

export interface Source {
  id: string
  type: SourceType
  name: string
  url?: string
  enabled: boolean
  status: SourceStatus
  lastFetched?: number
  lastError?: string
  /** Auto-refresh interval, minutes. 0 = manual only */
  intervalMin?: number
}

export const LOCAL_SOURCE_ID = 'local'

interface SourcesState {
  sources: Source[]
  addUrl: (input: { name: string; url: string; intervalMin?: number }) => string
  remove: (id: string) => void
  toggle: (id: string) => void
  setStatus: (id: string, patch: Partial<Source>) => void
  update: (id: string, patch: Partial<Omit<Source, 'id' | 'type'>>) => void
}

const DEFAULT_LOCAL: Source = {
  id: LOCAL_SOURCE_ID,
  type: 'local',
  name: 'Local',
  enabled: true,
  status: 'idle',
}

export const useSources = create<SourcesState>()(
  persist(
    (set, get) => ({
      sources: [DEFAULT_LOCAL],
      addUrl: ({ name, url, intervalMin }) => {
        const id = uid()
        const s: Source = {
          id, type: 'url', name: name.trim() || url, url: url.trim(),
          enabled: true, status: 'idle', intervalMin,
        }
        set({ sources: [...get().sources, s] })
        return id
      },
      remove: (id) => {
        if (id === LOCAL_SOURCE_ID) return
        set({ sources: get().sources.filter((s) => s.id !== id) })
      },
      toggle: (id) =>
        set({
          sources: get().sources.map((s) =>
            s.id === id ? { ...s, enabled: !s.enabled } : s,
          ),
        }),
      setStatus: (id, patch) =>
        set({
          sources: get().sources.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        }),
      update: (id, patch) =>
        set({
          sources: get().sources.map((s) =>
            s.id === id ? { ...s, ...patch } : s,
          ),
        }),
    }),
    {
      name: 'countdown.sources.v1',
      version: 1,
      migrate: (persisted: unknown) => {
        const s = persisted as { sources?: Source[] } | null
        const all = Array.isArray(s?.sources) ? s.sources : []
        // Ensure the local source is always present and at index 0
        const local = all.find((x) => x.id === LOCAL_SOURCE_ID) ?? DEFAULT_LOCAL
        return { sources: [local, ...all.filter((x) => x.id !== LOCAL_SOURCE_ID)] }
      },
    },
  ),
)
