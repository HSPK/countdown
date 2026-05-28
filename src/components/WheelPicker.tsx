import { useEffect, useMemo, useRef, useState } from 'react'
import { solarToLunar, formatLunar } from '../lib/lunar'
import { pad } from '../lib/time'

/* iOS-style wheel picker. Two rows: Year · Month · Day, then Hour · Min.
   Each column is a vertical scroll container with snap. We track the
   snapped value by reading scrollTop after the scroll settles. */

interface Props {
  value: number              // current selected timestamp (ms)
  onChange: (ts: number) => void
}

const ITEM_H = 40
const PAD_ITEMS = 1            // items of padding above/below the center

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function daysInMonth(y: number, m1: number): number {
  // m1 is 1..12. Date(y, m, 0) gives last day of previous month
  return new Date(y, m1, 0).getDate()
}

interface ColumnProps {
  items: Array<{ key: string; label: string; value: number }>
  value: number
  onChange: (v: number) => void
  ariaLabel: string
}

function Column({ items, value, onChange, ariaLabel }: ColumnProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const settleTimer = useRef<number | null>(null)
  /* The index of `value` in items; -1 if not present (column will scroll
     to the first item in that case). */
  const idx = items.findIndex((it) => it.value === value)
  const safeIdx = idx === -1 ? 0 : idx

  /* On mount and whenever the externally-controlled value changes by a
     means other than our own scroll, sync the scroll position. */
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const desired = safeIdx * ITEM_H
    if (Math.abs(el.scrollTop - desired) > 1) {
      el.scrollTo({ top: desired, behavior: 'auto' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIdx, items.length])

  const onScroll = () => {
    if (settleTimer.current) window.clearTimeout(settleTimer.current)
    settleTimer.current = window.setTimeout(() => {
      const el = ref.current
      if (!el) return
      const i = clamp(Math.round(el.scrollTop / ITEM_H), 0, items.length - 1)
      const snapped = i * ITEM_H
      if (Math.abs(el.scrollTop - snapped) > 0.5) {
        el.scrollTo({ top: snapped, behavior: 'smooth' })
      }
      const v = items[i]?.value
      if (v !== undefined && v !== value) onChange(v)
    }, 120)
  }

  return (
    <div
      ref={ref}
      className="wp-col"
      role="listbox"
      aria-label={ariaLabel}
      tabIndex={0}
      onScroll={onScroll}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault()
          const step = e.key === 'ArrowDown' ? 1 : -1
          const next = clamp(safeIdx + step, 0, items.length - 1)
          onChange(items[next].value)
        }
      }}
      style={{
        height: (PAD_ITEMS * 2 + 1) * ITEM_H,
      }}
    >
      <div className="wp-col__pad" aria-hidden style={{ height: PAD_ITEMS * ITEM_H }} />
      {items.map((it, i) => (
        <div
          key={it.key}
          className={'wp-col__item' + (i === safeIdx ? ' wp-col__item--selected' : '')}
          aria-selected={i === safeIdx}
          role="option"
        >
          {it.label}
        </div>
      ))}
      <div className="wp-col__pad" aria-hidden style={{ height: PAD_ITEMS * ITEM_H }} />
    </div>
  )
}

export function WheelPicker({ value, onChange }: Props) {
  const date = useMemo(() => new Date(value), [value])
  const Y = date.getFullYear()
  const M = date.getMonth() + 1
  const D = date.getDate()
  const H = date.getHours()
  const Mi = date.getMinutes()

  /* Build columns. Years span a sensible window around `today` so users
     can pick distant deadlines too. */
  const [yearWindow] = useState(() => {
    const cy = new Date().getFullYear()
    return { lo: cy - 2, hi: cy + 20 }
  })
  const years = useMemo(() => {
    const arr: Array<{ key: string; label: string; value: number }> = []
    for (let y = yearWindow.lo; y <= yearWindow.hi; y++) {
      arr.push({ key: `y${y}`, label: String(y), value: y })
    }
    return arr
  }, [yearWindow.lo, yearWindow.hi])

  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({
      key: `m${i + 1}`, label: pad(i + 1), value: i + 1,
    })),
    [],
  )
  const dim = daysInMonth(Y, M)
  const days = useMemo(
    () => Array.from({ length: dim }, (_, i) => ({
      key: `d${i + 1}`, label: pad(i + 1), value: i + 1,
    })),
    [dim],
  )
  const hours = useMemo(
    () => Array.from({ length: 24 }, (_, i) => ({
      key: `h${i}`, label: pad(i), value: i,
    })),
    [],
  )
  const mins = useMemo(
    () => Array.from({ length: 60 }, (_, i) => ({
      key: `mi${i}`, label: pad(i), value: i,
    })),
    [],
  )

  const setPart = (p: { y?: number; m?: number; d?: number; h?: number; mi?: number }) => {
    const ny = p.y ?? Y
    const nm = p.m ?? M
    const dimNew = daysInMonth(ny, nm)
    const nd = clamp(p.d ?? D, 1, dimNew)
    const nh = p.h ?? H
    const nmi = p.mi ?? Mi
    const next = new Date(ny, nm - 1, nd, nh, nmi, 0, 0)
    onChange(next.getTime())
  }

  const lunar = useMemo(() => solarToLunar(Y, M, D), [Y, M, D])

  return (
    <div className="wp" role="group" aria-label="日期与时间">
      <div className="wp-row wp-row--date">
        <Column items={years}  value={Y}  onChange={(v) => setPart({ y: v })}  ariaLabel="年" />
        <Column items={months} value={M}  onChange={(v) => setPart({ m: v })}  ariaLabel="月" />
        <Column items={days}   value={D}  onChange={(v) => setPart({ d: v })}  ariaLabel="日" />
        <div className="wp-band" aria-hidden />
      </div>

      <div className="wp-row wp-row--time">
        <Column items={hours} value={H}  onChange={(v) => setPart({ h: v })}  ariaLabel="时" />
        <span className="wp-sep" aria-hidden>:</span>
        <Column items={mins}  value={Mi} onChange={(v) => setPart({ mi: v })} ariaLabel="分" />
        <div className="wp-band" aria-hidden />
      </div>

      <div className="wp-lunar" aria-label="农历日期">
        {lunar ? formatLunar(lunar) : ' '}
      </div>
    </div>
  )
}
