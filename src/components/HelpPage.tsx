import { useEffect } from 'react'
import { useSettings } from '../store/settings'
import { IconArrowLeft, IconChevronRight, IconBook } from './Icons'

interface Section {
  id: string
  title: string
  intro: string
  body: () => JSX.Element
}

const SECTIONS: Section[] = [
  {
    id: 'shortcuts',
    title: '快捷键',
    intro: '键盘 + 触摸手势的全部映射',
    body: () => (
      <ul className="help-list">
        <li><kbd>N</kbd> 聚焦输入框，开始新建任务</li>
        <li><kbd>Enter</kbd> 在主页面按下时进入最近 DDL 的全屏专注</li>
        <li><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> 切换 首页 / 全部 / 设置</li>
        <li><kbd>← →</kbd> 同上；触屏左右滑动同效；在文档页则翻页</li>
        <li><kbd>T</kbd> 循环切换主题</li>
        <li><kbd>Space</kbd> 当焦点落在任务行时，切换"完成 / 取消完成"</li>
        <li><kbd>Esc</kbd> 退出全屏 / 关闭弹层 / 收起当前输入面板</li>
      </ul>
    ),
  },
  {
    id: 'add',
    title: '新建任务',
    intro: '输入框、智能时间预设、#标签',
    body: () => (
      <>
        <p>
          点击底部输入框或按 <kbd>N</kbd> 唤起输入面板。在标题中输入
          <code>#标签</code> 加空格，标签会自动变成可关闭的 chip 内嵌在输入区。
        </p>
        <p>
          输入框右下角的"添加"按钮 <em>始终可用</em>。
          标题为空时点击会创建一个默认名为 <strong>CountDown</strong> 的任务，便于先放进列表再补内容。
        </p>
        <p>时间分两类：</p>
        <ul className="help-list">
          <li><strong>相对时间</strong>（5 / 10 / 20 / 30 分钟、1 / 2 小时）— 从你按"添加"那一刻起计时</li>
          <li><strong>绝对时间</strong>（今晚 / 明早 / 明晚 / 周末 / 下周一）— 智能解析为绝对时间，<em>当下时间</em>变化时这些 chip 会自动刷新</li>
          <li><strong>自定义</strong> — 内嵌日历 + HH:MM 输入 + 5 个常用时刻 chip</li>
        </ul>
      </>
    ),
  },
  {
    id: 'recurrence',
    title: '重复任务',
    intro: '每天 / 每周 / 每月 的工作机制',
    body: () => (
      <>
        <p>
          在编辑弹层选择 <strong>每天 / 每周 / 每月</strong>。打勾完成时不会归档，而是把截止时间向前推一个周期。
        </p>
        <p>避免堆积历史记录、保持视图整洁。需要中断重复请把它改回"不重复"再完成。</p>
      </>
    ),
  },
  {
    id: 'themes',
    title: '主题文件',
    intro: '通过 JSON 配置自定义主题',
    body: () => (
      <>
        <p>
          除了 4 个内置主题，可以加载用 JSON 描述的自定义主题。从文件上传或订阅 URL 都行。
        </p>
        <pre className="help-pre">{`{
  "id": "ocean",
  "name": "Ocean",
  "hint": "light · blue",
  "base": "mono-light",
  "tokens": {
    "--bg":     "#F0F4F8",
    "--bg-2":   "#E2EAF2",
    "--fg":     "#0A2540",
    "--fg-2":   "#445B73",
    "--accent": "#0070BA"
  }
}`}</pre>
        <ul className="help-list">
          <li><code>tokens</code> 是 CSS 变量映射；前缀 <code>--</code> 可省，自动补上</li>
          <li><code>base</code> 指定基础主题；未指定的 token 自动继承自该基础</li>
          <li><code>id</code> 是切换主题用的唯一标识；省略时会自动生成</li>
        </ul>
      </>
    ),
  },
  {
    id: 'sources',
    title: '数据源订阅',
    intro: '把远端 JSON 当作只读任务源',
    body: () => (
      <>
        <p>
          除了本机任务，可以订阅一个或多个返回 JSON 的 URL。订阅来的任务带数据源徽章，只读。
        </p>
        <pre className="help-pre">{`{
  "name": "期末备考",
  "todos": [
    {
      "id": "midterm-cs",
      "title": "计算机系统期中",
      "deadline": "2026-06-15T18:00:00Z",
      "tags": ["学习"],
      "notes": "**重点：** 缓存一致性、虚拟内存"
    }
  ]
}`}</pre>
        <ul className="help-list">
          <li>顶层可以是 <code>{`{ todos: [...] }`}</code>，也可以直接是数组</li>
          <li>时间字段接受毫秒数字或 ISO 8601 字符串</li>
          <li>订阅源需要开启 CORS 才能被浏览器抓取</li>
        </ul>
      </>
    ),
  },
  {
    id: 'broadcast',
    title: '直播大屏 / OBS',
    intro: 'URL 参数化的全屏倒计时叠加',
    body: () => (
      <>
        <p>
          单独的 URL <code>?broadcast=&lt;todoId&gt;</code> 进入全屏倒计时模式，无任何 UI 控件，可作为
          <em>浏览器源</em> 嵌入 OBS / vMix。
        </p>
        <p>所有可用参数：</p>
        <table className="help-table">
          <tbody>
            <tr><td><code>broadcast</code></td><td>任务 ID 或 <code>next</code>（最近 DDL，动态跟随）</td></tr>
            <tr><td><code>theme</code></td><td><code>mono-light</code> / <code>mono-dark</code> / <code>paper</code> / <code>cyberpunk</code></td></tr>
            <tr><td><code>bg</code></td><td><code>theme</code> / <code>transparent</code> / <code>chroma</code>（绿幕）/ <code>black</code> / <code>white</code> / <code>#hex</code></td></tr>
            <tr><td><code>font</code></td><td><code>sans</code> / <code>serif</code> / <code>mono</code></td></tr>
            <tr><td><code>accent</code></td><td><code>#hex</code> 覆盖数字颜色</td></tr>
            <tr><td><code>scale</code></td><td><code>0.5 ~ 2</code> 字号倍率</td></tr>
            <tr><td><code>title</code></td><td><code>show</code>（默认）/ <code>hide</code></td></tr>
          </tbody>
        </table>
        <p>设置 → 直播大屏 · OBS 内嵌生成器可直接生成并复制 URL。</p>
      </>
    ),
  },
  {
    id: 'notifications',
    title: '桌面通知',
    intro: '截止前 1 小时 / 10 分钟 / 当下',
    body: () => (
      <>
        <p>
          在设置中开启后，浏览器会在以下时点发出系统通知：
        </p>
        <ul className="help-list">
          <li>截止前 1 小时</li>
          <li>截止前 10 分钟</li>
          <li>到截止时刻</li>
        </ul>
        <p>
          每个阈值每个任务只触发一次（去重持久化）。需要保持网页运行；
          安装为 PWA 后可以更稳地后台运行。
        </p>
      </>
    ),
  },
  {
    id: 'pwa',
    title: 'PWA 安装',
    intro: '装到桌面 / 手机主屏，离线可用',
    body: () => (
      <>
        <p>
          Countdown 是渐进式 Web 应用（PWA），可以安装为桌面 / 移动端独立应用。
        </p>
        <ul className="help-list">
          <li><strong>Chrome / Edge</strong>：地址栏右侧 <em>安装应用</em> 图标</li>
          <li><strong>Safari (iOS)</strong>：分享 → 添加到主屏幕</li>
          <li>安装后离线可用，关闭浏览器也能弹通知</li>
        </ul>
      </>
    ),
  },
  {
    id: 'data',
    title: '数据导入 / 导出',
    intro: '导出 JSON · 按 id 合并 · 远端同步',
    body: () => (
      <>
        <p>
          所有本地任务可导出为 JSON 文件，文件名格式
          <code>countdown-YYYY-MM-DD.json</code>。导入时按 <code>id</code> 合并：相同 id 会被新文件覆盖；不存在的 id 直接追加。
        </p>
        <p>导出与订阅采用相同 Schema，意味着可以把自己的导出文件托管到任何静态空间，再用 URL 订阅回来在多端同步。</p>
      </>
    ),
  },
]

function pad2(n: number): string { return n < 10 ? '0' + n : String(n) }

export function HelpPage() {
  const helpSection = useSettings((s) => s.helpSection)
  const setHelp = useSettings((s) => s.setHelp)

  const onToc = helpSection === 'toc'
  const idx = onToc ? -1 : SECTIONS.findIndex((s) => s.id === helpSection)

  useEffect(() => {
    if (helpSection === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setHelp(null); return }
      if (onToc) return
      if (e.key === 'ArrowLeft' && idx > 0) {
        e.stopPropagation(); setHelp(SECTIONS[idx - 1].id)
      }
      if (e.key === 'ArrowRight' && idx < SECTIONS.length - 1) {
        e.stopPropagation(); setHelp(SECTIONS[idx + 1].id)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [helpSection, onToc, idx, setHelp])

  if (helpSection === null) return null

  return (
    <div className="help" role="dialog" aria-modal="true" aria-label="使用方法">
      <div className="help__top">
        <button
          className="help__back"
          aria-label="返回"
          title="返回 (Esc)"
          onClick={() => setHelp(null)}
        >
          <IconArrowLeft />
        </button>
        <span className="help__top-title">使用方法</span>
        <span className="help__top-spacer" />
        <button
          className={'help__toc-btn' + (onToc ? ' help__toc-btn--active' : '')}
          aria-label="目录"
          title="目录"
          onClick={() => setHelp('toc')}
          aria-pressed={onToc}
        >
          <IconBook width={14} height={14} />
          <span>目录</span>
        </button>
        {!onToc && (
          <span
            className="help__indicator"
            aria-label={`第 ${idx + 1} 页 / 共 ${SECTIONS.length} 页`}
          >
            <span className="help__indicator-num">{pad2(idx + 1)}</span>
            <span className="help__indicator-sep">/</span>
            <span className="help__indicator-total">{pad2(SECTIONS.length)}</span>
          </span>
        )}
      </div>

      <div className="help__scroll">
        {onToc ? <TocView onPick={(id) => setHelp(id)} /> : (
          <article className="help__page" key={SECTIONS[idx].id}>
            <div className="help__page-eyebrow">{pad2(idx + 1)} · {SECTIONS[idx].title}</div>
            <h2 className="help__heading">{SECTIONS[idx].title}</h2>
            <div className="help__content">{SECTIONS[idx].body()}</div>
          </article>
        )}
      </div>

      {!onToc && (
        <nav className="help__nav" aria-label="文档分页">
          <button
            className="help__nav-btn help__nav-btn--prev"
            disabled={idx <= 0}
            onClick={() => idx > 0 && setHelp(SECTIONS[idx - 1].id)}
            aria-label={idx > 0 ? `上一页：${SECTIONS[idx - 1].title}` : '已是第一页'}
          >
            <IconArrowLeft />
            {idx > 0 && (
              <span className="help__nav-label">
                <span className="help__nav-eyebrow">上一页</span>
                <span className="help__nav-title">{SECTIONS[idx - 1].title}</span>
              </span>
            )}
          </button>

          <div className="help__dots" role="tablist" aria-label="分页指示器">
            {SECTIONS.map((s, i) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={i === idx}
                aria-label={`${s.title}（${i + 1} / ${SECTIONS.length}）`}
                title={s.title}
                className={'help__dot' + (i === idx ? ' help__dot--active' : '')}
                onClick={() => setHelp(s.id)}
              />
            ))}
          </div>

          <button
            className="help__nav-btn help__nav-btn--next"
            disabled={idx < 0 || idx >= SECTIONS.length - 1}
            onClick={() => idx >= 0 && idx < SECTIONS.length - 1 && setHelp(SECTIONS[idx + 1].id)}
            aria-label={idx < SECTIONS.length - 1 ? `下一页：${SECTIONS[idx + 1].title}` : '已是最后一页'}
          >
            {idx >= 0 && idx < SECTIONS.length - 1 && (
              <span className="help__nav-label" style={{ textAlign: 'right' }}>
                <span className="help__nav-eyebrow">下一页</span>
                <span className="help__nav-title">{SECTIONS[idx + 1].title}</span>
              </span>
            )}
            <IconChevronRight />
          </button>
        </nav>
      )}
    </div>
  )
}

function TocView({ onPick }: { onPick: (id: string) => void }) {
  return (
    <article className="help__page" key="toc">
      <div className="help__page-eyebrow">目录</div>
      <h2 className="help__heading">使用方法</h2>
      <p style={{ fontSize: 14, color: 'var(--fg-muted)', marginTop: 4, marginBottom: 22 }}>
        共 {SECTIONS.length} 章 — 点击任意条目跳到该页，或用 <kbd>← →</kbd> 翻页
      </p>
      <ol className="toc-list">
        {SECTIONS.map((s, i) => (
          <li key={s.id} className="toc-item" onClick={() => onPick(s.id)}>
            <span className="toc-num">{pad2(i + 1)}</span>
            <span className="toc-body">
              <span className="toc-title">{s.title}</span>
              <span className="toc-intro">{s.intro}</span>
            </span>
            <span className="toc-arrow" aria-hidden><IconChevronRight width={14} height={14} /></span>
          </li>
        ))}
      </ol>
    </article>
  )
}
