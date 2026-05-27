import { useState, useMemo } from 'react'

export type SortDir = 'asc' | 'desc'

export function useSortable<T>(items: T[], defaultKey?: keyof T, defaultDir: SortDir = 'asc') {
  const [sortKey, setSortKey] = useState<keyof T | null>(defaultKey ?? null)
  const [dir, setDir] = useState<SortDir>(defaultDir)

  const sortBy = (key: keyof T) => {
    if (key === sortKey) {
      setDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setDir('asc')
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return items
    return [...items].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' })
      return dir === 'asc' ? cmp : -cmp
    })
  }, [items, sortKey, dir])

  return { sorted, sortKey, dir, sortBy }
}
