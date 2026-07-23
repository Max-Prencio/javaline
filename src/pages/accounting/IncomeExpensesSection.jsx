import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiX, FiTrendingUp } from 'react-icons/fi'
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

export default function IncomeExpensesSection() {
  const [subTab, setSubTab] = useState('records')
  const [incomeRecords, setIncomeRecords] = useState([])
  const [costRecords, setCostRecords] = useState([])
  const [report, setReport] = useState(null)
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10))
  const [showModal, setShowModal] = useState(null)
  const [form, setForm] = useState({ description: '', amount: '', date: new Date().toISOString().slice(0, 10), type: 'costo_venta' })
  const [error, setError] = useState('')
  const [hoveredRow, setHoveredRow] = useState(null)

  const loadRecords = async () => {
    setIncomeRecords(await service.getIncomeRecords({ from: fromDate, to: toDate }))
    setCostRecords(await service.getCostRecords({ from: fromDate, to: toDate }))
  }
  const loadReport = async () => { setReport(await service.getIncomeStatementReport(fromDate, toDate)) }
  useEffect(() => { loadRecords(); loadReport() }, [fromDate, toDate])

  const allRecords = [
    ...incomeRecords.map(r => ({ ...r, _type: 'ingreso' })),
    ...costRecords.map(r => ({ ...r, _type: r.type || 'costo_venta' })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  const handleCreate = async () => {
    setError('')
    try {
      if (!form.description || !form.amount) { setError('Descripcion y monto son requeridos'); return }
      if (showModal === 'income') await service.createIncomeRecord({ ...form, amount: Number(form.amount) })
      else await service.createCostRecord({ ...form, amount: Number(form.amount) })
      setForm({ description: '', amount: '', date: new Date().toISOString().slice(0, 10), type: 'costo_venta' })
      setShowModal(null)
      loadRecords(); loadReport()
    } catch (e) { setError(e.message) }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[{ key: 'records', label: 'Registros' }, { key: 'pnl', label: 'Estado de Resultados' }].map(t => (
            <button key={t.key} onClick={() => setSubTab(t.key)} style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: subTab === t.key ? 'var(--accent-subtle)' : 'var(--bg-card)',
              color: subTab === t.key ? 'var(--accent)' : 'var(--text-muted)',
            }}>{t.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ ...inputStyle, width: 150 }} />
          <span style={{ color: 'var(--text-muted)' }}>&mdash;</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ ...inputStyle, width: 150 }} />
        </div>
      </div>

      {subTab === 'records' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowModal('income')}
              style={{ ...btnPrimary, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              <FiPlus size={16} /> Ingreso
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowModal('cost')}
              style={{ ...btnPrimary, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <FiPlus size={16} /> Costo / Gasto
            </motion.button>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {['Fecha', 'Tipo', 'Descripcion', 'Monto'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {allRecords.map((r, i) => (
                    <motion.tr key={r.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)}
                      style={{ borderBottom: '1px solid var(--border)', background: hoveredRow === i ? 'var(--bg-card)' : 'transparent', transition: 'background 0.15s' }}>
                      <td style={tdStyle}>{formatDate(r.date)}</td>
                      <td style={tdStyle}>
                        <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: r._type === 'ingreso' ? 'rgba(16,185,129,0.1)' : r._type === 'costo_venta' ? 'rgba(249,115,22,0.1)' : 'rgba(245,158,11,0.1)',
                          color: r._type === 'ingreso' ? '#10b981' : r._type === 'costo_venta' ? '#f97316' : '#f59e0b' }}>
                          {r._type === 'ingreso' ? 'Ingreso' : r._type === 'costo_venta' ? 'Costo Venta' : 'Gasto'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--text-primary)' }}>{r.description}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: r._type === 'ingreso' ? '#10b981' : '#ef4444' }}>
                        {r._type === 'ingreso' ? '+' : '-'}{formatMoney(r.amount)}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {allRecords.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: 48, textAlign: 'center' }}>
                    <FiTrendingUp size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 12 }} />
                    <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No hay registros en este periodo</div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {subTab === 'pnl' && report && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28 }}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, margin: '0 0 24px' }}>Estado de Resultados</h3>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>(+) INGRESOS</div>
            {report.income.items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', fontSize: 13, borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-primary)' }}>{item.description}</span>
                <span style={{ fontWeight: 600, color: '#10b981' }}>{formatMoney(item.amount)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', fontWeight: 700, fontSize: 14, background: 'rgba(16,185,129,0.05)', borderRadius: 8, marginTop: 4 }}>
              <span style={{ color: 'var(--text-primary)' }}>Total Ingresos</span>
              <span style={{ color: '#10b981' }}>{formatMoney(report.income.total)}</span>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f97316', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>(-) COSTO DE VENTAS</div>
            {report.costs.items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', fontSize: 13, borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-primary)' }}>{item.description}</span>
                <span style={{ fontWeight: 600, color: '#f97316' }}>{formatMoney(item.amount)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', fontWeight: 700, fontSize: 14, background: 'rgba(249,115,22,0.05)', borderRadius: 8, marginTop: 4 }}>
              <span style={{ color: 'var(--text-primary)' }}>Total Costo de Ventas</span>
              <span style={{ color: '#f97316' }}>{formatMoney(report.costs.total)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', fontWeight: 700, fontSize: 15, background: 'rgba(16,185,129,0.08)', borderRadius: 8, marginBottom: 24, border: '1px solid rgba(16,185,129,0.15)' }}>
            <span style={{ color: 'var(--text-primary)' }}>(=) UTILIDAD BRUTA</span>
            <span style={{ color: '#10b981' }}>{formatMoney(report.grossProfit)}</span>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>(-) GASTOS</div>
            {report.expenses.items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', fontSize: 13, borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-primary)' }}>{item.description}</span>
                <span style={{ fontWeight: 600, color: '#f59e0b' }}>{formatMoney(item.amount)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', fontWeight: 700, fontSize: 14, background: 'rgba(245,158,11,0.05)', borderRadius: 8, marginTop: 4 }}>
              <span style={{ color: 'var(--text-primary)' }}>Total Gastos</span>
              <span style={{ color: '#f59e0b' }}>{formatMoney(report.expenses.total)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', fontWeight: 700, fontSize: 15, background: 'rgba(99,102,241,0.08)', borderRadius: 8, marginBottom: 24, border: '1px solid rgba(99,102,241,0.15)' }}>
            <span style={{ color: 'var(--text-primary)' }}>(=) UTILIDAD OPERACIONAL</span>
            <span style={{ color: '#6366f1' }}>{formatMoney(report.operatingProfit)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '18px 16px', fontWeight: 800, fontSize: 18, background: report.netIncome >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', borderRadius: 8, border: `1px solid ${report.netIncome >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
            <span style={{ color: 'var(--text-primary)' }}>(=) RESULTADO NETO</span>
            <span style={{ color: report.netIncome >= 0 ? '#10b981' : '#ef4444' }}>{formatMoney(report.netIncome)}</span>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, margin: 0 }}>
                {showModal === 'income' ? 'Nuevo Ingreso' : 'Nuevo Costo / Gasto'}
              </h3>
              <button onClick={() => { setShowModal(null); setError('') }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={20} /></button>
            </div>
            {error && <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,0.1)', color: '#ef4444', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
            <div style={{ display: 'grid', gap: 12 }}>
              <div><label style={labelStyle}>Descripcion</label><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripcion del registro" style={inputStyle} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Monto</label><input type="number" min={0} step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Fecha</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} /></div>
              </div>
              {showModal === 'cost' && (
                <div><label style={labelStyle}>Tipo</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="costo_venta">Costo de Venta</option><option value="gasto_operativo">Gasto Operativo</option><option value="gasto_admin">Gasto Administrativo</option><option value="gasto_venta">Gasto de Venta</option>
                  </select></div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button onClick={() => { setShowModal(null); setError('') }} style={{ padding: '10px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleCreate} style={btnPrimary}>Guardar</motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
