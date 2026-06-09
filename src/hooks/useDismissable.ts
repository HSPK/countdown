import { useEffect, useRef } from 'react'

/* Outside-click + Escape dismissal. Caller owns the open state and the
   anchor ref (the element the popover is attached to); we just wire the
   document listeners and call onDismiss when the user gestures outside
   or hits Escape. Listeners are only attached while `open` is true. */
export function useDismissable<T extends HTMLElement>(
  anchorRef: React.RefObject<T | null>,
  open: boolean,
  onDismiss: () => void,
): void {
  const cbRef = useRef(onDismiss)
  cbRef.current = onDismiss

  useEffect(() => {
    if (!open) return
    const isInside = (target: EventTarget | null) =>
      !!target && !!anchorRef.current?.contains(target as Node)

    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!isInside(e.target)) cbRef.current()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cbRef.current()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown, { passive: true })
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, anchorRef])
}
