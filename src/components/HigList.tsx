import type { ReactNode, MouseEvent } from 'react'
import { IconCheck, IconChevronRight } from './Icons'

/* ─────────────────────────────────────────────
 *  Apple HIG grouped-list primitives.
 *  Each component does one job; the row is the
 *  shared atom and convenience wrappers compose
 *  around it. Used across every Settings section
 *  so visuals stay coherent.
 *  ───────────────────────────────────────────── */

/* Section — caption above, optional footer text below.
   Footer text is rendered subtly per HIG (small + muted). */
export function HigSection({
  title, footer, children,
}: {
  title?: string
  footer?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="hig-section">
      {title && <h2 className="hig-section__cap">{title}</h2>}
      <div className="hig-section__body">{children}</div>
      {footer && <div className="hig-section__footer">{footer}</div>}
    </section>
  )
}

/* Group — the rounded container with hairline separators. */
export function HigGroup({ children }: { children: ReactNode }) {
  return <div className="hig-group">{children}</div>
}

interface RowBaseProps {
  icon?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
  /** When set, the row becomes a button; a chevron is added if no `trailing` is provided. */
  onPress?: () => void
  /** Marks the action as destructive (red title). */
  destructive?: boolean
  disabled?: boolean
}

export function HigRow({
  icon, title, subtitle, trailing, onPress, destructive, disabled,
}: RowBaseProps) {
  const interactive = !!onPress && !disabled
  const showChevron = interactive && !trailing
  const cls = [
    'hig-row',
    interactive && 'hig-row--press',
    destructive && 'hig-row--destructive',
    disabled && 'hig-row--disabled',
  ].filter(Boolean).join(' ')

  const inner = (
    <>
      {icon !== undefined && <span className="hig-row__icon" aria-hidden>{icon}</span>}
      <span className="hig-row__main">
        <span className="hig-row__title">{title}</span>
        {subtitle !== undefined && <span className="hig-row__sub">{subtitle}</span>}
      </span>
      {trailing !== undefined && <span className="hig-row__trailing">{trailing}</span>}
      {showChevron && (
        <span className="hig-row__chev" aria-hidden>
          <IconChevronRight width={14} height={14} />
        </span>
      )}
    </>
  )

  if (interactive) {
    return (
      <button type="button" className={cls} onClick={onPress} disabled={disabled}>
        {inner}
      </button>
    )
  }
  return <div className={cls}>{inner}</div>
}

/* iOS-style switch — standalone, used inside rows. */
export function HigSwitch({
  checked, onChange, label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={'switch' + (checked ? ' switch--on' : '')}
      onClick={(e: MouseEvent) => { e.stopPropagation(); onChange(!checked) }}
    >
      <span className="switch__thumb" aria-hidden />
    </button>
  )
}

/* Convenience — toggle row where tapping anywhere flips the switch. */
export function HigRowToggle({
  icon, title, subtitle, checked, onChange,
}: {
  icon?: ReactNode
  title: string
  subtitle?: ReactNode
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <HigRow
      icon={icon}
      title={title}
      subtitle={subtitle}
      onPress={() => onChange(!checked)}
      trailing={<HigSwitch checked={checked} onChange={onChange} label={title} />}
    />
  )
}

/* Selection row — leading checkmark slot stays empty when inactive so
   the row title stays aligned (iOS Settings → Language behaviour). */
export function HigRowSelect({
  title, subtitle, active, onPress,
}: {
  title: ReactNode
  subtitle?: ReactNode
  active: boolean
  onPress: () => void
}) {
  return (
    <HigRow
      title={title}
      subtitle={subtitle}
      onPress={onPress}
      trailing={
        <span className={'hig-row__check' + (active ? '' : ' hig-row__check--hidden')} aria-hidden>
          <IconCheck width={14} height={14} />
        </span>
      }
    />
  )
}
