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
      className={`w-full aspect-square rounded-2xl flex flex-col border transition-all overflow-hidden
        ${qty > 0
          ? 'border-blue-500/60 bg-blue-500/10'
          : 'border-zinc-800/80 bg-zinc-900 hover:border-zinc-600'}`}
    >
      <button
        onClick={() => onSet(qty + 1)}
        className="flex-1 flex items-center justify-center text-center px-2 text-[11px] uppercase tracking-wide font-semibold leading-tight w-full
          text-zinc-300 hover:text-white transition-colors"
      >
        {item.name}
      </button>

      {qty > 0 && (
        <div className="flex items-center gap-1 px-1.5 pb-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onSet(qty - 1)}
            className="w-5 h-5 bg-zinc-800 hover:bg-zinc-700 rounded-md flex items-center justify-center text-white font-bold text-sm leading-none flex-shrink-0"
          >
            −
          </button>
          {editing ? (
            <input
              autoFocus type="number" min="0" value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={e => e.key === 'Enter' && commit()}
              className="flex-1 min-w-0 text-center bg-zinc-800/50 text-blue-300 rounded-md text-sm font-semibold border border-blue-400/50 focus:outline-none py-0.5"
            />
          ) : (
             <span
              onClick={() => { setDraft(String(qty)); setEditing(true) }}
              title="Click to edit"
              className="flex-1 text-center text-blue-300 font-semibold text-sm cursor-text leading-tight bg-blue-500/5 rounded-md mx-0.5"
            >
              {qty}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function defaultPickupTimeValue(offsetMinutes) {
  const d = new Date(Date.now() + offsetMinutes * 60000)
  return d.toTimeString().slice(0, 5) // "HH:MM"
}

function timeValueToISOToday(timeValue) {
  const [h, m] = timeValue.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

function SubmitModal({ submitFields, defaultPickupOffset, onConfirm, onCancel }) {
  const [name, setName] = useState('')
  const [app, setApp] = useState('')
  const [pickupTime, setPickupTime] = useState(() => defaultPickupTimeValue(defaultPickupOffset))

  const handleConfirm = () => {
    onConfirm({
      pickupName: name.trim() || null,
      sourceApp: app || null,
      pickupTime: timeValueToISOToday(pickupTime),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 w-80 space-y-4 shadow-xl">
        <h3 className="font-bold text-white text-base tracking-wide">Order Details</h3>

        <div>
          <label className="label">Pickup Time</label>
          <input
            autoFocus
            type="time"
            className="input w-full"
            value={pickupTime}
            onChange={e => setPickupTime(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleConfirm()}
          />
        </div>

        {submitFields.includes('name') && (
          <div>
            <label className="label">Customer Name / Code</label>
            <input
              className="input" placeholder="e.g. Smith or #47"
              value={name} onChange={e => setName(e.target.value)}
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

function StreamColumn({ stream }) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {stream.label && (
        <h2 className="flex-shrink-0 text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-2 border-b border-zinc-800 pb-1">
          {stream.label}
        </h2>
      )}
      <div className="flex-1 overflow-y-auto pr-1">
        <OrderList stationNames={stream.stationNames} />
      </div>
    </div>
  )
}

function CartItemsList({ cartItems, className }) {
  return (
    <div className={className}>
      {cartItems.length === 0
        ? <p className="text-zinc-500 text-xs tracking-wide font-medium">No items added</p>
        : cartItems.map(item => (
          <div key={item.id} className="flex items-baseline gap-2">
            <span className="text-blue-400 font-mono font-semibold text-sm tabular-nums w-5 text-right flex-shrink-0">{item.qty}×</span>
            <span className="text-zinc-200 text-sm tracking-wide font-medium leading-snug">{item.name}</span>
          </div>
        ))
      }
    </div>
  )
}

function CartActions({ total, itemCount, isPending, lastSubmitted, isError, errorMsg, onSubmit, onClear, alwaysShowClear = true }) {
  return (
    <>
      <div className="flex justify-between items-baseline mb-3">
        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Total</span>
        <span className="text-blue-200 font-mono font-bold text-2xl">{formatCAD(total)}</span>
      </div>
      <button
        className="btn-primary w-full py-3.5 text-base"
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
        <CartItemsList cartItems={cartItems} className="flex-1 overflow-y-auto min-h-0 space-y-1.5" />
        <div className="flex-shrink-0 pt-3 border-t border-zinc-800 space-y-2">
          <CartActions {...{ total, itemCount, isPending, lastSubmitted, isError, errorMsg, onSubmit, onClear, alwaysShowClear: false }} />
        </div>
      </>
    )
  }
  return (
    <div className="flex-shrink-0 border-t border-zinc-800 pt-3 space-y-2">
      <CartItemsList cartItems={cartItems} className="h-36 overflow-y-auto space-y-1.5" />
      <div className="border-t border-zinc-800/60 pt-2 space-y-2">
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
  const defaultPickupOffset = activeDay?.defaultPickupOffsetMinutes ?? 10

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

  const doSubmit = ({ pickupName = null, sourceApp = null, pickupTime = null } = {}) => {
    if (itemCount === 0) return
    if (!activeDay) { alert('No active day. Ask staff to open the day first.'); return }
    mutation.mutate({
      id: crypto.randomUUID(),
      items: cartItems.map(({ id, qty }) => ({ menuItemId: id, quantity: qty })),
      pickupName, sourceApp, pickupTime,
      createdAt: new Date().toISOString()
    })
  }

  const handleSubmitClick = () => {
    if (itemCount === 0) return
    setShowModal(true)
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
        {streams.map((stream, i) => <StreamColumn key={i} stream={stream} />)}
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

          <div className="border-l border-zinc-800 flex-shrink-0" />

          <div className="flex-1 flex flex-col min-h-0">
            {streams[0].label && (
              <h2 className="flex-shrink-0 text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-2 border-b border-zinc-800 pb-1">
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
            defaultPickupOffset={defaultPickupOffset}
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
          {streams.map((stream, i) => <StreamColumn key={i} stream={stream} />)}
        </div>

        <div className="border-t border-zinc-800 flex-shrink-0" />

        <div className="flex-[5] flex gap-4 min-h-0 overflow-hidden pt-3">
          <div className="flex-1 overflow-y-auto min-h-0">
            {itemGrid}
          </div>
          <div className="w-44 flex-shrink-0 flex flex-col min-h-0 border-l border-zinc-800 pl-4">
            <OrderPreview {...previewProps} sidebar />
          </div>
        </div>
      </div>

      {showModal && (
        <SubmitModal
          submitFields={submitFields}
          defaultPickupOffset={defaultPickupOffset}
          onConfirm={details => { setShowModal(false); doSubmit(details) }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  )
}
