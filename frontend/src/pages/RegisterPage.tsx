import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { register as apiRegister } from '../api/auth'

const LANGS = [
  { code: 'cs', label: 'CS' },
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
  { code: 'ua', label: 'UA' },
]

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const { lang } = useParams<{ lang?: string }>()
  const [submitted, setSubmitted] = useState((location.state as any)?.submitted === true)
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (lang && LANGS.some(l => l.code === lang)) {
      i18n.changeLanguage(lang)
      localStorage.setItem('lang', lang)
    }
  }, [lang])

  const changeLang = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('lang', code)
  }

  const onSubmit = async (data: FormData) => {
    try {
      await apiRegister(data)
      setSubmitted(true)
    } catch (e: any) {
      const msg = e?.response?.data ?? ''
      setError('root', { message: typeof msg === 'string' && msg ? msg : t('auth.registerSubtitle') })
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded shadow w-full max-w-sm text-center space-y-4">
          <div className="text-4xl">⏳</div>
          <h1 className="text-xl font-bold dark:text-gray-100">{t('auth.pendingTitle')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('auth.pendingDesc')}</p>
          <Link to="/login" className="block text-blue-400 hover:underline text-sm">{t('auth.goToLogin')}</Link>
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-bold dark:text-gray-100">{t('auth.register')}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('auth.registerSubtitle')}</p>
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
          {errors.root && <p className="text-red-500 text-sm">{errors.root.message}</p>}
          <button disabled={isSubmitting} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50">
            {t('auth.sendRequest')}
          </button>
          <p className="text-sm text-center dark:text-gray-300">
            {t('auth.haveAccount')} <Link to="/login" className="text-blue-400 hover:underline">{t('auth.login')}</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
