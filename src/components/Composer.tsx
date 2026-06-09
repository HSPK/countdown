import { useEffect, useMemo, useRef, useState } from 'react'
import { useTodos } from '../store/todos'
import { useChipPresets } from '../store/chipPresets'
import { resolveAbsolute, type AbsolutePreset, type RelativePreset } from '../lib/chipResolver'
import {
  defaultChoice,
  extractTags,
  flushPending,
  resolveDeadline,
  type Choice,
} from '../lib/composerInput'
import { triggerSubmitFeedback } from '../lib/feedback'
import { useT } from '../lib/i18n'
import { formatHM, pad } from '../lib/time'
import { WheelPicker } from './WheelPicker'
import { IconPlus, IconX, IconChevronDown, IconArrowUp, IconCalendar } from './Icons'

interface Props {
  inputRef?: React.MutableRefObject<HTMLInputElement | null>
}

function chipLabel(t: ReturnType<typeof useT>, p: { labelKey?: string; label: string }): string {
  return p.labelKey ? t(p.labelKey) : p.label
}

export function Composer({ inputRef }: Props) {
  const addTodo = useTodos((s) => s.addTodo)
  const relativePresets = useChipPresets((s) => s.relative)
  const absolutePresets = useChipPresets((s) => s.absolute)
  const t = useT()
  const [text, setText] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [choice, setChoice] = useState<Choice>(() => defaultChoice(absolutePresets))
  const [showCalendar, setShowCalendar] = useState(false)

  const [hovering, setHovering] = useState(false)
  const [focused, setFocused] = useState(false)
  const hideTimer = useRef<number | null>(null)

  const wrapRef = useRef<HTMLDivElement>(null)
  const inRef = useRef<HTMLInputElement>(null)

  const hasContent = text.length > 0 || tags.length > 0
  const expanded = hovering || focused || hasContent

  useEffect(() => { if (inputRef) inputRef.current = inRef.current }, [inputRef])

  /* Refresh resolved absolute times every 20s so chip labels stay fresh */
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setTick((x) => x + 1), 20_000)
    return () => window.clearInterval(id)
  }, [])
  const now = useMemo(() => new Date(), [tick])
  const resolvedAbsolute = useMemo(
    () => absolutePresets.map((p) => ({ p, ts: resolveAbsolute(p, now) })),
    [absolutePresets, now],
  )

  /* If the chip backing the current choice gets deleted from Settings,
     fall back to the new default so the time button never shows a ghost. */
  useEffect(() => {
    if (choice.kind === 'relative' && !relativePresets.some((p) => p.id === choice.presetId)) {
      setChoice(defaultChoice(absolutePresets))
    }
    if (choice.kind === 'absolute' && !absolutePresets.some((p) => p.id === choice.presetId)) {
      setChoice(defaultChoice(absolutePresets))
    }
  }, [relativePresets, absolutePresets, choice])

  useEffect(() => {
    if (!expanded) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = (e.target as Node) ?? null
      if (!wrapRef.current?.contains(target)) {
        setHovering(false); setFocused(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCalendar) { setShowCalendar(false); return }
        setHovering(false); setFocused(false)
        inRef.current?.blur()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown, { passive: true })
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [expanded, showCalendar])

  const submit = () => {
    const { title, tags: finalTags } = flushPending(text, tags)
    const finalTitle = title || 'CountDown'
    const deadline = resolveDeadline(choice, new Date(), relativePresets, absolutePresets)
    addTodo({ title: finalTitle, deadline, tags: finalTags })
    triggerSubmitFeedback()
    setText('')
    setTags([])
    setChoice(defaultChoice(absolutePresets))
    setShowCalendar(false)
    inRef.current?.focus()
  }

  const onChangeText = (v: string) => {
    const { cleaned, added } = extractTags(v, tags)
    if (added.length) setTags([...tags, ...added])
    setText(cleaned)
  }
  const onKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); submit() }
    else if (e.key === 'Backspace') {
      const el = e.currentTarget
      if (el.selectionStart === 0 && el.selectionEnd === 0 && tags.length > 0) {
        e.preventDefault()
        setTags(tags.slice(0, -1))
      }
    }
  }
  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t))

  /* Hover delay — clear hide timer if mouse comes back, otherwise close after a beat. */
  const cancelHide = () => {
    if (hideTimer.current) { window.clearTimeout(hideTimer.current); hideTimer.current = null }
    setHovering(true)
  }
  const startHide = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => {
      setHovering(false)
      hideTimer.current = null
    }, 600)
  }

  const pickRelative = (p: RelativePreset) => {
    setChoice({ kind: 'relative', presetId: p.id })
    setShowCalendar(false)
  }
  const pickAbsolute = (p: AbsolutePreset) => {
    setChoice({ kind: 'absolute', presetId: p.id })
    setShowCalendar(false)
  }
  const toggleCustom = () => {
    if (showCalendar) {
      setShowCalendar(false)
    } else {
      setShowCalendar(true)
      const tentative = resolveDeadline(choice, new Date(), relativePresets, absolutePresets)
      setChoice({ kind: 'custom', ts: tentative })
    }
  }

  /* Current label shown on the time button in the input row */
  const currentLabel = (() => {
    if (choice.kind === 'relative') {
      const p = relativePresets.find((x) => x.id === choice.presetId)
      return p ? `+${chipLabel(t, p)}` : t('composer.time')
    }
    if (choice.kind === 'absolute') {
      const r = resolvedAbsolute.find((x) => x.p.id === choice.presetId)
      if (r) return `${chipLabel(t, r.p)} ${formatHM(r.ts)}`
    }
    if (choice.kind === 'custom') {
      const d = new Date(choice.ts)
      return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    }
    return t('composer.time')
  })()

  return (
    <div
      className={'dock__composer' + (expanded ? ' dock__composer--open' : '')}
      ref={wrapRef}
      onMouseEnter={cancelHide}
      onMouseLeave={startHide}
      onClick={() => { if (!expanded) inRef.current?.focus() }}
    >
      {/* Invisible bridge keeps mouse inside the dock zone when traversing
          the 8 px gap between input row and floating popover. */}
      <div className="compose-bridge" aria-hidden />

      {/* Detached popover ABOVE the pill */}
      <div className="compose-popover" data-open={expanded} aria-hidden={!expanded}>
        <div className="compose-expand">

          {relativePresets.length > 0 && (
            <div className="compose-section">
              <div className="compose-section__head">{t('composer.section.relative')}</div>
              <div className="compose-section__chips" role="radiogroup" aria-label={t('composer.section.relative')}>
                {relativePresets.map((p) => {
                  const active = choice.kind === 'relative' && choice.presetId === p.id && !showCalendar
                  return (
                    <button
                      key={p.id}
                      className="chip chip--rel"
                      aria-pressed={active}
                      role="radio"
                      aria-checked={active}
                      onClick={() => pickRelative(p)}
                      title={t('preset.rel.title', { label: chipLabel(t, p) })}
                      tabIndex={expanded ? 0 : -1}
                    >
                      {chipLabel(t, p)}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="compose-section">
            <div className="compose-section__head">{t('composer.section.absolute')}</div>
            <div className="compose-section__chips" role="radiogroup" aria-label={t('composer.section.absolute')}>
              {resolvedAbsolute.map(({ p, ts }) => {
                const active = choice.kind === 'absolute' && choice.presetId === p.id && !showCalendar
                return (
                  <button
                    key={p.id}
                    className="chip chip--abs"
                    aria-pressed={active}
                    role="radio"
                    aria-checked={active}
                    onClick={() => pickAbsolute(p)}
                    title={`${chipLabel(t, p)} · ${formatHM(ts)}`}
                    tabIndex={expanded ? 0 : -1}
                  >
                    <span className="chip__label">{chipLabel(t, p)}</span>
                    <span className="chip__time">{formatHM(ts)}</span>
                  </button>
                )
              })}
              <button
                className={'chip chip--custom' + (showCalendar ? ' chip--active' : '')}
                aria-pressed={showCalendar}
                onClick={toggleCustom}
                tabIndex={expanded ? 0 : -1}
              >
                <IconCalendar width={14} height={14} />
                <span>{showCalendar ? t('composer.custom.close') : t('composer.custom')}</span>
              </button>
            </div>
          </div>

          {showCalendar && (
            <div className="compose-picker">
              <WheelPicker value={choice.kind === 'custom' ? choice.ts : Date.now()}
                onChange={(ts) => setChoice({ kind: 'custom', ts })} />
            </div>
          )}
        </div>
      </div>

      {/* Input row — fixed height, never resizes */}
      <div className="compose-row">
        <span className="compose-row__plus" aria-hidden><IconPlus width={14} height={14} /></span>
        <div className="compose-pills" onClick={() => inRef.current?.focus()}>
          {tags.map((tag) => (
            <span key={tag} className="tag tag--in-input">
              #{tag}
              <button
                type="button"
                className="tag__x"
                aria-label={t('composer.tag.remove', { tag })}
                onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
              >
                <IconX width={9} height={9} />
              </button>
            </span>
          ))}
          <input
            ref={inRef}
            type="text"
            className="compose-row__input"
            value={text}
            onChange={(e) => onChangeText(e.target.value)}
            onKeyDown={onKeyDownInput}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={tags.length ? '' : t('composer.placeholder')}
            aria-label={t('composer.placeholder')}
          />
        </div>
        <button
          type="button"
          className="compose-time-btn"
          onClick={(e) => { e.stopPropagation() }}
          title={currentLabel}
        >
          <span className="compose-time-btn__label">{currentLabel}</span>
          <IconChevronDown width={11} height={11} className="compose-time-btn__chev" />
        </button>
        <button
          type="button"
          className="compose-submit"
          onClick={(e) => { e.stopPropagation(); submit() }}
          aria-label={t('composer.add')}
          title={t('composer.add.hint')}
        >
          <IconArrowUp width={16} height={16} />
        </button>
      </div>
    </div>
  )
}
