/* Pure Web Audio synthesis. No store / no prefs / no React knowledge —
   callers decide whether to play and which sound. AudioContext is lazy
   so the module is safe to import on the server / before a user gesture. */

export type SoundId = 'none' | 'pop' | 'chime' | 'tick' | 'whoosh'

export const SOUND_IDS: SoundId[] = ['none', 'pop', 'chime', 'tick', 'whoosh']

interface WebkitWindow {
  webkitAudioContext?: typeof AudioContext
}

let ctx: AudioContext | null = null
function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  }
  const Ctor = window.AudioContext ?? (window as unknown as WebkitWindow).webkitAudioContext
  if (!Ctor) return null
  try { ctx = new Ctor() } catch { return null }
  return ctx
}

function tone(
  c: AudioContext,
  type: OscillatorType,
  freq: number,
  start: number,
  duration: number,
  peak: number,
  freqEnd?: number,
): void {
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), start + duration)
  }
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(peak, start + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(c.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

function noise(c: AudioContext, start: number, duration: number, peak: number): void {
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * duration), c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(2200, start)
  filter.frequency.exponentialRampToValueAtTime(220, start + duration)
  const gain = c.createGain()
  gain.gain.setValueAtTime(peak, start)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  src.connect(filter).connect(gain).connect(c.destination)
  src.start(start)
  src.stop(start + duration + 0.02)
}

export function playSound(id: SoundId): void {
  if (id === 'none') return
  const c = getCtx()
  if (!c) return
  const t0 = c.currentTime + 0.005
  switch (id) {
    case 'pop':
      tone(c, 'sine', 820, t0, 0.15, 0.22, 240)
      break
    case 'chime':
      tone(c, 'sine', 523.25, t0,        0.42, 0.16)
      tone(c, 'sine', 659.25, t0 + 0.08, 0.42, 0.14)
      break
    case 'tick':
      tone(c, 'triangle', 1600, t0, 0.05, 0.20)
      break
    case 'whoosh':
      noise(c, t0, 0.32, 0.18)
      break
  }
}
