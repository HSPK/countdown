import type { Todo } from '../store/todos'
import { uid } from './id'

/* ─────────────────────────────────────────────
 *  Import / Export / Subscription JSON schema
 *  Backward-compatible loose validation.
 *  Accepted shapes (per-item):
 *    { id, title, deadline, createdAt?, completedAt?, notes?, tags?, pinned? }
 *  Top-level may be:
 *    { version, todos: [...] }
 *    or just an array of items
 *  Times can be number (ms) or ISO string.
 * ───────────────────────────────────────────── */

export interface ExportPayload {
  version: 1
  name?: string
  exportedAt: number
  todos: Todo[]
}

interface RawItem {
  id?: unknown
  title?: unknown
  deadline?: unknown
  createdAt?: unknown
  completedAt?: unknown
  notes?: unknown
  tags?: unknown
  pinned?: unknown
}

function toTime(v: unknown, fallback: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const t = Date.parse(v)
    if (Number.isFinite(t)) return t
  }
  return fallback
}

function toStr(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined
}

function toTags(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string').map((s) => s.trim()).filter(Boolean)
}

export function parseTodosJson(raw: string, sourceId: string): Todo[] {
  let data: unknown
  try { data = JSON.parse(raw) } catch { throw new Error('JSON parse failed') }

  const items: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray((data as { todos?: unknown })?.todos)
      ? ((data as { todos: unknown[] }).todos)
      : []
  if (!items.length) throw new Error('No `todos` array found')

  const now = Date.now()
  return items
    .filter((it): it is RawItem => !!it && typeof it === 'object')
    .filter((it) => typeof it.title === 'string' && (it.title as string).trim())
    .map<Todo>((it) => ({
      id: typeof it.id === 'string' && it.id ? `${sourceId}:${it.id}` : uid(),
      title: (it.title as string).trim(),
      notes: toStr(it.notes),
      tags: toTags(it.tags),
      sourceId,
      createdAt: toTime(it.createdAt, now),
      deadline: toTime(it.deadline, now + 7 * 24 * 3600 * 1000),
      completedAt: typeof it.completedAt === 'number' ? it.completedAt : undefined,
      pinned: !!it.pinned,
    }))
}

export async function fetchSubscription(url: string, sourceId: string): Promise<Todo[]> {
  const res = await fetch(url, { mode: 'cors' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  return parseTodosJson(text, sourceId)
}

export function makeExportPayload(todos: Todo[], name?: string): ExportPayload {
  return { version: 1, name, exportedAt: Date.now(), todos }
}

export function downloadJson(data: unknown, filename = 'countdown.json'): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result || ''))
    r.onerror = () => reject(r.error || new Error('Failed to read file'))
    r.readAsText(file)
  })
}
