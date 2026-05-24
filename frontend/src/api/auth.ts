import client from './client'

export interface LoginRequest { email: string; password: string }
export interface RegisterRequest { email: string; password: string }
export interface AuthResponse { token: string }

export const login = (data: LoginRequest) =>
  client.post<AuthResponse>('/auth/login', data).then(r => r.data)

export const register = (data: RegisterRequest) =>
  client.post<AuthResponse>('/auth/register', data).then(r => r.data)
