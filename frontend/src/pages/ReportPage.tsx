import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getReportText, downloadReportPdf } from '../api/report'

export default function ReportPage() {
  const { t } = useTranslation()
  const [lang, setLang] = useState<'cs' | 'en'>('cs')
  const { data: text, isLoading, refetch } = useQuery({
    queryKey: ['report', lang],
    queryFn: () => getReportText(lang),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold dark:text-gray-100">{t('report.title')}</h1>
        <div className="flex gap-2">
          <select value={lang} onChange={e => setLang(e.target.value as 'cs' | 'en')} className="border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-2 py-1 text-sm">
            <option value="cs">{t('report.langCs')}</option>
            <option value="en">{t('report.langEn')}</option>
          </select>
          <button onClick={() => refetch()} className="bg-gray-100 dark:bg-gray-700 dark:text-gray-100 border dark:border-gray-600 px-3 py-1 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600">
            {t('report.refresh')}
          </button>
          <button onClick={() => downloadReportPdf(lang)} className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
            {t('report.downloadPdf')}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="dark:text-gray-300">{t('report.loading')}</div>
      ) : (
        <pre className="bg-white dark:bg-gray-800 dark:text-gray-100 rounded shadow p-4 text-xs font-mono whitespace-pre overflow-auto max-h-[75vh]">
          {text}
        </pre>
      )}
    </div>
  )
}
