import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/faktury',  label: 'Faktury' },
  { to: '/vydaje',   label: 'Výdaje' },
  { to: '/hotovost', label: 'Hotovost' },
  { to: '/driver',   label: 'Řidič' },
  { to: '/routes',   label: 'Trasy' },
  { to: '/report',   label: 'Report' },
  { to: '/io',       label: 'Import / Export' },
]

export default function Sidebar() {
  const { logout } = useAuth()
  return (
    <aside className="w-52 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="px-4 py-5 text-lg font-bold border-b border-gray-700">
        Bills Calculator
      </div>
      <nav className="flex-1 py-2">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `block px-4 py-2 text-sm hover:bg-gray-700 transition-colors ${isActive ? 'bg-gray-700 font-semibold' : ''}`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <button
        onClick={logout}
        className="mx-4 mb-4 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 rounded transition-colors"
      >
        Odhlásit
      </button>
    </aside>
  )
}
