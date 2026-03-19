import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getMenu } from '../api/menu'
import { submitOrder } from '../api/orders'
import { useAuthStore } from '../store/authStore'
import { useOrdersStore } from '../store/ordersStore'
import { useDayStore } from '../store/dayStore'
import { useOfflineQueue } from '../hooks/useOfflineQueue'
import { formatCAD } from '../utils/formatters'
import OrderList from '../components/OrderList'

const APP_OPTIONS = ['Uber Eats', 'DoorDash', 'SkipTheDishes', 'Ritual']

function ItemButton({ item, qty, onSet }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const commit = () => {
    onSet(Math.max(0, parseInt(draft) || 0))
    setEditing(false)
  }

  return (
    <div
      className={`w-full aspect-square rounded-xl flex flex-col border-2 transition-all overflow-hidden
        ${qty > 0
          ? 'border-blue-500 bg-blue-600/20'
          : 'border-slate-600 bg-slate-800 hover:border-slate-400'}`}
    >
      <button
        onClick={() => onSet(qty + 1)}
        className="flex-1 flex items-center justify-center text-center px-2 text-xs font-semibold leading-tight w-full
          text-slate-300 hover:text-white transition-colors"
      >
        {item.name}
      </button>

      {qty > 0 && (
        <div className="flex items-center gap-1 px-1.5 pb-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onSet(qty - 1)}
            className="w-5 h-5 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white font-bold text-sm leading-none flex-shrink-0"
          >
            −
          </button>
          {editing ? (
            <input
              autoFocus type="number" min="0" value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={e => e.key === 'Enter' && commit()}
              className="flex-1 min-w-0 text-center bg-slate-700 text-blue-300 rounded text-xs font-bold border border-blue-400 focus:outline-none py-0.5"
            />
          ) : (
            <span
              onClick={() => { setDraft(String(qty)); setEditing(true) }}
              title="Click to edit"
              className="flex-1 text-center text-blue-300 font-black text-sm tabular-nums border-b border-dashed border-blue-400/50 cursor-text leading-tight"
            >
              {qty}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function SubmitModal({ submitFields, onConfirm, onCancel }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [app, setApp] = useState('')

  const handleConfirm = () => {
    const pickupParts = [name.trim(), phone.trim()].filter(Boolean)
    onConfirm({
      pickupName: pickupParts.join(' — ') || null,
      sourceApp: app || null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-80 space-y-4">
        <h3 className="font-bold text-white text-lg">Order Details</h3>

        {submitFields.includes('name') && (
          <div>
            <label className="label">Customer Name / Code</label>
            <input
              autoFocus className="input" placeholder="e.g. Smith or #47"
              value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            />
          </div>
        )}

        {submitFields.includes('phone') && (
          <div>
            <label className="label">Phone Number</label>
            <input
              type="tel" className="input" placeholder="e.g. 416-555-0123"
              value={phone} onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            />
          </div>
        )}

        {submitFields.includes('app') && (
          <div>
            <label className="label">App / Platform</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {APP_OPTIONS.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setApp(app === option ? '' : option)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all
                    ${app === option
                      ? 'border-blue-500 bg-blue-600/20 text-white'
                      : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-400 hover:text-white'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button className="btn-primary flex-1 py-2" onClick={handleConfirm}>Confirm</button>
          <button className="btn-ghost flex-1 py-2" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

function CartItemsList({ cartItems, className }) {
  return (
    <div className={className}>
      {cartItems.length === 0
        ? <p className="text-slate-600 text-sm">No items added</p>
        : cartItems.map(item => (
          <div key={item.id} className="flex items-baseline gap-2">
            <span className="text-blue-400 font-black text-sm tabular-nums w-5 text-right flex-shrink-0">{item.qty}×</span>
            <span className="text-white text-sm leading-snug">{item.name}</span>
          </div>
        ))
      }
    </div>
  )
}

function CartActions({ total, itemCount, isPending, lastSubmitted, isError, errorMsg, onSubmit, onClear, alwaysShowClear = true }) {
  return (
    <>
      <div className="flex justify-between items-baseline">
        <span className="text-slate-400 text-xs">Total</span>
        <span className="text-white font-black text-lg">{formatCAD(total)}</span>
      </div>
      <button
        className="btn-primary w-full py-3 font-bold text-base"
        disabled={itemCount === 0 || isPending}
        onClick={onSubmit}
      >
        {isPending ? 'Submitting…' : 'Submit'}
      </button>
      {(alwaysShowClear || itemCount > 0) && (
        <button
          className="btn-ghost w-full text-xs py-1"
          disabled={alwaysShowClear && itemCount === 0}
          onClick={onClear}
        >
          Clear
        </button>
      )}
      {lastSubmitted === 'queued' && <p className="text-amber-400 text-xs text-center">Saved offline</p>}
      {lastSubmitted === 'sent' && <p className="text-green-400 text-xs text-center">Submitted!</p>}
      {isError && <p className="text-red-400 text-xs text-center">{errorMsg ?? 'Failed'}</p>}
    </>
  )
}

function OrderPreview({ cartItems, total, itemCount, isPending, lastSubmitted, isError, errorMsg, onSubmit, onClear, sidebar = false }) {
  if (sidebar) {
    return (
      <>
        <CartItemsList cartItems={cartItems} className="flex-1 overflow-y-auto min-h-0 space-y-1" />
        <div className="flex-shrink-0 pt-3 border-t border-slate-700 space-y-2">
          <CartActions {...{ total, itemCount, isPending, lastSubmitted, isError, errorMsg, onSubmit, onClear, alwaysShowClear: false }} />
        </div>
      </>
    )
  }
  return (
    <div className="flex-shrink-0 border-t border-slate-700 pt-3 space-y-2">
      <CartItemsList cartItems={cartItems} className="h-36 overflow-y-auto space-y-1" />
      <div className="border-t border-slate-700/60 pt-2 space-y-2">
        <CartActions {...{ total, itemCount, isPending, lastSubmitted, isError, errorMsg, onSubmit, onClear }} />
      </div>
    </div>
  )
}

export default function POS() {
  const stationProfile = useAuthStore(s => s.stationProfile)
  const canSubmit = useAuthStore(s => s.canSubmit())
  const upsertOrder = useOrdersStore(s => s.upsertOrder)
  const activeDay = useDayStore(s => s.activeDay)
  const { enqueue } = useOfflineQueue()

  const [cart, setCart] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [lastSubmitted, setLastSubmitted] = useState(null)
  const submitTimerRef = useRef(null)
  useEffect(() => () => clearTimeout(submitTimerRef.current), [])

  const { data: menu = [] } = useQuery({ queryKey: ['menu'], queryFn: getMenu })

  const streams = stationProfile?.displayConfig?.streams ?? [{ label: null, stationNames: null }]
  const submitFields = stationProfile?.displayConfig?.submitFields ?? []

  const cartItems = menu
    .filter(item => (cart[item.id] ?? 0) > 0)
    .map(item => ({ ...item, qty: cart[item.id] }))

  const total = cartItems.reduce((sum, item) => sum + parseFloat(item.price) * item.qty, 0)
  const itemCount = cartItems.reduce((sum, item) => sum + item.qty, 0)

  const setItemQty = (itemId, qty) => {
    setCart(prev => {
      if (qty <= 0) { const { [itemId]: _, ...rest } = prev; return rest }
      return { ...prev, [itemId]: qty }
    })
  }

  const mutation = useMutation({
    mutationFn: async (order) => {
      if (!navigator.onLine) { await enqueue(order); return { _offline: true } }
      return submitOrder(order)
    },
    onSuccess: (data) => {
      if (!data._offline) upsertOrder(data)
      setLastSubmitted(data._offline ? 'queued' : 'sent')
      setCart({})
      clearTimeout(submitTimerRef.current)
      submitTimerRef.current = setTimeout(() => setLastSubmitted(null), 3000)
    }
  })

  const doSubmit = ({ pickupName = null, sourceApp = null } = {}) => {
    if (itemCount === 0) return
    if (!activeDay) { alert('No active day. Ask staff to open the day first.'); return }
    mutation.mutate({
      id: crypto.randomUUID(),
      items: cartItems.map(({ id, qty }) => ({ menuItemId: id, quantity: qty })),
      pickupName, sourceApp,
      createdAt: new Date().toISOString()
    })
  }

  const handleSubmitClick = () => {
    if (itemCount === 0) return
    if (submitFields.length > 0) setShowModal(true)
    else doSubmit()
  }

  const previewProps = {
    cartItems, total, itemCount,
    isPending: mutation.isPending,
    lastSubmitted,
    isError: mutation.isError,
    errorMsg: mutation.error?.response?.data?.error,
    onSubmit: handleSubmitClick,
    onClear: () => setCart({}),
  }

  const itemGrid = (
    <div className="flex flex-col gap-2 h-full">
      {itemCount > 0 && (
        <div className="flex justify-end flex-shrink-0">
          <button className="btn-ghost text-xs py-0.5 px-2" onClick={() => setCart({})}>
            Clear all
          </button>
        </div>
      )}
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))' }}>
        {menu.map(item => (
          <ItemButton key={item.id} item={item} qty={cart[item.id] ?? 0} onSet={qty => setItemQty(item.id, qty)} />
        ))}
      </div>
    </div>
  )

  if (!canSubmit) {
    return (
      <div className="h-full flex gap-4">
        {streams.map((stream, i) => (
          <div key={i} className="flex-1 flex flex-col min-h-0">
            {stream.label && (
              <h2 className="flex-shrink-0 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                {stream.label}
              </h2>
            )}
            <div className="flex-1 overflow-y-auto pr-1">
              <OrderList stationNames={stream.stationNames} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (streams.length === 1) {
    return (
      <>
        <div className="h-full flex gap-4">
          <div className="flex-[2] flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto min-h-0">
              {itemGrid}
            </div>
            <OrderPreview {...previewProps} />
          </div>

          <div className="border-l border-slate-700 flex-shrink-0" />

          <div className="flex-1 flex flex-col min-h-0">
            {streams[0].label && (
              <h2 className="flex-shrink-0 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                {streams[0].label}
              </h2>
            )}
            <div className="flex-1 overflow-y-auto pr-1">
              <OrderList stationNames={streams[0].stationNames} />
            </div>
          </div>
        </div>

        {showModal && (
          <SubmitModal
            submitFields={submitFields}
            onConfirm={details => { setShowModal(false); doSubmit(details) }}
            onCancel={() => setShowModal(false)}
          />
        )}
      </>
    )
  }

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="flex-[4] flex gap-4 min-h-0 overflow-hidden pb-3">
          {streams.map((stream, i) => (
            <div key={i} className="flex-1 flex flex-col min-h-0">
              {stream.label && (
                <h2 className="flex-shrink-0 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  {stream.label}
                </h2>
              )}
              <div className="flex-1 overflow-y-auto pr-1">
                <OrderList stationNames={stream.stationNames} />
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-700 flex-shrink-0" />

        <div className="flex-[5] flex gap-4 min-h-0 overflow-hidden pt-3">
          <div className="flex-1 overflow-y-auto min-h-0">
            {itemGrid}
          </div>
          <div className="w-44 flex-shrink-0 flex flex-col min-h-0 border-l border-slate-700 pl-4">
            <OrderPreview {...previewProps} sidebar />
          </div>
        </div>
      </div>

      {showModal && (
        <SubmitModal
          submitFields={submitFields}
          onConfirm={details => { setShowModal(false); doSubmit(details) }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  )
}
