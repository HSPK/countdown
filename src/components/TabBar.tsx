import { useSettings, type TabId } from '../store/settings'
import { useT } from '../lib/i18n'
import { IconHome, IconList, IconSettings } from './Icons'
import type { JSX } from 'react'

const TABS: Array<{ id: TabId; key: string; icon: () => JSX.Element }> = [
  { id: 'home',     key: 'tab.home',     icon: () => <IconHome     width={24} height={24} /> },
  { id: 'all',      key: 'tab.all',      icon: () => <IconList     width={24} height={24} /> },
  { id: 'settings', key: 'tab.settings', icon: () => <IconSettings width={24} height={24} /> },
]

export function TabBar() {
  const tab = useSettings((s) => s.tab)
  const setTab = useSettings((s) => s.setTab)
  const t = useT()
  return (
    <nav className="tabbar" role="tablist" aria-label={t('tab.settings')}>
      {TABS.map((tab_) => (
        <button
          key={tab_.id}
          role="tab"
          aria-selected={tab === tab_.id}
          className="tabbar__btn"
          onClick={() => setTab(tab_.id)}
        >
          <span className="tabbar__btn-inner">
            <span className="tabbar__btn-icon">{tab_.icon()}</span>
            <span className="tabbar__btn-label">{t(tab_.key)}</span>
          </span>
        </button>
      ))}
    </nav>
  )
}



