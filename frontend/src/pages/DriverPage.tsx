import { useState, type Dispatch, type SetStateAction } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<DriverFilter>({})
  const [editing, setEditing] = useState<DriverShift | null>(null)

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['driver', filter],
    queryFn: () => getShifts(filter),
    placeholderData: (prev) => prev,
  })

  const createMut = useMutation({ mutationFn: createShift, onSuccess: () => { qc.invalidateQueries({ queryKey: ['driver'] }); setEditing(null) } })
  const updateMut = useMutation({ mutationFn: ({ id, s }: { id: number; s: DriverShift }) => updateShift(id, s), onSuccess: () => { qc.invalidateQueries({ queryKey: ['driver'] }); setEditing(null) } })
  const deleteMut = useMutation({ mutationFn: deleteShift, onSuccess: () => qc.invalidateQueries({ queryKey: ['driver'] }) })

  const handleSave = (s: DriverShift) => {
    if (editing?.id) updateMut.mutate({ id: editing.id, s })
    else createMut.mutate(s)
  }

  const [showFilter, setShowFilter] = useState(false)
  const totalEarnings = shifts.reduce((s, sh) => s + (sh.earnings ?? 0), 0)
  const hasFilter = Object.values(filter).some(Boolean)

  if (isLoading) return <div className="p-4">{t('common.loading')}</div>

  return (
    <div className="flex gap-4 items-start">
      <div className="hidden md:block w-60 shrink-0">
        <div className="bg-white rounded shadow p-4 sticky top-4">
          <DriverFilterPanel filter={filter} setFilter={setFilter} hasFilter={hasFilter} />
        </div>
      </div>

      {showFilter && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden" onClick={() => setShowFilter(false)}>
          <div className="w-full bg-white rounded-t-2xl shadow-xl p-4 pb-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">{t('driver.filterTitle')}</span>
              <button onClick={() => setShowFilter(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <DriverFilterPanel filter={filter} setFilter={setFilter} hasFilter={hasFilter} />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{t('driver.title')}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {t('driver.totalEarnings')}: {totalEarnings.toFixed(2)} {t('common.currency')}
              {hasFilter && <span className="ml-2 text-gray-400">({shifts.length} {t('common.records')})</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilter(v => !v)}
              className={`md:hidden px-3 py-2 rounded text-sm border ${hasFilter ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}
            >
              {hasFilter ? '🔍●' : '🔍'}
            </button>
            <button onClick={() => setEditing(empty())} className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
              + <span className="hidden sm:inline">{t('driver.add').replace('+ ','')}</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded shadow overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-2 text-left">{t('driver.colDriver')}</th>
                <th className="px-4 py-2 text-left">{t('driver.colStart')}</th>
                <th className="px-4 py-2 text-left">{t('driver.colEnd')}</th>
                <th className="px-4 py-2 text-right">{t('driver.colKm')}</th>
                <th className="px-4 py-2 text-right">{t('driver.colHours')}</th>
                <th className="px-4 py-2 text-right">{t('driver.colRate')}</th>
                <th className="px-4 py-2 text-right">{t('driver.colEarnings')}</th>
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
                  <td className="px-4 py-2 text-right">{s.hourlyRate} {t('common.currency')}</td>
                  <td className="px-4 py-2 text-right font-semibold">{(s.earnings ?? 0).toFixed(2)} {t('common.currency')}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditing(s)} className="text-blue-600 hover:underline text-xs">{t('common.edit')}</button>
                      <button onClick={() => s.id && deleteMut.mutate(s.id)} className="text-red-500 hover:underline text-xs">{t('common.delete')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {shifts.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">{t('driver.noData')}</div>}
        </div>
      </div>

      {editing && (
        <Modal title={editing.id ? t('driver.edit') : t('driver.new')} onClose={() => setEditing(null)}>
          <ShiftForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  )
}

function DriverFilterPanel({ filter, setFilter, hasFilter }: {
  filter: DriverFilter
  setFilter: Dispatch<SetStateAction<DriverFilter>>
  hasFilter: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-700">{t('driver.filterTitle')}</span>
        {hasFilter && <button onClick={() => setFilter({})} className="text-xs text-gray-400 hover:text-red-500">{t('driver.filterClear')}</button>}
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">{t('driver.filterDriver')}</label>
        <input
          value={filter.driverName ?? ''}
          onChange={e => setFilter(f => ({ ...f, driverName: e.target.value || undefined }))}
          placeholder={t('common.search')}
          className="w-full border rounded px-2 py-1"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">{t('driver.filterDateFrom')}</label>
        <input
          type="date"
          value={filter.dateFrom ?? ''}
          onChange={e => setFilter(f => ({ ...f, dateFrom: e.target.value || undefined }))}
          className="w-full border rounded px-2 py-1"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">{t('driver.filterDateTo')}</label>
        <input
          type="date"
          value={filter.dateTo ?? ''}
          onChange={e => setFilter(f => ({ ...f, dateTo: e.target.value || undefined }))}
          className="w-full border rounded px-2 py-1"
        />
      </div>
    </div>
  )
}

function ShiftForm({ initial, onSave, onCancel }: { initial: DriverShift; onSave: (s: DriverShift) => void; onCancel: () => void }) {
  const { t } = useTranslation()
  const [form, setForm] = useState<DriverShift>(initial)
  const set = (k: keyof DriverShift, v: unknown) => setForm(prev => ({ ...prev, [k]: v }))
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm mb-1">{t('driver.fieldDriver')}</label>
        <input value={form.driverName} onChange={e => set('driverName', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">{t('driver.fieldStart')}</label>
          <input type="datetime-local" value={String(form.start).slice(0, 16)} onChange={e => set('start', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm mb-1">{t('driver.fieldEnd')}</label>
          <input type="datetime-local" value={String(form.end).slice(0, 16)} onChange={e => set('end', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm mb-1">{t('driver.fieldKmFrom')}</label>
          <input type="number" value={form.kmStart} onChange={e => set('kmStart', +e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm mb-1">{t('driver.fieldKmTo')}</label>
          <input type="number" value={form.kmEnd} onChange={e => set('kmEnd', +e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm mb-1">{t('driver.fieldRate')}</label>
          <input type="number" value={form.hourlyRate} onChange={e => set('hourlyRate', +e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2 border-t">
        <button onClick={onCancel} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">{t('common.cancel')}</button>
        <button onClick={() => onSave(form)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">{t('common.save')}</button>
      </div>
    </div>
  )
}
