import { useEffect, useRef, useState } from 'react'
import { useTodos } from '../store/todos'
import { useSettings } from '../store/settings'
import { useSources } from '../store/sources'
import { useNowFast } from '../hooks/useNow'
import { diffParts, formatAbsolute, pad, progressPct, urgencyOf } from '../lib/time'
import { IconX, IconMaximize, IconMinimize } from './Icons'

/* Each glyph in its own fixed-width cell so the layout never shifts when
   digits tick. The inner span is keyed on (index, char) so the entry
   animation (used by themes like flip) fires whenever a digit changes. */
function Digits({ value, label }: { value: string; label: string }) {
  return (
    <div className="focus__seg">
      <span className="focus__seg-num digits">
        {value.split('').map((ch, i) => (
          <span className="digits__cell" key={i}>
            <span className="digits__inner" key={`${i}-${ch}`}>{ch}</span>
          </span>
        ))}
      </span>
      <span className="focus__seg-label">{label}</span>
    </div>
  )
}

export function FocusView() {
  const focusId = useSettings((s) => s.focusId)
  const setFocus = useSettings((s) => s.setFocus)
  const todo = useTodos((s) => s.todos.find((t) => t.id === focusId))
  const source = useSources((s) => s.sources.find((x) => x.id === todo?.sourceId))
  const now = useNowFast(!!focusId)
  const [idle, setIdle] = useState(false)
  const [fs, setFs] = useState(false)
  const [forceRotate, setForceRotate] = useState(false)
  const idleTimer = useRef<number | null>(null)
  const enteredFs = useRef(false)

  /* Idle hide after no activity */
  useEffect(() => {
    if (!focusId) return
    const reset = () => {
      setIdle(false)
      if (idleTimer.current) window.clearTimeout(idleTimer.current)
      idleTimer.current = window.setTimeout(() => setIdle(true), 4500)
    }
    reset()
    window.addEventListener('mousemove', reset)
    window.addEventListener('keydown', reset)
    window.addEventListener('touchstart', reset)
    return () => {
      window.removeEventListener('mousemove', reset)
      window.removeEventListener('keydown', reset)
      window.removeEventListener('touchstart', reset)
      if (idleTimer.current) window.clearTimeout(idleTimer.current)
    }
  }, [focusId])

  /* Keep the screen awake while focused. Wake Lock API; gracefully no-op on
     browsers that don't support it (iOS Safari pre-16.4 etc.). Re-acquire
     when the tab becomes visible again — the OS auto-releases on hide. */
  useEffect(() => {
    if (!focusId) return
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<{
        release: () => Promise<void>
        addEventListener?: (ev: string, cb: () => void) => void
      }> }
    }
    if (!nav.wakeLock?.request) return

    let sentinel: Awaited<ReturnType<typeof nav.wakeLock.request>> | null = null
    let alive = true

    const acquire = async () => {
      if (!alive || sentinel || document.visibilityState !== 'visible') return
      try {
        sentinel = await nav.wakeLock!.request('screen')
        sentinel.addEventListener?.('release', () => { sentinel = null })
      } catch { /* user denied / power-saver / unsupported */ }
    }
    acquire()
    const onVis = () => {
      if (document.visibilityState === 'visible') acquire()
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      alive = false
      document.removeEventListener('visibilitychange', onVis)
      sentinel?.release().catch(() => {})
      sentinel = null
    }
  }, [focusId])

  /* ESC closes focus */
  useEffect(() => {
    if (!focusId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) setFocus(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focusId, setFocus])

  /* Track browser fullscreen state */
  useEffect(() => {
    const onFs = () => setFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  /* Auto-exit browser fullscreen if we entered it */
  useEffect(() => {
    if (!focusId && enteredFs.current && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {})
      enteredFs.current = false
    }
  }, [focusId])

  /* On mobile-portrait, try the standard fullscreen + orientation lock path.
     On platforms where lock() is unavailable or rejected (e.g. iOS Safari
     in browser mode), fall back to a CSS rotation so the user can still see
     the timer in landscape orientation. Cancel both when leaving focus. */
  useEffect(() => {
    if (!focusId) return
    const isSmall = window.matchMedia('(max-width: 720px)').matches
    if (!isSmall) return
    let didLock = false
    let cancelled = false
    ;(async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen?.()
          enteredFs.current = true
        }
      } catch { /* user denied or unsupported */ }
      if (cancelled) return
      const so = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }
      try {
        if (so?.lock) {
          await so.lock('landscape')
          didLock = true
        } else {
          throw new Error('no-lock')
        }
      } catch {
        /* iOS Safari etc. — use CSS rotation if currently portrait. */
        if (cancelled) return
        const portrait = window.matchMedia('(orientation: portrait)').matches
        if (portrait) setForceRotate(true)
      }
    })()

    /* If the user naturally rotates the device into landscape, drop the
       forced CSS rotation. */
    const mql = window.matchMedia('(orientation: landscape)')
    const onOri = () => { if (mql.matches) setForceRotate(false) }
    mql.addEventListener?.('change', onOri)

    return () => {
      cancelled = true
      mql.removeEventListener?.('change', onOri)
      setForceRotate(false)
      if (didLock) {
        try { (screen.orientation as ScreenOrientation & { unlock?: () => void })?.unlock?.() } catch { /* noop */ }
      }
    }
  }, [focusId])

  if (!focusId || !todo) return null

  const toggleBrowserFs = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.()
        enteredFs.current = true
      } else {
        await document.exitFullscreen?.()
        enteredFs.current = false
      }
    } catch { /* user denied or unsupported */ }
  }

  const remaining = todo.deadline - now
  const u = urgencyOf(remaining)
  const overdue = remaining <= 0
  const { d, h, m, s } = diffParts(remaining)
  const pct = progressPct(todo.createdAt, todo.deadline, now)

  /* Scale digits down a bit when the day count is huge — keeps everything on
     one line for 100+/1000+ countdowns. */
  const digitShrink = d > 9999 ? 0.55 : d > 999 ? 0.7 : d > 99 ? 0.85 : 1

  return (
    <div
      className="focus"
      data-idle={idle}
      data-rotate={forceRotate}
      role="dialog"
      aria-modal="true"
      style={{ ['--digit-shrink' as never]: digitShrink }}
    >
      <div className="focus__bg" aria-hidden />

      <div className="focus__chrome focus__top">
        <span className="focus__crumb">{source && source.id !== 'local' ? source.name : '本地'}</span>
        <span className="focus__top-spacer" />
        <button
          className="focus__top-btn"
          aria-label={fs ? '退出浏览器全屏' : '浏览器全屏'}
          title={fs ? '退出浏览器全屏 (F11)' : '进入浏览器全屏 (F11)'}
          onClick={toggleBrowserFs}
        >
          {fs ? <IconMinimize /> : <IconMaximize />}
        </button>
        <button
          className="focus__top-btn"
          aria-label="关闭"
          title="关闭 (Esc)"
          onClick={() => setFocus(null)}
        >
          <IconX />
        </button>
      </div>

      <div className="focus__inner">
        {/* Title stays visible even in idle state */}
        <h1 className="focus__title">{todo.title}</h1>

        <div className="focus__digits-wrap">
          {overdue && (
            <span
              className="focus__sign"
              aria-label="已超时"
              title="已超时"
            >+</span>
          )}
          <div
            className={
              'focus__digits' +
              (overdue ? ' focus__digits--overdue' : u === 'critical' ? ' focus__digits--critical' : '')
            }
            aria-live="off"
          >
            <Digits value={pad(d)} label="Days" />
            <span className="focus__sep" aria-hidden>:</span>
            <Digits value={pad(h)} label="Hours" />
            <span className="focus__sep" aria-hidden>:</span>
            <Digits value={pad(m)} label="Min" />
            <span className="focus__sep" aria-hidden>:</span>
            <Digits value={pad(s)} label="Sec" />
          </div>
        </div>

        <div className="focus__chrome focus__progress" aria-hidden>
          <div className="focus__progress-rail">
            <div
              className="focus__progress-fill"
              style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
            />
          </div>
        </div>

        <div className="focus__chrome focus__meta">
          截止 {formatAbsolute(todo.deadline)}
          {todo.tags.length > 0 && (
            <span style={{ marginLeft: 14, display: 'inline-flex', gap: 4 }}>
              {todo.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}


