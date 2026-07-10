import api from './apiClient'

const pocketService = {
  async getDashboard() {
    return api.get('/pocket/dashboard')
  },

  async getNotifications(limit = 20) {
    return api.get(`/pocket/notifications?limit=${limit}`)
  },

  async markNotificationRead(id) {
    return api.post(`/pocket/notifications/${id}/read`)
  },

  async markAllRead() {
    return api.post('/pocket/notifications/read-all')
  },

  async startCountSession() {
    return api.post('/pocket/inventory-count/start')
  },

  async scanProduct(sessionId, sku, location = {}) {
    return api.post('/pocket/inventory-count/scan', {
      session_id: sessionId,
      sku,
      ...location,
    })
  },

  async finishCountSession(sessionId, action = 'confirm') {
    return api.post('/pocket/inventory-count/finish', {
      session_id: sessionId,
      action,
    })
  },

  async getCountHistory() {
    return api.get('/pocket/inventory-count/history')
  },

  connectWs(tenantId, userId, onMessage) {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const wsUrl = `${protocol}://localhost:8000/pocket/ws/${tenantId}/${userId}`
    const ws = new WebSocket(wsUrl)
    ws.onmessage = (event) => {
      try {
        onMessage(JSON.parse(event.data))
      } catch {}
    }
    ws.onclose = () => setTimeout(() => this.connectWs(tenantId, userId, onMessage), 3000)
    return ws
  },
}

export default pocketService
