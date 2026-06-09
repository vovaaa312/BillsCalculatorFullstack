import './i18n'
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { useTranslation } from 'react-i18next'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import FakturyPage from './pages/FakturyPage'
import VydajePage from './pages/VydajePage'
import HotovostPage from './pages/HotovostPage'
import DriverPage from './pages/DriverPage'
import ReportPage from './pages/ReportPage'
import RoutesPage from './pages/RoutesPage'
import IoPage from './pages/IoPage'
import PokladnaPage from './pages/PokladnaPage'
import PokladnaDetailPage from './pages/PokladnaDetailPage'
import AdminPage from './pages/AdminPage'
import ProfilePage from './pages/ProfilePage'
import type { ReactNode } from 'react'

const qc = new QueryClient()

const VALID_LANGS = ['cs', 'en', 'ru', 'ua']

function getStoredLang() {
  const s = localStorage.getItem('lang')
  return s && VALID_LANGS.includes(s) ? s : 'en'
}

function LangRedirect({ page }: { page: string }) {
  return <Navigate to={`/${getStoredLang()}/${page}`} replace />
}

function LangPrivateRoute() {
  const { lang } = useParams<{ lang: string }>()
  const { token } = useAuth()
  const { i18n } = useTranslation()

  useEffect(() => {
    if (lang && VALID_LANGS.includes(lang) && lang !== i18n.language) {
      i18n.changeLanguage(lang)
      localStorage.setItem('lang', lang)
    }
  }, [lang])

  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { token, isAdmin } = useAuth()
  const { lang } = useParams<{ lang?: string }>()
  if (!token) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to={`/${lang ?? getStoredLang()}/faktury`} replace />
  return <>{children}</>
}

function AppRoutes() {
  const { token } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={token ? <LangRedirect page="faktury" /> : <LoginPage />} />
      <Route path="/register" element={token ? <LangRedirect page="faktury" /> : <RegisterPage />} />
      <Route path="/:lang/register" element={token ? <LangRedirect page="faktury" /> : <RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route path="/:lang" element={<LangPrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="faktury"  element={<FakturyPage />} />
          <Route path="vydaje"   element={<VydajePage />} />
          <Route path="hotovost" element={<HotovostPage />} />
          <Route path="driver"   element={<DriverPage />} />
          <Route path="report"   element={<ReportPage />} />
          <Route path="routes"   element={<RoutesPage />} />
          <Route path="io"              element={<IoPage />} />
          <Route path="pokladna"        element={<PokladnaPage />} />
          <Route path="pokladna/:id"    element={<PokladnaDetailPage />} />
          <Route path="profile"         element={<ProfilePage />} />
          <Route path="admin"    element={<AdminRoute><AdminPage /></AdminRoute>} />
        </Route>
      </Route>

      <Route path="/faktury"  element={<LangRedirect page="faktury" />} />
      <Route path="/vydaje"   element={<LangRedirect page="vydaje" />} />
      <Route path="/hotovost" element={<LangRedirect page="hotovost" />} />
      <Route path="/driver"   element={<LangRedirect page="driver" />} />
      <Route path="/report"   element={<LangRedirect page="report" />} />
      <Route path="/routes"   element={<LangRedirect page="routes" />} />
      <Route path="/io"       element={<LangRedirect page="io" />} />
      <Route path="/pokladna" element={<LangRedirect page="pokladna" />} />
      <Route path="/profile"  element={<LangRedirect page="profile" />} />
      <Route path="/admin"    element={<LangRedirect page="admin" />} />

      <Route path="*" element={<LangRedirect page="faktury" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
