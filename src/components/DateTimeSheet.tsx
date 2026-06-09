import { useState } from 'react'
import { createPortal } from 'react-dom'
import { DateTimePicker } from './DateTimePicker'
import { useT } from '../lib/i18n'
import { useEscToClose } from '../hooks/useEscToClose'
import { useSaveShortcut } from '../hooks/useSaveShortcut'
import { IconX } from './Icons'

interface Props {
  value: number
  onSave: (ts: number) => void
  onClose: () => void
}

/* Stacked modal that hosts the full DateTimePicker. Used by the
   ComposerSheet so picking a custom date doesn't bloat the compose
   form. Mirrors Apple Calendar's "tap a date row → sheet" pattern. */
export function DateTimeSheet({ value, onSave, onClose }: Props) {
  const t = useT()
  const [ts, setTs] = useState<number>(value)

  const save = () => { onSave(ts); onClose() }
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
          <h2 className="modal__h2">{t('composer.custom.abs')}</h2>
          <button className="modal__close" aria-label={t('edit.close')} onClick={onClose}>
            <IconX width={16} height={16} />
          </button>
        </header>

        <div className="modal__body modal__body--no-pad">
          <DateTimePicker value={ts} onChange={setTs} />
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
