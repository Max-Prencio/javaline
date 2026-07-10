import api from './apiClient'

const inventoryService = {
  async list(filters = {}) {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.category) params.set('category', filters.category)
    if (filters.stockFilter) params.set('stock_filter', filters.stockFilter)
    const qs = params.toString()
    return api.get(`/inventory${qs ? `?${qs}` : ''}`)
  },

  async getById(id) {
    return api.get(`/inventory/${id}`)
  },

  async create(data, userId) {
    return api.post('/inventory', data)
  },

  async update(id, changes, userId) {
    return api.put(`/inventory/${id}`, changes)
  },

  async remove(id, userId) {
    return api.delete(`/inventory/${id}`)
  },

  async adjustStock(id, quantity, reason, userId) {
    return api.post(`/inventory/${id}/adjust`, { quantity, reason })
  },

  async receiveFromPurchase(purchaseOrder, userId) {
    return api.post(`/purchases/${purchaseOrder.id}/receive`)
  },

  async getStockMovements(productId = null, limit = 50) {
    if (productId) return api.get(`/inventory/${productId}/movements`)
    return api.get('/inventory/movements')
  },

  async getCategories() {
    const items = await api.get('/inventory')
    return [...new Set(items.map(i => i.category))].sort()
  },

  async getLowStockItems() {
    return api.get('/inventory?stock_filter=low')
  },

  async getStats() {
    return api.get('/inventory/stats/summary')
  },
}

export default inventoryService
