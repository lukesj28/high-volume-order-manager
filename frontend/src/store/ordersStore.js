import { create } from 'zustand'

export const byTicket = (a, b) => a.ticketNumber - b.ticketNumber

export const useOrdersStore = create((set, get) => ({
  orders: {},

  setOrders: (list) =>
    set({ orders: Object.fromEntries(list.map(o => [o.id, o])) }),

  upsertOrder: (order) =>
    set(state => ({ orders: { ...state.orders, [order.id]: order } })),

  getAll: () =>
    Object.values(get().orders).sort(byTicket),
}))
