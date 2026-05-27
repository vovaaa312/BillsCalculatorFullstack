export function fmtDate(iso: string | undefined | null): string {
  if (!iso) return '—'
  const d = String(iso).slice(0, 10)
  return `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`
}

export function fmtDateTime(iso: string | undefined | null): string {
  if (!iso) return '—'
  const s = String(iso).replace('T', ' ').slice(0, 16)
  return `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)} ${s.slice(11, 16)}`
}
