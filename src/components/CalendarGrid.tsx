import { useMemo, useState } from 'react'
import {
  WEEKDAY_LABEL_KEYS,
  addMonths,
  isSameDay,
  monthMatrix,
  startOfDay,
  startOfMonth,
} from '../lib/calendar'
import { formatLunar, solarToLunar } from '../lib/lunar'
import { useT } from '../lib/i18n'
import { IconChevronLeft, IconChevronRight } from './Icons'

interface Props {
  value: Date
  onChange: (next: Date) => void
}

const MONTH_LABEL_KEYS = [
  'cal.month.jan','cal.month.feb','cal.month.mar','cal.month.apr',
  'cal.month.may','cal.month.jun','cal.month.jul','cal.month.aug',
  'cal.month.sep','cal.month.oct','cal.month.nov','cal.month.dec',
]

/* HIG-style month calendar — tap to select. Internally tracks the
   currently *viewed* month so the user can browse without losing the
   selected date. The `value` Date is authoritative for selection. */
export function CalendarGrid({ value, onChange }: Props) {
  const t = useT()
  const [view, setView] = useState<Date>(() => startOfMonth(value))

  const cells = useMemo(
    () => monthMatrix(view.getFullYear(), view.getMonth()),
    [view],
  )
  const today = startOfDay(new Date())
  const lunar = useMemo(() => solarToLunar(value.getFullYear(), value.getMonth() + 1, value.getDate()), [value])

  const goPrev = () => setView((v) => addMonths(v, -1))
  const goNext = () => setView((v) => addMonths(v, 1))
  const goToday = () => {
    const now = new Date()
    setView(startOfMonth(now))
    /* Preserve the time-of-day from value; only update the date part. */
    const merged = new Date(value)
    merged.setFullYear(now.getFullYear(), now.getMonth(), now.getDate())
    onChange(merged)
  }
  const pickDay = (date: Date) => {
    const merged = new Date(value)
    merged.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())
    onChange(merged)
  }

  return (
    <div className="cal" role="group" aria-label={t('cal.label')}>
      <div className="cal__head">
        <button type="button" className="cal__nav" aria-label={t('cal.prev')} onClick={goPrev}>
          <IconChevronLeft width={16} height={16} />
        </button>
        <div className="cal__head-title" aria-live="polite">
          {t(MONTH_LABEL_KEYS[view.getMonth()])} {view.getFullYear()}
        </div>
        <button type="button" className="cal__nav" aria-label={t('cal.next')} onClick={goNext}>
          <IconChevronRight width={16} height={16} />
        </button>
        <button type="button" className="cal__today" onClick={goToday}>
          {t('cal.today')}
        </button>
      </div>

      <div className="cal__weekdays" aria-hidden>
        {WEEKDAY_LABEL_KEYS.map((k) => (
          <span key={k} className="cal__wd">{t(k)}</span>
        ))}
      </div>

      <div className="cal__grid" role="grid">
        {cells.map((c) => {
          const selected = isSameDay(c.date, value)
          const isToday = isSameDay(c.date, today)
          return (
            <button
              key={c.date.toISOString()}
              type="button"
              role="gridcell"
              aria-selected={selected}
              className={
                'cal__day'
                + (c.inMonth ? '' : ' cal__day--out')
                + (isToday ? ' cal__day--today' : '')
                + (selected ? ' cal__day--selected' : '')
              }
              onClick={() => pickDay(c.date)}
            >
              {c.day}
            </button>
          )
        })}
      </div>

      <div className="cal__lunar" aria-label={t('common.lunar')}>
        {lunar ? formatLunar(lunar) : ' '}
      </div>
    </div>
  )
}
