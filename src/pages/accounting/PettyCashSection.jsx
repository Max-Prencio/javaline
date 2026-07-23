import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiX, FiDroplet } from 'react-icons/fi'
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

const CATEGORIES = ['Papelería', 'Transporte', 'Alimentación', 'Limpieza', 'Mantenimiento', 'Otros']

export default function PettyCashSection() {
  const [funds, setFunds] = useState([])
  const [selectedFund, setSelectedFund] = useState(null)
  const [movements, setMovements] = useState([])
  const [showModal, setShowModal] = useState(null) // 'egreso' | 'reposicion'
  const [form, setForm] = useState({ amount: '', concept: '', category: 'Otros', date: new Date().toISOString().slice(0, 10) })
  const [error, setError] = useState('')
  const [hoveredRow, setHoveredRow] = useState(null)

  const loadFunds = async () => { setFunds(await service.getPettyCashFunds()) }
  const loadMovements = async (fundId) => { if (fundId) setMovements(await service.getPettyCashMovements(fundId)) }
  useEffect(() => { loadFunds() }, [])
  useEffect(() => { if (selectedFund) loadMovements(selectedFund.id) }, [selectedFund])

  const handleMovement = async () => {
    setError('')
    try {
      if (!form.amount || Number(form.amount) <= 0) { setError('Monto requerido'); return }
      await service.addPettyCashMovement(selectedFund.id, { ...form, amount: Number(form.amount), type: showModal })
      setForm({ amount: '', concept: '', category: 'Otros', date: new Date().toISOString().slice(0, 10) })
      setShowModal(null)
      loadMovements(selectedFund.id)
      loadFunds()
    } catch (e) { setError(e.message) }
  }

  const handleReconcile = async () => {
    if (!confirm('¿Reconciliar fondo? Se repondrá al saldo inicial.')) return
    await service.reconcilePettyCash(selectedFund.id, 'Cuadre periódico')
    loadMovements(selectedFund.id)
    loadFunds()
  }

  const fund = funds.find(f => f.id === selectedFund?.id)

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {funds.map(f => (
          <div key={f.id} onClick={() => setSelectedFund(f)} style={{
            background: 'var(--bg-card)', border: `2px solid ${selectedFund?.id === f.id ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 12, padding: 20, cursor: 'pointer', flex: '1 1 240px', transition: 'border-color 0.2s',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>{f.name || 'Fondo General'}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{formatMoney(f.balance || f.currentBalance || 0)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Inicial: {formatMoney(f.initialBalance || f.InitialBalance || 5000)}</div>
          </div>
        ))}
        {funds.length === 0 && (
          <div style={{ flex: 1, textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <FiDroplet size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div>No hay fondos de caja chica configurados</div>
          </div>
        )}
      </div>

      {fund && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, margin: 0 }}>Movimientos — {fund.name || 'Fondo General'}</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowModal('egreso')}
                style={{ ...btnPrimary, background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                <FiPlus size={16} /> Egreso
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowModal('reposicion')}
                style={{ ...btnPrimary, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <FiPlus size={16} /> Reposición
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleReconcile}
                style={{ ...btnPrimary, background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                Reconciliar
              </motion.button>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {['Fecha', 'Tipo', 'Categoría', 'Concepto', 'Monto', 'Saldo Posterior'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {movements.map((m, i) => (
                    <motion.tr key={m.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)}
                      style={{ borderBottom: '1px solid var(--border)',
                        background: m.type === 'egreso' ? 'rgba(239,68,68,0.03)' : m.type === 'reposicion' ? 'rgba(16,185,129,0.03)' : hoveredRow === i ? 'var(--bg-card)' : 'transparent',
                        transition: 'background 0.15s' }}>
                      <td style={tdStyle}>{formatDate(m.date)}</td>
                      <td style={tdStyle}>
                        <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: m.type === 'egreso' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                          color: m.type === 'egreso' ? '#ef4444' : '#10b981' }}>
                          {m.type === 'egreso' ? 'Egreso' : 'Reposición'}
                        </span>
                      </td>
                      <td style={tdStyle}>{m.category || '—'}</td>
                      <td style={{ ...tdStyle, color: 'var(--text-primary)' }}>{m.concept || '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: m.type === 'egreso' ? '#ef4444' : '#10b981' }}>
                        {m.type === 'egreso' ? '-' : '+'}{formatMoney(m.amount)}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{formatMoney(m.balanceAfter || 0)}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {movements.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center' }}>
                    <FiDroplet size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 12 }} />
                    <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Sin movimientos registrados</div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, margin: 0 }}>{showModal === 'egreso' ? 'Nuevo Egreso' : 'Nueva Reposición'}</h3>
              <button onClick={() => { setShowModal(null); setError('') }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={20} /></button>
            </div>
            {error && <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,0.1)', color: '#ef4444', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
            <div style={{ display: 'grid', gap: 12 }}>
              <div><label style={labelStyle}>Monto</label><input type="number" min={0} step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={inputStyle} /></div>
              {showModal === 'egreso' && (
                <div><label style={labelStyle}>Categoría</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
              )}
              <div><label style={labelStyle}>Concepto</label><input value={form.concept} onChange={e => setForm({ ...form, concept: e.target.value })} placeholder="Descripción" style={inputStyle} /></div>
              <div><label style={labelStyle}>Fecha</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button onClick={() => { setShowModal(null); setError('') }} style={{ padding: '10px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleMovement} style={btnPrimary}>Guardar</motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
