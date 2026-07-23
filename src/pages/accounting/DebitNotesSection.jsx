import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiX, FiFileText } from 'react-icons/fi'
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

export default function DebitNotesSection() {
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ clientName: '', concept: '', amount: '', tax: '' })
  const [error, setError] = useState('')
  const [hoveredRow, setHoveredRow] = useState(null)

  const load = async () => { setItems(await service.getDebitNotes()) }
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    setError('')
    try {
      if (!form.clientName || !form.amount) { setError('Cliente y monto son requeridos'); return }
      await service.createDebitNote({ ...form, amount: Number(form.amount), tax: Number(form.tax) || 0, date: new Date().toISOString().slice(0, 10) })
      setForm({ clientName: '', concept: '', amount: '', tax: '' })
      setShowModal(false)
      load()
    } catch (e) { setError(e.message) }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowModal(true)} style={btnPrimary}>
          <FiPlus size={16} /> Nueva Nota de Débito
        </motion.button>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['NCF', 'Fecha', 'Cliente', 'Concepto', 'Monto', 'ITBIS', 'Total', 'Estado'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {items.map((n, i) => (
                <motion.tr key={n.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)}
                  style={{ borderBottom: '1px solid var(--border)', background: hoveredRow === i ? 'var(--bg-card)' : 'transparent', transition: 'background 0.15s' }}>
                  <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--accent)' }}>{n.ncf || '—'}</td>
                  <td style={tdStyle}>{formatDate(n.date)}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--text-primary)' }}>{n.clientName}</td>
                  <td style={tdStyle}>{n.concept || '—'}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{formatMoney(n.amount)}</td>
                  <td style={tdStyle}>{formatMoney(n.tax || 0)}</td>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{formatMoney((n.amount || 0) + (n.tax || 0))}</td>
                  <td style={tdStyle}>
                    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                      {n.status === 'active' ? 'Activa' : 'Anulada'}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {items.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center' }}>
                <FiFileText size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 12 }} />
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No hay notas de débito registradas</div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, margin: 0 }}>Nueva Nota de Débito</h3>
              <button onClick={() => { setShowModal(false); setError('') }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={20} /></button>
            </div>
            {error && <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,0.1)', color: '#ef4444', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
            <div style={{ display: 'grid', gap: 12 }}>
              <div><label style={labelStyle}>Cliente</label><input value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} placeholder="Nombre del cliente" style={inputStyle} /></div>
              <div><label style={labelStyle}>Concepto</label><input value={form.concept} onChange={e => setForm({ ...form, concept: e.target.value })} placeholder="Motivo de la nota de débito" style={inputStyle} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Monto</label><input type="number" min={0} step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>ITBIS</label><input type="number" min={0} step="0.01" value={form.tax} onChange={e => setForm({ ...form, tax: e.target.value })} style={inputStyle} /></div>
              </div>
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
