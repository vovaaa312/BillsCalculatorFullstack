import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFaktury, createFaktura, updateFaktura, deleteFaktura, importFakturyPdf } from '../api/faktury'
import type { Faktura, Polozka, FakturaFilter, TypPlatby, StatusFaktury } from '../types/faktura'
import Modal from '../components/Modal'

const emptyFaktura = (): Faktura => ({
  nazev: '',
  castka: 0,
  typPlatby: 'PREVOD',
  status: 'NESPLNENA',
  datum: new Date().toISOString().slice(0, 10),
  polozky: [],
})

const emptyPolozka = (): Polozka => ({
  nazev: '', mnozstvi: 1, jcena: 0, jcenaBezDph: 0, cena: 0, dphProcent: 12, dphCastka: 0, kcCelkem: 0,
})

export default function FakturyPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<FakturaFilter>({})
  const [editing, setEditing] = useState<Faktura | null>(null)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const { data: faktury = [], isLoading } = useQuery({
    queryKey: ['faktury', filter],
    queryFn: () => getFaktury(filter),
  })

  const createMut = useMutation({ mutationFn: createFaktura, onSuccess: () => { qc.invalidateQueries({ queryKey: ['faktury'] }); setEditing(null) } })
  const updateMut = useMutation({ mutationFn: ({ id, f }: { id: number; f: Faktura }) => updateFaktura(id, f), onSuccess: () => { qc.invalidateQueries({ queryKey: ['faktury'] }); setEditing(null) } })
  const deleteMut = useMutation({ mutationFn: deleteFaktura, onSuccess: () => qc.invalidateQueries({ queryKey: ['faktury'] }) })
  const importMut = useMutation({ mutationFn: importFakturyPdf, onSuccess: () => qc.invalidateQueries({ queryKey: ['faktury'] }) })

  const handleSave = (f: Faktura) => {
    if (editing?.id) updateMut.mutate({ id: editing.id, f })
    else createMut.mutate(f)
  }

  const toggleExpand = (id: number) => setExpanded(prev => {
    const s = new Set(prev)
    s.has(id) ? s.delete(id) : s.add(id)
    return s
  })

  const totalCelkem = faktury.reduce((s, f) => s + (f.soucetKcCelkem ?? f.castka ?? 0), 0)

  if (isLoading) return <div className="p-4">Načítání...</div>

  return (
    <div className="flex gap-4 items-start">
      <div className="w-60 shrink-0">
        <FilterPanel filter={filter} onChange={setFilter} onClear={() => setFilter({})} />
      </div>

      <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Faktury</h1>
          <p className="text-sm text-gray-500 mt-1">Celkem: {totalCelkem.toFixed(2)} Kč</p>
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700">
            {importMut.isPending ? 'Importuji...' : 'Importovat PDF'}
            <input type="file" accept=".pdf" className="hidden" disabled={importMut.isPending}
              onChange={e => { if (e.target.files?.[0]) importMut.mutate(e.target.files[0]); e.target.value = '' }} />
          </label>
          <button onClick={() => setEditing(emptyFaktura())} className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
            + Přidat
          </button>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-3 py-2 w-6"></th>
              <th className="px-3 py-2 text-left">Datum</th>
              <th className="px-3 py-2 text-left">Odběratel</th>
              <th className="px-3 py-2 text-right">Základ</th>
              <th className="px-3 py-2 text-right">DPH</th>
              <th className="px-3 py-2 text-right">Celkem</th>
              <th className="px-3 py-2 text-left">Platba</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {faktury.map(f => {
              const isOpen = f.id != null && expanded.has(f.id)
              const dph = f.soucetDph ?? 0
              const celkem = f.soucetKcCelkem ?? f.castka ?? 0
              const zaklad = f.soucetCenaBezDph ?? f.castka ?? 0
              return [
                <tr key={f.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => f.id && toggleExpand(f.id)}>
                  <td className="px-3 py-2 text-gray-400 text-xs">{f.polozky?.length > 0 ? (isOpen ? '▼' : '▶') : ''}</td>
                  <td className="px-3 py-2">{f.datum}</td>
                  <td className="px-3 py-2 font-medium">{f.nazev || '—'}</td>
                  <td className="px-3 py-2 text-right">{zaklad.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{dph.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{celkem.toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${f.typPlatby === 'HOTOVOST' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {f.typPlatby === 'HOTOVOST' ? 'Hotovost' : 'Převod'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${f.status === 'SPLNENA' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'}`}>
                      {f.status === 'SPLNENA' ? 'Splněná' : 'Nesplněná'}
                    </span>
                  </td>
                  <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditing(f)} className="text-blue-600 hover:underline text-xs">Upravit</button>
                      <button onClick={() => f.id && deleteMut.mutate(f.id)} className="text-red-500 hover:underline text-xs">Smazat</button>
                    </div>
                  </td>
                </tr>,
                isOpen && f.polozky?.length > 0 && (
                  <tr key={`${f.id}-items`} className="bg-blue-50">
                    <td colSpan={9} className="px-6 py-2">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-500">
                            <th className="text-left py-1">Položka</th>
                            <th className="text-right py-1">Množství</th>
                            <th className="text-right py-1">J.cena</th>
                            <th className="text-right py-1">Cena bez DPH</th>
                            <th className="text-right py-1">DPH %</th>
                            <th className="text-right py-1">DPH Kč</th>
                            <th className="text-right py-1">Kč Celkem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {f.polozky.map((p, i) => (
                            <tr key={p.id ?? i} className="border-t border-blue-100">
                              <td className="py-1">{p.nazev}</td>
                              <td className="text-right py-1">{p.mnozstvi} ks</td>
                              <td className="text-right py-1">{(p.jcena ?? 0).toFixed(2)}</td>
                              <td className="text-right py-1">{(p.jcenaBezDph ?? 0).toFixed(2)}</td>
                              <td className="text-right py-1">{p.dphProcent} %</td>
                              <td className="text-right py-1">{(p.dphCastka ?? 0).toFixed(2)}</td>
                              <td className="text-right py-1 font-semibold">{(p.kcCelkem ?? 0).toFixed(2)}</td>
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
        {faktury.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">Žádné faktury</div>}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Upravit fakturu' : 'Nová faktura'} onClose={() => setEditing(null)} wide>
          <FakturaForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
        </Modal>
      )}
      </div>
    </div>
  )
}

function FilterPanel({ filter, onChange, onClear }: { filter: FakturaFilter; onChange: (f: FakturaFilter) => void; onClear: () => void }) {
  const set = (k: keyof FakturaFilter, v: unknown) => onChange({ ...filter, [k]: v || undefined })
  const hasFilter = Object.values(filter).some(Boolean)
  return (
    <div className="bg-white rounded shadow p-4 sticky top-4 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-700">Filtry</span>
        {hasFilter && <button onClick={onClear} className="text-xs text-gray-400 hover:text-red-500">Zrušit</button>}
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Odběratel</label>
        <input value={filter.nazev ?? ''} onChange={e => set('nazev', e.target.value)} placeholder="Hledat..." className="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Typ platby</label>
        <select value={filter.typPlatby ?? ''} onChange={e => set('typPlatby', e.target.value as TypPlatby)} className="w-full border rounded px-2 py-1">
          <option value="">Vše</option>
          <option value="HOTOVOST">Hotovost</option>
          <option value="PREVOD">Převod</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Status</label>
        <select value={filter.status ?? ''} onChange={e => set('status', e.target.value as StatusFaktury)} className="w-full border rounded px-2 py-1">
          <option value="">Vše</option>
          <option value="NESPLNENA">Nesplněná</option>
          <option value="SPLNENA">Splněná</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Datum od</label>
        <input type="date" value={filter.dateFrom ?? ''} onChange={e => set('dateFrom', e.target.value)} className="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Datum do</label>
        <input type="date" value={filter.dateTo ?? ''} onChange={e => set('dateTo', e.target.value)} className="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Částka od (Kč)</label>
        <input type="number" value={filter.amountMin ?? ''} onChange={e => set('amountMin', +e.target.value || undefined)} className="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Částka do (Kč)</label>
        <input type="number" value={filter.amountMax ?? ''} onChange={e => set('amountMax', +e.target.value || undefined)} className="w-full border rounded px-2 py-1" />
      </div>
    </div>
  )
}

function FakturaForm({ initial, onSave, onCancel }: { initial: Faktura; onSave: (f: Faktura) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Faktura>({ ...initial, polozky: initial.polozky?.map(p => ({ ...p })) ?? [] })
  const set = (k: keyof Faktura, v: unknown) => setForm(prev => ({ ...prev, [k]: v }))

  const addPolozka = () => setForm(prev => ({ ...prev, polozky: [...prev.polozky, emptyPolozka()] }))
  const removePolozka = (i: number) => setForm(prev => ({ ...prev, polozky: prev.polozky.filter((_, j) => j !== i) }))

  const updatePolozka = (i: number, k: keyof Polozka, v: unknown) => {
    const polozky = [...form.polozky]
    polozky[i] = { ...polozky[i], [k]: v }
    const p = polozky[i]
    const mnoz = Number(p.mnozstvi) || 0
    const jcenaBez = Number(p.jcenaBezDph) || 0
    const dphPct = Number(p.dphProcent) || 0
    p.dphCastka = +(jcenaBez * mnoz * dphPct / 100).toFixed(2)
    p.kcCelkem = +(jcenaBez * mnoz + p.dphCastka).toFixed(2)
    p.cena = +(jcenaBez * mnoz).toFixed(2)
    setForm(prev => ({ ...prev, polozky }))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-sm mb-1">Odběratel</label>
          <input value={form.nazev} onChange={e => set('nazev', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm mb-1">Datum</label>
          <input type="date" value={form.datum} onChange={e => set('datum', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm mb-1">Základ (Kč)</label>
          <input type="number" value={form.castka} onChange={e => set('castka', +e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm mb-1">Typ platby</label>
          <select value={form.typPlatby} onChange={e => set('typPlatby', e.target.value as TypPlatby)} className="w-full border rounded px-3 py-2 text-sm">
            <option value="PREVOD">Převod</option>
            <option value="HOTOVOST">Hotovost</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value as StatusFaktury)} className="w-full border rounded px-3 py-2 text-sm">
            <option value="NESPLNENA">Nesplněná</option>
            <option value="SPLNENA">Splněná</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-sm">Položky</span>
          <button onClick={addPolozka} className="text-blue-600 text-xs hover:underline">+ Přidat položku</button>
        </div>
        {form.polozky.map((p, i) => (
          <div key={i} className="grid grid-cols-7 gap-1 mb-2 text-xs items-end border-b pb-2">
            <div className="col-span-2">
              <label className="block mb-1 text-gray-500">Název</label>
              <input value={p.nazev} onChange={e => updatePolozka(i, 'nazev', e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block mb-1 text-gray-500">Mn.</label>
              <input type="number" value={p.mnozstvi} onChange={e => updatePolozka(i, 'mnozstvi', +e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block mb-1 text-gray-500">J.cena bez DPH</label>
              <input type="number" value={p.jcenaBezDph} onChange={e => updatePolozka(i, 'jcenaBezDph', +e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block mb-1 text-gray-500">DPH %</label>
              <input type="number" value={p.dphProcent} onChange={e => updatePolozka(i, 'dphProcent', +e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block mb-1 text-gray-500">Kč celkem</label>
              <input readOnly value={(p.kcCelkem ?? 0).toFixed(2)} className="w-full border rounded px-2 py-1 bg-gray-50" />
            </div>
            <div className="flex items-end">
              <button onClick={() => removePolozka(i)} className="text-red-500 hover:text-red-700 px-2 py-1">✕</button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t">
        <button onClick={onCancel} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Zrušit</button>
        <button onClick={() => onSave(form)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Uložit</button>
      </div>
    </div>
  )
}
