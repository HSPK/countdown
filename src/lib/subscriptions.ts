import { useSources, type Source } from '../store/sources'
import { useTodos } from '../store/todos'
import { fetchSubscription } from './portable'

/* Single source of truth for the fetch → replaceSource → setStatus dance.
   Used both by the boot-time refresh and the user-triggered refresh in
   SourceManager so the two stay in sync. */
export async function refreshSource(src: Source): Promise<void> {
  if (src.type !== 'url' || !src.url) return
  const { setStatus } = useSources.getState()
  const { replaceSource } = useTodos.getState()

  setStatus(src.id, { status: 'fetching', lastError: undefined })
  try {
    const items = await fetchSubscription(src.url, src.id)
    replaceSource(src.id, items)
    setStatus(src.id, { status: 'ok', lastFetched: Date.now() })
  } catch (e) {
    setStatus(src.id, {
      status: 'error',
      lastError: e instanceof Error ? e.message : String(e),
    })
  }
}

const BOOT_REFRESH_FLAG = 'countdown.sources.refreshed'

/* Refresh every enabled URL source once per session. The session-storage
   flag prevents repeat fires on tab restoration / HMR. */
export function refreshAllEnabledOnce(): void {
  if (sessionStorage.getItem(BOOT_REFRESH_FLAG)) return
  sessionStorage.setItem(BOOT_REFRESH_FLAG, '1')
  for (const s of useSources.getState().sources) {
    if (s.type === 'url' && s.enabled && s.url) void refreshSource(s)
  }
}
