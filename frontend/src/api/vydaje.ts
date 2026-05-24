import client from './client'
import type { Vydaj } from '../types/vydaj'

export const getVydaje = () =>
  client.get<Vydaj[]>('/vydaje').then(r => r.data)

export const createVydaj = (v: Vydaj) =>
  client.post<Vydaj>('/vydaje', v).then(r => r.data)

export const updateVydaj = (id: number, v: Vydaj) =>
  client.put<Vydaj>(`/vydaje/${id}`, v).then(r => r.data)

export const deleteVydaj = (id: number) =>
  client.delete(`/vydaje/${id}`)
