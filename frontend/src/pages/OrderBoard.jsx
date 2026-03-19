import React, { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useOrdersStore } from '../store/ordersStore'
import OrderList from '../components/OrderList'

export default function OrderBoard() {
  const stationProfile = useAuthStore(s => s.stationProfile)
  const [overrideShowAll, setOverrideShowAll] = useState(false)
  const ordersMap = useOrdersStore(s => s.orders)
  const total = Object.keys(ordersMap).length

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">{stationProfile?.name} — Order Board</h1>
          <p className="text-sm text-slate-400">{total} total orders visible</p>
        </div>
        <button
          className={overrideShowAll ? 'btn-warning text-sm' : 'btn-ghost text-sm'}
          onClick={() => setOverrideShowAll(v => !v)}
          title="Emergency override: show all orders regardless of station config"
        >
          {overrideShowAll ? 'Override Active — Show All' : 'Emergency Override'}
        </button>
      </div>

      <OrderList overrideShowAll={overrideShowAll} />
    </div>
  )
}
