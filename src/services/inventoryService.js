import api from './apiClient'
import db from './db'

function delay(ms = 200) { return new Promise(r => setTimeout(r, ms)) }

async function tryApi(fn) {
  try { return await fn() } catch { return null }
}

const inventoryService = {
  async list(filters = {}) {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.category) params.set('category', filters.category)
    if (filters.stockFilter) params.set('stock_filter', filters.stockFilter)
    const qs = params.toString()
    const result = await tryApi(() => api.get(`/inventory${qs ? `?${qs}` : ''}`))
    if (result) return result

    await delay()
    let items = db.getAll('inventory')
    if (filters.search) {
      const q = filters.search.toLowerCase()
      items = items.filter(i =>
        i.name?.toLowerCase().includes(q) ||
        i.sku?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q)
      )
    }
    if (filters.category) {
      items = items.filter(i => i.category === filters.category)
    }
    if (filters.stockFilter === 'low') {
      items = items.filter(i => i.stock <= (i.minStock || 10) && i.stock > 0)
    } else if (filters.stockFilter === 'out') {
      items = items.filter(i => i.stock <= 0)
    } else if (filters.stockFilter === 'ok') {
      items = items.filter(i => i.stock > (i.minStock || 10))
    }
    return items
  },

  async getById(id) {
    const result = await tryApi(() => api.get(`/inventory/${id}`))
    if (result) return result
    await delay()
    return db.getById('inventory', id)
  },

  async create(data, userId) {
    const result = await tryApi(() => api.post('/inventory', data))
    if (result) return result
    await delay(400)
    const item = db.insert('inventory', { ...data, active: true })
    db.addAudit({ action: 'create', store: 'inventory', detail: `Producto creado: ${item.name}`, userId: userId || 'system' })
    // Keep legacy products store in sync
    db.insert('products', { id: item.id, name: item.name, price: item.price, stock: item.stock, sales: 0, category: item.category })
    return item
  },

  async update(id, changes, userId) {
    const result = await tryApi(() => api.put(`/inventory/${id}`, changes))
    if (result) return result
    await delay(300)
    const item = db.update('inventory', id, changes)
    if (!item) throw new Error('Producto no encontrado')
    db.addAudit({ action: 'update', store: 'inventory', detail: `Producto actualizado: ${id}`, userId: userId || 'system' })
    // Sync price/stock/name to products store if it exists there
    const prod = db.getById('products', id)
    if (prod) {
      const sync = {}
      if (changes.name !== undefined) sync.name = changes.name
      if (changes.price !== undefined) sync.price = changes.price
      if (changes.stock !== undefined) sync.stock = changes.stock
      if (changes.category !== undefined) sync.category = changes.category
      if (Object.keys(sync).length) db.update('products', id, sync)
    }
    return item
  },

  async remove(id, userId) {
    const result = await tryApi(() => api.delete(`/inventory/${id}`))
    if (result) return result
    await delay(300)
    const ok = db.remove('inventory', id)
    if (!ok) throw new Error('Producto no encontrado')
    db.addAudit({ action: 'delete', store: 'inventory', detail: `Producto eliminado: ${id}`, userId: userId || 'system' })
    db.remove('products', id)
    return true
  },

  async adjustStock(id, quantity, reason, userId) {
    const result = await tryApi(() => api.post(`/inventory/${id}/adjust`, { quantity, reason }))
    if (result) return result

    await delay(300)
    const item = db.getById('inventory', id)
    if (!item) throw new Error('Producto no encontrado')
    const beforeStock = item.stock
    const afterStock = Math.max(0, beforeStock + quantity)
    db.update('inventory', id, { stock: afterStock })
    // Sync to products
    const prod = db.getById('products', id)
    if (prod) db.update('products', id, { stock: afterStock })

    const movement = db.insert('stockMovements', {
      productId: id,
      productName: item.name,
      sku: item.sku,
      quantity,
      type: quantity >= 0 ? 'in' : 'out',
      reason,
      beforeStock,
      afterStock,
      userId: userId || 'system',
      date: new Date().toISOString(),
    })
    db.addAudit({ action: 'stock_adjust', store: 'inventory', detail: `Stock ajustado: ${item.name} (${quantity > 0 ? '+' : ''}${quantity})`, userId: userId || 'system' })
    return { item: db.getById('inventory', id), movement }
  },

  async receiveFromPurchase(purchaseOrder, userId) {
    const result = await tryApi(() => api.post(`/purchases/${purchaseOrder.id}/receive`))
    if (result) return result

    await delay(400)
    const movements = []
    for (const item of purchaseOrder.items || []) {
      if (!item.productId || !item.qty) continue
      const product = db.getById('inventory', item.productId)
      if (product) {
        const beforeStock = product.stock
        const afterStock = beforeStock + item.qty
        db.update('inventory', item.productId, { stock: afterStock })
        const prod = db.getById('products', item.productId)
        if (prod) db.update('products', item.productId, { stock: afterStock })
        movements.push(db.insert('stockMovements', {
          productId: item.productId,
          productName: product.name,
          sku: product.sku,
          quantity: item.qty,
          type: 'in',
          reason: `Recepción OC-${purchaseOrder.id} — ${purchaseOrder.supplier}`,
          beforeStock,
          afterStock,
          userId: userId || 'system',
          date: new Date().toISOString(),
        }))
      }
    }
    db.update('purchases', purchaseOrder.id, { status: 'recibido' })
    db.addAudit({ action: 'purchase_received', store: 'inventory', detail: `OC recibida: ${purchaseOrder.id}`, userId: userId || 'system' })
    return movements
  },

  async getStockMovements(productId = null, limit = 50) {
    if (productId) {
      const result = await tryApi(() => api.get(`/inventory/${productId}/movements`))
      if (result) return result
      await delay()
      return db.getAll('stockMovements').filter(m => m.productId === productId).slice(0, limit)
    }
    const result = await tryApi(() => api.get('/inventory/movements'))
    if (result) return result
    await delay()
    return db.getAll('stockMovements')
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit)
  },

  async getCategories() {
    const items = await this.list()
    return [...new Set(items.map(i => i.category).filter(Boolean))].sort()
  },

  async getLowStockItems() {
    return this.list({ stockFilter: 'low' })
  },

  async getStats() {
    const result = await tryApi(() => api.get('/inventory/stats/summary'))
    if (result) return result

    await delay()
    const items = db.getAll('inventory')
    const totalValue = items.reduce((s, i) => s + (i.stock * (i.cost || 0)), 0)
    const totalRetailValue = items.reduce((s, i) => s + (i.stock * (i.price || 0)), 0)
    const lowStock = items.filter(i => i.stock > 0 && i.stock <= (i.minStock || 10)).length
    const outOfStock = items.filter(i => i.stock <= 0).length
    return {
      total: items.length,
      totalValue,
      totalRetailValue,
      lowStock,
      outOfStock,
      active: items.filter(i => i.active !== false).length,
    }
  },
}

export default inventoryService
