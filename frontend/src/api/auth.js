import client from './client'

export const login = (password) =>
  client.post('/auth/login', { password }).then(r => r.data)

export const getStationProfiles = () =>
  client.get('/auth/station-profiles').then(r => r.data)

export const selectStation = (stationProfileId) =>
  client.post('/auth/select-station', { stationProfileId }).then(r => r.data)
