import { useTodos, selectNext } from '../store/todos'
import { useNow } from '../hooks/useNow'
import { useT } from '../lib/i18n'
import { diffParts, formatAbsolute, pad, urgencyOf } from '../lib/time'

export function Hero() {
  const next = useTodos(selectNext)
  const now = useNow()
  const t = useT()

  if (!next) {
    return (
      <section className="hero" aria-label={t('hero.next')}>
        <div className="hero__label">{t('hero.next')}</div>
        <h1 className="hero__empty-title">{t('hero.empty')}</h1>
      </section>
    )
  }

  const remaining = next.deadline - now
  const overdue = remaining <= 0
  const u = urgencyOf(remaining)
  const { sign, d, h, m, s } = diffParts(remaining)

  return (
    <section className="hero" aria-label={t('hero.next')} data-urgency={u} data-overdue={overdue}>
      <div className="hero__label">{overdue ? t('hero.overdue') : t('hero.next')}</div>
      <h1 className="hero__title">{next.title}</h1>

      <div className="hero__digits" aria-live="polite">
        {sign < 0 && <span>+</span>}
        <div className="hero__seg">
          <span className="hero__seg-num">{pad(d)}</span>
          <span className="hero__seg-label">{t('focus.label.days')}</span>
        </div>
        <span className="hero__sep">·</span>
        <div className="hero__seg">
          <span className="hero__seg-num">{pad(h)}</span>
          <span className="hero__seg-label">{t('focus.label.hours')}</span>
        </div>
        <span className="hero__sep">·</span>
        <div className="hero__seg">
          <span className="hero__seg-num">{pad(m)}</span>
          <span className="hero__seg-label">{t('focus.label.min')}</span>
        </div>
        <span className="hero__sep">·</span>
        <div className="hero__seg">
          <span className="hero__seg-num">{pad(s)}</span>
          <span className="hero__seg-label">{t('focus.label.sec')}</span>
        </div>
      </div>

      <div className="hero__meta">{t('focus.due', { at: formatAbsolute(next.deadline) })}</div>
    </section>
  )
}
