import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../context/ThemeContext'

interface Props {
  onClose?: () => void
}

const LANGS = [
  { code: 'cs', label: 'Čeština' },
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'ua', label: 'Українська' },
]

export default function Sidebar({ onClose }: Props) {
  const { logout } = useAuth()
  const { t, i18n } = useTranslation()
  const { theme, toggleTheme } = useTheme()

  const links = [
    { to: '/faktury',  label: t('nav.invoices'), icon: '🧾' },
    { to: '/vydaje',   label: t('nav.expenses'),  icon: '💸' },
    { to: '/hotovost', label: t('nav.cash'),       icon: '💰' },
    { to: '/driver',   label: t('nav.driver'),     icon: '🚗' },
    { to: '/routes',   label: t('nav.routes'),     icon: '🗺️' },
    { to: '/report',   label: t('nav.report'),     icon: '📊' },
    { to: '/io',       label: t('nav.io'),         icon: '📂' },
  ]

  const changeLang = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('lang', lang)
  }

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
      <div className="px-4 pb-2 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors text-center"
        >
          {theme === 'dark' ? '☀️ ' + t('nav.themeLight') : '🌙 ' + t('nav.themeDark')}
        </button>
        <select
          value={i18n.language}
          onChange={e => changeLang(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors text-center cursor-pointer"
        >
          {LANGS.map(l => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
      </div>
      <button
        onClick={() => { logout(); onClose?.() }}
        className="mx-4 mb-4 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 rounded transition-colors"
      >
        {t('nav.logout')}
      </button>
    </aside>
  )
}
