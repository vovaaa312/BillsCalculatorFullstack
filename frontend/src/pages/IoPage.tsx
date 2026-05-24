import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { exportData, importData, clearData } from '../api/io'
import { useQueryClient } from '@tanstack/react-query'

export default function IoPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [importing, setImporting] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [msg, setMsg] = useState('')

  const handleImport = async (file: File) => {
    setImporting(true)
    setMsg('')
    try {
      await importData(file)
      qc.invalidateQueries()
      setMsg(t('io.importSuccess'))
    } catch {
      setMsg(t('io.importFail'))
    } finally {
      setImporting(false)
    }
  }

  const handleClear = async () => {
    if (!window.confirm(t('io.clearConfirm'))) return
    setClearing(true)
    try {
      await clearData()
      qc.invalidateQueries()
      setMsg(t('io.clearSuccess'))
    } catch {
      setMsg(t('io.clearFail'))
    } finally {
      setClearing(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 dark:text-gray-100">{t('io.title')}</h1>
      <div className="flex flex-col gap-4 max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
          <h2 className="font-semibold mb-2 dark:text-gray-100">{t('io.exportTitle')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{t('io.exportDesc')}</p>
          <button onClick={exportData} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
            {t('io.exportBtn')}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
          <h2 className="font-semibold mb-2 dark:text-gray-100">{t('io.importTitle')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{t('io.importDesc')}</p>
          <label className={`cursor-pointer bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 ${importing ? 'opacity-50' : ''}`}>
            {importing ? t('io.importing') : t('io.importBtn')}
            <input type="file" accept=".json" disabled={importing} className="hidden" onChange={e => { if (e.target.files?.[0]) handleImport(e.target.files[0]) }} />
          </label>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded shadow p-4 border border-red-200 dark:border-red-900">
          <h2 className="font-semibold mb-2 text-red-600 dark:text-red-400">{t('io.clearTitle')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{t('io.clearDesc')}</p>
          <button onClick={handleClear} disabled={clearing} className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50">
            {clearing ? t('io.clearing') : t('io.clearBtn')}
          </button>
        </div>

        {msg && <p className="text-sm font-medium text-center dark:text-gray-300">{msg}</p>}
      </div>
    </div>
  )
}
