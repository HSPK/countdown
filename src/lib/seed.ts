import { useTodos } from '../store/todos'

const SEED_FLAG = 'countdown.seeded.v3'

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
    { title: '项目里程碑评审',     offsetMs: 2 * D + 4 * H, pin: true, tags: ['工作'],
      notes: '**评审重点**\n\n- 完成度 ≥ 80%\n- 文档齐全\n- Demo 可演示\n\n> 已抄送相关同事' },
    { title: '复习算法 · 动态规划', offsetMs: 8 * H, tags: ['学习'] },
    { title: '提交季度述职 PPT',    offsetMs: 3 * D, tags: ['工作'] },
    { title: '晨跑 5 公里',         offsetMs: 18 * H, tags: ['生活'] },
    { title: '发布会演练',          offsetMs: 6 * D, tags: ['工作'] },
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
