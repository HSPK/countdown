import { useMemo, useState } from 'react'
import type { Todo } from '../store/todos'
import { useTodos } from '../store/todos'
import { TodoRow } from './TodoRow'
import { Hero } from './Hero'
import { EditModal } from './EditModal'
import { useNow } from '../hooks/useNow'
import { bucketOf, type Bucket } from '../lib/time'
import { expandRecurring, type VirtualOccurrence } from '../lib/recurrence'

const BUCKET_LABEL: Record<Bucket, string> = {
  today: 'Today',
  week:  'This Week',
  month: 'This Month',
  later: 'Later',
}

const HOME_HORIZON_DAYS = 30

export function HomeTab() {
  const todos = useTodos((s) => s.todos)
  const now = useNow()
  const [editing, setEditing] = useState<Todo | null>(null)

  const active = todos
    .filter((t) => !t.completedAt)
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

  /* Home shows the upcoming month at most: Today / This Week / This Month.
     Anything farther becomes a quiet "···" line. */
  const today = occurrences.filter((o) => bucketOf(o.deadline, now) === 'today')
  const week  = occurrences.filter((o) => bucketOf(o.deadline, now) === 'week')
  const month = occurrences.filter((o) => bucketOf(o.deadline, now) === 'month')
  const visibleCount = today.length + week.length + month.length

  /* "later" indicator counts how many ACTIVE base todos have their next
     occurrence past the horizon — recurring ones never trigger this since
     we already capped expansion. */
  const laterBase = active.filter((t) => bucketOf(t.deadline, now) === 'later').length

  return (
    <>
      <Hero />

      <div className="list">
        {([['today', today], ['week', week], ['month', month]] as Array<[Bucket, VirtualOccurrence[]]>).map(([b, arr]) => {
          if (arr.length === 0) return null
          return (
            <section className="list__section" key={b}>
              <header className="list__head">
                <h2 className="list__head-title">{BUCKET_LABEL[b]}</h2>
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
          <div className="empty">还没有任务，下面新建一个。</div>
        )}

        {laterBase > 0 && (
          <div className="list__more" aria-label={`还有 ${laterBase} 个更远的任务`} title={`${laterBase} 个更远的任务`}>
            <span>···</span>
          </div>
        )}
      </div>

      <EditModal todo={editing} onClose={() => setEditing(null)} />
    </>
  )
}
