import { useRef } from 'react'

/* Touch long-press detector. Returns props to spread on any element.
   Fires `onLongPress` after `delay` ms (default 500) of an unmoved
   touch. Cancels on touchmove > MOVE_TOLERANCE pixels or on touchend
   before the delay. Mouse events are ignored (long-press is a touch
   gesture; desktop uses hover-revealed icons instead). */
const MOVE_TOLERANCE = 8

export function useLongPress(onLongPress: () => void, delay: number = 500): {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: () => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchCancel: () => void
} {
  const cbRef = useRef(onLongPress)
  cbRef.current = onLongPress
  const timer = useRef<number | null>(null)
  const start = useRef<{ x: number; y: number } | null>(null)

  const cancel = () => {
    if (timer.current !== null) { window.clearTimeout(timer.current); timer.current = null }
    start.current = null
  }

  return {
    onTouchStart: (e) => {
      const t = e.touches[0]
      if (!t) return
      start.current = { x: t.clientX, y: t.clientY }
      timer.current = window.setTimeout(() => {
        timer.current = null
        cbRef.current()
      }, delay)
    },
    onTouchMove: (e) => {
      const s = start.current
      if (!s) return
      const t = e.touches[0]
      if (!t) return
      const dx = Math.abs(t.clientX - s.x)
      const dy = Math.abs(t.clientY - s.y)
      if (dx > MOVE_TOLERANCE || dy > MOVE_TOLERANCE) cancel()
    },
    onTouchEnd: cancel,
    onTouchCancel: cancel,
  }
}
