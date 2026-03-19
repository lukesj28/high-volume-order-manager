import React from 'react'

const STATUS_STYLES = {
  PENDING:     'bg-amber-500/20 text-amber-300 border border-amber-500/40',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
  COMPLETED:   'bg-slate-600/40 text-slate-400 border border-slate-600',
}

const STATUS_LABELS = {
  PENDING:     'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED:   'Completed',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status] ?? ''}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
