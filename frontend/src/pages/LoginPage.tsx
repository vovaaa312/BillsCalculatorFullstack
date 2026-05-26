import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'

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
          {errorKey && <p className="text-red-500 text-sm">{t(errorKey)}</p>}
          <button disabled={isSubmitting} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {t('auth.login')}
          </button>
          <p className="text-sm text-center dark:text-gray-300">
            {t('auth.noAccount')} <Link to="/register" className="text-blue-400 hover:underline">{t('auth.register')}</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
