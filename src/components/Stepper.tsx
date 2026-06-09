import { IconChevronDown } from './Icons'

interface Props {
  value: number
  /** Inclusive upper bound. The lower bound is always 0; values wrap. */
  max: number
  onChange: (next: number) => void
  ariaLabel: string
  /** Pad-2 display (default true) so 0..9 render as "00".."09". */
  pad?: boolean
}

/* Vertical {▲ value ▼} stepper. Wraps at boundaries (0 → max on the
   down arrow, max → 0 on the up arrow) which matches how iOS time
   wheels behave. Tap targets are sized for thumb interaction (44 px
   on the dominant axis). */
export function Stepper({ value, max, onChange, ariaLabel, pad = true }: Props) {
  const safe = Math.max(0, Math.min(max, Math.floor(value)))
  const display = pad ? String(safe).padStart(2, '0') : String(safe)

  const bump = (delta: number) => {
    onChange((safe + delta + (max + 1)) % (max + 1))
  }

  return (
    <div
      className="stepper"
      role="spinbutton"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={safe}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp')   { e.preventDefault(); bump(+1) }
        if (e.key === 'ArrowDown') { e.preventDefault(); bump(-1) }
      }}
    >
      <button
        type="button"
        className="stepper__btn stepper__btn--up"
        aria-label={`${ariaLabel} +`}
        onClick={() => bump(+1)}
      >
        <IconChevronDown width={16} height={16} className="stepper__chev stepper__chev--up" />
      </button>
      <div className="stepper__value">{display}</div>
      <button
        type="button"
        className="stepper__btn stepper__btn--down"
        aria-label={`${ariaLabel} -`}
        onClick={() => bump(-1)}
      >
        <IconChevronDown width={16} height={16} />
      </button>
    </div>
  )
}
