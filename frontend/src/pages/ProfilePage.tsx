import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getProfile, changePassword } from '../api/profile'
import { useAuth } from '../context/AuthContext'

const inpLg = 'w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-3 py-2 text-sm'

export default function ProfilePage() {
  const { t } = useTranslation()
  const { logout } = useAuth()
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: getProfile })

  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [saving, setSaving] = useState(false)

  const handleChangePassword = async () => {
    if (newPwd !== confirmPwd) {
      setMsg({ text: t('profile.passwordMismatch'), ok: false })
      return
    }
    if (newPwd.length < 6) {
      setMsg({ text: t('profile.passwordTooShort'), ok: false })
      return
    }
    setSaving(true)
    setMsg(null)
    try {
      await changePassword(oldPwd, newPwd)
      setMsg({ text: t('profile.passwordChanged'), ok: true })
      setOldPwd('')
      setNewPwd('')
      setConfirmPwd('')
    } catch {
      setMsg({ text: t('profile.passwordError'), ok: false })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-bold dark:text-gray-100">{t('profile.title')}</h1>

      <div className="bg-white dark:bg-gray-800 rounded shadow p-4 space-y-2 text-sm">
        <h2 className="font-semibold dark:text-gray-100 mb-3">{t('profile.info')}</h2>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">{t('profile.email')}</span>
          <span className="dark:text-gray-200 font-medium">{profile?.email ?? '...'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">{t('profile.role')}</span>
          <span className={`px-2 py-0.5 rounded text-xs ${profile?.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
            {profile?.role ?? '...'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">{t('profile.since')}</span>
          <span className="dark:text-gray-200">{profile?.createdAt?.slice(0, 10) ?? '...'}</span>
        </div>
      </div>

      {profile?.hasPassword && <div className="bg-white dark:bg-gray-800 rounded shadow p-4 space-y-3">
        <h2 className="font-semibold dark:text-gray-100">{t('profile.changePassword')}</h2>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('profile.oldPassword')}</label>
          <input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} className={inpLg} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('profile.newPassword')}</label>
          <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} className={inpLg} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('profile.confirmPassword')}</label>
          <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} className={inpLg} />
        </div>
        {msg && (
          <p className={`text-sm ${msg.ok ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>{msg.text}</p>
        )}
        <button
          onClick={handleChangePassword}
          disabled={saving || !oldPwd || !newPwd || !confirmPwd}
          className="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? t('common.loading') : t('profile.save')}
        </button>
      </div>}

      <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
        <h2 className="font-semibold text-red-600 dark:text-red-400 mb-2">{t('profile.danger')}</h2>
        <button
          onClick={logout}
          className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
        >
          {t('nav.logout')}
        </button>
      </div>
    </div>
  )
}
