import { useEffect } from 'react'
import { useSettings } from '../store/settings'
import { useT } from '../lib/i18n'
import { getSections } from './helpContent'
import { IconArrowLeft, IconChevronRight, IconBook } from './Icons'

function pad2(n: number): string { return n < 10 ? '0' + n : String(n) }

export function HelpPage() {
  const helpSection = useSettings((s) => s.helpSection)
  const setHelp = useSettings((s) => s.setHelp)
  const lang = useSettings((s) => s.lang)
  const t = useT()
  const SECTIONS = getSections(lang)

  const onToc = helpSection === 'toc'
  const idx = onToc ? -1 : SECTIONS.findIndex((s) => s.id === helpSection)

  useEffect(() => {
    if (helpSection === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setHelp(null); return }
      if (onToc) return
      if (e.key === 'ArrowLeft' && idx > 0) {
        e.stopPropagation(); setHelp(SECTIONS[idx - 1].id)
      }
      if (e.key === 'ArrowRight' && idx < SECTIONS.length - 1) {
        e.stopPropagation(); setHelp(SECTIONS[idx + 1].id)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [helpSection, onToc, idx, setHelp, SECTIONS])

  if (helpSection === null) return null

  return (
    <div className="help" role="dialog" aria-modal="true" aria-label={t('help.title')}>
      <div className="help__top">
        <button
          className="help__back"
          aria-label={t('help.back')}
          title={`${t('help.back')} (Esc)`}
          onClick={() => setHelp(null)}
        >
          <IconArrowLeft />
        </button>
        <span className="help__top-title">{t('help.title')}</span>
        <span className="help__top-spacer" />
        <button
          className={'help__toc-btn' + (onToc ? ' help__toc-btn--active' : '')}
          aria-label={t('help.toc')}
          title={t('help.toc')}
          onClick={() => setHelp('toc')}
          aria-pressed={onToc}
        >
          <IconBook width={14} height={14} />
          <span>{t('help.toc.short')}</span>
        </button>
        {!onToc && (
          <span
            className="help__indicator"
            aria-label={`${idx + 1} / ${SECTIONS.length}`}
          >
            <span className="help__indicator-num">{pad2(idx + 1)}</span>
            <span className="help__indicator-sep">/</span>
            <span className="help__indicator-total">{pad2(SECTIONS.length)}</span>
          </span>
        )}
      </div>

      <div className="help__scroll">
        {onToc ? <TocView sections={SECTIONS} onPick={(id) => setHelp(id)} /> : (
          <article className="help__page" key={SECTIONS[idx].id}>
            <div className="help__page-eyebrow">{pad2(idx + 1)} · {SECTIONS[idx].title}</div>
            <h2 className="help__heading">{SECTIONS[idx].title}</h2>
            <div className="help__content">{SECTIONS[idx].body()}</div>
          </article>
        )}
      </div>

      {!onToc && (
        <nav className="help__nav" aria-label={t('help.title')}>
          <button
            className="help__nav-btn help__nav-btn--prev"
            disabled={idx <= 0}
            onClick={() => idx > 0 && setHelp(SECTIONS[idx - 1].id)}
            aria-label={idx > 0 ? `${t('help.prev')}: ${SECTIONS[idx - 1].title}` : ''}
          >
            <IconArrowLeft />
            {idx > 0 && (
              <span className="help__nav-label">
                <span className="help__nav-eyebrow">{t('help.prev')}</span>
                <span className="help__nav-title">{SECTIONS[idx - 1].title}</span>
              </span>
            )}
          </button>

          <div className="help__dots" role="tablist" aria-label={t('help.toc')}>
            {SECTIONS.map((s, i) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={i === idx}
                aria-label={`${s.title} (${i + 1} / ${SECTIONS.length})`}
                title={s.title}
                className={'help__dot' + (i === idx ? ' help__dot--active' : '')}
                onClick={() => setHelp(s.id)}
              />
            ))}
          </div>

          <button
            className="help__nav-btn help__nav-btn--next"
            disabled={idx < 0 || idx >= SECTIONS.length - 1}
            onClick={() => idx >= 0 && idx < SECTIONS.length - 1 && setHelp(SECTIONS[idx + 1].id)}
            aria-label={idx < SECTIONS.length - 1 ? `${t('help.next')}: ${SECTIONS[idx + 1].title}` : ''}
          >
            {idx >= 0 && idx < SECTIONS.length - 1 && (
              <span className="help__nav-label" style={{ textAlign: 'right' }}>
                <span className="help__nav-eyebrow">{t('help.next')}</span>
                <span className="help__nav-title">{SECTIONS[idx + 1].title}</span>
              </span>
            )}
            <IconChevronRight />
          </button>
        </nav>
      )}
    </div>
  )
}

function TocView({ sections, onPick }: { sections: ReturnType<typeof getSections>; onPick: (id: string) => void }) {
  const t = useT()
  return (
    <article className="help__page" key="toc">
      <div className="help__page-eyebrow">{t('help.toc')}</div>
      <h2 className="help__heading">{t('help.title')}</h2>
      <p style={{ fontSize: 14, color: 'var(--fg-muted)', marginTop: 4, marginBottom: 22 }}>
        {t('help.intro')}
      </p>
      <ol className="toc-list">
        {sections.map((s, i) => (
          <li key={s.id} className="toc-item" onClick={() => onPick(s.id)}>
            <span className="toc-num">{pad2(i + 1)}</span>
            <span className="toc-body">
              <span className="toc-title">{s.title}</span>
              <span className="toc-intro">{s.intro}</span>
            </span>
            <span className="toc-arrow" aria-hidden><IconChevronRight width={14} height={14} /></span>
          </li>
        ))}
      </ol>
    </article>
  )
}
