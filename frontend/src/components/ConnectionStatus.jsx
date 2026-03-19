import React, { useState, useEffect } from 'react'

export default function ConnectionStatus({ connected, pendingCount }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-red-400 font-semibold">
          OFFLINE {pendingCount > 0 ? `— ${pendingCount} queued` : ''}
        </span>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-amber-400">Reconnecting…</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-2 h-2 rounded-full bg-green-400" />
      <span className="text-green-400">Live</span>
    </div>
  )
}
