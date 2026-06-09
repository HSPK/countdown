import { uid } from './id'
import type { SoundId } from './soundEngine'

/* ─────────────────────────────────────────────
 *  Per-todo reminders. A reminder fires `offsetMs` BEFORE the deadline
 *  (offset 0 = at deadline). Each reminder has its own sound so users
 *  can give different priorities different audio cues.
 *  ───────────────────────────────────────────── */

export interface ReminderConfig {
  id: string
  /** ms BEFORE deadline. 0 = exactly at deadline. Always non-negative. */
  offsetMs: number
  soundId: SoundId
  enabled: boolean
}

const MIN = 60_000
const HOUR = 60 * MIN

/* Defaults applied to any todo whose `reminders` field is undefined
   (backward-compatible with todos saved before this feature shipped). */
export const DEFAULT_REMINDERS: ReminderConfig[] = [
  { id: 'd-1h',  offsetMs: HOUR,        soundId: 'pop',   enabled: true },
  { id: 'd-10m', offsetMs: 10 * MIN,    soundId: 'chime', enabled: true },
  { id: 'd-0',   offsetMs: 0,           soundId: 'chime', enabled: true },
]

export function defaultReminders(): ReminderConfig[] {
  return DEFAULT_REMINDERS.map((r) => ({ ...r, id: uid() }))
}

export function newReminderConfig(): ReminderConfig {
  return { id: uid(), offsetMs: 10 * MIN, soundId: 'pop', enabled: true }
}

/* Human-friendly label like "1 hour before" / "Due now". The `t` arg is
   passed in so this stays pure and i18n-bound at the call site. */
export function formatReminderOffset(
  ms: number,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  if (ms <= 0) return t('reminder.due')
  const totalSec = Math.round(ms / 1000)
  if (totalSec < 60) return t('reminder.before', { value: `${totalSec}${t('chips.unit.sec.short')}` })
  const totalMin = Math.round(totalSec / 60)
  if (totalMin < 60) return t('reminder.before', { value: `${totalMin}${t('chips.unit.min.short')}` })
  const totalHour = Math.round(totalMin / 60)
  if (totalHour < 24) return t('reminder.before', { value: `${totalHour}${t('chips.unit.hour.short')}` })
  const totalDay = Math.round(totalHour / 24)
  if (totalDay < 7) return t('reminder.before', { value: `${totalDay}${t('chips.unit.day.short')}` })
  const totalWeek = Math.round(totalDay / 7)
  return t('reminder.before', { value: `${totalWeek}${t('chips.unit.week.short')}` })
}
