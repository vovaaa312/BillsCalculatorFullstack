import client from './client'

export interface AdminUser {
  id: number
  email: string
  role: string
  enabled: boolean
  createdAt: string
}

export interface RegRequest {
  id: number
  email: string
  status: string
  createdAt: string
}

export interface AuditLog {
  id: number
  userEmail: string | null
  action: string
  entityType: string | null
  entityId: string | null
  status: 'SUCCESS' | 'FAILURE'
  ipAddress: string | null
  details: string | null
  category: 'SECURITY' | 'ACTIVITY'
  timestamp: string
}

export interface AuditLogPage {
  content: AuditLog[]
  totalElements: number
  totalPages: number
  number: number
}

export interface AuditLogFilter {
  userEmail?: string
  action?: string
  category?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  size?: number
}

export const getUsers = () => client.get<AdminUser[]>('/admin/users').then(r => r.data)
export const getPendingRequests = () => client.get<RegRequest[]>('/admin/requests').then(r => r.data)
export const approveRequest = (id: number) => client.post(`/admin/requests/${id}/approve`)
export const rejectRequest = (id: number) => client.post(`/admin/requests/${id}/reject`)
export const deleteUser = (id: number) => client.delete(`/admin/users/${id}`)
export const toggleUser = (id: number) => client.put(`/admin/users/${id}/toggle`)
export const downloadBackup = async () => {
  const res = await client.get('/admin/backup', { responseType: 'blob' })
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`
  a.download = `backup_${stamp}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export const restoreBackup = async (file: File): Promise<{ restored: number; skipped: number }> => {
  const text = await file.text()
  const json = JSON.parse(text)
  const res = await client.post('/admin/restore', json)
  return res.data
}

export const getAuditLogs = (filter: AuditLogFilter = {}) =>
  client.get<AuditLogPage>('/admin/audit-logs', { params: filter }).then(r => r.data)

export const clearActivityLogs = () => client.delete('/admin/audit-logs/activity')
export const clearAllLogs = () => client.delete('/admin/audit-logs/all')
