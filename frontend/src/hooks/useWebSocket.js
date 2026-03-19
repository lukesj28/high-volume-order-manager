import { useEffect, useRef, useState, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from '../store/authStore'
import { useOrdersStore } from '../store/ordersStore'
import { useDayStore } from '../store/dayStore'
import { getActiveOrders } from '../api/orders'
import { getActiveDay } from '../api/days'
import { toast } from '../store/toastStore'

export function useWebSocket() {
  const [connected, setConnected] = useState(false)
  const clientRef = useRef(null)
  const subscriptionsRef = useRef([])

  const token = useAuthStore(s => s.token)
  const stationProfile = useAuthStore(s => s.stationProfile)
  const upsertOrder = useOrdersStore(s => s.upsertOrder)
  const setOrders = useOrdersStore(s => s.setOrders)
  const setActiveDay = useDayStore(s => s.setActiveDay)

  const fetchState = useCallback(async () => {
    try {
      const [orders, day] = await Promise.all([getActiveOrders(), getActiveDay()])
      setOrders(Array.isArray(orders) ? orders : [])
      setActiveDay(day)
    } catch (err) {
      console.error('Failed to fetch authoritative state', err)
      // Don't toast here — this fires on reconnect and may just be "no active day"
    }
  }, [setOrders, setActiveDay])

  const safeHandleOrder = useCallback((msg) => {
    try {
      const order = JSON.parse(msg.body)
      upsertOrder(order)
    } catch (err) {
      console.error('Failed to process order message', err, msg?.body)
    }
  }, [upsertOrder])

  const safeHandleDay = useCallback((msg) => {
    try {
      const event = JSON.parse(msg.body)
      if (event.type === 'DAY_OPENED' || event.type === 'DAY_CLOSED') {
        fetchState()
      }
    } catch (err) {
      console.error('Failed to process day event message', err, msg?.body)
    }
  }, [fetchState])

  useEffect(() => {
    if (!token || !stationProfile) return

    let reconnectCount = 0

    const client = new Client({
      webSocketFactory: () => {
        try {
          return new SockJS('/ws')
        } catch (err) {
          console.error('Failed to create SockJS connection', err)
          throw err
        }
      },
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true)
        if (reconnectCount > 0) {
          toast('Reconnected to server', 'success', 3000)
        }
        reconnectCount++

        fetchState()

        const subs = []

        try {
          if (!stationProfile.subscribeToStations || stationProfile.subscribeToStations.length === 0) {
            subs.push(client.subscribe('/topic/orders.all', safeHandleOrder))
          } else {
            subs.push(client.subscribe(`/topic/orders.station.${stationProfile.id}`, safeHandleOrder))
          }

          subs.push(client.subscribe('/topic/orders.day', safeHandleDay))
        } catch (err) {
          console.error('Failed to set up subscriptions', err)
        }

        subscriptionsRef.current = subs
      },
      onDisconnect: () => {
        setConnected(false)
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame)
        toast('WebSocket error — reconnecting…', 'warning', 4000)
      },
      onWebSocketError: (err) => {
        console.error('WebSocket error', err)
      },
    })

    clientRef.current = client

    try {
      client.activate()
    } catch (err) {
      console.error('Failed to activate WebSocket client', err)
    }

    return () => {
      subscriptionsRef.current.forEach(sub => {
        try { sub.unsubscribe() } catch (_) {}
      })
      subscriptionsRef.current = []
      try { client.deactivate() } catch (_) {}
      setConnected(false)
    }
  }, [token, stationProfile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return { connected }
}
