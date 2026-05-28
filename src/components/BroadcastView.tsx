import { useEffect, useMemo, useState } from 'react'
import { useTodos } from '../store/todos'
import { useNowFast } from '../hooks/useNow'
import { diffParts, formatAbsolute, pad, urgencyOf } from '../lib/time'

/* ────────────────────────────────────────────────
   BroadcastView — minimal full-screen countdown
   for OBS / projector / studio backdrops.

   URL params:
     ?broadcast=<todoId|next>     which todo to show
     &bg=transparent|chroma|black|white|theme
     &color=<#hex>                override text color
     &font=<sans|serif|mono>      font family
     &scale=<0.5..2>              size multiplier
     &accent=<#hex>               accent color
     &title=show|hide             show title above
   ──────────────────────────────────────────────── */

interface Props {
  todoId: string
}

function readParam(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const v = new URLSearchParams(window.location.search).get(name)
  return v ?? fallback
}

export function BroadcastView({ todoId }: Props) {
  const todos = useTodos((s) => s.todos)
  const todo = useMemo(() => {
    if (todoId === 'next') {
      return todos
        .filter((t) => !t.completedAt)
        .sort((a, b) => a.deadline - b.deadline)[0]
    }
    return todos.find((t) => t.id === todoId)
  }, [todos, todoId])

  const now = useNowFast(true)

  /* Reload on URL change so OBS can switch by re-navigating */
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const onPop = () => setVersion((v) => v + 1)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const bg = readParam('bg', 'theme')
  const colorOverride = readParam('color', '')
  const accentOverride = readParam('accent', '')
  const fontMode = readParam('font', '')
  const scale = parseFloat(readParam('scale', '1')) || 1
  const showTitle = readParam('title', 'show') !== 'hide'

  let bgColor: string | undefined
  if (bg === 'transparent') bgColor = 'transparent'
  else if (bg === 'chroma') bgColor = '#00B140'
  else if (bg === 'black') bgColor = '#000000'
  else if (bg === 'white') bgColor = '#FFFFFF'
  else if (bg.startsWith('#')) bgColor = bg

  const fontFamily =
    fontMode === 'sans' ? "'Inter', system-ui, sans-serif" :
    fontMode === 'serif' ? "'Fraunces', Georgia, serif" :
    fontMode === 'mono' ? "'JetBrains Mono', monospace" :
    undefined

  if (!todo) {
    return (
      <div className="bcast" style={{ background: bgColor }}>
        <div className="bcast__title">Task not found</div>
        <div className="bcast__meta">broadcast={todoId}</div>
      </div>
    )
  }

  const remaining = todo.deadline - now
  const overdue = remaining <= 0
  const u = urgencyOf(remaining)
  const { d, h, m, s } = diffParts(remaining)

  return (
    <div
      className="bcast"
      data-bg={bg}
      data-urgency={u}
      style={{
        background: bgColor,
        color: colorOverride || undefined,
        fontFamily,
        ['--bcast-scale' as never]: scale,
        ['--bcast-accent' as never]: accentOverride || undefined,
      }}
      data-version={version}
    >
      {showTitle && <div className="bcast__title">{todo.title}</div>}

      <div className="bcast__digits-wrap">
        {overdue && <span className="bcast__sign">+</span>}
        <div className={'bcast__digits' + (overdue ? ' bcast__digits--overdue' : '')}>
          <div className="bcast__seg">
            <span>{pad(d)}</span>
            <span className="bcast__label">Days</span>
          </div>
          <span className="bcast__sep">:</span>
          <div className="bcast__seg">
            <span>{pad(h)}</span>
            <span className="bcast__label">Hours</span>
          </div>
          <span className="bcast__sep">:</span>
          <div className="bcast__seg">
            <span>{pad(m)}</span>
            <span className="bcast__label">Min</span>
          </div>
          <span className="bcast__sep">:</span>
          <div className="bcast__seg">
            <span>{pad(s)}</span>
            <span className="bcast__label">Sec</span>
          </div>
        </div>
      </div>

      {showTitle && (
        <div className="bcast__meta">
          {overdue ? 'Overdue' : 'Due'} {formatAbsolute(todo.deadline)}
        </div>
      )}
    </div>
  )
}
