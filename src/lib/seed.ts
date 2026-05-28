import { useTodos } from '../store/todos'

const SEED_FLAG = 'countdown.seeded.v3'

/* Seed runs once on first load. Demo content is English; users can
   delete and replace it freely. */
export function seedIfEmpty() {
  if (typeof localStorage === 'undefined') return
  if (localStorage.getItem(SEED_FLAG)) return

  const s = useTodos.getState()
  if (s.todos.length > 0) {
    localStorage.setItem(SEED_FLAG, '1')
    return
  }

  const now = Date.now()
  const H = 60 * 60 * 1000
  const D = 24 * H
  const samples: Array<{ title: string; offsetMs: number; tags?: string[]; pin?: boolean; notes?: string }> = [
    { title: 'Project milestone review', offsetMs: 2 * D + 4 * H, pin: true, tags: ['work'],
      notes: '**Review checklist**\n\n- ≥ 80% complete\n- Docs in shape\n- Demo runnable\n\n> Stakeholders cc\'d' },
    { title: 'Review · dynamic programming', offsetMs: 8 * H, tags: ['study'] },
    { title: 'Submit quarterly review deck', offsetMs: 3 * D, tags: ['work'] },
    { title: 'Morning run · 5 km', offsetMs: 18 * H, tags: ['life'] },
    { title: 'Launch dry-run', offsetMs: 6 * D, tags: ['work'] },
  ]
  samples.forEach((it) => {
    const id = s.addTodo({
      title: it.title, deadline: now + it.offsetMs,
      tags: it.tags, notes: it.notes, sourceId: 'local',
    })
    if (it.pin) s.togglePin(id)
  })

  localStorage.setItem(SEED_FLAG, '1')
}
