import type { SortDir } from '../hooks/useSortable'

interface Props {
  label: string
  colKey: string
  sortKey: string | null
  dir: SortDir
  onSort: (key: any) => void
  className?: string
}

export default function SortableTh({ label, colKey, sortKey, dir, onSort, className = '' }: Props) {
  const isActive = sortKey === colKey
  return (
    <th
      onClick={() => onSort(colKey)}
      className={`cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${className}`}
    >
      <span className="flex items-center gap-1">
        {label}
        <span className="text-xs opacity-50">
          {isActive ? (dir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </span>
    </th>
  )
}
