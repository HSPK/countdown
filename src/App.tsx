import { useCallback, useEffect, useRef } from 'react'
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
const BUILTIN_THEMES = ['mono-light', 'mono-dark', 'paper', 'cyberpunk', 'flip']

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
  /* Track previous tab so the inner pane can animate from the correct side
     (slide-in-from-right when moving forward, from-left when moving back).
     Mutating a ref during render is OK here — we only need the previous
     value for visual direction; React state would lag by one paint. */
  const prevTabRef = useRef<TabId>(tab)
  const dir: 'fwd' | 'back' | 'init' = (() => {
    const prev = prevTabRef.current
    if (prev === tab) return 'init'
    const pi = ORDER.indexOf(prev)
    const ci = ORDER.indexOf(tab)
    return ci > pi ? 'fwd' : 'back'
  })()
  prevTabRef.current = tab

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

  /* Swipe to switch tabs. Memoized so useSwipe doesn't reattach on every
     render. We read the current tab inside the callback to avoid stale
     closures. */
  const switchTab = useCallback((delta: number) => {
    const cur = useSettings.getState().tab
    const i = ORDER.indexOf(cur)
    const j = (i + delta + ORDER.length) % ORDER.length
    setTab(ORDER[j])
  }, [setTab])
  const onSwipeLeft  = useCallback(() => switchTab(+1), [switchTab])
  const onSwipeRight = useCallback(() => switchTab(-1), [switchTab])
  useSwipe(mainRef, onSwipeLeft, onSwipeRight)

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

      {/* The ref'd <main> stays mounted across tab changes so swipe
          listeners persist and iOS doesn't lose the tap after a swipe.
          The inner pane is keyed so the slide-in animation still runs. */}
      <main className="app__main" ref={mainRef}>
        <div className="app__pane" data-dir={dir} key={tab}>
          {tab === 'home' && <HomeTab />}
          {tab === 'all' && <AllTab />}
          {tab === 'settings' && <SettingsTab />}
        </div>
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


