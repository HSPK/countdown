import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTodos } from '../store/todos'
import {
  defaultAbsolutePresets,
  defaultRelativePresets,
  resolveAbsolute,
  type AbsolutePreset,
  type RelativePreset,
} from '../lib/chipResolver'
import {
  defaultChoice,
  extractTags,
  flushPending,
  resolveDeadline,
  type Choice,
} from '../lib/composerInput'
import { triggerSubmitFeedback } from '../lib/feedback'
import { useT } from '../lib/i18n'
import { formatHM } from '../lib/time'
import { useEscToClose } from '../hooks/useEscToClose'
import { useSaveShortcut } from '../hooks/useSaveShortcut'
import { DateTimePicker } from './DateTimePicker'
import { RelativeDurationPicker } from './RelativeDurationPicker'
import { IconX, IconCalendar } from './Icons'

interface Props {
  open: boolean
  onClose: () => void
}

const RELATIVE_PRESETS: RelativePreset[] = defaultRelativePresets()
const ABSOLUTE_PRESETS: AbsolutePreset[] = defaultAbsolutePresets()

function chipLabel(t: ReturnType<typeof useT>, p: { labelKey?: string; label: string }): string {
  return p.labelKey ? t(p.labelKey) : p.label
}

const HOUR_MS = 3_600_000
const DAY_MS = 24 * HOUR_MS

function formatRelLabel(t: ReturnType<typeof useT>, offsetMs: number): string {
  if (offsetMs <= 0) return '+0' + t('chips.unit.min.short')
  const d = Math.floor(offsetMs / DAY_MS)
  const h = Math.floor((offsetMs % DAY_MS) / HOUR_MS)
  const m = Math.floor((offsetMs % HOUR_MS) / 60_000)
  const parts: string[] = []
  if (d) parts.push(`${d}${t('chips.unit.day.short')}`)
  if (h) parts.push(`${h}${t('chips.unit.hour.short')}`)
  if (m) parts.push(`${m}${t('chips.unit.min.short')}`)
  if (parts.length === 0) parts.push(`0${t('chips.unit.min.short')}`)
  return `+${parts.join(' ')}`
}

type CustomTab = 'rel' | 'abs'

/* Apple-HIG modal sheet for adding a task. Replaces the previous bottom
   pill + hover-expand popover (mis-tap source). All interactions are
   deliberate taps; nothing opens/closes on hover or stray clicks
   anywhere on the page. */
export function ComposerSheet({ open, onClose }: Props) {
  const addTodo = useTodos((s) => s.addTodo)
  const t = useT()
  const [text, setText] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [choice, setChoice] = useState<Choice>(() => defaultChoice(ABSOLUTE_PRESETS))
  const [customOpen, setCustomOpen] = useState(false)
  const [customTab, setCustomTab] = useState<CustomTab>('rel')

  const titleRef = useRef<HTMLInputElement | null>(null)

  /* Reset form whenever the sheet is opened, autofocus the title */
  useEffect(() => {
    if (!open) return
    setText('')
    setTags([])
    setChoice(defaultChoice(ABSOLUTE_PRESETS))
    setCustomOpen(false)
    setCustomTab('rel')
    const id = window.setTimeout(() => titleRef.current?.focus(), 30)
    return () => window.clearTimeout(id)
  }, [open])

  /* Refresh resolved absolute times every 20s so chip labels stay fresh */
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!open) return
    const id = window.setInterval(() => setTick((x) => x + 1), 20_000)
    return () => window.clearInterval(id)
  }, [open])
  const now = useMemo(() => new Date(), [tick, open])
  const resolvedAbsolute = useMemo(
    () => ABSOLUTE_PRESETS.map((p) => ({ p, ts: resolveAbsolute(p, now) })),
    [now],
  )

  const submit = () => {
    if (!open) return
    const { title, tags: finalTags } = flushPending(text, tags)
    const finalTitle = title || 'CountDown'
    const deadline = resolveDeadline(choice, new Date(), RELATIVE_PRESETS, ABSOLUTE_PRESETS)
    addTodo({ title: finalTitle, deadline, tags: finalTags })
    triggerSubmitFeedback()
    onClose()
  }

  useEscToClose(onClose, open)
  useSaveShortcut(submit, open)

  const onChangeText = (v: string) => {
    const { cleaned, added } = extractTags(v, tags)
    if (added.length) setTags([...tags, ...added])
    setText(cleaned)
  }
  const onKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); submit() }
    else if (e.key === 'Backspace') {
      const el = e.currentTarget
      if (el.selectionStart === 0 && el.selectionEnd === 0 && tags.length > 0) {
        e.preventDefault()
        setTags(tags.slice(0, -1))
      }
    }
  }
  const removeTag = (tag: string) => setTags(tags.filter((x) => x !== tag))

  const pickRelative = (p: RelativePreset) => {
    setChoice({ kind: 'relative', presetId: p.id })
    setCustomOpen(false)
  }
  const pickAbsolute = (p: AbsolutePreset) => {
    setChoice({ kind: 'absolute', presetId: p.id })
    setCustomOpen(false)
  }
  const toggleCustom = () => {
    if (customOpen) { setCustomOpen(false); return }
    setCustomOpen(true)
    if (choice.kind === 'custom' || choice.kind === 'custom-rel') return
    if (customTab === 'rel') {
      setChoice({ kind: 'custom-rel', offsetMs: 30 * 60 * 1000 })
    } else {
      const tentative = resolveDeadline(choice, new Date(), RELATIVE_PRESETS, ABSOLUTE_PRESETS)
      setChoice({ kind: 'custom', ts: tentative })
    }
  }
  const switchCustomTab = (next: CustomTab) => {
    setCustomTab(next)
    if (next === 'rel' && choice.kind !== 'custom-rel') {
      setChoice({ kind: 'custom-rel', offsetMs: 30 * 60 * 1000 })
    }
    if (next === 'abs' && choice.kind !== 'custom') {
      const tentative = resolveDeadline(choice, new Date(), RELATIVE_PRESETS, ABSOLUTE_PRESETS)
      setChoice({ kind: 'custom', ts: tentative })
    }
  }

  const currentLabel = (() => {
    if (choice.kind === 'relative') {
      const p = RELATIVE_PRESETS.find((x) => x.id === choice.presetId)
      return p ? `+${chipLabel(t, p)}` : t('composer.time')
    }
    if (choice.kind === 'absolute') {
      const r = resolvedAbsolute.find((x) => x.p.id === choice.presetId)
      if (r) return `${chipLabel(t, r.p)} · ${formatHM(r.ts)}`
    }
    if (choice.kind === 'custom-rel') {
      return formatRelLabel(t, choice.offsetMs)
    }
    if (choice.kind === 'custom') {
      const d = new Date(choice.ts)
      return `${d.getMonth() + 1}/${d.getDate()} ${formatHM(d.getTime())}`
    }
    return t('composer.time')
  })()

  if (!open) return null

  return createPortal(
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={t('composer.sheet.title')}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal modal--sheet modal--compose">
        <header className="modal__header">
          <h2 className="modal__h2">{t('composer.sheet.title')}</h2>
          <button className="modal__close" aria-label={t('edit.close')} onClick={onClose}>
            <IconX width={16} height={16} />
          </button>
        </header>

        <div className="modal__body">

          {/* Title (large, autofocused) */}
          <input
            ref={titleRef}
            className="edit__title"
            value={text}
            placeholder={t('composer.placeholder')}
            onChange={(e) => onChangeText(e.target.value)}
            onKeyDown={onKeyDownInput}
            aria-label={t('composer.placeholder')}
          />

          {/* Tags */}
          {tags.length > 0 && (
            <div className="edit__tags-preview">
              {tags.map((tag) => (
                <span key={tag} className="tag">
                  #{tag}
                  <button
                    type="button"
                    className="tag__x"
                    aria-label={t('composer.tag.remove', { tag })}
                    onClick={() => removeTag(tag)}
                  >
                    <IconX width={9} height={9} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* WHEN — quick chips */}
          <div className="compose-sheet__when">
            <div className="compose-sheet__when-head">
              <span className="compose-sheet__when-label">{t('composer.section.when')}</span>
              <span className="compose-sheet__when-value">{currentLabel}</span>
            </div>

            <div className="compose-sheet__chips" role="radiogroup" aria-label={t('composer.section.relative')}>
              {RELATIVE_PRESETS.map((p) => {
                const active = choice.kind === 'relative' && choice.presetId === p.id && !customOpen
                return (
                  <button
                    key={p.id}
                    className={'chip chip--rel' + (active ? ' chip--active' : '')}
                    aria-pressed={active}
                    role="radio"
                    aria-checked={active}
                    onClick={() => pickRelative(p)}
                  >
                    {chipLabel(t, p)}
                  </button>
                )
              })}
            </div>

            <div className="compose-sheet__chips" role="radiogroup" aria-label={t('composer.section.absolute')}>
              {resolvedAbsolute.map(({ p, ts }) => {
                const active = choice.kind === 'absolute' && choice.presetId === p.id && !customOpen
                return (
                  <button
                    key={p.id}
                    className={'chip chip--abs' + (active ? ' chip--active' : '')}
                    aria-pressed={active}
                    role="radio"
                    aria-checked={active}
                    onClick={() => pickAbsolute(p)}
                  >
                    <span className="chip__label">{chipLabel(t, p)}</span>
                    <span className="chip__time">{formatHM(ts)}</span>
                  </button>
                )
              })}
              <button
                type="button"
                className={'chip chip--custom' + (customOpen ? ' chip--active' : '')}
                aria-pressed={customOpen}
                onClick={toggleCustom}
              >
                <IconCalendar width={14} height={14} />
                <span>{customOpen ? t('composer.custom.close') : t('composer.custom')}</span>
              </button>
            </div>

            {customOpen && (
              <div className="compose-sheet__custom">
                <div className="em-tabs" role="tablist" aria-label={t('composer.custom')}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={customTab === 'rel'}
                    className={'em-tabs__tab' + (customTab === 'rel' ? ' em-tabs__tab--active' : '')}
                    onClick={() => switchCustomTab('rel')}
                  >
                    {t('composer.custom.rel')}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={customTab === 'abs'}
                    className={'em-tabs__tab' + (customTab === 'abs' ? ' em-tabs__tab--active' : '')}
                    onClick={() => switchCustomTab('abs')}
                  >
                    {t('composer.custom.abs')}
                  </button>
                </div>

                {customTab === 'rel' ? (
                  <RelativeDurationPicker
                    offsetMs={choice.kind === 'custom-rel' ? choice.offsetMs : 30 * 60 * 1000}
                    onChange={(offsetMs) => setChoice({ kind: 'custom-rel', offsetMs })}
                  />
                ) : (
                  <DateTimePicker
                    value={choice.kind === 'custom' ? choice.ts : Date.now()}
                    onChange={(ts) => setChoice({ kind: 'custom', ts })}
                  />
                )}
              </div>
            )}
          </div>

        </div>

        <footer className="modal__footer">
          <span className="modal__hint">{t('edit.save.hint')}</span>
          <div className="modal__footer-actions">
            <button className="btn" onClick={onClose}>{t('edit.cancel')}</button>
            <button className="btn btn--primary" onClick={submit}>
              {t('composer.add')}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
