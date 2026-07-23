import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiX, FiBook } from 'react-icons/fi'
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
const emptyLine = () => ({ accountId: '', debit: '', credit: '' })

export default function JournalEntriesSection() {
  const [entries, setEntries] = useState([])
  const [accounts, setAccounts] = useState([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ reference: '', description: '', date: new Date().toISOString().slice(0, 10), lines: [emptyLine(), emptyLine()] })
  const [error, setError] = useState('')
  const [hoveredRow, setHoveredRow] = useState(null)

  const load = async () => {
    const filters = {}
    if (fromDate) filters.fromDate = fromDate
    if (toDate) filters.toDate = toDate
    setEntries(await service.listJournalEntries(filters))
    setAccounts(await service.listAccounts({ active: true }))
  }

  useEffect(() => { load() }, [fromDate, toDate])

  const totalDebit = form.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0)
  const totalCredit = form.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0)
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0

  const addLine = () => setForm({ ...form, lines: [...form.lines, emptyLine()] })
  const removeLine = (i) => { if (form.lines.length > 2) setForm({ ...form, lines: form.lines.filter((_, idx) => idx !== i) }) }
  const updateLine = (i, field, value) => {
    const lines = [...form.lines]
    lines[i] = { ...lines[i], [field]: value }
    if (field === 'debit' && value) lines[i].credit = ''
    if (field === 'credit' && value) lines[i].debit = ''
    setForm({ ...form, lines })
  }

  const handleSave = async () => {
    setError('')
    try {
      await service.createJournalEntry({
        ...form,
        reference: form.reference || `AJ-${Date.now()}`,
        lines: form.lines.map(l => ({ accountId: l.accountId, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 })),
      })
      setShowModal(false)
      setForm({ reference: '', description: '', date: new Date().toISOString().slice(0, 10), lines: [emptyLine(), emptyLine()] })
      load()
    } catch (e) { setError(e.message) }
  }

  const filtered = entries.filter(e => statusFilter === 'all' || e.status === statusFilter)

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div>
            <label style={labelStyle}>Desde</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ ...inputStyle, width: 150 }} />
          </div>
          <div>
            <label style={labelStyle}>Hasta</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ ...inputStyle, width: 150 }} />
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 14 }}>
            {['all', 'posted', 'reversed'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{
                  padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: statusFilter === s ? 'var(--accent-subtle)' : 'var(--bg-card)',
                  color: statusFilter === s ? 'var(--accent)' : 'var(--text-muted)',
                }}>
                {s === 'all' ? 'Todos' : s === 'posted' ? 'Publicados' : 'Reversados'}
              </button>
            ))}
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowModal(true)} style={btnPrimary}>
          <FiPlus size={16} /> Nuevo Asiento
        </motion.button>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Ref', 'Fecha', 'Descripción', 'Total Debe', 'Total Haber', 'Estado'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {filtered.map((entry, i) => (
                <motion.tr key={entry.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)}
                  style={{ borderBottom: '1px solid var(--border)', background: hoveredRow === i ? 'var(--bg-card)' : 'transparent', transition: 'background 0.15s' }}>
                  <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--accent)' }}>{entry.reference || entry.id?.slice(0, 12)}</td>
                  <td style={tdStyle}>{formatDate(entry.date)}</td>
                  <td style={{ ...tdStyle, color: 'var(--text-primary)' }}>{entry.description || '—'}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{formatMoney(entry.totalDebit)}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{formatMoney(entry.totalCredit)}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: entry.status === 'posted' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: entry.status === 'posted' ? '#10b981' : '#ef4444',
                    }}>
                      {entry.status === 'posted' ? 'Publicado' : 'Reversado'}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center' }}>
                <FiBook size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 12 }} />
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No hay asientos contables registrados</div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 680, maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, margin: 0 }}>Nuevo Asiento Contable</h3>
              <button onClick={() => { setShowModal(false); setError('') }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={20} /></button>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,0.1)', color: '#ef4444', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Fecha</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Referencia</label>
                <input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} placeholder="Automático" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Descripción</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción del asiento" style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Líneas</span>
                <button onClick={addLine} style={{ ...btnPrimary, padding: '6px 12px', fontSize: 12 }}><FiPlus size={14} /> Línea</button>
              </div>

              {form.lines.map((line, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 32px', gap: 8, marginBottom: 8 }}>
                  <select value={line.accountId} onChange={e => updateLine(i, 'accountId', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Seleccionar cuenta...</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                  </select>
                  <input type="number" min={0} step="0.01" placeholder="Débito" value={line.debit} onChange={e => updateLine(i, 'debit', e.target.value)} style={inputStyle} />
                  <input type="number" min={0} step="0.01" placeholder="Crédito" value={line.credit} onChange={e => updateLine(i, 'credit', e.target.value)} style={inputStyle} />
                  <button onClick={() => removeLine(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiX size={16} /></button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Débito: <strong style={{ color: 'var(--text-primary)' }}>{formatMoney(totalDebit)}</strong></span>
                <span style={{ color: 'var(--text-muted)' }}>Crédito: <strong style={{ color: 'var(--text-primary)' }}>{formatMoney(totalCredit)}</strong></span>
              </div>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: balanced ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: balanced ? '#10b981' : '#ef4444',
              }}>
                {balanced ? 'Balanceado' : `Diferencia: ${formatMoney(Math.abs(totalDebit - totalCredit))}`}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => { setShowModal(false); setError('') }} style={{ padding: '10px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={!balanced}
                style={{ ...btnPrimary, opacity: balanced ? 1 : 0.5 }}>
                <FiBook size={16} /> Guardar Asiento
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
