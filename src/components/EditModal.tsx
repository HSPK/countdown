import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Todo } from '../store/todos'
import { useTodos, type Recurrence } from '../store/todos'
import { DatePicker } from './DatePicker'
import { Markdown } from './Markdown'
import { formatAbsolute } from '../lib/time'
import { IconX, IconChevronDown } from './Icons'

interface Props {
  todo: Todo | null
  onClose: () => void
}

const RECURRENCE_OPTS: Array<{ value: Recurrence; label: string }> = [
  { value: 'none',    label: '不重复' },
  { value: 'daily',   label: '每天' },
  { value: 'weekly',  label: '每周' },
  { value: 'monthly', label: '每月' },
]

export function EditModal({ todo, onClose }: Props) {
  const updateTodo = useTodos((s) => s.updateTodo)
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState<number>(Date.now())
  const [createdAt, setCreatedAt] = useState<number>(Date.now())
  const [notes, setNotes] = useState('')
  const [tagsText, setTagsText] = useState('')
  const [recurrence, setRecurrence] = useState<Recurrence>('none')
  const [showCreatedAt, setShowCreatedAt] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (todo) {
      setTitle(todo.title)
      setDeadline(todo.deadline)
      setCreatedAt(todo.createdAt)
      setNotes(todo.notes ?? '')
      setTagsText(todo.tags.map((t) => `#${t}`).join(' '))
      setRecurrence(todo.recurrence ?? 'none')
      setShowCreatedAt(false)
      setShowPreview(false)
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
    tagsText.split(/[\s,，]+/).map((t) => t.replace(/^#/, '').trim()).filter(Boolean),
  ))

  const save = () => {
    if (!title.trim() || !Number.isFinite(deadline)) return
    updateTodo(todo.id, {
      title: title.trim(),
      deadline,
      createdAt,
      notes: notes.trim() || undefined,
      tags,
      recurrence,
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
          <h2 className="modal__h2">编辑任务</h2>
          <button className="modal__close" aria-label="关闭" onClick={onClose}>
            <IconX width={16} height={16} />
          </button>
        </header>

        <div className="modal__body">

          {/* Title — most prominent */}
          <input
            className="edit__title"
            value={title}
            autoFocus
            placeholder="任务标题"
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Tags + Repeat — side by side on desktop */}
          <div className="edit__grid edit__grid--2">
            <div className="edit__field">
              <label className="edit__label">标签</label>
              <input
                className="edit__input"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="#工作 #学习"
              />
              {tags.length > 0 && (
                <div className="edit__tags-preview">
                  {tags.map((t) => <span key={t} className="tag">#{t}</span>)}
                </div>
              )}
            </div>

            <div className="edit__field">
              <label className="edit__label">重复</label>
              <div className="edit__segmented">
                {RECURRENCE_OPTS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className="edit__seg-btn"
                    aria-pressed={recurrence === opt.value}
                    onClick={() => setRecurrence(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Deadline */}
          <div className="edit__field">
            <label className="edit__label">截止时间</label>
            <div className="edit__picker-wrap">
              <DatePicker value={deadline} onChange={setDeadline} />
            </div>
          </div>

          {/* Created (collapsible) */}
          <div className="edit__field">
            <button
              type="button"
              className="edit__collapsible"
              aria-expanded={showCreatedAt}
              onClick={() => setShowCreatedAt((v) => !v)}
            >
              <span className="edit__collapsible-label">创建时间</span>
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
                <DatePicker value={createdAt} onChange={setCreatedAt} />
              </div>
            )}
          </div>

          {/* Notes — Markdown editor with toggle preview */}
          <div className="edit__field">
            <div className="edit__notes-head">
              <label className="edit__label">备注 · Markdown</label>
              <button
                type="button"
                className="edit__notes-toggle"
                aria-pressed={showPreview}
                onClick={() => setShowPreview((v) => !v)}
              >
                {showPreview ? '隐藏预览' : '显示预览'}
              </button>
            </div>
            {showPreview ? (
              <div className="notes-editor">
                <textarea
                  className="edit__textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="**粗体** *斜体* `代码` - 列表 > 引用"
                />
                <div className="notes-editor__preview">
                  {notes.trim()
                    ? <Markdown source={notes} />
                    : <div className="notes-editor__preview-empty">预览</div>}
                </div>
              </div>
            ) : (
              <textarea
                className="edit__textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="支持 Markdown"
              />
            )}
          </div>

        </div>

        <footer className="modal__footer">
          <span className="modal__hint">⌘ + Enter 保存</span>
          <div className="modal__footer-actions">
            <button className="btn" onClick={onClose}>取消</button>
            <button className="btn btn--primary" onClick={save} disabled={!title.trim()}>保存</button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  )
}