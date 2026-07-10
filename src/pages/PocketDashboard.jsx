import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiPackage, FiBell, FiChevronRight, FiClock, FiAlertTriangle, FiCheckCircle,
  FiMenu, FiLogOut, FiArrowLeft, FiUser,
} from 'react-icons/fi'
import pocketService from '../services/pocketService'
import { useAuth } from '../contexts/AuthContext'

function formatTime(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })
}

export default function PocketDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const wsRef = useRef(null)

  const load = useCallback(async () => {
    const d = await pocketService.getDashboard()
    setDashboard(d)
    const n = await pocketService.getNotifications()
    setNotifications(n)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const tid = user?.tenantId || 'default'
    const uid = user?.userId || user?.id
    if (!uid) return
    wsRef.current = pocketService.connectWs(tid, uid, (msg) => {
      setNotifications(prev => [msg, ...prev])
      load()
    })
    return () => wsRef.current?.close()
  }, [user])

  const handleLogout = () => { logout(); navigate('/login') }

  const cards = dashboard ? [
    { label: 'Tareas hoy', value: dashboard.tasks_count, icon: FiCheckCircle, color: '#22c55e' },
    { label: 'Notificaciones', value: dashboard.unread_notifications, icon: FiBell, color: '#f59e0b' },
    { label: 'Alertas stock', value: dashboard.low_stock_alerts, icon: FiAlertTriangle, color: '#ef4444' },
  ] : []

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f13', color: '#fff', fontFamily: "'Inter', sans-serif", maxWidth: 480, margin: '0 auto' }}>
      <div style={{ padding: '16px 20px', background: '#1a1a23', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4 }}>
            <FiMenu size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#fff' }}>Javaline Pocket</h1>
            <p style={{ fontSize: 11, color: '#666', margin: 0 }}>{dashboard?.user_name || 'Cargando...'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowNotifs(!showNotifs)} style={{ position: 'relative', background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4 }}>
            <FiBell size={20} />
            {dashboard?.unread_notifications > 0 && (
              <span style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {dashboard.unread_notifications}
              </span>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)' }} onClick={() => setMenuOpen(false)}>
          <motion.div initial={{ x: -280 }} animate={{ x: 0 }} style={{ width: 260, height: '100%', background: '#1a1a23', padding: 20 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#2a2a35', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiUser size={18} color="#888" />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{dashboard?.user_name}</p>
                <p style={{ fontSize: 11, color: '#666', margin: 0 }}>Pocket Mobile</p>
              </div>
            </div>
            <button onClick={() => { navigate('/pocket/count'); setMenuOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 14, borderRadius: 8, textAlign: 'left' }}>
              <FiPackage size={18} color="#f59e0b" /> Iniciar Inventario
            </button>
            <button onClick={() => { navigate('/pocket'); setMenuOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 14, borderRadius: 8, textAlign: 'left' }}>
              <FiClock size={18} color="#22c55e" /> Dashboard
            </button>
            <div style={{ marginTop: 'auto', paddingTop: 32 }}>
              <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14, borderRadius: 8, textAlign: 'left' }}>
                <FiLogOut size={18} /> Cerrar sesión
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <div style={{ padding: 20 }}>
        {cards.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
            {cards.map((c, i) => (
              <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                style={{ background: '#1a1a23', borderRadius: 12, padding: '16px 12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                <c.icon size={22} style={{ color: c.color, marginBottom: 8 }} />
                <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#fff' }}>{c.value}</p>
                <p style={{ fontSize: 10, color: '#666', margin: '4px 0 0' }}>{c.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        <button onClick={() => navigate('/pocket/count')}
          style={{ width: '100%', padding: '18px 20px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><FiPackage size={20} /> Iniciar Inventario</span>
          <FiChevronRight size={20} />
        </button>

        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#888', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Últimas notificaciones
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.length === 0 && (
            <p style={{ color: '#555', fontSize: 13, textAlign: 'center', padding: 20 }}>Sin notificaciones</p>
          )}
          {notifications.slice(0, 10).map((n) => (
            <motion.div key={n.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              style={{ background: n.read ? '#1a1a23' : '#1e1e2a', borderRadius: 10, padding: '12px 14px', border: `1px solid ${n.read ? 'rgba(255,255,255,0.04)' : 'rgba(245,158,11,0.15)'}`, cursor: 'pointer' }}
              onClick={async () => { if (!n.read) { await pocketService.markNotificationRead(n.id); load() } }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{n.title}</span>
                <span style={{ fontSize: 10, color: '#555' }}>{formatTime(n.created_at)}</span>
              </div>
              <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{n.message}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', padding: '12px 20px', background: '#1a1a23', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-around' }}>
        <button onClick={() => navigate('/pocket')} style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', fontSize: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}><FiClock size={18} /> Inicio</button>
        <button onClick={() => navigate('/pocket/count')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}><FiPackage size={18} /> Contar</button>
        <button onClick={() => setShowNotifs(!showNotifs)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative' }}>
          <FiBell size={18} />
          {dashboard?.unread_notifications > 0 && <span style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', background: '#ef4444', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{dashboard.unread_notifications}</span>}
          Notificaciones
        </button>
      </div>
    </div>
  )
}
