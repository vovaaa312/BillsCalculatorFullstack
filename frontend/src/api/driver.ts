import client from './client'
import type { DriverShift } from '../types/driver'

export const getShifts = () =>
  client.get<DriverShift[]>('/driver').then(r => r.data)

export const createShift = (s: DriverShift) =>
  client.post<DriverShift>('/driver', s).then(r => r.data)

export const updateShift = (id: number, s: DriverShift) =>
  client.put<DriverShift>(`/driver/${id}`, s).then(r => r.data)

export const deleteShift = (id: number) =>
  client.delete(`/driver/${id}`)
