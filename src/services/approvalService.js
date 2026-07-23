import api from './apiClient'

const service = {
  async listHierarchies(filters = {}) {
    const params = new URLSearchParams()
    if (filters.currency) params.set('currency', filters.currency)
    const qs = params.toString()
    return api.get(`/approval-hierarchies${qs ? `?${qs}` : ''}`)
  },

  async getHierarchy(id) {
    return api.get(`/approval-hierarchies/${id}`)
  },

  async createHierarchy(data) {
    return api.post('/approval-hierarchies', data)
  },

  async updateHierarchy(id, changes) {
    return api.put(`/approval-hierarchies/${id}`, changes)
  },

  async removeHierarchy(id) {
    return api.delete(`/approval-hierarchies/${id}`)
  },

  async canApprove(currency, amount, userRole) {
    try {
      const result = await api.post('/approvals/can-approve', { currency, amount, userRole })
      return result
    } catch {
      return { allowed: false, reason: 'Error al verificar permisos', requiredRole: null }
    }
  },

  async getDefaultHierarchy(currency) {
    return api.get(`/approval-hierarchies/default?currency=${currency}`)
  },

  async approveOrder(orderId, data) {
    return api.post(`/approvals/${orderId}/approve`, {
      status: 'approved',
      amount_approved: data.amount_approved,
      comment: data.comment || '',
    })
  },

  async rejectOrder(orderId, data) {
    return api.post(`/approvals/${orderId}/reject`, {
      status: 'rejected',
      comment: data.comment || 'Solicitud rechazada',
    })
  },

  async getPendingApprovals() {
    return api.get('/approvals/pending')
  },

  async getApprovalHistory() {
    return api.get('/approvals/history')
  },
}

export default service
