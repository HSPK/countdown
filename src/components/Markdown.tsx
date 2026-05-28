import { useEffect, useState } from 'react'
import { renderMarkdown } from '../lib/markdown'

interface Props {
  source: string
  className?: string
}

export function Markdown({ source, className }: Props) {
  const [html, setHtml] = useState<string>(() => renderMarkdown(source))
  useEffect(() => { setHtml(renderMarkdown(source)) }, [source])
  if (!source?.trim()) return null
  return (
    <div
      className={`md ${className ?? ''}`}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
