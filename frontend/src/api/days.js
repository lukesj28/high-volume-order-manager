import client from './client'

export const getActiveDay = () =>
  client.get('/days/active').then(r => r.data)

export const openDay = () =>
  client.post('/days/open').then(r => r.data)

export const closeDay = () =>
  client.post('/days/close').then(r => r.data)

export const getAllDays = () =>
  client.get('/days').then(r => r.data)

export const updateDaySettings = (settings) =>
  client.patch('/days/settings', settings).then(r => r.data)
