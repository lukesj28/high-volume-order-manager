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
    <div className="h-screen flex flex-col">
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center gap-4 flex-wrap">
        <span className="font-black text-lg text-white tracking-tight">F&C POS</span>

        <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
          {stationProfile?.name ?? 'No Station'}
        </span>

        <nav className="flex gap-2 text-sm">
          <Link to="/pos" className="text-slate-300 hover:text-white transition-colors">Station</Link>
          {user?.role === 'ADMIN' && (
            <>
              <Link to="/admin" className="text-slate-300 hover:text-white transition-colors">Admin</Link>
              <Link to="/analytics" className="text-slate-300 hover:text-white transition-colors">Analytics</Link>
            </>
          )}
        </nav>

        <div className="flex-1" />

        <DayControls />

        <ConnectionStatus connected={connected} pendingCount={pendingCount} />
        {pendingCount > 0 && (
          <span className="bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
            {pendingCount} offline
          </span>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{user?.username}</span>
          <button className="btn-ghost text-xs py-1 px-2" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-hidden p-4 flex flex-col">
        <Outlet />
      </main>

      <Toast />
    </div>
  )
}
