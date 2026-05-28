import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeName = 'mono-light' | 'mono-dark' | 'paper' | 'cyberpunk' | 'flip'
export type TabId = 'home' | 'all' | 'settings'
export type Lang = 'en' | 'zh-CN'

export interface ThemeMeta {
  id: ThemeName
  name: string
  hint: string
}

export const THEMES: ThemeMeta[] = [
  { id: 'mono-light', name: 'Mono Light', hint: 'SANS · LIGHT' },
  { id: 'mono-dark',  name: 'Mono Dark',  hint: 'SANS · DARK'  },
  { id: 'paper',      name: 'Paper',      hint: 'serif'        },
  { id: 'cyberpunk',  name: 'Cyberpunk',  hint: 'NEON · MONO'  },
  { id: 'flip',       name: 'Flip Clock', hint: 'AMBER · CARDS' },
]

interface SettingsState {
  theme: ThemeName
  tab: TabId
  lang: Lang
  focusId: string | null
  helpSection: string | null
  setTheme: (t: ThemeName) => void
  cycleTheme: () => void
  setTab: (t: TabId) => void
  setLang: (l: Lang) => void
  setFocus: (id: string | null) => void
  setHelp: (section: string | null) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'mono-light',
      tab: 'home',
      lang: 'en',
      focusId: null,
      helpSection: null,
      setTheme: (t) => set({ theme: t }),
      cycleTheme: () => {
        const order = THEMES.map((t) => t.id)
        const i = order.indexOf(get().theme)
        set({ theme: order[(i + 1) % order.length] })
      },
      setTab: (t) => set({ tab: t }),
      setLang: (l) => set({ lang: l }),
      setFocus: (id) => set({ focusId: id }),
      setHelp: (s) => set({ helpSection: s }),
    }),
    {
      name: 'countdown.settings.v1',
      partialize: (s) => ({ theme: s.theme, tab: s.tab, lang: s.lang }),
      version: 5,
      migrate: (persistedState: unknown) => {
        const s = persistedState as { theme?: string; tab?: string; lang?: string } | null
        const map: Record<string, ThemeName> = {
          'aurora':  'mono-dark',
          'minimal': 'mono-light',
        }
        let theme: ThemeName = 'mono-light'
        if (s?.theme) {
          const mapped = map[s.theme] || s.theme
          const valid: ThemeName[] = ['mono-light', 'mono-dark', 'paper', 'cyberpunk', 'flip']
          if (valid.includes(mapped as ThemeName)) theme = mapped as ThemeName
        }
        const validTabs: TabId[] = ['home', 'all', 'settings']
        const tab: TabId = (s?.tab && validTabs.includes(s.tab as TabId)) ? (s.tab as TabId) : 'home'
        const validLangs: Lang[] = ['en', 'zh-CN']
        const lang: Lang = (s?.lang && validLangs.includes(s.lang as Lang)) ? (s.lang as Lang) : 'en'
        return { theme, tab, lang }
      },
    },
  ),
)



