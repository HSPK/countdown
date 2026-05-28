import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Todo } from '../store/todos'
import { useTodos, type Recurrence } from '../store/todos'
import { WheelPicker } from './WheelPicker'
import { Markdown } from './Markdown'
import { formatAbsolute } from '../lib/time'
import { parseCron } from '../lib/recurrence'
import { useT } from '../lib/i18n'
import { IconX, IconChevronDown } from './Icons'

interface Props {
  todo: Todo | null
  onClose: () => void
}

const RECURRENCE_OPTS: Array<{ value: Recurrence; labelKey: string }> = [
  { value: 'none',    labelKey: 'recurrence.none' },
  { value: 'daily',   labelKey: 'recurrence.daily' },
  { value: 'weekly',  labelKey: 'recurrence.weekly' },
  { value: 'monthly', labelKey: 'recurrence.monthly' },
  { value: 'custom',  labelKey: 'recurrence.custom' },
]

export function EditModal({ todo, onClose }: Props) {
  const updateTodo = useTodos((s) => s.updateTodo)
  const t = useT()
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState<number>(Date.now())
  const [createdAt, setCreatedAt] = useState<number>(Date.now())
  const [notes, setNotes] = useState('')
  const [tagsText, setTagsText] = useState('')
  const [recurrence, setRecurrence] = useState<Recurrence>('none')
  const [cronExpr, setCronExpr] = useState('')
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false)
  const [showCreatedAt, setShowCreatedAt] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    if (todo) {
      setTitle(todo.title)
      setDeadline(todo.deadline)
      setCreatedAt(todo.createdAt)
      setNotes(todo.notes ?? '')
      setTagsText(todo.tags.map((t) => `#${t}`).join(' '))
      setRecurrence(todo.recurrence ?? 'none')
      setCronExpr(todo.cronExpr ?? '')
      setShowDeadlinePicker(false)
      setShowCreatedAt(false)
      setPreviewMode(false)
    }
  }, [todo])

  useEffect(() => {
    if (!todo) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        save()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todo, onClose, title, deadline, createdAt, notes, tagsText, recurrence])

  if (!todo) return null

  const tags = Array.from(new Set(
    tagsText.split(/[\s,，]+/).map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean),
  ))

  const cronValid = recurrence !== 'custom' || (cronExpr.trim() !== '' && parseCron(cronExpr.trim()) !== null)

  const save = () => {
    if (!title.trim() || !Number.isFinite(deadline)) return
    if (!cronValid) return
    updateTodo(todo.id, {
      title: title.trim(),
      deadline,
      createdAt,
      notes: notes.trim() || undefined,
      tags,
      recurrence,
      cronExpr: recurrence === 'custom' ? cronExpr.trim() : undefined,
    })
    onClose()
  }

  return createPortal(
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal modal--edit">
        <header className="modal__header">
          <h2 className="modal__h2">{t('edit.title')}</h2>
          <button className="modal__close" aria-label={t('edit.close')} onClick={onClose}>
            <IconX width={16} height={16} />
          </button>
        </header>

        <div className="modal__body">

          {/* Title — most prominent */}
          <input
            className="edit__title"
            value={title}
            placeholder={t('edit.title.input')}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Tags + Repeat — side by side on desktop */}
          <div className="edit__grid edit__grid--2">
            <div className="edit__field">
              <label className="edit__label">{t('edit.tags')}</label>
              <input
                className="edit__input"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder={t('edit.tags.hint')}
              />
              {tags.length > 0 && (
                <div className="edit__tags-preview">
                  {tags.map((tag) => <span key={tag} className="tag">#{tag}</span>)}
                </div>
              )}
            </div>

            <div className="edit__field">
              <label className="edit__label">{t('edit.repeat')}</label>
              <div className="edit__segmented">
                {RECURRENCE_OPTS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className="edit__seg-btn"
                    aria-pressed={recurrence === opt.value}
                    onClick={() => setRecurrence(opt.value)}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>
              {recurrence === 'custom' && (
                <div className="edit__cron">
                  <input
                    className={'edit__input edit__cron-input' + (cronValid ? '' : ' edit__cron-input--invalid')}
                    value={cronExpr}
                    onChange={(e) => setCronExpr(e.target.value)}
                    placeholder="0 9 * * 1-5"
                    aria-label="cron expression"
                    spellCheck={false}
                  />
                  <p
                    className="edit__cron-hint"
                    dangerouslySetInnerHTML={{ __html: t('edit.cron.hint') }}
                  />
                  {!cronValid && cronExpr.trim() !== '' && (
                    <p className="edit__cron-error">{t('edit.cron.invalid')}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Deadline (collapsible, default closed) */}
          <div className="edit__field">
            <button
              type="button"
              className="edit__collapsible"
              aria-expanded={showDeadlinePicker}
              onClick={() => setShowDeadlinePicker((v) => !v)}
            >
              <span className="edit__collapsible-label">{t('edit.deadline')}</span>
              <span className="edit__collapsible-value">{formatAbsolute(deadline)}</span>
              <IconChevronDown
                width={14} height={14}
                style={{
                  transform: showDeadlinePicker ? 'rotate(180deg)' : 'none',
                  transition: 'transform 200ms',
                  color: 'var(--fg-muted)',
                }}
              />
            </button>
            {showDeadlinePicker && (
              <div className="edit__picker-wrap">
                <WheelPicker value={deadline} onChange={setDeadline} />
              </div>
            )}
          </div>

          {/* Created (collapsible) */}
          <div className="edit__field">
            <button
              type="button"
              className="edit__collapsible"
              aria-expanded={showCreatedAt}
              onClick={() => setShowCreatedAt((v) => !v)}
            >
              <span className="edit__collapsible-label">{t('edit.created')}</span>
              <span className="edit__collapsible-value">{formatAbsolute(createdAt)}</span>
              <IconChevronDown
                width={14} height={14}
                style={{
                  transform: showCreatedAt ? 'rotate(180deg)' : 'none',
                  transition: 'transform 200ms',
                  color: 'var(--fg-muted)',
                }}
              />
            </button>
            {showCreatedAt && (
              <div className="edit__picker-wrap">
                <WheelPicker value={createdAt} onChange={setCreatedAt} />
              </div>
            )}
          </div>

          {/* Notes — Markdown editor that toggles between edit and preview */}
          <div className="edit__field">
            <div className="edit__notes-head">
              <label className="edit__label">{t('edit.notes')}</label>
              <button
                type="button"
                className="edit__notes-toggle"
                aria-pressed={previewMode}
                onClick={() => setPreviewMode((v) => !v)}
                title={previewMode ? t('edit.notes.editor') : t('edit.notes.preview')}
              >
                {previewMode ? t('edit.notes.editor') : t('edit.notes.preview')}
              </button>
            </div>
            {previewMode ? (
              <div className="edit__notes-preview">
                {notes.trim()
                  ? <Markdown source={notes} />
                  : <div className="edit__notes-preview-empty">{t('edit.notes.empty')}</div>}
              </div>
            ) : (
              <textarea
                className="edit__textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                placeholder={t('edit.notes.placeholder')}
              />
            )}
          </div>

        </div>

        <footer className="modal__footer">
          <span className="modal__hint">{t('edit.save.hint')}</span>
          <div className="modal__footer-actions">
            <button className="btn" onClick={onClose}>{t('edit.cancel')}</button>
            <button className="btn btn--primary" onClick={save} disabled={!title.trim() || !cronValid}>{t('edit.save')}</button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  )
}