import { useState } from 'react'
import { useSources, LOCAL_SOURCE_ID, type Source } from '../store/sources'
import { useTodos } from '../store/todos'
import { refreshSource } from '../lib/subscriptions'
import { formatAbsolute } from '../lib/time'
import { useT } from '../lib/i18n'
import { useEscToClose } from '../hooks/useEscToClose'
import { HigGroup, HigRow } from './HigList'
import { IconTrash, IconPlus, IconX } from './Icons'

type Indicator = 'ok' | 'fetching' | 'err' | 'off'

function indicatorFor(s: Source): Indicator {
  if (!s.enabled) return 'off'
  if (s.type === 'local') return 'ok'
  if (s.status === 'fetching') return 'fetching'
  if (s.status === 'error') return 'err'
  if (s.status === 'ok') return 'ok'
  return 'off'
}

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
  const dropSource = useTodos((s) => s.dropSource)

  const [adding, setAdding] = useState(false)

  return (
    <>
      <HigGroup>
        {sources.map((s) => {
          const count = s.id === LOCAL_SOURCE_ID ? localCount : (counts.get(s.id) ?? 0)
          const indicator = indicatorFor(s)
          const subtitle = s.type === 'local'
            ? t('sources.local.storage')
            : (
              <>
                <span className="source-meta__url">{s.url}</span>
                {s.lastFetched && <> · {t('sources.last.ok', { time: formatAbsolute(s.lastFetched) })}</>}
                {s.status === 'error' && s.lastError && (
                  <span className="source-meta__error"> · {t('sources.last.error', { error: s.lastError })}</span>
                )}
              </>
            )

          return (
            <HigRow
              key={s.id}
              icon={<StatusDot indicator={indicator} />}
              title={
                <span className="source-title">
                  <span>{s.name}</span>
                  <span className="source-title__count">{t('sources.count', { count })}</span>
                </span>
              }
              subtitle={subtitle}
              trailing={s.type === 'url' && (
                <div className="hig-icon-cluster" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="hig-icon-btn"
                    title={s.enabled ? t('sources.disable') : t('sources.enable')}
                    aria-label={t('sources.toggle')}
                    onClick={() => toggle(s.id)}
                  >
                    {s.enabled ? <IconCircle /> : <IconCircleFill />}
                  </button>
                  <button
                    type="button"
                    className="hig-icon-btn"
                    title={t('sources.refresh.now')}
                    aria-label={t('sources.refresh')}
                    disabled={s.status === 'fetching'}
                    onClick={() => refreshSource(s)}
                  >
                    <RefreshIcon spinning={s.status === 'fetching'} />
                  </button>
                  <button
                    type="button"
                    className="hig-icon-btn hig-icon-btn--danger"
                    title={t('sources.delete')}
                    aria-label={t('sources.delete')}
                    onClick={() => {
                      if (confirm(t('sources.delete.confirm', { name: s.name, count }))) {
                        dropSource(s.id)
                        remove(s.id)
                      }
                    }}
                  >
                    <IconTrash width={14} height={14} />
                  </button>
                </div>
              )}
            />
          )
        })}
        <HigRow
          icon={
            <span className="hig-row__add-icon">
              <IconPlus width={12} height={12} />
            </span>
          }
          title={<span className="hig-row__add-label">{t('sources.add')}</span>}
          onPress={() => setAdding(true)}
        />
      </HigGroup>

      {adding && <AddSourceModal onClose={() => setAdding(false)} onAdded={(id) => {
        const s = useSources.getState().sources.find((x) => x.id === id)
        if (s) refreshSource(s)
      }} />}
    </>
  )
}

function StatusDot({ indicator }: { indicator: Indicator }) {
  return <span className={`status-dot status-dot--${indicator}`} aria-hidden />
}

function IconCircle() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="8" />
    </svg>
  )
}
function IconCircleFill() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="8" />
    </svg>
  )
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
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

  useEscToClose(onClose)

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
