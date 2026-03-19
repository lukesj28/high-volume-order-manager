import React from 'react'
import { useToastStore } from '../store/toastStore'

const STYLES = {
  error:   'bg-red-900/90 border-red-500 text-red-200',
  warning: 'bg-amber-900/90 border-amber-500 text-amber-200',
  info:    'bg-slate-800/90 border-slate-600 text-slate-200',
  success: 'bg-green-900/90 border-green-500 text-green-200',
}

export default function Toast() {
  const toasts = useToastStore(s => s.toasts)
  const remove = useToastStore(s => s.remove)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg pointer-events-auto ${STYLES[t.type] ?? STYLES.error}`}
        >
          <span className="flex-1">{t.message}</span>
          <button
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            onClick={() => remove(t.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
