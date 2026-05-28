/* Quick deadline presets. Each preset declares either a relative offset
   (resolved at SUBMIT time, so "10 分" always means 10 mins from add)
   or an absolute resolver (e.g. 今晚 22:00). */

export interface RelativePreset {
  id: string
  kind: 'relative'
  label: string
  offsetMs: number
}
export interface AbsolutePreset {
  id: string
  kind: 'absolute'
  label: string
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
  { id: '5min',  kind: 'relative', label: '5 分',  offsetMs:  5 * MIN },
  { id: '10min', kind: 'relative', label: '10 分', offsetMs: 10 * MIN },
  { id: '20min', kind: 'relative', label: '20 分', offsetMs: 20 * MIN },
  { id: '30min', kind: 'relative', label: '30 分', offsetMs: 30 * MIN },
  { id: '1h',    kind: 'relative', label: '1 时',  offsetMs:  1 * HOUR },
  { id: '2h',    kind: 'relative', label: '2 时',  offsetMs:  2 * HOUR },
]

export const ABSOLUTE_PRESETS: AbsolutePreset[] = [
  {
    id: 'tonight',
    kind: 'absolute',
    label: '今晚',
    resolve: (now) => {
      const d = new Date(now)
      const h = d.getHours()
      return setHM(d, h >= 22 ? 23 : 22, h >= 22 ? 30 : 0)
    },
  },
  {
    id: 'tomorrow-am',
    kind: 'absolute',
    label: '明早',
    resolve: (now) => {
      const d = new Date(now)
      d.setDate(d.getDate() + 1)
      return setHM(d, 9, 0)
    },
  },
  {
    id: 'tomorrow-pm',
    kind: 'absolute',
    label: '明晚',
    resolve: (now) => {
      const d = new Date(now)
      d.setDate(d.getDate() + 1)
      return setHM(d, 18, 0)
    },
  },
  {
    id: 'weekend',
    kind: 'absolute',
    label: '周末',
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
    label: '下周一',
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


