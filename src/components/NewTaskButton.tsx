import { useT } from '../lib/i18n'
import { IconPlus } from './Icons'

interface Props {
  onPress: () => void
}

/* Floating action button (FAB) for adding a new task. Sits at the
   bottom-right above the safe area, never competes with the TabBar for
   visual weight. Apple Calendar / Things pattern. */
export function NewTaskButton({ onPress }: Props) {
  const t = useT()
  return (
    <button
      type="button"
      className="fab"
      onClick={onPress}
      aria-label={t('composer.add')}
      title={t('composer.add.hint')}
    >
      <IconPlus width={22} height={22} />
    </button>
  )
}
