import { useState } from 'react'
import { FiDollarSign } from 'react-icons/fi'
import { formatMoney } from '../../utils/format'
import { maskSalary } from '../../utils/mask'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

const DEDUCTION_TYPES = ['ISR', 'AFP', 'ARS', 'Cooperativa', 'Préstamo', 'Otro']

function SalaryField({ salary, salaryType }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <FiDollarSign size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <span style={{ fontFamily: revealed ? 'inherit' : 'monospace', letterSpacing: revealed ? 'normal' : 1 }}>
        {revealed ? `$${formatMoney(salary, { minimumFractionDigits: 0 })}` : maskSalary(salary)}
      </span>
      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>/ {salaryType || 'mensual'}</span>
      <button onClick={() => setRevealed(r => !r)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--accent)', fontSize: 11, opacity: 0.7 }}
        title={revealed ? 'Ocultar' : 'Revelar salario'}>
        {revealed ? '🙈' : '👁️'}
      </button>
    </div>
  )
}

function calcISR(salary) {
  if (!salary || salary <= 0) return 0
  const annual = salary * 12
  if (annual <= 416220) return 0
  let tax = 0
  if (annual <= 624329) { tax = (annual - 416220) * 0.15 }
  else if (annual <= 867123) { tax = 31216.35 + (annual - 624329) * 0.20 }
  else { tax = 79775.25 + (annual - 867123) * 0.25 }
  return Math.round(tax / 12)
}

function calcAFP(salary) { return salary ? Math.round(salary * 0.0287) : 0 }
function calcARS(salary) { return salary ? Math.round(salary * 0.0304) : 0 }

const cardStyle = {
  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px',
}

const inputStyle = {
  width: '100%', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
}

const labelStyle = {
  fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: '0.5px', display: 'block', marginBottom: 6,
}

const btnPrimary = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 20px',
  background: 'var(--accent-gradient)', border: 'none', borderRadius: 8, color: '#fff',
  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
}

const btnOutline = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 16px',
  background: 'transparent', border: '1px solid var(--border)', borderRadius: 8,
  color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
}

const btnDanger = {
  ...btnOutline, color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)',
}

const thStyle = {
  textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid var(--border)',
  background: 'var(--bg-card)',
}

const tdStyle = {
  padding: '12px 16px', fontSize: 13, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-light)',
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 0', color: 'var(--text-muted)' }}>
      <Icon size={32} style={{ opacity: 0.3 }} />
      <p style={{ fontSize: 13, margin: 0 }}>{text}</p>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

export {
  container, item, DEDUCTION_TYPES, SalaryField, calcISR, calcAFP, calcARS,
  cardStyle, inputStyle, labelStyle, btnPrimary, btnOutline, btnDanger,
  thStyle, tdStyle, EmptyState, FormField,
}
