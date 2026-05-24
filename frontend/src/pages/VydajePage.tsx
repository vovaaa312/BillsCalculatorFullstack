import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getVydaje, createVydaj, updateVydaj, deleteVydaj } from '../api/vydaje'
import type { Vydaj } from '../types/vydaj'
import Modal from '../components/Modal'

const empty = (): Vydaj => ({ nazev: '', castka: 0 })

export default function VydajePage() {
  const qc = useQueryClient()
  const { data: vydaje = [], isLoading } = useQuery({ queryKey: ['vydaje'], queryFn: getVydaje })
  const [editing, setEditing] = useState<Vydaj | null>(null)

  const createMut = useMutation({ mutationFn: createVydaj, onSuccess: () => { qc.invalidateQueries({ queryKey: ['vydaje'] }); setEditing(null) } })
  const updateMut = useMutation({ mutationFn: ({ id, v }: { id: number; v: Vydaj }) => updateVydaj(id, v), onSuccess: () => { qc.invalidateQueries({ queryKey: ['vydaje'] }); setEditing(null) } })
  const deleteMut = useMutation({ mutationFn: deleteVydaj, onSuccess: () => qc.invalidateQueries({ queryKey: ['vydaje'] }) })

  const handleSave = (v: Vydaj) => {
    if (editing?.id) updateMut.mutate({ id: editing.id, v })
    else createMut.mutate(v)
  }

  const total = vydaje.reduce((s, v) => s + (Number(v.castka) || 0), 0)

  if (isLoading) return <div className="p-4">Načítání...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Výdaje</h1>
          <p className="text-sm text-gray-500 mt-1">Celkem: {total.toFixed(2)} Kč</p>
        </div>
        <button onClick={() => setEditing(empty())} className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
          + Přidat
        </button>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-2 text-left">Název</th>
              <th className="px-4 py-2 text-right">Částka</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {vydaje.map(v => (
              <tr key={v.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{v.nazev}</td>
                <td className="px-4 py-2 text-right font-semibold">{(Number(v.castka) || 0).toFixed(2)} Kč</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditing(v)} className="text-blue-600 hover:underline text-xs">Upravit</button>
                    <button onClick={() => v.id && deleteMut.mutate(v.id)} className="text-red-500 hover:underline text-xs">Smazat</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {vydaje.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">Žádné výdaje</div>}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Upravit výdaj' : 'Nový výdaj'} onClose={() => setEditing(null)}>
          <VydajForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  )
}

function VydajForm({ initial, onSave, onCancel }: { initial: Vydaj; onSave: (v: Vydaj) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Vydaj>(initial)
  const set = (k: keyof Vydaj, v: unknown) => setForm(prev => ({ ...prev, [k]: v }))
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm mb-1">Název</label>
        <input value={form.nazev} onChange={e => set('nazev', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" autoFocus />
      </div>
      <div>
        <label className="block text-sm mb-1">Částka (Kč)</label>
        <input type="number" value={form.castka} onChange={e => set('castka', +e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2 justify-end pt-2 border-t">
        <button onClick={onCancel} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Zrušit</button>
        <button onClick={() => onSave(form)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Uložit</button>
      </div>
    </div>
  )
}
