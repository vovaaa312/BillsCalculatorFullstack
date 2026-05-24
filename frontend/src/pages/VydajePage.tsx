import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../api/vydaje'
import type { Expense } from '../types/vydaj'
import Modal from '../components/Modal'

const emptyExpense = (): Expense => ({ name: '', amount: 0, date: new Date().toISOString().slice(0, 10) })

export default function VydajePage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: expenses = [], isLoading } = useQuery({ queryKey: ['expenses'], queryFn: getExpenses })
  const [editing, setEditing] = useState<Expense | null>(null)
  const [search, setSearch] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const createMut = useMutation({ mutationFn: createExpense, onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); setEditing(null) } })
  const updateMut = useMutation({ mutationFn: ({ id, v }: { id: number; v: Expense }) => updateExpense(id, v), onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); setEditing(null) } })
  const deleteMut = useMutation({ mutationFn: deleteExpense, onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }) })

  const handleSave = (v: Expense) => {
    if (editing?.id) updateMut.mutate({ id: editing.id, v })
    else createMut.mutate(v)
  }

  const filtered = useMemo(() => expenses.filter(v => {
    if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false
    if (minAmount && (Number(v.amount) || 0) < Number(minAmount)) return false
    if (maxAmount && (Number(v.amount) || 0) > Number(maxAmount)) return false
    if (dateFrom && v.date && v.date < dateFrom) return false
    if (dateTo && v.date && v.date > dateTo) return false
    return true
  }), [expenses, search, minAmount, maxAmount, dateFrom, dateTo])

  const total = filtered.reduce((s, v) => s + (Number(v.amount) || 0), 0)
  const hasFilter = search || minAmount || maxAmount || dateFrom || dateTo
  const clearFilter = () => { setSearch(''); setMinAmount(''); setMaxAmount(''); setDateFrom(''); setDateTo('') }
  const [showFilter, setShowFilter] = useState(false)

  if (isLoading) return <div className="p-4">{t('common.loading')}</div>

  return (
    <div className="flex gap-4 items-start">
      <div className="hidden md:block w-60 shrink-0">
        <div className="bg-white rounded shadow p-4 sticky top-4">
          <ExpenseFilterPanel search={search} setSearch={setSearch} minAmount={minAmount} setMinAmount={setMinAmount}
            maxAmount={maxAmount} setMaxAmount={setMaxAmount} dateFrom={dateFrom} setDateFrom={setDateFrom}
            dateTo={dateTo} setDateTo={setDateTo} hasFilter={!!hasFilter} onClear={clearFilter} />
        </div>
      </div>

      {showFilter && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden" onClick={() => setShowFilter(false)}>
          <div className="w-full bg-white rounded-t-2xl shadow-xl p-4 pb-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">{t('expense.filterTitle')}</span>
              <button onClick={() => setShowFilter(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <ExpenseFilterPanel search={search} setSearch={setSearch} minAmount={minAmount} setMinAmount={setMinAmount}
              maxAmount={maxAmount} setMaxAmount={setMaxAmount} dateFrom={dateFrom} setDateFrom={setDateFrom}
              dateTo={dateTo} setDateTo={setDateTo} hasFilter={!!hasFilter} onClear={clearFilter} />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{t('expense.title')}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {t('expense.total')}: {total.toFixed(2)} {t('common.currency')}
              {hasFilter && <span className="ml-2 text-gray-400">({filtered.length} / {expenses.length})</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilter(v => !v)}
              className={`md:hidden px-3 py-2 rounded text-sm border ${hasFilter ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}
            >
              {hasFilter ? '🔍●' : '🔍'}
            </button>
            <button onClick={() => setEditing(emptyExpense())} className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
              + <span className="hidden sm:inline">{t('expense.add').replace('+ ','')}</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded shadow overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-2 text-left">{t('expense.colDate')}</th>
                <th className="px-4 py-2 text-left">{t('expense.colName')}</th>
                <th className="px-4 py-2 text-right">{t('expense.colAmount')}</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-500">{v.date ?? '—'}</td>
                  <td className="px-4 py-2">{v.name}</td>
                  <td className="px-4 py-2 text-right font-semibold">{(Number(v.amount) || 0).toFixed(2)} {t('common.currency')}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditing(v)} className="text-blue-600 hover:underline text-xs">{t('common.edit')}</button>
                      <button onClick={() => v.id && deleteMut.mutate(v.id)} className="text-red-500 hover:underline text-xs">{t('common.delete')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">{t('expense.noData')}</div>}
        </div>
      </div>

      {editing && (
        <Modal title={editing.id ? t('expense.edit') : t('expense.new')} onClose={() => setEditing(null)}>
          <ExpenseForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  )
}

interface ExpenseFilterPanelProps {
  search: string; setSearch: (v: string) => void
  minAmount: string; setMinAmount: (v: string) => void
  maxAmount: string; setMaxAmount: (v: string) => void
  dateFrom: string; setDateFrom: (v: string) => void
  dateTo: string; setDateTo: (v: string) => void
  hasFilter: boolean; onClear: () => void
}

function ExpenseFilterPanel({ search, setSearch, minAmount, setMinAmount, maxAmount, setMaxAmount,
  dateFrom, setDateFrom, dateTo, setDateTo, hasFilter, onClear }: ExpenseFilterPanelProps) {
  const { t } = useTranslation()
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-700">{t('expense.filterTitle')}</span>
        {hasFilter && <button onClick={onClear} className="text-xs text-gray-400 hover:text-red-500">{t('expense.filterClear')}</button>}
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">{t('expense.filterName')}</label>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('common.search')} className="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">{t('expense.filterDateFrom')}</label>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">{t('expense.filterDateTo')}</label>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">{t('expense.filterAmountFrom')}</label>
        <input type="number" value={minAmount} onChange={e => setMinAmount(e.target.value)} className="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">{t('expense.filterAmountTo')}</label>
        <input type="number" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} className="w-full border rounded px-2 py-1" />
      </div>
    </div>
  )
}

function ExpenseForm({ initial, onSave, onCancel }: { initial: Expense; onSave: (v: Expense) => void; onCancel: () => void }) {
  const { t } = useTranslation()
  const [form, setForm] = useState<Expense>(initial)
  const set = (k: keyof Expense, v: unknown) => setForm(prev => ({ ...prev, [k]: v }))
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm mb-1">{t('expense.fieldName')}</label>
        <input value={form.name} onChange={e => set('name', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" autoFocus />
      </div>
      <div>
        <label className="block text-sm mb-1">{t('expense.fieldDate')}</label>
        <input type="date" value={form.date ?? ''} onChange={e => set('date', e.target.value || undefined)} className="w-full border rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm mb-1">{t('expense.fieldAmount')}</label>
        <input type="number" value={form.amount} onChange={e => set('amount', +e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2 justify-end pt-2 border-t">
        <button onClick={onCancel} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">{t('common.cancel')}</button>
        <button onClick={() => onSave(form)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">{t('common.save')}</button>
      </div>
    </div>
  )
}
