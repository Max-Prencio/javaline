import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPackage, FiPlus, FiSearch, FiEdit2, FiTrash2, FiX, FiChevronDown, FiChevronUp, FiClock, FiRefreshCw, FiArrowDown, FiArrowUp } from 'react-icons/fi'
import inventoryService from '../services/inventoryService'
import { useAuth } from '../contexts/AuthContext'

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }

const stockLevel = (stock, minStock) => {
  const min = minStock || 10
  if (stock <= 0) return { label: 'Sin stock', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }
  if (stock <= 3) return { label: 'Crítico', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }
  if (stock <= min) return { label: 'Bajo', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }
  return { label: 'Normal', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' }
}

export default function Inventory() {
  const [items, setItems] = useState([])
  const [movements, setMovements] = useState([])
  const [stats, setStats] = useState(null)
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(null)
  const [moveModal, setMoveModal] = useState(null)
  const [expandedMovements, setExpandedMovements] = useState({})
  const [form, setForm] = useState({ name: '', sku: '', category: 'General', stock: '', minStock: '10', price: '', cost: '', location: '', unit: 'unidad', description: '', batch: '', expiry_date: '' })
  const [moveForm, setMoveForm] = useState({ quantity: '', reason: '', type: 'in' })
  const [editId, setEditId] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)

  const { user } = useAuth()
  const userId = user?.userId || user?.id

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await inventoryService.list({})
      setItems(data)
      const m = await inventoryService.getStockMovements()
      setMovements(m)
      const s = await inventoryService.getStats()
      setStats(s)
      const c = await inventoryService.getCategories()
      setCategories(c)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const visibleItems = items.filter(item => {
    const q = search.toLowerCase()
    const matchSearch = !q || item.name?.toLowerCase().includes(q) || item.sku?.toLowerCase().includes(q) || item.category?.toLowerCase().includes(q)
    const matchStock =
      stockFilter === 'all' ? true :
      stockFilter === 'out' ? item.stock <= 0 :
      stockFilter === 'critical' ? item.stock > 0 && item.stock <= 3 :
      stockFilter === 'low' ? item.stock > 0 && item.stock <= (item.minStock || 10) :
      true
    return matchSearch && matchStock
  })

  const handleFormChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const openCreate = () => {
    setEditId(null)
    setForm({ name: '', sku: '', category: 'General', stock: '', minStock: '10', price: '', cost: '', location: '', unit: 'unidad', description: '' })
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditId(item.id)
    setForm({
      name: item.name, sku: item.sku || '', category: item.category || 'General',
      stock: String(item.stock || 0), minStock: String(item.minStock || 10),
      price: String(item.price || 0), cost: String(item.cost || 0),
      location: item.location || '', unit: item.unit || 'unidad', description: item.description || '',
      batch: item.batch || '', expiry_date: item.expiry_date || '',
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name) return
    if (editId) {
      await inventoryService.update(editId, {
        name: form.name, sku: form.sku, category: form.category,
        minStock: Number(form.minStock), price: Number(form.price), cost: Number(form.cost),
        location: form.location, unit: form.unit, description: form.description,
        batch: form.batch, expiry_date: form.expiry_date,
      }, userId)
    } else {
      await inventoryService.create({
        name: form.name, sku: form.sku, category: form.category,
        stock: Number(form.stock), minStock: Number(form.minStock),
        price: Number(form.price), cost: Number(form.cost),
        location: form.location, unit: form.unit, description: form.description,
        batch: form.batch, expiry_date: form.expiry_date,
      }, userId)
    }
    setModalOpen(false)
    load()
  }

  const handleDelete = async (id) => {
    await inventoryService.remove(id, userId)
    load()
  }

  const openMove = (item) => {
    setMoveForm({ quantity: '', reason: '', type: 'in' })
    setMoveModal(item)
  }

  const handleMove = async (e) => {
    e.preventDefault()
    if (!moveForm.quantity || !moveForm.reason) return
    const qty = moveForm.type === 'in' ? Number(moveForm.quantity) : -Number(moveForm.quantity)
    await inventoryService.adjustStock(moveModal.id, qty, moveForm.reason, userId)
    setMoveModal(null)
    load()
  }

  const toggleMovements = (id) => {
    setExpandedMovements(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const filteredMovements = (itemId) => movements.filter(m => m.productId === itemId).slice(0, 10)

  return (
    <div className="p-6 space-y-8">
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="spinner" />
        </div>
      )}
      {!loading && (<>
      <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ padding: 10, borderRadius: 12, background: 'var(--accent-gradient)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <FiPackage style={{ width: 20, height: 20, color: 'white' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Inventario</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Gestión de productos, stock y movimientos de inventario</p>
          </div>
        </div>
      </motion.div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          {[
            { label: 'Productos', value: stats.totalProducts, color: 'var(--accent)' },
            { label: 'Stock total', value: stats.totalStock, color: 'var(--text-primary)' },
            { label: 'Valor inventario', value: `$${stats.totalValue.toLocaleString('es-DO')}`, color: 'var(--success)' },
            { label: 'Stock bajo', value: stats.lowStock, color: stats.lowStock > 0 ? 'var(--warning)' : 'var(--success)' },
            { label: 'Crítico', value: stats.criticalStock, color: stats.criticalStock > 0 ? '#ef4444' : 'var(--success)' },
            { label: 'Categorías', value: stats.categories, color: 'var(--text-secondary)' },
          ].map(item => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: item.color }}>{item.value}</span>
            </motion.div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14, pointerEvents: 'none' }} />
          <input placeholder="Buscar producto, SKU o categoría..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 36px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={stockFilter} onChange={e => setStockFilter(e.target.value)}
          style={{ padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}>
          <option value="all">Todo el stock</option>
          <option value="low">Stock bajo</option>
          <option value="critical">Stock crítico</option>
          <option value="out">Sin stock</option>
        </select>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openCreate}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--accent-gradient)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <FiPlus size={16} /> Nuevo Producto
        </motion.button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visibleItems.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            <FiPackage size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            {items.length === 0 ? 'No hay productos en inventario. Crea tu primer producto.' : 'Ningún producto coincide con el filtro.'}
          </div>
        ) : visibleItems.map((item, i) => {
          const level = stockLevel(item.stock, item.minStock)
          const itemMoves = filteredMovements(item.id)
          const expanded = expandedMovements[item.id]
          return (
            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', cursor: 'pointer' }}
                onClick={() => toggleMovements(item.id)}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: level.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FiPackage size={18} color={level.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{item.sku}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>{item.category}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>Precio: <strong style={{ color: 'var(--text-primary)' }}>${Number(item.price).toLocaleString('es-DO')}</strong></span>
                    <span>Costo: <strong style={{ color: 'var(--text-primary)' }}>${Number(item.cost).toLocaleString('es-DO')}</strong></span>
                    {item.location && <span>Ubicación: {item.location}</span>}
                    {item.batch && <span>Lote: {item.batch}</span>}
                    {item.expiry_date && <span>Vence: {item.expiry_date}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: level.color, textAlign: 'right' }}>{item.stock}</div>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 9999, background: level.bg, color: level.color, fontWeight: 600 }}>{level.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); openMove(item) }}
                      style={{ padding: 6, background: 'var(--bg-elevated)', border: 'none', borderRadius: 8, color: 'var(--accent)', cursor: 'pointer', display: 'flex' }}>
                      <FiRefreshCw size={14} />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); openEdit(item) }}
                      style={{ padding: 6, background: 'var(--bg-elevated)', border: 'none', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                      <FiEdit2 size={14} />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }}
                      style={{ padding: 6, background: 'var(--bg-elevated)', border: 'none', borderRadius: 8, color: '#ef4444', cursor: 'pointer', display: 'flex' }}>
                      <FiTrash2 size={14} />
                    </motion.button>
                    <div style={{ padding: 6, color: 'var(--text-muted)', display: 'flex' }}>
                      {expanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                    </div>
                  </div>
                </div>
              </div>
              {expanded && itemMoves.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border-light)', padding: '12px 20px', background: 'var(--bg-elevated)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <FiClock size={12} color="var(--text-muted)" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Movimientos recientes</span>
                  </div>
                  {itemMoves.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border-light)', fontSize: 12 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: m.type === 'in' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {m.type === 'in' ? <FiArrowDown size={12} color="#22c55e" /> : <FiArrowUp size={12} color="#ef4444" />}
                      </div>
                      <span style={{ fontWeight: 600, color: m.type === 'in' ? '#22c55e' : '#ef4444' }}>{m.type === 'in' ? '+' : ''}{m.quantity}</span>
                      <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{m.reason}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{new Date(m.date).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
              {expanded && itemMoves.length === 0 && (
                <div style={{ borderTop: '1px solid var(--border-light)', padding: '12px 20px', background: 'var(--bg-elevated)', fontSize: 12, color: 'var(--text-muted)' }}>
                  Sin movimientos registrados
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div key="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setModalOpen(false)}>
            <motion.div key="modal-content" initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} onClick={e => e.stopPropagation()}
              style={{ width: 540, maxHeight: '85vh', overflow: 'auto', padding: '32px 36px 36px', background: 'var(--bg-card)', backdropFilter: 'blur(24px)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FiPackage style={{ color: 'var(--accent)', fontSize: 22 }} />
                  <h2 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700, margin: 0 }}>{editId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                </div>
                <motion.button whileHover={{ rotate: 90 }} onClick={() => setModalOpen(false)}
                  style={{ display: 'flex', padding: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={20} /></motion.button>
              </div>
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                  <div><label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Nombre *</label>
                    <input name="name" value={form.name} onChange={handleFormChange} placeholder="Nombre del producto" required
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} /></div>
                  <div><label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>SKU</label>
                    <input name="sku" value={form.sku} onChange={handleFormChange} placeholder="Auto-generado"
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Categoría</label>
                    <select name="category" value={form.category} onChange={handleFormChange}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}>
                      {['General', 'Electrónica', 'Accesorios', 'Audio', 'Muebles', 'Oficina', 'Software', 'Servicios'].map(c => <option key={c}>{c}</option>)}
                    </select></div>
                  <div><label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Unidad</label>
                    <select name="unit" value={form.unit} onChange={handleFormChange}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}>
                      <option value="unidad">Unidad</option><option value="caja">Caja</option><option value="resma">Resma</option><option value="kg">Kg</option><option value="litro">Litro</option><option value="metro">Metro</option>
                    </select></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                  <div><label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Stock inicial</label>
                    <input name="stock" type="number" value={form.stock} onChange={handleFormChange} placeholder="0"
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} /></div>
                  <div><label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Stock mínimo</label>
                    <input name="minStock" type="number" value={form.minStock} onChange={handleFormChange}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} /></div>
                  <div><label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Precio</label>
                    <input name="price" type="number" value={form.price} onChange={handleFormChange} placeholder="0"
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} /></div>
                  <div><label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Costo</label>
                    <input name="cost" type="number" value={form.cost} onChange={handleFormChange} placeholder="0"
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} /></div>
                </div>
                <div><label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Ubicación</label>
                  <input name="location" value={form.location} onChange={handleFormChange} placeholder="Ej: Almacén A, Estante 3"
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Lote / Batch</label>
                    <input name="batch" value={form.batch} onChange={handleFormChange} placeholder="Ej: LOTE-2026-01"
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} /></div>
                  <div><label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Fecha vencimiento</label>
                    <input name="expiry_date" type="date" value={form.expiry_date} onChange={handleFormChange}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} /></div>
                </div>
                <div><label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Descripción</label>
                  <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Descripción del producto" rows={2}
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} /></div>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0', background: 'var(--accent-gradient)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
                  <FiPlus size={16} /> {editId ? 'Guardar Cambios' : 'Crear Producto'}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stock Movement Modal */}
      <AnimatePresence>
        {moveModal && (
          <motion.div key="move-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setMoveModal(null)}>
            <motion.div key="move-content" initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} onClick={e => e.stopPropagation()}
              style={{ width: 420, padding: '28px 32px', background: 'var(--bg-card)', backdropFilter: 'blur(24px)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FiRefreshCw style={{ color: 'var(--accent)', fontSize: 20 }} />
                  <h2 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700, margin: 0 }}>Ajustar Stock</h2>
                </div>
                <motion.button whileHover={{ rotate: 90 }} onClick={() => setMoveModal(null)}
                  style={{ display: 'flex', padding: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={20} /></motion.button>
              </div>
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--bg-elevated)', marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{moveModal.name}</div>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>SKU: {moveModal.sku}</span>
                  <span>Stock actual: <strong style={{ color: 'var(--text-primary)' }}>{moveModal.stock}</strong></span>
                </div>
              </div>
              <form onSubmit={handleMove} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Tipo</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button type="button" onClick={() => setMoveForm({ ...moveForm, type: 'in' })}
                        style={{ flex: 1, padding: '10px', borderRadius: 8, border: moveForm.type === 'in' ? '2px solid #22c55e' : '1px solid var(--border)', background: moveForm.type === 'in' ? 'rgba(34,197,94,0.1)' : 'var(--bg-card)', color: moveForm.type === 'in' ? '#22c55e' : 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Entrada</button>
                      <button type="button" onClick={() => setMoveForm({ ...moveForm, type: 'out' })}
                        style={{ flex: 1, padding: '10px', borderRadius: 8, border: moveForm.type === 'out' ? '2px solid #ef4444' : '1px solid var(--border)', background: moveForm.type === 'out' ? 'rgba(239,68,68,0.1)' : 'var(--bg-card)', color: moveForm.type === 'out' ? '#ef4444' : 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Salida</button>
                    </div>
                  </div>
                  <div><label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Cantidad</label>
                    <input type="number" placeholder="0" min="1" value={moveForm.quantity} onChange={e => setMoveForm({ ...moveForm, quantity: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} /></div>
                </div>
                <div><label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Motivo</label>
                  <select value={moveForm.reason} onChange={e => setMoveForm({ ...moveForm, reason: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}>
                    <option value="">Seleccionar motivo</option>
                    <option value="Recepción de compra">Recepción de compra</option>
                    <option value="Venta a cliente">Venta a cliente</option>
                    <option value="Ajuste de inventario">Ajuste de inventario</option>
                    <option value="Devolución de cliente">Devolución de cliente</option>
                    <option value="Transferencia entre almacenes">Transferencia entre almacenes</option>
                    <option value="Merma/dañado">Merma / Dañado</option>
                    <option value="Uso interno">Uso interno</option>
                  </select></div>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0', background: 'var(--accent-gradient)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  <FiRefreshCw size={16} /> Registrar Movimiento
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </>)}
    </div>
  )
}
