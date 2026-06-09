import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fmtDate } from '../utils/date'
import { useSortable } from '../hooks/useSortable'
import SortableTh from '../components/SortableTh'
import { getInvoices, createInvoice, updateInvoice, deleteInvoice, importInvoicesPdf, getInvoicePdf } from '../api/faktury'
import { clearInvoices } from '../api/io'
import type { Invoice, InvoiceItem, InvoiceFilter, PaymentType, InvoiceStatus } from '../types/faktura'
import Modal from '../components/Modal'
import ClearConfirmModal from '../components/ClearConfirmModal'

const inp = 'w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-2 py-1'
const inpLg = 'w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-3 py-2 text-sm'
const sel = 'w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-2 py-1'

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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState<number | null>(null)
  const [showClear, setShowClear] = useState(false)
  const [clearing, setClearing] = useState(false)

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', filter],
    queryFn: () => getInvoices(filter),
    placeholderData: (prev) => prev,
  })

  const createMut = useMutation({ mutationFn: createInvoice, onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); setEditing(null) } })
  const updateMut = useMutation({ mutationFn: ({ id, f }: { id: number; f: Invoice }) => updateInvoice(id, f), onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); setEditing(null) } })
  const deleteMut = useMutation({ mutationFn: deleteInvoice, onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }) })
  const importMut = useMutation({
    mutationFn: async (files: File[]) => { for (const f of files) await importInvoicesPdf(f) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })

  const handleSave = (f: Invoice) => {
    if (editing?.id) updateMut.mutate({ id: editing.id, f })
    else createMut.mutate(f)
  }

  const handleViewPdf = async (id: number) => {
    setPdfLoading(id)
    try {
      const blob = await getInvoicePdf(id)
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
    } finally {
      setPdfLoading(null)
    }
  }

  const closePdf = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    setPdfUrl(null)
  }

  const handleClear = async () => {
    setClearing(true)
    try {
      await clearInvoices()
      qc.invalidateQueries({ queryKey: ['invoices'] })
      setShowClear(false)
    } finally {
      setClearing(false)
    }
  }

  const toggleExpand = (id: number) => setExpanded(prev => {
    const s = new Set(prev)
    s.has(id) ? s.delete(id) : s.add(id)
    return s
  })

  const { sorted, sortKey, dir, sortBy } = useSortable(invoices, 'date', 'desc')
  const [showFilter, setShowFilter] = useState(false)
  const totalAmount = invoices.reduce((s, f) => s + (f.totalPrice ?? f.amount ?? 0), 0)
  const hasFilter = Object.values(filter).some(Boolean)

  if (isLoading) return <div className="p-4 dark:text-gray-300">{t('common.loading')}</div>

  return (
    <div className="flex gap-4 items-start">
      <div className="hidden md:block w-60 shrink-0">
        <FilterPanel filter={filter} onChange={setFilter} onClear={() => setFilter({})} />
      </div>

      {showFilter && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden" onClick={() => setShowFilter(false)}>
          <div className="w-full bg-white dark:bg-gray-800 rounded-t-2xl shadow-xl p-4 pb-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold dark:text-gray-100">{t('invoice.filterTitle')}</span>
              <button onClick={() => setShowFilter(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">✕</button>
            </div>
            <FilterPanel filter={filter} onChange={f => setFilter(f)} onClear={() => { setFilter({}); setShowFilter(false) }} />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold dark:text-gray-100">{t('invoice.title')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('invoice.total')}: {totalAmount.toFixed(2)} {t('common.currency')}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilter(v => !v)}
              className={`md:hidden px-3 py-2 rounded text-sm border ${hasFilter ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}
            >
              {hasFilter ? '🔍 ●' : '🔍'}
            </button>
            <label className="cursor-pointer bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700">
              {importMut.isPending ? '...' : <span className="hidden sm:inline">{t('invoice.importPdfFull')} </span>}
              {t('invoice.importPdf')}
              <input type="file" accept=".pdf" multiple className="hidden" disabled={importMut.isPending}
                onChange={e => { const files = Array.from(e.target.files ?? []); if (files.length) importMut.mutate(files); e.target.value = '' }} />
            </label>
            <button onClick={() => setShowClear(true)} className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700">
              <span className="hidden sm:inline">{t('io.clearBtn')}</span>
              <span className="sm:hidden">🗑</span>
            </button>
            <button onClick={() => setEditing(emptyInvoice())} className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
              + <span className="hidden sm:inline">{t('invoice.add').replace('+ ','')}</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded shadow overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs uppercase">
              <tr>
                <th className="px-3 py-2 w-6"></th>
                <SortableTh label={t('invoice.colDate')}    colKey="date"             sortKey={sortKey as string} dir={dir} onSort={sortBy} className="px-3 py-2 text-left" />
                <SortableTh label={t('invoice.colClient')}  colKey="name"             sortKey={sortKey as string} dir={dir} onSort={sortBy} className="px-3 py-2 text-left" />
                <SortableTh label={t('invoice.colBase')}    colKey="totalPriceNoVat"  sortKey={sortKey as string} dir={dir} onSort={sortBy} className="px-3 py-2 text-right" />
                <SortableTh label={t('invoice.colVat')}     colKey="totalVat"         sortKey={sortKey as string} dir={dir} onSort={sortBy} className="px-3 py-2 text-right" />
                <SortableTh label={t('invoice.colTotal')}   colKey="totalPrice"       sortKey={sortKey as string} dir={dir} onSort={sortBy} className="px-3 py-2 text-right" />
                <SortableTh label={t('invoice.colPayment')} colKey="paymentType"      sortKey={sortKey as string} dir={dir} onSort={sortBy} className="px-3 py-2 text-left" />
                <SortableTh label={t('invoice.colStatus')}  colKey="status"           sortKey={sortKey as string} dir={dir} onSort={sortBy} className="px-3 py-2 text-left" />
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(f => {
                const isOpen = f.id != null && expanded.has(f.id)
                const vat = f.totalVat ?? 0
                const total = f.totalPrice ?? f.amount ?? 0
                const base = f.totalPriceNoVat ?? f.amount ?? 0
                return [
                  <tr key={f.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-100 cursor-pointer" onClick={() => f.id && toggleExpand(f.id)}>
                    <td className="px-3 py-2 text-gray-400 dark:text-gray-500 text-xs">{f.items?.length > 0 ? (isOpen ? '▼' : '▶') : ''}</td>
                    <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{fmtDate(f.date)}</td>
                    <td className="px-3 py-2 font-medium">{f.name || '—'}</td>
                    <td className="px-3 py-2 text-right">{base.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{vat.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-semibold">{total.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${f.paymentType === 'HOTOVOST' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'}`}>
                        {f.paymentType === 'HOTOVOST' ? t('invoice.paymentCash') : t('invoice.paymentTransfer')}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${f.status === 'SPLNENA' ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                        {f.status === 'SPLNENA' ? t('invoice.statusDone') : t('invoice.statusPending')}
                      </span>
                    </td>
                    <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end">
                        {f.hasPdf && f.id && (
                          <button
                            onClick={() => handleViewPdf(f.id!)}
                            disabled={pdfLoading === f.id}
                            className="text-purple-500 hover:underline text-xs disabled:opacity-50"
                          >
                            {pdfLoading === f.id ? '...' : 'PDF'}
                          </button>
                        )}
                        <button onClick={() => setEditing(f)} className="text-blue-500 hover:underline text-xs">{t('common.edit')}</button>
                        <button onClick={() => f.id && window.confirm(t('common.deleteConfirm')) && deleteMut.mutate(f.id)} className="text-red-500 hover:underline text-xs">{t('common.delete')}</button>
                      </div>
                    </td>
                  </tr>,
                  isOpen && f.items?.length > 0 && (
                    <tr key={`${f.id}-items`} className="bg-blue-50 dark:bg-blue-950">
                      <td colSpan={9} className="px-6 py-2">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-gray-500 dark:text-gray-400">
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
                              <tr key={p.id ?? i} className="border-t border-blue-100 dark:border-blue-900 dark:text-gray-200">
                                <td className="py-1">{p.name}</td>
                                <td className="text-right py-1">{p.quantity} ks</td>
                                <td className="text-right py-1">{(p.unitPrice ?? 0).toFixed(2)}</td>
                                <td className="text-right py-1">{(p.unitPriceNoVat ?? 0).toFixed(2)}</td>
                                <td className="text-right py-1">{p.vatPercent} %</td>
                                <td className="text-right py-1">{(p.vatAmount ?? 0).toFixed(2)}</td>
                                <td className="text-right py-1 font-semibold">{(p.totalPrice ?? 0).toFixed(2)}</td>
                              </tr>
                            ))}
                            <tr className="border-t-2 border-blue-300 dark:border-blue-700 font-bold text-gray-700 dark:text-gray-100">
                              <td className="py-1">{t('invoice.itemsTotal')}</td>
                              <td className="text-right py-1">{f.items.reduce((s, p) => s + (Number(p.quantity) || 0), 0)} ks</td>
                              <td colSpan={3}></td>
                              <td className="text-right py-1">{f.items.reduce((s, p) => s + (p.vatAmount ?? 0), 0).toFixed(2)}</td>
                              <td className="text-right py-1">{f.items.reduce((s, p) => s + (p.totalPrice ?? 0), 0).toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  ),
                ]
              })}
            </tbody>
          </table>
          {invoices.length === 0 && <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">{t('invoice.noData')}</div>}
        </div>

        {editing && (
          <Modal title={editing.id ? t('invoice.edit') : t('invoice.new')} onClose={() => setEditing(null)} wide>
            <InvoiceForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
          </Modal>
        )}

        {showClear && (
          <ClearConfirmModal onConfirm={handleClear} onClose={() => setShowClear(false)} clearing={clearing} />
        )}

        {pdfUrl && (
          <Modal title="PDF" onClose={closePdf} fullWidth>
            <iframe src={pdfUrl} className="w-full border-0 rounded" style={{ height: '75vh' }} title="Invoice PDF" />
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
    <div className="bg-white dark:bg-gray-800 rounded shadow p-4 sticky top-4 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-700 dark:text-gray-200">{t('invoice.filterTitle')}</span>
        {hasFilter && <button onClick={onClear} className="text-xs text-gray-400 hover:text-red-500">{t('invoice.filterClear')}</button>}
      </div>
      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('invoice.filterClient')}</label>
        <input value={filter.name ?? ''} onChange={e => set('name', e.target.value)} placeholder={t('common.search')} className={inp} />
      </div>
      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('invoice.filterPayment')}</label>
        <select value={filter.paymentType ?? ''} onChange={e => set('paymentType', e.target.value as PaymentType)} className={sel}>
          <option value="">{t('invoice.filterPaymentAll')}</option>
          <option value="HOTOVOST">{t('invoice.paymentCash')}</option>
          <option value="PREVOD">{t('invoice.paymentTransfer')}</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('invoice.filterStatus')}</label>
        <select value={filter.status ?? ''} onChange={e => set('status', e.target.value as InvoiceStatus)} className={sel}>
          <option value="">{t('invoice.filterStatusAll')}</option>
          <option value="NESPLNENA">{t('invoice.statusPending')}</option>
          <option value="SPLNENA">{t('invoice.statusDone')}</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('invoice.filterDateFrom')}</label>
        <input type="date" value={filter.dateFrom ?? ''} onChange={e => set('dateFrom', e.target.value)} className={inp} />
      </div>
      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('invoice.filterDateTo')}</label>
        <input type="date" value={filter.dateTo ?? ''} onChange={e => set('dateTo', e.target.value)} className={inp} />
      </div>
      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('invoice.filterAmountFrom')}</label>
        <input type="number" value={filter.amountMin ?? ''} onChange={e => set('amountMin', +e.target.value || undefined)} className={inp} />
      </div>
      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('invoice.filterAmountTo')}</label>
        <input type="number" value={filter.amountMax ?? ''} onChange={e => set('amountMax', +e.target.value || undefined)} className={inp} />
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
          <label className="block text-sm mb-1 dark:text-gray-300">{t('invoice.fieldClient')}</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} className={inpLg} />
        </div>
        <div>
          <label className="block text-sm mb-1 dark:text-gray-300">{t('invoice.fieldDate')}</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={inpLg} />
        </div>
        <div>
          <label className="block text-sm mb-1 dark:text-gray-300">{t('invoice.fieldBase')}</label>
          <input type="number" value={form.amount} onChange={e => set('amount', +e.target.value)} className={inpLg} />
        </div>
        <div>
          <label className="block text-sm mb-1 dark:text-gray-300">{t('invoice.fieldPayment')}</label>
          <select value={form.paymentType} onChange={e => set('paymentType', e.target.value as PaymentType)} className={`${inpLg}`}>
            <option value="PREVOD">{t('invoice.paymentTransfer')}</option>
            <option value="HOTOVOST">{t('invoice.paymentCash')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1 dark:text-gray-300">{t('invoice.fieldStatus')}</label>
          <select value={form.status} onChange={e => set('status', e.target.value as InvoiceStatus)} className={`${inpLg}`}>
            <option value="NESPLNENA">{t('invoice.statusPending')}</option>
            <option value="SPLNENA">{t('invoice.statusDone')}</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-sm dark:text-gray-200">{t('invoice.items')}</span>
          <button onClick={addItem} className="text-blue-500 text-xs hover:underline">{t('invoice.addItem')}</button>
        </div>
        {form.items.map((p, i) => (
          <div key={i} className="grid grid-cols-7 gap-1 mb-2 text-xs items-end border-b dark:border-gray-700 pb-2">
            <div className="col-span-2">
              <label className="block mb-1 text-gray-500 dark:text-gray-400">{t('invoice.itemName')}</label>
              <input value={p.name} onChange={e => updateItem(i, 'name', e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block mb-1 text-gray-500 dark:text-gray-400">{t('invoice.itemQty')}</label>
              <input type="number" value={p.quantity} onChange={e => updateItem(i, 'quantity', +e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block mb-1 text-gray-500 dark:text-gray-400">{t('invoice.itemUnitPriceNoVat')}</label>
              <input type="number" value={p.unitPriceNoVat} onChange={e => updateItem(i, 'unitPriceNoVat', +e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block mb-1 text-gray-500 dark:text-gray-400">{t('invoice.itemVatPct')}</label>
              <input type="number" value={p.vatPercent} onChange={e => updateItem(i, 'vatPercent', +e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block mb-1 text-gray-500 dark:text-gray-400">{t('invoice.itemTotal')}</label>
              <input readOnly value={(p.totalPrice ?? 0).toFixed(2)} className="w-full border dark:border-gray-600 rounded px-2 py-1 bg-gray-50 dark:bg-gray-900 dark:text-gray-300" />
            </div>
            <div className="flex items-end">
              <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 px-2 py-1">✕</button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t dark:border-gray-700">
        <button onClick={onCancel} className="px-4 py-2 text-sm border dark:border-gray-600 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700">{t('common.cancel')}</button>
        <button onClick={() => onSave(form)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">{t('common.save')}</button>
      </div>
    </div>
  )
}
