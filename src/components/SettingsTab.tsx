import { useRef } from 'react'
import { useTodos } from '../store/todos'
import { useSettings, THEMES, type ThemeName } from '../store/settings'
import { useCustomThemes, parseThemeJson } from '../store/customThemes'
import { SourceManager } from './SourceManager'
import { downloadJson, makeExportPayload, parseTodosJson, readFileAsText } from '../lib/portable'
import { requestNotificationPermission } from '../hooks/useNotifier'
import { LOCAL_SOURCE_ID } from '../store/sources'
import { useT, LANGS, type Lang } from '../lib/i18n'
import {
  IconCheck, IconTrash, IconBell, IconDownload, IconUpload,
  IconHelp, IconChevronRight, IconExternal,
} from './Icons'

const APP_VERSION = '0.27'

export function SettingsTab() {
  const theme = useSettings((s) => s.theme)
  const setTheme = useSettings((s) => s.setTheme)
  const lang = useSettings((s) => s.lang)
  const setLang = useSettings((s) => s.setLang)
  const setHelp = useSettings((s) => s.setHelp)
  const todos = useTodos((s) => s.todos)
  const importTodos = useTodos((s) => s.importTodos)
  const customThemes = useCustomThemes((s) => s.themes)
  const removeTheme = useCustomThemes((s) => s.removeTheme)
  const addTheme = useCustomThemes((s) => s.addTheme)
  const notifier = useCustomThemes((s) => s.notifier)
  const setNotifier = useCustomThemes((s) => s.setNotifier)
  const t = useT()

  const fileRef = useRef<HTMLInputElement>(null)
  const themeFileRef = useRef<HTMLInputElement>(null)

  /* -- Data import / export -- */
  const exportLocal = () => {
    const local = todos.filter((todo) => todo.sourceId === LOCAL_SOURCE_ID)
    const payload = makeExportPayload(local, 'Local export')
    const stamp = new Date().toISOString().slice(0, 10)
    downloadJson(payload, `countdown-${stamp}.json`)
  }
  const importFile = async (file: File) => {
    try {
      const text = await readFileAsText(file)
      const items = parseTodosJson(text, LOCAL_SOURCE_ID)
      const n = importTodos(items)
      alert(t('settings.io.import.done', { count: n }))
    } catch (e) {
      alert(t('settings.io.import.fail', { error: e instanceof Error ? e.message : String(e) }))
    }
  }

  /* -- Custom themes (file only) -- */
  const importThemeFile = async (file: File) => {
    try {
      const text = await readFileAsText(file)
      const theme_ = parseThemeJson(text)
      addTheme(theme_)
    } catch (e) {
      alert(t('settings.io.theme.fail', { error: e instanceof Error ? e.message : String(e) }))
    }
  }

  /* -- Notifications -- */
  const toggleNotifier = async () => {
    if (notifier.enabled) {
      setNotifier({ enabled: false })
      return
    }
    const perm = await requestNotificationPermission()
    if (perm === 'granted') {
      setNotifier({ enabled: true })
    } else if (perm === 'denied') {
      alert(t('settings.notifier.denied'))
    } else if (perm === 'unsupported') {
      alert(t('settings.notifier.unsupported'))
    }
  }

  return (
    <div className="settings">

      {/* Theme */}
      <Section title={t('settings.theme')}>
        <div className="theme-picker__grid">
          {THEMES.map((tm) => (
            <ThemeChooserCard
              key={tm.id}
              id={tm.id}
              name={tm.name}
              hint={tm.hint}
              active={tm.id === theme}
              onSelect={() => setTheme(tm.id as ThemeName)}
            />
          ))}
          {customThemes.map((tm) => (
            <ThemeChooserCard
              key={tm.id}
              id={tm.id}
              name={tm.name}
              hint={tm.hint ?? 'custom'}
              active={tm.id === theme}
              custom
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

        <input
          ref={themeFileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) importThemeFile(f)
            e.target.value = ''
          }}
        />
        <ListRow
          icon={<IconUpload width={14} height={14} />}
          title={t('settings.theme.import')}
          desc={t('settings.theme.import.desc')}
          onClick={() => themeFileRef.current?.click()}
        />
      </Section>

      {/* Language */}
      <Section title={t('settings.lang')}>
        <div className="edit__segmented" style={{ alignSelf: 'flex-start' }}>
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              className="edit__seg-btn"
              aria-pressed={lang === l.id}
              onClick={() => setLang(l.id as Lang)}
            >
              {l.name}
            </button>
          ))}
        </div>
      </Section>

      {/* Sources */}
      <Section title={t('settings.sources')}>
        <SourceManager />
      </Section>

      {/* Notifications */}
      <Section title={t('settings.notifier')}>
        <ListRow
          icon={<IconBell width={14} height={14} />}
          title={notifier.enabled ? t('settings.notifier.on') : t('settings.notifier.off')}
          desc={notifier.enabled
            ? t('settings.notifier.on.desc')
            : t('settings.notifier.off.desc')}
          right={
            <span className={`pill-toggle${notifier.enabled ? ' pill-toggle--on' : ''}`}>
              {notifier.enabled ? t('settings.notifier.disable') : t('settings.notifier.enable')}
            </span>
          }
          onClick={toggleNotifier}
        />
      </Section>

      {/* Import / Export */}
      <Section title={t('settings.io')}>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) importFile(f)
            e.target.value = ''
          }}
        />
        <ListRow
          icon={<IconDownload width={14} height={14} />}
          title={t('settings.io.export')}
          desc={t('settings.io.export.desc', { count: todos.filter((todo) => todo.sourceId === LOCAL_SOURCE_ID).length })}
          onClick={exportLocal}
        />
        <ListRow
          icon={<IconUpload width={14} height={14} />}
          title={t('settings.io.import')}
          desc={t('settings.io.import.desc')}
          onClick={() => fileRef.current?.click()}
        />
      </Section>

      {/* Help + About */}
      <Section title={t('settings.help')}>
        <ListRow
          icon={<IconHelp width={14} height={14} />}
          title={t('settings.help.open')}
          desc={t('settings.help.open.desc')}
          onClick={() => setHelp('toc')}
        />
        <ListRow
          icon={<IconExternal width={14} height={14} />}
          title={t('settings.about')}
          desc={t('settings.about.desc', { version: APP_VERSION })}
        />
      </Section>

    </div>
  )
}

function Section({
  title, children,
}: { title: string; children: React.ReactNode }) {
  return (
    <section className="settings__section">
      <header className="settings__head2">
        <h2 className="settings__h2">{title}</h2>
      </header>
      <div className="settings__body2">{children}</div>
    </section>
  )
}

function ListRow({
  icon, title, desc, onClick, right,
}: {
  icon?: React.ReactNode
  title: string
  desc?: string
  onClick?: () => void
  right?: React.ReactNode
}) {
  return (
    <button
      type="button"
      className={'list-row' + (onClick ? ' list-row--clickable' : '')}
      onClick={onClick}
      disabled={!onClick}
    >
      {icon && <span className="list-row__icon" aria-hidden>{icon}</span>}
      <span className="list-row__main">
        <span className="list-row__title">{title}</span>
        {desc && <span className="list-row__desc">{desc}</span>}
      </span>
      {right
        ? <span className="list-row__right">{right}</span>
        : onClick && <span className="list-row__chev"><IconChevronRight width={14} height={14} /></span>}
    </button>
  )
}

function ThemeChooserCard({
  id, name, hint, active, custom, onSelect, onDelete,
}: {
  id: string; name: string; hint?: string; active: boolean;
  custom?: boolean; onSelect: () => void; onDelete?: () => void
}) {
  return (
    <div style={{ position: 'relative' }}>
      <button
        className={`theme-card theme-card--${custom ? 'mono-light' : id}`}
        aria-pressed={active}
        onClick={onSelect}
        style={{ width: '100%' }}
      >
        <span className="theme-card__check"><IconCheck width={12} height={12} /></span>
        <span className="theme-card__preview">Aa</span>
        <span className="theme-card__name">{name}</span>
        <span className="theme-card__hint">{hint ?? ''}</span>
      </button>
      {custom && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="移除主题"
          title="移除主题"
          style={{
            position: 'absolute', top: 4, right: 4,
            width: 22, height: 22, borderRadius: 4,
            color: 'var(--fg-muted)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0.5,
          }}
        >
          <IconTrash width={11} height={11} />
        </button>
      )}
    </div>
  )
}
