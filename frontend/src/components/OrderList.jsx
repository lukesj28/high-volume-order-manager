import React, { useMemo } from 'react'
import { useOrdersStore, byTicket } from '../store/ordersStore'
import { useAuthStore } from '../store/authStore'
import { useDayStore } from '../store/dayStore'
import OrderCard from './OrderCard'
import { CardErrorBoundary } from './ErrorBoundary'
import { formatTime } from '../utils/formatters'

const DEFAULT_GROUPS = ['PENDING', 'IN_PROGRESS', 'COMPLETED']
const GROUP_LABELS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
}

function slotKey(pickupTime, intervalMinutes) {
  const d = new Date(pickupTime)
  const totalMinutes = d.getHours() * 60 + d.getMinutes()
  return Math.ceil(totalMinutes / intervalMinutes) * intervalMinutes
}

function slotLabel(slotMinutes) {
  const d = new Date()
  d.setHours(Math.floor(slotMinutes / 60), slotMinutes % 60, 0, 0)
  return formatTime(d.toISOString())
}

function groupBySlot(orders, intervalMinutes) {
  const slotted = {}
  for (const order of orders) {
    const key = slotKey(order.pickupTime, intervalMinutes)
    if (!slotted[key]) slotted[key] = []
    slotted[key].push(order)
  }
  return Object.keys(slotted)
    .map(Number)
    .sort((a, b) => a - b)
    .map(k => ({ slotMinutes: k, orders: slotted[k] }))
}

function SlottedOrders({ orders, intervalMinutes }) {
  const slots = groupBySlot(orders, intervalMinutes)
  return (
    <div className="space-y-3">
      {slots.map(({ slotMinutes, orders: slotOrders }, i) => (
        <div key={slotMinutes}>
          {i > 0 && <div className="border-t border-zinc-700/50 mb-3" />}
          <p className="text-xs text-zinc-400 font-semibold tracking-wide mb-2 border-b border-zinc-800/80 pb-1.5">
            {slotLabel(slotMinutes)}
          </p>
          <div className="space-y-1.5">
            {slotOrders.map(order => (
              <CardErrorBoundary key={order.id}>
                <OrderCard order={order} />
              </CardErrorBoundary>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function OrderList({ overrideShowAll = false, stationNames = null }) {
  const stationProfile = useAuthStore(s => s.stationProfile)
  const ordersMap = useOrdersStore(s => s.orders)
  const activeDay = useDayStore(s => s.activeDay)

  const displayConfig = stationProfile?.displayConfig ?? {}
  const showCompleted = overrideShowAll || displayConfig.showCompleted !== false
  const completedDisplay = displayConfig.completedDisplay ?? 'list'
  const orderGroups = displayConfig.orderGroups ?? DEFAULT_GROUPS
  const intervalMinutes = activeDay?.pickupSlotIntervalMinutes ?? 15

  const groupedOrders = useMemo(() => {
    const all = Object.values(ordersMap)
    const base = stationNames?.length > 0
      ? all.filter(o => stationNames.includes(o.stationName))
      : all
    const byPickup = (a, b) =>
      new Date(a.pickupTime) - new Date(b.pickupTime) || byTicket(a, b)
    return {
      PENDING:     base.filter(o => o.status === 'PENDING').sort(byPickup),
      IN_PROGRESS: base.filter(o => o.status === 'IN_PROGRESS').sort(byPickup),
      COMPLETED:   base.filter(o => o.status === 'COMPLETED').sort(byPickup),
    }
  }, [ordersMap, stationNames])

  const groups = orderGroups.filter(g => {
    if (g === 'COMPLETED' && !showCompleted) return false
    return true
  })

  return (
    <div className="space-y-4">
      {groups.map(status => {
        const groupOrders = groupedOrders[status] ?? []
        if (groupOrders.length === 0 && status !== 'PENDING') return null

        const isCollapsed = status === 'COMPLETED' && completedDisplay === 'collapsed'

        return (
          <section key={status}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
                {GROUP_LABELS[status]}
              </h2>
              <span className="bg-zinc-800/80 text-zinc-400 text-[10px] font-bold px-2 py-0.5 border border-zinc-700/50 rounded-lg">
                {groupOrders.length}
              </span>
            </div>

            {isCollapsed ? (
              <details className="group">
                <summary className="cursor-pointer text-xs font-medium tracking-wide text-zinc-500 hover:text-zinc-300 list-none flex items-center gap-2">
                  <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                  Show {groupOrders.length} completed
                </summary>
                <div className="mt-2">
                  <SlottedOrders orders={groupOrders} intervalMinutes={intervalMinutes} />
                </div>
              </details>
            ) : (
              <>
                <SlottedOrders orders={groupOrders} intervalMinutes={intervalMinutes} />
                {groupOrders.length === 0 && (
                  <p className="text-zinc-500 text-sm font-medium">No active orders</p>
                )}
              </>
            )}
          </section>
        )
      })}
    </div>
  )
}
