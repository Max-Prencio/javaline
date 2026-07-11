import api from './apiClient'
import db from './db'

const API_MAP = {
  'products': '/inventory',
  'invoices': '/invoices',
  'contacts': '/contacts',
  'employees': '/users',
  'purchases': '/purchases',
}

function delay(ms = 200) { return new Promise(r => setTimeout(r, ms)) }

function createEntityService(store, label) {
  const apiPath = API_MAP[store]

  function getNextId(prefix) {
    const items = db.getAll(store)
    const nums = items
      .map(i => { const m = (i.id || '').match(new RegExp(`^${prefix}-(\\d+)$`)); return m ? parseInt(m[1]) : 0 })
      .filter(n => !isNaN(n))
    const max = nums.length ? Math.max(...nums) : 0
    return `${prefix}-${String(max + 1).padStart(3, '0')}`
  }

  async function tryApi(fn) {
    if (!apiPath) return null
    try { return await fn() } catch (e) { console.warn(`[entityService] API ${store} fallback: ${e.message}`); return null }
  }

  return {
    async list(filters = {}) {
      const apiResult = await tryApi(async () => {
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
        const qs = params.toString()
        return api.get(`${apiPath}${qs ? '?' + qs : ''}`)
      })
      if (apiResult) return apiResult
      await delay()
      let items = db.getAll(store)
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          items = items.filter(i =>
            String(i[key] || '').toLowerCase().includes(String(val).toLowerCase())
          )
        }
      })
      return items
    },

    async getById(id) {
      const apiResult = await tryApi(() => api.get(`${apiPath}/${id}`))
      if (apiResult) return apiResult
      await delay()
      return db.getById(store, id)
    },

    async create(data, userId = 'system') {
      const apiResult = await tryApi(() => api.post(apiPath, data))
      if (apiResult) return apiResult
      await delay(400)
      const item = db.insert(store, data)
      db.addAudit({ action: 'create', store, detail: `${label} creado: ${item.id || item.name || JSON.stringify(item).slice(0,50)}`, userId })
      return item
    },

    async update(id, changes, userId = 'system') {
      const apiResult = await tryApi(() => api.put(`${apiPath}/${id}`, changes))
      if (apiResult) return apiResult
      await delay(300)
      const item = db.update(store, id, changes)
      if (!item) throw new Error(`${label} no encontrado`)
      db.addAudit({ action: 'update', store, detail: `${label} actualizado: ${id}`, userId })
      return item
    },

    async remove(id, userId = 'system') {
      const apiResult = await tryApi(() => api.delete(`${apiPath}/${id}`))
      if (apiResult) return true
      await delay(300)
      const ok = db.remove(store, id)
      if (!ok) throw new Error(`${label} no encontrado`)
      db.addAudit({ action: 'delete', store, detail: `${label} eliminado: ${id}`, userId })
      return true
    },

    async getStats() {
      const apiResult = await tryApi(async () => {
        const items = await api.get(apiPath)
        return { total: items.length, items }
      })
      if (apiResult) return apiResult
      await delay()
      const items = db.getAll(store)
      return { total: items.length, items }
    },

    getNextId,
  }
}

export const invoiceService = createEntityService('invoices', 'Factura')

export const invoiceBusinessLogic = {
  async generateInvoiceId() { return invoiceService.getNextId('INV') },

  calculateTotals(items) {
    return items.reduce((sum, item) => sum + (item.price * item.qty), 0)
  },

  async markAsPaid(id, userId) {
    // Single audit via invoiceService.update — no extra addAudit needed
    return invoiceService.update(id, { status: 'pagada', paidAt: new Date().toISOString() }, userId)
  },

  async markAsOverdue(id, userId) {
    return invoiceService.update(id, { status: 'vencida' }, userId)
  },

  async generateReport(filters = {}) {
    const invoices = await invoiceService.list(filters)
    const totalAmount = invoices.reduce((s, i) => s + (i.total || i.amount || 0), 0)
    const byStatus = {}
    invoices.forEach(i => { byStatus[i.status] = (byStatus[i.status] || 0) + (i.total || i.amount || 0) })
    return { invoices, totalAmount, byStatus, count: invoices.length }
  },
}

export const contactService = createEntityService('contacts', 'Contacto')
export const employeeService = createEntityService('employees', 'Empleado')
export const purchaseService = createEntityService('purchases', 'Compra')

// productService now reads from 'inventory' — single source of truth for stock
export const productService = createEntityService('inventory', 'Producto')
export const taskService = createEntityService('tasks', 'Tarea')
export const meetingService = createEntityService('meetings', 'Reunión')
export const roleService = createEntityService('roles', 'Rol')

export const purchaseBusinessLogic = {
  async receiveOrder(id, userId) {
    return purchaseService.update(id, { status: 'recibido', receivedAt: new Date().toISOString() }, userId)
  },
  async getPendingOrders() { return purchaseService.list({ status: 'pendiente' }) },
}

export const taskBusinessLogic = {
  async moveTask(id, newStatus, userId) {
    return taskService.update(id, { status: newStatus }, userId)
  },
  async getBoard() {
    const tasks = await taskService.list()
    return {
      todo: tasks.filter(t => t.status === 'todo'),
      doing: tasks.filter(t => t.status === 'doing'),
      done: tasks.filter(t => t.status === 'done'),
    }
  },
}

export const productBusinessLogic = {
  async adjustStock(id, delta, userId) {
    const product = await productService.getById(id)
    if (!product) throw new Error('Producto no encontrado')
    const newStock = Math.max(0, (product.stock || 0) + delta)
    return productService.update(id, { stock: newStock }, userId)
  },
  async recordSale(id, qty, userId) {
    const product = await productService.getById(id)
    if (!product) throw new Error('Producto no encontrado')
    const newStock = Math.max(0, (product.stock || 0) - qty)
    const newSales = (product.sales || 0) + qty
    // Update unified inventory store
    db.update('inventory', id, { stock: newStock, sales: newSales })
    // Keep legacy products store in sync (used by reports/dashboard)
    const legacy = db.getById('products', id)
    if (legacy) db.update('products', id, { stock: newStock, sales: newSales })
    return db.getById('inventory', id)
  },
  async getLowStock(threshold = 5) {
    const products = await productService.list()
    return products.filter(p => p.stock <= threshold)
  },
}

export const chatService = {
  async getConversations() {
    await delay()
    return db.getAll('chats')
  },

  async getMessages(chatId) {
    await delay()
    const chat = db.getById('chats', chatId)
    return chat?.messages || []
  },

  async sendMessage(chatId, text, userId) {
    await delay(200)
    const chat = db.getById('chats', chatId)
    if (!chat) throw new Error('Conversación no encontrada')
    const msg = { from: 'me', text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    chat.messages.push(msg)
    chat.lastMessage = text
    chat.time = 'Ahora'
    db.update('chats', chatId, { messages: chat.messages, lastMessage: text, time: 'Ahora' })
    db.addAudit({ action: 'send_message', store: 'chats', detail: `Mensaje enviado en ${chatId}`, userId })
    return msg
  },
}

export const notificationService = {
  async getNotifications(userId) {
    await delay()
    return db.query('notifications', n => n.userId === userId || !n.userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  },

  async create(data) {
    await delay()
    const notif = db.insert('notifications', { read: false, ...data })
    return notif
  },

  async markAsRead(id) {
    await delay()
    return db.update('notifications', id, { read: true })
  },

  async markAllAsRead(userId) {
    await delay()
    const notifs = db.query('notifications', n => (n.userId === userId || !n.userId) && !n.read)
    notifs.forEach(n => db.update('notifications', n.id, { read: true }))
    return true
  },

  async getUnreadCount(userId) {
    await delay()
    return db.query('notifications', n => (n.userId === userId || !n.userId) && !n.read).length
  },
}

const NOTIFS = [
  { title: 'Bienvenido a Javaline', message: 'Tu plataforma de gestión empresarial está lista.', type: 'info', userId: 'user_admin' },
  { title: 'Factura INV-006 pagada', message: 'El cliente Distribuidora Ortiz ha realizado el pago.', type: 'success', userId: 'user_admin' },
  { title: 'Stock bajo', message: 'Audífonos Bluetooth tiene solo 3 unidades en inventario.', type: 'warning', userId: 'user_admin' },
]
;(() => {
  const existing = db.getAll('notifications')
  if (existing.length === 0) {
    NOTIFS.forEach(n => db.insert('notifications', n))
  }
})()

export default createEntityService
