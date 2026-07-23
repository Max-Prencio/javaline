import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiX, FiCreditCard } from 'react-icons/fi'
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
const cardStyle = {
  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, flex: 1,
}

function agingColor(days) {
  if (days <= 0) return { bg: 'rgba(16,185,129,0.06)', color: '#10b981' }
  if (days <= 30) return { bg: 'rgba(245,158,11,0.06)', color: '#f59e0b' }
  if (days <= 60) return { bg: 'rgba(249,115,22,0.06)', color: '#f97316' }
  return { bg: 'rgba(239,68,68,0.06)', color: '#ef4444' }
}

export default function ReceivablesSection() {
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState(null)
  const [form, setForm] = useState({ clientName: '', concept: '', amount: '', dueDate: '' })
  const [payForm, setPayForm] = useState({ amount: '', method: 'efectivo', date: new Date().toISOString().slice(0, 10) })
  const [error, setError] = useState('')
  const [hoveredRow, setHoveredRow] = useState(null)

  const load = async () => { setItems(await service.getReceivables()) }
  useEffect(() => { load() }, [])

  const today = new Date().toISOString().slice(0, 10)
  const totalPending = items.filter(r => r.status !== 'paid').reduce((s, r) => s + (r.amount || 0) - (r.paid || 0), 0)
  const overdueToday = items.filter(r => r.status !== 'paid' && r.dueDate && r.dueDate <= today).reduce((s, r) => s + (r.amount || 0) - (r.paid || 0), 0)
  const paidThisMonth = items.filter(r => r.status === 'paid').reduce((s, r) => s + (r.paid || 0), 0)

  const filtered = items.filter(r => {
    if (filter === 'pending') return r.status === 'pending'
    if (filter === 'overdue') return r.status !== 'paid' && r.dueDate && r.dueDate <= today
    if (filter === 'paid') return r.status === 'paid'
    return true
  })

  const handleCreate = async () => {
    setError('')
    try {
      if (!form.clientName || !form.amount) { setError('Cliente y monto son requeridos'); return }
      await service.createReceivable({ ...form, amount: Number(form.amount) })
      setForm({ clientName: '', concept: '', amount: '', dueDate: '' })
      setShowModal(false)
      load()
    } catch (e) { setError(e.message) }
  }

  const handlePay = async () => {
    setError('')
    try {
      await service.payReceivable(showPayModal.id, { ...payForm, amount: Number(payForm.amount) })
      setShowPayModal(null)
      setPayForm({ amount: '', method: 'efectivo', date: new Date().toISOString().slice(0, 10) })
      load()
    } catch (e) { setError(e.message) }
  }

  const getDaysOverdue = (dueDate) => {
    if (!dueDate || dueDate > today) return 0
    return Math.floor((new Date(today) - new Date(dueDate)) / 86400000)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Total Pendiente</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b' }}>{formatMoney(totalPending)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Vencido Hoy</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#ef4444' }}>{formatMoney(overdueToday)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Cobrado Este Mes</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981' }}>{formatMoney(paidThisMonth)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { key: 'all', label: 'Todos' }, { key: 'pending', label: 'Pendientes' },
            { key: 'overdue', label: 'Vencidos' }, { key: 'paid', label: 'Pagados' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: filter === f.key ? 'var(--accent-subtle)' : 'var(--bg-card)',
              color: filter === f.key ? 'var(--accent)' : 'var(--text-muted)',
            }}>{f.label}</button>
          ))}
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowModal(true)} style={btnPrimary}>
          <FiPlus size={16} /> Nueva
        </motion.button>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Cliente', 'Concepto', 'Monto', 'Pagado', 'Pendiente', 'Vence', 'Estado', 'Acción'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {filtered.map((r, i) => {
                const days = getDaysOverdue(r.dueDate)
                const ac = agingColor(days)
                return (
                  <motion.tr key={r.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)}
                    style={{ borderBottom: '1px solid var(--border)', background: hoveredRow === i ? 'var(--bg-card)' : 'transparent', transition: 'background 0.15s' }}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--text-primary)' }}>{r.clientName}</td>
                    <td style={tdStyle}>{r.concept || '—'}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{formatMoney(r.amount)}</td>
                    <td style={{ ...tdStyle, color: '#10b981' }}>{formatMoney(r.paid || 0)}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#ef4444' }}>{formatMoney((r.amount || 0) - (r.paid || 0))}</td>
                    <td style={tdStyle}>{formatDate(r.dueDate)}</td>
                    <td style={tdStyle}>
                      <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: ac.bg, color: ac.color }}>
                        {r.status === 'paid' ? 'Pagado' : days > 0 ? `${days}d vencido` : 'Pendiente'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {r.status !== 'paid' && (
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowPayModal(r)}
                          style={{ padding: '5px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 6, color: '#10b981', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          Cobrar
                        </motion.button>
                      )}
                    </td>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center' }}>
                <FiCreditCard size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 12 }} />
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No hay cuentas por cobrar</div>
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
              <h3 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, margin: 0 }}>Nueva Cuenta por Cobrar</h3>
              <button onClick={() => { setShowModal(false); setError('') }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={20} /></button>
            </div>
            {error && <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,0.1)', color: '#ef4444', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
            <div style={{ display: 'grid', gap: 12 }}>
              <div><label style={labelStyle}>Cliente</label><input value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} placeholder="Nombre del cliente" style={inputStyle} /></div>
              <div><label style={labelStyle}>Concepto</label><input value={form.concept} onChange={e => setForm({ ...form, concept: e.target.value })} placeholder="Descripción" style={inputStyle} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Monto</label><input type="number" min={0} step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Fecha Vencimiento</label><input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} style={inputStyle} /></div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button onClick={() => { setShowModal(false); setError('') }} style={{ padding: '10px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleCreate} style={btnPrimary}>Guardar</motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {showPayModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, margin: 0 }}>Registrar Cobro — {showPayModal.clientName}</h3>
              <button onClick={() => { setShowPayModal(null); setError('') }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={20} /></button>
            </div>
            {error && <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,0.1)', color: '#ef4444', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
            <div style={{ display: 'grid', gap: 12 }}>
              <div><label style={labelStyle}>Monto a cobrar</label><input type="number" min={0} step="0.01" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} style={inputStyle} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Método</label>
                  <select value={payForm.method} onChange={e => setPayForm({ ...payForm, method: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="tarjeta">Tarjeta</option><option value="cheque">Cheque</option>
                  </select></div>
                <div><label style={labelStyle}>Fecha</label><input type="date" value={payForm.date} onChange={e => setPayForm({ ...payForm, date: e.target.value })} style={inputStyle} /></div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button onClick={() => { setShowPayModal(null); setError('') }} style={{ padding: '10px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handlePay} style={btnPrimary}>Registrar Cobro</motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
