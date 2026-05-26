import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { login, googleLogin } from '../api/auth'
import { useAuth } from '../context/AuthContext'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: object) => void
          renderButton: (el: HTMLElement, cfg: object) => void
        }
      }
    }
  }
}

const LANGS = [
  { code: 'cs', label: 'CS' },
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
  { code: 'ua', label: 'UA' },
]

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { setAuth } = useAuth()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const handleGoogleRef = useRef<(credential: string) => void>(() => {})
  handleGoogleRef.current = async (credential: string) => {
    setErrorKey(null)
    try {
      const res = await googleLogin(credential)
      setAuth(res.token, res.email, res.role)
      navigate('/faktury')
    } catch (e: any) {
      if (e?.response?.status === 403) {
        if (e?.response?.data === 'Account pending') {
          navigate('/register', { state: { submitted: true } })
        } else {
          setErrorKey('auth.accountDisabled')
        }
      } else {
        setErrorKey('auth.googleError')
      }
    }
  }

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) return

    const init = () => {
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: ({ credential }: { credential: string }) => handleGoogleRef.current(credential),
      })
      const el = document.getElementById('google-btn')
      if (el) window.google?.accounts.id.renderButton(el, { theme: 'outline', size: 'large', width: 360 })
    }

    if (window.google?.accounts) { init(); return }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.onload = init
    document.head.appendChild(script)
  }, [])

  const changeLang = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('lang', code)
  }

  const onSubmit = async (data: FormData) => {
    setErrorKey(null)
    try {
      const res = await login(data)
      setAuth(res.token, res.email, res.role)
      navigate('/faktury')
    } catch (e: any) {
      setErrorKey(e?.response?.status === 403 ? 'auth.accountDisabled' : 'auth.invalidCredentials')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex justify-end gap-1">
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => changeLang(l.code)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${i18n.language === l.code ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 p-8 rounded shadow space-y-4">
          <h1 className="text-2xl font-bold dark:text-gray-100">{t('auth.login')}</h1>

          <div>
            <label className="block text-sm mb-1 dark:text-gray-300">{t('auth.email')}</label>
            <input {...register('email')} type="email" className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-3 py-2 text-sm" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm mb-1 dark:text-gray-300">{t('auth.password')}</label>
            <input {...register('password')} type="password" className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-3 py-2 text-sm" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs text-blue-400 hover:underline">
              {t('auth.forgotPassword')}
            </Link>
          </div>

          {errorKey && <p className="text-red-500 text-sm">{t(errorKey)}</p>}

          <button disabled={isSubmitting} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {t('auth.login')}
          </button>

          {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <hr className="flex-1 border-gray-300 dark:border-gray-600" />
                {t('auth.orWith')}
                <hr className="flex-1 border-gray-300 dark:border-gray-600" />
              </div>
              <div id="google-btn" className="flex justify-center" />
            </>
          )}

          <p className="text-sm text-center dark:text-gray-300">
            {t('auth.noAccount')} <Link to="/register" className="text-blue-400 hover:underline">{t('auth.register')}</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
