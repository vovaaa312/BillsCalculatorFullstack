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

const emptyH = (): Hotovost => ({
  kusy5000: 0, kusy2000: 0, kusy1000: 0, kusy500: 0, kusy200: 0, kusy100: 0, mince: 0,
})

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

  const banknotesTotal = BANKNOTES.reduce((s, b) => s + (Number(form[b.key]) || 0) * b.value, 0)
  const coinsTotal = Number(form.mince) || 0
  const total = banknotesTotal + coinsTotal

  if (isLoading) return <div className="p-4">Načítání...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Hotovost</h1>
      <div className="bg-white rounded shadow p-6 max-w-sm">
        <div className="space-y-3 mb-4">
          {BANKNOTES.map(b => {
            const count = Number(form[b.key]) || 0
            const lineTotal = count * b.value
            return (
              <div key={b.key} className="flex items-center gap-3">
                <span className="text-sm w-20 shrink-0">{b.label}</span>
                <div className="flex items-center border rounded overflow-hidden">
                  <button onClick={() => adj(b.key, -1)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-sm font-bold">−</button>
                  <input
                    type="number"
                    min={0}
                    value={count}
                    onChange={e => setKey(b.key, +e.target.value)}
                    className="w-14 text-center text-sm py-1 border-x outline-none"
                  />
                  <button onClick={() => adj(b.key, 1)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-sm font-bold">+</button>
                </div>
                <span className="text-sm text-gray-500 ml-auto">{lineTotal.toLocaleString('cs-CZ')} Kč</span>
              </div>
            )
          })}

          <div className="flex items-center gap-3 border-t pt-3">
            <span className="text-sm w-20 shrink-0">Mince</span>
            <div className="flex items-center border rounded overflow-hidden">
              <button onClick={() => adj('mince', -1)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-sm font-bold">−</button>
              <input
                type="number"
                min={0}
                value={coinsTotal}
                onChange={e => setKey('mince', +e.target.value)}
                className="w-14 text-center text-sm py-1 border-x outline-none"
              />
              <button onClick={() => adj('mince', 1)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-sm font-bold">+</button>
            </div>
            <span className="text-sm text-gray-500 ml-auto">{coinsTotal.toLocaleString('cs-CZ')} Kč</span>
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
