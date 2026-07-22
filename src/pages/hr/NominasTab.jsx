import logger from '../../services/logger'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiPlus, FiCheck, FiDollarSign } from 'react-icons/fi'
import api from '../../services/apiClient'
import DatePicker from '../../components/DatePicker'
import Badge from '../../components/Badge'
import Modal from '../../components/Modal'
import { EmptyState, FormField, cardStyle, inputStyle, btnPrimary, btnOutline, thStyle, tdStyle } from './shared.jsx'
import { formatMoney, formatDate } from '../../utils/format'

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
    } catch (e) { logger.error('NominasTab', 'error', e) }
  }

  useEffect(() => { load() }, [load, filterStatus])

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
            { label: 'Total Bruto', value: `$${formatMoney(summary.total_gross, { minimumFractionDigits: 0 })}`, color: 'var(--accent)' },
            { label: 'Total Neto', value: `$${formatMoney(summary.total_net, { minimumFractionDigits: 0 })}`, color: 'var(--success)' },
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
                <td style={tdStyle}>{formatDate(p.period_start)} — {formatDate(p.period_end)}</td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>${formatMoney(p.gross_amount, { minimumFractionDigits: 0 })}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--success)' }}>${formatMoney(p.net_amount, { minimumFractionDigits: 0 })}</td>
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

export default NominasTab
