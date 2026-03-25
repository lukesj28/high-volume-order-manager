import React, { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useDayStore } from '../store/dayStore'
import { updateDaySettings } from '../api/days'

export default function DaySettings() {
  const activeDay = useDayStore(s => s.activeDay)
  const setActiveDay = useDayStore(s => s.setActiveDay)

  const [offset, setOffset] = useState(15)
  const [interval, setInterval] = useState(15)
  const [taxRate, setTaxRate] = useState('13.00')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (activeDay) {
      setOffset(activeDay.defaultPickupOffsetMinutes ?? 15)
      setInterval(activeDay.pickupSlotIntervalMinutes ?? 15)
      setTaxRate((activeDay.taxRateBps / 100).toFixed(2))
    }
  }, [activeDay])

  const setIntervalAndBump = (v) => {
    setInterval(v)
    setOffset(prev => prev < v ? v : prev)
  }

  const mutation = useMutation({
    mutationFn: () => updateDaySettings({
      defaultPickupOffsetMinutes: offset,
      pickupSlotIntervalMinutes: interval,
      taxRateBps: Math.round(parseFloat(taxRate) * 100),
    }),
    onSuccess: (updatedDay) => {
      setActiveDay(updatedDay)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  })

  if (!activeDay) {
    return <p className="text-slate-400 text-sm">No active day. Open a day to configure settings.</p>
  }

  return (
    <div className="max-w-sm space-y-6">
      <div>
        <h2 className="text-base font-bold text-white mb-4">Pickup Time Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Default pickup offset (minutes)</label>
            <p className="text-slate-500 text-xs mb-1">How many minutes after order placement to default the pickup time</p>
            <input
              type="number" min={interval} max="120" className="input w-32"
              value={offset}
              onChange={e => setOffset(Number(e.target.value))}
            />
            {offset < interval && (
              <p className="text-amber-400 text-xs mt-1">Must be at least the slot interval ({interval} min)</p>
            )}
          </div>

          <div>
            <label className="label">Time slot grouping interval (minutes)</label>
            <p className="text-slate-500 text-xs mb-1">Orders on the board are grouped by this increment</p>
            <div className="flex gap-2 flex-wrap mt-1">
              {[5, 10, 15, 20, 30].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setIntervalAndBump(v)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all
                    ${interval === v
                      ? 'border-blue-500 bg-blue-600/20 text-white'
                      : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-400 hover:text-white'}`}
                >
                  {v} min
                </button>
              ))}
              <input
                type="number" min="1" max="60" className="input w-20 text-center"
                value={interval}
                onChange={e => setIntervalAndBump(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="label">Tax Rate (%)</label>
        <p className="text-slate-500 text-xs mb-1">Applied to all new orders (existing orders retain their rate)</p>
        <input
          type="number" min="0" max="100" step="0.01" className="input w-32"
          value={taxRate}
          onChange={e => setTaxRate(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          className="btn-primary py-2 px-6"
          disabled={mutation.isPending || offset < interval}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Saving…' : 'Save'}
        </button>
        {saved && <span className="text-green-400 text-sm">Saved!</span>}
        {mutation.isError && <span className="text-red-400 text-sm">Save failed</span>}
      </div>
    </div>
  )
}
