import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getShifts, createShift, updateShift, deleteShift } from '../api/driver'
import type { DriverShift, DriverFilter } from '../types/driver'
import Modal from '../components/Modal'

const empty = (): DriverShift => ({
  driverName: '',
  start: new Date().toISOString().slice(0, 16),
  end: new Date().toISOString().slice(0, 16),
  kmStart: 0,
  kmEnd: 0,
  hourlyRate: 0,
})

export default function DriverPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<DriverFilter>({})
  const [editing, setEditing] = useState<DriverShift | null>(null)

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['driver', filter],
    queryFn: () => getShifts(filter),
  })

  const createMut = useMutation({ mutationFn: createShift, onSuccess: () => { qc.invalidateQueries({ queryKey: ['driver'] }); setEditing(null) } })
  const updateMut = useMutation({ mutationFn: ({ id, s }: { id: number; s: DriverShift }) => updateShift(id, s), onSuccess: () => { qc.invalidateQueries({ queryKey: ['driver'] }); setEditing(null) } })
  const deleteMut = useMutation({ mutationFn: deleteShift, onSuccess: () => qc.invalidateQueries({ queryKey: ['driver'] }) })

  const handleSave = (s: DriverShift) => {
    if (editing?.id) updateMut.mutate({ id: editing.id, s })
    else createMut.mutate(s)
  }

  const totalEarnings = shifts.reduce((s, sh) => s + (sh.earnings ?? 0), 0)
  const hasFilter = Object.values(filter).some(Boolean)

  if (isLoading) return <div className="p-4">Načítání...</div>

  return (
    <div className="flex gap-4 items-start">
      <div className="w-60 shrink-0">
        <div className="bg-white rounded shadow p-4 sticky top-4 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700">Filtry</span>
            {hasFilter && <button onClick={() => setFilter({})} className="text-xs text-gray-400 hover:text-red-500">Zrušit</button>}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Jméno řidiče</label>
            <input
              value={filter.driverName ?? ''}
              onChange={e => setFilter(f => ({ ...f, driverName: e.target.value || undefined }))}
              placeholder="Hledat..."
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Datum od</label>
            <input
              type="date"
              value={filter.dateFrom ?? ''}
              onChange={e => setFilter(f => ({ ...f, dateFrom: e.target.value || undefined }))}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Datum do</label>
            <input
              type="date"
              value={filter.dateTo ?? ''}
              onChange={e => setFilter(f => ({ ...f, dateTo: e.target.value || undefined }))}
              className="w-full border rounded px-2 py-1"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Řidičské směny</h1>
            <p className="text-sm text-gray-500 mt-1">
              Celkem výdělků: {totalEarnings.toFixed(2)} Kč
              {hasFilter && <span className="ml-2 text-gray-400">({shifts.length} záznamů)</span>}
            </p>
          </div>
          <button onClick={() => setEditing(empty())} className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
            + Přidat
          </button>
        </div>

        <div className="bg-white rounded shadow overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-2 text-left">Řidič</th>
                <th className="px-4 py-2 text-left">Začátek</th>
                <th className="px-4 py-2 text-left">Konec</th>
                <th className="px-4 py-2 text-right">Km</th>
                <th className="px-4 py-2 text-right">Hod.</th>
                <th className="px-4 py-2 text-right">Sazba/hod</th>
                <th className="px-4 py-2 text-right">Výdělek</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {shifts.map(s => (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{s.driverName}</td>
                  <td className="px-4 py-2">{String(s.start).replace('T', ' ').slice(0, 16)}</td>
                  <td className="px-4 py-2">{String(s.end).replace('T', ' ').slice(0, 16)}</td>
                  <td className="px-4 py-2 text-right">{s.drivenKm ?? Math.max(0, s.kmEnd - s.kmStart)} km</td>
                  <td className="px-4 py-2 text-right">{(s.totalHours ?? 0).toFixed(1)}</td>
                  <td className="px-4 py-2 text-right">{s.hourlyRate} Kč</td>
                  <td className="px-4 py-2 text-right font-semibold">{(s.earnings ?? 0).toFixed(2)} Kč</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditing(s)} className="text-blue-600 hover:underline text-xs">Upravit</button>
                      <button onClick={() => s.id && deleteMut.mutate(s.id)} className="text-red-500 hover:underline text-xs">Smazat</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {shifts.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">Žádné směny</div>}
        </div>
      </div>

      {editing && (
        <Modal title={editing.id ? 'Upravit směnu' : 'Nová směna'} onClose={() => setEditing(null)}>
          <ShiftForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  )
}

function ShiftForm({ initial, onSave, onCancel }: { initial: DriverShift; onSave: (s: DriverShift) => void; onCancel: () => void }) {
  const [form, setForm] = useState<DriverShift>(initial)
  const set = (k: keyof DriverShift, v: unknown) => setForm(prev => ({ ...prev, [k]: v }))
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm mb-1">Jméno řidiče</label>
        <input value={form.driverName} onChange={e => set('driverName', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Začátek</label>
          <input type="datetime-local" value={String(form.start).slice(0, 16)} onChange={e => set('start', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm mb-1">Konec</label>
          <input type="datetime-local" value={String(form.end).slice(0, 16)} onChange={e => set('end', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm mb-1">Km od</label>
          <input type="number" value={form.kmStart} onChange={e => set('kmStart', +e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm mb-1">Km do</label>
          <input type="number" value={form.kmEnd} onChange={e => set('kmEnd', +e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm mb-1">Hodinová sazba (Kč)</label>
          <input type="number" value={form.hourlyRate} onChange={e => set('hourlyRate', +e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2 border-t">
        <button onClick={onCancel} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Zrušit</button>
        <button onClick={() => onSave(form)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Uložit</button>
      </div>
    </div>
  )
}
