import { useMemo, useState } from 'react'
import type { Todo } from '../store/todos'
import { useTodos } from '../store/todos'
import { TodoRow } from './TodoRow'
import { Hero } from './Hero'
import { EditModal } from './EditModal'
import { useNow } from '../hooks/useNow'
import { useT } from '../lib/i18n'
import { bucketOf, type Bucket } from '../lib/time'
import { expandRecurring, type VirtualOccurrence } from '../lib/recurrence'

const BUCKET_KEYS: Record<Bucket, string> = {
  today: 'bucket.today',
  week:  'bucket.week',
  month: 'bucket.month',
  later: 'bucket.later',
}

const HOME_HORIZON_DAYS = 30

export function HomeTab() {
  const todos = useTodos((s) => s.todos)
  const now = useNow()
  const t = useT()
  const [editing, setEditing] = useState<Todo | null>(null)

  const active = todos
    .filter((t_) => !t_.completedAt)
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return a.deadline - b.deadline
    })

  /* Expand recurring tasks into their upcoming occurrences within the
     home horizon (1 month). Each occurrence becomes its own row. */
  const occurrences = useMemo<VirtualOccurrence[]>(() => {
    const horizonEnd = now + HOME_HORIZON_DAYS * 86_400_000
    return expandRecurring(active, now, horizonEnd)
      .slice()
      .sort((a, b) => a.deadline - b.deadline)
  }, [active, now])

  const today = occurrences.filter((o) => bucketOf(o.deadline, now) === 'today')
  const week  = occurrences.filter((o) => bucketOf(o.deadline, now) === 'week')
  const month = occurrences.filter((o) => bucketOf(o.deadline, now) === 'month')
  const visibleCount = today.length + week.length + month.length
  const laterBase = active.filter((t_) => bucketOf(t_.deadline, now) === 'later').length

  return (
    <>
      <Hero />

      <div className="list">
        {([['today', today], ['week', week], ['month', month]] as Array<[Bucket, VirtualOccurrence[]]>).map(([b, arr]) => {
          if (arr.length === 0) return null
          return (
            <section className="list__section" key={b}>
              <header className="list__head">
                <h2 className="list__head-title">{t(BUCKET_KEYS[b])}</h2>
                <span className="list__head-count">{arr.length}</span>
              </header>
              {arr.map((o) => (
                <TodoRow
                  key={o.id}
                  todo={o.parent}
                  onEdit={setEditing}
                  occurrenceDeadline={o.isVirtual ? o.deadline : undefined}
                />
              ))}
            </section>
          )
        })}

        {visibleCount === 0 && (
          <div className="empty">{t('hero.empty')}</div>
        )}

        {laterBase > 0 && (
          <div className="list__more"
               aria-label={t('list.more.title', { count: laterBase })}
               title={t('list.more.title', { count: laterBase })}>
            <span>···</span>
          </div>
        )}
      </div>

      <EditModal todo={editing} onClose={() => setEditing(null)} />
    </>
  )
}
