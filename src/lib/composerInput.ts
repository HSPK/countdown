import { resolveAbsolute, resolveRelative, type AbsolutePreset, type RelativePreset } from './chipResolver'

export type Choice =
  | { kind: 'relative'; presetId: string }
  | { kind: 'absolute'; presetId: string }
  | { kind: 'custom'; ts: number }

export function defaultChoice(absolute: AbsolutePreset[]): Choice {
  /* Prefer the legacy "tomorrow-pm" id if present so existing users land
     on the same default; otherwise fall back to the first absolute chip. */
  const fallback = absolute.find((p) => p.id === 'tomorrow-pm') ?? absolute[0]
  return fallback
    ? { kind: 'absolute', presetId: fallback.id }
    : { kind: 'custom', ts: Date.now() + 24 * 60 * 60 * 1000 }
}

const TAG_RE = /#([\p{L}\p{N}_-]+)(?=\s)/gu

/* Extract tags that are followed by whitespace (i.e. "finished" tokens).
   Strips them from the input and returns the trimmed text plus any
   newly-discovered tags not already in `existing`. */
export function extractTags(input: string, existing: string[]): { cleaned: string; added: string[] } {
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

/* Submit-time flush — catches a still-unfinished tag (no trailing space)
   sitting in the input. */
export function flushPending(input: string, existing: string[]): { title: string; tags: string[] } {
  const re = /#([\p{L}\p{N}_-]+)/gu
  const newTags = [...existing]
  const cleaned = input.replace(re, (_, tag: string) => {
    if (!newTags.includes(tag)) newTags.push(tag)
    return ''
  }).replace(/\s+/g, ' ').trim()
  return { title: cleaned, tags: newTags }
}

/* Resolve a Choice to an absolute deadline at THIS moment. The preset
   tables are passed in (rather than imported) so this stays a pure
   function with no store dependency. */
export function resolveDeadline(
  choice: Choice,
  now: Date,
  relative: RelativePreset[],
  absolute: AbsolutePreset[],
): number {
  if (choice.kind === 'relative') {
    const p = relative.find((x) => x.id === choice.presetId)
    if (p) return resolveRelative(p, now)
    return now.getTime()
  }
  if (choice.kind === 'absolute') {
    const p = absolute.find((x) => x.id === choice.presetId) ?? absolute[0]
    if (p) return resolveAbsolute(p, now)
    return now.getTime() + 24 * 60 * 60 * 1000
  }
  return choice.ts
}
