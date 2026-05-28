import type { Todo, Recurrence } from '../store/todos'

const DAY = 86_400_000

/** Add `n` months to `ts` (positive or negative) preserving the day-of-
 *  month where possible. If the target month has fewer days (Jan 31 +
 *  1mo → Feb 28/29), clamp to the last day. */
export function addMonthsClamped(ts: number, n: number): number {
  const d = new Date(ts)
  const day = d.getDate()
  // Move to day 1 first so setMonth doesn't overflow into next month.
  d.setDate(1)
  d.setMonth(d.getMonth() + n)
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, last))
  return d.getTime()
}

/* ───── Minimal cron evaluator ─────
   Supported subset: "M H D MON DOW" with each field being:
     * | n | n,m,... | n-m | * /s
   No special strings (@daily etc.), no ? L W # patterns.
   DOW: 0 (Sun) ‑ 6 (Sat). When both DOM and DOW are restricted, a date
   matches if EITHER matches (POSIX cron semantics). */

interface CronExpr {
  m: number[]   // sorted unique
  h: number[]
  dom: number[]
  mon: number[]
  dow: number[]
  /** Whether DOM was specified (not '*') */
  domSet: boolean
  dowSet: boolean
}

function parseField(raw: string, lo: number, hi: number): number[] {
  raw = raw.trim()
  if (!raw) throw new Error('empty cron field')
  const out = new Set<number>()
  for (const part of raw.split(',')) {
    let step = 1
    let body = part
    const slash = part.indexOf('/')
    if (slash !== -1) {
      body = part.slice(0, slash)
      step = parseInt(part.slice(slash + 1), 10)
      if (!Number.isFinite(step) || step <= 0) throw new Error('bad step ' + part)
    }
    let a = lo
    let b = hi
    if (body === '*') {
      // keep full range
    } else if (body.includes('-')) {
      const [as, bs] = body.split('-')
      a = parseInt(as, 10); b = parseInt(bs, 10)
      if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error('bad range ' + part)
    } else {
      const v = parseInt(body, 10)
      if (!Number.isFinite(v)) throw new Error('bad value ' + part)
      a = v; b = v
    }
    if (a < lo || b > hi || a > b) throw new Error('out of range ' + part)
    for (let v = a; v <= b; v += step) out.add(v)
  }
  return [...out].sort((x, y) => x - y)
}

export function parseCron(raw: string): CronExpr | null {
  try {
    const parts = raw.trim().split(/\s+/)
    if (parts.length !== 5) return null
    return {
      m: parseField(parts[0], 0, 59),
      h: parseField(parts[1], 0, 23),
      dom: parseField(parts[2], 1, 31),
      mon: parseField(parts[3], 1, 12),
      dow: parseField(parts[4], 0, 6),
      domSet: parts[2] !== '*',
      dowSet: parts[4] !== '*',
    }
  } catch {
    return null
  }
}

function matches(c: CronExpr, d: Date): boolean {
  if (!c.m.includes(d.getMinutes())) return false
  if (!c.h.includes(d.getHours())) return false
  if (!c.mon.includes(d.getMonth() + 1)) return false
  const domOk = c.dom.includes(d.getDate())
  const dowOk = c.dow.includes(d.getDay())
  if (c.domSet && c.dowSet) return domOk || dowOk
  return domOk && dowOk
}

/** Next moment strictly after `from` that matches the cron, searching at
 *  minute granularity. Capped at ~2 years to avoid pathological loops. */
export function nextCronOccurrence(from: number, expr: string): number | null {
  const c = parseCron(expr)
  if (!c) return null
  const d = new Date(from)
  d.setSeconds(0, 0)
  d.setMinutes(d.getMinutes() + 1)
  const stop = from + 366 * 2 * DAY
  while (d.getTime() <= stop) {
    if (matches(c, d)) return d.getTime()
    d.setMinutes(d.getMinutes() + 1)
  }
  return null
}

/** Next occurrence of a recurring todo strictly after `from`. */
export function nextOccurrence(from: number, recurrence: Recurrence, cronExpr?: string): number | null {
  switch (recurrence) {
    case 'daily':   return from + DAY
    case 'weekly':  return from + 7 * DAY
    case 'monthly': return addMonthsClamped(from, 1)
    case 'custom':  return cronExpr ? nextCronOccurrence(from, cronExpr) : null
    case 'none':
    default:        return null
  }
}

/* ───── Virtual occurrence expansion ─────
   For each todo with recurrence, generate virtual rows for upcoming
   occurrences within [now, endTs]. Capped per-todo to MAX_PER_TODO. */

export interface VirtualOccurrence {
  /** Synthetic id `${parent.id}#${occurrenceTs}` — for React keys only. */
  id: string
  parent: Todo
  /** Computed deadline for this occurrence. */
  deadline: number
  /** True when this row is a generated future occurrence (not the parent). */
  isVirtual: boolean
}

const MAX_PER_TODO = 200

/** Walks each recurring todo forward from its current deadline, emitting
 *  one row per occurrence that falls inside [now, endTs]. The first
 *  occurrence is the parent itself (isVirtual=false). */
export function expandRecurring(todos: Todo[], _now: number, endTs: number): VirtualOccurrence[] {
  const out: VirtualOccurrence[] = []
  for (const t of todos) {
    if (t.completedAt) {
      out.push({ id: t.id, parent: t, deadline: t.deadline, isVirtual: false })
      continue
    }
    out.push({ id: t.id, parent: t, deadline: t.deadline, isVirtual: false })
    if (!t.recurrence || t.recurrence === 'none') continue
    let cur = t.deadline
    let n = 0
    while (n < MAX_PER_TODO) {
      const nxt = nextOccurrence(cur, t.recurrence, t.cronExpr)
      if (nxt === null || nxt <= cur) break
      cur = nxt
      if (cur > endTs) break
      out.push({
        id: `${t.id}#${cur}`,
        parent: t,
        deadline: cur,
        isVirtual: true,
      })
      n++
    }
  }
  return out
}
