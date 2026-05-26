import client from './client'

export interface LoginRequest { email: string; password: string }
export interface RegisterRequest { email: string; password: string }
export interface AuthResponse { token: string; email: string; role: string }

export const login = (data: LoginRequest) =>
  client.post<AuthResponse>('/auth/login', data).then(r => r.data)

export const register = (data: RegisterRequest) =>
  client.post<AuthResponse>('/auth/register', data).then(r => r.data)

export const googleLogin = (idToken: string) =>
  client.post<AuthResponse>('/auth/google', { idToken }).then(r => r.data)

export const forgotPassword = (email: string) =>
  client.post('/auth/forgot-password', { email })

export const resetPassword = (token: string, newPassword: string) =>
  client.post('/auth/reset-password', { token, newPassword })
