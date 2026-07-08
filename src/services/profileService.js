import db from './db'
import authService from './authService'

function delay(ms = 200) { return new Promise(r => setTimeout(r, ms)) }

const profileService = {
  async getProfile(userId) {
    await delay()
    return authService.getUserById(userId)
  },

  async updateProfile(userId, data) {
    await delay(400)
    const allowed = ['name', 'phone', 'position', 'bio', 'notificationEmail', 'altEmail', 'photo']
    const changes = {}
    Object.keys(data).forEach(k => { if (allowed.includes(k)) changes[k] = data[k] })
    if (!changes.name?.trim()) throw new Error('El nombre es requerido')
    const updated = await authService.updateUser(userId, changes)
    db.addAudit({ action: 'update_profile', store: 'users', detail: `Perfil actualizado: ${updated.email}`, userId })
    return updated
  },

  async updatePhoto(userId, photoDataUrl) {
    await delay(300)
    const updated = db.update('users', userId, { photo: photoDataUrl })
    db.addAudit({ action: 'update_photo', store: 'users', detail: 'Foto de perfil actualizada', userId })
    return updated
  },

  async getSettings(userId) {
    await delay()
    const settings = db.query('settings', s => s.userId === userId)
    return settings[0] || { userId, theme: 'dark', notifications: true, language: 'es' }
  },

  async updateSettings(userId, settingsData) {
    await delay()
    const existing = db.query('settings', s => s.userId === userId)
    if (existing[0]) {
      db.update('settings', existing[0].id, settingsData)
    } else {
      db.insert('settings', { userId, ...settingsData })
    }
    db.addAudit({ action: 'update_settings', store: 'settings', detail: 'Configuración actualizada', userId })
    return true
  },
}

export default profileService
