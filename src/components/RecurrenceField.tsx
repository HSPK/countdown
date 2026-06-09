import { parseCron } from '../lib/recurrence'
import { useT } from '../lib/i18n'
import type { Recurrence } from '../store/todos'

const RECURRENCE_OPTS: Array<{ value: Recurrence; labelKey: string }> = [
  { value: 'none',    labelKey: 'recurrence.none' },
  { value: 'daily',   labelKey: 'recurrence.daily' },
  { value: 'weekly',  labelKey: 'recurrence.weekly' },
  { value: 'monthly', labelKey: 'recurrence.monthly' },
  { value: 'custom',  labelKey: 'recurrence.custom' },
]

/* Recurrence segmented control + cron sub-field. Owns nothing it doesn't
   need to: cron expression is only meaningful when recurrence is 'custom',
   but we keep both controlled by the parent so saving stays atomic. */
export function RecurrenceField({
  recurrence, cronExpr, onRecurrenceChange, onCronChange,
}: {
  recurrence: Recurrence
  cronExpr: string
  onRecurrenceChange: (v: Recurrence) => void
  onCronChange: (v: string) => void
}) {
  const t = useT()
  const showCron = recurrence === 'custom'
  const cronValid = !showCron || (cronExpr.trim() !== '' && parseCron(cronExpr.trim()) !== null)

  return (
    <div className="edit__field">
      <label className="edit__label">{t('edit.repeat')}</label>
      <div className="edit__segmented">
        {RECURRENCE_OPTS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className="edit__seg-btn"
            aria-pressed={recurrence === opt.value}
            onClick={() => onRecurrenceChange(opt.value)}
          >
            {t(opt.labelKey)}
          </button>
        ))}
      </div>
      {showCron && (
        <div className="edit__cron">
          <input
            className={'edit__input edit__cron-input' + (cronValid ? '' : ' edit__cron-input--invalid')}
            value={cronExpr}
            onChange={(e) => onCronChange(e.target.value)}
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
  )
}
