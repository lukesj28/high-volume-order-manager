import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { updateStatus } from '../api/orders'
import { useOrdersStore } from '../store/ordersStore'
import { useAuthStore } from '../store/authStore'
import { canTransition, requiresConfirmation } from '../utils/stateMachine'
import { formatCAD } from '../utils/formatters'
import ConfirmModal from './ConfirmModal'

const STATUS_STYLE = {
  PENDING:     'border-l-amber-500 bg-slate-800/80',
  IN_PROGRESS: 'border-l-blue-500 bg-blue-950/40',
  COMPLETED:   'border-l-slate-600 bg-slate-800/30 opacity-50',
}

export default function OrderCard({ order }) {
  const stationProfile = useAuthStore(s => s.stationProfile)
  const upsertOrder = useOrdersStore(s => s.upsertOrder)
  const [confirming, setConfirming] = useState(false)

  const mutation = useMutation({
    mutationFn: ({ status, confirmed }) => updateStatus(order.id, status, confirmed),
    onSuccess: (updated) => upsertOrder(updated)
  })

  const nextState = (() => {
    if (canTransition(order.status, 'IN_PROGRESS', stationProfile)) return 'IN_PROGRESS'
    if (canTransition(order.status, 'COMPLETED', stationProfile)) return 'COMPLETED'
    return null
  })()

  const handleTap = () => {
    if (!nextState || mutation.isPending) return
    if (requiresConfirmation(order.status, nextState, stationProfile)) {
      setConfirming(true)
    } else {
      mutation.mutate({ status: nextState, confirmed: false })
    }
  }

  const handleConfirm = () => {
    mutation.mutate({ status: nextState, confirmed: true })
    setConfirming(false)
  }

  const isActionable = !!nextState && !mutation.isPending

  return (
    <>
      <div
        onClick={handleTap}
        className={`border-l-4 rounded-r-lg px-3 py-2 space-y-1.5 transition-all
          ${STATUS_STYLE[order.status] ?? 'border-l-slate-600 bg-slate-800'}
          ${isActionable ? 'cursor-pointer hover:brightness-125 active:scale-[0.98]' : ''}
          ${mutation.isPending ? 'opacity-60' : ''}`}
      >
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-white leading-none tabular-nums">
            #{order.ticketNumber}
          </span>
          {order.pickupName && (
            <span className="text-sm font-semibold text-slate-200 truncate">
              {order.pickupName}
            </span>
          )}
          {order.sourceApp && (
            <span className="text-xs text-slate-400 ml-auto flex-shrink-0">
              {order.sourceApp}
            </span>
          )}
        </div>

        <ul className="space-y-0.5">
          {order.items.map(item => (
            <li key={item.id} className="text-sm text-slate-200 flex gap-2">
              <span className="font-black text-white tabular-nums w-5 text-right flex-shrink-0">
                {item.quantity}×
              </span>
              <span>{item.menuItemName}</span>
            </li>
          ))}
        </ul>

        <div className="flex justify-end pt-0.5">
          <span className="text-sm font-bold text-slate-300">
            {formatCAD(order.totalPrice)}
          </span>
        </div>
      </div>

      {confirming && (
        <ConfirmModal
          title="Skip to Completed?"
          message={`Order #${order.ticketNumber} hasn't been marked In Progress yet. Complete it anyway?`}
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  )
}
