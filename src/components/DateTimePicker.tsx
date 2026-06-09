import { useMemo } from 'react'
import { CalendarGrid } from './CalendarGrid'
import { TimePicker } from './TimePicker'

interface Props {
  value: number
  onChange: (next: number) => void
}

/* Single-timestamp picker that composes CalendarGrid (date part) and
   TimePicker (time part). Internally splits the value so each subpicker
   can stay strict-controlled without leaking the merging logic. */
export function DateTimePicker({ value, onChange }: Props) {
  const date = useMemo(() => new Date(value), [value])

  const setDateOnly = (d: Date) => {
    /* CalendarGrid already merges in the existing time, so just forward. */
    onChange(d.getTime())
  }
  const setTime = ({ hour, minute }: { hour: number; minute: number }) => {
    const merged = new Date(date)
    merged.setHours(hour, minute, 0, 0)
    onChange(merged.getTime())
  }

  return (
    <div className="dt-picker">
      <CalendarGrid value={date} onChange={setDateOnly} />
      <TimePicker
        hour={date.getHours()}
        minute={date.getMinutes()}
        onChange={setTime}
      />
    </div>
  )
}
