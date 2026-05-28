import { useEffect, useState } from 'react'

/* ----------------------------------------------------------------
 * Global low-frequency clock (~4Hz). Suitable for board cards.
 * Stops ticking when document is hidden; snaps to Date.now() on
 * visibility change to stay drift-free.
 * ---------------------------------------------------------------- */

let listeners: Set<(t: number) => void> = new Set()
let timer: number | null = null

function ensureTimer() {
  if (timer !== null) return
  const tick = () => {
    const t = Date.now()
    listeners.forEach((fn) => fn(t))
  }
  timer = window.setInterval(() => {
    if (document.hidden) return
    tick()
  }, 250)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) tick()
  })
}

export function useNow(): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    ensureTimer()
    listeners.add(setNow)
    return () => {
      listeners.delete(setNow)
    }
  }, [])
  return now
}

/* High-frequency clock (rAF) for the focus view's smooth digits. */
export function useNowFast(active = true): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    let raf = 0
    const loop = () => {
      setNow(Date.now())
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [active])
  return now
}
