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
  a.download = 'backup.json'
  a.click()
  URL.revokeObjectURL(url)
}
