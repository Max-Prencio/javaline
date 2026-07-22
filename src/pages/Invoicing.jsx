import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiFileText, FiPlus, FiX, FiDollarSign, FiCalendar, FiUsers, FiSearch, FiCheck, FiAlertTriangle, FiRefreshCw, FiPrinter, FiPercent } from 'react-icons/fi'
import { invoiceService, productService, contactService } from '../services/entityService'
import db from '../services/db'
import { buildInvoiceHtml } from '../utils/print'
import PrintPreviewModal from '../components/PrintPreviewModal'
import { maskRNC } from '../utils/mask'

const statusStyles = {
  paid: { bg: 'var(--success)', color: '#fff', label: 'Pagada' },
  pending: { bg: 'var(--warning)', color: '#fff', label: 'Pendiente' },
  overdue: { bg: 'var(--danger)', color: '#fff', label: 'Vencida' },
  rejected: { bg: '#6b5a4a', color: '#fff', label: 'Rechazada' },
  rectified: { bg: '#8b5cf6', color: '#fff', label: 'Rectificada' },
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const rowItem = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

function formatMoney(n) { return (n || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }

function MaskedRNC({ value }) {
  const [revealed, setRevealed] = useState(false)
  if (!value) return <p style={{ margin: '4px 0', color: 'var(--text-muted)', fontSize: 14 }}>N/A</p>
  return (
    <p style={{ margin: '4px 0', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: 'var(--text-primary)', fontFamily: revealed ? 'inherit' : 'monospace' }}>
        {revealed ? value : maskRNC(value)}
      </span>
      <button onClick={() => setRevealed(r => !r)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--accent)', fontSize: 11, opacity: 0.7 }}
        title={revealed ? 'Ocultar' : 'Revelar RNC'}>
        {revealed ? '🙈' : '👁️'}
      </button>
    </p>
  )
}

function calcDiscount(subtotal, discount, discountType) {
  if (!discount || discount <= 0) return 0
  return discountType === 'percentage' ? subtotal * (Math.min(discount, 100) / 100) : discount
}

function calcTax(taxableBase, taxRate) {
  return taxableBase * (taxRate?.rate || 0)
}

function recalc(items, discount, discountType, taxRate) {
  const subtotal = items.reduce((s, i) => s + i.total, 0)
  const discountAmount = calcDiscount(subtotal, discount, discountType)
  const taxableBase = Math.max(0, subtotal - discountAmount)
  const tax = calcTax(taxableBase, taxRate)
  return { subtotal, discountAmount, taxableBase, tax, total: taxableBase + tax }
}

export default function Invoicing() {
  const [invoices, setInvoices] = useState([])
  const [products, setProducts] = useState([])
  const [contacts, setContacts] = useState([])
  const [cashRegister, setCashRegister] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailModal, setDetailModal] = useState(null)
  const [paymentModal, setPaymentModal] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currencies, setCurrencies] = useState([])
  const [taxRates, setTaxRates] = useState([])
  const [printPreview, setPrintPreview] = useState({ show: false, html: '', title: '' })

  const loadData = useCallback(async () => {
    const invs = await invoiceService.list()
    setInvoices(invs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    setProducts(await productService.list())
    setContacts(await contactService.list())
    setCurrencies(db.getAll('currencies'))
    setTaxRates(db.getAll('taxRates'))
    const userId = JSON.parse(localStorage.getItem('javaline_session') || '{}').userId
    if (userId) {
      const { default: cashRegisterService } = await import('../services/cashRegisterService')
      setCashRegister(await cashRegisterService.getOpen(userId))
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleReconcile = async (invId) => {
    if (!cashRegister) { alert('Debes abrir la caja primero'); return }
    const inv = invoices.find(i => i.id === invId)
    if (!inv) return
    setPaymentModal(inv)
  }

  const confirmPayment = async (invId, amountReceived, changeReturned) => {
    const userId = JSON.parse(localStorage.getItem('javaline_session') || '{}').userId
    await invoiceService.update(invId, { status: 'paid', amountReceived, changeReturned }, userId)
    const inv = invoices.find(i => i.id === invId)
    const { default: cashRegisterService } = await import('../services/cashRegisterService')
    await cashRegisterService.addTransaction(cashRegister.id, {
      type: 'income', concept: `Factura ${invId}`, amount: amountReceived - changeReturned,
      paymentMethod: inv?.paymentMethod || 'transfer', reference: invId,
    }, userId)
    db.addAudit({ action: 'reconcile', store: 'invoices', detail: `Pago registrado: ${invId} — Recibido: $${formatMoney(amountReceived)}, Cambio: $${formatMoney(changeReturned)}`, userId })
    setPaymentModal(null)
    loadData()
  }

  const handleCancelReconciliation = async (invId) => {
    const userId = JSON.parse(localStorage.getItem('javaline_session') || '{}').userId
    const inv = invoices.find(i => i.id === invId)
    await invoiceService.update(invId, { status: 'rejected' }, userId)
    if (cashRegister && inv) {
      const { default: cashRegisterService } = await import('../services/cashRegisterService')
      const txn = (cashRegister.transactions || []).find(t => t.reference === invId)
      if (txn) await cashRegisterService.removeTransaction(cashRegister.id, txn.id, userId)
    }
    db.addAudit({ action: 'cancel_reconcile', store: 'invoices', detail: `Conciliación cancelada: ${invId}`, userId })
    loadData()
  }

  const handleRectify = async (invId) => {
    const userId = JSON.parse(localStorage.getItem('javaline_session') || '{}').userId
    const original = invoices.find(i => i.id === invId)
    await invoiceService.update(invId, { status: 'rectified', rectifiedBy: 'pending' }, userId)
    const rectified = await invoiceService.create({
      ...original, id: undefined, createdAt: undefined, updatedAt: undefined,
      status: 'pending', date: new Date().toISOString().slice(0, 10), rectifiesId: invId,
      clientName: `${original.clientName} (Rectificación)`,
    }, userId)
    db.addAudit({ action: 'rectify', store: 'invoices', detail: `Factura rectificada: ${invId} → ${rectified.id}`, userId })
    loadData()
  }

  const handlePrint = async (inv) => {
    const html = await buildInvoiceHtml(inv, formatMoney)
    setPrintPreview({ show: true, html, title: `Factura ${inv.id}`, reportType: inv.type === 'supplier' ? 'supplier_invoice' : 'customer_invoice' })
  }

  const filtered = invoices.filter(inv =>
    (inv.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (inv.id || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const total = invoices.reduce((s, i) => s + (i.total || 0), 0)
  const paid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0)
  const pending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + (i.total || 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: "'Inter', sans-serif", padding: '32px 40px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FiFileText style={{ color: 'var(--accent)', fontSize: 28 }} />
              <h1 style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>Facturación</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '6px 0 0 40px' }}>Gestiona las facturas de tu empresa</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: cashRegister ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${cashRegister ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: cashRegister ? '#10b981' : '#ef4444' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: cashRegister ? '#10b981' : '#ef4444' }}>
                {cashRegister ? `Caja ${cashRegister.id} — RD$${formatMoney(cashRegister.currentBalance)}` : 'Caja cerrada'}
              </span>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: cashRegister ? 'var(--accent-gradient)' : '#6b5a4a', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: cashRegister ? 'pointer' : 'not-allowed' }}>
              <FiPlus size={18} /> Nueva Factura
            </motion.button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total facturado', value: total, color: 'var(--accent)' },
            { label: 'Pagadas', value: paid, color: 'var(--success)' },
            { label: 'Pendientes', value: pending, color: 'var(--warning)' },
            { label: 'Facturas', value: invoices.length, color: 'var(--text-primary)' },
          ].map(item => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '20px 24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</span>
              <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: item.color }}>${formatMoney(item.value)}</span>
            </motion.div>
          ))}
        </div>

        <div style={{ position: 'relative', marginBottom: 16 }}>
          <FiSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 18, pointerEvents: 'none' }} />
          <input placeholder="Buscar por cliente o ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '13px 14px 13px 44px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'auto' }}>
          <motion.table style={{ width: '100%', borderCollapse: 'collapse' }} variants={container} initial="hidden" animate="show">
            <thead>
              <tr>
                {['ID', 'Cliente', 'Tipo', 'Moneda', 'Total', 'Estado', 'Pago', 'Acciones'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '14px 20px', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filtered.map(inv => {
                  const st = statusStyles[inv.status] || statusStyles.pending
                  return (
                    <motion.tr key={inv.id} variants={rowItem} layout exit={{ opacity: 0, y: -8 }}
                      style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.15s' }}>
                      <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>{inv.id}</td>
                      <td style={{ padding: '14px 20px', color: 'var(--text-primary)', fontSize: 14 }}>
                        <FiUsers size={14} style={{ marginRight: 8, color: 'var(--text-muted)' }} />
                        {inv.clientName}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 13 }}>
                        <span style={{ color: inv.type === 'supplier' ? '#f97316' : 'var(--accent)' }}>{inv.type === 'supplier' ? 'Proveedor' : 'Cliente'}</span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>{inv.currency || 'DOP'}</td>
                      <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>${formatMoney(inv.total)}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ display: 'inline-flex', padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, letterSpacing: '0.3px', background: st.bg, color: st.color }}>{st.label}</span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 12, color: 'var(--text-secondary)' }}>
                        {inv.status === 'paid' && inv.amountReceived > 0 ? (
                          <div>
                            <span style={{ color: '#10b981', fontWeight: 600 }}>${formatMoney(inv.amountReceived)}</span>
                            {inv.changeReturned > 0 && <span style={{ display: 'block', fontSize: 11, color: '#f59e0b' }}>Cambio: ${formatMoney(inv.changeReturned)}</span>}
                          </div>
                        ) : inv.paymentType === 'credit' ? `${inv.installmentPlan?.totalInstallments || 0} cuotas` : inv.paymentMethod || 'N/A'}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setDetailModal(inv)}
                            style={{ padding: '6px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }} title="Ver detalle">
                            <FiFileText size={14} />
                          </motion.button>
                          {inv.status === 'pending' && (
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleReconcile(inv.id)}
                              style={{ padding: '6px 10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, color: '#10b981', fontSize: 12, cursor: 'pointer' }} title="Conciliar pago">
                              <FiCheck size={14} />
                            </motion.button>
                          )}
                          {inv.status === 'paid' && (
                            <>
                              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleCancelReconciliation(inv.id)}
                                style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#ef4444', fontSize: 12, cursor: 'pointer' }} title="Cancelar conciliación">
                                <FiAlertTriangle size={14} />
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleRectify(inv.id)}
                                style={{ padding: '6px 10px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, color: '#8b5cf6', fontSize: 12, cursor: 'pointer' }} title="Rectificar">
                                <FiRefreshCw size={14} />
                              </motion.button>
                            </>
                          )}
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handlePrint(inv)}
                            style={{ padding: '6px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }} title="Imprimir">
                            <FiPrinter size={14} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </motion.table>
        </div>
      </div>

      <CreateInvoiceModal open={modalOpen} onClose={() => setModalOpen(false)} onDone={loadData} products={products} contacts={contacts} currencies={currencies} cashRegister={cashRegister} taxRates={taxRates} />

      <DetailModal inv={detailModal} onClose={() => setDetailModal(null)} taxRates={taxRates} />

      <PaymentModal inv={paymentModal} onClose={() => setPaymentModal(null)} onConfirm={confirmPayment} formatMoney={formatMoney} />

      <PrintPreviewModal show={printPreview.show} onClose={() => setPrintPreview({ show: false, html: '', title: '' })} html={printPreview.html} title={printPreview.title} reportType={printPreview.reportType} />
    </div>
  )
}

function canInvoiceSupplier() {
  const user = JSON.parse(localStorage.getItem('javaline_session') || '{}')
  if (!user.id) return false
  if (user.role === 'admin') return true
  if (user.permissions?.includes('factura_proveedor') || user.permissions?.includes('todos')) return true
  const roles = db.getAll('roles')
  const userRole = roles.find(r => r.name === user.role)
  return userRole?.modules?.includes('Contabilidad') || userRole?.modules?.includes('Todos') || false
}

function CreateInvoiceModal({ open, onClose, onDone, products, contacts, currencies, cashRegister, taxRates }) {
  const [step, setStep] = useState(1)
  const [validationError, setValidationError] = useState('')
  const defaultTaxRate = taxRates.find(t => t.id === 'TAX-001') || taxRates[0] || { id: 'TAX-001', name: 'ITBIS General', rate: 0.18 }
  const [form, setForm] = useState({
    type: 'client', clientId: '', clientName: '', clientType: 'company', rnc: '',
    date: new Date().toISOString().slice(0, 10), dueDate: '',
    currency: 'DOP', paymentType: 'debit', paymentMethod: 'transfer',
    items: [], subtotal: 0, discount: 0, discountType: 'percentage', discountAmount: 0,
    taxableBase: 0, taxRateId: defaultTaxRate.id, tax: 0, total: 0, notes: '',
    installmentPlan: null,
  })
  const [selectedProduct, setSelectedProduct] = useState('')
  const [productQty, setProductQty] = useState(1)

  const reset = () => {
    setStep(1)
    setValidationError('')
    setForm({
      type: 'client', clientId: '', clientName: '', clientType: 'company', rnc: '',
      date: new Date().toISOString().slice(0, 10), dueDate: '',
      currency: 'DOP', paymentType: 'debit', paymentMethod: 'transfer',
      items: [], subtotal: 0, discount: 0, discountType: 'percentage', discountAmount: 0,
      taxableBase: 0, taxRateId: defaultTaxRate.id, tax: 0, total: 0, notes: '',
      installmentPlan: null,
    })
    setSelectedProduct('')
    setProductQty(1)
  }

  const getTaxRate = (id) => taxRates.find(t => t.id === (id || form.taxRateId)) || defaultTaxRate

  const updateTotals = (items, discount, discountType, taxRateId) => {
    const subtotal = items.reduce((s, i) => s + i.total, 0)
    const discountAmount = calcDiscount(subtotal, discount, discountType)
    const taxableBase = Math.max(0, subtotal - discountAmount)
    const taxRate = getTaxRate(taxRateId)
    const tax = calcTax(taxableBase, taxRate)
    return { subtotal, discountAmount, taxableBase, tax, total: taxableBase + tax }
  }

  const addProduct = () => {
    if (!selectedProduct) { alert('Selecciona un producto'); return }
    const p = products.find(pr => String(pr.id) === String(selectedProduct))
    if (!p) { alert('Producto no encontrado'); return }
    const qty = productQty
    const price = Number(p.price) || 0
    const total = price * qty
    setForm(prev => {
      const items = [...prev.items, { productId: p.id, productName: p.name, qty, price, total }]
      const totals = updateTotals(items, prev.discount, prev.discountType, prev.taxRateId)
      return { ...prev, items, ...totals }
    })
    setSelectedProduct('')
    setProductQty(1)
  }

  const removeItem = (idx) => {
    setForm(prev => {
      const items = prev.items.filter((_, i) => i !== idx)
      const totals = updateTotals(items, prev.discount, prev.discountType, prev.taxRateId)
      return { ...prev, items, ...totals }
    })
  }

  const handleDiscountChange = (val, type) => {
    const discount = Math.max(0, Number(val) || 0)
    setForm(prev => {
      const totals = updateTotals(prev.items, discount, type || prev.discountType, prev.taxRateId)
      return { ...prev, discount, discountType: type || prev.discountType, ...totals }
    })
  }

  const handleTaxRateChange = (taxRateId) => {
    setForm(prev => {
      const totals = updateTotals(prev.items, prev.discount, prev.discountType, taxRateId)
      return { ...prev, taxRateId, ...totals }
    })
  }

  const handleCreate = async () => {
    if (form.items.length === 0) { alert('Agrega al menos un producto'); return }
    if (!form.clientName.trim()) { alert('Selecciona un cliente'); return }
    if (form.type === 'client' && !cashRegister) { alert('No puedes facturar a clientes con la caja cerrada. Abre la caja primero.'); return }
    if (form.type === 'supplier' && !canInvoiceSupplier()) { alert('No tienes permiso para crear facturas a proveedores. Solicita acceso al módulo de Contabilidad.'); return }
    if (form.paymentType === 'credit') {
      const totalInstallments = parseInt(prompt('Número de cuotas:', '3')) || 3
      const amountPerInstallment = form.total / totalInstallments
      const installments = Array.from({ length: totalInstallments }, (_, i) => ({
        number: i + 1, dueDate: new Date(new Date(form.date).setMonth(new Date(form.date).getMonth() + i + 1)).toISOString().slice(0, 10),
        amount: amountPerInstallment, paid: false,
      }))
      form.installmentPlan = { totalInstallments, amountPerInstallment, frequency: 'monthly', startDate: installments[0].dueDate, installments }
    }
    const userId = JSON.parse(localStorage.getItem('javaline_session') || '{}').userId
    await invoiceService.create({ ...form, status: 'pending', cashRegisterId: cashRegister?.id || null }, userId)
    db.addAudit({ action: 'create_invoice', store: 'invoices', detail: `Factura creada: ${form.clientName} — $${formatMoney(form.total)}`, userId })
    reset()
    onClose()
    onDone()
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={() => { reset(); onClose() }}>
        <motion.div key="modal" initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={e => e.stopPropagation()}
          style={{ width: 640, maxHeight: '90vh', overflow: 'auto', padding: '32px 36px 36px', background: 'var(--bg-card)', backdropFilter: 'blur(24px)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FiFileText style={{ color: 'var(--accent)', fontSize: 22 }} />
              <h2 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700, margin: 0 }}>Nueva Factura</h2>
              <div style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
                {[1, 2, 3].map(s => <div key={s} style={{ width: 28, height: 4, borderRadius: 2, background: step >= s ? 'var(--accent)' : 'var(--border)' }} />)}
              </div>
            </div>
            <motion.button whileHover={{ rotate: 90 }} onClick={() => { reset(); onClose() }}
              style={{ display: 'flex', padding: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-muted)', cursor: 'pointer' }}>
              <FiX size={20} />
            </motion.button>
          </div>

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {validationError && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 13, fontWeight: 500 }}>
                  {validationError}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo</label>
                  <select value={form.type} onChange={e => { setForm({ ...form, type: e.target.value }); setValidationError('') }}
                    style={{ padding: '13px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}>
                    <option value="client">Cliente</option>
                    <option value="supplier">Proveedor</option>
                  </select>
                  {form.type === 'client' && !cashRegister && (
                    <span style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>Requiere caja abierta</span>
                  )}
                  {form.type === 'supplier' && !canInvoiceSupplier() && (
                    <span style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>Requiere permiso Contabilidad → factura a proveedores</span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Moneda</label>
                  <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
                    style={{ padding: '13px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}>
                    {(currencies.length ? currencies : [{ code: 'DOP', name: 'Peso Dominicano' }, { code: 'USD', name: 'Dólar Americano' }]).map(c => (
                      <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cliente / Proveedor</label>
                <select value={form.clientId} onChange={e => {
                  const c = contacts.find(ct => ct.id === e.target.value)
                  setForm({ ...form, clientId: e.target.value, clientName: c ? c.name : '', clientType: c?.type || 'company', rnc: c?.rnc || '' })
                }} style={{ padding: '13px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}>
                  <option value="">Seleccionar contacto</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.name} — {c.company || ''}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fecha</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    style={{ padding: '13px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vencimiento</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                    style={{ padding: '13px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => {
                  if (form.type === 'client' && !cashRegister) { setValidationError('Debes abrir la caja antes de facturar a clientes.'); return }
                  if (form.type === 'supplier' && !canInvoiceSupplier()) { setValidationError('No tienes permiso para facturar a proveedores. Este permiso lo otorga Contabilidad.'); return }
                  setValidationError(''); setStep(2)
                }}
                  style={{ padding: '12px 32px', background: (!cashRegister && form.type === 'client') || (form.type === 'supplier' && !canInvoiceSupplier()) ? '#6b5a4a' : 'var(--accent-gradient)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Siguiente — Productos
                </motion.button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 8, alignItems: 'end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Producto</label>
                  <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
                    style={{ padding: '11px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}>
                    <option value="">Seleccionar</option>
                    {products.map(p => <option key={p.id || p.name} value={p.id}>{p.name} — ${formatMoney(p.price)}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Cant</label>
                  <input type="number" min={1} value={productQty} onChange={e => setProductQty(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ padding: '11px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={addProduct}
                  style={{ padding: '11px 16px', background: 'var(--accent)', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer' }}>
                  <FiPlus size={16} />
                </motion.button>
              </div>

              {form.items.length > 0 && (
                <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead><tr style={{ background: 'var(--bg-secondary)' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>Producto</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>Cant</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>Precio</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>Total</th>
                      <th style={{ padding: '8px 12px', width: 40 }}></th>
                    </tr></thead>
                    <tbody>
                      {form.items.map((it, i) => (
                        <tr key={i} style={{ borderTop: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>{it.productName}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{it.qty}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>${formatMoney(it.price)}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 600 }}>${formatMoney(it.total)}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16 }}>&times;</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Descuento</label>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', flex: 1 }}>
                      <button onClick={() => handleDiscountChange(form.discount, 'percentage')}
                        style={{ flex: 1, padding: '8px 10px', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: form.discountType === 'percentage' ? 'var(--accent)' : 'var(--bg-card)', color: form.discountType === 'percentage' ? '#fff' : 'var(--text-secondary)' }}>%</button>
                      <button onClick={() => handleDiscountChange(form.discount, 'amount')}
                        style={{ flex: 1, padding: '8px 10px', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: form.discountType === 'amount' ? 'var(--accent)' : 'var(--bg-card)', color: form.discountType === 'amount' ? '#fff' : 'var(--text-secondary)' }}>$</button>
                    </div>
                    <input type="number" min={0} value={form.discount} onChange={e => handleDiscountChange(e.target.value)}
                      placeholder="0" style={{ width: 80, padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Impuesto</label>
                  <select value={form.taxRateId} onChange={e => handleTaxRateChange(e.target.value)}
                    style={{ padding: '11px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}>
                    {taxRates.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({(t.rate * 100).toFixed(0)}%)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                  <span style={{ color: 'var(--text-primary)' }}>${formatMoney(form.subtotal)}</span>
                </div>
                {form.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
                    <span style={{ color: '#ef4444' }}>Descuento{form.discountType === 'percentage' ? ` (${form.discount}%)` : ''}</span>
                    <span style={{ color: '#ef4444' }}>-${formatMoney(form.discountAmount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Base imponible</span>
                  <span style={{ color: 'var(--text-muted)' }}>${formatMoney(form.taxableBase)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{(getTaxRate(form.taxRateId)?.name || 'ITBIS')} ({(getTaxRate(form.taxRateId)?.rate * 100).toFixed(0)}%)</span>
                  <span style={{ color: 'var(--text-secondary)' }}>${formatMoney(form.tax)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                  <span style={{ color: 'var(--text-primary)' }}>Total</span>
                  <span style={{ color: 'var(--accent)' }}>${formatMoney(form.total)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(1)}
                  style={{ padding: '12px 24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' }}>Atrás</motion.button>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(3)}
                  style={{ padding: '12px 32px', background: 'var(--accent-gradient)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Siguiente — Pago
                </motion.button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo de Pago</label>
                  <select value={form.paymentType} onChange={e => setForm({ ...form, paymentType: e.target.value })}
                    style={{ padding: '13px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}>
                    <option value="debit">Contado (Débito)</option>
                    <option value="credit">Crédito (Plazos)</option>
                  </select>
                </div>
                {form.paymentType === 'debit' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Método de Pago</label>
                    <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                      style={{ padding: '13px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}>
                      <option value="transfer">Transferencia</option>
                      <option value="card">Tarjeta</option>
                      <option value="cash">Efectivo</option>
                      <option value="check">Cheque</option>
                    </select>
                  </div>
                )}
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Cliente</span>
                  <span style={{ color: 'var(--text-primary)' }}>{form.clientName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Moneda</span>
                  <span style={{ color: 'var(--text-primary)' }}>{form.currency}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Productos</span>
                  <span style={{ color: 'var(--text-primary)' }}>{form.items.length} ítems</span>
                </div>
                {form.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
                    <span style={{ color: '#ef4444' }}>Descuento</span>
                    <span style={{ color: '#ef4444' }}>-${formatMoney(form.discountAmount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{getTaxRate(form.taxRateId)?.name || 'ITBIS'}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>${formatMoney(form.tax)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                  <span style={{ color: 'var(--text-primary)' }}>Total a pagar</span>
                  <span style={{ color: 'var(--accent)' }}>${formatMoney(form.total)}</span>
                </div>
                {form.paymentType === 'credit' && (
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Al crear, se te pedirá el número de cuotas para generar el plan de pagos.</p>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(2)}
                  style={{ padding: '12px 24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' }}>Atrás</motion.button>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleCreate}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 32px', background: 'var(--accent-gradient)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  <FiCheck size={16} /> Crear Factura
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function DetailModal({ inv, onClose, taxRates }) {
  if (!inv) return null
  const taxRate = taxRates.find(t => t.id === inv.taxRateId)
  return (
    <AnimatePresence>
      <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
        <motion.div key="modal" initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={e => e.stopPropagation()}
          style={{ width: 520, padding: '32px 36px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700, margin: 0 }}>Detalle {inv.id}</h2>
            <motion.button whileHover={{ rotate: 90 }} onClick={onClose}
              style={{ display: 'flex', padding: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-muted)', cursor: 'pointer' }}>
              <FiX size={20} />
            </motion.button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div><span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Cliente</span><p style={{ margin: '4px 0', color: 'var(--text-primary)', fontSize: 14 }}>{inv.clientName}</p></div>
            <div><span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>RNC</span><MaskedRNC value={inv.rnc} /></div>
            <div><span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Fecha</span><p style={{ margin: '4px 0', color: 'var(--text-primary)', fontSize: 14 }}>{inv.date}</p></div>
            <div><span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Vencimiento</span><p style={{ margin: '4px 0', color: 'var(--text-primary)', fontSize: 14 }}>{inv.dueDate || 'N/A'}</p></div>
            <div><span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Moneda</span><p style={{ margin: '4px 0', color: 'var(--text-primary)', fontSize: 14 }}>{inv.currency || 'DOP'}</p></div>
            <div><span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Método Pago</span><p style={{ margin: '4px 0', color: 'var(--text-primary)', fontSize: 14 }}>{inv.paymentType === 'credit' ? 'Crédito' : (inv.paymentMethod || 'N/A')}</p></div>
          </div>
          {inv.items && inv.items.length > 0 && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: 'var(--bg-secondary)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>Producto</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>Cant</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>Total</th>
                </tr></thead>
                <tbody>{inv.items.map((it, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>{it.productName}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{it.qty}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 600 }}>${formatMoney(it.total)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {inv.installmentPlan && (
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 10, marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 8px' }}>Plan de Pagos — {inv.installmentPlan.totalInstallments} cuotas de ${formatMoney(inv.installmentPlan.amountPerInstallment)}</p>
              {inv.installmentPlan.installments.map((inst, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Cuota {inst.number} — {inst.dueDate}</span>
                  <span style={{ color: inst.paid ? 'var(--success)' : 'var(--warning)' }}>${formatMoney(inst.amount)} {inst.paid ? '✓' : 'Pendiente'}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 2 }}><span style={{ color: 'var(--text-secondary)' }}>Subtotal</span><span>${formatMoney(inv.subtotal)}</span></div>
            {inv.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 2 }}><span style={{ color: '#ef4444' }}>Descuento{inv.discountType === 'percentage' ? ` (${inv.discount}%)` : ''}</span><span style={{ color: '#ef4444' }}>-${formatMoney(inv.discountAmount)}</span></div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 2 }}><span style={{ color: 'var(--text-secondary)' }}>{taxRate ? `${taxRate.name} (${(taxRate.rate * 100).toFixed(0)}%)` : 'ITBIS'}</span><span>${formatMoney(inv.tax)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 4 }}>
              <span style={{ color: 'var(--text-primary)' }}>Total</span>
              <span style={{ color: 'var(--accent)' }}>${formatMoney(inv.total)}</span>
            </div>
            {inv.status === 'paid' && inv.amountReceived > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 2 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Monto recibido</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>${formatMoney(inv.amountReceived)}</span>
                </div>
                {inv.changeReturned > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#f59e0b' }}>Cambio devuelto</span>
                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>${formatMoney(inv.changeReturned)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function PaymentModal({ inv, onClose, onConfirm, formatMoney }) {
  const [amountReceived, setAmountReceived] = useState('')
  const [loading, setLoading] = useState(false)

  if (!inv) return null

  const total = inv.total || 0
  const isCash = inv.paymentMethod === 'cash'
  const received = Number(amountReceived) || 0
  const difference = received - total
  const change = isCash && difference > 0 ? difference : 0
  const insufficient = isCash && received > 0 && received < total
  const exactOrOver = !isCash || received >= total

  const handleConfirm = async () => {
    if (isCash && received <= 0) { alert('Ingresa el monto recibido'); return }
    if (isCash && received < total) { alert('El monto recibido es menor al total'); return }
    setLoading(true)
    await onConfirm(inv.id, isCash ? received : total, change)
    setLoading(false)
  }

  return (
    <AnimatePresence>
      <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}>
        <motion.div key="modal" initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={e => e.stopPropagation()}
          style={{ width: 480, padding: '32px 36px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiDollarSign style={{ color: 'var(--accent)', fontSize: 22 }} />
              <h2 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700, margin: 0 }}>Registrar Pago</h2>
            </div>
            <motion.button whileHover={{ rotate: 90 }} onClick={onClose}
              style={{ display: 'flex', padding: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-muted)', cursor: 'pointer' }}>
              <FiX size={20} />
            </motion.button>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 12, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Factura</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{inv.id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Cliente</span>
              <span style={{ color: 'var(--text-primary)' }}>{inv.clientName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Método de pago</span>
              <span style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{inv.paymentMethod === 'transfer' ? 'Transferencia' : inv.paymentMethod === 'card' ? 'Tarjeta' : inv.paymentMethod === 'cash' ? 'Efectivo' : inv.paymentMethod === 'check' ? 'Cheque' : inv.paymentMethod}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 6 }}>
              <span style={{ color: 'var(--text-primary)' }}>Total a pagar</span>
              <span style={{ color: 'var(--accent)' }}>${formatMoney(total)}</span>
            </div>
          </div>

          {isCash ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monto recibido (Efectivo)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 16, fontWeight: 600 }}>$</span>
                  <input type="number" min={0} step="0.01" value={amountReceived} onChange={e => setAmountReceived(e.target.value)}
                    placeholder="0.00" autoFocus
                    style={{ width: '100%', padding: '14px 14px 14px 32px', background: 'var(--bg-card)', border: `1px solid ${insufficient ? '#ef4444' : 'var(--border)'}`, borderRadius: 10, color: 'var(--text-primary)', fontSize: 18, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                {insufficient && (
                  <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 500 }}>El monto es menor al total de la factura</span>
                )}
              </div>

              {received > 0 && !insufficient && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: 10, background: change > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${change > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: change > 0 ? '#f59e0b' : '#10b981' }}>
                    {change > 0 ? 'Cambio a devolver' : 'Pago exacto'}
                  </span>
                  <span style={{ fontSize: 24, fontWeight: 700, color: change > 0 ? '#f59e0b' : '#10b981' }}>
                    ${formatMoney(change)}
                  </span>
                </motion.div>
              )}
            </div>
          ) : (
            <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#10b981', fontWeight: 500 }}>
                Pago por {inv.paymentMethod === 'transfer' ? 'transferencia' : inv.paymentMethod === 'card' ? 'tarjeta' : 'cheque'} — Se registra el importe exacto de ${formatMoney(total)}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={onClose}
              style={{ padding: '12px 24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' }}>
              Cancelar
            </motion.button>
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleConfirm} disabled={loading || (isCash && !exactOrOver)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 32px', background: (isCash && !exactOrOver) ? '#6b5a4a' : 'var(--accent-gradient)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: (isCash && !exactOrOver) ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
              <FiCheck size={16} /> {loading ? 'Procesando...' : 'Confirmar Pago'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
