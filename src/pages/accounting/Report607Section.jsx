import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiPieChart } from 'react-icons/fi'
import service from '../../services/accountingService'
import { formatMoney } from '../../utils/format'

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

export default function Report607Section() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'))
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  const period = `${year}${month}`

  const load = async () => {
    setLoading(true)
    setRows(await service.generate607(period))
    setLoading(false)
  }
  useEffect(() => { load() }, [period])

  const totalMonto = rows.reduce((s, r) => s + Number(r.montoFacturado || 0), 0)
  const totalItbis = rows.reduce((s, r) => s + Number(r.itbisFacturado || 0), 0)

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <label style={labelStyle}>Mes</label>
            <select value={month} onChange={e => setMonth(e.target.value)} style={{ ...inputStyle, width: 160, cursor: 'pointer' }}>
              {Array.from({ length: 12 }, (_, i) => {
                const m = String(i + 1).padStart(2, '0')
                const names = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
                return <option key={m} value={m}>{names[i]}</option>
              })}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Ano</label>
            <input type="number" min={2020} max={2030} value={year} onChange={e => setYear(Number(e.target.value))} style={{ ...inputStyle, width: 100 }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => service.export607CSV(period)}
            style={{ ...btnPrimary, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            Exportar TXT (DGII)
          </motion.button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Total Facturado</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{formatMoney(totalMonto)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Total ITBIS</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b' }}>{formatMoney(totalItbis)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Registros</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{rows.length}</div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['RNC', 'Tipo ID', 'NCF', 'Fecha', 'Monto', 'ITBIS', 'Efectivo'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <motion.tr key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={tdStyle}>{r.rnc || '—'}</td>
                <td style={tdStyle}>{r.tipoIdentificacion}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--accent)' }}>{r.ncf || '—'}</td>
                <td style={tdStyle}>{r.fechaNcf}</td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{formatMoney(Number(r.montoFacturado))}</td>
                <td style={{ ...tdStyle, color: '#f59e0b' }}>{formatMoney(Number(r.itbisFacturado))}</td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{formatMoney(Number(r.efectivo))}</td>
              </motion.tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center' }}>
                <FiPieChart size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 12 }} />
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  {loading ? 'Cargando...' : 'No hay facturas con NCF para este periodo'}
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
