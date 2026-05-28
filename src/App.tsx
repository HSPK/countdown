import { useEffect, useRef } from 'react'
import { HomeTab } from './components/HomeTab'
import { AllTab } from './components/AllTab'
import { SettingsTab } from './components/SettingsTab'
import { Composer } from './components/Composer'
import { TabBar } from './components/TabBar'
import { FocusView } from './components/FocusView'
import { HelpPage } from './components/HelpPage'
import { CyberpunkBg } from './components/CyberpunkBg'
import { PaperBg } from './components/PaperBg'
import { useSettings, type TabId } from './store/settings'
import { useSources } from './store/sources'
import { useCustomThemes, applyCustomTokens } from './store/customThemes'
import { useTodos, selectNext } from './store/todos'
import { useHotkey } from './hooks/useHotkey'
import { useSwipe } from './hooks/useSwipe'
import { useNotifier } from './hooks/useNotifier'
import { seedIfEmpty } from './lib/seed'
import { fetchSubscription } from './lib/portable'

const ORDER: TabId[] = ['home', 'all', 'settings']
const BUILTIN_THEMES = ['mono-light', 'mono-dark', 'paper', 'cyberpunk']

export default function App() {
  const theme = useSettings((s) => s.theme)
  const tab = useSettings((s) => s.tab)
  const setTab = useSettings((s) => s.setTab)
  const focusId = useSettings((s) => s.focusId)
  const setFocus = useSettings((s) => s.setFocus)
  const cycleTheme = useSettings((s) => s.cycleTheme)
  const next = useTodos(selectNext)
  const customThemes = useCustomThemes((s) => s.themes)
  const notifierEnabled = useCustomThemes((s) => s.notifier.enabled)

  const composerRef = useRef<HTMLInputElement | null>(null)
  const mainRef = useRef<HTMLElement | null>(null)

  useEffect(() => { seedIfEmpty() }, [])

  /* Apply theme: built-in via data-theme, custom via inline tokens.
     Custom themes can optionally extend a built-in via `base`. */
  useEffect(() => {
    const custom = customThemes.find((t) => t.id === theme)
    if (custom) {
      document.documentElement.setAttribute('data-theme', custom.base ?? 'mono-light')
      return applyCustomTokens(custom.tokens)
    }
    if (BUILTIN_THEMES.includes(theme)) {
      document.documentElement.setAttribute('data-theme', theme)
    } else {
      document.documentElement.setAttribute('data-theme', 'mono-light')
    }
  }, [theme, customThemes])

  /* Refresh enabled URL sources on app boot */
  useEffect(() => {
    const ran = sessionStorage.getItem('countdown.sources.refreshed')
    if (ran) return
    sessionStorage.setItem('countdown.sources.refreshed', '1')

    const { sources } = useSources.getState()
    for (const s of sources) {
      if (s.type !== 'url' || !s.enabled || !s.url) continue
      useSources.getState().setStatus(s.id, { status: 'fetching' })
      fetchSubscription(s.url, s.id)
        .then((items) => {
          useTodos.getState().replaceSource(s.id, items)
          useSources.getState().setStatus(s.id, { status: 'ok', lastFetched: Date.now() })
        })
        .catch((e: unknown) => {
          useSources.getState().setStatus(s.id, {
            status: 'error',
            lastError: e instanceof Error ? e.message : String(e),
          })
        })
    }
  }, [])

  /* Desktop notifications — only when user has explicitly enabled in Settings */
  useNotifier(notifierEnabled)

  /* Swipe to switch tabs */
  const switchTab = (delta: number) => {
    const i = ORDER.indexOf(tab)
    const next = (i + delta + ORDER.length) % ORDER.length
    setTab(ORDER[next])
  }
  useSwipe(mainRef, () => switchTab(+1), () => switchTab(-1))

  useHotkey('n', (e) => {
    e.preventDefault()
    composerRef.current?.focus()
    composerRef.current?.select()
  })
  useHotkey('t', () => cycleTheme())
  useHotkey('Enter', () => { if (!focusId && next) setFocus(next.id) })
  useHotkey('1', () => setTab('home'))
  useHotkey('2', () => setTab('all'))
  useHotkey('3', () => setTab('settings'))
  useHotkey('ArrowLeft',  () => { if (useSettings.getState().helpSection === null) switchTab(-1) })
  useHotkey('ArrowRight', () => { if (useSettings.getState().helpSection === null) switchTab(+1) })

  return (
    <div className="app">
      {theme === 'cyberpunk' && <CyberpunkBg />}
      {theme === 'paper' && <PaperBg />}

      <main className="app__main" ref={mainRef} key={tab}>
        {tab === 'home' && <HomeTab />}
        {tab === 'all' && <AllTab />}
        {tab === 'settings' && <SettingsTab />}
      </main>

      <div className="dock">
        {tab !== 'settings' && <Composer inputRef={composerRef} />}
        <TabBar />
      </div>

      <FocusView />
      <HelpPage />
    </div>
  )
}


