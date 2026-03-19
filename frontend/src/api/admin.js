import client from './client'

export const getStationProfiles = () =>
  client.get('/admin/station-profiles').then(r => r.data)

export const createStationProfile = (data) =>
  client.post('/admin/station-profiles', data).then(r => r.data)

export const updateStationProfile = (id, data) =>
  client.put(`/admin/station-profiles/${id}`, data).then(r => r.data)

export const deleteStationProfile = (id) =>
  client.delete(`/admin/station-profiles/${id}`)

export const changeStaffPassword = (password) =>
  client.put('/admin/staff-password', { password })
