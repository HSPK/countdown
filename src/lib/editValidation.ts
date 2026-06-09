import { parseCron } from './recurrence'
import type { Recurrence } from '../store/todos'

export interface EditTodoDraft {
  title: string
  deadline: number
  recurrence: Recurrence
  cronExpr: string
}

export type EditValidation =
  | { ok: true }
  | { ok: false; reason: 'empty-title' | 'bad-deadline' | 'bad-cron' }

export function validateTodoEdit(d: EditTodoDraft): EditValidation {
  if (!d.title.trim()) return { ok: false, reason: 'empty-title' }
  if (!Number.isFinite(d.deadline)) return { ok: false, reason: 'bad-deadline' }
  if (d.recurrence === 'custom') {
    const expr = d.cronExpr.trim()
    if (!expr || !parseCron(expr)) return { ok: false, reason: 'bad-cron' }
  }
  return { ok: true }
}
