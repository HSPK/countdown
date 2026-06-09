import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Todo } from '../store/todos'
import { useTodos, type Recurrence } from '../store/todos'
import type { ReminderConfig } from '../lib/reminders'
import { WheelPicker } from './WheelPicker'
import { Collapsible } from './Collapsible'
import { MarkdownEditor } from './MarkdownEditor'
import { RecurrenceField } from './RecurrenceField'
import { RemindersField } from './RemindersField'
import { formatAbsolute } from '../lib/time'
import { validateTodoEdit } from '../lib/editValidation'
import { useT } from '../lib/i18n'
import { useEscToClose } from '../hooks/useEscToClose'
import { useSaveShortcut } from '../hooks/useSaveShortcut'
import { IconX } from './Icons'

interface Props {
  todo: Todo | null
  onClose: () => void
}

function parseTagsText(text: string): string[] {
  return Array.from(new Set(
    text.split(/[\s,，]+/).map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean),
  ))
}

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
  const [reminders, setReminders] = useState<ReminderConfig[] | undefined>(undefined)
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false)
  const [showCreatedAt, setShowCreatedAt] = useState(false)

  useEffect(() => {
    if (!todo) return
    setTitle(todo.title)
    setDeadline(todo.deadline)
    setCreatedAt(todo.createdAt)
    setNotes(todo.notes ?? '')
    setTagsText(todo.tags.map((tag) => `#${tag}`).join(' '))
    setRecurrence(todo.recurrence ?? 'none')
    setCronExpr(todo.cronExpr ?? '')
    setReminders(todo.reminders)
    setShowDeadlinePicker(false)
    setShowCreatedAt(false)
  }, [todo])

  const tags = parseTagsText(tagsText)
  const validation = validateTodoEdit({ title, deadline, recurrence, cronExpr })

  const save = () => {
    if (!todo || !validation.ok) return
    updateTodo(todo.id, {
      title: title.trim(),
      deadline,
      createdAt,
      notes: notes.trim() || undefined,
      tags,
      recurrence,
      cronExpr: recurrence === 'custom' ? cronExpr.trim() : undefined,
      reminders,
    })
    onClose()
  }

  const open = !!todo
  useEscToClose(onClose, open)
  useSaveShortcut(save, open)

  if (!todo) return null

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

          <input
            className="edit__title"
            value={title}
            placeholder={t('edit.title.input')}
            onChange={(e) => setTitle(e.target.value)}
          />

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

            <RecurrenceField
              recurrence={recurrence}
              cronExpr={cronExpr}
              onRecurrenceChange={setRecurrence}
              onCronChange={setCronExpr}
            />
          </div>

          <div className="hig-group">
            <Collapsible
              label={t('edit.deadline')}
              value={formatAbsolute(deadline)}
              open={showDeadlinePicker}
              onToggle={() => setShowDeadlinePicker((v) => !v)}
            >
              <WheelPicker value={deadline} onChange={setDeadline} />
            </Collapsible>
            <Collapsible
              label={t('edit.created')}
              value={formatAbsolute(createdAt)}
              open={showCreatedAt}
              onToggle={() => setShowCreatedAt((v) => !v)}
            >
              <WheelPicker value={createdAt} onChange={setCreatedAt} />
            </Collapsible>
          </div>

          <MarkdownEditor
            label={t('edit.notes')}
            value={notes}
            onChange={setNotes}
            placeholder={t('edit.notes.placeholder')}
            emptyLabel={t('edit.notes.empty')}
          />

          <RemindersField value={reminders} onChange={setReminders} />

        </div>

        <footer className="modal__footer">
          <span className="modal__hint">{t('edit.save.hint')}</span>
          <div className="modal__footer-actions">
            <button className="btn" onClick={onClose}>{t('edit.cancel')}</button>
            <button className="btn btn--primary" onClick={save} disabled={!validation.ok}>
              {t('edit.save')}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
