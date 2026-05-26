import { createContext, useContext, useState, type ReactNode } from 'react'

interface AuthCtx {
  token: string | null
  email: string | null
  role: string | null
  isAdmin: boolean
  setAuth: (token: string, email: string, role: string) => void
  setToken: (t: string | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthCtx>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('token'))
  const [email, setEmail] = useState<string | null>(() => localStorage.getItem('userEmail'))
  const [role, setRole] = useState<string | null>(() => localStorage.getItem('userRole'))

  const setAuth = (t: string, e: string, r: string) => {
    setTokenState(t)
    setEmail(e)
    setRole(r)
    localStorage.setItem('token', t)
    localStorage.setItem('userEmail', e)
    localStorage.setItem('userRole', r)
  }

  const setToken = (t: string | null) => {
    setTokenState(t)
    if (t) localStorage.setItem('token', t)
    else {
      localStorage.removeItem('token')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('userRole')
      setEmail(null)
      setRole(null)
    }
  }

  const logout = () => setToken(null)

  return (
    <AuthContext.Provider value={{ token, email, role, isAdmin: role === 'ADMIN', setAuth, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
