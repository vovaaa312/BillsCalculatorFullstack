import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getCash, updateCash } from '../api/hotovost'
import { clearCash } from '../api/io'
import type { Cash } from '../types/hotovost'
import { useState, useEffect } from 'react'
import ClearConfirmModal from '../components/ClearConfirmModal'

const BANKNOTES: { key: keyof Cash; label: string; value: number }[] = [
  { key: 'count5000', label: '5 000 Kč', value: 5000 },
  { key: 'count2000', label: '2 000 Kč', value: 2000 },
  { key: 'count1000', label: '1 000 Kč', value: 1000 },
  { key: 'count500',  label: '500 Kč',   value: 500  },
  { key: 'count200',  label: '200 Kč',   value: 200  },
  { key: 'count100',  label: '100 Kč',   value: 100  },
]

const COINS: { key: keyof Cash; label: string; value: number }[] = [
  { key: 'count50', label: '50 Kč', value: 50 },
  { key: 'count20', label: '20 Kč', value: 20 },
  { key: 'count10', label: '10 Kč', value: 10 },
  { key: 'count5',  label: '5 Kč',  value: 5  },
  { key: 'count2',  label: '2 Kč',  value: 2  },
  { key: 'count1',  label: '1 Kč',  value: 1  },
]

const emptyC = (): Cash => ({
  count5000: 0, count2000: 0, count1000: 0, count500: 0, count200: 0, count100: 0,
  count50: 0, count20: 0, count10: 0, count5: 0, count2: 0, count1: 0,
})

function DenomRow({ d, count, onAdj, onSet }: {
  d: { key: keyof Cash; label: string; value: number }
  count: number
  onAdj: (delta: number) => void
  onSet: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-20 shrink-0 dark:text-gray-300">{d.label}</span>
      <div className="flex items-center border dark:border-gray-600 rounded overflow-hidden">
        <button onClick={() => onAdj(-1)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 text-sm font-bold">−</button>
        <input
          type="number"
          min={0}
          value={count}
          onChange={e => onSet(+e.target.value)}
          className="w-14 text-center text-sm py-1 border-x dark:border-gray-600 outline-none dark:bg-gray-800 dark:text-gray-100"
        />
        <button onClick={() => onAdj(1)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 text-sm font-bold">+</button>
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">{(count * d.value).toLocaleString('cs-CZ')} Kč</span>
    </div>
  )
}

export default function HotovostPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['cash'], queryFn: getCash })
  const [form, setForm] = useState<Cash>(emptyC())
  const [showClear, setShowClear] = useState(false)
  const [clearing, setClearing] = useState(false)
  const updateMut = useMutation({
    mutationFn: updateCash,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cash'] }),
  })

  useEffect(() => { if (data) setForm({ ...emptyC(), ...data }) }, [data])

  const setKey = (k: keyof Cash, v: number) =>
    setForm(prev => ({ ...prev, [k]: Math.max(0, v) }))

  const adj = (k: keyof Cash, delta: number) =>
    setForm(prev => ({ ...prev, [k]: Math.max(0, (Number(prev[k]) || 0) + delta) }))

  const banknotesTotal = BANKNOTES.reduce((s, d) => s + (Number(form[d.key]) || 0) * d.value, 0)
  const coinsTotal = COINS.reduce((s, d) => s + (Number(form[d.key]) || 0) * d.value, 0)
  const total = banknotesTotal + coinsTotal

  const handleClear = async () => {
    setClearing(true)
    try {
      await clearCash()
      qc.invalidateQueries({ queryKey: ['cash'] })
      setShowClear(false)
    } finally {
      setClearing(false)
    }
  }

  if (isLoading) return <div className="p-4 dark:text-gray-300">{t('common.loading')}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold dark:text-gray-100">{t('cash.title')}</h1>
        <button onClick={() => setShowClear(true)} className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700">
          <span className="hidden sm:inline">{t('io.clearBtn')}</span>
          <span className="sm:hidden">🗑</span>
        </button>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded shadow p-6 max-w-sm">
        <div className="space-y-3 mb-4">
          {BANKNOTES.map(d => (
            <DenomRow key={d.key} d={d} count={Number(form[d.key]) || 0}
              onAdj={delta => adj(d.key, delta)} onSet={v => setKey(d.key, v)} />
          ))}
        </div>

        <div className="border-t dark:border-gray-700 pt-3 mb-3">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{t('cash.coins')}</p>
          <div className="space-y-3">
            {COINS.map(d => (
              <DenomRow key={d.key} d={d} count={Number(form[d.key]) || 0}
                onAdj={delta => adj(d.key, delta)} onSet={v => setKey(d.key, v)} />
            ))}
          </div>
        </div>

        <div className="border-t dark:border-gray-700 pt-3 space-y-1 mb-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex justify-between">
            <span>{t('cash.banknotes')}</span><span>{banknotesTotal.toLocaleString('cs-CZ')} Kč</span>
          </div>
          <div className="flex justify-between">
            <span>{t('cash.coins')}</span><span>{coinsTotal.toLocaleString('cs-CZ')} Kč</span>
          </div>
        </div>

        <div className="border-t dark:border-gray-700 pt-3 flex items-center justify-between">
          <span className="font-bold text-lg dark:text-gray-100">{total.toLocaleString('cs-CZ')} Kč</span>
          <button
            onClick={() => updateMut.mutate(form)}
            disabled={updateMut.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {updateMut.isPending ? t('cash.saving') : t('cash.save')}
          </button>
        </div>
      </div>

      {showClear && (
        <ClearConfirmModal onConfirm={handleClear} onClose={() => setShowClear(false)} clearing={clearing} />
      )}
    </div>
  )
}
