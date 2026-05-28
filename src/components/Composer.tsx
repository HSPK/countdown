import { useEffect, useMemo, useRef, useState } from 'react'
import { useTodos } from '../store/todos'
import { ABSOLUTE_PRESETS, RELATIVE_PRESETS, type AbsolutePreset } from '../lib/datePresets'
import { formatHM, pad } from '../lib/time'
import { WheelPicker } from './WheelPicker'
import { IconPlus, IconX, IconChevronDown, IconArrowUp, IconCalendar } from './Icons'

interface Props {
  inputRef?: React.MutableRefObject<HTMLInputElement | null>
}

type Choice =
  | { kind: 'relative'; presetId: string; offsetMs: number }
  | { kind: 'absolute'; presetId: string }
  | { kind: 'custom'; ts: number }

function defaultChoice(): Choice {
  // Default = 明晚 18:00 (absolute)
  return { kind: 'absolute', presetId: 'tomorrow-pm' }
}

const TAG_RE = /#([\p{L}\p{N}_-]+)(?=\s)/gu
function extractTags(input: string, existing: string[]): { cleaned: string; added: string[] } {
  const added: string[] = []
  let cleaned = input
  let m: RegExpExecArray | null
  TAG_RE.lastIndex = 0
  while ((m = TAG_RE.exec(input)) !== null) {
    const tag = m[1]
    if (!existing.includes(tag) && !added.includes(tag)) {
      added.push(tag)
    }
    cleaned = cleaned.replace(m[0], '')
  }
  cleaned = cleaned.replace(/[\u00A0\s]{2,}/g, ' ').replace(/^\s+/, '')
  return { cleaned, added }
}
function flushPending(input: string, existing: string[]): { title: string; tags: string[] } {
  const re = /#([\p{L}\p{N}_-]+)/gu
  const newTags = [...existing]
  const cleaned = input.replace(re, (_, tag: string) => {
    if (!newTags.includes(tag)) newTags.push(tag)
    return ''
  }).replace(/\s+/g, ' ').trim()
  return { title: cleaned, tags: newTags }
}

/* Resolve a Choice to an absolute deadline at THIS moment.
   Relative presets fire from `now()` (not from when the chip was clicked). */
function resolveDeadline(choice: Choice, now: Date): number {
  if (choice.kind === 'relative') return now.getTime() + choice.offsetMs
  if (choice.kind === 'absolute') {
    const p = ABSOLUTE_PRESETS.find((x) => x.id === choice.presetId)
    return (p ?? ABSOLUTE_PRESETS[2]).resolve(now).getTime()
  }
  return choice.ts
}

export function Composer({ inputRef }: Props) {
  const addTodo = useTodos((s) => s.addTodo)
  const [text, setText] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [choice, setChoice] = useState<Choice>(defaultChoice)
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
    const t = window.setInterval(() => setTick((x) => x + 1), 20_000)
    return () => window.clearInterval(t)
  }, [])
  const now = useMemo(() => new Date(), [tick])
  const resolvedAbsolute = useMemo(
    () => ABSOLUTE_PRESETS.map((p) => ({ p, d: p.resolve(now) })),
    [now],
  )

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
    const deadline = resolveDeadline(choice, new Date())
    addTodo({ title: finalTitle, deadline, tags: finalTags })
    setText('')
    setTags([])
    setChoice(defaultChoice())
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

  const pickRelative = (id: string) => {
    const p = RELATIVE_PRESETS.find((x) => x.id === id)
    if (!p) return
    setChoice({ kind: 'relative', presetId: id, offsetMs: p.offsetMs })
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
      const tentative = resolveDeadline(choice, new Date())
      setChoice({ kind: 'custom', ts: tentative })
    }
  }

  /* Current label shown on the time button in the input row */
  const currentLabel = (() => {
    if (choice.kind === 'relative') {
      const p = RELATIVE_PRESETS.find((x) => x.id === choice.presetId)
      return p ? `+${p.label}` : '时间'
    }
    if (choice.kind === 'absolute') {
      const r = resolvedAbsolute.find((x) => x.p.id === choice.presetId)
      if (r) return `${r.p.label} ${formatHM(r.d.getTime())}`
    }
    if (choice.kind === 'custom') {
      const d = new Date(choice.ts)
      return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    }
    return '时间'
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

          <div className="compose-section">
            <div className="compose-section__head">相对时间</div>
            <div className="compose-section__chips" role="radiogroup" aria-label="相对时间">
              {RELATIVE_PRESETS.map((p) => {
                const active = choice.kind === 'relative' && choice.presetId === p.id && !showCalendar
                return (
                  <button
                    key={p.id}
                    className="chip chip--rel"
                    aria-pressed={active}
                    role="radio"
                    aria-checked={active}
                    onClick={() => pickRelative(p.id)}
                    title={`从添加时刻起 ${p.label}`}
                    tabIndex={expanded ? 0 : -1}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="compose-section">
            <div className="compose-section__head">绝对时间</div>
            <div className="compose-section__chips" role="radiogroup" aria-label="绝对时间">
              {resolvedAbsolute.map(({ p, d }) => {
                const active = choice.kind === 'absolute' && choice.presetId === p.id && !showCalendar
                return (
                  <button
                    key={p.id}
                    className="chip chip--abs"
                    aria-pressed={active}
                    role="radio"
                    aria-checked={active}
                    onClick={() => pickAbsolute(p)}
                    title={`${p.label} · ${formatHM(d.getTime())}`}
                    tabIndex={expanded ? 0 : -1}
                  >
                    <span className="chip__label">{p.label}</span>
                    <span className="chip__time">{formatHM(d.getTime())}</span>
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
                <span>{showCalendar ? '收起日历' : '自定义'}</span>
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
          {tags.map((t) => (
            <span key={t} className="tag tag--in-input">
              #{t}
              <button
                type="button"
                className="tag__x"
                aria-label={`移除 #${t}`}
                onClick={(e) => { e.stopPropagation(); removeTag(t) }}
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
            placeholder={tags.length ? '' : '新任务…'}
            aria-label="新任务"
          />
        </div>
        <button
          type="button"
          className="compose-time-btn"
          onClick={(e) => { e.stopPropagation() }}
          title={currentLabel}
        >
          {currentLabel}
          <IconChevronDown width={11} height={11} />
        </button>
        <button
          type="button"
          className="compose-submit"
          onClick={(e) => { e.stopPropagation(); submit() }}
          aria-label="添加任务"
          title="添加任务（无标题则默认 CountDown）"
        >
          <IconArrowUp width={16} height={16} />
        </button>
      </div>
    </div>
  )
}
