import { useEffect, useRef, useState } from 'react'
import { useTodos } from '../store/todos'
import { useSettings } from '../store/settings'
import { useSources } from '../store/sources'
import { useNowFast } from '../hooks/useNow'
import { diffParts, formatAbsolute, pad, progressPct, urgencyOf } from '../lib/time'
import { IconX, IconArrowLeft, IconMaximize, IconMinimize } from './Icons'

export function FocusView() {
  const focusId = useSettings((s) => s.focusId)
  const setFocus = useSettings((s) => s.setFocus)
  const todo = useTodos((s) => s.todos.find((t) => t.id === focusId))
  const source = useSources((s) => s.sources.find((x) => x.id === todo?.sourceId))
  const now = useNowFast(!!focusId)
  const [idle, setIdle] = useState(false)
  const [fs, setFs] = useState(false)
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

  /* On mobile-portrait, auto-enter browser fullscreen and lock landscape so
     the timer always shows in widescreen even with the phone held vertical. */
  useEffect(() => {
    if (!focusId) return
    const isSmall = window.matchMedia('(max-width: 720px)').matches
    if (!isSmall) return
    let didLock = false
    ;(async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen?.()
          enteredFs.current = true
        }
        // Safari / older browsers don't expose `lock`.
        const so = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }
        if (so?.lock) {
          await so.lock('landscape')
          didLock = true
        }
      } catch { /* user denied or unsupported */ }
    })()
    return () => {
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
      role="dialog"
      aria-modal="true"
      style={{ ['--digit-shrink' as never]: digitShrink }}
    >
      <div className="focus__bg" aria-hidden />

      <div className="focus__chrome focus__top">
        <button
          className="focus__top-btn"
          aria-label="返回看板 (Esc)"
          title="返回看板 (Esc)"
          onClick={() => setFocus(null)}
        >
          <IconArrowLeft />
        </button>
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
            aria-live="polite"
          >
            <div className="focus__seg">
              <span className="focus__seg-num">{pad(d)}</span>
              <span className="focus__seg-label">Days</span>
            </div>
            <span className="focus__sep">:</span>
            <div className="focus__seg">
              <span className="focus__seg-num">{pad(h)}</span>
              <span className="focus__seg-label">Hours</span>
            </div>
            <span className="focus__sep">:</span>
            <div className="focus__seg">
              <span className="focus__seg-num">{pad(m)}</span>
              <span className="focus__seg-label">Min</span>
            </div>
            <span className="focus__sep">:</span>
            <div className="focus__seg">
              <span className="focus__seg-num">{pad(s)}</span>
              <span className="focus__seg-label">Sec</span>
            </div>
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


