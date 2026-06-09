import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useT } from '../lib/i18n'
import { RELATIVE_UNITS, type RelativeUnit } from '../lib/chipResolver'
import { SOUND_IDS, playSound, type SoundId } from '../lib/soundEngine'
import type { ReminderConfig } from '../lib/reminders'
import { useEscToClose } from '../hooks/useEscToClose'
import { useSaveShortcut } from '../hooks/useSaveShortcut'
import { HigSwitch } from './HigList'
import { IconX } from './Icons'

const UNIT_MS: Record<RelativeUnit, number> = {
  sec: 1_000,
  min: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
}

/* Convert an arbitrary offset into the largest tidy unit so the form
   starts on something readable (e.g. 3600000 → "1 hour" not "60 minutes"). */
function splitOffset(ms: number): { amount: number; unit: RelativeUnit } {
  if (ms <= 0) return { amount: 0, unit: 'min' }
  const order: RelativeUnit[] = ['week', 'day', 'hour', 'min', 'sec']
  for (const u of order) {
    const v = UNIT_MS[u]
    if (ms >= v && ms % v === 0) return { amount: ms / v, unit: u }
  }
  return { amount: Math.round(ms / 60_000), unit: 'min' }
}

function unitLabel(t: ReturnType<typeof useT>, u: RelativeUnit): string {
  return t(`chips.unit.${u}`)
}
function soundLabel(t: ReturnType<typeof useT>, id: SoundId): string {
  return t(`sound.${id}`)
}

interface Props {
  value: ReminderConfig
  isNew: boolean
  onSave: (next: ReminderConfig) => void
  onClose: () => void
}

export function ReminderEditModal({ value, isNew, onSave, onClose }: Props) {
  const t = useT()
  const initial = splitOffset(value.offsetMs)
  const [amount, setAmount] = useState<number>(initial.amount)
  const [unit, setUnit] = useState<RelativeUnit>(initial.unit)
  const [soundId, setSoundId] = useState<SoundId>(value.soundId)
  const [enabled, setEnabled] = useState<boolean>(value.enabled)

  const offsetMs = Math.max(0, Math.floor(amount)) * UNIT_MS[unit]
  const isDue = amount === 0

  const save = () => {
    onSave({ ...value, offsetMs, soundId, enabled })
    onClose()
  }
  const pickSound = (id: SoundId) => { setSoundId(id); playSound(id) }

  useEscToClose(onClose)
  useSaveShortcut(save)

  return createPortal(
    <div
      className="modal-backdrop modal-backdrop--stacked"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal modal--sheet">
        <header className="modal__header">
          <h2 className="modal__h2">
            {isNew ? t('reminder.add.title') : t('reminder.edit.title')}
          </h2>
          <button className="modal__close" aria-label={t('edit.close')} onClick={onClose}>
            <IconX width={16} height={16} />
          </button>
        </header>

        <div className="modal__body">
          <div className="edit__field">
            <label className="edit__label">{t('reminder.enabled')}</label>
            <HigSwitch checked={enabled} onChange={setEnabled} label={t('reminder.enabled')} />
          </div>

          <div className="edit__field">
            <label className="edit__label">{t('reminder.offset')}</label>
            <div className="chip-time-row">
              <input
                className="edit__input edit__input--narrow"
                type="number"
                min={0}
                step={1}
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
              />
              <div className="edit__segmented edit__segmented--wrap">
                {RELATIVE_UNITS.map((u) => (
                  <button
                    key={u}
                    type="button"
                    className="edit__seg-btn"
                    aria-pressed={unit === u}
                    onClick={() => setUnit(u)}
                    disabled={isDue}
                  >
                    {unitLabel(t, u)}
                  </button>
                ))}
              </div>
            </div>
            <p className="edit__cron-hint">
              {isDue ? t('reminder.at.deadline') : t('reminder.before.deadline')}
            </p>
          </div>

          <div className="edit__field">
            <label className="edit__label">{t('reminder.sound')}</label>
            <div className="sound-picker" role="radiogroup" aria-label={t('reminder.sound')}>
              {SOUND_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={soundId === id}
                  className={'sound-chip' + (soundId === id ? ' sound-chip--active' : '')}
                  onClick={() => pickSound(id)}
                  title={t('feedback.sound.preview')}
                >
                  {soundLabel(t, id)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <footer className="modal__footer">
          <span className="modal__hint">{t('edit.save.hint')}</span>
          <div className="modal__footer-actions">
            <button className="btn" onClick={onClose}>{t('edit.cancel')}</button>
            <button className="btn btn--primary" onClick={save}>{t('edit.save')}</button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
