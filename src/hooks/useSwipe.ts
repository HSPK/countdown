import { useEffect } from 'react'

interface Options {
  threshold?: number      // minimum horizontal distance (px)
  ratio?: number          // |dx| must be ratio * |dy|
  maxDuration?: number    // max ms from touchstart to touchend
}

/** Detect horizontal swipe gestures on the given element ref.
 *  Only fires on quick, predominantly-horizontal touches. */
export function useSwipe(
  ref: React.RefObject<HTMLElement | null>,
  onLeft: () => void,   // swipe finger right→left  (i.e. next page)
  onRight: () => void,  // swipe finger left→right  (i.e. previous page)
  opts: Options = {},
) {
  const { threshold = 60, ratio = 1.4, maxDuration = 800 } = opts
  useEffect(() => {
    const el = ref.current
    if (!el) return

    let startX = 0
    let startY = 0
    let startT = 0
    let tracking = false

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t) return
      startX = t.clientX
      startY = t.clientY
      startT = Date.now()
      tracking = true
    }
    const onEnd = (e: TouchEvent) => {
      if (!tracking) return
      tracking = false
      const t = e.changedTouches[0]
      if (!t) return
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      const dt = Date.now() - startT
      if (dt > maxDuration) return
      if (Math.abs(dx) < threshold) return
      if (Math.abs(dx) < Math.abs(dy) * ratio) return
      if (dx < 0) onLeft()
      else onRight()
    }
    const onCancel = () => { tracking = false }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchend', onEnd, { passive: true })
    el.addEventListener('touchcancel', onCancel, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onCancel)
    }
  }, [ref, onLeft, onRight, threshold, ratio, maxDuration])
}
