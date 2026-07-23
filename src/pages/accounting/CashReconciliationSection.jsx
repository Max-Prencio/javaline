import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiCalendar } from 'react-icons/fi'
import service from '../../services/accountingService'
import db from '../../services/db'
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

export default function CashReconciliationSection() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [registers, setRegisters] = useState([])
  const [selectedRegister, setSelectedRegister] = useState('')
  const [theory, setTheory] = useState(null)
  const [counted, setCounted] = useState('')
  const [concept, setConcept] = useState('')
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [hoveredRow, setHoveredRow] = useState(null)

  useEffect(() => {
    const regs = db.getAll('cashRegisters') ?? []
    setRegisters(regs)
    if (regs.length > 0 && !selectedRegister) setSelectedRegister(regs[0].id)
  }, [])

  const loadTheory = async () => {
    if (!selectedRegister) return
    const result = await service.getCashReconciliation(date, selectedRegister)
    if (result) {
      setTheory(result)
    } else {
      const movements = (db.getAll('pettyCash') ?? [])
      const inflows = movements.filter(m => m.type === 'reposicion').reduce((s, m) => s + (m.amount || 0), 0)
      const outflows = movements.filter(m => m.type === 'egreso').reduce((s, m) => s + (m.amount || 0), 0)
      setTheory({ saldoInicial: 5000, totalIngresos: inflows, totalEgresos: outflows, saldoTeorico: 5000 + inflows - outflows })
    }
    setSaved(false)
  }

  useEffect(() => { loadTheory() }, [date, selectedRegister])

  const loadHistory = async () => {
    setHistory(db.getAll('cashReconciliations') ?? [])
  }
  useEffect(() => { loadHistory() }, [saved])

  const handleSave = async () => {
    setError('')
    try {
      const countedNum = Number(counted)
      if (!countedNum && countedNum !== 0) { setError('Ingrese el efectivo contado'); return }
      const data = {
        date, registerId: selectedRegister, concept,
        saldoInicial: theory?.saldoInicial || 0,
        totalIngresos: theory?.totalIngresos || 0,
        totalEgresos: theory?.totalEgresos || 0,
        saldoTeorico: theory?.saldoTeorico || 0,
        efectivoContado: countedNum,
        diferencia: countedNum - (theory?.saldoTeorico || 0),
      }
      await service.saveCashReconciliation(data)
      setSaved(true)
      setCounted('')
      setConcept('')
      loadHistory()
    } catch (e) { setError(e.message) }
  }

  const diferencia = theory ? Number(counted || 0) - theory.saldoTeorico : 0
  const isBalanced = Math.abs(diferencia) < 0.01

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', gap: 20, marginBottom: 24, alignItems: 'flex-end' }}>
        <div>
          <label style={labelStyle}>Fecha</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, width: 170 }} />
        </div>
        <div>
          <label style={labelStyle}>Caja Registradora</label>
          <select value={selectedRegister} onChange={e => setSelectedRegister(e.target.value)} style={{ ...inputStyle, width: 200, cursor: 'pointer' }}>
            {registers.map(r => <option key={r.id} value={r.id}>{r.name || r.id}</option>)}
            {registers.length === 0 && <option value="default">Caja General</option>}
          </select>
        </div>
      </div>

      {error && <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,0.1)', color: '#ef4444', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
      {saved && <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>Cuadre guardado exitosamente</div>}

      {theory && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, margin: '0 0 20px' }}>Cuadre de Caja</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ textAlign: 'center', padding: 16, background: 'var(--bg-primary)', borderRadius: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Saldo Inicial</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{formatMoney(theory.saldoInicial)}</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: 'rgba(16,185,129,0.05)', borderRadius: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Total Ingresos</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>+{formatMoney(theory.totalIngresos)}</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: 'rgba(239,68,68,0.05)', borderRadius: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Total Egresos</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>-{formatMoney(theory.totalEgresos)}</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: 'rgba(99,102,241,0.05)', borderRadius: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Saldo Teorico</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#6366f1' }}>{formatMoney(theory.saldoTeorico)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Efectivo Contado</label>
              <input type="number" min={0} step="0.01" value={counted} onChange={e => setCounted(e.target.value)} placeholder="0.00" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Concepto / Observaciones</label>
              <input value={concept} onChange={e => setConcept(e.target.value)} placeholder="Cuadre periodico" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderRadius: 10, marginBottom: 16,
            background: isBalanced ? 'rgba(16,185,129,0.08)' : counted ? 'rgba(239,68,68,0.08)' : 'var(--bg-primary)',
            border: `1px solid ${isBalanced ? 'rgba(16,185,129,0.2)' : counted ? 'rgba(239,68,68,0.2)' : 'var(--border)'}` }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Diferencia</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: isBalanced ? '#10b981' : counted ? '#ef4444' : 'var(--text-muted)' }}>
              {counted ? formatMoney(diferencia) : '---'}
            </span>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleSave} style={btnPrimary}>
            Guardar Cuadre
          </motion.button>
        </div>
      )}

      {history.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
            Historial de Cuadres
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {['Fecha', 'Saldo Teorico', 'Efectivo Contado', 'Diferencia', 'Concepto'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {history.slice().reverse().map((h, i) => (
                <motion.tr key={h.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)}
                  style={{ borderBottom: '1px solid var(--border)', background: hoveredRow === i ? 'var(--bg-card)' : 'transparent', transition: 'background 0.15s' }}>
                  <td style={tdStyle}>{formatDate(h.date)}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{formatMoney(h.saldoTeorico)}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{formatMoney(h.efectivoContado)}</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: Math.abs(h.diferencia || 0) < 0.01 ? '#10b981' : '#ef4444' }}>
                    {formatMoney(h.diferencia)}
                  </td>
                  <td style={tdStyle}>{h.concept || '—'}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {history.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
          <FiCalendar size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div>No hay cuadres de caja registrados</div>
        </div>
      )}
    </motion.div>
  )
}
