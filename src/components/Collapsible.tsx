import { useId } from 'react'
import type { ReactNode } from 'react'
import { IconChevronDown } from './Icons'

/* HIG-style collapsible row: a button (label + value + chevron) that
   reveals a body when open. Lives inside a HigGroup so it inherits the
   grouped-list hairline/padding rules; the open body sits below the
   row header inside the same container. */
export function Collapsible({
  label, value, open, onToggle, children,
}: {
  label: ReactNode
  value: ReactNode
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const id = useId()
  return (
    <div className="collapsible" data-open={open}>
      <button
        type="button"
        className="collapsible__head"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
      >
        <span className="collapsible__label">{label}</span>
        <span className="collapsible__value">{value}</span>
        <IconChevronDown width={14} height={14} className="collapsible__chev" />
      </button>
      {open && (
        <div id={id} className="collapsible__body">{children}</div>
      )}
    </div>
  )
}
