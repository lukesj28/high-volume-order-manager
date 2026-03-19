import client from './client'

export const getMenu = () =>
  client.get('/menu').then(r => r.data)

export const getAllMenuItems = () =>
  client.get('/menu/all').then(r => r.data)

export const createMenuItem = (data) =>
  client.post('/menu', data).then(r => r.data)

export const updateMenuItem = (id, data) =>
  client.put(`/menu/${id}`, data).then(r => r.data)

export const deleteMenuItem = (id) =>
  client.delete(`/menu/${id}`)
