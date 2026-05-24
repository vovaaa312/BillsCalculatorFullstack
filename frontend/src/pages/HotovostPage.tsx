import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getHotovost, updateHotovost } from '../api/hotovost'
import type { Hotovost } from '../types/hotovost'
import { useState, useEffect } from 'react'

const BANKNOTES: { key: keyof Hotovost; label: string; value: number }[] = [
  { key: 'kusy5000', label: '5 000 Kč', value: 5000 },
  { key: 'kusy2000', label: '2 000 Kč', value: 2000 },
  { key: 'kusy1000', label: '1 000 Kč', value: 1000 },
  { key: 'kusy500',  label: '500 Kč',   value: 500  },
  { key: 'kusy200',  label: '200 Kč',   value: 200  },
  { key: 'kusy100',  label: '100 Kč',   value: 100  },
]

const COINS: { key: keyof Hotovost; label: string; value: number }[] = [
  { key: 'kusy50', label: '50 Kč', value: 50 },
  { key: 'kusy20', label: '20 Kč', value: 20 },
  { key: 'kusy10', label: '10 Kč', value: 10 },
  { key: 'kusy5',  label: '5 Kč',  value: 5  },
  { key: 'kusy2',  label: '2 Kč',  value: 2  },
  { key: 'kusy1',  label: '1 Kč',  value: 1  },
]

const emptyH = (): Hotovost => ({
  kusy5000: 0, kusy2000: 0, kusy1000: 0, kusy500: 0, kusy200: 0, kusy100: 0,
  kusy50: 0, kusy20: 0, kusy10: 0, kusy5: 0, kusy2: 0, kusy1: 0,
})

function DenomRow({ d, count, onAdj, onSet }: {
  d: { key: keyof Hotovost; label: string; value: number }
  count: number
  onAdj: (delta: number) => void
  onSet: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-20 shrink-0">{d.label}</span>
      <div className="flex items-center border rounded overflow-hidden">
        <button onClick={() => onAdj(-1)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-sm font-bold">−</button>
        <input
          type="number"
          min={0}
          value={count}
          onChange={e => onSet(+e.target.value)}
          className="w-14 text-center text-sm py-1 border-x outline-none"
        />
        <button onClick={() => onAdj(1)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-sm font-bold">+</button>
      </div>
      <span className="text-sm text-gray-500 ml-auto">{(count * d.value).toLocaleString('cs-CZ')} Kč</span>
    </div>
  )
}

export default function HotovostPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['hotovost'], queryFn: getHotovost })
  const [form, setForm] = useState<Hotovost>(emptyH())
  const updateMut = useMutation({
    mutationFn: updateHotovost,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hotovost'] }),
  })

  useEffect(() => { if (data) setForm({ ...emptyH(), ...data }) }, [data])

  const setKey = (k: keyof Hotovost, v: number) =>
    setForm(prev => ({ ...prev, [k]: Math.max(0, v) }))

  const adj = (k: keyof Hotovost, delta: number) =>
    setForm(prev => ({ ...prev, [k]: Math.max(0, (Number(prev[k]) || 0) + delta) }))

  const banknotesTotal = BANKNOTES.reduce((s, d) => s + (Number(form[d.key]) || 0) * d.value, 0)
  const coinsTotal = COINS.reduce((s, d) => s + (Number(form[d.key]) || 0) * d.value, 0)
  const total = banknotesTotal + coinsTotal

  if (isLoading) return <div className="p-4">Načítání...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Hotovost</h1>
      <div className="bg-white rounded shadow p-6 max-w-sm">
        <div className="space-y-3 mb-4">
          {BANKNOTES.map(d => (
            <DenomRow
              key={d.key}
              d={d}
              count={Number(form[d.key]) || 0}
              onAdj={delta => adj(d.key, delta)}
              onSet={v => setKey(d.key, v)}
            />
          ))}
        </div>

        <div className="border-t pt-3 mb-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Mince</p>
          <div className="space-y-3">
            {COINS.map(d => (
              <DenomRow
                key={d.key}
                d={d}
                count={Number(form[d.key]) || 0}
                onAdj={delta => adj(d.key, delta)}
                onSet={v => setKey(d.key, v)}
              />
            ))}
          </div>
        </div>

        <div className="border-t pt-3 space-y-1 mb-4 text-sm text-gray-500">
          <div className="flex justify-between">
            <span>Bankovky</span><span>{banknotesTotal.toLocaleString('cs-CZ')} Kč</span>
          </div>
          <div className="flex justify-between">
            <span>Mince</span><span>{coinsTotal.toLocaleString('cs-CZ')} Kč</span>
          </div>
        </div>

        <div className="border-t pt-3 flex items-center justify-between">
          <span className="font-bold text-lg">{total.toLocaleString('cs-CZ')} Kč</span>
          <button
            onClick={() => updateMut.mutate(form)}
            disabled={updateMut.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {updateMut.isPending ? 'Ukládám...' : 'Uložit'}
          </button>
        </div>
      </div>
    </div>
  )
}
