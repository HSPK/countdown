import type { Todo } from '../store/todos'
import { useTodos } from '../store/todos'
import { useSettings } from '../store/settings'
import { useSources } from '../store/sources'
import { useNow } from '../hooks/useNow'
import { useT } from '../lib/i18n'
import { formatHM, formatRowTime, urgencyOf } from '../lib/time'
import { RowMenu, type RowMenuItem } from './RowMenu'
import {
  IconCheck,
  IconEdit,
  IconStarFill,
  IconTrash,
  IconStar,
  IconRepeat,
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

/* Apple Reminders-style row: leading circular check · title + thin
   subtitle · trailing countdown text + ⋯ overflow menu. */
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

  const onCheck = () => {
    if (isVirtual) completeOccurrence(todo.id, effectiveDeadline)
    else toggleComplete(todo.id)
  }

  const menuItems: RowMenuItem[] = []
  if (!isVirtual) {
    menuItems.push({
      icon: todo.pinned ? <IconStarFill width={14} height={14} /> : <IconStar width={14} height={14} />,
      label: todo.pinned ? t('row.unpin') : t('row.pin'),
      onSelect: () => togglePin(todo.id),
    })
  }
  menuItems.push({
    icon: <IconEdit width={14} height={14} />,
    label: isVirtual ? t('row.edit.parent') : t('row.edit'),
    onSelect: () => onEdit(todo),
  })
  if (!isVirtual) {
    menuItems.push({
      icon: <IconTrash width={14} height={14} />,
      label: t('row.delete'),
      destructive: true,
      onSelect: () => {
        if (confirm(t('row.delete.confirm', { title: todo.title }))) removeTodo(todo.id)
      },
    })
  }

  const onRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    if (todo.completedAt) return
    if (isVirtual) { onEdit(todo); return }
    setFocus(todo.id)
  }
  const onRowKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !todo.completedAt && !isVirtual) setFocus(todo.id)
    if (e.key === ' ') { e.preventDefault(); onCheck() }
  }

  const urgencyClass = overdue ? ' row__time--overdue'
    : u === 'critical' ? ' row__time--critical'
    : u === 'soon'     ? ' row__time--soon'
    : ''

  return (
    <div
      className="row"
      data-completed={!!todo.completedAt}
      data-virtual={isVirtual}
      tabIndex={0}
      role="button"
      onClick={onRowClick}
      onKeyDown={onRowKey}
    >
      {!isExternal ? (
        <button
          type="button"
          className={'row__check' + (todo.completedAt ? ' row__check--on' : '')}
          aria-label={todo.completedAt ? t('row.uncomplete') : t('row.complete')}
          title={todo.completedAt ? t('row.uncomplete') : isVirtual ? t('row.complete.once') : t('row.complete.hint')}
          onClick={(e) => { e.stopPropagation(); onCheck() }}
        >
          {todo.completedAt && <IconCheck width={12} height={12} />}
        </button>
      ) : (
        <span className="row__check row__check--readonly" aria-hidden />
      )}

      <div className="row__main">
        <div className="row__title-wrap">
          {todo.pinned && !isVirtual && (
            <span className="row__title-icon" aria-label={t('row.pinned')} title={t('row.pinned')}>
              <IconStarFill width={11} height={11} />
            </span>
          )}
          {todo.recurrence && todo.recurrence !== 'none' && (
            <span
              className="row__title-icon"
              aria-label={t('row.recurring')}
              title={`${t('row.recurring')} · ${t(RECURRENCE_LABEL_KEYS[todo.recurrence] ?? '')}`}
            >
              <IconRepeat width={11} height={11} />
            </span>
          )}
          <span className="row__title">{todo.title}</span>
        </div>
        <div className="row__sub">
          <span className="row__sub-time">{formatHM(effectiveDeadline)}</span>
          {todo.recurrence && todo.recurrence !== 'none' && (
            <span>{t(RECURRENCE_LABEL_KEYS[todo.recurrence])}</span>
          )}
          {todo.tags.length > 0 && (
            <span className="row__sub-tags">
              {todo.tags.slice(0, 3).map((tag) => <span key={tag} className="tag">#{tag}</span>)}
              {todo.tags.length > 3 && <span className="tag row__sub-tags-more">+{todo.tags.length - 3}</span>}
            </span>
          )}
          {showSource && source && source.id !== 'local' && (
            <span className="src" title={source.url}>{source.name}</span>
          )}
        </div>
      </div>

      <div className={'row__count' + urgencyClass}>
        {todo.completedAt ? t('row.done') : formatRowTime(remaining)}
      </div>

      <div className="row__actions" onClick={(e) => e.stopPropagation()}>
        {!isExternal && <RowMenu items={menuItems} label={t('row.more')} />}
      </div>
    </div>
  )
}
