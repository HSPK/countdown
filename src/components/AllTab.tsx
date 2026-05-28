import { useEffect, useMemo, useRef, useState } from 'react'
import type { Todo } from '../store/todos'
import { useTodos, selectAllTags, selectCompleted } from '../store/todos'
import { useSources } from '../store/sources'
import { TodoRow } from './TodoRow'
import { EditModal } from './EditModal'
import { useNow } from '../hooks/useNow'
import { useT } from '../lib/i18n'
import { bucketOf, type Bucket } from '../lib/time'
import { expandRecurring, type VirtualOccurrence } from '../lib/recurrence'
import { IconChevronDown } from './Icons'

const BUCKET_KEYS: Record<Bucket, string> = {
  today: 'bucket.today',
  week:  'bucket.week',
  month: 'bucket.month',
  later: 'bucket.later',
}

const PAGE_DAYS = 30

export function AllTab() {
  const todos = useTodos((s) => s.todos)
  const allTags = useTodos(selectAllTags)
  const completed = useTodos(selectCompleted)
  const clearCompleted = useTodos((s) => s.clearCompleted)
  const sources = useSources((s) => s.sources)
  const now = useNow()
  const t = useT()

  const [editing, setEditing] = useState<Todo | null>(null)
  const [q, setQ] = useState('')
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())
  const [activeSources, setActiveSources] = useState<Set<string>>(new Set())
  const [showDone, setShowDone] = useState(false)

  /* Pagination window for recurring expansion. Each page extends the
     "later" horizon by PAGE_DAYS so infinite scroll keeps revealing
     more recurring occurrences. */
  const [pages, setPages] = useState(1)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  /* Reset paging when filter inputs change so we don't lazy-grow with stale state. */
  useEffect(() => { setPages(1) }, [q, activeTags, activeSources])

  const toggle = <T,>(set: Set<T>, v: T): Set<T> => {
    const next = new Set(set)
    next.has(v) ? next.delete(v) : next.add(v)
    return next
  }

  const filtered = useMemo(() => {
    const qL = q.trim().toLowerCase()
    return todos.filter((t) => {
      if (t.completedAt) return false
      if (qL && !t.title.toLowerCase().includes(qL) && !(t.notes ?? '').toLowerCase().includes(qL)) return false
      if (activeTags.size && !t.tags.some((tg) => activeTags.has(tg))) return false
      if (activeSources.size && !activeSources.has(t.sourceId)) return false
      return true
    })
  }, [todos, q, activeTags, activeSources])

  const baseActive = filtered.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return a.deadline - b.deadline
  })

  /* Expand recurring occurrences out to (now + pages * 30 days). */
  const horizonEnd = now + pages * PAGE_DAYS * 86_400_000
  const occurrences = useMemo<VirtualOccurrence[]>(() => {
    return expandRecurring(baseActive, now, horizonEnd)
      .slice()
      .sort((a, b) => a.deadline - b.deadline)
  }, [baseActive, now, horizonEnd])

  const grouped: Record<Bucket, VirtualOccurrence[]> = { today: [], week: [], month: [], later: [] }
  for (const o of occurrences) grouped[bucketOf(o.deadline, now)].push(o)
  const order: Bucket[] = ['today', 'week', 'month', 'later']

  /* True when there might be more recurring rows further out, OR a
     non-recurring base todo with deadline past horizonEnd that hasn't
     surfaced yet. */
  const hasMore = useMemo(() => {
    for (const t of baseActive) {
      if (t.deadline > horizonEnd) return true
      if (t.recurrence && t.recurrence !== 'none') {
        /* Recurring: assume there's always more unless we've capped. */
        return true
      }
    }
    return false
  }, [baseActive, horizonEnd])

  /* Infinite scroll: bump pages++ when the sentinel intersects the viewport. */
  useEffect(() => {
    if (!hasMore) return
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setPages((p) => Math.min(p + 1, 60)) // hard cap = 5 years out
      }
    }, { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, pages])

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="search">
          <span className="search__icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                 strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
            </svg>
          </span>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search.placeholder')}
            aria-label={t('search.placeholder')}
          />
        </div>

        {(allTags.length > 0 || sources.length > 1) && (
          <div className="filters">
            {allTags.length > 0 && (
              <div className="filters__group">
                <span className="filters__label">{t('filters.tags')}</span>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    className="tag tag--filter"
                    aria-pressed={activeTags.has(tag)}
                    onClick={() => setActiveTags(toggle(activeTags, tag))}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
            {sources.length > 1 && (
              <div className="filters__group">
                <span className="filters__label">{t('filters.sources')}</span>
                {sources.map((s) => (
                  <button
                    key={s.id}
                    className="tag tag--filter"
                    aria-pressed={activeSources.has(s.id)}
                    onClick={() => setActiveSources(toggle(activeSources, s.id))}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="list">
        {occurrences.length === 0 ? (
          <div className="empty">
            {q || activeTags.size || activeSources.size ? t('list.empty.search') : t('list.empty.none')}
          </div>
        ) : (
          order
            .filter((b) => grouped[b].length > 0)
            .map((b) => (
              <section className="list__section" key={b}>
                <header className="list__head">
                  <h2 className="list__head-title">
                    {t(BUCKET_KEYS[b])}
                    {b === 'later' && <span className="list__head-range"> · {t('bucket.range', { days: pages * PAGE_DAYS })}</span>}
                  </h2>
                  <span className="list__head-count">{grouped[b].length}</span>
                </header>
                {grouped[b].map((o) => (
                  <TodoRow
                    key={o.id}
                    todo={o.parent}
                    onEdit={setEditing}
                    showSource
                    occurrenceDeadline={o.isVirtual ? o.deadline : undefined}
                  />
                ))}
              </section>
            ))
        )}

        {hasMore && (
          <div ref={sentinelRef} className="list__sentinel" aria-hidden>
            <span className="list__sentinel-pulse" />
            <span className="list__sentinel-label">{t('list.loading')}</span>
          </div>
        )}

        {completed.length > 0 && (
          <section className="list__section">
            <header className="list__head">
              <h2 className="list__head-title">{t('bucket.done')}</h2>
              <span className="list__head-count">{completed.length}</span>
              <span className="list__spacer" />
              <button className="list__head-btn" onClick={() => setShowDone((v) => !v)}>
                <IconChevronDown
                  width={12} height={12}
                  style={{
                    verticalAlign: 'middle', marginRight: 4,
                    transform: showDone ? 'rotate(180deg)' : 'none',
                    transition: 'transform 200ms',
                  }}
                />
                {showDone ? t('list.hide') : t('list.show')}
              </button>
              {showDone && (
                <button
                  className="list__head-btn"
                  onClick={() => {
                    if (confirm(t('list.clear.confirm', { count: completed.length }))) clearCompleted()
                  }}
                >
                  {t('list.clear')}
                </button>
              )}
            </header>
            {showDone && completed.map((t_) => (
              <TodoRow key={t_.id} todo={t_} onEdit={setEditing} showSource />
            ))}
          </section>
        )}
      </div>

      <EditModal todo={editing} onClose={() => setEditing(null)} />
    </>
  )
}
