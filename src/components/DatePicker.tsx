import { useMemo, useState } from 'react'
import { pad } from '../lib/time'
import { TIME_PRESETS } from '../lib/datePresets'
import { IconChevronLeft, IconChevronRight } from './Icons'

interface Props {
  value: number              // current selected timestamp (ms)
  onChange: (ts: number) => void
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']
const MONTHS_CN = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

interface Cell { ts: number; d: number; outside: boolean; today: boolean; selected: boolean }

export function DatePicker({ value, onChange }: Props) {
  const valueDate = useMemo(() => new Date(value), [value])
  const [month, setMonth] = useState(() => {
    const d = new Date(value)
    d.setDate(1); d.setHours(0,0,0,0)
    return d
  })

  const cells = useMemo<Cell[]>(() => {
    const first = new Date(month)            // 1st of month
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    // Monday-first: shift JS Sun=0..Sat=6 into Mon=0..Sun=6
    const startWd = (first.getDay() + 6) % 7
    const totalDays = last.getDate()
    const arr: Cell[] = []
    const today = new Date(); today.setHours(0,0,0,0)
    const sel = new Date(value); sel.setHours(0,0,0,0)

    // leading days from prev month
    for (let i = startWd - 1; i >= 0; i--) {
      const d = new Date(first); d.setDate(d.getDate() - (i + 1))
      arr.push({
        ts: d.getTime(), d: d.getDate(), outside: true,
        today: d.getTime() === today.getTime(),
        selected: d.getTime() === sel.getTime(),
      })
    }
    // current month
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(month); d.setDate(i)
      arr.push({
        ts: d.getTime(), d: i, outside: false,
        today: d.getTime() === today.getTime(),
        selected: d.getTime() === sel.getTime(),
      })
    }
    // trailing to fill 6 rows × 7 = 42
    while (arr.length < 42) {
      const lastCell = arr[arr.length - 1]
      const d = new Date(lastCell.ts); d.setDate(d.getDate() + 1)
      arr.push({
        ts: d.getTime(), d: d.getDate(), outside: true,
        today: d.getTime() === today.getTime(),
        selected: d.getTime() === sel.getTime(),
      })
    }
    return arr
  }, [month, value])

  const pickDate = (ts: number) => {
    const newD = new Date(ts)
    newD.setHours(valueDate.getHours(), valueDate.getMinutes(), 0, 0)
    onChange(newD.getTime())
  }

  const setH = (h: number) => {
    const d = new Date(value)
    d.setHours(Math.max(0, Math.min(23, h)), d.getMinutes(), 0, 0)
    onChange(d.getTime())
  }
  const setM = (m: number) => {
    const d = new Date(value)
    d.setMinutes(Math.max(0, Math.min(59, m)), 0, 0)
    onChange(d.getTime())
  }
  const setTime = (h: number, m: number) => {
    const d = new Date(value)
    d.setHours(h, m, 0, 0)
    onChange(d.getTime())
  }

  const h = valueDate.getHours()
  const m = valueDate.getMinutes()

  return (
    <div className="picker">
      <div className="picker__head">
        <span className="picker__title">{month.getFullYear()} · {MONTHS_CN[month.getMonth()]}</span>
        <span className="picker__nav">
          <button
            className="picker__nav-btn"
            aria-label="上个月"
            onClick={() => {
              const d = new Date(month); d.setMonth(d.getMonth() - 1); setMonth(d)
            }}
          >
            <IconChevronLeft />
          </button>
          <button
            className="picker__nav-btn"
            aria-label="今天"
            onClick={() => {
              const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); setMonth(d)
              const today = new Date()
              today.setSeconds(0, 0)
              today.setHours(valueDate.getHours(), valueDate.getMinutes(), 0, 0)
              onChange(today.getTime())
            }}
            title="跳到今天"
            style={{ fontSize: 11, padding: '0 8px', width: 'auto', fontWeight: 600, letterSpacing: 0.04 }}
          >
            今天
          </button>
          <button
            className="picker__nav-btn"
            aria-label="下个月"
            onClick={() => {
              const d = new Date(month); d.setMonth(d.getMonth() + 1); setMonth(d)
            }}
          >
            <IconChevronRight />
          </button>
        </span>
      </div>

      <div className="calendar">
        {WEEKDAYS.map((w) => (
          <div key={w} className="calendar__wd">{w}</div>
        ))}
        {cells.map((c, i) => (
          <button
            key={i}
            className={
              'calendar__day' +
              (c.outside ? ' calendar__day--outside' : '') +
              (c.today ? ' calendar__day--today' : '') +
              (c.selected ? ' calendar__day--selected' : '')
            }
            onClick={() => pickDate(c.ts)}
            tabIndex={c.outside ? -1 : 0}
          >
            {c.d}
          </button>
        ))}
      </div>

      <div className="time-row">
        <span className="time-row__label">时间</span>
        <div className="time-input">
          <input
            type="text"
            inputMode="numeric"
            value={pad(h)}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '')
              if (v === '') { setH(0); return }
              setH(parseInt(v.slice(-2), 10))
            }}
            aria-label="小时"
          />
          <span className="time-input__sep">:</span>
          <input
            type="text"
            inputMode="numeric"
            value={pad(m)}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '')
              if (v === '') { setM(0); return }
              setM(parseInt(v.slice(-2), 10))
            }}
            aria-label="分钟"
          />
        </div>
        <div className="time-chips">
          {TIME_PRESETS.map((t) => {
            const active = t.h === h && t.m === m
            return (
              <button
                key={`${t.h}-${t.m}`}
                className="time-chip"
                aria-pressed={active}
                onClick={() => setTime(t.h, t.m)}
              >
                {pad(t.h)}:{pad(t.m)}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
