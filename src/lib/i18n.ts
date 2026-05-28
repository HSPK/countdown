import { useSettings } from '../store/settings'

export type Lang = 'en' | 'zh-CN'
export const LANGS: Array<{ id: Lang; name: string }> = [
  { id: 'en',    name: 'English' },
  { id: 'zh-CN', name: '中文' },
]

type Dict = Record<string, string>

/* All user-facing strings live here. New keys MUST exist in `en` (the
   fallback); other languages may omit individual keys. Use `{name}`
   placeholders for interpolation. */
const EN: Dict = {
  /* Tab labels */
  'tab.home':     'Home',
  'tab.all':      'All',
  'tab.settings': 'Settings',

  /* Hero */
  'hero.next':    'Next',
  'hero.overdue': 'Overdue',
  'hero.empty':   'No tasks yet. Add one below.',

  /* Buckets */
  'bucket.today':  'Today',
  'bucket.week':   'This Week',
  'bucket.month':  'This Month',
  'bucket.later':  'Later',
  'bucket.done':   'Done',
  'bucket.range':  'next {days}d',

  /* List actions */
  'list.show':         'Show',
  'list.hide':         'Hide',
  'list.clear':        'Clear',
  'list.clear.confirm': 'Clear {count} completed tasks?',
  'list.empty.search': 'No tasks match',
  'list.empty.none':   'No tasks yet',
  'list.more.title':   '{count} more later',
  'list.loading':      'loading…',

  /* Row */
  'row.complete':       'Complete',
  'row.complete.hint':  'Complete (Space)',
  'row.uncomplete':     'Mark incomplete',
  'row.complete.once':  'Complete this',
  'row.done':           'done',
  'row.more':           'More',
  'row.pin':            'Pin',
  'row.unpin':          'Unpin',
  'row.pinned':         'Pinned',
  'row.edit':           'Edit',
  'row.edit.parent':    'Edit task',
  'row.delete':         'Delete',
  'row.delete.confirm': 'Delete "{title}"?',
  'row.recurring':      'Recurring',
  'row.focus':          'Focus',

  /* Recurrence */
  'recurrence.none':    'No repeat',
  'recurrence.daily':   'Daily',
  'recurrence.weekly':  'Weekly',
  'recurrence.monthly': 'Monthly',
  'recurrence.custom':  'Custom',

  /* Composer */
  'composer.placeholder':       'New task…',
  'composer.add':               'Add task',
  'composer.add.hint':          'Add (no title → CountDown)',
  'composer.section.relative':  'Relative time',
  'composer.section.absolute':  'Absolute time',
  'composer.custom':            'Custom',
  'composer.custom.close':      'Close calendar',
  'composer.time':              'Time',
  'composer.tag.remove':        'Remove #{tag}',

  /* Wheel picker */
  'picker.year':  'Year',
  'picker.month': 'Month',
  'picker.day':   'Day',
  'picker.hour':  'Hour',
  'picker.min':   'Minute',

  /* Edit modal */
  'edit.title':         'Edit task',
  'edit.title.input':   'Task title',
  'edit.tags':          'Tags',
  'edit.tags.hint':     '#work #study',
  'edit.repeat':        'Repeat',
  'edit.cron.hint':     'Format <code>min hour dom mon dow</code> · supports <code>*</code> · <code>n</code> · <code>n,m</code> · <code>a-b</code> · <code>*/k</code>',
  'edit.cron.invalid':  'Unparseable expression',
  'edit.deadline':      'Deadline',
  'edit.created':       'Created at',
  'edit.notes':         'Notes · Markdown',
  'edit.notes.placeholder': '**bold** *italic* `code` - list > quote',
  'edit.notes.empty':   '(empty)',
  'edit.notes.preview': 'Preview',
  'edit.notes.editor':  'Edit',
  'edit.save':          'Save',
  'edit.cancel':        'Cancel',
  'edit.save.hint':     '⌘ + Enter to save',
  'edit.close':         'Close',

  /* Date presets (relative) */
  'preset.rel.5m':  '5m',
  'preset.rel.10m': '10m',
  'preset.rel.20m': '20m',
  'preset.rel.30m': '30m',
  'preset.rel.1h':  '1h',
  'preset.rel.2h':  '2h',

  /* Date presets (absolute) */
  'preset.abs.tonight':    'Tonight',
  'preset.abs.tomorrow_am':'Tmrw morning',
  'preset.abs.tomorrow_pm':'Tmrw evening',
  'preset.abs.weekend':    'Weekend',
  'preset.abs.next_week':  'Next Mon',
  'preset.rel.title':      '{label} from when you tap Add',

  /* Settings page */
  'settings.theme':           'Theme',
  'settings.theme.import':    'Import theme file',
  'settings.theme.import.desc': 'JSON · see Help',
  'settings.theme.remove.confirm': 'Remove theme "{name}"?',
  'settings.lang':            'Language',
  'settings.sources':         'Data sources',
  'settings.notifier':        'Desktop notifications',
  'settings.notifier.on':     'On',
  'settings.notifier.off':    'Off',
  'settings.notifier.on.desc':  '1h / 10m / due — three-stage reminder',
  'settings.notifier.off.desc': 'Install as PWA for background triggers',
  'settings.notifier.enable':  'Enable',
  'settings.notifier.disable': 'Disable',
  'settings.notifier.denied':  'Browser blocks notifications — enable in site permissions.',
  'settings.notifier.unsupported': 'Notification API not supported.',
  'settings.broadcast':        'Broadcast · OBS',
  'settings.broadcast.title':  'Generate embed URL',
  'settings.broadcast.desc':   'Chroma / transparent / custom font — for OBS browser source',
  'settings.broadcast.open':   'Open',
  'settings.broadcast.close':  'Close',
  'settings.io':              'Import / Export',
  'settings.io.export':       'Export JSON',
  'settings.io.export.desc':  'Download {count} local tasks',
  'settings.io.import':       'Import JSON',
  'settings.io.import.desc':  'Merged by id · same format as subscriptions',
  'settings.io.import.done':  'Imported {count} tasks',
  'settings.io.import.fail':  'Import failed: {error}',
  'settings.io.theme.fail':   'Theme import failed: {error}',
  'settings.help':            'How to use · About',
  'settings.help.open':       'Open docs',
  'settings.help.open.desc':  '9 chapters · shortcuts / time presets / subscribe / OBS / PWA',
  'settings.about':           'Project',
  'settings.about.desc':      'CountDown · v{version} · fully serverless',

  /* Sources */
  'sources.local':       'Local',
  'sources.local.storage': 'On-device · localStorage',
  'sources.count':       '{count} items',
  'sources.url.label':   'URL',
  'sources.add':         'Add subscription',
  'sources.add.local':   'Add local source',
  'sources.add.url':     'Subscribe URL',
  'sources.subscribe.placeholder': 'https://example.com/todos.json',
  'sources.refresh':     'Refresh',
  'sources.refresh.now': 'Refresh now',
  'sources.delete':      'Delete source',
  'sources.delete.confirm': 'Remove subscription "{name}"? Its {count} tasks will be removed too.',
  'sources.enable':      'Enable',
  'sources.disable':     'Disable',
  'sources.toggle':      'Toggle enable',
  'sources.name.placeholder': 'Source name',
  'sources.last.ok':     'Synced {time}',
  'sources.last.error':  'Error: {error}',
  'sources.last.fetching': 'Syncing…',
  'sources.last.never':  'Not synced yet',
  'sources.add.title':   'Add subscription',
  'sources.add.name':    'Name (optional)',
  'sources.add.name.hint': 'e.g. Final exam prep',
  'sources.add.url.hint': 'https://example.com/countdown.json',
  'sources.add.cors':    'Target server must serve CORS headers.',
  'sources.add.submit':  'Add and sync',
  'sources.add.url.invalid': 'Please enter a valid URL.',
  'sources.add.json':    'Supported JSON shape:',

  /* Focus view */
  'focus.close':            'Close',
  'focus.close.hint':       'Close (Esc)',
  'focus.fullscreen':       'Browser fullscreen',
  'focus.fullscreen.hint':  'Enter browser fullscreen (F11)',
  'focus.unfullscreen':     'Exit browser fullscreen',
  'focus.unfullscreen.hint':'Exit browser fullscreen (F11)',
  'focus.overdue':          'Overdue',
  'focus.due':              'Due {at}',
  'focus.label.days':       'Days',
  'focus.label.hours':      'Hours',
  'focus.label.min':        'Min',
  'focus.label.sec':        'Sec',
  'focus.local':            'Local',

  /* Broadcast builder */
  'broadcast.task':       'Task',
  'broadcast.task.next':  'Next deadline (auto)',
  'broadcast.bg':         'Background',
  'broadcast.bg.theme':   'Theme color',
  'broadcast.bg.transparent': 'Transparent',
  'broadcast.bg.chroma':  'Chroma green',
  'broadcast.bg.black':   'Black',
  'broadcast.bg.white':   'White',
  'broadcast.font':       'Font',
  'broadcast.font.default': 'Theme default',
  'broadcast.scale':      'Scale',
  'broadcast.accent':     'Accent (hex)',
  'broadcast.title.show': 'Show title',
  'broadcast.url':        'URL',
  'broadcast.copy':       'Copy',
  'broadcast.copied':     'Copied',
  'broadcast.preview':    'Preview',

  /* Help docs */
  'help.title':       'Documentation',
  'help.toc':         'Contents',
  'help.toc.short':   'TOC',
  'help.back':        'Back',
  'help.prev':        'Previous',
  'help.next':        'Next',
  'help.intro':       'Read the chapters below or jump in with the home tab. Everything is local — no signup, no servers.',

  /* Search / filters */
  'search.placeholder': 'Search title or notes…',
  'filters.tags':     'Tags',
  'filters.sources':  'Sources',

  /* Common */
  'common.copy':      'Copy',
  'common.copied':    'Copied',
  'common.cancel':    'Cancel',
  'common.save':      'Save',
  'common.ok':        'OK',
  'common.delete':    'Delete',
  'common.lunar':     'Lunar calendar',
}

const ZH: Dict = {
  'tab.home':     '首页',
  'tab.all':      '全部',
  'tab.settings': '设置',

  'hero.next':    '下一个',
  'hero.overdue': '已过期',
  'hero.empty':   '还没有任务，下面新建一个。',

  'bucket.today':  '今天',
  'bucket.week':   '本周',
  'bucket.month':  '本月',
  'bucket.later':  '更远',
  'bucket.done':   '已完成',
  'bucket.range':  '未来 {days}d',

  'list.show':         '展开',
  'list.hide':         '收起',
  'list.clear':        '清空',
  'list.clear.confirm': '清空 {count} 个已完成任务？',
  'list.empty.search': '没有匹配的任务',
  'list.empty.none':   '还没有任务',
  'list.more.title':   '还有 {count} 个更远的任务',
  'list.loading':      '加载更多…',

  'row.complete':       '完成',
  'row.complete.hint':  '完成 (Space)',
  'row.uncomplete':     '标记未完成',
  'row.complete.once':  '完成本次',
  'row.done':           '完成',
  'row.more':           '更多',
  'row.pin':            '置顶',
  'row.unpin':          '取消置顶',
  'row.pinned':         '已置顶',
  'row.edit':           '编辑',
  'row.edit.parent':    '编辑原任务',
  'row.delete':         '删除',
  'row.delete.confirm': '删除「{title}」？',
  'row.recurring':      '重复任务',
  'row.focus':          '全屏专注',

  'recurrence.none':    '不重复',
  'recurrence.daily':   '每天',
  'recurrence.weekly':  '每周',
  'recurrence.monthly': '每月',
  'recurrence.custom':  '自定义',

  'composer.placeholder':       '新任务…',
  'composer.add':               '添加任务',
  'composer.add.hint':          '添加（无标题则默认 CountDown）',
  'composer.section.relative':  '相对时间',
  'composer.section.absolute':  '绝对时间',
  'composer.custom':            '自定义',
  'composer.custom.close':      '收起日历',
  'composer.time':              '时间',
  'composer.tag.remove':        '移除 #{tag}',

  'picker.year':  '年',
  'picker.month': '月',
  'picker.day':   '日',
  'picker.hour':  '时',
  'picker.min':   '分',

  'edit.title':         '编辑任务',
  'edit.title.input':   '任务标题',
  'edit.tags':          '标签',
  'edit.tags.hint':     '#工作 #学习',
  'edit.repeat':        '重复',
  'edit.cron.hint':     '格式 <code>分 时 日 月 周</code> · 支持 <code>*</code> · <code>n</code> · <code>n,m</code> · <code>a-b</code> · <code>*/k</code>',
  'edit.cron.invalid':  '无法解析的表达式',
  'edit.deadline':      '截止时间',
  'edit.created':       '创建时间',
  'edit.notes':         '备注 · Markdown',
  'edit.notes.placeholder': '**粗体** *斜体* `代码` - 列表 > 引用',
  'edit.notes.empty':   '（暂无内容）',
  'edit.notes.preview': '预览',
  'edit.notes.editor':  '编辑',
  'edit.save':          '保存',
  'edit.cancel':        '取消',
  'edit.save.hint':     '⌘ + Enter 保存',
  'edit.close':         '关闭',

  'preset.rel.5m':  '5分',
  'preset.rel.10m': '10分',
  'preset.rel.20m': '20分',
  'preset.rel.30m': '30分',
  'preset.rel.1h':  '1时',
  'preset.rel.2h':  '2时',

  'preset.abs.tonight':    '今晚',
  'preset.abs.tomorrow_am':'明早',
  'preset.abs.tomorrow_pm':'明晚',
  'preset.abs.weekend':    '周末',
  'preset.abs.next_week':  '下周一',
  'preset.rel.title':      '从添加时刻起 {label}',

  'settings.theme':           '主题',
  'settings.theme.import':    '导入主题文件',
  'settings.theme.import.desc': 'JSON 格式 · 见使用方法',
  'settings.theme.remove.confirm': '移除主题「{name}」？',
  'settings.lang':            '语言',
  'settings.sources':         '数据源',
  'settings.notifier':        '桌面通知',
  'settings.notifier.on':     '已开启',
  'settings.notifier.off':    '已关闭',
  'settings.notifier.on.desc':  '截止前 1 小时 / 10 分 / 当下三次提醒',
  'settings.notifier.off.desc': '安装为 PWA 后可后台触发',
  'settings.notifier.enable':  '启用',
  'settings.notifier.disable': '停用',
  'settings.notifier.denied':  '浏览器已禁用通知，请在地址栏左侧的权限里手动开启。',
  'settings.notifier.unsupported': '当前浏览器不支持通知 API。',
  'settings.broadcast':        '直播大屏 · OBS',
  'settings.broadcast.title':  '生成嵌入 URL',
  'settings.broadcast.desc':   '绿幕 / 透明 / 自定义字体 · 用于 OBS 浏览器源',
  'settings.broadcast.open':   '打开',
  'settings.broadcast.close':  '收起',
  'settings.io':              '导入 / 导出',
  'settings.io.export':       '导出 JSON',
  'settings.io.export.desc':  '下载 {count} 个本地任务',
  'settings.io.import':       '导入 JSON',
  'settings.io.import.desc':  '按 id 合并 · 与订阅同格式',
  'settings.io.import.done':  '已导入 {count} 个任务',
  'settings.io.import.fail':  '导入失败：{error}',
  'settings.io.theme.fail':   '主题导入失败：{error}',
  'settings.help':            '使用方法 · 关于',
  'settings.help.open':       '打开文档',
  'settings.help.open.desc':  '9 章 · 快捷键 / 时间预设 / 订阅 / OBS / PWA',
  'settings.about':           '项目',
  'settings.about.desc':      'CountDown · v{version} · 完全 Serverless',

  'sources.local':       '本地',
  'sources.local.storage': '本机存储 · localStorage',
  'sources.count':       '{count} 项',
  'sources.url.label':   'URL',
  'sources.add':         '添加订阅源',
  'sources.add.local':   '新增本地分组',
  'sources.add.url':     '订阅 URL',
  'sources.subscribe.placeholder': 'https://example.com/todos.json',
  'sources.refresh':     '刷新',
  'sources.refresh.now': '立即同步',
  'sources.delete':      '移除订阅',
  'sources.delete.confirm': '移除订阅源「{name}」？将同时删除其 {count} 条任务。',
  'sources.enable':      '启用',
  'sources.disable':     '停用',
  'sources.toggle':      '启用切换',
  'sources.name.placeholder': '数据源名称',
  'sources.last.ok':     '最近同步 {time}',
  'sources.last.error':  '错误：{error}',
  'sources.last.fetching': '同步中…',
  'sources.last.never':  '从未同步',
  'sources.add.title':   '添加订阅源',
  'sources.add.name':    '名称（可选）',
  'sources.add.name.hint': '例如 期末备考清单',
  'sources.add.url.hint': 'https://example.com/countdown.json',
  'sources.add.cors':    '需要目标服务器开启 CORS。',
  'sources.add.submit':  '添加并同步',
  'sources.add.url.invalid': '请输入有效的 URL。',
  'sources.add.json':    '支持的 JSON 结构：',

  'focus.close':            '关闭',
  'focus.close.hint':       '关闭 (Esc)',
  'focus.fullscreen':       '浏览器全屏',
  'focus.fullscreen.hint':  '进入浏览器全屏 (F11)',
  'focus.unfullscreen':     '退出浏览器全屏',
  'focus.unfullscreen.hint':'退出浏览器全屏 (F11)',
  'focus.overdue':          '已超时',
  'focus.due':              '截止 {at}',
  'focus.label.days':       'Days',
  'focus.label.hours':      'Hours',
  'focus.label.min':        'Min',
  'focus.label.sec':        'Sec',
  'focus.local':            '本地',

  'broadcast.task':       '任务',
  'broadcast.task.next':  '最近 DDL（动态跟随）',
  'broadcast.bg':         '背景',
  'broadcast.bg.theme':   '主题底色',
  'broadcast.bg.transparent': '透明',
  'broadcast.bg.chroma':  '绿幕',
  'broadcast.bg.black':   '纯黑',
  'broadcast.bg.white':   '纯白',
  'broadcast.font':       '字体',
  'broadcast.font.default': '主题默认',
  'broadcast.scale':      '缩放',
  'broadcast.accent':     '强调色（hex）',
  'broadcast.title.show': '显示标题',
  'broadcast.url':        'URL',
  'broadcast.copy':       '复制',
  'broadcast.copied':     '已复制',
  'broadcast.preview':    '预览',

  'help.title':       '使用文档',
  'help.toc':         '目录',
  'help.toc.short':   '目录',
  'help.back':        '返回',
  'help.prev':        '上一章',
  'help.next':        '下一章',
  'help.intro':       '下面是各章节，也可以直接回到首页开始用。一切只在本地——无注册、无服务器。',

  'search.placeholder': '搜索标题或备注…',
  'filters.tags':     '标签',
  'filters.sources':  '数据源',

  'common.copy':      '复制',
  'common.copied':    '已复制',
  'common.cancel':    '取消',
  'common.save':      '保存',
  'common.ok':        '好',
  'common.delete':    '删除',
  'common.lunar':     '农历',
}

const TR: Record<Lang, Dict> = { 'en': EN, 'zh-CN': ZH }

function interpolate(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s
  let out = s
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{${k}}`).join(String(v))
  }
  return out
}

/** React hook returning a translation function bound to the current
 *  language setting. */
export function useT() {
  const lang = useSettings((s) => s.lang)
  return (key: string, vars?: Record<string, string | number>): string => {
    const s = TR[lang]?.[key] ?? EN[key] ?? key
    return interpolate(s, vars)
  }
}

/** Synchronous lookup outside React (e.g. confirm dialogs, alerts). */
export function t(key: string, vars?: Record<string, string | number>): string {
  const lang = useSettings.getState().lang
  const s = TR[lang]?.[key] ?? EN[key] ?? key
  return interpolate(s, vars)
}
