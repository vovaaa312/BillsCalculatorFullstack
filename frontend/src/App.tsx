import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import FakturyPage from './pages/FakturyPage'
import VydajePage from './pages/VydajePage'
import HotovostPage from './pages/HotovostPage'
import DriverPage from './pages/DriverPage'
import ReportPage from './pages/ReportPage'
import RoutesPage from './pages/RoutesPage'
import IoPage from './pages/IoPage'
import type { ReactNode } from 'react'

const qc = new QueryClient()

function PrivateRoute({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { token } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/faktury" replace /> : <LoginPage />} />
      <Route path="/register" element={token ? <Navigate to="/faktury" replace /> : <RegisterPage />} />
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/faktury" element={<FakturyPage />} />
        <Route path="/vydaje" element={<VydajePage />} />
        <Route path="/hotovost" element={<HotovostPage />} />
        <Route path="/driver" element={<DriverPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/io" element={<IoPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/faktury" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
