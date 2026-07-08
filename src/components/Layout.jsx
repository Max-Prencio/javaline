import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import {
  FiGrid, FiFileText, FiUsers, FiUserCheck, FiShoppingCart,
  FiCalendar, FiVideo, FiTrendingUp, FiCheckSquare, FiShield,
  FiLogOut, FiMenu, FiChevronLeft, FiBell, FiSearch,
  FiSun, FiMoon, FiUser, FiMessageCircle, FiBarChart2,
  FiDollarSign, FiBook
} from 'react-icons/fi'

const LINKS = [
  { to: '/', label: 'Dashboard', icon: FiGrid },
  { to: '/invoicing', label: 'Facturación', icon: FiFileText },
  { to: '/cash-register', label: 'Caja', icon: FiDollarSign },
  { to: '/crm', label: 'CRM', icon: FiUsers },
  { to: '/hr', label: 'RRHH', icon: FiUserCheck },
  { to: '/purchases', label: 'Compras', icon: FiShoppingCart },
  { to: '/scheduling', label: 'Agenda', icon: FiCalendar },
  { to: '/meetings', label: 'Reuniones', icon: FiVideo },
  { to: '/sales', label: 'Ventas Online', icon: FiTrendingUp },
  { to: '/tasks', label: 'Tareas', icon: FiCheckSquare },
  { to: '/accounting', label: 'Contabilidad', icon: FiBook },
  { to: '/reports', label: 'Informes', icon: FiBarChart2 },
  { to: '/security', label: 'Seguridad', icon: FiShield },
  { to: '/chat', label: 'Chat', icon: FiMessageCircle },
]

export default function Layout({ children }) {
  const { user, logout, unreadNotifs, refreshNotifs } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    refreshNotifs?.()
    const interval = setInterval(() => refreshNotifs?.(), 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{background: 'var(--bg-primary)'}}>
      <aside className={`${sidebarOpen ? 'w-56' : 'w-0 md:w-16'} transition-all duration-300 flex-shrink-0 md:relative fixed z-40 h-full`}
        style={{background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)'}}>
        <div className="h-full flex flex-col">
          <div className="h-14 flex items-center px-4 gap-3" style={{borderBottom: '1px solid var(--border)'}}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${!sidebarOpen && 'md:mx-auto'}`}
              style={{background: 'var(--accent-subtle)'}}>
              <img src="/logo.png" alt="Javaline" className="w-7 h-7 object-contain" />
            </div>
            <span className={`font-bold text-sm ${!sidebarOpen && 'md:hidden'}`}
              style={{color: 'var(--text-primary)'}}>Javaline</span>
          </div>
          <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    isActive
                      ? 'border'
                      : 'border border-transparent hover:bg-white/[0.03]'
                  }`
                }
                style={({ isActive }) => ({
                  background: isActive ? 'var(--accent-subtle)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  borderColor: isActive ? 'var(--accent-border)' : 'transparent',
                })}
              >
                <Icon size={16} className="flex-shrink-0" />
                <span className={!sidebarOpen ? 'md:hidden' : ''}>{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="p-2" style={{borderTop: '1px solid var(--border)'}}>
            <NavLink to="/profile"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all hover:bg-white/[0.03] cursor-pointer mb-1"
              style={{color: 'var(--text-secondary)'}}>
              {user?.photo ? (
                <img src={user.photo} className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{background: 'var(--accent-subtle)'}}>
                  <span className="text-[10px] font-bold" style={{color: 'var(--accent)'}}>{user?.name?.[0]}</span>
                </div>
              )}
              <span className={`truncate ${!sidebarOpen && 'md:hidden'}`} style={{color: 'var(--text-primary)'}}>{user?.name}</span>
            </NavLink>
            <button onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-all hover:bg-white/[0.03]"
              style={{color: 'var(--text-muted)'}}>
              <FiLogOut size={15} />
              <span className={!sidebarOpen ? 'md:hidden' : ''}>Salir</span>
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 md:hidden" style={{background: 'rgba(0,0,0,0.5)'}} onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center justify-between px-4"
          style={{background: 'var(--header-bg)', borderBottom: '1px solid var(--border)'}}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 transition-colors"
              style={{color: 'var(--text-muted)'}}>
              {sidebarOpen ? <FiChevronLeft size={18} /> : <FiMenu size={18} />}
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
              style={{background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)'}}>
              <FiSearch size={12} />
              <span>Buscar...</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggle} className="p-1.5 transition-colors"
              style={{color: 'var(--text-muted)'}}>
              {dark ? <FiSun size={16} /> : <FiMoon size={16} />}
            </button>
            <button className="relative p-1.5 transition-colors"
              style={{color: 'var(--text-muted)'}}>
              <FiBell size={16} />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[16px] h-4"
                  style={{background: 'var(--accent)', color: '#fff'}}>
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </button>
            <span className="text-[11px]" style={{color: 'var(--text-muted)'}}>Javaline v1.0</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
