import React from 'react'
import { useMutation } from '@tanstack/react-query'
import { openDay, closeDay } from '../api/days'
import { useDayStore } from '../store/dayStore'
import { useAuthStore } from '../store/authStore'

export default function DayControls() {
  const activeDay = useDayStore(s => s.activeDay)
  const setActiveDay = useDayStore(s => s.setActiveDay)
  const clearDay = useDayStore(s => s.clearDay)
  const isAdmin = useAuthStore(s => s.user?.role === 'ADMIN')

  const openMutation = useMutation({
    mutationFn: openDay,
    onSuccess: (day) => setActiveDay(day)
  })

  const closeMutation = useMutation({
    mutationFn: closeDay,
    onSuccess: () => clearDay()
  })

  if (!activeDay) {
    if (!isAdmin) return null
    return (
      <button
        className="btn-success text-sm py-1"
        disabled={openMutation.isPending}
        onClick={() => openMutation.mutate()}
      >
        Open Day
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-green-400 font-semibold">Day Open</span>
      {isAdmin && (
        <button
          className="btn-danger text-sm py-1"
          disabled={closeMutation.isPending}
          onClick={() => { if (window.confirm('Close the current day? This cannot be undone.')) closeMutation.mutate() }}
        >
          Close Day
        </button>
      )}
    </div>
  )
}
