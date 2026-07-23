import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiX, FiHome } from 'react-icons/fi'
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

export default function FixedAssetsSection() {
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [form, setForm] = useState({ name: '', category: '', acquisitionCost: '', salvageValue: '', usefulLifeYears: '', acquisitionDate: new Date().toISOString().slice(0, 10) })
  const [error, setError] = useState('')
  const [hoveredRow, setHoveredRow] = useState(null)

  const load = async () => { setItems(await service.getFixedAssets()) }
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    setError('')
    try {
      if (!form.name || !form.acquisitionCost) { setError('Nombre y costo son requeridos'); return }
      await service.createFixedAsset({ ...form, acquisitionCost: Number(form.acquisitionCost), salvageValue: Number(form.salvageValue) || 0, usefulLifeYears: Number(form.usefulLifeYears) || 5 })
      setForm({ name: '', category: '', acquisitionCost: '', salvageValue: '', usefulLifeYears: '', acquisitionDate: new Date().toISOString().slice(0, 10) })
      setShowModal(false)
      load()
    } catch (e) { setError(e.message) }
  }

  const handleDispose = async (id) => {
    if (!confirm('¿Dar de baja este activo?')) return
    await service.disposeAsset(id, { disposedDate: new Date().toISOString().slice(0, 10) })
    load()
  }

  const getDepSchedule = (asset) => {
    const monthlyDep = service.calculateMonthlyDepreciation(asset)
    const months = (asset.usefulLifeYears || 5) * 12
    const schedule = []
    const cost = asset.acquisitionCost || 0
    let accumulated = 0
    for (let i = 1; i <= Math.min(months, 12); i++) {
      accumulated += monthlyDep
      schedule.push({ month: i, monthlyDep, accumulated, bookValue: Math.max(cost - accumulated, asset.salvageValue || 0) })
    }
    return schedule
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowModal(true)} style={btnPrimary}>
          <FiPlus size={16} /> Nuevo Activo
        </motion.button>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Nombre', 'Categoría', 'Fecha', 'Costo', 'Dep. Mensual', 'Dep. Acumulada', 'Valor en Libros', 'Estado'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {items.map((a, i) => {
                const monthlyDep = service.calculateMonthlyDepreciation(a)
                const depAccum = monthlyDep * 12
                const bookValue = (a.acquisitionCost || 0) - depAccum
                const isExpanded = expandedId === a.id
                return (
                  <motion.tr key={a.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    onClick={() => setExpandedId(isExpanded ? null : a.id)}
                    onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer',
                      background: hoveredRow === i ? 'var(--bg-card)' : 'transparent', transition: 'background 0.15s' }}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--text-primary)' }}>{a.name}</td>
                    <td style={tdStyle}>{a.category || '—'}</td>
                    <td style={tdStyle}>{formatDate(a.acquisitionDate)}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{formatMoney(a.acquisitionCost)}</td>
                    <td style={tdStyle}>{formatMoney(monthlyDep)}</td>
                    <td style={{ ...tdStyle, color: '#f59e0b' }}>{formatMoney(depAccum)}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{formatMoney(bookValue)}</td>
                    <td style={tdStyle}>
                      <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: a.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)',
                        color: a.status === 'active' ? '#10b981' : '#6b7280' }}>
                        {a.status === 'active' ? 'Activo' : 'Baja'}
                      </span>
                    </td>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
            {items.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center' }}>
                <FiHome size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 12 }} />
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No hay activos fijos registrados</div>
              </td></tr>
            )}
          </tbody>
        </table>

        <AnimatePresence>
          {expandedId && items.find(a => a.id === expandedId) && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden', borderTop: '1px solid var(--border)' }}>
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: 0 }}>Calendario de Depreciación (Primeros 12 meses)</h4>
                  {items.find(a => a.id === expandedId)?.status === 'active' && (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => handleDispose(expandedId)}
                      style={{ padding: '6px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Dar de Baja
                    </motion.button>
                  )}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>
                    {['Mes', 'Dep. Mensual', 'Dep. Acumulada', 'Valor en Libros'].map(h => (
                      <th key={h} style={{ ...thStyle, fontSize: 10 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {getDepSchedule(items.find(a => a.id === expandedId)).map(s => (
                      <tr key={s.month} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={tdStyle}>{s.month}</td>
                        <td style={tdStyle}>{formatMoney(s.monthlyDep)}</td>
                        <td style={{ ...tdStyle, color: '#f59e0b' }}>{formatMoney(s.accumulated)}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{formatMoney(s.bookValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, margin: 0 }}>Nuevo Activo Fijo</h3>
              <button onClick={() => { setShowModal(false); setError('') }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={20} /></button>
            </div>
            {error && <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,0.1)', color: '#ef4444', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
            <div style={{ display: 'grid', gap: 12 }}>
              <div><label style={labelStyle}>Nombre</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Computadora Dell" style={inputStyle} /></div>
              <div><label style={labelStyle}>Categoría</label><input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Ej: Equipo de cómputo" style={inputStyle} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Costo de Adquisición</label><input type="number" min={0} step="0.01" value={form.acquisitionCost} onChange={e => setForm({ ...form, acquisitionCost: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Valor Residual</label><input type="number" min={0} step="0.01" value={form.salvageValue} onChange={e => setForm({ ...form, salvageValue: e.target.value })} style={inputStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Vida Útil (años)</label><input type="number" min={1} value={form.usefulLifeYears} onChange={e => setForm({ ...form, usefulLifeYears: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Fecha Adquisición</label><input type="date" value={form.acquisitionDate} onChange={e => setForm({ ...form, acquisitionDate: e.target.value })} style={inputStyle} /></div>
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
