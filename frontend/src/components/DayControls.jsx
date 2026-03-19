import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { openDay, closeDay } from '../api/days'
import { useDayStore } from '../store/dayStore'

export default function DayControls() {
  const activeDay = useDayStore(s => s.activeDay)
  const setActiveDay = useDayStore(s => s.setActiveDay)
  const clearDay = useDayStore(s => s.clearDay)
  const [label, setLabel] = useState('')
  const [showOpen, setShowOpen] = useState(false)

  const openMutation = useMutation({
    mutationFn: () => openDay(label || null),
    onSuccess: (day) => { setActiveDay(day); setShowOpen(false); setLabel('') }
  })

  const closeMutation = useMutation({
    mutationFn: closeDay,
    onSuccess: () => clearDay()
  })

  if (!activeDay) {
    return (
      <div className="flex items-center gap-2">
        {showOpen ? (
          <>
            <input
              className="input text-sm py-1 w-40"
              placeholder="Label (optional)"
              value={label}
              onChange={e => setLabel(e.target.value)}
            />
            <button className="btn-success text-sm py-1" onClick={() => openMutation.mutate()}>
              Open Day
            </button>
            <button className="btn-ghost text-sm py-1" onClick={() => setShowOpen(false)}>
              Cancel
            </button>
          </>
        ) : (
          <button className="btn-primary text-sm py-1" onClick={() => setShowOpen(true)}>
            Open Day
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-green-400 font-semibold">
        Day Open {activeDay.label ? `· ${activeDay.label}` : ''}
      </span>
      <button
        className="btn-danger text-sm py-1"
        onClick={() => { if (window.confirm('Close the current day? This cannot be undone.')) closeMutation.mutate() }}
      >
        Close Day
      </button>
    </div>
  )
}
