import { useSettings, type TabId } from '../store/settings'
import { IconHome, IconList, IconSettings } from './Icons'
import type { JSX } from 'react'

const TABS: Array<{ id: TabId; label: string; icon: () => JSX.Element }> = [
  { id: 'home',     label: '首页', icon: () => <IconHome     width={24} height={24} /> },
  { id: 'all',      label: '全部', icon: () => <IconList     width={24} height={24} /> },
  { id: 'settings', label: '设置', icon: () => <IconSettings width={24} height={24} /> },
]

export function TabBar() {
  const tab = useSettings((s) => s.tab)
  const setTab = useSettings((s) => s.setTab)
  return (
    <nav className="tabbar" role="tablist" aria-label="主导航">
      {TABS.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={tab === t.id}
          className="tabbar__btn"
          onClick={() => setTab(t.id)}
        >
          <span className="tabbar__btn-inner">
            <span className="tabbar__btn-icon">{t.icon()}</span>
            <span className="tabbar__btn-label">{t.label}</span>
          </span>
        </button>
      ))}
    </nav>
  )
}



