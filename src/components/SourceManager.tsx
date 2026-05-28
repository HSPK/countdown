import { useEffect, useState } from 'react'
import { useSources, LOCAL_SOURCE_ID, type Source } from '../store/sources'
import { useTodos } from '../store/todos'
import { fetchSubscription } from '../lib/portable'
import { formatAbsolute } from '../lib/time'
import { useT } from '../lib/i18n'
import { IconTrash, IconPlus, IconX } from './Icons'

export function SourceManager() {
  const sources = useSources((s) => s.sources)
  const localCount = useTodos((s) => s.todos.filter((todo) => todo.sourceId === LOCAL_SOURCE_ID).length)
  const counts = useTodos((s) => {
    const m = new Map<string, number>()
    for (const todo of s.todos) m.set(todo.sourceId, (m.get(todo.sourceId) ?? 0) + 1)
    return m
  })
  const t = useT()

  const remove = useSources((s) => s.remove)
  const toggle = useSources((s) => s.toggle)
  const setStatus = useSources((s) => s.setStatus)
  const dropSource = useTodos((s) => s.dropSource)
  const replaceSource = useTodos((s) => s.replaceSource)

  const [adding, setAdding] = useState(false)

  const refresh = async (src: Source) => {
    if (src.type !== 'url' || !src.url) return
    setStatus(src.id, { status: 'fetching', lastError: undefined })
    try {
      const items = await fetchSubscription(src.url, src.id)
      replaceSource(src.id, items)
      setStatus(src.id, { status: 'ok', lastFetched: Date.now() })
    } catch (e) {
      setStatus(src.id, { status: 'error', lastError: e instanceof Error ? e.message : String(e) })
    }
  }

  return (
    <div className="settings__body">
      {sources.map((s) => {
        const count = s.id === LOCAL_SOURCE_ID ? localCount : (counts.get(s.id) ?? 0)
        const indicator =
          !s.enabled ? 'off' :
          s.status === 'fetching' ? 'fetching' :
          s.status === 'error' ? 'err' :
          s.status === 'ok' || s.type === 'local' ? 'ok' : 'off'

        return (
          <div className="source-row" key={s.id}>
            <span className={`source-row__indicator source-row__indicator--${indicator}`} aria-hidden />
            <div>
              <div className="source-row__name">
                {s.name}
                <span style={{ marginLeft: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  {t('sources.count', { count })}
                </span>
              </div>
              <div className="source-row__meta">
                {s.type === 'local'
                  ? t('sources.local.storage')
                  : <>
                      {s.url}
                      {s.lastFetched && <> · {t('sources.last.ok', { time: formatAbsolute(s.lastFetched) })}</>}
                      {s.status === 'error' && s.lastError && (
                        <span style={{ color: 'var(--u-critical)' }}> · {t('sources.last.error', { error: s.lastError })}</span>
                      )}
                    </>}
              </div>
            </div>
            <div className="source-row__actions">
              {s.type === 'url' && (
                <>
                  <button
                    className="source-row__btn"
                    title={s.enabled ? t('sources.disable') : t('sources.enable')}
                    onClick={() => toggle(s.id)}
                    aria-label={t('sources.toggle')}
                  >
                    {s.enabled ? '○' : '●'}
                  </button>
                  <button
                    className="source-row__btn"
                    title={t('sources.refresh.now')}
                    onClick={() => refresh(s)}
                    disabled={s.status === 'fetching'}
                    aria-label={t('sources.refresh')}
                  >
                    <RefreshIcon spinning={s.status === 'fetching'} />
                  </button>
                  <button
                    className="source-row__btn source-row__btn--danger"
                    title={t('sources.delete')}
                    aria-label={t('sources.delete')}
                    onClick={() => {
                      if (confirm(t('sources.delete.confirm', { name: s.name, count }))) {
                        dropSource(s.id)
                        remove(s.id)
                      }
                    }}
                  >
                    <IconTrash />
                  </button>
                </>
              )}
            </div>
          </div>
        )
      })}

      <div style={{ paddingTop: 12 }}>
        <button className="btn" onClick={() => setAdding(true)}>
          <IconPlus width={14} height={14} style={{ marginRight: 6, verticalAlign: '-2px' }} />
          {t('sources.add')}
        </button>
      </div>

      {adding && <AddSourceModal onClose={() => setAdding(false)} onAdded={(id) => {
        const s = useSources.getState().sources.find((x) => x.id === id)
        if (s) refresh(s)
      }} />}
    </div>
  )
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
         strokeLinecap="round" strokeLinejoin="round"
         style={{ animation: spinning ? 'spin 1.2s linear infinite' : undefined }}>
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 4v5h-5" />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </svg>
  )
}

function AddSourceModal({ onClose, onAdded }: { onClose: () => void; onAdded: (id: string) => void }) {
  const addUrl = useSources((s) => s.addUrl)
  const t = useT()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = () => {
    if (!url.trim()) return
    try { new URL(url.trim()) } catch { alert(t('sources.add.url.invalid')); return }
    const id = addUrl({ name: name.trim() || url.trim(), url: url.trim() })
    onClose()
    onAdded(id)
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal modal--wide">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="modal__title" style={{ flex: 1 }}>{t('sources.add.title')}</div>
          <button className="row__action" onClick={onClose} aria-label={t('edit.close')}><IconX /></button>
        </div>

        <div className="field">
          <span className="field__label">{t('sources.add.name')}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('sources.add.name.hint')} autoFocus />
        </div>

        <div className="field">
          <span className="field__label">{t('sources.url.label')}</span>
          <input
            value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder={t('sources.add.url.hint')}
            type="url"
          />
        </div>

        <div style={{ fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
          {t('sources.add.json')}
          <pre style={{
            margin: '6px 0 0', padding: '8px 10px', borderRadius: 6,
            background: 'var(--bg-2)', fontSize: 11, overflow: 'auto', fontFamily: 'var(--font-mono)',
          }}>
{`{ "todos": [
  { "id": "x1", "title": "Project deadline",
    "deadline": "2026-06-01T18:00:00Z",
    "tags": ["work"], "notes": "**note** ..." }
]}`}
          </pre>
          {t('sources.add.cors')}
        </div>

        <div className="modal__actions">
          <button className="btn" onClick={onClose}>{t('edit.cancel')}</button>
          <button className="btn btn--primary" onClick={submit} disabled={!url.trim()}>{t('sources.add.submit')}</button>
        </div>
      </div>
    </div>
  )
}
