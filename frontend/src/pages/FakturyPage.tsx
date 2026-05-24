import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getInvoices, createInvoice, updateInvoice, deleteInvoice, importInvoicesPdf } from '../api/faktury'
import type { Invoice, InvoiceItem, InvoiceFilter, PaymentType, InvoiceStatus } from '../types/faktura'
import Modal from '../components/Modal'

const emptyInvoice = (): Invoice => ({
  name: '',
  amount: 0,
  paymentType: 'PREVOD',
  status: 'NESPLNENA',
  date: new Date().toISOString().slice(0, 10),
  items: [],
})

const emptyItem = (): InvoiceItem => ({
  name: '', quantity: 1, unitPrice: 0, unitPriceNoVat: 0, price: 0, vatPercent: 12, vatAmount: 0, totalPrice: 0,
})

export default function FakturyPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<InvoiceFilter>({})
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', filter],
    queryFn: () => getInvoices(filter),
    placeholderData: (prev) => prev,
  })

  const createMut = useMutation({ mutationFn: createInvoice, onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); setEditing(null) } })
  const updateMut = useMutation({ mutationFn: ({ id, f }: { id: number; f: Invoice }) => updateInvoice(id, f), onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); setEditing(null) } })
  const deleteMut = useMutation({ mutationFn: deleteInvoice, onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }) })
  const importMut = useMutation({ mutationFn: importInvoicesPdf, onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }) })

  const handleSave = (f: Invoice) => {
    if (editing?.id) updateMut.mutate({ id: editing.id, f })
    else createMut.mutate(f)
  }

  const toggleExpand = (id: number) => setExpanded(prev => {
    const s = new Set(prev)
    s.has(id) ? s.delete(id) : s.add(id)
    return s
  })

  const [showFilter, setShowFilter] = useState(false)
  const totalAmount = invoices.reduce((s, f) => s + (f.totalPrice ?? f.amount ?? 0), 0)
  const hasFilter = Object.values(filter).some(Boolean)

  if (isLoading) return <div className="p-4">{t('common.loading')}</div>

  return (
    <div className="flex gap-4 items-start">
      <div className="hidden md:block w-60 shrink-0">
        <FilterPanel filter={filter} onChange={setFilter} onClear={() => setFilter({})} />
      </div>

      {showFilter && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden" onClick={() => setShowFilter(false)}>
          <div className="w-full bg-white rounded-t-2xl shadow-xl p-4 pb-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">{t('invoice.filterTitle')}</span>
              <button onClick={() => setShowFilter(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <FilterPanel filter={filter} onChange={f => setFilter(f)} onClear={() => { setFilter({}); setShowFilter(false) }} />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{t('invoice.title')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('invoice.total')}: {totalAmount.toFixed(2)} {t('common.currency')}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilter(v => !v)}
              className={`md:hidden px-3 py-2 rounded text-sm border ${hasFilter ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}
            >
              {hasFilter ? '🔍 ●' : '🔍'}
            </button>
            <label className="cursor-pointer bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700">
              {importMut.isPending ? '...' : <span className="hidden sm:inline">{t('invoice.importPdfFull')} </span>}
              {t('invoice.importPdf')}
              <input type="file" accept=".pdf" className="hidden" disabled={importMut.isPending}
                onChange={e => { if (e.target.files?.[0]) importMut.mutate(e.target.files[0]); e.target.value = '' }} />
            </label>
            <button onClick={() => setEditing(emptyInvoice())} className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
              + <span className="hidden sm:inline">{t('common.save').replace('Uložit','Přidat')}</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded shadow overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-3 py-2 w-6"></th>
                <th className="px-3 py-2 text-left">{t('invoice.colDate')}</th>
                <th className="px-3 py-2 text-left">{t('invoice.colClient')}</th>
                <th className="px-3 py-2 text-right">{t('invoice.colBase')}</th>
                <th className="px-3 py-2 text-right">{t('invoice.colVat')}</th>
                <th className="px-3 py-2 text-right">{t('invoice.colTotal')}</th>
                <th className="px-3 py-2 text-left">{t('invoice.colPayment')}</th>
                <th className="px-3 py-2 text-left">{t('invoice.colStatus')}</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(f => {
                const isOpen = f.id != null && expanded.has(f.id)
                const vat = f.totalVat ?? 0
                const total = f.totalPrice ?? f.amount ?? 0
                const base = f.totalPriceNoVat ?? f.amount ?? 0
                return [
                  <tr key={f.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => f.id && toggleExpand(f.id)}>
                    <td className="px-3 py-2 text-gray-400 text-xs">{f.items?.length > 0 ? (isOpen ? '▼' : '▶') : ''}</td>
                    <td className="px-3 py-2">{f.date}</td>
                    <td className="px-3 py-2 font-medium">{f.name || '—'}</td>
                    <td className="px-3 py-2 text-right">{base.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{vat.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-semibold">{total.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${f.paymentType === 'HOTOVOST' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {f.paymentType === 'HOTOVOST' ? t('invoice.paymentCash') : t('invoice.paymentTransfer')}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${f.status === 'SPLNENA' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'}`}>
                        {f.status === 'SPLNENA' ? t('invoice.statusDone') : t('invoice.statusPending')}
                      </span>
                    </td>
                    <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditing(f)} className="text-blue-600 hover:underline text-xs">{t('common.edit')}</button>
                        <button onClick={() => f.id && deleteMut.mutate(f.id)} className="text-red-500 hover:underline text-xs">{t('common.delete')}</button>
                      </div>
                    </td>
                  </tr>,
                  isOpen && f.items?.length > 0 && (
                    <tr key={`${f.id}-items`} className="bg-blue-50">
                      <td colSpan={9} className="px-6 py-2">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-gray-500">
                              <th className="text-left py-1">{t('invoice.itemName')}</th>
                              <th className="text-right py-1">{t('invoice.itemQty')}</th>
                              <th className="text-right py-1">J.cena</th>
                              <th className="text-right py-1">{t('invoice.itemUnitPriceNoVat')}</th>
                              <th className="text-right py-1">{t('invoice.itemVatPct')}</th>
                              <th className="text-right py-1">DPH {t('common.currency')}</th>
                              <th className="text-right py-1">{t('invoice.itemTotal')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {f.items.map((p, i) => (
                              <tr key={p.id ?? i} className="border-t border-blue-100">
                                <td className="py-1">{p.name}</td>
                                <td className="text-right py-1">{p.quantity} ks</td>
                                <td className="text-right py-1">{(p.unitPrice ?? 0).toFixed(2)}</td>
                                <td className="text-right py-1">{(p.unitPriceNoVat ?? 0).toFixed(2)}</td>
                                <td className="text-right py-1">{p.vatPercent} %</td>
                                <td className="text-right py-1">{(p.vatAmount ?? 0).toFixed(2)}</td>
                                <td className="text-right py-1 font-semibold">{(p.totalPrice ?? 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  ),
                ]
              })}
            </tbody>
          </table>
          {invoices.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">{t('invoice.noData')}</div>}
        </div>

        {editing && (
          <Modal title={editing.id ? t('invoice.edit') : t('invoice.new')} onClose={() => setEditing(null)} wide>
            <InvoiceForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
          </Modal>
        )}
      </div>
    </div>
  )
}

function FilterPanel({ filter, onChange, onClear }: { filter: InvoiceFilter; onChange: (f: InvoiceFilter) => void; onClear: () => void }) {
  const { t } = useTranslation()
  const set = (k: keyof InvoiceFilter, v: unknown) => onChange({ ...filter, [k]: v || undefined })
  const hasFilter = Object.values(filter).some(Boolean)
  return (
    <div className="bg-white rounded shadow p-4 sticky top-4 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-700">{t('invoice.filterTitle')}</span>
        {hasFilter && <button onClick={onClear} className="text-xs text-gray-400 hover:text-red-500">{t('invoice.filterClear')}</button>}
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">{t('invoice.filterClient')}</label>
        <input value={filter.name ?? ''} onChange={e => set('name', e.target.value)} placeholder={t('common.search')} className="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">{t('invoice.filterPayment')}</label>
        <select value={filter.paymentType ?? ''} onChange={e => set('paymentType', e.target.value as PaymentType)} className="w-full border rounded px-2 py-1">
          <option value="">{t('invoice.filterPaymentAll')}</option>
          <option value="HOTOVOST">{t('invoice.paymentCash')}</option>
          <option value="PREVOD">{t('invoice.paymentTransfer')}</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">{t('invoice.filterStatus')}</label>
        <select value={filter.status ?? ''} onChange={e => set('status', e.target.value as InvoiceStatus)} className="w-full border rounded px-2 py-1">
          <option value="">{t('invoice.filterStatusAll')}</option>
          <option value="NESPLNENA">{t('invoice.statusPending')}</option>
          <option value="SPLNENA">{t('invoice.statusDone')}</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">{t('invoice.filterDateFrom')}</label>
        <input type="date" value={filter.dateFrom ?? ''} onChange={e => set('dateFrom', e.target.value)} className="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">{t('invoice.filterDateTo')}</label>
        <input type="date" value={filter.dateTo ?? ''} onChange={e => set('dateTo', e.target.value)} className="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">{t('invoice.filterAmountFrom')}</label>
        <input type="number" value={filter.amountMin ?? ''} onChange={e => set('amountMin', +e.target.value || undefined)} className="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">{t('invoice.filterAmountTo')}</label>
        <input type="number" value={filter.amountMax ?? ''} onChange={e => set('amountMax', +e.target.value || undefined)} className="w-full border rounded px-2 py-1" />
      </div>
    </div>
  )
}

function InvoiceForm({ initial, onSave, onCancel }: { initial: Invoice; onSave: (f: Invoice) => void; onCancel: () => void }) {
  const { t } = useTranslation()
  const [form, setForm] = useState<Invoice>({ ...initial, items: initial.items?.map(p => ({ ...p })) ?? [] })
  const set = (k: keyof Invoice, v: unknown) => setForm(prev => ({ ...prev, [k]: v }))

  const addItem = () => setForm(prev => ({ ...prev, items: [...prev.items, emptyItem()] }))
  const removeItem = (i: number) => setForm(prev => ({ ...prev, items: prev.items.filter((_, j) => j !== i) }))

  const updateItem = (i: number, k: keyof InvoiceItem, v: unknown) => {
    const items = [...form.items]
    items[i] = { ...items[i], [k]: v }
    const p = items[i]
    const qty = Number(p.quantity) || 0
    const unitNoVat = Number(p.unitPriceNoVat) || 0
    const vatPct = Number(p.vatPercent) || 0
    p.vatAmount = +(unitNoVat * qty * vatPct / 100).toFixed(2)
    p.totalPrice = +(unitNoVat * qty + p.vatAmount).toFixed(2)
    p.price = +(unitNoVat * qty).toFixed(2)
    setForm(prev => ({ ...prev, items }))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-sm mb-1">{t('invoice.fieldClient')}</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm mb-1">{t('invoice.fieldDate')}</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm mb-1">{t('invoice.fieldBase')}</label>
          <input type="number" value={form.amount} onChange={e => set('amount', +e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm mb-1">{t('invoice.fieldPayment')}</label>
          <select value={form.paymentType} onChange={e => set('paymentType', e.target.value as PaymentType)} className="w-full border rounded px-3 py-2 text-sm">
            <option value="PREVOD">{t('invoice.paymentTransfer')}</option>
            <option value="HOTOVOST">{t('invoice.paymentCash')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">{t('invoice.fieldStatus')}</label>
          <select value={form.status} onChange={e => set('status', e.target.value as InvoiceStatus)} className="w-full border rounded px-3 py-2 text-sm">
            <option value="NESPLNENA">{t('invoice.statusPending')}</option>
            <option value="SPLNENA">{t('invoice.statusDone')}</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-sm">{t('invoice.items')}</span>
          <button onClick={addItem} className="text-blue-600 text-xs hover:underline">{t('invoice.addItem')}</button>
        </div>
        {form.items.map((p, i) => (
          <div key={i} className="grid grid-cols-7 gap-1 mb-2 text-xs items-end border-b pb-2">
            <div className="col-span-2">
              <label className="block mb-1 text-gray-500">{t('invoice.itemName')}</label>
              <input value={p.name} onChange={e => updateItem(i, 'name', e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block mb-1 text-gray-500">{t('invoice.itemQty')}</label>
              <input type="number" value={p.quantity} onChange={e => updateItem(i, 'quantity', +e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block mb-1 text-gray-500">{t('invoice.itemUnitPriceNoVat')}</label>
              <input type="number" value={p.unitPriceNoVat} onChange={e => updateItem(i, 'unitPriceNoVat', +e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block mb-1 text-gray-500">{t('invoice.itemVatPct')}</label>
              <input type="number" value={p.vatPercent} onChange={e => updateItem(i, 'vatPercent', +e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block mb-1 text-gray-500">{t('invoice.itemTotal')}</label>
              <input readOnly value={(p.totalPrice ?? 0).toFixed(2)} className="w-full border rounded px-2 py-1 bg-gray-50" />
            </div>
            <div className="flex items-end">
              <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 px-2 py-1">✕</button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t">
        <button onClick={onCancel} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">{t('common.cancel')}</button>
        <button onClick={() => onSave(form)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">{t('common.save')}</button>
      </div>
    </div>
  )
}
