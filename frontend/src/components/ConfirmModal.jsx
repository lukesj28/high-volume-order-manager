import React from 'react'

export default function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-300 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-success" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  )
}
