import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({
  gfm: true,
  breaks: true,
})

export function renderMarkdown(src: string | undefined): string {
  if (!src) return ''
  const html = marked.parse(src, { async: false }) as string
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'class'],
    FORBID_TAGS: ['style', 'iframe', 'script', 'form'],
  })
}
