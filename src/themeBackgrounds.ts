import type { ComponentType } from 'react'
import type { ThemeName } from './store/settings'
import { CyberpunkBg } from './components/CyberpunkBg'
import { PaperBg } from './components/PaperBg'

/* Per-theme decorative background components. Only themes that need a
   dedicated DOM-rendered background appear here; the rest are styled
   purely via CSS tokens and have no entry. To add a themed background,
   register the theme in store/settings.ts THEMES and add it here — no
   App.tsx changes required. */
export const THEME_BG: Partial<Record<ThemeName, ComponentType>> = {
  cyberpunk: CyberpunkBg,
  paper: PaperBg,
}
