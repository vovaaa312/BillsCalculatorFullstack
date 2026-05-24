import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/faktury',  label: 'Faktury',         icon: '🧾' },
  { to: '/vydaje',   label: 'Výdaje',           icon: '💸' },
  { to: '/hotovost', label: 'Hotovost',          icon: '💰' },
  { to: '/driver',   label: 'Řidič',             icon: '🚗' },
  { to: '/routes',   label: 'Trasy',             icon: '🗺️' },
  { to: '/report',   label: 'Report',            icon: '📊' },
  { to: '/io',       label: 'Import / Export',   icon: '📂' },
]

interface Props {
  onClose?: () => void
}

export default function Sidebar({ onClose }: Props) {
  const { logout } = useAuth()
  return (
    <aside className="w-52 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="px-4 py-5 text-lg font-bold border-b border-gray-700 flex items-center justify-between">
        <span>Bills Calculator</span>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none md:hidden">
            ✕
          </button>
        )}
      </div>
      <nav className="flex-1 py-2">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-700 transition-colors ${isActive ? 'bg-gray-700 font-semibold' : ''}`
            }
          >
            <span className="text-base">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <button
        onClick={() => { logout(); onClose?.() }}
        className="mx-4 mb-4 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 rounded transition-colors"
      >
        Odhlásit
      </button>
    </aside>
  )
}
