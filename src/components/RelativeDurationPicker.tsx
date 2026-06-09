import { useT } from '../lib/i18n'

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

/* Free-form duration picker: days + hours + minutes number fields.
   Controlled by parent — emits the composite offset in ms. HIG-aligned:
   three small grouped number fields with caption labels underneath. */
export function RelativeDurationPicker({
  offsetMs, onChange,
}: {
  offsetMs: number
  onChange: (next: number) => void
}) {
  const t = useT()
  const clamped = Math.max(0, Math.floor(offsetMs))
  const days = Math.floor(clamped / DAY)
  const hours = Math.floor((clamped % DAY) / HOUR)
  const minutes = Math.floor((clamped % HOUR) / MIN)

  const setParts = (d: number, h: number, m: number) => {
    const safeDay = Math.max(0, Math.floor(d) || 0)
    const safeHr = Math.max(0, Math.min(23, Math.floor(h) || 0))
    const safeMin = Math.max(0, Math.min(59, Math.floor(m) || 0))
    onChange(safeDay * DAY + safeHr * HOUR + safeMin * MIN)
  }

  return (
    <div className="dur-picker" role="group" aria-label={t('composer.custom.rel')}>
      <Field
        value={days}
        max={999}
        label={t('chips.unit.day')}
        onChange={(v) => setParts(v, hours, minutes)}
      />
      <Field
        value={hours}
        max={23}
        label={t('chips.unit.hour')}
        onChange={(v) => setParts(days, v, minutes)}
      />
      <Field
        value={minutes}
        max={59}
        label={t('chips.unit.min')}
        onChange={(v) => setParts(days, hours, v)}
      />
    </div>
  )
}

function Field({
  value, max, label, onChange,
}: {
  value: number
  max: number
  label: string
  onChange: (v: number) => void
}) {
  return (
    <div className="dur-picker__field">
      <input
        className="dur-picker__num"
        type="number"
        min={0}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
      <span className="dur-picker__label">{label}</span>
    </div>
  )
}
