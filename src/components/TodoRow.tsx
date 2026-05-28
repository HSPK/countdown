import { useEffect, useRef, useState } from 'react'
import type { Todo } from '../store/todos'
import { useTodos } from '../store/todos'
import { useSettings } from '../store/settings'
import { useSources } from '../store/sources'
import { useNow } from '../hooks/useNow'
import { useT } from '../lib/i18n'
import { formatHM, formatRowTime, urgencyOf } from '../lib/time'
import {
  IconCheck,
  IconEdit,
  IconStarFill,
  IconTrash,
  IconStar,
  IconRepeat,
  IconMoreHorizontal,
} from './Icons'

const RECURRENCE_LABEL_KEYS: Record<string, string> = {
  daily: 'recurrence.daily', weekly: 'recurrence.weekly', monthly: 'recurrence.monthly', custom: 'recurrence.custom',
}

interface Props {
  todo: Todo
  onEdit: (todo: Todo) => void
  /** Whether to show source label on this row */
  showSource?: boolean
  /** When set, the row is a virtual recurring occurrence. The displayed
   *  deadline overrides todo.deadline; check completes only this
   *  occurrence (advancing the parent past it). */
  occurrenceDeadline?: number
}

export function TodoRow({ todo, onEdit, showSource, occurrenceDeadline }: Props) {
  const now = useNow()
  const t = useT()
  const toggleComplete = useTodos((s) => s.toggleComplete)
  const completeOccurrence = useTodos((s) => s.completeOccurrence)
  const togglePin = useTodos((s) => s.togglePin)
  const removeTodo = useTodos((s) => s.removeTodo)
  const setFocus = useSettings((s) => s.setFocus)
  const source = useSources((s) => s.sources.find((x) => x.id === todo.sourceId))
  const isExternal = source?.type === 'url'
  const isVirtual = occurrenceDeadline !== undefined

  const effectiveDeadline = occurrenceDeadline ?? todo.deadline
  const remaining = effectiveDeadline - now
  const u = todo.completedAt ? 'far' : urgencyOf(remaining)
  const overdue = remaining <= 0 && !todo.completedAt

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown, { passive: true })
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const onCheck = () => {
    if (isVirtual) {
      completeOccurrence(todo.id, effectiveDeadline)
    } else {
      toggleComplete(todo.id)
    }
  }

  return (
    <div
      className="row"
      data-completed={!!todo.completedAt}
      data-virtual={isVirtual}
      tabIndex={0}
      role="button"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return
        if (todo.completedAt) return
        if (isVirtual) { onEdit(todo); return }
        setFocus(todo.id)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !todo.completedAt && !isVirtual) setFocus(todo.id)
        if (e.key === ' ') { e.preventDefault(); onCheck() }
      }}
    >
      <div
        className={
          'row__time' +
          (overdue ? ' row__time--overdue' :
            u === 'critical' ? ' row__time--critical' :
              u === 'soon' ? ' row__time--soon' : '')
        }
      >
        {todo.completedAt ? t('row.done') : formatRowTime(remaining)}
      </div>

      <div className="row__main">
        <div className="row__title-wrap">
          {todo.pinned && !isVirtual && (
            <span className="row__title-icon" aria-label={t('row.pinned')} title={t('row.pinned')}>
              <IconStarFill width={12} height={12} />
            </span>
          )}
          {todo.recurrence && todo.recurrence !== 'none' && (
            <span className="row__title-icon" aria-label={t('row.recurring')} title={`${t('row.recurring')} · ${t(RECURRENCE_LABEL_KEYS[todo.recurrence] ?? '')}`}>
              <IconRepeat width={12} height={12} />
            </span>
          )}
          <span className="row__title">{todo.title}</span>
        </div>
        <div className="row__sub">
          <span>{formatHM(effectiveDeadline)}</span>
          {todo.recurrence && todo.recurrence !== 'none' && (
            <>
              <span className="row__sub-sep" aria-hidden>·</span>
              <span>{t(RECURRENCE_LABEL_KEYS[todo.recurrence])}</span>
            </>
          )}
          {todo.tags.length > 0 && (
            <>
              <span className="row__sub-sep" aria-hidden>·</span>
              <span className="row__sub-tags">
                {todo.tags.slice(0, 3).map((tag) => <span key={tag} className="tag">#{tag}</span>)}
                {todo.tags.length > 3 && <span className="tag" style={{ opacity: 0.7 }}>+{todo.tags.length - 3}</span>}
              </span>
            </>
          )}
          {showSource && source && source.id !== 'local' && (
            <>
              <span className="row__sub-sep" aria-hidden>·</span>
              <span className="src" title={source.url}>{source.name}</span>
            </>
          )}
        </div>
      </div>

      <div className="row__actions" onClick={(e) => e.stopPropagation()}>
        {!isExternal && (
          <button
            className="row__action"
            aria-label={todo.completedAt ? t('row.uncomplete') : t('row.complete')}
            title={todo.completedAt ? t('row.uncomplete') : isVirtual ? t('row.complete.once') : t('row.complete.hint')}
            onClick={onCheck}
          >
            <IconCheck />
          </button>
        )}
        {!isExternal && (
          <div className="row-menu-wrap" ref={menuRef}>
            <button
              className="row__action"
              aria-label={t('row.more')}
              title={t('row.more')}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <IconMoreHorizontal />
            </button>
            {menuOpen && (
              <div className="row-menu" role="menu">
                {!isVirtual && (
                  <button
                    className="row-menu__item"
                    role="menuitem"
                    onClick={() => { togglePin(todo.id); setMenuOpen(false) }}
                  >
                    <span className="row-menu__icon">
                      {todo.pinned ? <IconStarFill width={14} height={14} /> : <IconStar width={14} height={14} />}
                    </span>
                    <span>{todo.pinned ? t('row.unpin') : t('row.pin')}</span>
                  </button>
                )}
                <button
                  className="row-menu__item"
                  role="menuitem"
                  onClick={() => { onEdit(todo); setMenuOpen(false) }}
                >
                  <span className="row-menu__icon"><IconEdit width={14} height={14} /></span>
                  <span>{isVirtual ? t('row.edit.parent') : t('row.edit')}</span>
                </button>
                {!isVirtual && (
                  <button
                    className="row-menu__item row-menu__item--danger"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false)
                      if (confirm(t('row.delete.confirm', { title: todo.title }))) removeTodo(todo.id)
                    }}
                  >
                    <span className="row-menu__icon"><IconTrash width={14} height={14} /></span>
                    <span>{t('row.delete')}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
