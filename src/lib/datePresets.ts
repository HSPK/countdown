/* Quick deadline presets. Each preset declares either a relative offset
   (resolved at SUBMIT time, so "10m" always means 10 minutes from add)
   or an absolute resolver (e.g. "Tonight" → 22:00 local). Labels are
   i18n keys; rendering layer resolves them via useT(). */

export interface RelativePreset {
  id: string
  kind: 'relative'
  /** i18n key for the chip label (e.g. 'preset.rel.5m') */
  labelKey: string
  offsetMs: number
}
export interface AbsolutePreset {
  id: string
  kind: 'absolute'
  /** i18n key for the chip label (e.g. 'preset.abs.tonight') */
  labelKey: string
  resolve: (now: Date) => Date
}
export type Preset = RelativePreset | AbsolutePreset

function setHM(d: Date, h: number, m: number): Date {
  d.setHours(h, m, 0, 0)
  return d
}

const MIN = 60_000
const HOUR = 60 * MIN

export const RELATIVE_PRESETS: RelativePreset[] = [
  { id: '5min',  kind: 'relative', labelKey: 'preset.rel.5m',  offsetMs:  5 * MIN },
  { id: '10min', kind: 'relative', labelKey: 'preset.rel.10m', offsetMs: 10 * MIN },
  { id: '20min', kind: 'relative', labelKey: 'preset.rel.20m', offsetMs: 20 * MIN },
  { id: '30min', kind: 'relative', labelKey: 'preset.rel.30m', offsetMs: 30 * MIN },
  { id: '1h',    kind: 'relative', labelKey: 'preset.rel.1h',  offsetMs:  1 * HOUR },
  { id: '2h',    kind: 'relative', labelKey: 'preset.rel.2h',  offsetMs:  2 * HOUR },
]

export const ABSOLUTE_PRESETS: AbsolutePreset[] = [
  {
    id: 'tonight',
    kind: 'absolute',
    labelKey: 'preset.abs.tonight',
    resolve: (now) => {
      const d = new Date(now)
      const h = d.getHours()
      return setHM(d, h >= 22 ? 23 : 22, h >= 22 ? 30 : 0)
    },
  },
  {
    id: 'tomorrow-am',
    kind: 'absolute',
    labelKey: 'preset.abs.tomorrow_am',
    resolve: (now) => {
      const d = new Date(now)
      d.setDate(d.getDate() + 1)
      return setHM(d, 9, 0)
    },
  },
  {
    id: 'tomorrow-pm',
    kind: 'absolute',
    labelKey: 'preset.abs.tomorrow_pm',
    resolve: (now) => {
      const d = new Date(now)
      d.setDate(d.getDate() + 1)
      return setHM(d, 18, 0)
    },
  },
  {
    id: 'weekend',
    kind: 'absolute',
    labelKey: 'preset.abs.weekend',
    resolve: (now) => {
      const d = new Date(now)
      const dow = d.getDay()
      const add = dow === 6 ? 0 : dow === 0 ? 6 : 6 - dow
      d.setDate(d.getDate() + (add === 0 && now.getHours() >= 18 ? 7 : add || 0))
      return setHM(d, 18, 0)
    },
  },
  {
    id: 'next-week',
    kind: 'absolute',
    labelKey: 'preset.abs.next_week',
    resolve: (now) => {
      const d = new Date(now)
      const dow = d.getDay()
      const add = dow === 0 ? 1 : 8 - dow
      d.setDate(d.getDate() + add)
      return setHM(d, 9, 0)
    },
  },
]

/* Legacy export for any code still importing PRESETS (used in seed). */
export const PRESETS: Preset[] = [...RELATIVE_PRESETS, ...ABSOLUTE_PRESETS]

export const TIME_PRESETS = [
  { h: 9,  m: 0  },
  { h: 12, m: 0  },
  { h: 15, m: 0  },
  { h: 18, m: 0  },
  { h: 21, m: 0  },
]



