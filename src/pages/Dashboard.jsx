import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiDollarSign, FiUsers, FiUserCheck, FiShoppingCart,
  FiTrendingUp, FiCheckSquare, FiFileText, FiCalendar,
  FiGrid, FiVideo, FiSearch
} from 'react-icons/fi'
import {
  INVOICES, CONTACTS, EMPLOYEES, PURCHASES, PRODUCTS, TASKS
} from '../data/seed'

const statCards = (stats) => [
  { icon: FiDollarSign, value: `$${stats.totalFacturado.toLocaleString()}`, label: 'Total Facturado' },
  { icon: FiUsers, value: stats.clientesActivos, label: 'Clientes Activos' },
  { icon: FiUserCheck, value: stats.empleados, label: 'Empleados' },
  { icon: FiShoppingCart, value: stats.ordenesCompra, label: 'Órdenes de Compra' },
  { icon: FiTrendingUp, value: `$${stats.ventasMes.toLocaleString()}`, label: 'Ventas del Mes' },
  { icon: FiCheckSquare, value: stats.tareasPendientes, label: 'Tareas Pendientes' },
]

const STATUS_STYLES = {
  pagada: { background: 'rgba(16,185,129,0.12)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.2)' },
  pendiente: { background: 'rgba(245,158,11,0.12)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.2)' },
  vencida: { background: 'rgba(239,68,68,0.12)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' },
}

const QUICK_ACTIONS = [
  { to: '/invoicing', icon: FiFileText, label: 'Nueva Factura', desc: 'Crear y gestionar facturación' },
  { to: '/crm', icon: FiUsers, label: 'Gestión CRM', desc: 'Administrar contactos y clientes' },
  { to: '/scheduling', icon: FiCalendar, label: 'Agendar Cita', desc: 'Programar citas y eventos' },
  { to: '/meetings', icon: FiVideo, label: 'Reuniones', desc: 'Iniciar o programar reuniones' },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const stats = useMemo(() => ({
    totalFacturado: INVOICES.reduce((s, i) => s + i.amount, 0),
    clientesActivos: CONTACTS.filter((c) => c.stage === 'cliente').length,
    empleados: EMPLOYEES.length,
    ordenesCompra: PURCHASES.length,
    ventasMes: PRODUCTS.reduce((s, p) => s + p.price * p.sales, 0),
    tareasPendientes: TASKS.filter((t) => t.status !== 'done').length,
  }), [])

  const cards = statCards(stats)

  const recentInvoices = useMemo(
    () => [...INVOICES].sort((a, b) => new Date(b.date) - new Date(a.date)),
    []
  )

  const filteredInvoices = useMemo(
    () => recentInvoices.filter(
      (inv) =>
        inv.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.id.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [searchQuery, recentInvoices]
  )

  const [hoveredStat, setHoveredStat] = useState(null)
  const [hoveredQuick, setHoveredQuick] = useState(null)

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      <motion.div variants={item}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Resumen general del sistema</p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="stat-grid"
      >
        {cards.map(({ icon: Icon, value, label }, index) => (
          <motion.div
            key={label}
            variants={item}
            onMouseEnter={() => setHoveredStat(index)}
            onMouseLeave={() => setHoveredStat(null)}
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              padding: '16px',
              cursor: 'default',
              transition: 'border-color 0.2s, background 0.2s',
              borderColor: hoveredStat === index ? 'var(--accent-border)' : undefined,
            }}
          >
            {hoveredStat === index && (
              <div style={{ position: 'absolute', inset: 0, background: 'var(--accent-subtle)', pointerEvents: 'none' }} />
            )}
            <div style={{ position: 'relative', zIndex: 10 }}>
              <div
                style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '12px',
                }}
              >
                <Icon size={15} style={{ color: 'var(--accent)' }} />
              </div>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{value}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="main-grid">
        <motion.div
          variants={item}
          style={{
            borderRadius: '12px', background: 'var(--bg-card)',
            border: '1px solid var(--border)', padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Actividad Reciente</h2>
            <div style={{ position: 'relative' }}>
              <FiSearch
                size={14}
                style={{
                  position: 'absolute', left: '10px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Buscar factura..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-border)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '' }}
                style={{
                  padding: '6px 10px 6px 30px', fontSize: '0.8rem',
                  background: 'var(--bg-primary)', border: '1px solid var(--border)',
                  borderRadius: '8px', color: 'var(--text-primary)',
                  outline: 'none', width: '180px', transition: 'border-color 0.2s',
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredInvoices.length > 0 ? filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px', borderRadius: '8px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: 'var(--bg-primary)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                  >
                    <FiFileText size={13} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.client}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{inv.id} &middot; {inv.date}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: '12px' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>${inv.amount.toLocaleString()}</span>
                  <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 500, textTransform: 'capitalize', ...STATUS_STYLES[inv.status] }}>
                    {inv.status}
                  </span>
                </div>
              </div>
            )) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                No se encontraron facturas
              </p>
            )}
          </div>
        </motion.div>

        <motion.div
          variants={item}
          style={{
            borderRadius: '12px', background: 'var(--bg-card)',
            border: '1px solid var(--border)', padding: '20px',
          }}
        >
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>Acciones Rápidas</h2>
          <div className="quick-grid">
            {QUICK_ACTIONS.map(({ to, icon: Icon, label, desc }, idx) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                onMouseEnter={() => setHoveredQuick(idx)}
                onMouseLeave={() => setHoveredQuick(null)}
                style={{
                  textAlign: 'left', padding: '16px', borderRadius: '12px', cursor: 'pointer',
                  background: hoveredQuick === idx ? 'var(--bg-card)' : 'var(--bg-elevated)',
                  border: hoveredQuick === idx ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                  transition: 'all 0.2s', fontFamily: 'inherit',
                }}
              >
                <div
                  style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px',
                  }}
                >
                  <Icon size={16} style={{ color: 'var(--accent)' }} />
                </div>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: hoveredQuick === idx ? 'var(--accent)' : 'var(--text-primary)', margin: 0, transition: 'color 0.2s' }}>
                  {label}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{desc}</p>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      <style>{`
        .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
        .main-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
        .quick-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 640px) { .quick-grid { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 1024px) { .main-grid { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 1280px) { .stat-grid { grid-template-columns: repeat(6, 1fr); } }
        @media (min-width: 1024px) { .stat-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 640px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </motion.div>
  )
}
