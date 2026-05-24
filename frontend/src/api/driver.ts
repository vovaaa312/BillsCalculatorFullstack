import client from './client'
import type { DriverShift, DriverFilter } from '../types/driver'

export const getShifts = (filter: DriverFilter = {}) => {
  const params: Record<string, string> = {}
  if (filter.driverName) params.driverName = filter.driverName
  if (filter.dateFrom) params.dateFrom = filter.dateFrom
  if (filter.dateTo) params.dateTo = filter.dateTo
  return client.get<DriverShift[]>('/driver', { params }).then(r => r.data)
}

export const createShift = (s: DriverShift) =>
  client.post<DriverShift>('/driver', s).then(r => r.data)

export const updateShift = (id: number, s: DriverShift) =>
  client.put<DriverShift>(`/driver/${id}`, s).then(r => r.data)

export const deleteShift = (id: number) =>
  client.delete(`/driver/${id}`)
