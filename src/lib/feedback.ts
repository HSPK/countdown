import { playSound } from './soundEngine'
import { useFeedbackPrefs } from '../store/feedbackPrefs'

/* Thin façade that reads the current preferences and dispatches to the
   sound + haptics primitives. Components should call this rather than
   touching the sound engine directly so the preference contract stays
   centralized. */

function vibrate(pattern: number | number[]): void {
  if (typeof navigator === 'undefined') return
  if (typeof navigator.vibrate !== 'function') return
  try { navigator.vibrate(pattern) } catch { /* ignore */ }
}

export function triggerSubmitFeedback(): void {
  const { soundEnabled, soundId, vibrationEnabled } = useFeedbackPrefs.getState()
  if (soundEnabled) playSound(soundId)
  if (vibrationEnabled) vibrate(15)
}

export function supportsVibration(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
}
