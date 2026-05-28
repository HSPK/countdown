import { useEffect } from 'react'
import { useTodos } from '../store/todos'

const STORAGE_KEY = 'countdown.notified.v1'
const POLL_MS = 30_000

interface NotifiedMap { [key: string]: number }

function loadNotified(): NotifiedMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}
function saveNotified(m: NotifiedMap): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(m)) } catch { /* ignore */ }
}

interface Threshold { id: string; ms: number; label: string }

const THRESHOLDS: Threshold[] = [
  { id: '1h',  ms: 60 * 60 * 1000, label: '1 hour left' },
  { id: '10m', ms: 10 * 60 * 1000, label: '10 minutes left' },
  { id: '0',   ms: 0,              label: 'Due now' },
]

function notify(title: string, body: string, tag: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, tag, icon: '/favicon.svg' })
  } catch { /* ignore */ }
}

export function useNotifier(enabled: boolean): void {
  const todos = useTodos((s) => s.todos)

  useEffect(() => {
    if (!enabled) return
    if (!('Notification' in window)) return

    const tick = () => {
      if (Notification.permission !== 'granted') return
      const now = Date.now()
      const notified = loadNotified()

      /* GC stale entries (> 7d) so the map doesn't grow forever */
      const week = 7 * 24 * 60 * 60 * 1000
      for (const k of Object.keys(notified)) {
        if (now - notified[k] > week) delete notified[k]
      }

      for (const t of todos) {
        if (t.completedAt) continue
        const remaining = t.deadline - now
        for (const th of THRESHOLDS) {
          /* Fire when crossing the threshold downwards within the poll window */
          const inWindow = remaining <= th.ms && remaining > th.ms - POLL_MS - 1000
          const key = `${t.id}:${th.id}`
          if (inWindow && !notified[key]) {
            notify(th.label, t.title, key)
            notified[key] = now
          }
        }
      }
      saveNotified(notified)
    }

    tick()
    const interval = window.setInterval(tick, POLL_MS)
    return () => window.clearInterval(interval)
  }, [todos, enabled])
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return await Notification.requestPermission()
}
