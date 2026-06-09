import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface NotifierPrefsState {
  enabled: boolean
  setEnabled: (v: boolean) => void
}

const NEW_KEY = 'countdown.notifier.v1'
const LEGACY_KEY = 'countdown.themes.v1'

/* One-time copy of the notifier flag from the legacy combined themes blob
   into its own key. Runs synchronously before the store is created so the
   user's existing toggle is preserved through the split. */
function migrateFromLegacy(): void {
  try {
    if (localStorage.getItem(NEW_KEY)) return
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as { state?: { notifier?: { enabled?: unknown } } }
    const n = parsed?.state?.notifier
    if (!n || typeof n.enabled !== 'boolean') return
    localStorage.setItem(NEW_KEY, JSON.stringify({
      state: { enabled: n.enabled },
      version: 1,
    }))
  } catch { /* ignore */ }
}
migrateFromLegacy()

export const useNotifierPrefs = create<NotifierPrefsState>()(
  persist(
    (set) => ({
      enabled: false,
      setEnabled: (v) => set({ enabled: v }),
    }),
    {
      name: NEW_KEY,
      version: 1,
    },
  ),
)
