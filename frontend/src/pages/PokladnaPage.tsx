import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { getArchives, createArchive, deleteArchive } from '../api/archives'

export default function PokladnaPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { lang = 'en' } = useParams<{ lang: string }>()

  const [archiveName, setArchiveName] = useState('')
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const { data: archives = [], isLoading } = useQuery({
    queryKey: ['archives'],
    queryFn: getArchives,
  })

  const createMut = useMutation({
    mutationFn: () => createArchive(archiveName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['archives'] })
      setArchiveName('')
      setMsg({ text: t('pokladna.archiveSuccess'), ok: true })
      setTimeout(() => setMsg(null), 3000)
    },
    onError: () => setMsg({ text: t('pokladna.archiveFail'), ok: false }),
  })

  const deleteMut = useMutation({
    mutationFn: deleteArchive,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['archives'] }),
  })

  const handleDelete = (id: number) => {
    if (window.confirm(t('pokladna.deleteConfirm'))) deleteMut.mutate(id)
  }

  const fmt = (dt: string) => {
    const d = new Date(dt)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 dark:text-gray-100">{t('pokladna.title')}</h1>

      <div className="bg-white dark:bg-gray-800 rounded shadow p-4 mb-6 max-w-lg">
        <h2 className="font-semibold mb-2 dark:text-gray-100">{t('pokladna.create')}</h2>
        <div className="flex gap-2">
          <input
            value={archiveName}
            onChange={e => setArchiveName(e.target.value)}
            placeholder={t('pokladna.createName')}
            className="flex-1 border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-3 py-2 text-sm"
            onKeyDown={e => e.key === 'Enter' && createMut.mutate()}
          />
          <button
            onClick={() => createMut.mutate()}
            disabled={createMut.isPending}
            className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 shrink-0"
          >
            {createMut.isPending ? t('pokladna.archiving') : t('pokladna.createBtn')}
          </button>
        </div>
        {msg && (
          <p className={`mt-2 text-sm font-medium ${msg.ok ? 'text-green-600' : 'text-red-500'}`}>{msg.text}</p>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
      ) : archives.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('pokladna.noData')}</p>
      ) : (
        <div className="flex flex-col gap-3 max-w-2xl">
          {archives.map(a => (
            <div key={a.id} className="bg-white dark:bg-gray-800 rounded shadow p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold dark:text-gray-100">{a.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('pokladna.createdAt')}: {fmt(a.createdAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/${lang}/pokladna/${a.id}`)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  {t('pokladna.view')}
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
