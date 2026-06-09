import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SoundId } from '../lib/soundEngine'

interface FeedbackPrefsState {
  soundEnabled: boolean
  soundId: SoundId
  vibrationEnabled: boolean
  setSoundEnabled: (v: boolean) => void
  setSoundId: (id: SoundId) => void
  setVibrationEnabled: (v: boolean) => void
}

export const useFeedbackPrefs = create<FeedbackPrefsState>()(
  persist(
    (set) => ({
      soundEnabled: false,
      soundId: 'pop',
      vibrationEnabled: false,
      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setSoundId: (id) => set({ soundId: id }),
      setVibrationEnabled: (v) => set({ vibrationEnabled: v }),
    }),
    {
      name: 'countdown.feedback.v1',
      version: 1,
    },
  ),
)
