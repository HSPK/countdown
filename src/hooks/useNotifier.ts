import { useEffect } from 'react'
import { useTodos } from '../store/todos'
import { DEFAULT_REMINDERS, type ReminderConfig } from '../lib/reminders'
import { playSound } from '../lib/soundEngine'

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

function notify(title: string, body: string, tag: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, tag, icon: '/favicon.svg' })
  } catch { /* ignore */ }
}

function effectiveReminders(todoReminders: ReminderConfig[] | undefined): ReminderConfig[] {
  return todoReminders ?? DEFAULT_REMINDERS
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
        const reminders = effectiveReminders(t.reminders)
        for (const r of reminders) {
          if (!r.enabled) continue
          const fireAt = t.deadline - r.offsetMs
          const remaining = fireAt - now
          /* Fire when the trigger moment passed within the poll window */
          const inWindow = remaining <= 0 && remaining > -POLL_MS - 1000
          const key = `${t.id}:${r.id}`
          if (inWindow && !notified[key]) {
            notify(t.title, formatBody(r.offsetMs), key)
            playSound(r.soundId)
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

/* Plain-English notification body. Kept simple (not i18n-bound) because
   the notification panel itself is rendered by the OS and locale-aware
   formatting from i18n.ts isn't accessible from here. */
function formatBody(offsetMs: number): string {
  if (offsetMs <= 0) return 'Due now'
  const min = Math.round(offsetMs / 60_000)
  if (min < 60) return `${min} minutes left`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} left`
  const day = Math.round(hr / 24)
  return `${day} day${day === 1 ? '' : 's'} left`
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return await Notification.requestPermission()
}
