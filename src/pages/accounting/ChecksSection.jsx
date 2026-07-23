import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiX, FiDollarSign } from 'react-icons/fi'
import service from '../../services/accountingService'
import { formatMoney, formatDate } from '../../utils/format'

const inputStyle = {
  width: '100%', padding: '11px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
}
const labelStyle = {
  fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 6,
}
const btnPrimary = {
  padding: '10px 24px', background: 'var(--accent-gradient)', border: 'none', borderRadius: 8,
  color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
}
const thStyle = {
  textAlign: 'left', padding: '12px 20px', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid var(--border)',
}
const tdStyle = { padding: '12px 20px', fontSize: 13 }

const statusColors = {
  pendiente: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
  cobrado: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
  rechazado: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
  cancelado: { bg: 'rgba(107,114,128,0.1)', color: '#6b7280' },
}

export default function ChecksSection() {
  const [items, setItems] = useState([])
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ number: '', bank: '', beneficiary: '', amount: '', type: 'emitido', concept: '', date: new Date().toISOString().slice(0, 10) })
  const [error, setError] = useState('')
  const [hoveredRow, setHoveredRow] = useState(null)

  const load = async () => { setItems(await service.getChecks()) }
  useEffect(() => { load() }, [])

  const filtered = items.filter(c => {
    if (typeFilter !== 'all' && c.type !== typeFilter) return false
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    return true
  })

  const handleCreate = async () => {
    setError('')
    try {
      if (!form.number || !form.amount) { setError('Número y monto son requeridos'); return }
      await service.createCheck({ ...form, amount: Number(form.amount) })
      setForm({ number: '', bank: '', beneficiary: '', amount: '', type: 'emitido', concept: '', date: new Date().toISOString().slice(0, 10) })
      setShowModal(false)
      load()
    } catch (e) { setError(e.message) }
  }

  const handleStatusChange = async (id, newStatus) => {
    await service.updateCheckStatus(id, newStatus)
    load()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div>
            <label style={labelStyle}>Tipo</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ ...inputStyle, width: 140, cursor: 'pointer' }}>
              <option value="all">Todos</option><option value="emitido">Emitido</option><option value="recibido">Recibido</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Estado</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: 140, cursor: 'pointer' }}>
              <option value="all">Todos</option><option value="pendiente">Pendiente</option><option value="cobrado">Cobrado</option><option value="rechazado">Rechazado</option><option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowModal(true)} style={btnPrimary}>
          <FiPlus size={16} /> Nuevo Cheque
        </motion.button>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Número', 'Tipo', 'Banco', 'Beneficiario', 'Monto', 'Fecha', 'Concepto', 'Estado'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {filtered.map((c, i) => {
                const sc = statusColors[c.status] || statusColors.pendiente
                return (
                  <motion.tr key={c.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)}
                    style={{ borderBottom: '1px solid var(--border)', background: hoveredRow === i ? 'var(--bg-card)' : 'transparent', transition: 'background 0.15s' }}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--text-primary)' }}>{c.number}</td>
                    <td style={tdStyle}>
                      <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.type === 'emitido' ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)', color: c.type === 'emitido' ? '#6366f1' : '#10b981' }}>
                        {c.type === 'emitido' ? 'Emitido' : 'Recibido'}
                      </span>
                    </td>
                    <td style={tdStyle}>{c.bank || '—'}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{c.beneficiary}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{formatMoney(c.amount)}</td>
                    <td style={tdStyle}>{formatDate(c.date)}</td>
                    <td style={tdStyle}>{c.concept || '—'}</td>
                    <td style={tdStyle}>
                      <select value={c.status} onChange={e => handleStatusChange(c.id, e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${sc.color}33`, background: sc.bg, color: sc.color, fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
                        <option value="pendiente">Pendiente</option><option value="cobrado">Cobrado</option><option value="rechazado">Rechazado</option><option value="cancelado">Cancelado</option>
                      </select>
                    </td>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center' }}>
                <FiDollarSign size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 12 }} />
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No hay cheques registrados</div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, margin: 0 }}>Nuevo Cheque</h3>
              <button onClick={() => { setShowModal(false); setError('') }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={20} /></button>
            </div>
            {error && <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,0.1)', color: '#ef4444', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Número</label><input value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} placeholder="00000001" style={inputStyle} /></div>
                <div><label style={labelStyle}>Tipo</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="emitido">Emitido</option><option value="recibido">Recibido</option>
                  </select></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Banco</label><input value={form.bank} onChange={e => setForm({ ...form, bank: e.target.value })} placeholder="Nombre del banco" style={inputStyle} /></div>
                <div><label style={labelStyle}>Beneficiario</label><input value={form.beneficiary} onChange={e => setForm({ ...form, beneficiary: e.target.value })} placeholder="Nombre" style={inputStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Monto</label><input type="number" min={0} step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Fecha</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} /></div>
              </div>
              <div><label style={labelStyle}>Concepto</label><input value={form.concept} onChange={e => setForm({ ...form, concept: e.target.value })} placeholder="Descripción del cheque" style={inputStyle} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button onClick={() => { setShowModal(false); setError('') }} style={{ padding: '10px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleCreate} style={btnPrimary}>Guardar</motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
