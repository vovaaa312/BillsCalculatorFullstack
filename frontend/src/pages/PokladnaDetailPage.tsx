import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { getArchiveDetail, downloadArchiveReport } from '../api/archives'
import type { ArchiveAppData, ArchiveInvoice, ArchiveDriverShift } from '../types/archive'

const LANGS = [
  { code: 'cs', label: 'Čeština' },
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'ua', label: 'Українська' },
]

function parseCash(c: ArchiveAppData['hotovost']): number {
  return (c.k5000 * 5000) + (c.k2000 * 2000) + (c.k1000 * 1000) + (c.k500 * 500) +
    (c.k200 * 200) + (c.k100 * 100) + (c.k50 * 50) + (c.k20 * 20) +
    (c.k10 * 10) + (c.k5 * 5) + (c.k2 * 2) + c.k1
}

function shiftHours(s: ArchiveDriverShift): number {
  return (new Date(s.end).getTime() - new Date(s.start).getTime()) / 3_600_000
}

function fmtDateTime(dt: string): string {
  return new Date(dt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
}

function InvoiceRow({ inv }: { inv: ArchiveInvoice }) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  return (
    <>
      <tr
        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
        onClick={() => setOpen(v => !v)}
      >
        <td className="py-2 px-3 text-sm text-gray-700 dark:text-gray-200">{inv.datum}</td>
        <td className="py-2 px-3 text-sm font-medium text-gray-900 dark:text-gray-100">{inv.nazev}</td>
        <td className="py-2 px-3 text-sm text-gray-700 dark:text-gray-200 text-right">
          {inv.castka.toLocaleString()} {t('common.currency')}
        </td>
        <td className="py-2 px-3 text-sm">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            inv.typ === 'HOTOVOST'
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
          }`}>
            {inv.typ === 'HOTOVOST' ? t('invoice.paymentCash') : t('invoice.paymentTransfer')}
          </span>
        </td>
        <td className="py-2 px-3 text-sm">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            inv.status === 'SPLNENA'
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
          }`}>
            {inv.status === 'SPLNENA' ? t('invoice.statusDone') : t('invoice.statusPending')}
          </span>
        </td>
        <td className="py-2 px-3 text-xs text-gray-400 dark:text-gray-500 text-center">
          {open ? '▲' : '▼'}
        </td>
      </tr>
      {open && inv.polozky.length > 0 && (
        <tr className="bg-gray-50 dark:bg-gray-900">
          <td colSpan={6} className="px-6 pb-3 pt-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-1 text-gray-500 dark:text-gray-400">{t('invoice.itemName')}</th>
                  <th className="text-right py-1 text-gray-500 dark:text-gray-400">{t('invoice.itemQty')}</th>
                  <th className="text-right py-1 text-gray-500 dark:text-gray-400">{t('invoice.itemTotal')}</th>
                </tr>
              </thead>
              <tbody>
                {inv.polozky.map((p, i) => (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="py-1 text-gray-700 dark:text-gray-300">{p.nazev}</td>
                    <td className="py-1 text-right text-gray-700 dark:text-gray-300">{p.mnozstvi}</td>
                    <td className="py-1 text-right text-gray-700 dark:text-gray-300">{p.kcCelkem.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  )
}

export default function PokladnaDetailPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { lang = 'en', id } = useParams<{ lang: string; id: string }>()
  const [reportLang, setReportLang] = useState(i18n.language)
  const [downloading, setDownloading] = useState(false)

  const { data: detail, isLoading, isError } = useQuery({
    queryKey: ['archiveDetail', id],
    queryFn: () => getArchiveDetail(Number(id)),
    enabled: !!id,
  })

  const appData: ArchiveAppData | null = (() => {
    if (!detail?.data) return null
    try { return JSON.parse(detail.data) } catch { return null }
  })()

  const handleReport = async () => {
    if (!id) return
    setDownloading(true)
    try { await downloadArchiveReport(Number(id), reportLang) } finally { setDownloading(false) }
  }

  const handleDownloadJson = () => {
    if (!detail?.data) return
    const blob = new Blob([detail.data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${detail.name || `archive-${id}`}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const fmt = (dt: string) => {
    const d = new Date(dt)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (isLoading) return <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
  if (isError || !detail) return <p className="text-sm text-red-500">Error loading archive</p>

  const faktury = appData?.faktury ?? []
  const vydaje = appData?.vydaje ?? []
  const shifts = appData?.driverShifts ?? []
  const hotovost = appData?.hotovost
  const cashTotal = hotovost ? parseCash(hotovost) : 0
  const invoiceTotal = faktury.filter(f => f.status === 'SPLNENA').reduce((s, f) => s + f.castka, 0)
  const expenseTotal = vydaje.reduce((s, v) => s + v.castka, 0)
  const driverTotal = shifts.reduce((s, d) => s + shiftHours(d) * d.hourlyRate, 0)

  return (
    <div>
      <button
        onClick={() => navigate(`/${lang}/pokladna`)}
        className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
      >
        {t('pokladna.backToList')}
      </button>

      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold dark:text-gray-100">{detail.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('pokladna.createdAt')}: {fmt(detail.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={reportLang}
            onChange={e => setReportLang(e.target.value)}
            className="border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-2 py-1 text-sm"
          >
            {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          <button
            onClick={handleDownloadJson}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            {t('pokladna.downloadJson')}
          </button>
          <button
            onClick={handleReport}
            disabled={downloading}
            className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
          >
            {downloading ? '...' : t('pokladna.report')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: t('pokladna.totalInvoices'), value: invoiceTotal },
          { label: t('pokladna.totalExpenses'), value: expenseTotal },
          { label: t('pokladna.totalCash'), value: cashTotal },
          { label: t('pokladna.balance'), value: invoiceTotal - expenseTotal },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-gray-800 rounded shadow p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{card.label}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {card.value.toLocaleString()} {t('common.currency')}
            </p>
          </div>
        ))}
      </div>

      {faktury.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
            {t('pokladna.invoices')} ({faktury.length})
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t('invoice.colDate')}</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t('invoice.colClient')}</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t('invoice.colTotal')}</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t('invoice.colPayment')}</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t('invoice.colStatus')}</th>
                  <th className="py-2 px-3 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {faktury.map((inv, i) => <InvoiceRow key={i} inv={inv} />)}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {vydaje.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
            {t('pokladna.expenses')} ({vydaje.length})
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t('expense.colName')}</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t('expense.colAmount')}</th>
                </tr>
              </thead>
              <tbody>
                {vydaje.map((v, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2 px-3 text-sm text-gray-700 dark:text-gray-200">{v.nazev}</td>
                    <td className="py-2 px-3 text-sm text-right text-gray-700 dark:text-gray-200">
                      {v.castka.toLocaleString()} {t('common.currency')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {shifts.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
            {t('pokladna.driver')} ({shifts.length})
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t('driver.colDriver')}</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t('driver.colStart')}</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t('driver.colEnd')}</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t('driver.colKm')}</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t('driver.colHours')}</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t('driver.colRate')}</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t('driver.colEarnings')}</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((d, i) => {
                  const h = shiftHours(d)
                  return (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-2 px-3 text-sm text-gray-700 dark:text-gray-200">{d.driverName}</td>
                      <td className="py-2 px-3 text-sm text-gray-700 dark:text-gray-200">{fmtDateTime(d.start)}</td>
                      <td className="py-2 px-3 text-sm text-gray-700 dark:text-gray-200">{fmtDateTime(d.end)}</td>
                      <td className="py-2 px-3 text-sm text-right text-gray-700 dark:text-gray-200">{d.kmEnd - d.kmStart} km</td>
                      <td className="py-2 px-3 text-sm text-right text-gray-700 dark:text-gray-200">{h.toFixed(1)}</td>
                      <td className="py-2 px-3 text-sm text-right text-gray-700 dark:text-gray-200">{d.hourlyRate}</td>
                      <td className="py-2 px-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                        {Math.round(h * d.hourlyRate).toLocaleString()} {t('common.currency')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <td colSpan={6} className="py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-200 text-right">
                    {t('driver.totalEarnings')}:
                  </td>
                  <td className="py-2 px-3 text-sm font-bold text-gray-900 dark:text-gray-100 text-right">
                    {Math.round(driverTotal).toLocaleString()} {t('common.currency')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {hotovost && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{t('pokladna.cash')}</h2>
          <div className="bg-white dark:bg-gray-800 rounded shadow p-4 max-w-xs">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {cashTotal.toLocaleString()} {t('common.currency')}
            </p>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 grid grid-cols-2 gap-1">
              {Object.entries(hotovost).map(([k, v]) => (v as number) > 0 && (
                <span key={k}>{k.replace('k', '')} × {v as number}</span>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
