import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { resetPassword } from '../api/auth'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''

  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorKey, setErrorKey] = useState('')
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded shadow w-full max-w-sm text-center space-y-4">
          <p className="text-red-500">{t('auth.resetInvalidLink')}</p>
          <Link to="/login" className="text-blue-400 hover:underline text-sm">{t('auth.backToLogin')}</Link>
        </div>
      </div>
    )
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirm) { setErrorKey('profile.passwordMismatch'); return }
    if (newPassword.length < 6) { setErrorKey('profile.passwordTooShort'); return }
    setLoading(true)
    setErrorKey('')
    try {
      await resetPassword(token, newPassword)
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: any) {
      setErrorKey(err?.response?.status === 400 ? 'auth.resetTokenExpired' : 'auth.resetError')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded shadow w-full max-w-sm text-center space-y-4">
          <div className="text-4xl">✅</div>
          <h1 className="text-xl font-bold dark:text-gray-100">{t('auth.resetDoneTitle')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('auth.resetDoneDesc')}</p>
          <Link to="/login" className="block text-blue-400 hover:underline text-sm">{t('auth.backToLogin')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <form onSubmit={onSubmit} className="bg-white dark:bg-gray-800 p-8 rounded shadow w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold dark:text-gray-100">{t('auth.resetTitle')}</h1>
        <div>
          <label className="block text-sm mb-1 dark:text-gray-300">{t('profile.newPassword')}</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 dark:text-gray-300">{t('profile.confirmPassword')}</label>
          <input
            type="password"
            required
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-3 py-2 text-sm"
          />
        </div>
        {errorKey && <p className="text-red-500 text-sm">{t(errorKey)}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t('common.loading') : t('auth.resetSaveBtn')}
        </button>
      </form>
    </div>
  )
}
