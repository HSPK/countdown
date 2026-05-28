import type { Todo } from '../store/todos'
import { useTodos } from '../store/todos'
import { useSettings } from '../store/settings'
import { useSources } from '../store/sources'
import { useNow } from '../hooks/useNow'
import { formatHM, formatRowTime, urgencyOf } from '../lib/time'
import {
  IconCheck,
  IconEdit,
  IconMaximize,
  IconStar,
  IconStarFill,
  IconTrash,
  IconRepeat,
} from './Icons'

const RECURRENCE_LABEL: Record<string, string> = {
  daily: '每天', weekly: '每周', monthly: '每月',
}

interface Props {
  todo: Todo
  onEdit: (todo: Todo) => void
  /** Whether to show source label on this row */
  showSource?: boolean
}

export function TodoRow({ todo, onEdit, showSource }: Props) {
  const now = useNow()
  const toggleComplete = useTodos((s) => s.toggleComplete)
  const togglePin = useTodos((s) => s.togglePin)
  const removeTodo = useTodos((s) => s.removeTodo)
  const setFocus = useSettings((s) => s.setFocus)
  const source = useSources((s) => s.sources.find((x) => x.id === todo.sourceId))
  const isExternal = source?.type === 'url'

  const remaining = todo.deadline - now
  const u = todo.completedAt ? 'far' : urgencyOf(remaining)
  const overdue = remaining <= 0 && !todo.completedAt

  return (
    <div
      className="row"
      data-completed={!!todo.completedAt}
      tabIndex={0}
      role="button"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return
        if (todo.completedAt) return
        setFocus(todo.id)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !todo.completedAt) setFocus(todo.id)
        if (e.key === ' ') { e.preventDefault(); toggleComplete(todo.id) }
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
        {todo.completedAt ? '完成' : formatRowTime(remaining)}
      </div>

      <div className="row__main">
        <div className="row__title">{todo.title}</div>
        <div className="row__sub">
          {todo.pinned && (
            <span className="row__pin" aria-label="已置顶"><IconStarFill width={11} height={11} /></span>
          )}
          {todo.recurrence && todo.recurrence !== 'none' && (
            <span className="row__pin" aria-label="重复任务" title={`重复 · ${RECURRENCE_LABEL[todo.recurrence]}`}>
              <IconRepeat width={11} height={11} />
            </span>
          )}
          <span>{formatHM(todo.deadline)}</span>
          {todo.tags.length > 0 && (
            <span className="row__sub-tags">
              {todo.tags.slice(0, 3).map((t) => <span key={t} className="tag">#{t}</span>)}
              {todo.tags.length > 3 && <span className="tag" style={{ opacity: 0.7 }}>+{todo.tags.length - 3}</span>}
            </span>
          )}
          {showSource && source && source.id !== 'local' && (
            <span className="src" title={source.url}>{source.name}</span>
          )}
        </div>
      </div>

      <div className="row__actions" onClick={(e) => e.stopPropagation()}>
        {!isExternal && (
          <button
            className="row__action"
            aria-label={todo.completedAt ? '标记未完成' : '完成'}
            title={todo.completedAt ? '标记未完成' : '完成 (Space)'}
            onClick={() => toggleComplete(todo.id)}
          >
            <IconCheck />
          </button>
        )}
        {!isExternal && (
          <button
            className="row__action"
            aria-label="置顶"
            title={todo.pinned ? '取消置顶' : '置顶'}
            onClick={() => togglePin(todo.id)}
          >
            {todo.pinned ? <IconStarFill /> : <IconStar />}
          </button>
        )}
        {!isExternal && (
          <button
            className="row__action"
            aria-label="编辑"
            title="编辑"
            onClick={() => onEdit(todo)}
          >
            <IconEdit />
          </button>
        )}
        {!todo.completedAt && (
          <button
            className="row__action"
            aria-label="全屏专注"
            title="全屏专注"
            onClick={() => setFocus(todo.id)}
          >
            <IconMaximize />
          </button>
        )}
        {!isExternal && (
          <button
            className="row__action row__action--danger"
            aria-label="删除"
            title="删除"
            onClick={() => {
              if (confirm(`删除「${todo.title}」？`)) removeTodo(todo.id)
            }}
          >
            <IconTrash />
          </button>
        )}
      </div>
    </div>
  )
}
