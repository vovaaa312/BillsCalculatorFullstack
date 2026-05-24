import { useState } from 'react'
import { exportData, importData, clearData } from '../api/io'
import { useQueryClient } from '@tanstack/react-query'

export default function IoPage() {
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
      setMsg('Import úspěšný.')
    } catch {
      setMsg('Import se nezdařil.')
    } finally {
      setImporting(false)
    }
  }

  const handleClear = async () => {
    if (!window.confirm('Opravdu smazat všechna data?')) return
    setClearing(true)
    try {
      await clearData()
      qc.invalidateQueries()
      setMsg('Data vymazána.')
    } catch {
      setMsg('Mazání se nezdařilo.')
    } finally {
      setClearing(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Import / Export</h1>
      <div className="flex flex-col gap-4 max-w-md">
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-2">Export JSON</h2>
          <p className="text-sm text-gray-600 mb-3">Stáhne všechna vaše data jako data.json (kompatibilní s Android aplikací).</p>
          <button onClick={exportData} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
            Exportovat
          </button>
        </div>

        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-2">Import JSON</h2>
          <p className="text-sm text-gray-600 mb-3">Nahraje data ze souboru JSON (přepíše stávající data).</p>
          <label className={`cursor-pointer bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 ${importing ? 'opacity-50' : ''}`}>
            {importing ? 'Importuji...' : 'Vybrat soubor'}
            <input type="file" accept=".json" disabled={importing} className="hidden" onChange={e => { if (e.target.files?.[0]) handleImport(e.target.files[0]) }} />
          </label>
        </div>

        <div className="bg-white rounded shadow p-4 border border-red-200">
          <h2 className="font-semibold mb-2 text-red-600">Smazat data</h2>
          <p className="text-sm text-gray-600 mb-3">Nenávratně smaže všechna vaše data.</p>
          <button onClick={handleClear} disabled={clearing} className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50">
            {clearing ? 'Mazání...' : 'Smazat vše'}
          </button>
        </div>

        {msg && <p className="text-sm font-medium text-center">{msg}</p>}
      </div>
    </div>
  )
}
