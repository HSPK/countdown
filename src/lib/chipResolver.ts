import { uid } from './id'

/* ─────────────────────────────────────────────
 *  Editable composer chip presets — pure data + pure resolvers.
 *  No store / no UI / no React. Built-ins and user-added chips
 *  share the same shape so the editor can treat them uniformly;
 *  built-ins keep a labelKey for i18n while custom chips ship a
 *  plain `label` string.
 *  ───────────────────────────────────────────── */

export type RelativeUnit = 'min' | 'hour' | 'day'
export type DateAnchor =
  | 'today' | 'tomorrow'
  | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'

export interface RelativePreset {
  id: string
  /** Optional i18n key (built-ins only). When set, takes precedence over `label`. */
  labelKey?: string
  /** Display label used when no labelKey is set, or after the user edits a built-in. */
  label: string
  amount: number
  unit: RelativeUnit
  /** Built-ins are protected from accidental loss — Reset restores them, delete is allowed. */
  builtin?: boolean
}

export interface AbsolutePreset {
  id: string
  labelKey?: string
  label: string
  anchor: DateAnchor
  /** 0..23 */
  hour: number
  /** 0..59 */
  minute: number
  builtin?: boolean
}

export const RELATIVE_UNITS: RelativeUnit[] = ['min', 'hour', 'day']
export const DATE_ANCHORS: DateAnchor[] = [
  'today', 'tomorrow', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun',
]

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR
const UNIT_MS: Record<RelativeUnit, number> = { min: MIN, hour: HOUR, day: DAY }

const DOW: Record<Exclude<DateAnchor, 'today' | 'tomorrow'>, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
}

export function relativeOffsetMs(p: Pick<RelativePreset, 'amount' | 'unit'>): number {
  return p.amount * UNIT_MS[p.unit]
}

export function resolveRelative(p: RelativePreset, now: Date): number {
  return now.getTime() + relativeOffsetMs(p)
}

/* All absolute chips resolve to a strictly-future timestamp. `today` and
   day-of-week anchors roll forward to the next valid day when their HH:MM
   has already passed, so a 22:00 chip tapped at 23:00 still does the
   sensible thing. */
export function resolveAbsolute(p: AbsolutePreset, now: Date): number {
  const d = new Date(now)
  d.setHours(p.hour, p.minute, 0, 0)

  if (p.anchor === 'tomorrow') {
    d.setDate(d.getDate() + 1)
    return d.getTime()
  }
  if (p.anchor === 'today') {
    if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1)
    return d.getTime()
  }
  const target = DOW[p.anchor]
  const today = now.getDay()
  let delta = (target - today + 7) % 7
  if (delta === 0 && d.getTime() <= now.getTime()) delta = 7
  d.setDate(d.getDate() + delta)
  return d.getTime()
}

/* ───── Built-in defaults ─────
   These mirror the previous hardcoded chips so users who never visit
   the editor see exactly what they had before. */

export function defaultRelativePresets(): RelativePreset[] {
  return [
    { id: '5min',  labelKey: 'preset.rel.5m',  label: '5m',  amount: 5,  unit: 'min',  builtin: true },
    { id: '10min', labelKey: 'preset.rel.10m', label: '10m', amount: 10, unit: 'min',  builtin: true },
    { id: '20min', labelKey: 'preset.rel.20m', label: '20m', amount: 20, unit: 'min',  builtin: true },
    { id: '30min', labelKey: 'preset.rel.30m', label: '30m', amount: 30, unit: 'min',  builtin: true },
    { id: '1h',    labelKey: 'preset.rel.1h',  label: '1h',  amount: 1,  unit: 'hour', builtin: true },
    { id: '2h',    labelKey: 'preset.rel.2h',  label: '2h',  amount: 2,  unit: 'hour', builtin: true },
  ]
}

export function defaultAbsolutePresets(): AbsolutePreset[] {
  return [
    { id: 'tonight',     labelKey: 'preset.abs.tonight',     label: 'Tonight',  anchor: 'today',    hour: 22, minute: 0, builtin: true },
    { id: 'tomorrow-am', labelKey: 'preset.abs.tomorrow_am', label: 'Tmrw AM',  anchor: 'tomorrow', hour: 9,  minute: 0, builtin: true },
    { id: 'tomorrow-pm', labelKey: 'preset.abs.tomorrow_pm', label: 'Tmrw PM',  anchor: 'tomorrow', hour: 18, minute: 0, builtin: true },
    { id: 'weekend',     labelKey: 'preset.abs.weekend',     label: 'Weekend',  anchor: 'sat',      hour: 18, minute: 0, builtin: true },
    { id: 'next-week',   labelKey: 'preset.abs.next_week',   label: 'Next Mon', anchor: 'mon',      hour: 9,  minute: 0, builtin: true },
  ]
}

export function newRelativePreset(): RelativePreset {
  return { id: uid(), label: '30m', amount: 30, unit: 'min' }
}
export function newAbsolutePreset(): AbsolutePreset {
  return { id: uid(), label: 'Tonight 21:00', anchor: 'today', hour: 21, minute: 0 }
}
