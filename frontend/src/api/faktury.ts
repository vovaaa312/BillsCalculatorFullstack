import client from './client'
import type { Invoice, InvoiceFilter } from '../types/faktura'

export const getInvoices = (filter?: InvoiceFilter) =>
  client.get<Invoice[]>('/invoices', { params: filter }).then(r => r.data)

export const createInvoice = (f: Invoice) =>
  client.post<Invoice>('/invoices', f).then(r => r.data)

export const updateInvoice = (id: number, f: Invoice) =>
  client.put<Invoice>(`/invoices/${id}`, f).then(r => r.data)

export const deleteInvoice = (id: number) =>
  client.delete(`/invoices/${id}`)

export const importInvoicesPdf = (file: File) => {
  const fd = new FormData()
  fd.append('file', file)
  return client.post<Invoice[]>('/invoices/import-pdf', fd).then(r => r.data)
}

export const getInvoicePdf = (id: number) =>
  client.get<Blob>(`/invoices/${id}/pdf`, { responseType: 'blob' }).then(r => r.data)
