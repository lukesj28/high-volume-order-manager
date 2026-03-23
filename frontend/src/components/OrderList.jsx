import React, { useMemo } from 'react'
import { useOrdersStore, byTicket } from '../store/ordersStore'
import { useAuthStore } from '../store/authStore'
import { useDayStore } from '../store/dayStore'
import OrderCard from './OrderCard'
import { CardErrorBoundary } from './ErrorBoundary'

const DEFAULT_GROUPS = ['PENDING', 'IN_PROGRESS', 'COMPLETED']
const GROUP_LABELS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
}

function slotKey(pickupTime, intervalMinutes) {
  const d = new Date(pickupTime)
  const totalMinutes = d.getHours() * 60 + d.getMinutes()
  return Math.floor(totalMinutes / intervalMinutes) * intervalMinutes
}

function slotLabel(slotMinutes) {
  const d = new Date()
  d.setHours(Math.floor(slotMinutes / 60), slotMinutes % 60, 0, 0)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
          {i > 0 && <div className="border-t border-slate-700/50 mb-3" />}
          <p className="text-xs text-slate-600 font-medium tabular-nums mb-1.5">
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
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {GROUP_LABELS[status]}
              </h2>
              <span className="bg-slate-700 text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">
                {groupOrders.length}
              </span>
            </div>

            {isCollapsed ? (
              <details className="group">
                <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-300 list-none flex items-center gap-2">
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
                  <p className="text-slate-600 text-sm">No orders</p>
                )}
              </>
            )}
          </section>
        )
      })}
    </div>
  )
}
