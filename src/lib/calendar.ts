/* ─────────────────────────────────────────────
 *  Pure calendar helpers — no React, no DOM.
 *  Month matrix returns exactly 42 cells (6 rows × 7 columns) including
 *  spillover from the previous and next months, so the calendar grid
 *  has a stable size regardless of where the 1st falls.
 *  ───────────────────────────────────────────── */

export interface CalendarCell {
  date: Date
  /** day-of-month (1..31) */
  day: number
  /** false = belongs to previous or next month (spillover) */
  inMonth: boolean
}

export const WEEKDAY_LABEL_KEYS: string[] = [
  'cal.weekday.sun',
  'cal.weekday.mon',
  'cal.weekday.tue',
  'cal.weekday.wed',
  'cal.weekday.thu',
  'cal.weekday.fri',
  'cal.weekday.sat',
]

export function startOfDay(d: Date): Date {
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  return out
}

export function startOfMonth(d: Date): Date {
  const out = new Date(d)
  out.setDate(1)
  out.setHours(0, 0, 0, 0)
  return out
}

export function addMonths(d: Date, n: number): Date {
  const out = new Date(d)
  /* Move to day 1 first so the month-shift never overflows (e.g. Jan 31 → Feb 28). */
  const day = out.getDate()
  out.setDate(1)
  out.setMonth(out.getMonth() + n)
  const last = new Date(out.getFullYear(), out.getMonth() + 1, 0).getDate()
  out.setDate(Math.min(day, last))
  return out
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate()
}

/** 6 rows × 7 columns of CalendarCell, starting on Sunday. */
export function monthMatrix(year: number, monthIndex: number): CalendarCell[] {
  const first = new Date(year, monthIndex, 1)
  const firstDow = first.getDay()
  const start = new Date(year, monthIndex, 1 - firstDow)
  const out: CalendarCell[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    out.push({
      date: d,
      day: d.getDate(),
      inMonth: d.getMonth() === monthIndex,
    })
  }
  return out
}
