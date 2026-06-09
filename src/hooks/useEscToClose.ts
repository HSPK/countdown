import { useEffect, useRef } from 'react'

/* Window-level Escape handler. Shared by every modal/overlay so the
   teardown semantics (cleanup on unmount, fresh callback ref) are
   defined exactly once. Pass `enabled=false` to no-op without unhooking
   listeners on the caller side. */
export function useEscToClose(
  onClose: () => void,
  enabled: boolean = true,
  options: { ignoreInFullscreen?: boolean } = {},
): void {
  const { ignoreInFullscreen = false } = options
  const cbRef = useRef(onClose)
  cbRef.current = onClose

  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (ignoreInFullscreen && document.fullscreenElement) return
      cbRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, ignoreInFullscreen])
}
