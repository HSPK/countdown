import { useTodos, selectNext } from '../store/todos'
import { useNow } from '../hooks/useNow'
import { diffParts, formatAbsolute, pad, urgencyOf } from '../lib/time'

export function Hero() {
  const next = useTodos(selectNext)
  const now = useNow()

  if (!next) {
    return (
      <section className="hero" aria-label="下一个截止">
        <div className="hero__label">Next</div>
        <h1 className="hero__empty-title">还没有任务，下面新建一个。</h1>
      </section>
    )
  }

  const remaining = next.deadline - now
  const overdue = remaining <= 0
  const u = urgencyOf(remaining)
  const { sign, d, h, m, s } = diffParts(remaining)

  return (
    <section className="hero" aria-label="下一个截止" data-urgency={u}>
      <div className="hero__label">{overdue ? 'Overdue' : 'Next'}</div>
      <h1 className="hero__title">{next.title}</h1>

      <div className="hero__digits" aria-live="polite">
        {sign < 0 && <span>+</span>}
        <div className="hero__seg">
          <span className="hero__seg-num">{pad(d)}</span>
          <span className="hero__seg-label">Days</span>
        </div>
        <span className="hero__sep">·</span>
        <div className="hero__seg">
          <span className="hero__seg-num">{pad(h)}</span>
          <span className="hero__seg-label">Hours</span>
        </div>
        <span className="hero__sep">·</span>
        <div className="hero__seg">
          <span className="hero__seg-num">{pad(m)}</span>
          <span className="hero__seg-label">Min</span>
        </div>
        <span className="hero__sep">·</span>
        <div className="hero__seg">
          <span className="hero__seg-num">{pad(s)}</span>
          <span className="hero__seg-label">Sec</span>
        </div>
      </div>

      <div className="hero__meta">截止 {formatAbsolute(next.deadline)}</div>
    </section>
  )
}
