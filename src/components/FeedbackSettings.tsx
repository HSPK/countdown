import { useFeedbackPrefs } from '../store/feedbackPrefs'
import { SOUND_IDS, playSound, type SoundId } from '../lib/soundEngine'
import { supportsVibration } from '../lib/feedback'
import { useT } from '../lib/i18n'
import { HigGroup, HigRow, HigRowToggle } from './HigList'
import { IconBell } from './Icons'

function soundLabel(t: ReturnType<typeof useT>, id: SoundId): string {
  return t(`sound.${id}`)
}

export function FeedbackSettings() {
  const t = useT()
  const soundEnabled = useFeedbackPrefs((s) => s.soundEnabled)
  const soundId = useFeedbackPrefs((s) => s.soundId)
  const vibrationEnabled = useFeedbackPrefs((s) => s.vibrationEnabled)
  const setSoundEnabled = useFeedbackPrefs((s) => s.setSoundEnabled)
  const setSoundId = useFeedbackPrefs((s) => s.setSoundId)
  const setVibrationEnabled = useFeedbackPrefs((s) => s.setVibrationEnabled)

  const hasVibration = supportsVibration()

  /* Always audition the picked sound, regardless of the master toggle —
     lets users compare styles before committing. */
  const onPickSound = (id: SoundId) => {
    setSoundId(id)
    playSound(id)
  }

  return (
    <>
      <HigGroup>
        <HigRowToggle
          icon={<IconBell width={14} height={14} />}
          title={t('feedback.sound')}
          checked={soundEnabled}
          onChange={setSoundEnabled}
        />
        <HigRow
          title={t('feedback.sound.style')}
          trailing={
            <div className="sound-picker" role="radiogroup" aria-label={t('feedback.sound.style')}>
              {SOUND_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={soundId === id}
                  className={'sound-chip' + (soundId === id ? ' sound-chip--active' : '')}
                  onClick={(e) => { e.stopPropagation(); onPickSound(id) }}
                  title={t('feedback.sound.preview')}
                >
                  {soundLabel(t, id)}
                </button>
              ))}
            </div>
          }
        />
      </HigGroup>

      {hasVibration && (
        <HigGroup>
          <HigRowToggle
            icon={<IconBell width={14} height={14} />}
            title={t('feedback.vibration')}
            checked={vibrationEnabled}
            onChange={setVibrationEnabled}
          />
        </HigGroup>
      )}
    </>
  )
}
