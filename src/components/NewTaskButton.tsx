import { useT } from '../lib/i18n'
import { IconPlus } from './Icons'

interface Props {
  onPress: () => void
}

/* Primary "+ New task" action that lives in the bottom dock. Replaces
   the old hover-expand composer pill. Single clear tap target. */
export function NewTaskButton({ onPress }: Props) {
  const t = useT()
  return (
    <button
      type="button"
      className="new-task-btn"
      onClick={onPress}
      aria-label={t('composer.add')}
      title={t('composer.add.hint')}
    >
      <span className="new-task-btn__icon" aria-hidden>
        <IconPlus width={14} height={14} />
      </span>
      <span className="new-task-btn__label">{t('composer.button.label')}</span>
    </button>
  )
}
