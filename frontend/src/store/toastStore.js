import { create } from 'zustand'

let nextId = 1

export const useToastStore = create((set) => ({
  toasts: [],
  add: (message, type = 'error', duration = 5000) => {
    const id = nextId++
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), duration)
  },
  remove: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))

// for non-React code
export function toast(message, type = 'error', duration = 5000) {
  useToastStore.getState().add(message, type, duration)
}
