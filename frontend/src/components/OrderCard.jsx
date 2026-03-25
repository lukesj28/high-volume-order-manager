import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { updateStatus } from '../api/orders'
import { useOrdersStore } from '../store/ordersStore'
import { useAuthStore } from '../store/authStore'
import { canTransition, requiresConfirmation } from '../utils/stateMachine'
import { formatCAD, formatTime } from '../utils/formatters'
import ConfirmModal from './ConfirmModal'

const orderLabel = (order) =>
  order.streamTicketNumber != null ? `#${order.streamTicketNumber}` : (order.pickupName ?? '—')

const STATUS_STYLE = {
  PENDING:     'border-l-amber-500 bg-zinc-900 border-r border-t border-b border-zinc-700/50',
  IN_PROGRESS: 'border-l-blue-500 bg-blue-500/5 border-r border-t border-b border-blue-500/30',
  COMPLETED:   'border-l-zinc-600 bg-zinc-900/50 border-r border-t border-b border-zinc-800 opacity-60',
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
        className={`border-l-[3px] rounded-r-xl px-4 py-3 space-y-2 transition-all shadow-sm
          ${STATUS_STYLE[order.status] ?? 'border-l-zinc-600 bg-zinc-900'}
          ${isActionable ? 'cursor-pointer hover:brightness-110 active:scale-[0.99]' : ''}
          ${mutation.isPending ? 'opacity-50 blur-[1px]' : ''}`}
      >
        <div className="flex items-baseline gap-2">
          {order.streamTicketNumber != null ? (
            <span className="text-2xl font-mono font-bold text-slate-100 leading-none tabular-nums tracking-wide">
              {orderLabel(order)}
            </span>
          ) : (
            <span className="text-xl font-semibold text-slate-100 leading-none truncate">
              {orderLabel(order)}
            </span>
          )}
          <span className="ml-auto flex-shrink-0 flex items-center gap-2">
            <span className="text-sm font-mono font-medium text-zinc-400 tabular-nums">
              {formatTime(order.pickupTime)}
            </span>
            {order.sourceApp && (
              <span className="text-xs border border-zinc-700/80 bg-zinc-800/50 text-zinc-300 uppercase tracking-wide font-medium px-1.5 py-0.5 rounded-md">
                {order.sourceApp}
              </span>
            )}
          </span>
        </div>

        <ul className="space-y-1.5">
          {order.items.map(item => (
            <li key={item.id} className="flex gap-2 items-baseline">
              <span className="font-mono font-bold text-blue-400 tabular-nums w-6 text-right flex-shrink-0 text-base">
                {item.quantity}×
              </span>
              <span className="text-base font-semibold text-zinc-100">{item.menuItemName}</span>
            </li>
          ))}
        </ul>

        <div className="flex justify-end pt-1">
          <span className="text-sm font-mono font-bold text-zinc-500">
            {formatCAD(order.totalPrice)}
          </span>
        </div>
      </div>

      {confirming && (
        <ConfirmModal
          title="Skip to Completed?"
          message={`Order ${orderLabel(order)} hasn't been marked In Progress yet. Complete it anyway?`}
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  )
}
