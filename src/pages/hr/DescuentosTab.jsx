import logger from '../../services/logger'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiPlus, FiCheckCircle, FiInfo, FiEdit2, FiTrash2, FiDollarSign, FiCheck } from 'react-icons/fi'
import api from '../../services/apiClient'
import Badge from '../../components/Badge'
import Modal from '../../components/Modal'
import { EmptyState, FormField, inputStyle, btnPrimary, btnOutline, btnDanger, cardStyle, thStyle, tdStyle, DEDUCTION_TYPES, calcISR, calcAFP, calcARS } from './shared.jsx'
import { formatMoney } from '../../utils/format'

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
  }, [editItem, form.deduction_type, form.employee_id, emp?.salary])

  const load = async () => {
    try {
      let url = '/hr/deductions?'
      if (filterType) url += `deduction_type=${filterType}&`
      const data = await api.get(url)
      setDeductions(Array.isArray(data) ? data : data.items || [])
    } catch (e) { logger.error('DescuentosTab', 'error', e) }
  }

  useEffect(() => { load() }, [load, filterType])

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
                <td style={tdStyle}>${formatMoney(d.amount, { minimumFractionDigits: 0 })}</td>
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

export default DescuentosTab
