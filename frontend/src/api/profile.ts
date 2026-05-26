import client from './client'

export interface ProfileInfo {
  email: string
  role: string
  createdAt: string
  hasPassword: boolean
}

export const getProfile = () => client.get<ProfileInfo>('/profile/me').then(r => r.data)
export const changePassword = (oldPassword: string, newPassword: string) =>
  client.put('/profile/password', { oldPassword, newPassword })
