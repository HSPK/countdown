import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '../lib/id'

export interface ThemeFile {
  id: string                       // unique id (slugified or generated)
  name: string                     // display name
  hint?: string                    // small description
  base?: 'mono-light' | 'mono-dark' | 'paper' | 'cyberpunk'  // optional inheritance
  tokens: Record<string, string>   // CSS custom properties
}

export interface NotifierPrefs {
  enabled: boolean
}

interface CustomThemesState {
  themes: ThemeFile[]
  notifier: NotifierPrefs
  addTheme: (t: ThemeFile) => void
  removeTheme: (id: string) => void
  setNotifier: (p: Partial<NotifierPrefs>) => void
}

export const useCustomThemes = create<CustomThemesState>()(
  persist(
    (set, get) => ({
      themes: [],
      notifier: { enabled: false },
      addTheme: (t) => {
        const id = t.id || `custom-${uid().slice(0, 6)}`
        const next = { ...t, id }
        const existing = get().themes.filter((x) => x.id !== id)
        set({ themes: [...existing, next] })
      },
      removeTheme: (id) =>
        set({ themes: get().themes.filter((t) => t.id !== id) }),
      setNotifier: (p) =>
        set({ notifier: { ...get().notifier, ...p } }),
    }),
    {
      name: 'countdown.themes.v1',
      version: 1,
    },
  ),
)

/** Parse a theme JSON blob. Loose validation (just makes sure tokens look like
 *  a string→string map). Throws on hard failure. */
export function parseThemeJson(raw: string): ThemeFile {
  let data: unknown
  try { data = JSON.parse(raw) } catch { throw new Error('JSON parse failed') }
  if (!data || typeof data !== 'object') throw new Error('Expected object { name, tokens }')
  const obj = data as Record<string, unknown>
  const name = typeof obj.name === 'string' ? obj.name : 'Untitled theme'
  const id = typeof obj.id === 'string' && obj.id ? obj.id : ''
  const hint = typeof obj.hint === 'string' ? obj.hint : undefined
  const base = typeof obj.base === 'string' ? obj.base as ThemeFile['base'] : undefined
  const t = obj.tokens
  if (!t || typeof t !== 'object') throw new Error('Missing `tokens` field')
  const tokens: Record<string, string> = {}
  for (const [k, v] of Object.entries(t as Record<string, unknown>)) {
    if (typeof v !== 'string') continue
    const key = k.startsWith('--') ? k : `--${k}`
    tokens[key] = v
  }
  return { id, name, hint, base, tokens }
}

export async function fetchThemeUrl(url: string): Promise<ThemeFile> {
  const res = await fetch(url, { mode: 'cors' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return parseThemeJson(await res.text())
}

/* Apply a custom theme's tokens to <html> as inline CSS variables.
   Returns a cleanup function that removes them. */
export function applyCustomTokens(tokens: Record<string, string>): () => void {
  const html = document.documentElement
  const applied: string[] = []
  for (const [k, v] of Object.entries(tokens)) {
    html.style.setProperty(k, v)
    applied.push(k)
  }
  return () => { for (const k of applied) html.style.removeProperty(k) }
}
