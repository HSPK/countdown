import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  defaultAbsolutePresets,
  defaultRelativePresets,
  type AbsolutePreset,
  type RelativePreset,
} from '../lib/chipResolver'

interface ChipPresetsState {
  relative: RelativePreset[]
  absolute: AbsolutePreset[]

  addRelative: (p: RelativePreset) => void
  updateRelative: (id: string, patch: Partial<Omit<RelativePreset, 'id'>>) => void
  removeRelative: (id: string) => void

  addAbsolute: (p: AbsolutePreset) => void
  updateAbsolute: (id: string, patch: Partial<Omit<AbsolutePreset, 'id'>>) => void
  removeAbsolute: (id: string) => void

  resetRelative: () => void
  resetAbsolute: () => void
  resetAll: () => void
}

export const useChipPresets = create<ChipPresetsState>()(
  persist(
    (set, get) => ({
      relative: defaultRelativePresets(),
      absolute: defaultAbsolutePresets(),

      addRelative: (p) => set({ relative: [...get().relative, p] }),
      updateRelative: (id, patch) =>
        set({ relative: get().relative.map((x) => (x.id === id ? { ...x, ...patch } : x)) }),
      removeRelative: (id) =>
        set({ relative: get().relative.filter((x) => x.id !== id) }),

      addAbsolute: (p) => set({ absolute: [...get().absolute, p] }),
      updateAbsolute: (id, patch) =>
        set({ absolute: get().absolute.map((x) => (x.id === id ? { ...x, ...patch } : x)) }),
      removeAbsolute: (id) =>
        set({ absolute: get().absolute.filter((x) => x.id !== id) }),

      resetRelative: () => set({ relative: defaultRelativePresets() }),
      resetAbsolute: () => set({ absolute: defaultAbsolutePresets() }),
      resetAll: () => set({
        relative: defaultRelativePresets(),
        absolute: defaultAbsolutePresets(),
      }),
    }),
    {
      name: 'countdown.chips.v1',
      version: 1,
    },
  ),
)
