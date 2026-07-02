import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fmtDate } from '../utils/date'
import Modal from '../components/Modal'
import {
  getUsers, getPendingRequests, approveRequest, rejectRequest,
  deleteUser, toggleUser, downloadBackup, restoreBackup,
  getAuditLogs, clearActivityLogs, clearAllLogs,
  type AuditLog,
} from '../api/admin'

const fmtDateTime = (ts: string) =>
  new Date(ts).toLocaleString(undefined, {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

const fmtDateTimeTz = (ts: string) =>
  new Date(ts).toLocaleString(undefined, {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZoneName: 'short',
  })

const AUDIT_ACTIONS = [
  'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'GOOGLE_LOGIN',
  'REGISTER_REQUEST', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_COMPLETE', 'PASSWORD_CHANGE',
  'ADMIN_APPROVE_REQUEST', 'ADMIN_REJECT_REQUEST', 'ADMIN_DELETE_USER', 'ADMIN_TOGGLE_USER',
  'ADMIN_BACKUP_DOWNLOAD', 'ADMIN_RESTORE',
  'CREATE_INVOICE', 'UPDATE_INVOICE', 'DELETE_INVOICE', 'IMPORT_INVOICE_PDF',
  'CREATE_DRIVER_SHIFT', 'UPDATE_DRIVER_SHIFT', 'DELETE_DRIVER_SHIFT',
  'CREATE_EXPENSE', 'UPDATE_EXPENSE', 'DELETE_EXPENSE',
  'UPDATE_CASH',
  'EXPORT_DATA', 'IMPORT_DATA', 'CLEAR_ALL_DATA', 'CLEAR_INVOICES',
  'CLEAR_EXPENSES', 'CLEAR_DRIVERS', 'CLEAR_CASH',
  'CREATE_ARCHIVE', 'DELETE_ARCHIVE',
]

export default function AdminPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const restoreInputRef = useRef<HTMLInputElement>(null)
  const [restoreMsg, setRestoreMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users')

  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL')
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'active' | 'disabled'>('ALL')

  const [auditEmail, setAuditEmail] = useState('')
  const [auditAction, setAuditAction] = useState('')
  const [auditCategory, setAuditCategory] = useState('')
  const [auditStatus, setAuditStatus] = useState('')
  const [auditDateFrom, setAuditDateFrom] = useState('')
  const [auditDateTo, setAuditDateTo] = useState('')
  const [auditPage, setAuditPage] = useState(0)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  useEffect(() => { setAuditPage(0) }, [auditEmail, auditAction, auditCategory, auditStatus, auditDateFrom, auditDateTo])

  const { data: users = [] } = useQuery({ queryKey: ['admin-users'], queryFn: getUsers })
  const { data: requests = [] } = useQuery({ queryKey: ['admin-requests'], queryFn: getPendingRequests })
  const { data: auditData } = useQuery({
    queryKey: ['audit-logs', auditEmail, auditAction, auditCategory, auditStatus, auditDateFrom, auditDateTo, auditPage],
    queryFn: () => getAuditLogs({
      userEmail: auditEmail || undefined,
      action: auditAction || undefined,
      category: auditCategory || undefined,
      status: auditStatus || undefined,
      dateFrom: auditDateFrom || undefined,
      dateTo: auditDateTo || undefined,
      page: auditPage,
      size: 50,
    }),
    enabled: activeTab === 'audit',
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-users'] })
    qc.invalidateQueries({ queryKey: ['admin-requests'] })
  }

  const approveMut = useMutation({ mutationFn: approveRequest, onSuccess: invalidate })
  const rejectMut = useMutation({ mutationFn: rejectRequest, onSuccess: invalidate })
  const deleteMut = useMutation({ mutationFn: deleteUser, onSuccess: invalidate })
  const toggleMut = useMutation({ mutationFn: toggleUser, onSuccess: invalidate })
  const clearActivityMut = useMutation({
    mutationFn: clearActivityLogs,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit-logs'] }),
  })
  const clearAllMut = useMutation({
    mutationFn: clearAllLogs,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit-logs'] }),
  })

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    if (!confirm(t('admin.restoreConfirm'))) return
    setRestoring(true)
    setRestoreMsg(null)
    try {
      const result = await restoreBackup(file)
      setRestoreMsg({ text: t('admin.restoreSuccess', result), ok: true })
      invalidate()
    } catch {
      setRestoreMsg({ text: t('admin.restoreFail'), ok: false })
    } finally {
      setRestoring(false)
    }
  }

  const filtered = users.filter(u => {
    if (search && !u.email.toLowerCase().includes(search.toLowerCase())) return false
    if (filterRole !== 'ALL' && u.role !== filterRole) return false
    if (filterStatus === 'active' && !u.enabled) return false
    if (filterStatus === 'disabled' && u.enabled) return false
    return true
  })

  const auditLogs = auditData?.content ?? []
  const totalPages = auditData?.totalPages ?? 0
  const totalElements = auditData?.totalElements ?? 0
  const hasAuditFilters = !!(auditEmail || auditAction || auditCategory || auditStatus || auditDateFrom || auditDateTo)

  const inputCls = 'border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-2 py-1 text-sm'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold dark:text-gray-100">{t('admin.title')}</h1>
        <div className="flex gap-2 items-center">
          {restoreMsg && (
            <span className={`text-sm ${restoreMsg.ok ? 'text-green-500' : 'text-red-500'}`}>{restoreMsg.text}</span>
          )}
          <label className={`cursor-pointer px-4 py-2 rounded text-sm text-white ${restoring ? 'bg-orange-400 opacity-60' : 'bg-orange-500 hover:bg-orange-600'}`}>
            {restoring ? '...' : t('admin.restore')}
            <input ref={restoreInputRef} type="file" accept=".json" className="hidden" disabled={restoring} onChange={handleRestore} />
          </label>
          <button onClick={downloadBackup} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
            {t('admin.backup')}
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b dark:border-gray-700">
        {(['users', 'audit'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {tab === 'users' ? (
              <>
                {t('admin.tabUsers')}
                {requests.length > 0 && (
                  <span className="ml-1.5 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">{requests.length}</span>
                )}
              </>
            ) : t('admin.tabAudit')}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="space-y-4">
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
                      <span className="ml-2 text-xs text-gray-400">{fmtDate(r.createdAt)}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => approveMut.mutate(r.id)} disabled={approveMut.isPending}
                        className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50">
                        {t('admin.approve')}
                      </button>
                      <button onClick={() => rejectMut.mutate(r.id)} disabled={rejectMut.isPending}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50">
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
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t('common.search')}
                className={`${inputCls} flex-1 min-w-36`} />
              <select value={filterRole} onChange={e => setFilterRole(e.target.value as typeof filterRole)} className={inputCls}>
                <option value="ALL">{t('admin.filterRoleAll')}</option>
                <option value="ADMIN">Admin</option>
                <option value="USER">User</option>
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as typeof filterStatus)} className={inputCls}>
                <option value="ALL">{t('admin.filterStatusAll')}</option>
                <option value="active">{t('admin.statusActive')}</option>
                <option value="disabled">{t('admin.statusDisabled')}</option>
              </select>
              {(search || filterRole !== 'ALL' || filterStatus !== 'ALL') && (
                <button onClick={() => { setSearch(''); setFilterRole('ALL'); setFilterStatus('ALL') }}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1">
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
                    <td className="px-4 py-2 text-gray-500 dark:text-gray-400 text-xs">{fmtDate(u.createdAt)}</td>
                    <td className="px-4 py-2">
                      {u.role !== 'ADMIN' && (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => toggleMut.mutate(u.id)} className="text-xs text-blue-500 hover:underline">
                            {u.enabled ? t('admin.disable') : t('admin.enable')}
                          </button>
                          <button onClick={() => { if (confirm(t('admin.deleteConfirm'))) deleteMut.mutate(u.id) }}
                            className="text-xs text-red-500 hover:underline">
                            {t('common.delete')}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400 text-sm">{t('common.noResults')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded shadow px-4 py-3 flex flex-wrap gap-2 items-center">
            <input type="text" value={auditEmail} onChange={e => setAuditEmail(e.target.value)}
              placeholder={t('audit.filterEmail')} className={`${inputCls} flex-1 min-w-36`} />
            <select value={auditAction} onChange={e => setAuditAction(e.target.value)} className={inputCls}>
              <option value="">{t('audit.filterAction')}</option>
              {AUDIT_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={auditCategory} onChange={e => setAuditCategory(e.target.value)} className={inputCls}>
              <option value="">{t('audit.filterCategory')}</option>
              <option value="SECURITY">{t('audit.categorySecurity')}</option>
              <option value="ACTIVITY">{t('audit.categoryActivity')}</option>
            </select>
            <select value={auditStatus} onChange={e => setAuditStatus(e.target.value)} className={inputCls}>
              <option value="">{t('audit.filterStatus')}</option>
              <option value="SUCCESS">{t('audit.statusSuccess')}</option>
              <option value="FAILURE">{t('audit.statusFailure')}</option>
            </select>
            <input type="date" value={auditDateFrom} onChange={e => setAuditDateFrom(e.target.value)} className={inputCls} />
            <input type="date" value={auditDateTo} onChange={e => setAuditDateTo(e.target.value)} className={inputCls} />
            {hasAuditFilters && (
              <button onClick={() => { setAuditEmail(''); setAuditAction(''); setAuditCategory(''); setAuditStatus(''); setAuditDateFrom(''); setAuditDateTo('') }}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1">
                {t('invoice.filterClear')}
              </button>
            )}
            <span className="text-xs text-gray-400 ml-auto">{totalElements} {t('common.records')}</span>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded shadow overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">{t('audit.colTimestamp')}</th>
                  <th className="px-4 py-2 text-left">{t('audit.colUser')}</th>
                  <th className="px-4 py-2 text-left">{t('audit.colAction')}</th>
                  <th className="px-4 py-2 text-left">{t('audit.colCategory')}</th>
                  <th className="px-4 py-2 text-left">{t('audit.colStatus')}</th>
                  <th className="px-4 py-2 text-left">{t('audit.colIp')}</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-100">
                    <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {fmtDateTime(log.timestamp)}
                    </td>
                    <td className="px-4 py-2 text-xs max-w-32 truncate" title={log.userEmail ?? ''}>{log.userEmail ?? '-'}</td>
                    <td className="px-4 py-2 font-mono text-xs">{log.action}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${log.category === 'SECURITY' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'}`}>
                        {log.category === 'SECURITY' ? t('audit.categorySecurity') : t('audit.categoryActivity')}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                        {log.status === 'SUCCESS' ? t('audit.statusSuccess') : t('audit.statusFailure')}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">{log.ipAddress ?? '-'}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => setSelectedLog(log)} className="text-xs text-blue-500 hover:underline">
                        {t('audit.viewDetails')}
                      </button>
                    </td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400 text-sm">{t('audit.noLogs')}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <button onClick={() => setAuditPage(p => Math.max(0, p - 1))} disabled={auditPage === 0}
                className="px-3 py-1 rounded border dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200">
                ← {t('common.prev')}
              </button>
              <span className="text-gray-500 dark:text-gray-400">{auditPage + 1} / {totalPages}</span>
              <button onClick={() => setAuditPage(p => Math.min(totalPages - 1, p + 1))} disabled={auditPage >= totalPages - 1}
                className="px-3 py-1 rounded border dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200">
                {t('common.next')} →
              </button>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button onClick={() => { if (confirm(t('audit.clearActivityConfirm'))) clearActivityMut.mutate() }}
              disabled={clearActivityMut.isPending}
              className="text-sm px-3 py-1.5 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50">
              {t('audit.clearActivity')}
            </button>
            <button onClick={() => { if (confirm(t('audit.clearAllConfirm'))) clearAllMut.mutate() }}
              disabled={clearAllMut.isPending}
              className="text-sm px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">
              {t('audit.clearAll')}
            </button>
          </div>
        </div>
      )}

      {selectedLog && (
        <Modal title={t('audit.detailTitle')} onClose={() => setSelectedLog(null)}>
          <div className="space-y-3 text-sm dark:text-gray-200">
            {([
              ['Action', selectedLog.action],
              ['Status', selectedLog.status],
              ['Category', selectedLog.category],
              ['User', selectedLog.userEmail ?? '-'],
              ['IP', selectedLog.ipAddress ?? '-'],
              ['Entity', selectedLog.entityType
                ? `${selectedLog.entityType}${selectedLog.entityId ? ' #' + selectedLog.entityId : ''}`
                : '-'],
              ['Time', fmtDateTimeTz(selectedLog.timestamp)],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <span className="font-medium text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">{label}</span>
                <span className="break-all">{value}</span>
              </div>
            ))}
            {selectedLog.details && (
              <div className="flex gap-2">
                <span className="font-medium text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">Details</span>
                <span className="break-all text-red-600 dark:text-red-400">{selectedLog.details}</span>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
