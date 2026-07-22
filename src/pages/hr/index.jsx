import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FiUserCheck, FiBarChart2, FiUsers, FiCalendar, FiClock,
  FiDollarSign, FiPercent, FiAward, FiMessageSquare, FiBriefcase, FiBookmark,
  FiTarget, FiUser,
} from 'react-icons/fi'
import api from '../../services/apiClient'
import logger from '../../services/logger'
import DashboardTab from './DashboardTab'
import EmpleadosTab from './EmpleadosTab'
import VacacionesTab from './VacacionesTab'
import AsistenciasTab from './AsistenciasTab'
import NominasTab from './NominasTab'
import DescuentosTab from './DescuentosTab'
import EvaluacionesTab from './EvaluacionesTab'
import EncuestasTab from './EncuestasTab'
import PosicionesTab from './PosicionesTab'
import ATSTab from './ATSTab'
import { container, item } from './shared.jsx'

const GROUPS = [
  {
    key: 'overview',
    label: 'Resumen',
    icon: FiBarChart2,
    tabs: [
      { key: 'dashboard', label: 'Dashboard', icon: FiBarChart2 },
      { key: 'empleados', label: 'Empleados', icon: FiUsers },
    ],
  },
  {
    key: 'time',
    label: 'Tiempo',
    icon: FiClock,
    tabs: [
      { key: 'vacaciones', label: 'Vacaciones', icon: FiCalendar },
      { key: 'asistencias', label: 'Asistencias', icon: FiClock },
    ],
  },
  {
    key: 'payroll',
    label: 'Nómina',
    icon: FiDollarSign,
    tabs: [
      { key: 'nominas', label: 'Nóminas', icon: FiDollarSign },
      { key: 'descuentos', label: 'Descuentos', icon: FiPercent },
    ],
  },
  {
    key: 'performance',
    label: 'Desempeño',
    icon: FiTarget,
    tabs: [
      { key: 'evaluaciones', label: 'Evaluaciones', icon: FiAward },
      { key: 'encuestas', label: 'Encuestas', icon: FiMessageSquare },
    ],
  },
  {
    key: 'recruitment',
    label: 'Reclutamiento',
    icon: FiUser,
    tabs: [
      { key: 'posiciones', label: 'Posiciones', icon: FiBriefcase },
      { key: 'ats', label: 'ATS', icon: FiBookmark },
    ],
  },
]

export default function HR() {
  const [group, setGroup] = useState('overview')
  const [tab, setTab] = useState('dashboard')
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [empStats, setEmpStats] = useState(null)
  const [dashboard, setDashboard] = useState(null)

  const loadCore = async () => {
    try {
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
    } catch (e) { logger.error('HR', 'load error', e) }
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

          <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 8 }}>
            {GROUPS.map(g => {
              const Icon = g.icon
              const active = group === g.key
              return (
                <button key={g.key} onClick={() => { setGroup(g.key); setTab(g.tabs[0].key) }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 8, padding: '18px 12px',
                    background: active ? 'var(--accent-gradient)' : 'var(--bg-card)',
                    border: active ? 'none' : '1px solid var(--border)',
                    borderRadius: 14,
                    color: active ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: 600, fontSize: 12,
                    transition: 'all 0.2s',
                    boxShadow: active ? '0 4px 14px rgba(0,0,0,0.25)' : 'none',
                  }}>
                  <Icon size={22} />
                  {g.label}
                </button>
              )
            })}
          </motion.div>

          <motion.div variants={item} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '12px 0', marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
            {GROUPS.find(g => g.key === group).tabs.map(t => {
              const Icon = t.icon
              const active = tab === t.key
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px',
                    background: active ? 'rgba(var(--accent-rgb, 234,88,12), 0.12)' : 'var(--bg-elevated)',
                    border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                    borderRadius: 8,
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}>
                  <Icon size={13} />
                  {t.label}
                </button>
              )
            })}
          </motion.div>

          <motion.div variants={item}>
            {tab === 'dashboard' && <DashboardTab employees={employees} stats={empStats} dashboard={dashboard} />}
            {tab === 'empleados' && <EmpleadosTab employees={employees} departments={departments} reload={loadCore} />}
            {tab === 'vacaciones' && <VacacionesTab employees={employees} />}
            {tab === 'asistencias' && <AsistenciasTab employees={employees} />}
            {tab === 'nominas' && <NominasTab employees={employees} />}
            {tab === 'descuentos' && <DescuentosTab employees={employees} />}
            {tab === 'evaluaciones' && <EvaluacionesTab employees={employees} />}
            {tab === 'encuestas' && <EncuestasTab />}
            {tab === 'posiciones' && <PosicionesTab />}
            {tab === 'ats' && <ATSTab />}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
