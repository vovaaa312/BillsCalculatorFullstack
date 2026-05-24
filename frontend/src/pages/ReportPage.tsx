import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getReportText, downloadReportPdf } from '../api/report'

export default function ReportPage() {
  const [lang, setLang] = useState<'cs' | 'en'>('cs')
  const { data: text, isLoading, refetch } = useQuery({
    queryKey: ['report', lang],
    queryFn: () => getReportText(lang),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Report</h1>
        <div className="flex gap-2">
          <select value={lang} onChange={e => setLang(e.target.value as 'cs' | 'en')} className="border rounded px-2 py-1 text-sm">
            <option value="cs">Čeština</option>
            <option value="en">English</option>
          </select>
          <button onClick={() => refetch()} className="bg-gray-100 border px-3 py-1 rounded text-sm hover:bg-gray-200">
            Obnovit
          </button>
          <button onClick={() => downloadReportPdf(lang)} className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
            Stáhnout PDF
          </button>
        </div>
      </div>

      {isLoading ? (
        <div>Načítání...</div>
      ) : (
        <pre className="bg-white rounded shadow p-4 text-xs font-mono whitespace-pre overflow-auto max-h-[75vh]">
          {text}
        </pre>
      )}
    </div>
  )
}
