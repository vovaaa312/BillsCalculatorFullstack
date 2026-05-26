import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  getUsers, getPendingRequests, approveRequest, rejectRequest,
  deleteUser, toggleUser, downloadBackup,
} from '../api/admin'

export default function AdminPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL')
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'active' | 'disabled'>('ALL')

  const { data: users = [] } = useQuery({ queryKey: ['admin-users'], queryFn: getUsers })
  const { data: requests = [] } = useQuery({ queryKey: ['admin-requests'], queryFn: getPendingRequests })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-users'] })
    qc.invalidateQueries({ queryKey: ['admin-requests'] })
  }

  const approveMut = useMutation({ mutationFn: approveRequest, onSuccess: invalidate })
  const rejectMut = useMutation({ mutationFn: rejectRequest, onSuccess: invalidate })
  const deleteMut = useMutation({ mutationFn: deleteUser, onSuccess: invalidate })
  const toggleMut = useMutation({ mutationFn: toggleUser, onSuccess: invalidate })

  const filtered = users.filter(u => {
    if (search && !u.email.toLowerCase().includes(search.toLowerCase())) return false
    if (filterRole !== 'ALL' && u.role !== filterRole) return false
    if (filterStatus === 'active' && !u.enabled) return false
    if (filterStatus === 'disabled' && u.enabled) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold dark:text-gray-100">{t('admin.title')}</h1>
        <button
          onClick={downloadBackup}
          className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
        >
          {t('admin.backup')}
        </button>
      </div>

      {requests.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
          <h2 className="font-semibold mb-3 text-amber-600 dark:text-amber-400">
            {t('admin.pendingRequests')} ({requests.length})
          </h2>
          <div className="space-y-2">
            {requests.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-0">
                <div>
                  <span className="text-sm font-medium dark:text-gray-200">{r.email}</span>
                  <span className="ml-2 text-xs text-gray-400">{r.createdAt.slice(0, 10)}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveMut.mutate(r.id)}
                    disabled={approveMut.isPending}
                    className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                  >
                    {t('admin.approve')}
                  </button>
                  <button
                    onClick={() => rejectMut.mutate(r.id)}
                    disabled={rejectMut.isPending}
                    className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                  >
                    {t('admin.reject')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded shadow overflow-auto">
        <div className="px-4 py-3 border-b dark:border-gray-700 flex flex-wrap gap-2 items-center">
          <h2 className="font-semibold dark:text-gray-100 mr-2">{t('admin.users')}</h2>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('common.search')}
            className="border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-3 py-1 text-sm flex-1 min-w-36"
          />
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value as typeof filterRole)}
            className="border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-2 py-1 text-sm"
          >
            <option value="ALL">{t('admin.filterRoleAll')}</option>
            <option value="ADMIN">Admin</option>
            <option value="USER">User</option>
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
            className="border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-2 py-1 text-sm"
          >
            <option value="ALL">{t('admin.filterStatusAll')}</option>
            <option value="active">{t('admin.statusActive')}</option>
            <option value="disabled">{t('admin.statusDisabled')}</option>
          </select>
          {(search || filterRole !== 'ALL' || filterStatus !== 'ALL') && (
            <button
              onClick={() => { setSearch(''); setFilterRole('ALL'); setFilterStatus('ALL') }}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1"
            >
              {t('invoice.filterClear')}
            </button>
          )}
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} {t('common.records')}</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs uppercase">
            <tr>
              <th className="px-4 py-2 text-left">{t('admin.colEmail')}</th>
              <th className="px-4 py-2 text-left">{t('admin.colRole')}</th>
              <th className="px-4 py-2 text-left">{t('admin.colStatus')}</th>
              <th className="px-4 py-2 text-left">{t('admin.colCreated')}</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-100">
                <td className="px-4 py-2 font-medium">{u.email}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${u.enabled ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                    {u.enabled ? t('admin.statusActive') : t('admin.statusDisabled')}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-500 dark:text-gray-400 text-xs">{u.createdAt.slice(0, 10)}</td>
                <td className="px-4 py-2">
                  {u.role !== 'ADMIN' && (
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => toggleMut.mutate(u.id)}
                        className="text-xs text-blue-500 hover:underline"
                      >
                        {u.enabled ? t('admin.disable') : t('admin.enable')}
                      </button>
                      <button
                        onClick={() => { if (confirm(t('admin.deleteConfirm'))) deleteMut.mutate(u.id) }}
                        className="text-xs text-red-500 hover:underline"
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400 text-sm">{t('common.noResults')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
