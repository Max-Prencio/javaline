import db from './db'

function delay(ms = 200) { return new Promise(r => setTimeout(r, ms)) }

const LOW_STOCK_THRESHOLD = 10
const CRITICAL_STOCK_THRESHOLD = 3

const inventoryService = {
  // --- PRODUCTS / INVENTORY ITEMS ---
  async list(filters = {}) {
    await delay()
    let items = db.getAll('inventory')
    if (filters.search) items = items.filter(i =>
      i.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      i.sku?.toLowerCase().includes(filters.search.toLowerCase()) ||
      i.category?.toLowerCase().includes(filters.search.toLowerCase())
    )
    if (filters.category) items = items.filter(i => i.category === filters.category)
    if (filters.stockFilter === 'low') items = items.filter(i => i.stock <= LOW_STOCK_THRESHOLD && i.stock > CRITICAL_STOCK_THRESHOLD)
    if (filters.stockFilter === 'critical') items = items.filter(i => i.stock <= CRITICAL_STOCK_THRESHOLD)
    if (filters.stockFilter === 'out') items = items.filter(i => i.stock <= 0)
    return items.sort((a, b) => a.name.localeCompare(b.name))
  },

  async getById(id) {
    await delay()
    return db.getById('inventory', id)
  },

  async create(data, userId = 'system') {
    await delay(400)
    const item = db.insert('inventory', {
      name: data.name,
      sku: data.sku || `SKU-${Date.now().toString(36).toUpperCase()}`,
      category: data.category || 'General',
      stock: Number(data.stock) || 0,
      minStock: Number(data.minStock) || LOW_STOCK_THRESHOLD,
      price: Number(data.price) || 0,
      cost: Number(data.cost) || 0,
      location: data.location || '',
      unit: data.unit || 'unidad',
      description: data.description || '',
      active: true,
    })
    db.addAudit({ action: 'inventory_create', store: 'inventory', detail: `Producto creado: ${item.name} (SKU: ${item.sku})`, userId })
    return item
  },

  async update(id, changes, userId = 'system') {
    await delay(300)
    const allowed = ['name', 'sku', 'category', 'stock', 'minStock', 'price', 'cost', 'location', 'unit', 'description', 'active']
    const clean = {}
    Object.keys(changes).forEach(k => { if (allowed.includes(k)) clean[k] = changes[k] })
    const item = db.update('inventory', id, clean)
    if (!item) throw new Error('Producto no encontrado')
    db.addAudit({ action: 'inventory_update', store: 'inventory', detail: `Producto actualizado: ${item.name}`, userId })
    return item
  },

  async remove(id, userId = 'system') {
    await delay(300)
    const item = db.getById('inventory', id)
    if (!item) throw new Error('Producto no encontrado')
    db.remove('inventory', id)
    db.addAudit({ action: 'inventory_delete', store: 'inventory', detail: `Producto eliminado: ${item.name}`, userId })
    return true
  },

  // --- STOCK MOVEMENTS ---
  async adjustStock(id, quantity, reason, userId = 'system') {
    await delay(300)
    const item = db.getById('inventory', id)
    if (!item) throw new Error('Producto no encontrado')
    const newStock = Math.max(0, (item.stock || 0) + quantity)
    const updated = db.update('inventory', id, { stock: newStock })
    if (quantity !== 0) {
      const movement = db.insert('stockMovements', {
        productId: id,
        productName: item.name,
        sku: item.sku,
        quantity,
        type: quantity > 0 ? 'in' : 'out',
        reason,
        beforeStock: item.stock,
        afterStock: newStock,
        userId,
        date: new Date().toISOString(),
      })
      db.addAudit({ action: 'stock_movement', store: 'inventory', detail: `${quantity > 0 ? 'Entrada' : 'Salida'}: ${item.name} (${quantity > 0 ? '+' : ''}${quantity}) — ${reason}`, userId })
      return { item: updated, movement }
    }
    return { item: updated, movement: null }
  },

  async receiveFromPurchase(purchaseOrder, userId = 'system') {
    await delay(400)
    const { item: productName, qty, supplier, id: orderId } = purchaseOrder
    const existing = db.query('inventory', i => i.name.toLowerCase() === productName.toLowerCase())
    let item
    if (existing.length > 0) {
      item = existing[0]
      const result = await this.adjustStock(item.id, qty, `Recepción OC ${orderId} — ${supplier}`, userId)
      item = result.item
    } else {
      item = await this.create({
        name: productName,
        stock: qty,
        category: 'General',
        price: Math.round(purchaseOrder.total / qty),
        cost: Math.round(purchaseOrder.total / qty),
        description: `Recibido de ${supplier} vía ${orderId}`,
      }, userId)
    }
    db.addAudit({ action: 'purchase_received', store: 'inventory', detail: `OC ${orderId} recibida: ${qty}x ${productName} de ${supplier}`, userId })
    return { item, movement: { productName, qty, supplier, orderId } }
  },

  // --- QUERIES ---
  async getStockMovements(productId = null, limit = 50) {
    await delay()
    let movements = db.getAll('stockMovements').sort((a, b) => new Date(b.date) - new Date(a.date))
    if (productId) movements = movements.filter(m => m.productId === productId)
    return movements.slice(0, limit)
  },

  async getCategories() {
    await delay()
    const items = db.getAll('inventory')
    return [...new Set(items.map(i => i.category))].sort()
  },

  async getLowStockItems() {
    await delay()
    return db.getAll('inventory').filter(i => i.stock <= i.minStock && i.active)
  },

  async getStats() {
    await delay()
    const items = db.getAll('inventory')
    const totalProducts = items.length
    const totalStock = items.reduce((s, i) => s + (i.stock || 0), 0)
    const totalValue = items.reduce((s, i) => s + (i.stock || 0) * (i.cost || 0), 0)
    const lowStock = items.filter(i => i.stock <= (i.minStock || LOW_STOCK_THRESHOLD) && i.active).length
    const criticalStock = items.filter(i => i.stock <= CRITICAL_STOCK_THRESHOLD && i.active).length
    const categories = new Set(items.map(i => i.category)).size
    return { totalProducts, totalStock, totalValue, lowStock, criticalStock, categories }
  },
}

export default inventoryService
