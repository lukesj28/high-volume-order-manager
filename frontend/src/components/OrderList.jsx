import React, { useMemo } from 'react'
import { useOrdersStore, byTicket } from '../store/ordersStore'
import { useAuthStore } from '../store/authStore'
import OrderCard from './OrderCard'
import { CardErrorBoundary } from './ErrorBoundary'

const DEFAULT_GROUPS = ['PENDING', 'IN_PROGRESS', 'COMPLETED']
const GROUP_LABELS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
}

export default function OrderList({ overrideShowAll = false, stationNames = null }) {
  const stationProfile = useAuthStore(s => s.stationProfile)
  const ordersMap = useOrdersStore(s => s.orders)

  const displayConfig = stationProfile?.displayConfig ?? {}
  const showCompleted = overrideShowAll || displayConfig.showCompleted !== false
  const completedDisplay = displayConfig.completedDisplay ?? 'list'
  const orderGroups = displayConfig.orderGroups ?? DEFAULT_GROUPS

  const groupedOrders = useMemo(() => {
    const all = Object.values(ordersMap)
    const base = stationNames?.length > 0
      ? all.filter(o => stationNames.includes(o.stationName))
      : all
    return {
      PENDING:     base.filter(o => o.status === 'PENDING').sort(byTicket),
      IN_PROGRESS: base.filter(o => o.status === 'IN_PROGRESS').sort(byTicket),
      COMPLETED:   base.filter(o => o.status === 'COMPLETED').sort(byTicket),
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
                <div className="mt-2 space-y-1.5">
                  {groupOrders.map(order => (
                    <CardErrorBoundary key={order.id}>
                      <OrderCard order={order} />
                    </CardErrorBoundary>
                  ))}
                </div>
              </details>
            ) : (
              <div className="space-y-1.5">
                {groupOrders.map(order => (
                  <CardErrorBoundary key={order.id}>
                    <OrderCard order={order} />
                  </CardErrorBoundary>
                ))}
                {groupOrders.length === 0 && (
                  <p className="text-slate-600 text-sm">No orders</p>
                )}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
