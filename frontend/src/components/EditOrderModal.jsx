import React, { useState } from 'react'
import { timeValueToISOToday, isoToTimeValue } from '../utils/formatters'

export default function EditOrderModal({ order, menu, streamOptions, onSave, onCancel }) {
  const [items, setItems] = useState(() => {
    const map = {}
    for (const item of order.items) {
      map[item.menuItemId] = item.quantity
    }
    return map
  })
  const [pickupName, setPickupName] = useState(order.pickupName ?? '')
  const [targetStation, setTargetStation] = useState(order.targetStation ?? null)
  const [pickupTime, setPickupTime] = useState(() => isoToTimeValue(order.pickupTime))
  const [showAddPanel, setShowAddPanel] = useState(false)

  const setQty = (menuItemId, qty) => {
    setItems(prev => {
      if (qty <= 0) {
        const { [menuItemId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [menuItemId]: qty }
    })
  }

  const handleSave = () => {
    const itemList = Object.entries(items)
      .filter(([, qty]) => qty > 0)
      .map(([menuItemId, quantity]) => ({ menuItemId, quantity }))
    if (itemList.length === 0) return
    onSave({
      items: itemList,
      pickupName: pickupName.trim() || null,
      sourceApp: order.sourceApp ?? null,
      targetStation: targetStation || null,
      pickupTime: pickupTime ? timeValueToISOToday(pickupTime) : order.pickupTime,
    })
  }

  const presentItems = menu.filter(m => (items[m.id] ?? 0) > 0)
  const addableItems = menu.filter(m => !(items[m.id] > 0))

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 w-96 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-white text-base tracking-wide">
          Edit Order #{order.ticketNumber}
        </h3>

        <div className="space-y-2">
          {presentItems.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <span className="flex-1 text-sm font-medium text-zinc-200">{item.name}</span>
              <button
                onClick={() => setQty(item.id, (items[item.id] ?? 0) - 1)}
                className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 rounded-md flex items-center justify-center text-white font-bold"
              >−</button>
              <span className="w-6 text-center text-sm font-mono font-semibold text-blue-300 tabular-nums">
                {items[item.id] ?? 0}
              </span>
              <button
                onClick={() => setQty(item.id, (items[item.id] ?? 0) + 1)}
                className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 rounded-md flex items-center justify-center text-white font-bold"
              >+</button>
              <button
                onClick={() => setQty(item.id, 0)}
                className="text-zinc-600 hover:text-red-400 text-sm leading-none px-1"
              >×</button>
            </div>
          ))}

          <button
            onClick={() => setShowAddPanel(p => !p)}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            + Add item
          </button>

          {showAddPanel && addableItems.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1 p-2 bg-zinc-800/60 rounded-xl border border-zinc-700/50">
              {addableItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setQty(item.id, 1); setShowAddPanel(false) }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-600 bg-zinc-800 text-zinc-300 hover:border-blue-500 hover:text-white transition-all"
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="label">Pickup Time</label>
          <input
            type="time"
            className="input w-full"
            value={pickupTime}
            onChange={e => setPickupTime(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Customer Name / Code</label>
          <input
            className="input"
            placeholder="e.g. Smith or #47"
            value={pickupName}
            onChange={e => setPickupName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>

        {streamOptions.length > 0 && (
          <div>
            <label className="label">Route to</label>
            <div className="flex gap-2 mt-1">
              {streamOptions.map(opt => (
                <button
                  key={opt.station}
                  type="button"
                  onClick={() => setTargetStation(targetStation === opt.station ? null : opt.station)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all
                    ${targetStation === opt.station
                      ? 'border-blue-500 bg-blue-600/20 text-white'
                      : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-400 hover:text-white'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button className="btn-primary flex-1 py-2" onClick={handleSave}>Save</button>
          <button className="btn-ghost flex-1 py-2" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
