import logger from '../../services/logger'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiPlus, FiX, FiCalendar, FiCheck } from 'react-icons/fi'
import api from '../../services/apiClient'
import Badge from '../../components/Badge'
import Modal from '../../components/Modal'
import DatePicker from '../../components/DatePicker'
import { EmptyState, FormField, inputStyle, btnPrimary, btnOutline, btnDanger, cardStyle, thStyle, tdStyle } from './shared.jsx'
import { formatDate } from '../../utils/format'

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
    } catch (e) { logger.error('VacacionesTab', 'error', e) }
  }

  const loadAvail = async (empId) => {
    if (!empId) { setAvail(null); return }
    try { setAvail(await api.get(`/hr/vacations/available/${empId}`)) } catch { setAvail(null) }
  }

  useEffect(() => { load() }, [load, filterStatus, selectedEmp])

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
                <td style={tdStyle}>{formatDate(v.start_date)}</td>
                <td style={tdStyle}>{formatDate(v.end_date)}</td>
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

export default VacacionesTab
