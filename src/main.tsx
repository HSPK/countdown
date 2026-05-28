import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { useSettings, THEMES, type ThemeName } from './store/settings'
import './styles/globals.css'

try {
  const sp = new URLSearchParams(window.location.search)
  const q = sp.get('theme') as ThemeName | null
  if (q && THEMES.some((t) => t.id === q)) {
    useSettings.getState().setTheme(q)
  }
} catch {}

document.documentElement.setAttribute('data-theme', useSettings.getState().theme)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)


