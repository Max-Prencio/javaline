import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiDollarSign, FiUsers, FiUserCheck, FiShoppingCart,
  FiTrendingUp, FiCheckSquare, FiFileText, FiCalendar,
  FiGrid, FiVideo, FiSearch, FiX, FiArrowRight, FiInfo,
} from 'react-icons/fi'
import {
  INVOICES, CONTACTS, EMPLOYEES, PURCHASES, PRODUCTS, TASKS
} from '../data/seed'

const QUICK_ACTIONS = [
  { to: '/invoicing', icon: FiFileText, label: 'Nueva Factura', desc: 'Crear y gestionar facturación' },
  { to: '/crm', icon: FiUsers, label: 'Gestión CRM', desc: 'Administrar contactos y clientes' },
  { to: '/scheduling', icon: FiCalendar, label: 'Agendar Cita', desc: 'Programar citas y eventos' },
  { to: '/meetings', icon: FiVideo, label: 'Reuniones', desc: 'Iniciar o programar reuniones' },
  { to: '/hr', icon: FiUserCheck, label: 'RRHH', desc: 'Gestionar empleados' },
  { to: '/tasks', icon: FiCheckSquare, label: 'Tareas', desc: 'Ver tareas pendientes' },
  { to: '/purchases', icon: FiShoppingCart, label: 'Compras', desc: 'Órdenes de compra' },
  { to: '/inventory', icon: FiGrid, label: 'Inventario', desc: 'Productos y stock' },
]

function buildKpiDef(stats) {
  return [
    {
      icon: FiDollarSign, value: `$${stats.totalFacturado.toLocaleString()}`, label: 'Total Facturado',
      desc: 'Suma total de todas las facturas emitidas en el sistema. Refleja los ingresos generados por ventas facturadas.',
      preview: INVOICES.slice(0, 5),
      previewRender: (item) => `${item.client} — $${item.amount.toLocaleString()} (${item.status})`,
      modules: [{ to: '/invoicing', label: 'Ir a Facturación' }],
    },
    {
      icon: FiUsers, value: stats.clientesActivos, label: 'Clientes Activos',
      desc: 'Cantidad de contactos marcados como cliente activo. Útil para medir la base de clientes actual.',
      preview: CONTACTS.filter(c => c.stage === 'cliente').slice(0, 5),
      previewRender: (item) => `${item.name} — ${item.company}`,
      modules: [{ to: '/crm', label: 'Ir a CRM' }],
    },
    {
      icon: FiUserCheck, value: stats.empleados, label: 'Empleados',
      desc: 'Total de empleados registrados en el sistema. Incluye todas las áreas y roles.',
      preview: EMPLOYEES.slice(0, 5),
      previewRender: (item) => `${item.name} — ${item.position}`,
      modules: [{ to: '/hr', label: 'Ir a RRHH' }],
    },
    {
      icon: FiShoppingCart, value: stats.ordenesCompra, label: 'Órdenes de Compra',
      desc: 'Cantidad de órdenes de compra registradas. Incluye todas las órdenes emitidas a proveedores.',
      preview: PURCHASES.slice(0, 5),
      previewRender: (item) => `${item.supplier} — $${item.total?.toLocaleString() || '0'}`,
      modules: [{ to: '/purchases', label: 'Ir a Compras' }],
    },
    {
      icon: FiTrendingUp, value: `$${stats.ventasMes.toLocaleString()}`, label: 'Ventas del Mes',
      desc: 'Total de ventas estimadas del mes actual basado en los productos más vendidos.',
      preview: PRODUCTS.sort((a, b) => b.sales - a.sales).slice(0, 5),
      previewRender: (item) => `${item.name} — ${item.sales} uds ($${(item.price * item.sales).toLocaleString()})`,
      modules: [{ to: '/sales', label: 'Ir a Ventas' }, { to: '/inventory', label: 'Ir a Inventario' }],
    },
    {
      icon: FiCheckSquare, value: stats.tareasPendientes, label: 'Tareas Pendientes',
      desc: 'Tareas que aún no han sido completadas. Mantente al día con tus pendientes.',
      preview: TASKS.filter(t => t.status !== 'done').slice(0, 5),
      previewRender: (item) => `${item.title} — ${item.priority} (${item.assignee})`,
      modules: [{ to: '/tasks', label: 'Ir a Tareas' }],
    },
  ]
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [wizard, setWizard] = useState(null)

  useEffect(() => { setLoading(false) }, [])

  const stats = useMemo(() => ({
    totalFacturado: INVOICES.reduce((s, i) => s + i.amount, 0),
    clientesActivos: CONTACTS.filter((c) => c.stage === 'cliente').length,
    empleados: EMPLOYEES.length,
    ordenesCompra: PURCHASES.length,
    ventasMes: PRODUCTS.reduce((s, p) => s + p.price * p.sales, 0),
    tareasPendientes: TASKS.filter((t) => t.status !== 'done').length,
  }), [])

  const kpis = useMemo(() => buildKpiDef(stats), [stats])

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

  if (loading) return (<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><div className="spinner" /></div>)

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <motion.div variants={item}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Resumen general del sistema</p>
      </motion.div>

      {/* Quick Actions — arriba */}
      <motion.div variants={item}>
        <div className="quick-grid">
          {QUICK_ACTIONS.map(({ to, icon: Icon, label, desc }) => (
            <button key={to} onClick={() => navigate(to)}
              style={{ textAlign: 'left', padding: '14px 16px', borderRadius: 12, cursor: 'pointer', background: 'var(--bg-card)', border: '1px solid var(--border)', fontFamily: 'inherit', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.background = 'var(--accent-subtle)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} style={{ color: 'var(--accent)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{label}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>{desc}</p>
                </div>
                <FiArrowRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* KPI Cards — clickeables */}
      <motion.div variants={item} className="stat-grid">
        {kpis.map((k, index) => {
          const Icon = k.icon
          return (
            <motion.div key={k.label} variants={item}
              onClick={() => setWizard(index)}
              style={{ borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '16px', cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s' }}
              whileHover={{ scale: 1.03, borderColor: 'var(--accent-border)' }} whileTap={{ scale: 0.97 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Icon size={15} style={{ color: 'var(--accent)' }} />
              </div>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{k.value}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Actividad Reciente */}
      <motion.div variants={item} style={{ borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Actividad Reciente</h2>
          <div style={{ position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input type="text" placeholder="Buscar factura..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ padding: '6px 10px 6px 30px', fontSize: '0.8rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none', width: 180, transition: 'border-color 0.2s' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-border)' }}
              onBlur={e => { e.currentTarget.style.borderColor = '' }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredInvoices.length > 0 ? filteredInvoices.map((inv) => (
            <div key={inv.id}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', transition: 'background 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FiFileText size={13} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.client}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{inv.id} &middot; {inv.date}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, marginLeft: 12 }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>${inv.amount.toLocaleString()}</span>
                <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 500, textTransform: 'capitalize', ...STATUS_STYLES[inv.status] }}>
                  {inv.status}
                </span>
              </div>
            </div>
          )) : (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>No se encontraron facturas</p>
          )}
        </div>
      </motion.div>

      {/* Wizard Modal */}
      <AnimatePresence>
        {wizard !== null && kpis[wizard] && (() => {
        const k = kpis[wizard]
        const Icon = k.icon
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setWizard(null)}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 28, width: '90%', maxWidth: 520, border: '1px solid var(--border)', maxHeight: '85vh', overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {Icon && <Icon size={18} style={{ color: 'var(--accent)' }} />}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{k.label}</h2>
                    <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)', margin: '2px 0 0 0' }}>{k.value}</p>
                  </div>
                </div>
                <button onClick={() => setWizard(null)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <FiX size={16} />
                </button>
              </div>

              <div style={{ padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 10, marginBottom: 20, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <FiInfo size={13} color="var(--accent)" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Descripción</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{k.desc}</p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Vista previa</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {k.preview.length > 0 ? k.preview.map((item, i) => (
                    <div key={i} style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-primary)' }}>
                      {k.previewRender(item)}
                    </div>
                  )) : (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sin datos disponibles</p>
                  )}
                </div>
              </div>

              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Módulos relacionados</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {k.modules.map(m => (
                    <button key={m.to} onClick={() => { setWizard(null); navigate(m.to) }}
                      style={{ padding: '10px 18px', background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', borderRadius: 10, color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
                      {m.label} <FiArrowRight size={14} />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )})()}
      </AnimatePresence>

      <style>{`
        .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
        .quick-grid { display: grid; gap: 10px; }
        @media (min-width: 640px) { .quick-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .quick-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (min-width: 1280px) { .stat-grid { grid-template-columns: repeat(6, 1fr); } }
        @media (min-width: 1024px) { .stat-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 640px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </motion.div>
  )
}

const STATUS_STYLES = {
  pagada: { background: 'rgba(16,185,129,0.12)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.2)' },
  pendiente: { background: 'rgba(245,158,11,0.12)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.2)' },
  vencida: { background: 'rgba(239,68,68,0.12)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' },
}
