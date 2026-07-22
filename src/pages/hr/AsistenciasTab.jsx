import logger from '../../services/logger'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FiPlay, FiPause, FiRefreshCw, FiStopCircle, FiClock,
} from 'react-icons/fi'
import api from '../../services/apiClient'
import DatePicker from '../../components/DatePicker'
import Badge from '../../components/Badge'
import { inputStyle, cardStyle, thStyle, tdStyle, EmptyState } from './shared.jsx'
import { formatDate } from '../../utils/format'

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
    } catch (e) { logger.error('AsistenciasTab', 'error', e) }
  }

  const loadSummary = async () => {
    if (!selectedEmp) { setSummary(null); return }
    const now = new Date()
    try {
      const data = await api.get(`/hr/attendance/summary/${selectedEmp}?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
      setSummary(data)
    } catch { setSummary(null) }
  }

  useEffect(() => { load() }, [load, selectedEmp, dateFrom, dateTo, filterStatus])
  useEffect(() => { loadSummary() }, [loadSummary, selectedEmp])

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
                <td style={tdStyle}>{formatDate(r.date || r.punch_date)}</td>
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

export default AsistenciasTab
