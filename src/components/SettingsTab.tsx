import { useRef, useState } from 'react'
import { useTodos, selectActive } from '../store/todos'
import { useSettings, THEMES, type ThemeName } from '../store/settings'
import { useCustomThemes, parseThemeJson } from '../store/customThemes'
import { SourceManager } from './SourceManager'
import { downloadJson, makeExportPayload, parseTodosJson, readFileAsText } from '../lib/portable'
import { requestNotificationPermission } from '../hooks/useNotifier'
import { LOCAL_SOURCE_ID } from '../store/sources'
import {
  IconCheck, IconTrash, IconBell, IconDownload, IconUpload,
  IconTv, IconHelp, IconChevronRight, IconExternal,
} from './Icons'

export function SettingsTab() {
  const theme = useSettings((s) => s.theme)
  const setTheme = useSettings((s) => s.setTheme)
  const setHelp = useSettings((s) => s.setHelp)
  const todos = useTodos((s) => s.todos)
  const importTodos = useTodos((s) => s.importTodos)
  const customThemes = useCustomThemes((s) => s.themes)
  const removeTheme = useCustomThemes((s) => s.removeTheme)
  const addTheme = useCustomThemes((s) => s.addTheme)
  const notifier = useCustomThemes((s) => s.notifier)
  const setNotifier = useCustomThemes((s) => s.setNotifier)

  const fileRef = useRef<HTMLInputElement>(null)
  const themeFileRef = useRef<HTMLInputElement>(null)
  const [broadcastOpen, setBroadcastOpen] = useState(false)

  /* -- Data import / export -- */
  const exportLocal = () => {
    const local = todos.filter((t) => t.sourceId === LOCAL_SOURCE_ID)
    const payload = makeExportPayload(local, '本地导出')
    const stamp = new Date().toISOString().slice(0, 10)
    downloadJson(payload, `countdown-${stamp}.json`)
  }
  const importFile = async (file: File) => {
    try {
      const text = await readFileAsText(file)
      const items = parseTodosJson(text, LOCAL_SOURCE_ID)
      const n = importTodos(items)
      alert(`已导入 ${n} 个任务`)
    } catch (e) {
      alert('导入失败：' + (e instanceof Error ? e.message : String(e)))
    }
  }

  /* -- Custom themes (file only) -- */
  const importThemeFile = async (file: File) => {
    try {
      const text = await readFileAsText(file)
      const t = parseThemeJson(text)
      addTheme(t)
    } catch (e) {
      alert('主题导入失败：' + (e instanceof Error ? e.message : String(e)))
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
      alert('浏览器已禁用通知，请在地址栏左侧的权限里手动开启。')
    } else if (perm === 'unsupported') {
      alert('当前浏览器不支持通知 API。')
    }
  }

  return (
    <div className="settings">

      {/* 主题 */}
      <Section title="主题">
        <div className="theme-picker__grid">
          {THEMES.map((t) => (
            <ThemeChooserCard
              key={t.id}
              id={t.id}
              name={t.name}
              hint={t.hint}
              active={t.id === theme}
              onSelect={() => setTheme(t.id as ThemeName)}
            />
          ))}
          {customThemes.map((t) => (
            <ThemeChooserCard
              key={t.id}
              id={t.id}
              name={t.name}
              hint={t.hint ?? 'custom'}
              active={t.id === theme}
              custom
              onSelect={() => setTheme(t.id as ThemeName)}
              onDelete={() => {
                if (confirm(`移除主题「${t.name}」？`)) {
                  if (theme === t.id) setTheme('mono-light')
                  removeTheme(t.id)
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
          title="导入主题文件"
          desc="JSON 格式 · 见使用方法"
          onClick={() => themeFileRef.current?.click()}
        />
      </Section>

      {/* 数据源 */}
      <Section title="数据源">
        <SourceManager />
      </Section>

      {/* 通知 */}
      <Section title="桌面通知">
        <ListRow
          icon={<IconBell width={14} height={14} />}
          title={notifier.enabled ? '已开启' : '已关闭'}
          desc={notifier.enabled
            ? '截止前 1 小时 / 10 分 / 当下三次提醒'
            : '安装为 PWA 后可后台触发'}
          right={
            <span className={`pill-toggle${notifier.enabled ? ' pill-toggle--on' : ''}`}>
              {notifier.enabled ? '停用' : '启用'}
            </span>
          }
          onClick={toggleNotifier}
        />
      </Section>

      {/* 直播大屏 */}
      <Section title="直播大屏 · OBS">
        <ListRow
          icon={<IconTv width={14} height={14} />}
          title="生成嵌入 URL"
          desc="绿幕 / 透明 / 自定义字体 · 用于 OBS 浏览器源"
          right={
            <span className="pill-toggle">{broadcastOpen ? '收起' : '打开'}</span>
          }
          onClick={() => setBroadcastOpen((v) => !v)}
        />
        {broadcastOpen && <BroadcastBuilder />}
      </Section>

      {/* 数据迁移 */}
      <Section title="导入 / 导出">
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
          title="导出 JSON"
          desc={`下载 ${todos.filter((t) => t.sourceId === LOCAL_SOURCE_ID).length} 个本地任务`}
          onClick={exportLocal}
        />
        <ListRow
          icon={<IconUpload width={14} height={14} />}
          title="导入 JSON"
          desc="按 id 合并 · 与订阅同格式"
          onClick={() => fileRef.current?.click()}
        />
      </Section>

      {/* 帮助 + 关于 */}
      <Section title="使用方法 · 关于">
        <ListRow
          icon={<IconHelp width={14} height={14} />}
          title="打开文档"
          desc="9 章 · 快捷键 / 时间预设 / 订阅 / OBS / PWA"
          onClick={() => setHelp('toc')}
        />
        <ListRow
          icon={<IconExternal width={14} height={14} />}
          title="项目"
          desc="CountDown · v0.17 · 完全 Serverless"
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

function BroadcastBuilder() {
  const todos = useTodos(selectActive)
  const [todoId, setTodoId] = useState<string>(todos[0]?.id ?? 'next')
  const [bg, setBg] = useState('theme')
  const [font, setFont] = useState('')
  const [accent, setAccent] = useState('')
  const [scale, setScale] = useState('1')
  const [showTitle, setShowTitle] = useState(true)

  const base = window.location.origin + window.location.pathname
  const sp = new URLSearchParams()
  sp.set('broadcast', todoId)
  if (bg !== 'theme') sp.set('bg', bg)
  if (font) sp.set('font', font)
  if (accent) sp.set('accent', accent)
  if (scale !== '1') sp.set('scale', scale)
  if (!showTitle) sp.set('title', 'hide')
  const url = `${base}?${sp.toString()}`

  return (
    <div className="settings__inset">
      <div className="field">
        <span className="field__label">任务</span>
        <select
          value={todoId}
          onChange={(e) => setTodoId(e.target.value)}
          style={{
            padding: '9px 12px', border: '1px solid var(--hairline-strong)',
            borderRadius: 'var(--radius-soft)', background: 'var(--bg-popover)', color: 'var(--fg)',
            fontSize: 13, outline: 'none',
          }}
        >
          <option value="next">最近 DDL（动态跟随）</option>
          {todos.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </div>

      <div className="field">
        <span className="field__label">背景</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { v: 'theme', l: '主题底色' },
            { v: 'transparent', l: '透明' },
            { v: 'chroma', l: '绿幕' },
            { v: 'black', l: '纯黑' },
            { v: 'white', l: '纯白' },
          ].map((o) => (
            <button
              key={o.v}
              className="tag tag--filter"
              aria-pressed={bg === o.v}
              onClick={() => setBg(o.v)}
            >{o.l}</button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field__label">字体</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { v: '', l: '主题默认' },
            { v: 'sans', l: 'Sans' },
            { v: 'serif', l: 'Serif' },
            { v: 'mono', l: 'Mono' },
          ].map((o) => (
            <button
              key={o.v}
              className="tag tag--filter"
              aria-pressed={font === o.v}
              onClick={() => setFont(o.v)}
            >{o.l}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="field__label">缩放</span>
          <input
            type="number"
            min="0.5" max="2" step="0.1"
            value={scale}
            onChange={(e) => setScale(e.target.value)}
            style={{
              width: 80, padding: '9px 12px', border: '1px solid var(--hairline-strong)',
              borderRadius: 'var(--radius-soft)', background: 'transparent', color: 'var(--fg)',
              fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none',
            }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="field__label">强调色（hex）</span>
          <input
            type="text"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            placeholder="#00F0FF"
            style={{
              width: 120, padding: '9px 12px', border: '1px solid var(--hairline-strong)',
              borderRadius: 'var(--radius-soft)', background: 'transparent', color: 'var(--fg)',
              fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none',
            }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, alignSelf: 'flex-end', paddingBottom: 9 }}>
          <input
            type="checkbox"
            checked={showTitle}
            onChange={(e) => setShowTitle(e.target.checked)}
          />
          显示标题
        </label>
      </div>

      <div className="field">
        <span className="field__label">URL</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={url}
            readOnly
            onFocus={(e) => e.target.select()}
            style={{
              flex: 1, padding: '9px 12px', border: '1px solid var(--hairline-strong)',
              borderRadius: 'var(--radius-soft)', background: 'var(--bg-2)', color: 'var(--fg)',
              fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none',
            }}
          />
          <button
            className="btn"
            onClick={() => navigator.clipboard?.writeText(url).then(() => alert('已复制'))}
          >复制</button>
          <button
            className="btn"
            onClick={() => window.open(url, '_blank')}
          >预览</button>
        </div>
      </div>
    </div>
  )
}
