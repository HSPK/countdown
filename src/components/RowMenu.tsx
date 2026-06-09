import { useRef, useState, type ReactNode } from 'react'
import { useDismissable } from '../hooks/useDismissable'
import { IconMoreHorizontal } from './Icons'

export interface RowMenuItem {
  icon: ReactNode
  label: string
  destructive?: boolean
  onSelect: () => void
}

/* ⋯ button + anchored popover menu. Outside-click and Escape dismiss
   handled by the shared useDismissable hook so the popover behaviour
   stays consistent with every other dismissable surface in the app. */
export function RowMenu({ items, label }: { items: RowMenuItem[]; label: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  useDismissable(ref, open, () => setOpen(false))

  if (items.length === 0) return null

  return (
    <div className="row-menu-wrap" ref={ref}>
      <button
        type="button"
        className="row__action"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <IconMoreHorizontal />
      </button>
      {open && (
        <div className="row-menu" role="menu">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className={'row-menu__item' + (item.destructive ? ' row-menu__item--danger' : '')}
              role="menuitem"
              onClick={() => { setOpen(false); item.onSelect() }}
            >
              <span className="row-menu__icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
