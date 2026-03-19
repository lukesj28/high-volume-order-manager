import { create } from 'zustand'

export const useDayStore = create((set) => ({
  activeDay: null,
  setActiveDay: (day) => set({ activeDay: day }),
  clearDay: () => set({ activeDay: null }),
}))
