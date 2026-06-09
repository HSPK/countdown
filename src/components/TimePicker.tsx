import { Stepper } from './Stepper'
import { useT } from '../lib/i18n'

interface Props {
  hour: number
  minute: number
  onChange: (next: { hour: number; minute: number }) => void
}

/* HIG-style HH:MM picker — two Steppers + a static colon separator.
   Large tap targets, no scroll. */
export function TimePicker({ hour, minute, onChange }: Props) {
  const t = useT()
  return (
    <div className="time-picker" role="group" aria-label={t('picker.time')}>
      <Stepper
        value={hour}
        max={23}
        onChange={(h) => onChange({ hour: h, minute })}
        ariaLabel={t('picker.hour')}
      />
      <span className="time-picker__sep" aria-hidden>:</span>
      <Stepper
        value={minute}
        max={59}
        onChange={(m) => onChange({ hour, minute: m })}
        ariaLabel={t('picker.min')}
      />
    </div>
  )
}
