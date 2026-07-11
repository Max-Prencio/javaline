import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiUserCheck, FiPlus, FiX, FiSearch, FiDollarSign, FiCalendar,
  FiEdit2, FiTrash2, FiCheck, FiClock, FiMail, FiPhone,
  FiBriefcase, FiUsers, FiAward, FiFileText, FiCheckCircle,
  FiAlertTriangle, FiTrendingUp, FiBarChart2, FiMessageSquare,
  FiSend, FiRefreshCw, FiPlay, FiPause, FiStopCircle,
  FiChevronRight, FiLink, FiList, FiStar, FiUser,
  FiSmartphone, FiMapPin, FiShield, FiInfo, FiZap,
  FiArrowUpRight, FiArrowDownRight, FiFilter, FiDownload,
  FiEye, FiBookmark, FiActivity, FiPercent, FiUploadCloud, FiPaperclip,
} from 'react-icons/fi'
import api from '../services/apiClient'
import DatePicker from '../components/DatePicker'
import { maskSalary } from '../utils/mask'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

const BADGE = {
  activo: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' },
  inactivo: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' },
  pendiente: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' },
  aprobado: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' },
  rechazado: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' },
  pagada: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' },
  pagado: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' },
  publicada: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' },
  cerrada: { bg: 'rgba(107,90,74,0.1)', color: '#6b5a4a', border: '1px solid rgba(107,90,74,0.2)' },
  borrador: { bg: 'rgba(161,146,128,0.1)', color: '#a09280', border: '1px solid rgba(161,146,128,0.2)' },
  presente: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' },
  ausente: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' },
  tardanza: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' },
  vacaciones: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' },
  permiso: { bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' },
  premium: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' },
  medio: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' },
  bajo: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' },
  no_recomendado: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' },
}

const LABELS = {
  activo: 'Activo', inactivo: 'Inactivo', pendiente: 'Pendiente', aprobado: 'Aprobado',
  rechazado: 'Rechazado', pagada: 'Pagada', pagado: 'Pagado', publicada: 'Publicada',
  cerrada: 'Cerrada', borrador: 'Borrador', presente: 'Presente', ausente: 'Ausente',
  tardanza: 'Tardanza', vacaciones: 'Vacaciones', permiso: 'Permiso', premium: 'Premium',
  medio: 'Medio', bajo: 'Bajo', no_recomendado: 'No Recomendado',
}

const DEDUCTION_TYPES = ['ISR', 'AFP', 'ARS', 'Cooperativa', 'Préstamo', 'Otro']

// Masked salary field with reveal toggle
function SalaryField({ salary, salaryType }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <FiDollarSign size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <span style={{ fontFamily: revealed ? 'inherit' : 'monospace', letterSpacing: revealed ? 'normal' : 1 }}>
        {revealed ? `$${formatMoney(salary)}` : maskSalary(salary)}
      </span>
      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>/ {salaryType || 'mensual'}</span>
      <button onClick={() => setRevealed(r => !r)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--accent)', fontSize: 11, opacity: 0.7 }}
        title={revealed ? 'Ocultar' : 'Revelar salario'}>
        {revealed ? '🙈' : '👁️'}
      </button>
    </div>
  )
}

function calcISR(salary) {
  if (!salary || salary <= 0) return 0
  const annual = salary * 12
  if (annual <= 416220) return 0
  let tax = 0
  if (annual <= 624329) { tax = (annual - 416220) * 0.15 }
  else if (annual <= 867123) { tax = 31216.35 + (annual - 624329) * 0.20 }
  else { tax = 79775.25 + (annual - 867123) * 0.25 }
  return Math.round(tax / 12)
}

function calcAFP(salary) { return salary ? Math.round(salary * 0.0287) : 0 }
function calcARS(salary) { return salary ? Math.round(salary * 0.0304) : 0 }

const inputStyle = {
  width: '100%', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
}

const labelStyle = {
  fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: '0.5px', display: 'block', marginBottom: 6,
}

const btnPrimary = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 20px',
  background: 'var(--accent-gradient)', border: 'none', borderRadius: 8, color: '#fff',
  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
}

const btnOutline = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 16px',
  background: 'transparent', border: '1px solid var(--border)', borderRadius: 8,
  color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
  transition: 'all 0.2s',
}

const btnDanger = {
  ...btnOutline, color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)',
}

const cardStyle = {
  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px',
}

const thStyle = {
  textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid var(--border)',
  background: 'var(--bg-card)',
}

const tdStyle = {
  padding: '12px 16px', fontSize: 13, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-light)',
}

function Badge({ status }) {
  const s = (status || '').toLowerCase()
  const st = BADGE[s] || BADGE.pendiente
  return (
    <span style={{
      display: 'inline-flex', padding: '3px 10px', borderRadius: 20, fontSize: 11,
      fontWeight: 600, textTransform: 'capitalize', background: st.bg,
      color: st.color, border: st.border,
    }}>{LABELS[s] || status}</span>
  )
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 0', color: 'var(--text-muted)' }}>
      <Icon size={32} style={{ opacity: 0.3 }} />
      <p style={{ fontSize: 13, margin: 0 }}>{text}</p>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

function Modal({ open, onClose, title, icon: Icon, wide, children }) {
  if (!open) return null
  return (
    <AnimatePresence>
      <motion.div key="back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={onClose}>
        <motion.div key="mdl" initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={e => e.stopPropagation()}
          style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 28, width: '90%', maxWidth: wide ? 700 : 520, border: '1px solid var(--border)', maxHeight: '88vh', overflow: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {Icon && <Icon size={18} style={{ color: 'var(--accent)' }} />}
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h2>
            </div>
            <motion.button whileHover={{ rotate: 90 }} onClick={onClose}
              style={{ display: 'flex', padding: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer' }}>
              <FiX size={16} />
            </motion.button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: FiBarChart2 },
  { key: 'empleados', label: 'Empleados', icon: FiUsers },
  { key: 'vacaciones', label: 'Vacaciones', icon: FiCalendar },
  { key: 'asistencias', label: 'Asistencias', icon: FiClock },
  { key: 'nominas', label: 'Nóminas', icon: FiDollarSign },
  { key: 'descuentos', label: 'Descuentos', icon: FiPercent },
  { key: 'evaluaciones', label: 'Evaluaciones', icon: FiAward },
  { key: 'encuestas', label: 'Encuestas', icon: FiMessageSquare },
  { key: 'posiciones', label: 'Posiciones', icon: FiBriefcase },
  { key: 'ats', label: 'ATS', icon: FiBookmark },
]

function formatMoney(n) { return (n || 0).toLocaleString('es-DO', { minimumFractionDigits: 0 }) }
function fmtDate(d) { if (!d) return '—'; try { return new Date(d).toLocaleDateString('es-DO') } catch { return d } }

export default function HR() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [empStats, setEmpStats] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadCore = async () => {
    try {
      setLoading(true)
      const [emps, deps, stats, dash] = await Promise.all([
        api.get('/hr/employees'),
        api.get('/hr/employees/departments'),
        api.get('/hr/employees/stats'),
        api.get('/hr/dashboard'),
      ])
      setEmployees(Array.isArray(emps) ? emps : emps.items || emps.employees || [])
      setDepartments(Array.isArray(deps) ? deps : [])
      setEmpStats(stats)
      setDashboard(dash)
    } catch (e) { console.error('HR load error:', e) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadCore() }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: "'Inter', sans-serif", padding: '32px 40px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <motion.div variants={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <FiUserCheck style={{ color: 'var(--accent)', fontSize: 28 }} />
                <h1 style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>Recursos Humanos</h1>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '6px 0 0 40px' }}>Gestión completa de empleados, nómina y más</p>
            </div>
          </motion.div>

          <motion.div variants={item} style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border)', paddingBottom: 0, overflowX: 'auto', flexShrink: 0 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', background: 'none', border: 'none',
                  borderBottom: `2px solid ${activeTab === t.key ? 'var(--accent)' : 'transparent'}`,
                  color: activeTab === t.key ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}>
                <t.icon size={15} /> {t.label}
              </button>
            ))}
          </motion.div>

          <motion.div variants={item}>
            {activeTab === 'dashboard' && <DashboardTab employees={employees} stats={empStats} dashboard={dashboard} />}
            {activeTab === 'empleados' && <EmpleadosTab employees={employees} departments={departments} reload={loadCore} />}
            {activeTab === 'vacaciones' && <VacacionesTab employees={employees} />}
            {activeTab === 'asistencias' && <AsistenciasTab employees={employees} />}
            {activeTab === 'nominas' && <NominasTab employees={employees} />}
            {activeTab === 'descuentos' && <DescuentosTab employees={employees} />}
            {activeTab === 'evaluaciones' && <EvaluacionesTab employees={employees} />}
            {activeTab === 'encuestas' && <EncuestasTab />}
            {activeTab === 'posiciones' && <PosicionesTab />}
            {activeTab === 'ats' && <ATSTab />}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '18px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={14} style={{ color: color || 'var(--accent)' }} />
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      </div>
      <span style={{ fontSize: 24, fontWeight: 700, color: color || 'var(--text-primary)', letterSpacing: '-0.5px' }}>{value}</span>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD TAB
   ═══════════════════════════════════════════════════════════════ */
function DashboardTab({ employees, stats, dashboard }) {
  const d = dashboard || {}
  const s = stats || {}
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        <StatCard icon={FiUsers} label="Empleados Totales" value={d.total_employees || s.total || employees.length} color="var(--accent)" />
        <StatCard icon={FiUserCheck} label="Empleados Activos" value={d.active_employees || s.active || employees.filter(e => e.status === 'activo').length} color="var(--success)" />
        <StatCard icon={FiDollarSign} label="Nómina Total" value={`$${formatMoney(d.total_payroll || s.monthly_payroll || 0)}`} color="var(--success)" />
        <StatCard icon={FiCalendar} label="Vacaciones Pendientes" value={d.pending_vacations || 0} color="var(--warning)" />
        <StatCard icon={FiAlertTriangle} label="Ausentes Hoy" value={d.today_absent || 0} color="var(--danger)" />
        <StatCard icon={FiAward} label="Evals Pendientes" value={d.pending_evaluations || 0} color="var(--accent)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={cardStyle}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>Empleados por Departamento</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {employees.length > 0 ? (() => {
              const depts = {}
              employees.forEach(e => { const d = e.department || 'Sin departamento'; depts[d] = (depts[d] || 0) + 1 })
              const max = Math.max(...Object.values(depts), 1)
              return Object.entries(depts).sort((a, b) => b[1] - a[1]).map(([dept, count]) => (
                <div key={dept}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{dept}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{count}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-primary)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(count / max) * 100}%`, borderRadius: 3, background: 'var(--accent-gradient)', transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))
            })() : <EmptyState icon={FiUsers} text="Sin datos de departamentos" />}
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>Últimos Empleados</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {employees.slice(-5).reverse().map(emp => (
              <div key={emp.id || emp.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                  {emp.photo_url ? <img src={emp.photo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 8, objectFit: 'cover' }} /> : (emp.name || '?')[0].toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{emp.position || emp.department || '—'}</p>
                </div>
                <Badge status={emp.status || 'activo'} />
              </div>
            ))}
            {employees.length === 0 && <EmptyState icon={FiUsers} text="No hay empleados registrados" />}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   EMPLEADOS TAB
   ═══════════════════════════════════════════════════════════════ */
function EmpleadosTab({ employees, departments, reload }) {
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editEmp, setEditEmp] = useState(null)
  const emptyForm = {
    name: '', email: '', phone: '', department: '', position: '', salary: '',
    salary_type: 'mensual', hire_date: '', contract_end_date: '', contract_type: 'indefinido',
    status: 'activo', rnc: '', tss_number: '', ars: '', afp: '', bank_account: '',
    emergency_contact: '', emergency_phone: '', punch_enabled: false,
  }
  const [form, setForm] = useState(emptyForm)

  const filtered = useMemo(() => {
    return employees.filter(e => {
      const matchSearch = !search || (e.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.department || '').toLowerCase().includes(search.toLowerCase()) || (e.position || '').toLowerCase().includes(search.toLowerCase())
      const matchDept = !deptFilter || e.department === deptFilter
      const matchStatus = !statusFilter || e.status === statusFilter
      return matchSearch && matchDept && matchStatus
    })
  }, [employees, search, deptFilter, statusFilter])

  const openCreate = () => { setEditEmp(null); setForm(emptyForm); setModalOpen(true) }

  const openEdit = (emp) => {
    setEditEmp(emp)
    setForm({
      name: emp.name || '', email: emp.email || '', phone: emp.phone || '',
      department: emp.department || '', position: emp.position || '',
      salary: emp.salary || '', salary_type: emp.salary_type || 'mensual',
      hire_date: emp.hire_date || '', contract_end_date: emp.contract_end_date || '',
      contract_type: emp.contract_type || 'indefinido', status: emp.status || 'activo',
      rnc: emp.rnc || '', tss_number: emp.tss_number || '', ars: emp.ars || '',
      afp: emp.afp || '', bank_account: emp.bank_account || '',
      emergency_contact: emp.emergency_contact || '', emergency_phone: emp.emergency_phone || '',
      punch_enabled: emp.punch_enabled || false,
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const payload = { ...form, salary: Number(form.salary) || 0 }
    try {
      if (editEmp) {
        await api.put(`/hr/employees/${editEmp.id}`, payload)
      } else {
        await api.post('/hr/employees', payload)
      }
      setModalOpen(false); reload()
    } catch (e) { alert(e.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este empleado?')) return
    try { await api.delete(`/hr/employees/${id}`); reload() } catch (e) { alert(e.message) }
  }

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input placeholder="Buscar empleados..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 36 }} />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          style={{ ...inputStyle, width: 'auto', padding: '10px 14px', minWidth: 140 }}>
          <option value="">Todos los deptos.</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ ...inputStyle, width: 'auto', padding: '10px 14px', minWidth: 120 }}>
          <option value="">Todos</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={openCreate} style={btnPrimary}>
          <FiPlus size={16} /> Nuevo Empleado
        </motion.button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {filtered.map(emp => (
          <motion.div key={emp.id || emp.name} layout variants={item} initial="hidden" animate="show"
            style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 12, padding: 18, transition: 'border-color 0.2s', cursor: 'default' }}
            whileHover={{ borderColor: 'var(--accent-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, fontWeight: 700, color: 'var(--accent)', overflow: 'hidden' }}>
                {emp.photo_url ? <img src={emp.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (emp.name || '?')[0].toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{emp.position || '—'}</p>
              </div>
              <Badge status={emp.status || 'activo'} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiBriefcase size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span>{emp.department || '—'}</span>
              </div>
              {emp.contract_type && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiFileText size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span style={{ textTransform: 'capitalize' }}>{emp.contract_type}</span>
              </div>}
              <SalaryField salary={emp.salary} salaryType={emp.salary_type} />
              {emp.hire_date && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiCalendar size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span>Ingreso: {fmtDate(emp.hire_date)}</span>
              </div>}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-light)' }}>
              <button onClick={() => openEdit(emp)} style={{ ...btnOutline, flex: 1, fontSize: 11, padding: '7px 12px' }}>
                <FiEdit2 size={12} /> Editar
              </button>
              <button onClick={() => handleDelete(emp.id)} style={{ ...btnDanger, fontSize: 11, padding: '7px 12px' }}>
                <FiTrash2 size={12} />
              </button>
              {emp.user_id && (
                <button onClick={() => navigate(`/profile/${emp.user_id}`)} style={{ ...btnOutline, fontSize: 11, padding: '7px 12px' }}>
                  <FiLink size={12} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState icon={FiUsers} text="No se encontraron empleados" />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editEmp ? 'Editar Empleado' : 'Nuevo Empleado'} icon={FiUserCheck} wide>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Nombre completo"><input value={form.name} onChange={set('name')} required style={inputStyle} /></FormField>
            <FormField label="Email"><input type="email" value={form.email} onChange={set('email')} style={inputStyle} /></FormField>
            <FormField label="Teléfono"><input value={form.phone} onChange={set('phone')} style={inputStyle} /></FormField>
            <FormField label="Departamento">
              <select value={form.department} onChange={set('department')} style={inputStyle}>
                <option value="">Seleccionar...</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                <option value="Administración">Administración</option>
                <option value="Ventas">Ventas</option>
                <option value="TI">TI</option>
                <option value="RRHH">RRHH</option>
                <option value="Operaciones">Operaciones</option>
                <option value="Finanzas">Finanzas</option>
              </select>
            </FormField>
            <FormField label="Cargo"><input value={form.position} onChange={set('position')} style={inputStyle} /></FormField>
            <FormField label="Salario (RD$)"><input type="number" value={form.salary} onChange={set('salary')} style={inputStyle} /></FormField>
            <FormField label="Tipo de Salario">
              <select value={form.salary_type} onChange={set('salary_type')} style={inputStyle}>
                <option value="mensual">Mensual</option>
                <option value="quincenal">Quincenal</option>
                <option value="semanal">Semanal</option>
                <option value="diario">Diario</option>
              </select>
            </FormField>
            <DatePicker label="Fecha de Ingreso" value={form.hire_date} onChange={v => setForm({ ...form, hire_date: v })} />
            <DatePicker label="Fin de Contrato" value={form.contract_end_date} onChange={v => setForm({ ...form, contract_end_date: v })} />
            <FormField label="Tipo de Contrato">
              <select value={form.contract_type} onChange={set('contract_type')} style={inputStyle}>
                <option value="indefinido">Indefinido</option>
                <option value="temporal">Temporal</option>
                <option value="por_obras">Por Obras</option>
                <option value="prueba">Prueba</option>
              </select>
            </FormField>
            <FormField label="Estado">
              <select value={form.status} onChange={set('status')} style={inputStyle}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </FormField>
            <FormField label="RNC"><input value={form.rnc} onChange={set('rnc')} style={inputStyle} /></FormField>
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px 0' }}>Información Legal y Bancaria</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <FormField label="# TSS/ISR"><input value={form.tss_number} onChange={set('tss_number')} style={inputStyle} /></FormField>
              <FormField label="ARS"><input value={form.ars} onChange={set('ars')} style={inputStyle} /></FormField>
              <FormField label="AFP"><input value={form.afp} onChange={set('afp')} style={inputStyle} /></FormField>
              <FormField label="# Cuenta Bancaria"><input value={form.bank_account} onChange={set('bank_account')} style={inputStyle} /></FormField>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px 0' }}>Contacto de Emergencia</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormField label="Nombre"><input value={form.emergency_contact} onChange={set('emergency_contact')} style={inputStyle} /></FormField>
              <FormField label="Teléfono"><input value={form.emergency_phone} onChange={set('emergency_phone')} style={inputStyle} /></FormField>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <input type="checkbox" checked={form.punch_enabled} onChange={set('punch_enabled')} id="punch" style={{ accentColor: 'var(--accent)' }} />
            <label htmlFor="punch" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>Habilitar reloj de control de asistencia</label>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setModalOpen(false)} style={{ ...btnOutline }}>Cancelar</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" style={btnPrimary}>
              <FiCheck size={15} /> {editEmp ? 'Guardar Cambios' : 'Crear Empleado'}
            </motion.button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   VACACIONES TAB
   ═══════════════════════════════════════════════════════════════ */
function VacacionesTab({ employees }) {
  const [vacations, setVacations] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedEmp, setSelectedEmp] = useState('')
  const [avail, setAvail] = useState(null)
  const emptyForm = { employee_id: '', type: 'vacaciones', start_date: '', end_date: '', total_days: '', recurring: false, notes: '' }
  const [form, setForm] = useState(emptyForm)

  const load = async () => {
    try {
      let url = '/hr/vacations?'
      if (filterStatus) url += `status=${filterStatus}&`
      if (selectedEmp) url += `employee_id=${selectedEmp}&`
      const data = await api.get(url)
      setVacations(Array.isArray(data) ? data : data.items || [])
    } catch (e) { console.error(e) }
  }

  const loadAvail = async (empId) => {
    if (!empId) { setAvail(null); return }
    try { setAvail(await api.get(`/hr/vacations/available/${empId}`)) } catch { setAvail(null) }
  }

  useEffect(() => { load() }, [filterStatus, selectedEmp])

  useEffect(() => { loadAvail(selectedEmp) }, [selectedEmp])

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      await api.post('/hr/vacations', { ...form, total_days: Number(form.total_days) || 0 })
      setModalOpen(false); setForm(emptyForm); load()
    } catch (e) { alert(e.message) }
  }

  const handleAction = async (id, status) => {
    try { await api.put(`/hr/vacations/${id}`, { status }); load() } catch (e) { alert(e.message) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 180 }}>
          <option value="">Todos los empleados</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 130 }}>
          <option value="">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="aprobado">Aprobado</option>
          <option value="rechazado">Rechazado</option>
        </select>
        <div style={{ flex: 1 }} />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => { setForm(emptyForm); setModalOpen(true) }} style={btnPrimary}>
          <FiPlus size={16} /> Nueva Solicitud
        </motion.button>
      </div>

      {avail && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Total', value: avail.total, color: 'var(--accent)' },
            { label: 'Usadas', value: avail.used, color: 'var(--danger)' },
            { label: 'Pendientes', value: avail.pending, color: 'var(--warning)' },
            { label: 'Disponibles', value: avail.available, color: 'var(--success)' },
          ].map(i => (
            <div key={i.label} style={{ ...cardStyle, textAlign: 'center', padding: '14px 12px' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', fontWeight: 600 }}>{i.label}</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: i.color, margin: '4px 0 0 0' }}>{i.value || 0}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Empleado', 'Tipo', 'Desde', 'Hasta', 'Días', 'Estado', 'Acciones'].map(h => <th key={h} style={thStyle}>{h}</th>)}
          </tr></thead>
          <tbody>
            {vacations.map(v => (
              <tr key={v.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={tdStyle}>{employees.find(e => e.id === v.employee_id)?.name || v.employee_name || v.employee_id}</td>
                <td style={{ ...tdStyle, textTransform: 'capitalize' }}>{v.type || 'vacaciones'}</td>
                <td style={tdStyle}>{fmtDate(v.start_date)}</td>
                <td style={tdStyle}>{fmtDate(v.end_date)}</td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{v.total_days}</td>
                <td style={tdStyle}><Badge status={v.status || 'pendiente'} /></td>
                <td style={tdStyle}>
                  {v.status === 'pendiente' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleAction(v.id, 'aprobado')} style={{ ...btnOutline, padding: '5px 10px', color: 'var(--success)', borderColor: 'rgba(16,185,129,0.3)' }}><FiCheck size={12} /></button>
                      <button onClick={() => handleAction(v.id, 'rechazado')} style={{ ...btnDanger, padding: '5px 10px' }}><FiX size={12} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {vacations.length === 0 && <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center' }}><EmptyState icon={FiCalendar} text="No hay solicitudes de vacaciones" /></td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Solicitud de Vacaciones" icon={FiCalendar}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="Empleado">
            <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} required style={inputStyle}>
              <option value="">Seleccionar...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </FormField>
          <FormField label="Tipo">
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>
              <option value="vacaciones">Vacaciones</option>
              <option value="permiso">Permiso</option>
              <option value="licencia">Licencia</option>
              <option value="incapacidad">Incapacidad</option>
            </select>
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <DatePicker label="Fecha Inicio" value={form.start_date} onChange={v => setForm({ ...form, start_date: v })} />
            <DatePicker label="Fecha Fin" value={form.end_date} onChange={v => setForm({ ...form, end_date: v })} />
          </div>
          <FormField label="Días Totales"><input type="number" value={form.total_days} onChange={e => setForm({ ...form, total_days: e.target.value })} style={inputStyle} /></FormField>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <input type="checkbox" checked={form.recurring} onChange={e => setForm({ ...form, recurring: e.target.checked })} id="rec" style={{ accentColor: 'var(--accent)' }} />
            <label htmlFor="rec" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>Recurrente (cada año)</label>
          </div>
          <FormField label="Notas"><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></FormField>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setModalOpen(false)} style={btnOutline}>Cancelar</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" style={btnPrimary}><FiCheck size={15} /> Enviar Solicitud</motion.button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ASISTENCIAS TAB
   ═══════════════════════════════════════════════════════════════ */
function AsistenciasTab({ employees }) {
  const [records, setRecords] = useState([])
  const [selectedEmp, setSelectedEmp] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [summary, setSummary] = useState(null)

  const load = async () => {
    try {
      let url = '/hr/attendance?'
      if (selectedEmp) url += `employee_id=${selectedEmp}&`
      if (dateFrom) url += `date_from=${dateFrom}&`
      if (dateTo) url += `date_to=${dateTo}&`
      if (filterStatus) url += `status=${filterStatus}&`
      const data = await api.get(url)
      setRecords(Array.isArray(data) ? data : data.items || [])
    } catch (e) { console.error(e) }
  }

  const loadSummary = async () => {
    if (!selectedEmp) { setSummary(null); return }
    const now = new Date()
    try {
      const data = await api.get(`/hr/attendance/summary/${selectedEmp}?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
      setSummary(data)
    } catch { setSummary(null) }
  }

  useEffect(() => { load() }, [selectedEmp, dateFrom, dateTo, filterStatus])
  useEffect(() => { loadSummary() }, [selectedEmp])

  const punch = async (action) => {
    if (!selectedEmp) { alert('Selecciona un empleado primero'); return }
    try { await api.post(`/hr/attendance/punch?employee_id=${selectedEmp}&action=${action}`); load() } catch (e) { alert(e.message) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 180 }}>
          <option value="">Seleccionar empleado</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <DatePicker value={dateFrom} onChange={setDateFrom} style={{ width: 160 }} />
        <DatePicker value={dateTo} onChange={setDateTo} style={{ width: 160 }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 120 }}>
          <option value="">Todos</option>
          <option value="presente">Presente</option>
          <option value="ausente">Ausente</option>
          <option value="tardanza">Tardanza</option>
        </select>
      </div>

      {selectedEmp && (
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { action: 'in', label: 'Entrada', icon: FiPlay, color: 'var(--success)' },
            { action: 'break_start', label: 'Salida Comida', icon: FiPause, color: 'var(--warning)' },
            { action: 'break_end', label: 'Retorno Comida', icon: FiRefreshCw, color: 'var(--accent)' },
            { action: 'out', label: 'Salida', icon: FiStopCircle, color: 'var(--danger)' },
          ].map(b => (
            <motion.button key={b.action} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
              onClick={() => punch(b.action)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: 'var(--bg-card)', border: `1px solid var(--border)`, borderRadius: 8, color: b.color, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = b.color; e.currentTarget.style.background = 'var(--bg-elevated)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)' }}>
              <b.icon size={14} /> {b.label}
            </motion.button>
          ))}
        </div>
      )}

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
          {[
            { label: 'Horas Trabajadas', value: summary.total_hours || 0, color: 'var(--accent)' },
            { label: 'Horas Extra', value: summary.overtime_hours || 0, color: 'var(--warning)' },
            { label: 'Días Presentes', value: summary.present_days || 0, color: 'var(--success)' },
            { label: 'Días Ausentes', value: summary.absent_days || 0, color: 'var(--danger)' },
            { label: 'Tardanzas', value: summary.late_days || 0, color: 'var(--warning)' },
          ].map(i => (
            <div key={i.label} style={{ ...cardStyle, padding: '14px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', fontWeight: 600 }}>{i.label}</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: i.color, margin: '4px 0 0 0' }}>{i.value}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Fecha', 'Empleado', 'Entrada', 'Salida', 'Horas', 'Extra', 'Estado'].map(h => <th key={h} style={thStyle}>{h}</th>)}
          </tr></thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={tdStyle}>{fmtDate(r.date || r.punch_date)}</td>
                <td style={tdStyle}>{employees.find(e => e.id === r.employee_id)?.name || r.employee_name || r.employee_id}</td>
                <td style={{ ...tdStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{r.clock_in || r.punch_in || '—'}</td>
                <td style={{ ...tdStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{r.clock_out || r.punch_out || '—'}</td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{r.total_hours || '—'}</td>
                <td style={{ ...tdStyle, color: (r.overtime_hours || 0) > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>{r.overtime_hours || 0}h</td>
                <td style={tdStyle}><Badge status={r.status || 'presente'} /></td>
              </tr>
            ))}
            {records.length === 0 && <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center' }}><EmptyState icon={FiClock} text="No hay registros de asistencia" /></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   NÓMINAS TAB
   ═══════════════════════════════════════════════════════════════ */
function NominasTab({ employees }) {
  const [payrolls, setPayrolls] = useState([])
  const [summary, setSummary] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const emptyForm = { employee_id: '', period_start: '', period_end: '', gross_amount: '', net_amount: '', status: 'pendiente', notes: '' }
  const [form, setForm] = useState(emptyForm)

  const load = async () => {
    try {
      let url = '/hr/payroll?'
      if (filterStatus) url += `status=${filterStatus}&`
      const [data, summ] = await Promise.all([api.get(url), api.get('/hr/payroll/summary')])
      setPayrolls(Array.isArray(data) ? data : data.items || [])
      setSummary(summ)
    } catch (e) { console.error(e) }
  }

  useEffect(() => { load() }, [filterStatus])

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      await api.post('/hr/payroll', { ...form, gross_amount: Number(form.gross_amount) || 0, net_amount: Number(form.net_amount) || 0 })
      setModalOpen(false); setForm(emptyForm); load()
    } catch (e) { alert(e.message) }
  }

  const handlePay = async (id) => {
    if (!confirm('¿Marcar como pagada?')) return
    try { await api.post(`/hr/payroll/${id}/pay`); load() } catch (e) { alert(e.message) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          {[
            { label: 'Total Bruto', value: `$${formatMoney(summary.total_gross)}`, color: 'var(--accent)' },
            { label: 'Total Neto', value: `$${formatMoney(summary.total_net)}`, color: 'var(--success)' },
            { label: 'Pagadas', value: summary.paid_count || 0, color: 'var(--success)' },
            { label: 'Pendientes', value: summary.pending_count || 0, color: 'var(--warning)' },
          ].map(i => (
            <div key={i.label} style={{ ...cardStyle, padding: '14px 16px' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', fontWeight: 600 }}>{i.label}</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: i.color, margin: '4px 0 0 0' }}>{i.value}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 130 }}>
          <option value="">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="pagada">Pagada</option>
        </select>
        <div style={{ flex: 1 }} />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => { setForm(emptyForm); setModalOpen(true) }} style={btnPrimary}>
          <FiPlus size={16} /> Nueva Nómina
        </motion.button>
      </div>

      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Empleado', 'Período', 'Bruto', 'Neto', 'Estado', 'Acciones'].map(h => <th key={h} style={thStyle}>{h}</th>)}
          </tr></thead>
          <tbody>
            {payrolls.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={tdStyle}>{employees.find(e => e.id === p.employee_id)?.name || p.employee_name || p.employee_id}</td>
                <td style={tdStyle}>{fmtDate(p.period_start)} — {fmtDate(p.period_end)}</td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>${formatMoney(p.gross_amount)}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--success)' }}>${formatMoney(p.net_amount)}</td>
                <td style={tdStyle}><Badge status={p.status || 'pendiente'} /></td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {p.status !== 'pagada' && (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handlePay(p.id)}
                        style={{ ...btnOutline, padding: '5px 10px', color: 'var(--success)', borderColor: 'rgba(16,185,129,0.3)', fontSize: 11 }}>
                        <FiCheck size={12} /> Pagar
                      </motion.button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {payrolls.length === 0 && <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center' }}><EmptyState icon={FiDollarSign} text="No hay nóminas registradas" /></td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Nómina" icon={FiDollarSign}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="Empleado">
            <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} required style={inputStyle}>
              <option value="">Seleccionar...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <DatePicker label="Inicio Período" value={form.period_start} onChange={v => setForm({ ...form, period_start: v })} />
            <DatePicker label="Fin Período" value={form.period_end} onChange={v => setForm({ ...form, period_end: v })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Monto Bruto"><input type="number" value={form.gross_amount} onChange={e => setForm({ ...form, gross_amount: e.target.value })} style={inputStyle} /></FormField>
            <FormField label="Monto Neto"><input type="number" value={form.net_amount} onChange={e => setForm({ ...form, net_amount: e.target.value })} style={inputStyle} /></FormField>
          </div>
          <FormField label="Notas"><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} /></FormField>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setModalOpen(false)} style={btnOutline}>Cancelar</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" style={btnPrimary}><FiCheck size={15} /> Crear Nómina</motion.button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   DESCUENTOS TAB
   ═══════════════════════════════════════════════════════════════ */
function DescuentosTab({ employees }) {
  const [deductions, setDeductions] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [filterType, setFilterType] = useState('')
  const emptyForm = { employee_id: '', name: '', deduction_type: 'ISR', amount: '', percentage: '', mandatory: true }
  const [form, setForm] = useState(emptyForm)

  const emp = employees.find(e => e.id === form.employee_id)

  useEffect(() => {
    if (!editItem && form.deduction_type === 'ISR' && emp?.salary) {
      setForm(f => ({ ...f, amount: calcISR(emp.salary), percentage: 0 }))
    } else if (!editItem && form.deduction_type === 'AFP' && emp?.salary) {
      setForm(f => ({ ...f, amount: calcAFP(emp.salary), percentage: 2.87 }))
    } else if (!editItem && form.deduction_type === 'ARS' && emp?.salary) {
      setForm(f => ({ ...f, amount: calcARS(emp.salary), percentage: 3.04 }))
    }
  }, [form.deduction_type, form.employee_id])

  const load = async () => {
    try {
      let url = '/hr/deductions?'
      if (filterType) url += `deduction_type=${filterType}&`
      const data = await api.get(url)
      setDeductions(Array.isArray(data) ? data : data.items || [])
    } catch (e) { console.error(e) }
  }

  useEffect(() => { load() }, [filterType])

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setModalOpen(true) }

  const openEdit = (d) => {
    setEditItem(d)
    setForm({ employee_id: d.employee_id || '', name: d.name || '', deduction_type: d.deduction_type || 'ISR', amount: d.amount || '', percentage: d.percentage || '', mandatory: d.mandatory || false })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const payload = { ...form, amount: Number(form.amount) || 0, percentage: Number(form.percentage) || 0 }
    try {
      if (editItem) { await api.put(`/hr/deductions/${editItem.id}`, payload) }
      else { await api.post('/hr/deductions', payload) }
      setModalOpen(false); load()
    } catch (e) { alert(e.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este descuento?')) return
    try { await api.delete(`/hr/deductions/${id}`); load() } catch (e) { alert(e.message) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 150 }}>
          <option value="">Todos los tipos</option>
          {DEDUCTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={openCreate} style={btnPrimary}>
          <FiPlus size={16} /> Nuevo Descuento
        </motion.button>
      </div>

      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Nombre', 'Tipo', 'Empleado', 'Monto', '%', 'Obligatorio', 'Acciones'].map(h => <th key={h} style={thStyle}>{h}</th>)}
          </tr></thead>
          <tbody>
            {deductions.map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{d.name}</td>
                <td style={{ ...tdStyle }}><Badge status={d.deduction_type === 'ISR' ? 'activo' : d.deduction_type === 'ARS' ? 'medio' : d.deduction_type === 'AFP' ? 'premium' : 'pendiente'} /> <span style={{ marginLeft: 6, fontSize: 12 }}>{d.deduction_type}</span></td>
                <td style={tdStyle}>{employees.find(e => e.id === d.employee_id)?.name || d.employee_name || '—'}</td>
                <td style={tdStyle}>${formatMoney(d.amount)}</td>
                <td style={tdStyle}>{d.percentage ? `${d.percentage}%` : '—'}</td>
                <td style={tdStyle}>
                  {d.mandatory ? <FiCheckCircle size={14} style={{ color: 'var(--danger)' }} /> : <FiInfo size={14} style={{ color: 'var(--text-muted)' }} />}
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(d)} style={{ ...btnOutline, padding: '5px 10px' }}><FiEdit2 size={12} /></button>
                    <button onClick={() => handleDelete(d.id)} style={{ ...btnDanger, padding: '5px 10px' }}><FiTrash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {deductions.length === 0 && <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center' }}><EmptyState icon={FiDollarSign} text="No hay descuentos registrados" /></td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Descuento' : 'Nuevo Descuento'} icon={FiDollarSign}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="Nombre del descuento"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={inputStyle} placeholder="Ej: Seguro Médico" /></FormField>
          <FormField label="Empleado">
            <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} style={inputStyle}>
              <option value="">General (todos)</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </FormField>
          <FormField label="Tipo de Descuento">
            <select value={form.deduction_type} onChange={e => setForm({ ...form, deduction_type: e.target.value })} style={inputStyle}>
              {DEDUCTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Monto Fijo (RD$)"><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={inputStyle} /></FormField>
            <FormField label="Porcentaje (%)"><input type="number" value={form.percentage} onChange={e => setForm({ ...form, percentage: e.target.value })} style={inputStyle} /></FormField>
          </div>
          {(form.deduction_type === 'ISR' || form.deduction_type === 'AFP' || form.deduction_type === 'ARS') && emp?.salary > 0 && (
            <div style={{ padding: '8px 12px', background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', borderRadius: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
              {form.deduction_type === 'ISR' && `ISR calculado automáticamente según tasa del DGII para salario de RD$${emp.salary.toLocaleString()}: RD$${calcISR(emp.salary).toLocaleString()}/mes`}
              {form.deduction_type === 'AFP' && `AFP: 2.87% del salario base = RD$${calcAFP(emp.salary).toLocaleString()}/mes`}
              {form.deduction_type === 'ARS' && `ARS: 3.04% del salario base = RD$${calcARS(emp.salary).toLocaleString()}/mes`}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <input type="checkbox" checked={form.mandatory} onChange={e => setForm({ ...form, mandatory: e.target.checked })} id="mand" style={{ accentColor: 'var(--accent)' }} />
            <label htmlFor="mand" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>Descuento obligatorio</label>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setModalOpen(false)} style={btnOutline}>Cancelar</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" style={btnPrimary}><FiCheck size={15} /> {editItem ? 'Guardar' : 'Crear'}</motion.button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   EVALUACIONES TAB
   ═══════════════════════════════════════════════════════════════ */
function EvaluacionesTab({ employees }) {
  const [evaluations, setEvaluations] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const emptyForm = {
    employee_id: '', evaluator: '', evaluation_date: '', score: '',
    strengths: '', weaknesses: '', recommendations: '', status: 'pendiente',
    criteria_scores: '',
  }
  const [form, setForm] = useState(emptyForm)

  const load = async () => {
    try {
      let url = '/hr/evaluations?'
      if (filterStatus) url += `status=${filterStatus}&`
      const data = await api.get(url)
      setEvaluations(Array.isArray(data) ? data : data.items || [])
    } catch (e) { console.error(e) }
  }

  useEffect(() => { load() }, [filterStatus])

  const handleSave = async (e) => {
    e.preventDefault()
    let criteria = null
    if (form.criteria_scores) {
      try { criteria = JSON.parse(form.criteria_scores) } catch { criteria = form.criteria_scores }
    }
    const payload = {
      ...form, score: Number(form.score) || 0, criteria_scores: criteria,
    }
    try {
      await api.post('/hr/evaluations', payload)
      setModalOpen(false); setForm(emptyForm); load()
    } catch (e) { alert(e.message) }
  }

  const handleUpdate = async (id, status) => {
    try { await api.put(`/hr/evaluations/${id}`, { status }); load() } catch (e) { alert(e.message) }
  }

  const scoreColor = (s) => {
    if (s >= 80) return 'var(--success)'
    if (s >= 60) return 'var(--warning)'
    return 'var(--danger)'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 140 }}>
          <option value="">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="completada">Completada</option>
        </select>
        <div style={{ flex: 1 }} />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => { setForm(emptyForm); setModalOpen(true) }} style={btnPrimary}>
          <FiPlus size={16} /> Nueva Evaluación
        </motion.button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {evaluations.map(ev => (
          <motion.div key={ev.id} layout variants={item} initial="hidden" animate="show"
            style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: scoreColor(ev.score), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{ev.score || '—'}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {employees.find(e => e.id === ev.employee_id)?.name || ev.employee_name || ev.employee_id}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Evaluador: {ev.evaluator || '—'} · {fmtDate(ev.evaluation_date)}
              </p>
              {ev.strengths && <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Fortalezas: {ev.strengths}</p>}
              {ev.weaknesses && <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Debilidades: {ev.weaknesses}</p>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
              <Badge status={ev.status || 'pendiente'} />
              {ev.status === 'pendiente' && (
                <button onClick={() => handleUpdate(ev.id, 'completada')} style={{ ...btnOutline, padding: '5px 10px', fontSize: 11 }}>
                  <FiCheck size={12} /> Completar
                </button>
              )}
            </div>
          </motion.div>
        ))}
        {evaluations.length === 0 && <EmptyState icon={FiAward} text="No hay evaluaciones registradas" />}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Evaluación" icon={FiAward} wide>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Empleado">
              <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} required style={inputStyle}>
                <option value="">Seleccionar...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </FormField>
            <FormField label="Evaluador"><input value={form.evaluator} onChange={e => setForm({ ...form, evaluator: e.target.value })} style={inputStyle} placeholder="Nombre del evaluador" /></FormField>
            <DatePicker label="Fecha" value={form.evaluation_date} onChange={v => setForm({ ...form, evaluation_date: v })} />
            <FormField label="Puntuación (0-100)"><input type="number" min="0" max="100" value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} style={inputStyle} /></FormField>
          </div>
          <FormField label="Fortalezas"><textarea value={form.strengths} onChange={e => setForm({ ...form, strengths: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Puntos fuertes del empleado..." /></FormField>
          <FormField label="Debilidades"><textarea value={form.weaknesses} onChange={e => setForm({ ...form, weaknesses: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Áreas de mejora..." /></FormField>
          <FormField label="Recomendaciones"><textarea value={form.recommendations} onChange={e => setForm({ ...form, recommendations: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Acciones recomendadas..." /></FormField>
          <FormField label="Criterios (JSON)"><textarea value={form.criteria_scores} onChange={e => setForm({ ...form, criteria_scores: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} placeholder='{"liderazgo": 85, "puntualidad": 90, "productividad": 75}' /></FormField>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setModalOpen(false)} style={btnOutline}>Cancelar</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" style={btnPrimary}><FiCheck size={15} /> Crear Evaluación</motion.button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ENCUESTAS TAB
   ═══════════════════════════════════════════════════════════════ */
function EncuestasTab() {
  const [surveys, setSurveys] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [respondModal, setRespondModal] = useState(null)
  const [questions, setQuestions] = useState([{ text: '', type: 'text', options: '' }])
  const [responseAnswers, setResponseAnswers] = useState({})
  const emptyForm = { title: '', description: '', status: 'borrador' }
  const [form, setForm] = useState(emptyForm)

  const load = async () => {
    try {
      const data = await api.get('/hr/surveys')
      setSurveys(Array.isArray(data) ? data : data.items || [])
    } catch (e) { console.error(e) }
  }

  useEffect(() => { load() }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    const processedQs = questions.map(q => ({
      text: q.text, type: q.type,
      options: q.options ? q.options.split(',').map(o => o.trim()).filter(Boolean) : [],
    }))
    try {
      await api.post('/hr/surveys', { ...form, questions: processedQs })
      setModalOpen(false); setForm(emptyForm); setQuestions([{ text: '', type: 'text', options: '' }]); load()
    } catch (e) { alert(e.message) }
  }

  const handleStatus = async (id, status) => {
    try { await api.put(`/hr/surveys/${id}`, { status }); load() } catch (e) { alert(e.message) }
  }

  const handleRespond = async () => {
    if (!respondModal) return
    try {
      await api.post(`/hr/surveys/${respondModal.id}/respond`, { answers: responseAnswers })
      setRespondModal(null); setResponseAnswers({})
    } catch (e) { alert(e.message) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1 }} />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => { setForm(emptyForm); setQuestions([{ text: '', type: 'text', options: '' }]); setModalOpen(true) }} style={btnPrimary}>
          <FiPlus size={16} /> Nueva Encuesta
        </motion.button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {surveys.map(s => (
          <motion.div key={s.id} layout variants={item} initial="hidden" animate="show"
            style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{s.title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{fmtDate(s.created_at || s.createdAt)}</p>
              </div>
              <Badge status={s.status || 'borrador'} />
            </div>
            {s.description && <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{s.description}</p>}
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              <FiList size={11} style={{ marginRight: 4 }} />{Array.isArray(s.questions) ? s.questions.length : 0} preguntas
            </p>
            <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-light)' }}>
              {s.status === 'borrador' && (
                <button onClick={() => handleStatus(s.id, 'publicada')} style={{ ...btnOutline, flex: 1, color: 'var(--success)', borderColor: 'rgba(16,185,129,0.3)' }}>
                  <FiSend size={12} /> Publicar
                </button>
              )}
              {s.status === 'publicada' && (
                <button onClick={() => handleStatus(s.id, 'cerrada')} style={{ ...btnOutline, flex: 1, color: 'var(--warning)', borderColor: 'rgba(245,158,11,0.3)' }}>
                  <FiStopCircle size={12} /> Cerrar
                </button>
              )}
              {s.status === 'publicada' && (
                <button onClick={() => { setRespondModal(s); setResponseAnswers({}) }} style={{ ...btnOutline, flex: 1 }}>
                  <FiMessageSquare size={12} /> Responder
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      {surveys.length === 0 && <EmptyState icon={FiMessageSquare} text="No hay encuestas creadas" />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Encuesta" icon={FiMessageSquare} wide>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="Título"><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={inputStyle} placeholder="Encuesta de satisfacción..." /></FormField>
          <FormField label="Descripción"><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} /></FormField>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Preguntas</label>
              <button type="button" onClick={() => setQuestions([...questions, { text: '', type: 'text', options: '' }])}
                style={{ ...btnOutline, padding: '4px 10px', fontSize: 11 }}><FiPlus size={11} /> Agregar</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {questions.map((q, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', minWidth: 20 }}>#{i + 1}</span>
                    <input value={q.text} onChange={e => { const nq = [...questions]; nq[i].text = e.target.value; setQuestions(nq) }}
                      placeholder="Escribe la pregunta..." style={{ ...inputStyle, flex: 1 }} />
                    <select value={q.type} onChange={e => { const nq = [...questions]; nq[i].type = e.target.value; setQuestions(nq) }}
                      style={{ ...inputStyle, width: 'auto', padding: '8px 10px', fontSize: 12 }}>
                      <option value="text">Texto</option>
                      <option value="rating">Calificación</option>
                      <option value="yes_no">Sí/No</option>
                      <option value="multiple">Múltiple</option>
                    </select>
                    {questions.length > 1 && (
                      <button type="button" onClick={() => setQuestions(questions.filter((_, j) => j !== i))}
                        style={{ ...btnDanger, padding: '5px 8px' }}><FiX size={12} /></button>
                    )}
                  </div>
                  {q.type === 'multiple' && (
                    <input value={q.options} onChange={e => { const nq = [...questions]; nq[i].options = e.target.value; setQuestions(nq) }}
                      placeholder="Opciones separadas por coma..." style={{ ...inputStyle, fontSize: 12 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setModalOpen(false)} style={btnOutline}>Cancelar</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" style={btnPrimary}><FiCheck size={15} /> Crear Encuesta</motion.button>
          </div>
        </form>
      </Modal>

      <Modal open={!!respondModal} onClose={() => setRespondModal(null)} title={`Responder: ${respondModal?.title || ''}`} icon={FiMessageSquare}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {Array.isArray(respondModal?.questions) && respondModal.questions.map((q, i) => (
            <div key={i}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>{i + 1}. {q.text}</p>
              {q.type === 'text' && (
                <textarea value={responseAnswers[i] || ''} onChange={e => setResponseAnswers({ ...responseAnswers, [i]: e.target.value })}
                  rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Tu respuesta..." />
              )}
              {q.type === 'rating' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => setResponseAnswers({ ...responseAnswers, [i]: n })}
                      style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${responseAnswers[i] === n ? 'var(--accent)' : 'var(--border)'}`, background: responseAnswers[i] === n ? 'var(--accent-subtle)' : 'var(--bg-card)', color: responseAnswers[i] === n ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {n}
                    </button>
                  ))}
                </div>
              )}
              {q.type === 'yes_no' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Sí', 'No'].map(a => (
                    <button key={a} type="button" onClick={() => setResponseAnswers({ ...responseAnswers, [i]: a })}
                      style={{ ...btnOutline, borderColor: responseAnswers[i] === a ? 'var(--accent)' : 'var(--border)', color: responseAnswers[i] === a ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {a}
                    </button>
                  ))}
                </div>
              )}
              {q.type === 'multiple' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(q.options || []).map(opt => (
                    <button key={opt} type="button" onClick={() => setResponseAnswers({ ...responseAnswers, [i]: opt })}
                      style={{ ...btnOutline, justifyContent: 'flex-start', borderColor: responseAnswers[i] === opt ? 'var(--accent)' : 'var(--border)', color: responseAnswers[i] === opt ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setRespondModal(null)} style={btnOutline}>Cancelar</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleRespond} style={btnPrimary}><FiSend size={14} /> Enviar Respuesta</motion.button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   POSICIONES TAB
   ═══════════════════════════════════════════════════════════════ */
function PosicionesTab() {
  const [positions, setPositions] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(null)
  const [newName, setNewName] = useState('')

  const load = async () => {
    try {
      const data = await api.get('/hr/positions')
      setPositions(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
  }

  useEffect(() => { load() }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    try {
      if (editing) {
        const fd = new FormData()
        fd.append('name', newName.trim())
        await api.put(`/hr/positions/${editing.id}`, fd)
      } else {
        const fd = new FormData()
        fd.append('name', newName.trim())
        await api.post('/hr/positions', fd)
      }
      setModalOpen(false); setNewName(''); setEditing(null); load()
    } catch (e) { alert(e.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta posición?')) return
    try { await api.delete(`/hr/positions/${id}`); load() } catch (e) { alert(e.message) }
  }

  const handleDescrUpload = async (posId, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.post(`/hr/positions/${posId}/upload-descr`, fd)
      load()
    } catch (e) { alert(e.message) }
    finally { setUploading(false) }
  }

  const fileLabel = (fname) => {
    if (!fname) return null
    const parts = fname.split('_')
    return parts.length > 1 ? parts.slice(1).join('_') : fname
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{positions.length} posiciones registradas</p>
        <div style={{ flex: 1 }} />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => { setEditing(null); setNewName(''); setModalOpen(true) }} style={btnPrimary}>
          <FiPlus size={16} /> Nueva Posición
        </motion.button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {positions.map(p => (
          <motion.div key={p.id} layout variants={item} initial="hidden" animate="show"
            style={{ ...cardStyle, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiBriefcase size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0, flex: 1 }}>{p.name}</p>
              <button onClick={() => { setEditing(p); setNewName(p.name); setModalOpen(true) }} style={{ ...btnOutline, padding: '5px 8px', fontSize: 11 }}><FiEdit2 size={12} /></button>
              <button onClick={() => handleDelete(p.id)} style={{ ...btnDanger, padding: '5px 8px', fontSize: 11 }}><FiTrash2 size={12} /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ ...btnOutline, padding: '4px 10px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <FiUploadCloud size={11} /> {uploading ? '...' : 'Descripción'}
                <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={e => handleDescrUpload(p.id, e)} style={{ display: 'none' }} disabled={uploading} />
              </label>
              {p.description_file && (
                <a href={`/uploads/ats/${p.description_file}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <FiPaperclip size={10} />{fileLabel(p.description_file)}
                </a>
              )}
            </div>
          </motion.div>
        ))}
        {positions.length === 0 && <EmptyState icon={FiBriefcase} text="No hay posiciones registradas. Crea la primera posición." />}
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); setNewName('') }} title={editing ? 'Editar Posición' : 'Nueva Posición'} icon={FiBriefcase}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="Nombre de la Posición">
            <input value={newName} onChange={e => setNewName(e.target.value)} required style={inputStyle} placeholder="Ej: Vendedor, Desarrollador, Gerente..." />
          </FormField>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setModalOpen(false); setEditing(null); setNewName('') }} style={btnOutline}>Cancelar</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" style={btnPrimary}><FiCheck size={15} /> {editing ? 'Guardar' : 'Crear'}</motion.button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ATS TAB
   ═══════════════════════════════════════════════════════════════ */
function ATSTab() {
  const [candidates, setCandidates] = useState([])
  const [positions, setPositions] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [analyzing, setAnalyzing] = useState(null)
  const [uploading, setUploading] = useState(false)
  const emptyForm = { name: '', email: '', phone: '', position_applied: '', resume_file: '', position_descr_file: '', classification: '', notes: '' }
  const [form, setForm] = useState(emptyForm)

  const load = async () => {
    try {
      let url = '/hr/ats?'
      if (filterStatus) url += `status=${filterStatus}&`
      const data = await api.get(url)
      setCandidates(Array.isArray(data) ? data : data.items || [])
    } catch (e) { console.error(e) }
  }

  const loadPositions = async () => {
    try {
      const data = await api.get('/hr/ats/positions')
      setPositions(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
  }

  useEffect(() => { load() }, [filterStatus])
  useEffect(() => { loadPositions() }, [])

  const uploadFile = async (file) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post('/hr/ats/upload', fd)
      return res.filename || res.path
    } catch (e) { alert('Error al subir archivo: ' + e.message); return '' }
    finally { setUploading(false) }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      position_applied: form.position_applied,
      resume_file: form.resume_file,
      position_descr_file: form.position_descr_file,
      notes: form.notes || '',
    }
    try {
      await api.post('/hr/ats', payload)
      setModalOpen(false); setForm(emptyForm); load()
    } catch (e) { alert(e.message) }
  }

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fname = await uploadFile(file)
    if (fname) setForm({ ...form, resume_file: fname })
  }

  const handleDescrUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fname = await uploadFile(file)
    if (fname) setForm({ ...form, position_descr_file: fname })
  }

  const handleAnalyze = async (id) => {
    try {
      setAnalyzing(id)
      await api.post(`/hr/ats/${id}/analyze`)
      load()
    } catch (e) { alert(e.message) }
    finally { setAnalyzing(null) }
  }

  const handleUpdate = async (id, status) => {
    try { await api.put(`/hr/ats/${id}`, { status }); load() } catch (e) { alert(e.message) }
  }

  const classBadge = (c) => {
    const s = (c || '').toLowerCase()
    if (s === 'premium' || s === 'recomendado') return { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: c || 'Premium' }
    if (s === 'calificado') return { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: 'Calificado' }
    if (s === 'medianamente-calificado' || s === 'medio' || s === 'apto') return { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: c || 'Medio' }
    if (s === 'subcalificado') return { bg: 'rgba(239,68,68,0.12)', color: '#f59e0b', label: 'Subcalificado' }
    if (s === 'no-calificado') return { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', label: 'No Calificado' }
    return { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', label: c || 'No Recomendado' }
  }

  const fileLabel = (fname) => {
    if (!fname) return null
    const parts = fname.split('_')
    return parts.length > 1 ? parts.slice(1).join('_') : fname
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 140 }}>
          <option value="">Todos</option>
          <option value="nuevo">Nuevo</option>
          <option value="en_revision">En Revisión</option>
          <option value="entrevista">Entrevista</option>
          <option value="contratado">Contratado</option>
          <option value="rechazado">Rechazado</option>
        </select>
        <div style={{ flex: 1 }} />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => { setForm(emptyForm); setModalOpen(true) }} style={btnPrimary}>
          <FiPlus size={16} /> Nuevo Candidato
        </motion.button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {candidates.map(c => (
          <motion.div key={c.id} layout variants={item} initial="hidden" animate="show"
            style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>
              {(c.name || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{c.name}</p>
                {c.classification && (() => {
                  const cls = classBadge(c.classification)
                  return <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700, background: cls.bg, color: cls.color, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{cls.label}</span>
                })()}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{c.position_applied || '—'} · {c.email || '—'}</p>
              {(c.resume_file || c.position_descr_file) && (
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  {c.resume_file && (
                    <a href={`/uploads/ats/${c.resume_file}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <FiPaperclip size={10} />{fileLabel(c.resume_file)}
                    </a>
                  )}
                  {c.position_descr_file && (
                    <a href={`/uploads/ats/${c.position_descr_file}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <FiFileText size={10} />{fileLabel(c.position_descr_file)}
                    </a>
                  )}
                </div>
              )}
              {c.phone && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0 0' }}><FiPhone size={10} style={{ marginRight: 4 }} />{c.phone}</p>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <Badge status={c.status || 'nuevo'} />
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => handleAnalyze(c.id)}
                disabled={analyzing === c.id}
                style={{ ...btnOutline, padding: '7px 14px', borderColor: 'rgba(139,92,246,0.3)', color: analyzing === c.id ? 'var(--text-muted)' : '#8b5cf6', opacity: analyzing === c.id ? 0.6 : 1 }}>
                {analyzing === c.id ? <FiRefreshCw size={13} className="animate-spin" /> : <FiZap size={13} />}
                {analyzing === c.id ? 'Analizando...' : 'Analizar con IA'}
              </motion.button>
              <div style={{ display: 'flex', gap: 4 }}>
                {c.status !== 'contratado' && (
                  <button onClick={() => handleUpdate(c.id, 'entrevista')} style={{ ...btnOutline, padding: '5px 10px', fontSize: 11 }}><FiEye size={12} /></button>
                )}
                {c.status === 'entrevista' && (
                  <button onClick={() => handleUpdate(c.id, 'contratado')} style={{ ...btnOutline, padding: '5px 10px', color: 'var(--success)', borderColor: 'rgba(16,185,129,0.3)' }}><FiCheck size={12} /></button>
                )}
                {c.status !== 'rechazado' && c.status !== 'contratado' && (
                  <button onClick={() => handleUpdate(c.id, 'rechazado')} style={{ ...btnDanger, padding: '5px 10px' }}><FiX size={12} /></button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {candidates.length === 0 && <EmptyState icon={FiBookmark} text="No hay candidatos en el ATS" />}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo Candidato" icon={FiBookmark} wide>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Nombre Completo"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={inputStyle} /></FormField>
            <FormField label="Email"><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} /></FormField>
            <FormField label="Teléfono"><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} /></FormField>
            <FormField label="Posición Aplicada">
              <select value={form.position_applied} onChange={e => setForm({ ...form, position_applied: e.target.value })} required style={inputStyle}>
                <option value="">Seleccionar posición...</option>
                {positions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="CV / Resumen (PDF, Word, Imagen)">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ ...btnOutline, padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiUploadCloud size={14} /> {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
                <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp" onChange={handleResumeUpload} style={{ display: 'none' }} disabled={uploading} />
              </label>
              {form.resume_file && <span style={{ fontSize: 12, color: 'var(--accent)' }}><FiPaperclip size={11} /> {fileLabel(form.resume_file)}</span>}
            </div>
          </FormField>
          <FormField label="Descripción del Puesto (PDF, Word, Imagen)">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ ...btnOutline, padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiUploadCloud size={14} /> {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
                <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp" onChange={handleDescrUpload} style={{ display: 'none' }} disabled={uploading} />
              </label>
              {form.position_descr_file && <span style={{ fontSize: 12, color: 'var(--accent)' }}><FiFileText size={11} /> {fileLabel(form.position_descr_file)}</span>}
            </div>
          </FormField>
          <FormField label="Notas"><textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Notas adicionales..." /></FormField>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setModalOpen(false)} style={btnOutline}>Cancelar</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" style={btnPrimary} disabled={uploading}><FiCheck size={15} /> Crear Candidato</motion.button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
