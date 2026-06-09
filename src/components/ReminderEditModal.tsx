import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useT } from '../lib/i18n'
import { RELATIVE_UNITS, type RelativeUnit } from '../lib/chipResolver'
import { SOUND_IDS, playSound, type SoundId } from '../lib/soundEngine'
import type { ReminderConfig } from '../lib/reminders'
import { useEscToClose } from '../hooks/useEscToClose'
import { useSaveShortcut } from '../hooks/useSaveShortcut'
import { HigGroup, HigRow, HigRowToggle } from './HigList'
import { Stepper } from './Stepper'
import { IconBell, IconClock, IconX } from './Icons'

const UNIT_MS: Record<RelativeUnit, number> = {
  sec: 1_000,
  min: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
}

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

const UNIT_MAX: Record<RelativeUnit, number> = {
  sec: 59, min: 59, hour: 23, day: 30, week: 12,
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

          {/* Group 1: enable + offset */}
          <HigGroup>
            <HigRowToggle
              icon={<IconBell width={14} height={14} />}
              title={t('reminder.enabled')}
              checked={enabled}
              onChange={setEnabled}
            />
            <HigRow
              icon={<IconClock width={14} height={14} />}
              title={t('reminder.offset')}
              subtitle={amount === 0 ? t('reminder.at.deadline') : t('reminder.before.deadline')}
              trailing={
                <div className="reminder-offset" onClick={(e) => e.stopPropagation()}>
                  <Stepper
                    value={amount}
                    max={UNIT_MAX[unit]}
                    onChange={setAmount}
                    ariaLabel={t('reminder.offset')}
                    pad={false}
                  />
                  <div className="reminder-unit" role="radiogroup" aria-label={t('chips.unit')}>
                    {RELATIVE_UNITS.map((u) => (
                      <button
                        key={u}
                        type="button"
                        role="radio"
                        aria-checked={unit === u}
                        className={'reminder-unit__btn' + (unit === u ? ' reminder-unit__btn--active' : '')}
                        onClick={() => setUnit(u)}
                      >
                        {unitLabel(t, u)}
                      </button>
                    ))}
                  </div>
                </div>
              }
            />
          </HigGroup>

          {/* Group 2: sound */}
          <HigGroup>
            {SOUND_IDS.map((id) => (
              <button
                key={id}
                type="button"
                className={'sound-row' + (soundId === id ? ' sound-row--active' : '')}
                onClick={() => pickSound(id)}
                aria-checked={soundId === id}
                role="radio"
              >
                <span className="sound-row__name">{soundLabel(t, id)}</span>
                <span className="sound-row__check" aria-hidden>
                  {soundId === id && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  )}
                </span>
              </button>
            ))}
          </HigGroup>

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
