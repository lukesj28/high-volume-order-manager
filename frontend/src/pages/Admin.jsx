import React, { useState } from 'react'
import StationProfileEditor from '../admin/StationProfileEditor'
import MenuManager from '../admin/MenuManager'
import UserManager from '../admin/UserManager'
import DaySettings from '../admin/DaySettings'

const TABS = [
  { id: 'stations', label: 'Station Profiles' },
  { id: 'menu', label: 'Menu' },
  { id: 'users', label: 'Users' },
  { id: 'settings', label: 'Settings' },
]

export default function Admin() {
  const [tab, setTab] = useState('stations')

  return (
    <div className="h-full overflow-y-auto">
      <h1 className="text-2xl font-black text-white mb-4">Admin</h1>

      <div className="flex gap-1 mb-6 border-b border-slate-700">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
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
    </div>
  )
}
