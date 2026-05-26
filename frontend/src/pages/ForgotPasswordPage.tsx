import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { forgotPassword } from '../api/auth'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await forgotPassword(email)
      setSent(true)
    } catch {
      setError(t('auth.resetSendError'))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded shadow w-full max-w-sm text-center space-y-4">
          <div className="text-4xl">📧</div>
          <h1 className="text-xl font-bold dark:text-gray-100">{t('auth.resetSentTitle')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('auth.resetSentDesc')}</p>
          <Link to="/login" className="block text-blue-400 hover:underline text-sm">{t('auth.backToLogin')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <form onSubmit={onSubmit} className="bg-white dark:bg-gray-800 p-8 rounded shadow w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold dark:text-gray-100">{t('auth.forgotPassword')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('auth.forgotDesc')}</p>
        <div>
          <label className="block text-sm mb-1 dark:text-gray-300">{t('auth.email')}</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t('common.loading') : t('auth.resetSendBtn')}
        </button>
        <p className="text-sm text-center">
          <Link to="/login" className="text-blue-400 hover:underline">{t('auth.backToLogin')}</Link>
        </p>
      </form>
    </div>
  )
}
