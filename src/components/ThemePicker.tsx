import { useSettings, THEMES, type ThemeName } from '../store/settings'
import { useCustomThemes } from '../store/customThemes'
import { useT } from '../lib/i18n'
import { IconCheck, IconTrash } from './Icons'

/* HIG theme picker — a row of mock previews. Each tile renders a tiny
   fake "card" using the theme's own bg/fg/accent so users can audition
   visually without applying the theme. Active state = accent ring +
   filled check badge in the corner (Apple Wallpaper picker pattern). */
export function ThemePicker() {
  const t = useT()
  const theme = useSettings((s) => s.theme)
  const setTheme = useSettings((s) => s.setTheme)
  const customThemes = useCustomThemes((s) => s.themes)
  const removeTheme = useCustomThemes((s) => s.removeTheme)

  return (
    <div className="theme-picker">
      {THEMES.map((tm) => (
        <ThemeTile
          key={tm.id}
          id={tm.id}
          name={tm.name}
          hint={tm.hint}
          active={tm.id === theme}
          onSelect={() => setTheme(tm.id as ThemeName)}
        />
      ))}
      {customThemes.map((tm) => (
        <ThemeTile
          key={tm.id}
          id={tm.id}
          name={tm.name}
          hint={tm.hint ?? 'custom'}
          active={tm.id === theme}
          previewId={tm.base ?? 'mono-light'}
          onSelect={() => setTheme(tm.id as ThemeName)}
          onDelete={() => {
            if (confirm(t('settings.theme.remove.confirm', { name: tm.name }))) {
              if (theme === tm.id) setTheme('mono-light')
              removeTheme(tm.id)
            }
          }}
        />
      ))}
    </div>
  )
}

function ThemeTile({
  id, name, hint, active, previewId, onSelect, onDelete,
}: {
  id: string
  name: string
  hint?: string
  active: boolean
  /** Override the visual preview to a built-in theme (used for custom themes). */
  previewId?: string
  onSelect: () => void
  onDelete?: () => void
}) {
  const previewClass = `theme-tile__preview theme-preview--${previewId ?? id}`
  return (
    <div className="theme-tile-wrap">
      <button
        type="button"
        className={'theme-tile' + (active ? ' theme-tile--active' : '')}
        aria-pressed={active}
        onClick={onSelect}
      >
        <div className={previewClass} aria-hidden>
          <div className="theme-preview__bar">
            <div className="theme-preview__title">Aa</div>
            <div className="theme-preview__dot" />
          </div>
          <div className="theme-preview__lines">
            <span className="theme-preview__line theme-preview__line--full" />
            <span className="theme-preview__line theme-preview__line--two-thirds" />
          </div>
        </div>
        <div className="theme-tile__caption">
          <span className="theme-tile__name">{name}</span>
          {hint && <span className="theme-tile__hint">{hint}</span>}
        </div>
        {active && (
          <span className="theme-tile__check" aria-hidden>
            <IconCheck width={12} height={12} />
          </span>
        )}
      </button>
      {onDelete && (
        <button
          type="button"
          className="theme-tile__delete"
          onClick={onDelete}
          aria-label={`Remove ${name}`}
          title={`Remove ${name}`}
        >
          <IconTrash width={11} height={11} />
        </button>
      )}
    </div>
  )
}
