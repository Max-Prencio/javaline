import StatCard from '../../components/StatCard'
import Badge from '../../components/Badge'
import {
  FiUsers, FiUserCheck, FiDollarSign, FiCalendar, FiAlertTriangle, FiAward,
} from 'react-icons/fi'
import { formatMoney } from '../../utils/format'
import { cardStyle } from './shared.jsx'

function EmptyState({ icon: Icon, text }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 0', color: 'var(--text-muted)' }}>
      <Icon size={32} style={{ opacity: 0.3 }} />
      <p style={{ fontSize: 13, margin: 0 }}>{text}</p>
    </div>
  )
}

function DashboardTab({ employees, stats, dashboard }) {
  const d = dashboard || {}
  const s = stats || {}
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        <StatCard icon={FiUsers} label="Empleados Totales" value={d.total_employees || s.total || employees.length} color="var(--accent)" />
        <StatCard icon={FiUserCheck} label="Empleados Activos" value={d.active_employees || s.active || employees.filter(e => e.status === 'activo').length} color="var(--success)" />
        <StatCard icon={FiDollarSign} label="Nómina Total" value={`$${formatMoney(d.total_payroll || s.monthly_payroll || 0, { minimumFractionDigits: 0 })}`} color="var(--success)" />
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

export default DashboardTab
