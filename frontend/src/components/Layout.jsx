import { useEffect, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '📊', roles: null },
  { to: '/cars', label: 'Cars', icon: '🚗', roles: null },
  { to: '/customers', label: 'Customers', icon: '👥', roles: null },
  { to: '/sales', label: 'Sales', icon: '💰', roles: null },
  { to: '/installments', label: 'Installments', icon: '📅', roles: null },
  { to: '/transactions', label: 'Transactions', icon: '💵', roles: null },
  { to: '/expenses', label: 'Expenses', icon: '🧾', roles: null },
  { to: '/users', label: 'Users', icon: '🧑‍💼', roles: ['owner', 'manager'] },
  { to: '/audit-logs', label: 'Audit Logs', icon: '📜', roles: ['owner', 'manager'] },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const visibleNav = NAV.filter((item) => !item.roles || item.roles.includes(user?.role))
  const currentLabel = visibleNav.find((item) =>
    item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
  )?.label

  return (
    <div className="min-h-screen flex bg-[#FAF8F3]">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden animate-fadeIn"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-ink-900 text-white flex flex-col shrink-0 transform transition-transform duration-300 ease-out
        lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="sheen-line-v absolute top-0 right-0 bottom-0" />

        <div className="px-5 py-6 flex items-center gap-3 border-b border-white/10">
          <div className="relative w-11 h-11 shrink-0 rounded-xl overflow-hidden shadow-gold animate-float">
            <img src="/logo.png" alt="New Jeddah Motors" className="w-full h-full object-cover" />
            <div className="absolute inset-0 shimmer-surface animate-shimmer" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-lg font-bold leading-tight text-brand-400 truncate">New Jeddah Motors</h1>
            <p className="text-[11px] text-white/40 tracking-wide">SHOWROOM MANAGEMENT</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-white/50 hover:text-white text-lg"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNav.map((item) => {
            const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-500/20 to-transparent text-brand-300'
                    : 'text-white/60 hover:bg-white/5 hover:text-white hover:translate-x-0.5'
                }`}
              >
                {isActive && <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-brand-400" />}
                <span className="text-base">{item.icon}</span>
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-sm font-semibold truncate text-white">{user?.name}</p>
          <p className="text-xs text-white/40 capitalize">{user?.role} · {user?.branch}</p>
          <button
            onClick={handleLogout}
            className="mt-3 w-full text-sm bg-white/5 hover:bg-white/10 text-white/80 hover:text-brand-300 rounded-lg py-1.5 transition-all duration-200"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile topbar */}
        <div className="lg:hidden sticky top-0 z-20 bg-ink-900 text-white flex items-center gap-3 px-4 py-3 shadow-md">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-xl leading-none px-1 py-1 -ml-1 hover:text-brand-300 transition"
            aria-label="Open menu"
          >
            ☰
          </button>
          <img src="/logo.png" alt="" className="w-7 h-7 rounded-md shrink-0" />
          <span className="font-display font-semibold text-brand-300 truncate">{currentLabel || 'New Jeddah Motors'}</span>
        </div>

        <main className="flex-1 min-w-0 overflow-y-auto">
          <div key={location.pathname} className="max-w-7xl mx-auto p-4 sm:p-6 page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
