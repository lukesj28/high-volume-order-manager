import { create } from 'zustand'

export const byTicket = (a, b) => a.ticketNumber - b.ticketNumber

const COMPLETED_MAX_AGE_MS = 2 * 60 * 60 * 1000 // 2 hours

export const useOrdersStore = create((set, get) => ({
  orders: {},

  setOrders: (list) =>
    set({ orders: Object.fromEntries(list.map(o => [o.id, o])) }),

  upsertOrder: (order) =>
    set(state => ({ orders: { ...state.orders, [order.id]: order } })),

  pruneCompleted: () => set(state => {
    const cutoff = Date.now() - COMPLETED_MAX_AGE_MS
    const pruned = Object.fromEntries(
      Object.entries(state.orders).filter(([, o]) =>
        o.status !== 'COMPLETED' || new Date(o.pickupTime).getTime() > cutoff
      )
    )
    return { orders: pruned }
  }),

  getAll: () =>
    Object.values(get().orders).sort(byTicket),
}))
