import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiX, FiGrid } from 'react-icons/fi'
import service from '../../services/accountingService'


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

const typeColors = {
  activo: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
  pasivo: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
  patrimonio: { bg: 'rgba(168,85,247,0.1)', color: '#a855f7' },
  ingreso: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
  gasto: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
  costo: { bg: 'rgba(249,115,22,0.1)', color: '#f97316' },
}

export default function ChartOfAccountsSection() {
  const [accounts, setAccounts] = useState([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ code: '', name: '', type: 'activo', nature: 'deudora', level: 3 })
  const [error, setError] = useState('')
  const [hoveredRow, setHoveredRow] = useState(null)

  const load = async () => {
    setAccounts(await service.getChartOfAccounts(search || undefined, typeFilter || undefined))
  }
  useEffect(() => { load() }, [search, typeFilter])

  const handleCreate = async () => {
    setError('')
    try {
      if (!form.code || !form.name) { setError('Código y nombre son requeridos'); return }
      await service.createAccount({ ...form, level: Number(form.level) || 3, active: true })
      setForm({ code: '', name: '', type: 'activo', nature: 'deudora', level: 3 })
      setShowModal(false)
      load()
    } catch (e) { setError(e.message) }
  }

  const grouped = accounts.reduce((acc, a) => {
    const t = a.type || 'otros'
    if (!acc[t]) acc[t] = []
    acc[t].push(a)
    return acc
  }, {})

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por código o nombre..."
            style={{ ...inputStyle, width: 260 }} />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ ...inputStyle, width: 160, cursor: 'pointer' }}>
            <option value="">Todos los tipos</option>
            {Object.keys(typeColors).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowModal(true)} style={btnPrimary}>
          <FiPlus size={16} /> Nueva Cuenta
        </motion.button>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Código', 'Nombre', 'Tipo', 'Naturaleza', 'Nivel', 'Estado'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {Object.entries(grouped).map(([type, accts]) => {
              const tc = typeColors[type] || { bg: 'rgba(107,114,128,0.1)', color: '#6b7280' }
              return (
                <AnimatePresence key={type} mode="popLayout">
                  <tr style={{ background: tc.bg }}>
                    <td colSpan={6} style={{ padding: '10px 20px', fontWeight: 700, fontSize: 12, color: tc.color, textTransform: 'uppercase' }}>
                      {type} ({accts.length})
                    </td>
                  </tr>
                  {accts.map((a, i) => (
                    <motion.tr key={a.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      onMouseEnter={() => setHoveredRow(`${type}-${i}`)} onMouseLeave={() => setHoveredRow(null)}
                      style={{ borderBottom: '1px solid var(--border)', background: hoveredRow === `${type}-${i}` ? 'var(--bg-card)' : 'transparent', transition: 'background 0.15s' }}>
                      <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--accent)', fontFamily: 'monospace' }}>{a.code}</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--text-primary)' }}>{a.name}</td>
                      <td style={tdStyle}>
                        <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: tc.bg, color: tc.color }}>
                          {type}
                        </span>
                      </td>
                      <td style={tdStyle}>{a.nature || '—'}</td>
                      <td style={tdStyle}>{a.level || '—'}</td>
                      <td style={tdStyle}>
                        <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: a.active ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)',
                          color: a.active ? '#10b981' : '#6b7280' }}>
                          {a.active ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )
            })}
            {accounts.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center' }}>
                <FiGrid size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 12 }} />
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No se encontraron cuentas</div>
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
              <h3 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, margin: 0 }}>Nueva Cuenta</h3>
              <button onClick={() => { setShowModal(false); setError('') }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={20} /></button>
            </div>
            {error && <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,0.1)', color: '#ef4444', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <div><label style={labelStyle}>Código</label><input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="1.01.004" style={inputStyle} /></div>
                <div><label style={labelStyle}>Nombre</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre de la cuenta" style={inputStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Tipo</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {Object.keys(typeColors).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select></div>
                <div><label style={labelStyle}>Naturaleza</label>
                  <select value={form.nature} onChange={e => setForm({ ...form, nature: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="deudora">Deudora</option><option value="acreedora">Acreedora</option>
                  </select></div>
                <div><label style={labelStyle}>Nivel</label><input type="number" min={1} max={5} value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} style={inputStyle} /></div>
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
