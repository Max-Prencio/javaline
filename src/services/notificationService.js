import api from './apiClient'
import db from './db'

function delay(ms = 200) { return new Promise(r => setTimeout(r, ms)) }

async function tryApi(fn) {
  try { return await fn() } catch { return null }
}

function createNotificationService() {
  return {
    async list(userId) {
      const result = await tryApi(() => api.get(`/notifications?userId=${userId}`))
      if (result) return result
      await delay()
      return db.query('notifications', n => n.userId === userId || !n.userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    },

    async create(data) {
      const result = await tryApi(() => api.post('/notifications', data))
      if (result) return result
      await delay(200)
      return db.insert('notifications', { read: false, ...data, createdAt: new Date().toISOString() })
    },

    async markRead(id) {
      const result = await tryApi(() => api.put(`/notifications/${id}/read`, {}))
      if (result) return result
      await delay(100)
      return db.update('notifications', id, { read: true })
    },

    async markAllRead(userId) {
      const result = await tryApi(() => api.post('/notifications/read-all', { userId }))
      if (result) return result
      await delay(200)
      const notifs = db.query('notifications', n => (n.userId === userId || !n.userId) && !n.read)
      notifs.forEach(n => db.update('notifications', n.id, { read: true }))
      return true
    },

    async getUnreadCount(userId) {
      const result = await tryApi(() => api.get(`/notifications/unread-count?userId=${userId}`))
      if (result?.count != null) return result.count
      await delay()
      return db.query('notifications', n => (n.userId === userId || !n.userId) && !n.read).length
    },
  }
}

export default createNotificationService()
