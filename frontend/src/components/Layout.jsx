import React from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useDayStore } from '../store/dayStore'
import { useWebSocket } from '../hooks/useWebSocket'
import { useOfflineQueue } from '../hooks/useOfflineQueue'
import ConnectionStatus from './ConnectionStatus'
import DayControls from './DayControls'
import Toast from './Toast'

export default function Layout() {
  const user = useAuthStore(s => s.user)
  const stationProfile = useAuthStore(s => s.stationProfile)
  const clearAuth = useAuthStore(s => s.clearAuth)
  const activeDay = useDayStore(s => s.activeDay)
  const navigate = useNavigate()
  const { connected } = useWebSocket()
  const { pendingCount } = useOfflineQueue()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="h-dvh flex flex-col">
      <header className="bg-black border-b border-zinc-800 px-3 py-1.5 flex items-center gap-4 flex-wrap">
        <button
          onClick={() => navigate('/select-station')}
          className="border-2 border-blue-600 text-blue-400 hover:bg-blue-600/20 text-[10px] tracking-widest uppercase font-bold px-2 py-0.5 transition-colors"
        >
          {stationProfile?.name ?? 'NO STATION'}
        </button>

        {user?.role === 'ADMIN' && (
          <nav className="flex gap-4 text-[11px] uppercase tracking-widest font-bold">
            <Link to="/admin" className="text-zinc-400 hover:text-white transition-colors">Admin</Link>
          </nav>
        )}

        <div className="flex-1" />

        <DayControls />

        <ConnectionStatus connected={connected} pendingCount={pendingCount} />
        {pendingCount > 0 && (
          <span className="bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 tracking-widest uppercase">
            {pendingCount} OFFLINE
          </span>
        )}

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{user?.username}</span>
          <button className="text-[10px] text-zinc-400 hover:text-white uppercase tracking-widest px-1 py-0.5" onClick={handleLogout}>LOGOUT</button>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-hidden p-3 flex flex-col">
        <Outlet />
      </main>

      <Toast />
    </div>
  )
}
