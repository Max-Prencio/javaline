import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPercent, FiTag, FiShield, FiPlus, FiX, FiEdit2, FiTrash2, FiCheck, FiBook, FiCreditCard, FiFileText, FiDollarSign, FiHome, FiGrid, FiTrendingUp, FiPieChart, FiDroplet, FiCalendar, FiSettings } from 'react-icons/fi'
import api from '../services/apiClient'
import JournalEntriesSection from './accounting/JournalEntriesSection'
import ReceivablesSection from './accounting/ReceivablesSection'
import PayablesSection from './accounting/PayablesSection'
import DebitNotesSection from './accounting/DebitNotesSection'
import CreditNotesSection from './accounting/CreditNotesSection'
import ChecksSection from './accounting/ChecksSection'
import PettyCashSection from './accounting/PettyCashSection'
import FixedAssetsSection from './accounting/FixedAssetsSection'
import ChartOfAccountsSection from './accounting/ChartOfAccountsSection'
import IncomeExpensesSection from './accounting/IncomeExpensesSection'
import Report607Section from './accounting/Report607Section'
import CashReconciliationSection from './accounting/CashReconciliationSection'

const rowItem = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

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

const GROUPS = [
  {
    key: 'config',
    label: 'Configuración',
    icon: FiSettings,
    tabs: [
      { key: 'discounts',   label: 'Descuentos',    icon: FiPercent },
      { key: 'taxes',       label: 'Impuestos',      icon: FiTag },
      { key: 'exemptions',  label: 'Exoneraciones',  icon: FiShield },
    ],
  },
  {
    key: 'general-ledger',
    label: 'Libro Mayor',
    icon: FiBook,
    tabs: [
      { key: 'journal',        label: 'Libro Diario',        icon: FiBook },
      { key: 'chart-accounts', label: 'Catálogo de Cuentas', icon: FiGrid },
    ],
  },
  {
    key: 'receivables-payables',
    label: 'Cobros y Pagos',
    icon: FiCreditCard,
    tabs: [
      { key: 'receivables', label: 'Ctas. x Cobrar', icon: FiCreditCard },
      { key: 'payables',    label: 'Ctas. x Pagar',  icon: FiDollarSign },
      { key: 'checks',      label: 'Cheques',         icon: FiDollarSign },
      { key: 'petty-cash',  label: 'Caja Chica',      icon: FiDroplet },
      { key: 'cash-recon',  label: 'Cuadre de Caja',  icon: FiCalendar },
    ],
  },
  {
    key: 'documents',
    label: 'Documentos',
    icon: FiFileText,
    tabs: [
      { key: 'debit-notes',  label: 'Notas Débito',  icon: FiFileText },
      { key: 'credit-notes', label: 'Notas Crédito', icon: FiFileText },
    ],
  },
  {
    key: 'reports',
    label: 'Reportes',
    icon: FiTrendingUp,
    tabs: [
      { key: 'fixed-assets',    label: 'Activos Fijos',          icon: FiHome },
      { key: 'income-expenses', label: 'Ing. / Costos / Gastos', icon: FiTrendingUp },
      { key: 'report-607',      label: 'Reporte 607 DGII',       icon: FiPieChart },
    ],
  },
]

export default function Accounting() {
  const [group, setGroup] = useState('config')
  const [tab, setTab] = useState('discounts')

  const currentGroup = GROUPS.find(g => g.key === group)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: "'Inter', sans-serif", padding: '32px 40px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <FiPercent style={{ color: 'var(--accent)', fontSize: 28 }} />
          <h1 style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>Contabilidad</h1>
        </div>

        {/* Level 1 — Group bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 8 }}>
          {GROUPS.map(g => {
            const Icon = g.icon
            const active = group === g.key
            return (
              <button key={g.key} onClick={() => { setGroup(g.key); setTab(g.tabs[0].key) }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 8, padding: '18px 12px',
                  background: active ? 'var(--accent-gradient)' : 'var(--bg-card)',
                  border: active ? 'none' : '1px solid var(--border)',
                  borderRadius: 14,
                  color: active ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 600, fontSize: 12,
                  transition: 'all 0.2s',
                  boxShadow: active ? '0 4px 14px rgba(0,0,0,0.25)' : 'none',
                }}>
                <Icon size={22} />
                {g.label}
              </button>
            )
          })}
        </div>

        {/* Level 2 — Module tabs for active group */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '12px 0', marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
          {currentGroup.tabs.map(t => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px',
                  background: active ? 'rgba(var(--accent-rgb, 234,88,12), 0.12)' : 'var(--bg-elevated)',
                  border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: 8,
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}>
                <Icon size={13} />
                {t.label}
              </button>
            )
          })}
        </div>

        {tab === 'discounts' && <DiscountsTab />}
        {tab === 'taxes' && <TaxesTab />}
        {tab === 'exemptions' && <ExemptionsTab />}
        {tab === 'journal' && <JournalEntriesSection />}
        {tab === 'receivables' && <ReceivablesSection />}
        {tab === 'payables' && <PayablesSection />}
        {tab === 'debit-notes' && <DebitNotesSection />}
        {tab === 'credit-notes' && <CreditNotesSection />}
        {tab === 'checks' && <ChecksSection />}
        {tab === 'petty-cash' && <PettyCashSection />}
        {tab === 'fixed-assets' && <FixedAssetsSection />}
        {tab === 'chart-accounts' && <ChartOfAccountsSection />}
        {tab === 'income-expenses' && <IncomeExpensesSection />}
        {tab === 'report-607' && <Report607Section />}
        {tab === 'cash-recon' && <CashReconciliationSection />}
      </div>
    </div>
  )
}

function DiscountsTab() {
  const [items, setItems] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', type: 'percentage', value: '' })
  const [editForm, setEditForm] = useState({ name: '', type: 'percentage', value: '' })

  const load = async () => {
    try { setItems(await api.get('/accounting/discounts')) } catch { setItems([]) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.name || !form.value) return
    await api.post('/accounting/discounts', { ...form, value: Number(form.value) })
    setForm({ name: '', type: 'percentage', value: '' })
    load()
  }

  const handleUpdate = async (id) => {
    await api.put(`/accounting/discounts/${id}`, { ...editForm, value: Number(editForm.value) })
    setEditingId(null)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este descuento?')) return
    await api.delete(`/accounting/discounts/${id}`)
    load()
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditForm({ name: item.name, type: item.type, value: item.value })
  }

  return (
    <div>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: '0 0 16px' }}>Nuevo Descuento</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={labelStyle}>Nombre</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Descuento de temporada"
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Tipo</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="percentage">Porcentaje (%)</option>
              <option value="fixed">Monto fijo ($)</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Valor</label>
            <input type="number" min={0} step="0.01" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="0"
              style={inputStyle} />
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleCreate}
            style={btnPrimary}>
            <FiPlus size={16} /> Crear
          </motion.button>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Nombre', 'Tipo', 'Valor', 'Acciones'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {items.map(item => (
                <motion.tr key={item.id} variants={rowItem} layout exit={{ opacity: 0, y: -8 }}
                  style={{ borderBottom: '1px solid var(--border-light)' }}>
                  {editingId === item.id ? (
                    <>
                      <td style={tdStyle}>
                        <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                          style={{ ...inputStyle, width: '100%' }} />
                      </td>
                      <td style={tdStyle}>
                        <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                          style={{ ...inputStyle, cursor: 'pointer' }}>
                          <option value="percentage">Porcentaje (%)</option>
                          <option value="fixed">Monto fijo ($)</option>
                        </select>
                      </td>
                      <td style={tdStyle}>
                        <input type="number" min={0} step="0.01" value={editForm.value} onChange={e => setEditForm({ ...editForm, value: e.target.value })}
                          style={inputStyle} />
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleUpdate(item.id)}
                            style={{ padding: '6px 10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, color: '#10b981', cursor: 'pointer' }}>
                            <FiCheck size={14} />
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setEditingId(null)}
                            style={{ padding: '6px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <FiX size={14} />
                          </motion.button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ ...tdStyle, color: 'var(--text-primary)', fontWeight: 600 }}>{item.name}</td>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: item.type === 'percentage' ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)',
                          color: item.type === 'percentage' ? '#6366f1' : '#10b981',
                        }}>
                          {item.type === 'percentage' ? 'Porcentaje' : 'Fijo'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--text-primary)', fontWeight: 600 }}>
                        {item.type === 'percentage' ? `${item.value}%` : `$${Number(item.value).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => startEdit(item)}
                            style={{ padding: '6px 10px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, color: '#6366f1', cursor: 'pointer' }}>
                            <FiEdit2 size={14} />
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleDelete(item.id)}
                            style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#ef4444', cursor: 'pointer' }}>
                            <FiTrash2 size={14} />
                          </motion.button>
                        </div>
                      </td>
                    </>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
            {items.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No hay descuentos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TaxesTab() {
  const [items, setItems] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', rate: '', type: 'ITBIS' })
  const [editForm, setEditForm] = useState({ name: '', rate: '', type: 'ITBIS' })

  const load = async () => {
    try { setItems(await api.get('/accounting/taxes')) } catch { setItems([]) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.name || !form.rate) return
    await api.post('/accounting/taxes', { ...form, rate: Number(form.rate) })
    setForm({ name: '', rate: '', type: 'ITBIS' })
    load()
  }

  const handleUpdate = async (id) => {
    await api.put(`/accounting/taxes/${id}`, { ...editForm, rate: Number(editForm.rate) })
    setEditingId(null)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este impuesto?')) return
    await api.delete(`/accounting/taxes/${id}`)
    load()
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditForm({ name: item.name, rate: item.rate, type: item.type })
  }

  return (
    <div>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: '0 0 16px' }}>Nuevo Impuesto</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={labelStyle}>Nombre</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="ITBIS General"
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Tasa (%)</label>
            <input type="number" min={0} step="0.01" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} placeholder="18"
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Tipo</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="ITBIS">ITBIS</option>
              <option value="ISC">ISC</option>
              <option value="Exento">Exento</option>
            </select>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleCreate}
            style={btnPrimary}>
            <FiPlus size={16} /> Crear
          </motion.button>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Nombre', 'Tipo', 'Tasa', 'Acciones'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {items.map(item => (
                <motion.tr key={item.id} variants={rowItem} layout exit={{ opacity: 0, y: -8 }}
                  style={{ borderBottom: '1px solid var(--border-light)' }}>
                  {editingId === item.id ? (
                    <>
                      <td style={tdStyle}>
                        <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                          style={{ ...inputStyle, width: '100%' }} />
                      </td>
                      <td style={tdStyle}>
                        <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                          style={{ ...inputStyle, cursor: 'pointer' }}>
                          <option value="ITBIS">ITBIS</option>
                          <option value="ISC">ISC</option>
                          <option value="Exento">Exento</option>
                        </select>
                      </td>
                      <td style={tdStyle}>
                        <input type="number" min={0} step="0.01" value={editForm.rate} onChange={e => setEditForm({ ...editForm, rate: e.target.value })}
                          style={inputStyle} />
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleUpdate(item.id)}
                            style={{ padding: '6px 10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, color: '#10b981', cursor: 'pointer' }}>
                            <FiCheck size={14} />
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setEditingId(null)}
                            style={{ padding: '6px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <FiX size={14} />
                          </motion.button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ ...tdStyle, color: 'var(--text-primary)', fontWeight: 600 }}>{item.name}</td>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: item.type === 'ITBIS' ? 'rgba(245,158,11,0.1)' : item.type === 'ISC' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                          color: item.type === 'ITBIS' ? '#f59e0b' : item.type === 'ISC' ? '#ef4444' : '#10b981',
                        }}>
                          {item.type}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--text-primary)', fontWeight: 600 }}>{item.rate}%</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => startEdit(item)}
                            style={{ padding: '6px 10px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, color: '#6366f1', cursor: 'pointer' }}>
                            <FiEdit2 size={14} />
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleDelete(item.id)}
                            style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#ef4444', cursor: 'pointer' }}>
                            <FiTrash2 size={14} />
                          </motion.button>
                        </div>
                      </td>
                    </>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
            {items.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No hay impuestos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ExemptionsTab() {
  const [items, setItems] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', applies_to: '' })
  const [editForm, setEditForm] = useState({ name: '', description: '', applies_to: '' })

  const load = async () => {
    try { setItems(await api.get('/accounting/exemptions')) } catch { setItems([]) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.name) return
    await api.post('/accounting/exemptions', form)
    setForm({ name: '', description: '', applies_to: '' })
    load()
  }

  const handleUpdate = async (id) => {
    await api.put(`/accounting/exemptions/${id}`, editForm)
    setEditingId(null)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta exoneración?')) return
    await api.delete(`/accounting/exemptions/${id}`)
    load()
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditForm({ name: item.name, description: item.description || '', applies_to: item.applies_to || item.appliesTo || '' })
  }

  return (
    <div>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: '0 0 16px' }}>Nueva Exoneración</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={labelStyle}>Nombre</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Exención médica"
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Descripción</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Aplica a productos médicos"
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Aplica a</label>
            <input value={form.applies_to} onChange={e => setForm({ ...form, applies_to: e.target.value })} placeholder="Productos médicos"
              style={inputStyle} />
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleCreate}
            style={btnPrimary}>
            <FiPlus size={16} /> Crear
          </motion.button>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Nombre', 'Descripción', 'Aplica a', 'Acciones'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {items.map(item => (
                <motion.tr key={item.id} variants={rowItem} layout exit={{ opacity: 0, y: -8 }}
                  style={{ borderBottom: '1px solid var(--border-light)' }}>
                  {editingId === item.id ? (
                    <>
                      <td style={tdStyle}>
                        <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                          style={{ ...inputStyle, width: '100%' }} />
                      </td>
                      <td style={tdStyle}>
                        <input value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                          style={{ ...inputStyle, width: '100%' }} />
                      </td>
                      <td style={tdStyle}>
                        <input value={editForm.applies_to} onChange={e => setEditForm({ ...editForm, applies_to: e.target.value })}
                          style={{ ...inputStyle, width: '100%' }} />
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleUpdate(item.id)}
                            style={{ padding: '6px 10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, color: '#10b981', cursor: 'pointer' }}>
                            <FiCheck size={14} />
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setEditingId(null)}
                            style={{ padding: '6px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <FiX size={14} />
                          </motion.button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ ...tdStyle, color: 'var(--text-primary)', fontWeight: 600 }}>{item.name}</td>
                      <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{item.description || '—'}</td>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: 'rgba(139,92,246,0.1)', color: '#8b5cf6',
                        }}>
                          {item.applies_to || item.appliesTo || 'General'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => startEdit(item)}
                            style={{ padding: '6px 10px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, color: '#6366f1', cursor: 'pointer' }}>
                            <FiEdit2 size={14} />
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleDelete(item.id)}
                            style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#ef4444', cursor: 'pointer' }}>
                            <FiTrash2 size={14} />
                          </motion.button>
                        </div>
                      </td>
                    </>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
            {items.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No hay exoneraciones registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
