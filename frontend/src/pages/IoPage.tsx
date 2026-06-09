import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { exportData, importData, clearData } from '../api/io'
import { createArchive } from '../api/archives'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import ClearConfirmModal from '../components/ClearConfirmModal'

export default function IoPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { lang = 'en' } = useParams<{ lang: string }>()

  const [importing, setImporting] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [archiveName, setArchiveName] = useState('')
  const [msg, setMsg] = useState('')
  const [showClear, setShowClear] = useState(false)
  const [clearing, setClearing] = useState(false)

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

  const handleClearAll = async () => {
    setClearing(true)
    setMsg('')
    try {
      await clearData()
      qc.invalidateQueries()
      setShowClear(false)
      setMsg(t('io.clearSuccess'))
    } catch {
      setMsg(t('io.clearFail'))
    } finally {
      setClearing(false)
    }
  }

  const handleArchive = async () => {
    setArchiving(true)
    setMsg('')
    try {
      await createArchive(archiveName)
      qc.invalidateQueries({ queryKey: ['archives'] })
      setArchiveName('')
      setMsg(t('pokladna.archiveSuccess'))
      setTimeout(() => navigate(`/${lang}/pokladna`), 1000)
    } catch {
      setMsg(t('pokladna.archiveFail'))
    } finally {
      setArchiving(false)
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

        <div className="bg-white dark:bg-gray-800 rounded shadow p-4 border border-purple-200 dark:border-purple-900">
          <h2 className="font-semibold mb-2 dark:text-gray-100">{t('pokladna.create')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {t('io.archiveDesc', 'Saves a snapshot of all your current data to the archive for later viewing.')}
          </p>
          <div className="flex gap-2 mb-3">
            <input
              value={archiveName}
              onChange={e => setArchiveName(e.target.value)}
              placeholder={t('pokladna.createName')}
              className="flex-1 border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-3 py-2 text-sm"
              onKeyDown={e => e.key === 'Enter' && handleArchive()}
            />
            <button
              onClick={handleArchive}
              disabled={archiving}
              className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 shrink-0"
            >
              {archiving ? t('pokladna.archiving') : t('pokladna.createBtn')}
            </button>
          </div>
          <button
            onClick={() => navigate(`/${lang}/pokladna`)}
            className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
          >
            {t('pokladna.title')} →
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded shadow p-4 border border-red-200 dark:border-red-900">
          <h2 className="font-semibold mb-2 dark:text-gray-100">{t('io.clearTitle')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{t('io.clearDesc')}</p>
          <button
            onClick={() => setShowClear(true)}
            className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
          >
            {t('io.clearBtn')}
          </button>
        </div>

        {msg && <p className="text-sm font-medium text-center dark:text-gray-300">{msg}</p>}
      </div>

      {showClear && (
        <ClearConfirmModal onConfirm={handleClearAll} onClose={() => setShowClear(false)} clearing={clearing} />
      )}
    </div>
  )
}
