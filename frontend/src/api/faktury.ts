import client from './client'
import type { Faktura, FakturaFilter } from '../types/faktura'

export const getFaktury = (filter?: FakturaFilter) =>
  client.get<Faktura[]>('/faktury', { params: filter }).then(r => r.data)

export const createFaktura = (f: Faktura) =>
  client.post<Faktura>('/faktury', f).then(r => r.data)

export const updateFaktura = (id: number, f: Faktura) =>
  client.put<Faktura>(`/faktury/${id}`, f).then(r => r.data)

export const deleteFaktura = (id: number) =>
  client.delete(`/faktury/${id}`)

export const importFakturyPdf = (file: File) => {
  const fd = new FormData()
  fd.append('file', file)
  return client.post<Faktura[]>('/faktury/import-pdf', fd).then(r => r.data)
}
