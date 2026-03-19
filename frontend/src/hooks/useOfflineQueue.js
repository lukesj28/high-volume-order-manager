import { useState, useEffect, useCallback, useRef } from 'react'
import { submitOrder } from '../api/orders'
import { queueOrder, getPendingOrders, removeOrder, queueCount } from '../utils/indexedDB'
import { toast } from '../store/toastStore'

const MAX_RETRIES = 3

export function useOfflineQueue() {
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  // Track per-order failure counts across flush attempts (keyed by order.id)
  const failureCounts = useRef({})

  const refreshCount = useCallback(async () => {
    try {
      const count = await queueCount()
      setPendingCount(count)
    } catch (err) {
      console.error('Failed to read offline queue count', err)
    }
  }, [])

  const enqueue = useCallback(async (order) => {
    try {
      await queueOrder(order)
      await refreshCount()
    } catch (err) {
      console.error('Failed to enqueue order', err)
      toast('Could not save order for offline sync', 'error')
    }
  }, [refreshCount])

  const flush = useCallback(async () => {
    if (isSyncing) return

    let pending
    try {
      pending = await getPendingOrders()
    } catch (err) {
      console.error('Failed to read offline queue', err)
      return
    }

    if (pending.length === 0) return

    setIsSyncing(true)
    let successCount = 0
    let skipCount = 0

    for (const order of pending) {
      try {
        const { _queuedAt, ...orderData } = order
        await submitOrder(orderData)
        await removeOrder(order.id)
        delete failureCounts.current[order.id]
        successCount++
        await refreshCount()
      } catch (err) {
        const isServerRejection = err?.response?.status >= 400 && err?.response?.status < 500

        if (isServerRejection) {
          // 4xx = server permanently rejected — remove it so it doesn't block the queue
          console.warn('Permanently dropping offline order (server rejected):', order.id, err?.response?.status)
          try { await removeOrder(order.id) } catch (_) {}
          delete failureCounts.current[order.id]
          skipCount++
          await refreshCount()
          toast(`Order #${order.ticketNumber ?? order.id} was rejected and removed from queue`, 'warning')
          continue
        }

        failureCounts.current[order.id] = (failureCounts.current[order.id] ?? 0) + 1
        const attempts = failureCounts.current[order.id]

        if (attempts >= MAX_RETRIES) {
          console.error(`Dropping offline order after ${MAX_RETRIES} failures:`, order.id)
          try { await removeOrder(order.id) } catch (_) {}
          delete failureCounts.current[order.id]
          skipCount++
          await refreshCount()
          toast(`Order #${order.ticketNumber ?? order.id} could not sync after ${MAX_RETRIES} attempts and was removed`, 'error')
          continue
        }

        console.error(`Failed to sync queued order (attempt ${attempts}/${MAX_RETRIES}):`, order.id, err)
        // Don't stop the whole flush — try remaining orders
      }
    }

    setIsSyncing(false)

    if (successCount > 0) {
      toast(`Synced ${successCount} offline order${successCount > 1 ? 's' : ''}`, 'success', 3000)
    }
  }, [isSyncing, refreshCount])

  useEffect(() => {
    refreshCount()

    const handleOnline = () => {
      console.log('Back online — flushing offline queue')
      flush()
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [flush, refreshCount])

  return { pendingCount, isSyncing, enqueue, flush }
}
