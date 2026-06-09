import { useState } from 'react'
import { Markdown } from './Markdown'
import { useT } from '../lib/i18n'

/* Notes pane that flips between a textarea and a Markdown preview.
   Owns its own toggle state so the parent form doesn't need to track it. */
export function MarkdownEditor({
  value, onChange, label, placeholder, emptyLabel, rows = 6,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  placeholder?: string
  emptyLabel?: string
  rows?: number
}) {
  const t = useT()
  const [preview, setPreview] = useState(false)

  return (
    <div className="edit__field">
      <div className="edit__notes-head">
        <label className="edit__label">{label}</label>
        <button
          type="button"
          className="edit__notes-toggle"
          aria-pressed={preview}
          onClick={() => setPreview((v) => !v)}
          title={preview ? t('edit.notes.editor') : t('edit.notes.preview')}
        >
          {preview ? t('edit.notes.editor') : t('edit.notes.preview')}
        </button>
      </div>
      {preview ? (
        <div className="edit__notes-preview">
          {value.trim()
            ? <Markdown source={value} />
            : <div className="edit__notes-preview-empty">{emptyLabel ?? ''}</div>}
        </div>
      ) : (
        <textarea
          className="edit__textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
        />
      )}
    </div>
  )
}
