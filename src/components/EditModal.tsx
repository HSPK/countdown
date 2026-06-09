import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Todo } from '../store/todos'
import { useTodos, type Recurrence } from '../store/todos'
import type { ReminderConfig } from '../lib/reminders'
import { DateTimePicker } from './DateTimePicker'
import { Collapsible } from './Collapsible'
import { MarkdownEditor } from './MarkdownEditor'
import { RecurrenceField } from './RecurrenceField'
import { RemindersField } from './RemindersField'
import { formatAbsolute } from '../lib/time'
import { validateTodoEdit } from '../lib/editValidation'
import { useT } from '../lib/i18n'
import { useEscToClose } from '../hooks/useEscToClose'
import { useSaveShortcut } from '../hooks/useSaveShortcut'
import { IconTrash, IconX } from './Icons'

interface Props {
  todo: Todo | null
  onClose: () => void
}

type EditTab = 'details' | 'reminders'

function parseTagsText(text: string): string[] {
  return Array.from(new Set(
    text.split(/[\s,，]+/).map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean),
  ))
}

function recurrenceShort(r: Recurrence, t: ReturnType<typeof useT>): string {
  if (!r || r === 'none') return t('recurrence.none')
  return t(`recurrence.${r}`)
}

export function EditModal({ todo, onClose }: Props) {
  const updateTodo = useTodos((s) => s.updateTodo)
  const removeTodo = useTodos((s) => s.removeTodo)
  const t = useT()
  const [tab, setTab] = useState<EditTab>('details')
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState<number>(Date.now())
  const [createdAt, setCreatedAt] = useState<number>(Date.now())
  const [notes, setNotes] = useState('')
  const [tagsText, setTagsText] = useState('')
  const [recurrence, setRecurrence] = useState<Recurrence>('none')
  const [cronExpr, setCronExpr] = useState('')
  const [reminders, setReminders] = useState<ReminderConfig[] | undefined>(undefined)
  const [showRepeat, setShowRepeat] = useState(false)
  const [showTags, setShowTags] = useState(false)
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false)
  const [showCreatedAt, setShowCreatedAt] = useState(false)

  useEffect(() => {
    if (!todo) return
    setTab('details')
    setTitle(todo.title)
    setDeadline(todo.deadline)
    setCreatedAt(todo.createdAt)
    setNotes(todo.notes ?? '')
    setTagsText(todo.tags.map((tag) => `#${tag}`).join(' '))
    setRecurrence(todo.recurrence ?? 'none')
    setCronExpr(todo.cronExpr ?? '')
    setReminders(todo.reminders)
    setShowRepeat(false)
    setShowTags(false)
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

  const onDelete = () => {
    if (confirm(t('row.delete.confirm', { title: todo.title }))) {
      removeTodo(todo.id)
      onClose()
    }
  }

  const tagsSummary = tags.length
    ? tags.slice(0, 4).map((tag) => `#${tag}`).join(' ') + (tags.length > 4 ? ' …' : '')
    : t('edit.tags.empty')

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

        <div className="em-tabs" role="tablist" aria-label={t('edit.title')}>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'details'}
            className={'em-tabs__tab' + (tab === 'details' ? ' em-tabs__tab--active' : '')}
            onClick={() => setTab('details')}
          >
            {t('edit.tab.details')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'reminders'}
            className={'em-tabs__tab' + (tab === 'reminders' ? ' em-tabs__tab--active' : '')}
            onClick={() => setTab('reminders')}
          >
            {t('edit.tab.reminders')}
          </button>
        </div>

        <div className="modal__body">
          {tab === 'details' ? (
            <>
              <input
                className="edit__title-clean"
                value={title}
                placeholder={t('edit.title.input')}
                onChange={(e) => setTitle(e.target.value)}
              />

              <textarea
                className="edit__notes-clean"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={notes ? 4 : 2}
                placeholder={t('edit.notes.placeholder')}
              />

              <div className="hig-group">
                <Collapsible
                  label={t('edit.tags')}
                  value={tagsSummary}
                  open={showTags}
                  onToggle={() => setShowTags((v) => !v)}
                >
                  <div className="edit__inline">
                    <input
                      className="edit__input"
                      value={tagsText}
                      onChange={(e) => setTagsText(e.target.value)}
                      placeholder={t('edit.tags.hint')}
                      autoFocus
                    />
                    {tags.length > 0 && (
                      <div className="edit__tags-preview">
                        {tags.map((tag) => <span key={tag} className="tag">#{tag}</span>)}
                      </div>
                    )}
                  </div>
                </Collapsible>
                <Collapsible
                  label={t('edit.repeat')}
                  value={recurrenceShort(recurrence, t)}
                  open={showRepeat}
                  onToggle={() => setShowRepeat((v) => !v)}
                >
                  <div className="edit__inline">
                    <RecurrenceField
                      recurrence={recurrence}
                      cronExpr={cronExpr}
                      onRecurrenceChange={setRecurrence}
                      onCronChange={setCronExpr}
                    />
                  </div>
                </Collapsible>
                <Collapsible
                  label={t('edit.deadline')}
                  value={formatAbsolute(deadline)}
                  open={showDeadlinePicker}
                  onToggle={() => setShowDeadlinePicker((v) => !v)}
                >
                  <DateTimePicker value={deadline} onChange={setDeadline} />
                </Collapsible>
                <Collapsible
                  label={t('edit.created')}
                  value={formatAbsolute(createdAt)}
                  open={showCreatedAt}
                  onToggle={() => setShowCreatedAt((v) => !v)}
                >
                  <DateTimePicker value={createdAt} onChange={setCreatedAt} />
                </Collapsible>
              </div>

              {notes.trim() && (
                <MarkdownEditor
                  label={t('edit.notes.preview')}
                  value={notes}
                  onChange={setNotes}
                  placeholder={t('edit.notes.placeholder')}
                  emptyLabel={t('edit.notes.empty')}
                />
              )}

              <button
                type="button"
                className="edit__delete"
                onClick={onDelete}
              >
                <IconTrash width={14} height={14} />
                <span>{t('edit.delete')}</span>
              </button>
            </>
          ) : (
            <RemindersField value={reminders} onChange={setReminders} />
          )}
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
