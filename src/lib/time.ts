import * as settingsStore from '../store/settings'

export type Urgency = 'overdue' | 'critical' | 'soon' | 'near' | 'far'
export type Bucket = 'today' | 'week' | 'month' | 'later'

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR
const WEEK = 7 * DAY

export interface DiffParts {
  sign: 1 | -1
  d: number
  h: number
  m: number
  s: number
  total: number
}

export function diffParts(ms: number): DiffParts {
  const sign: 1 | -1 = ms < 0 ? -1 : 1
  const a = Math.abs(ms)
  return {
    sign,
    d: Math.floor(a / DAY),
    h: Math.floor((a % DAY) / HOUR),
    m: Math.floor((a % HOUR) / MIN),
    s: Math.floor((a % MIN) / 1000),
    total: ms,
  }
}

export function pad(n: number, w = 2): string {
  return String(n).padStart(w, '0')
}

/** Compact remaining string for list rows. */
export function formatRowTime(ms: number): string {
  const { sign, d, h, m, s } = diffParts(ms)
  const pre = sign < 0 ? '+' : ''
  if (d > 0) return `${pre}${d}d ${pad(h)}h`
  if (h > 0) return `${pre}${pad(h)}h ${pad(m)}m`
  if (m > 0) return `${pre}${pad(m)}m ${pad(s)}s`
  return `${pre}${s}s`
}

export function urgencyOf(ms: number): Urgency {
  if (ms <= 0) return 'overdue'
  if (ms < HOUR) return 'critical'
  if (ms < DAY) return 'soon'
  if (ms < WEEK) return 'near'
  return 'far'
}

/** Bucket: by end-of-today / end-of-week / within 30 days / later. */
export function bucketOf(deadline: number, now: number): Bucket {
  const today = new Date(now)
  today.setHours(23, 59, 59, 999)
  if (deadline <= today.getTime()) return 'today'

  // End of "this week" — Sunday 23:59 local. JS getDay: 0=Sun..6=Sat.
  const d = new Date(now)
  const dow = d.getDay()
  const daysUntilSun = (7 - dow) % 7
  d.setDate(d.getDate() + daysUntilSun)
  d.setHours(23, 59, 59, 999)
  if (deadline <= d.getTime()) return 'week'

  // Within 30 days from now → "this month"
  if (deadline <= now + 30 * DAY) return 'month'

  return 'later'
}

/** Locale-aware "May 28, 14:30" / "5月28日 14:30" style date label. Year
    is dropped when the date is in the current year. Reads the user's
    selected language from the settings store. */
export function formatAbsolute(ts: number): string {
  const d = new Date(ts)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  let lang = 'en'
  try {
    // Static ESM import resolved lazily through the import map. settings.ts
    // does not import time.ts, so there's no cycle.
    lang = (settingsStore.useSettings.getState() as { lang: string }).lang
  } catch { /* during pure-fn tests there's no store; fall back to en */ }
  return new Intl.DateTimeFormat(lang, {
    year: sameYear ? undefined : 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(d)
}

export function formatHM(ts: number): string {
  const d = new Date(ts)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function progressPct(createdAt: number, deadline: number, now: number): number {
  const total = Math.max(1, deadline - createdAt)
  const elapsed = Math.max(0, Math.min(total, now - createdAt))
  return (elapsed / total) * 100
}

export function toLocalInputValue(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
export function fromLocalInputValue(v: string): number | null {
  if (!v) return null
  const t = new Date(v).getTime()
  return Number.isFinite(t) ? t : null
}

