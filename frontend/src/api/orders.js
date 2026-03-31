import client from './client'

export const submitOrder = (order) =>
  client.post('/orders', order).then(r => r.data)

export const updateStatus = (orderId, status, confirmed = false) =>
  client.patch(`/orders/${orderId}/status`, { status, confirmed }).then(r => r.data)

export const getActiveOrders = () =>
  client.get('/orders/active').then(r => r.data)

export const getAllOrders = () =>
  client.get('/orders/all').then(r => r.data)

export const updateOrder = (id, data) =>
  client.put(`/orders/${id}`, data).then(r => r.data)
