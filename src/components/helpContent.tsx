import type { JSX } from 'react'

/* Help-doc content lives here, kept out of HelpPage.tsx so each chapter
   stays focused. Each language exports a parallel SECTIONS array. */

export interface HelpSection {
  id: string
  title: string
  intro: string
  body: () => JSX.Element
}

const SECTIONS_EN: HelpSection[] = [
  {
    id: 'shortcuts',
    title: 'Shortcuts',
    intro: 'Keyboard + touch gesture map',
    body: () => (
      <ul className="help-list">
        <li><kbd>N</kbd> — focus composer, start a new task</li>
        <li><kbd>Enter</kbd> — on the main page, enter focus mode on the next due task</li>
        <li><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> — Home / All / Settings</li>
        <li><kbd>← →</kbd> — same as 1/2/3; touch left/right swipe equivalent; on docs page these flip pages</li>
        <li><kbd>T</kbd> — cycle through themes</li>
        <li><kbd>Space</kbd> — toggle complete/incomplete on the focused row</li>
        <li><kbd>Esc</kbd> — leave fullscreen / close popover / collapse composer</li>
      </ul>
    ),
  },
  {
    id: 'add',
    title: 'New task',
    intro: 'Composer, smart time presets, #tags',
    body: () => (
      <>
        <p>
          Click the composer at the bottom or press <kbd>N</kbd> to open the input panel. Type
          <code>#tag</code> followed by a space and the tag converts into a removable chip
          inline inside the input.
        </p>
        <p>
          The Add button in the corner is <em>always available</em>. Submitting with an empty
          title creates a task named <strong>CountDown</strong> — drop it in first, name it later.
        </p>
        <p>Two time families:</p>
        <ul className="help-list">
          <li><strong>Relative</strong> (5 / 10 / 20 / 30 min, 1 / 2 h) — counted from the moment you press Add</li>
          <li><strong>Absolute</strong> (Tonight / Tmrw morning / Tmrw evening / Weekend / Next Mon) — these chips re-resolve as the clock advances</li>
          <li><strong>Custom</strong> — embedded wheel picker with date + time + lunar label</li>
        </ul>
      </>
    ),
  },
  {
    id: 'recurrence',
    title: 'Recurring tasks',
    intro: 'How daily / weekly / monthly / cron work',
    body: () => (
      <>
        <p>
          In the edit modal, pick <strong>Daily / Weekly / Monthly</strong> or a custom cron expression.
          Checking a recurring task does not archive it — instead it pushes the deadline forward by one cycle.
        </p>
        <p>
          The list now shows every upcoming occurrence inside the visible window, so a daily
          task becomes a row per day. The All tab pages further out as you scroll.
        </p>
        <p>
          Custom uses standard 5-field cron <code>min hour dom mon dow</code> supporting
          <code>*</code>, <code>n</code>, lists <code>n,m</code>, ranges <code>a-b</code>, and steps <code>*/k</code>.
        </p>
      </>
    ),
  },
  {
    id: 'themes',
    title: 'Custom themes',
    intro: 'JSON files that override CSS variables',
    body: () => (
      <>
        <p>
          On top of the 5 built-in themes you can load custom themes described in JSON,
          either from a file or a subscription URL.
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
          <li><code>tokens</code> maps CSS variable names; the leading <code>--</code> is auto-added if missing</li>
          <li><code>base</code> picks a built-in to inherit from; unspecified tokens fall through</li>
          <li><code>id</code> is the unique key used when switching themes; auto-generated when omitted</li>
        </ul>
      </>
    ),
  },
  {
    id: 'sources',
    title: 'Subscription sources',
    intro: 'Treat a remote JSON as a read-only task source',
    body: () => (
      <>
        <p>
          Besides local tasks, you can subscribe to one or more URLs that return JSON. Subscribed
          tasks carry a source badge and are read-only.
        </p>
        <pre className="help-pre">{`{
  "name": "Finals prep",
  "todos": [
    {
      "id": "midterm-cs",
      "title": "Computer Systems midterm",
      "deadline": "2026-06-15T18:00:00Z",
      "tags": ["study"],
      "notes": "**Focus:** cache coherency, virtual memory"
    }
  ]
}`}</pre>
        <ul className="help-list">
          <li>The top level may be <code>{`{ todos: [...] }`}</code> or a bare array</li>
          <li>Time fields accept ms numbers or ISO 8601 strings</li>
          <li>The source must serve CORS headers for the browser to fetch it</li>
        </ul>
      </>
    ),
  },
  {
    id: 'broadcast',
    title: 'Broadcast / OBS',
    intro: 'URL-parameterized fullscreen countdown overlay',
    body: () => (
      <>
        <p>
          The standalone URL <code>?broadcast=&lt;todoId&gt;</code> renders a chrome-free
          fullscreen countdown — drop it into OBS / vMix as a <em>browser source</em>.
        </p>
        <p>All parameters:</p>
        <table className="help-table">
          <tbody>
            <tr><td><code>broadcast</code></td><td>task id, or <code>next</code> (auto-follow next DDL)</td></tr>
            <tr><td><code>theme</code></td><td><code>mono-light</code> / <code>mono-dark</code> / <code>paper</code> / <code>cyberpunk</code> / <code>flip</code></td></tr>
            <tr><td><code>bg</code></td><td><code>theme</code> / <code>transparent</code> / <code>chroma</code> (green) / <code>black</code> / <code>white</code> / <code>#hex</code></td></tr>
            <tr><td><code>font</code></td><td><code>sans</code> / <code>serif</code> / <code>mono</code></td></tr>
            <tr><td><code>accent</code></td><td><code>#hex</code> override for the digit color</td></tr>
            <tr><td><code>scale</code></td><td><code>0.5 – 2</code> font-size multiplier</td></tr>
            <tr><td><code>title</code></td><td><code>show</code> (default) / <code>hide</code></td></tr>
          </tbody>
        </table>
        <p>Settings → Broadcast · OBS has a built-in generator that builds and copies the URL.</p>
      </>
    ),
  },
  {
    id: 'notifications',
    title: 'Desktop notifications',
    intro: '1h before / 10m before / due moment',
    body: () => (
      <>
        <p>Once enabled in Settings, the browser fires system notifications at:</p>
        <ul className="help-list">
          <li>1 hour before the deadline</li>
          <li>10 minutes before</li>
          <li>at the deadline</li>
        </ul>
        <p>
          Each threshold fires once per task (deduped + persisted). The page must be running;
          installing as a PWA gives more reliable background behavior.
        </p>
      </>
    ),
  },
  {
    id: 'pwa',
    title: 'PWA install',
    intro: 'Install to desktop / homescreen, works offline',
    body: () => (
      <>
        <p>
          CountDown is a Progressive Web App. You can install it as a standalone desktop or
          mobile application.
        </p>
        <ul className="help-list">
          <li><strong>Chrome / Edge</strong>: <em>Install app</em> icon in the address bar</li>
          <li><strong>Safari (iOS)</strong>: Share → Add to Home Screen</li>
          <li>Works offline after install; notifications fire even with the browser closed</li>
        </ul>
      </>
    ),
  },
  {
    id: 'data',
    title: 'Import / Export',
    intro: 'Export JSON · merge by id · sync via URL',
    body: () => (
      <>
        <p>
          All local tasks can be exported as JSON. Filename:
          <code>countdown-YYYY-MM-DD.json</code>. Import merges by <code>id</code> —
          existing rows are replaced; new ids are appended.
        </p>
        <p>
          Export and subscription share the same schema, so you can host your own export
          on any static endpoint and subscribe back to it on other devices.
        </p>
      </>
    ),
  },
]

const SECTIONS_ZH: HelpSection[] = [
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
          <li><strong>绝对时间</strong>（今晚 / 明早 / 明晚 / 周末 / 下周一）— 智能解析为绝对时间</li>
          <li><strong>自定义</strong> — 内嵌滑动选择器，含日期/时间/农历显示</li>
        </ul>
      </>
    ),
  },
  {
    id: 'recurrence',
    title: '重复任务',
    intro: '每天 / 每周 / 每月 / cron 的工作机制',
    body: () => (
      <>
        <p>
          在编辑弹层选择 <strong>每天 / 每周 / 每月</strong> 或自定义 cron 表达式。
          打勾完成时不会归档，而是把截止时间向前推一个周期。
        </p>
        <p>
          列表会把每一次未来发生都展开成一行，所以一个"每天"任务会变成每天一行。
          全部 tab 下滚加载更远期的发生。
        </p>
        <p>
          自定义采用标准 5 字段 cron <code>分 时 日 月 周</code>，支持
          <code>*</code>、<code>n</code>、列表 <code>n,m</code>、范围 <code>a-b</code>、步长 <code>*/k</code>。
        </p>
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
          除了 5 个内置主题，可以加载用 JSON 描述的自定义主题。从文件上传或订阅 URL 都行。
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
            <tr><td><code>theme</code></td><td><code>mono-light</code> / <code>mono-dark</code> / <code>paper</code> / <code>cyberpunk</code> / <code>flip</code></td></tr>
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
        <p>在设置中开启后，浏览器会在以下时点发出系统通知：</p>
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
          CountDown 是渐进式 Web 应用（PWA），可以安装为桌面 / 移动端独立应用。
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

import type { Lang } from '../lib/i18n'

export function getSections(lang: Lang): HelpSection[] {
  return lang === 'zh-CN' ? SECTIONS_ZH : SECTIONS_EN
}
