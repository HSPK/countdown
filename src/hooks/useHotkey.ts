import { useEffect } from 'react'

type Handler = (e: KeyboardEvent) => void

interface Options {
  enabled?: boolean
  /** When true, also fires inside text inputs. Default false. */
  whileTyping?: boolean
}

export function useHotkey(key: string | string[], handler: Handler, opts: Options = {}) {
  const { enabled = true, whileTyping = false } = opts
  useEffect(() => {
    if (!enabled) return
    const keys = Array.isArray(key) ? key : [key]
    const onKey = (e: KeyboardEvent) => {
      if (!whileTyping) {
        const target = e.target as HTMLElement | null
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable)
        ) {
          return
        }
      }
      const k = e.key
      if (keys.includes(k) || keys.includes(k.toLowerCase())) {
        handler(e)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [key, handler, enabled, whileTyping])
}
