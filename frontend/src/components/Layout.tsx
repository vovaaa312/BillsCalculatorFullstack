import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { NavLink } from 'react-router-dom'
import Sidebar from './Sidebar'

const links = [
  { to: '/faktury',  label: 'Faktury',       icon: '🧾' },
  { to: '/vydaje',   label: 'Výdaje',         icon: '💸' },
  { to: '/hotovost', label: 'Hotovost',        icon: '💰' },
  { to: '/driver',   label: 'Řidič',           icon: '🚗' },
  { to: '/routes',   label: 'Trasy',           icon: '🗺️' },
  { to: '/report',   label: 'Report',          icon: '📊' },
  { to: '/io',       label: 'I/E',             icon: '📂' },
]

const PAGE_TITLES: Record<string, string> = {
  '/faktury':  'Faktury',
  '/vydaje':   'Výdaje',
  '/hotovost': 'Hotovost',
  '/driver':   'Řidič',
  '/routes':   'Trasy',
  '/report':   'Report',
  '/io':       'Import / Export',
}

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] ?? 'Bills Calculator'

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* ── Desktop sidebar ─────────────────────────────── */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* ── Mobile slide-in sidebar overlay ─────────────── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="relative z-10">
            <Sidebar onClose={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Main content ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top bar */}
        <header className="md:hidden bg-gray-900 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
          <button onClick={() => setMenuOpen(true)} className="text-2xl leading-none">☰</button>
          <span className="font-semibold text-base">{title}</span>
        </header>

        <main className="flex-1 p-3 md:p-6 pb-20 md:pb-6 overflow-auto">
          <Outlet />
        </main>

        {/* ── Mobile bottom tab bar ───────────────────────── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 text-white flex z-40 border-t border-gray-700">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2 text-xs transition-colors ${isActive ? 'text-white bg-gray-700' : 'text-gray-400 hover:text-white'}`
              }
            >
              <span className="text-lg leading-none mb-0.5">{l.icon}</span>
              <span className="truncate w-full text-center px-0.5">{l.label}</span>
            </NavLink>
          ))}
        </nav>

      </div>
    </div>
  )
}
