import client from './client'

export const getDaySummary = (dayId) =>
  client.get('/analytics/summary', { params: { dayId } }).then(r => r.data)

export const getComponents = (dayId) =>
  client.get('/analytics/components', { params: { dayId } }).then(r => r.data)

export const getHistorical = () =>
  client.get('/analytics/historical').then(r => r.data)

export const compareYears = (year1, year2) =>
  client.get('/analytics/compare', { params: { year1, year2 } }).then(r => r.data)

export const getSnapshot = (dayId) =>
  client.get('/analytics/snapshot', { params: { dayId } }).then(r => r.data)
