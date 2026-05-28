import { useState } from 'react'
import type { Todo } from '../store/todos'
import { useTodos } from '../store/todos'
import { TodoRow } from './TodoRow'
import { Hero } from './Hero'
import { EditModal } from './EditModal'
import { useNow } from '../hooks/useNow'
import { bucketOf, type Bucket } from '../lib/time'

const BUCKET_LABEL: Record<Bucket, string> = {
  today: 'Today',
  week:  'This Week',
  month: 'This Month',
  later: 'Later',
}

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

  /* Home shows the upcoming month at most: Today / This Week / This Month.
     Anything farther becomes a quiet "···" line. */
  const today = active.filter((t) => bucketOf(t.deadline, now) === 'today')
  const week  = active.filter((t) => bucketOf(t.deadline, now) === 'week')
  const month = active.filter((t) => bucketOf(t.deadline, now) === 'month')
  const later = active.length - today.length - week.length - month.length

  return (
    <>
      <Hero />

      <div className="list">
        {([['today', today], ['week', week], ['month', month]] as Array<[Bucket, Todo[]]>).map(([b, arr]) => {
          if (arr.length === 0) return null
          return (
            <section className="list__section" key={b}>
              <header className="list__head">
                <h2 className="list__head-title">{BUCKET_LABEL[b]}</h2>
                <span className="list__head-count">{arr.length}</span>
              </header>
              {arr.map((t) => <TodoRow key={t.id} todo={t} onEdit={setEditing} />)}
            </section>
          )
        })}

        {active.length === 0 && (
          <div className="empty">还没有任务，下面新建一个。</div>
        )}

        {later > 0 && (
          <div className="list__more" aria-label={`还有 ${later} 个更远的任务`} title={`${later} 个更远的任务`}>
            <span>···</span>
          </div>
        )}
      </div>

      <EditModal todo={editing} onClose={() => setEditing(null)} />
    </>
  )
}
