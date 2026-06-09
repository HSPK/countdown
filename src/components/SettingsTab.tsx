import { useRef } from 'react'
import { useTodos } from '../store/todos'
import { useSettings, THEMES, type ThemeName } from '../store/settings'
import { useCustomThemes, parseThemeJson } from '../store/customThemes'
import { useNotifierPrefs } from '../store/notifierPrefs'
import { SourceManager } from './SourceManager'
import { PresetEditor } from './PresetEditor'
import { FeedbackSettings } from './FeedbackSettings'
import { HigGroup, HigRow, HigRowSelect, HigRowToggle, HigSection } from './HigList'
import { downloadJson, makeExportPayload, parseTodosJson, readFileAsText } from '../lib/portable'
import { requestNotificationPermission } from '../hooks/useNotifier'
import { LOCAL_SOURCE_ID } from '../store/sources'
import { useT, LANGS, type Lang } from '../lib/i18n'
import {
  IconCheck, IconTrash, IconBell, IconDownload, IconUpload,
  IconHelp, IconExternal,
} from './Icons'

const APP_VERSION = '0.28'

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
  const notifierEnabled = useNotifierPrefs((s) => s.enabled)
  const setNotifierEnabled = useNotifierPrefs((s) => s.setEnabled)
  const t = useT()

  const fileRef = useRef<HTMLInputElement>(null)
  const themeFileRef = useRef<HTMLInputElement>(null)

  const localCount = todos.filter((todo) => todo.sourceId === LOCAL_SOURCE_ID).length

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
  const toggleNotifier = async (next: boolean) => {
    if (!next) {
      setNotifierEnabled(false)
      return
    }
    const perm = await requestNotificationPermission()
    if (perm === 'granted') {
      setNotifierEnabled(true)
    } else if (perm === 'denied') {
      alert(t('settings.notifier.denied'))
    } else if (perm === 'unsupported') {
      alert(t('settings.notifier.unsupported'))
    }
  }

  return (
    <div className="settings">

      {/* Theme */}
      <HigSection title={t('settings.theme')} footer={t('settings.theme.footer')}>
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
              deleteLabel={t('settings.theme.remove', { name: tm.name })}
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
        <HigGroup>
          <HigRow
            icon={<IconUpload width={14} height={14} />}
            title={t('settings.theme.import')}
            onPress={() => themeFileRef.current?.click()}
          />
        </HigGroup>
      </HigSection>

      {/* Language */}
      <HigSection title={t('settings.lang')}>
        <HigGroup>
          {LANGS.map((l) => (
            <HigRowSelect
              key={l.id}
              title={l.name}
              active={lang === l.id}
              onPress={() => setLang(l.id as Lang)}
            />
          ))}
        </HigGroup>
      </HigSection>

      {/* Sources */}
      <HigSection title={t('settings.sources')}>
        <SourceManager />
      </HigSection>

      {/* Quick chips (composer presets) */}
      <HigSection title={t('settings.chips')}>
        <PresetEditor />
      </HigSection>

      {/* Feedback (sound / vibration) */}
      <HigSection title={t('settings.feedback')}>
        <FeedbackSettings />
      </HigSection>

      {/* Notifications */}
      <HigSection title={t('settings.notifier')}>
        <HigGroup>
          <HigRowToggle
            icon={<IconBell width={14} height={14} />}
            title={t('settings.notifier.title')}
            checked={notifierEnabled}
            onChange={toggleNotifier}
          />
        </HigGroup>
      </HigSection>

      {/* Import / Export */}
      <HigSection title={t('settings.io')}>
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
        <HigGroup>
          <HigRow
            icon={<IconDownload width={14} height={14} />}
            title={t('settings.io.export')}
            trailing={<span className="hig-row__value">{localCount}</span>}
            onPress={exportLocal}
          />
          <HigRow
            icon={<IconUpload width={14} height={14} />}
            title={t('settings.io.import')}
            onPress={() => fileRef.current?.click()}
          />
        </HigGroup>
      </HigSection>

      {/* Help + About */}
      <HigSection title={t('settings.help')}>
        <HigGroup>
          <HigRow
            icon={<IconHelp width={14} height={14} />}
            title={t('settings.help.open')}
            onPress={() => setHelp('toc')}
          />
          <HigRow
            icon={<IconExternal width={14} height={14} />}
            title={t('settings.about')}
            trailing={<span className="hig-row__value">v{APP_VERSION}</span>}
          />
        </HigGroup>
      </HigSection>

    </div>
  )
}

function ThemeChooserCard({
  id, name, hint, active, custom, onSelect, onDelete, deleteLabel,
}: {
  id: string; name: string; hint?: string; active: boolean;
  custom?: boolean; onSelect: () => void; onDelete?: () => void; deleteLabel?: string
}) {
  return (
    <div className="theme-card-wrap">
      <button
        className={`theme-card theme-card--${custom ? 'mono-light' : id}`}
        aria-pressed={active}
        onClick={onSelect}
      >
        <span className="theme-card__check"><IconCheck width={12} height={12} /></span>
        <span className="theme-card__preview">Aa</span>
        <span className="theme-card__name">{name}</span>
        <span className="theme-card__hint">{hint ?? ''}</span>
      </button>
      {custom && onDelete && (
        <button
          type="button"
          className="theme-card__delete"
          onClick={onDelete}
          aria-label={deleteLabel ?? ''}
          title={deleteLabel ?? ''}
        >
          <IconTrash width={11} height={11} />
        </button>
      )}
    </div>
  )
}
