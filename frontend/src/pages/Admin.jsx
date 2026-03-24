import React, { useState } from 'react'
import StationProfileEditor from '../admin/StationProfileEditor'
import MenuManager from '../admin/MenuManager'
import UserManager from '../admin/UserManager'
import DaySettings from '../admin/DaySettings'
import Analytics from './Analytics'

const TABS = [
  { id: 'stations', label: 'Station Profiles' },
  { id: 'menu', label: 'Menu' },
  { id: 'users', label: 'Users' },
  { id: 'settings', label: 'Settings' },
  { id: 'analytics', label: 'Analytics' },
]

export default function Admin() {
  const [tab, setTab] = useState('stations')

  return (
    <div className="h-full overflow-y-auto">
      <h1 className="text-2xl tracking-wide font-black text-white mb-4">System Administration</h1>

      <div className="flex gap-4 mb-6 border-b border-zinc-800/80">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-2 py-2 text-xs font-semibold tracking-wide transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stations' && <StationProfileEditor />}
      {tab === 'menu' && <MenuManager />}
      {tab === 'users' && <UserManager />}
      {tab === 'settings' && <DaySettings />}
      {tab === 'analytics' && <Analytics />}
    </div>
  )
}
