import { useState } from 'react'
import { useT } from '../lib/i18n'
import {
  DEFAULT_REMINDERS,
  defaultReminders,
  formatReminderOffset,
  newReminderConfig,
  type ReminderConfig,
} from '../lib/reminders'
import { HigGroup, HigRow, HigSwitch } from './HigList'
import { ReminderEditModal } from './ReminderEditModal'
import { IconPlus, IconTrash } from './Icons'

interface Props {
  value: ReminderConfig[] | undefined
  onChange: (next: ReminderConfig[] | undefined) => void
}

/* List + add/edit/remove UI for a todo's reminders. When `value` is
   undefined the todo inherits DEFAULT_REMINDERS at notify time — the
   editor shows them so the user can see what fires by default. As soon
   as the user mutates anything, we switch to an explicit list. */
export function RemindersField({ value, onChange }: Props) {
  const t = useT()
  const isDefault = value === undefined
  const reminders = value ?? DEFAULT_REMINDERS

  const [editing, setEditing] = useState<{ value: ReminderConfig; isNew: boolean } | null>(null)

  const replaceList = (next: ReminderConfig[]) => onChange(next)
  const becomeCustom = (): ReminderConfig[] =>
    isDefault ? defaultReminders() : reminders.map((r) => ({ ...r }))

  const toggleOne = (id: string, enabled: boolean) => {
    const base = becomeCustom()
    replaceList(base.map((r) => (r.id === id ? { ...r, enabled } : r)))
  }
  const removeOne = (id: string) => {
    const base = becomeCustom()
    replaceList(base.filter((r) => r.id !== id))
  }
  const saveEdited = (next: ReminderConfig) => {
    const base = becomeCustom()
    if (editing?.isNew) replaceList([...base, next])
    else replaceList(base.map((r) => (r.id === next.id ? next : r)))
  }
  const resetToDefault = () => onChange(undefined)

  return (
    <div className="edit__field">
      <div className="edit__notes-head">
        <label className="edit__label">{t('reminder.section')}</label>
        {!isDefault && (
          <button
            type="button"
            className="edit__notes-toggle"
            onClick={resetToDefault}
            title={t('reminder.reset.hint')}
          >
            {t('reminder.reset')}
          </button>
        )}
      </div>

      <HigGroup>
        {reminders.map((r) => (
          <HigRow
            key={r.id}
            icon={
              <HigSwitch
                checked={r.enabled}
                onChange={(v) => toggleOne(r.id, v)}
                label={formatReminderOffset(r.offsetMs, t)}
              />
            }
            title={formatReminderOffset(r.offsetMs, t)}
            subtitle={t(`sound.${r.soundId}`)}
            trailing={
              <button
                type="button"
                className="hig-icon-btn hig-icon-btn--danger"
                aria-label={t('chips.delete')}
                title={t('chips.delete')}
                onClick={(e) => { e.stopPropagation(); removeOne(r.id) }}
              >
                <IconTrash width={14} height={14} />
              </button>
            }
            onPress={() => setEditing({ value: { ...r }, isNew: false })}
          />
        ))}
        <HigRow
          icon={
            <span className="hig-row__add-icon">
              <IconPlus width={12} height={12} />
            </span>
          }
          title={<span className="hig-row__add-label">{t('reminder.add')}</span>}
          onPress={() => setEditing({ value: newReminderConfig(), isNew: true })}
        />
      </HigGroup>

      {isDefault && (
        <p className="edit__cron-hint">{t('reminder.using.defaults')}</p>
      )}

      {editing && (
        <ReminderEditModal
          value={editing.value}
          isNew={editing.isNew}
          onSave={saveEdited}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
