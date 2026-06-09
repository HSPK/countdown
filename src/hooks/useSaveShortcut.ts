import { useEffect, useRef } from 'react'

/* Cmd/Ctrl+Enter handler. Mirrors the modal save shortcut convention.
   Callback held in a ref so closures over form state don't force the
   effect to re-bind on every keystroke. */
export function useSaveShortcut(onSave: () => void, enabled: boolean = true): void {
  const cbRef = useRef(onSave)
  cbRef.current = onSave

  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        cbRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}
