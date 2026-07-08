import db from './db'

function delay(ms = 200) { return new Promise(r => setTimeout(r, ms)) }

function createNotificationService() {
  return {
    async list(userId) {
      await delay()
      return db.query('notifications', n => n.userId === userId || !n.userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    },

    async create(data) {
      await delay(200)
      return db.insert('notifications', { read: false, ...data, createdAt: new Date().toISOString() })
    },

    async markRead(id) {
      await delay(100)
      return db.update('notifications', id, { read: true })
    },

    async markAllRead(userId) {
      await delay(200)
      const notifs = db.query('notifications', n => (n.userId === userId || !n.userId) && !n.read)
      notifs.forEach(n => db.update('notifications', n.id, { read: true }))
      return true
    },

    async getUnreadCount(userId) {
      await delay()
      return db.query('notifications', n => (n.userId === userId || !n.userId) && !n.read).length
    },
  }
}

export default createNotificationService()
