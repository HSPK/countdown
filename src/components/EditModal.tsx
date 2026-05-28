import { useEffect, useState } from 'react'
import type { Todo } from '../store/todos'
import { useTodos, type Recurrence } from '../store/todos'
import { DatePicker } from './DatePicker'
import { Markdown } from './Markdown'
import { formatAbsolute } from '../lib/time'

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
  const [showPreview, setShowPreview] = useState(true)

  useEffect(() => {
    if (todo) {
      setTitle(todo.title)
      setDeadline(todo.deadline)
      setCreatedAt(todo.createdAt)
      setNotes(todo.notes ?? '')
      setTagsText(todo.tags.map((t) => `#${t}`).join(' '))
      setRecurrence(todo.recurrence ?? 'none')
      setShowCreatedAt(false)
      setShowPreview(!!todo.notes)
    }
  }, [todo])

  useEffect(() => {
    if (!todo) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [todo, onClose])

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

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal modal--wide">
        <div className="modal__title">编辑任务</div>

        <div className="field">
          <span className="field__label">Title</span>
          <input value={title} autoFocus onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="field">
          <span className="field__label">Tags</span>
          <input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="#工作 #学习  ·  空格或逗号分隔"
          />
          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
              {tags.map((t) => <span key={t} className="tag">#{t}</span>)}
            </div>
          )}
        </div>

        <div className="field">
          <span className="field__label">Repeat · 重复</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {RECURRENCE_OPTS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className="tag tag--filter"
                aria-pressed={recurrence === opt.value}
                onClick={() => setRecurrence(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field__label">Deadline · 截止时间</span>
          <DatePicker value={deadline} onChange={setDeadline} />
        </div>

        <div className="field">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="field__label" style={{ margin: 0 }}>Created · 创建时间</span>
            <button
              type="button"
              className="list__head-btn"
              onClick={() => setShowCreatedAt((v) => !v)}
            >
              {showCreatedAt ? '收起' : '编辑'}
            </button>
            {!showCreatedAt && (
              <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
                {formatAbsolute(createdAt)}
              </span>
            )}
          </div>
          {showCreatedAt && (
            <DatePicker value={createdAt} onChange={setCreatedAt} />
          )}
        </div>

        <div className="field">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="field__label" style={{ margin: 0 }}>Notes · Markdown</span>
            <button
              type="button"
              className="list__head-btn"
              onClick={() => setShowPreview((v) => !v)}
            >
              {showPreview ? '隐藏预览' : '显示预览'}
            </button>
          </div>
          {showPreview ? (
            <div className="notes-editor">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="支持 Markdown · **粗体** *斜体* `代码` - 列表 > 引用"
              />
              <div className="notes-editor__preview">
                {notes.trim()
                  ? <Markdown source={notes} />
                  : <div className="notes-editor__preview-empty">预览</div>}
              </div>
            </div>
          ) : (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              style={{
                padding: '10px 12px', borderRadius: 'var(--radius-soft)',
                border: '1px solid var(--hairline-strong)', background: 'transparent',
                outline: 'none', resize: 'vertical', color: 'var(--fg)',
                fontFamily: 'var(--font-mono)', fontSize: 12.5,
              }}
              placeholder="支持 Markdown"
            />
          )}
        </div>

        <div className="modal__actions">
          <button className="btn" onClick={onClose}>取消</button>
          <button className="btn btn--primary" onClick={save} disabled={!title.trim()}>保存</button>
        </div>
      </div>
    </div>
  )
}