import api from './apiClient'
import securityService from './securityService'
import db from './db'
import bcrypt from 'bcryptjs'

// --- BRUTE FORCE PROTECTION ---
const ATTEMPTS_KEY = 'javaline_login_attempts'
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000 // 15 minutes

function getAttempts(email) {
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY)
    const all = raw ? JSON.parse(raw) : {}
    return all[email] || { count: 0, lockedUntil: null }
  } catch { return { count: 0, lockedUntil: null } }
}

function recordAttempt(email, success) {
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY)
    const all = raw ? JSON.parse(raw) : {}
    if (success) {
      delete all[email]
    } else {
      const prev = all[email] || { count: 0, lockedUntil: null }
      const count = prev.count + 1
      all[email] = {
        count,
        lockedUntil: count >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : null,
      }
    }
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(all))
  } catch {}
}

function checkLockout(email) {
  const att = getAttempts(email)
  if (att.lockedUntil && Date.now() < att.lockedUntil) {
    const mins = Math.ceil((att.lockedUntil - Date.now()) / 60000)
    throw new Error(`Cuenta bloqueada por ${mins} min. Demasiados intentos fallidos.`)
  }
}

// --- LOCAL FALLBACK ---
async function localLogin(email, password) {
  checkLockout(email)
  const users = db.getAll('users')
  const user = users.find(u => u.email?.toLowerCase() === email?.toLowerCase())
  if (!user) {
    recordAttempt(email, false)
    throw new Error('Credenciales inválidas')
  }
  if (user.status === 'inactive') throw new Error('Cuenta desactivada')
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    recordAttempt(email, false)
    const att = getAttempts(email)
    const remaining = MAX_ATTEMPTS - att.count
    if (remaining > 0) throw new Error(`Credenciales inválidas. ${remaining} intento(s) restante(s).`)
    throw new Error(`Cuenta bloqueada por 15 min. Demasiados intentos.`)
  }
  recordAttempt(email, true)
  // eslint-disable-next-line no-unused-vars
  const { password: _pw, ...safeUser } = user
  return safeUser
}

async function localRegister({ name, email, password }) {
  const users = db.getAll('users')
  if (users.find(u => u.email?.toLowerCase() === email?.toLowerCase())) {
    throw new Error('Ya existe una cuenta con ese correo')
  }
  const hashed = await bcrypt.hash(password, 12)
  const newUser = db.insert('users', {
    name: name || email.split('@')[0],
    email,
    password: hashed,
    role: 'employee',
    status: 'active',
    permissions: ['factura_cliente'],
    photo: null,
  })
  // eslint-disable-next-line no-unused-vars
  const { password: _pw, ...safeUser } = newUser
  return safeUser
}

function saveSession(user, token) {
  if (token) api.setToken(token)
  securityService.createSession({ ...user, userId: user.id || user.userId })
}

async function tryApi(fn) {
  try { return await fn() } catch { return null }
}

const authService = {
  async login(email, password) {
    const result = await tryApi(() => api.post('/auth/login', { email, password }))
    if (result?.user) {
      saveSession(result.user, result.access_token)
      return result.user
    }
    // Fallback local
    const user = await localLogin(email, password)
    // Check 2FA
    if (user.twoFactorEnabled) {
      return { twoFactorRequired: true, email: user.email }
    }
    saveSession(user, null)
    return user
  },

  async register(data) {
    const result = await tryApi(() => api.post('/auth/register', {
      name: data.name || data.email.split('@')[0],
      email: data.email,
      password: data.password,
    }))
    if (result?.user) {
      saveSession(result.user, result.access_token)
      return result.user
    }
    // Fallback local
    const user = await localRegister({
      name: data.name || data.email.split('@')[0],
      email: data.email,
      password: data.password,
    })
    saveSession(user, null)
    return user
  },

  async verifyTwoFactor(email, code) {
    const result = await tryApi(() => api.post('/auth/verify-2fa', { email, code }))
    if (result?.user) {
      saveSession(result.user, result.access_token)
      return result.user
    }
    // Fallback local
    const users = db.getAll('users')
    const user = users.find(u => u.email?.toLowerCase() === email?.toLowerCase())
    if (!user || !user.twoFactorEnabled) throw new Error('Usuario no encontrado')
    const valid = securityService.verifyTwoFactorCode(user.twoFactorSecret, code)
    if (!valid) throw new Error('Código 2FA inválido')
    // eslint-disable-next-line no-unused-vars
    const { password: _pw, ...safeUser } = user
    saveSession(safeUser, null)
    return safeUser
  },

  async getUsers() {
    const result = await tryApi(() => api.get('/users'))
    if (result) return result
    return db.getAll('users').map(({ password: _pw, ...u }) => u)
  },

  async getUserById(id) {
    const result = await tryApi(() => api.get(`/users/${id}`))
    if (result) return result
    const user = db.getById('users', id)
    if (!user) return null
    // eslint-disable-next-line no-unused-vars
    const { password: _pw, ...safeUser } = user
    return safeUser
  },

  async updateUser(id, changes) {
    const result = await tryApi(() => api.put(`/users/${id}`, changes))
    if (result) return result
    return db.update('users', id, changes)
  },

  async changePassword(id, currentPassword, newPassword) {
    const result = await tryApi(() =>
      api.post('/auth/change-password', { id, currentPassword, newPassword })
    )
    if (result) return result
    const user = db.getById('users', id)
    if (!user) throw new Error('Usuario no encontrado')
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) throw new Error('Contraseña actual incorrecta')
    const hashed = await bcrypt.hash(newPassword, 12)
    return db.update('users', id, { password: hashed })
  },

  async changePasswordAdmin(id, newPassword) {
    const result = await tryApi(() =>
      api.post('/auth/change-password-admin', { id, newPassword })
    )
    if (result) return result
    const hashed = await bcrypt.hash(newPassword, 12)
    return db.update('users', id, { password: hashed })
  },

  async sendInvitation(email, invitedBy) {
    const result = await tryApi(() => api.post('/auth/invite', { email, invitedBy }))
    if (result) return result
    const code = Math.random().toString(36).slice(2, 10).toUpperCase()
    return db.insert('invitations', {
      email, invitedBy, code,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
  },

  async acceptInvitation(code, name, password) {
    const result = await tryApi(() =>
      api.post('/auth/accept-invitation', { code, name, password })
    )
    if (result?.user) {
      saveSession(result.user, result.access_token)
      return result.user
    }
    // Fallback local
    const invitations = db.getAll('invitations')
    const inv = invitations.find(i => i.code === code && i.status === 'pending')
    if (!inv) throw new Error('Invitación inválida o expirada')
    if (new Date(inv.expiresAt) < new Date()) throw new Error('Invitación expirada')
    const hashed = await bcrypt.hash(password, 12)
    const newUser = db.insert('users', {
      name, email: inv.email, password: hashed,
      role: 'employee', status: 'active',
      permissions: ['factura_cliente'], photo: null,
    })
    db.update('invitations', inv.id, { status: 'accepted' })
    // eslint-disable-next-line no-unused-vars
    const { password: _pw, ...safeUser } = newUser
    saveSession(safeUser, null)
    return safeUser
  },

  async getInvitations() {
    const result = await tryApi(() => api.get('/auth/invitations'))
    if (result) return result
    return db.getAll('invitations')
  },

  async resendInvitation(id) {
    const result = await tryApi(() => api.post(`/auth/invitations/${id}/resend`))
    if (result) return result
    const code = Math.random().toString(36).slice(2, 10).toUpperCase()
    return db.update('invitations', id, {
      code,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
  },

  async deactivateUser(id) {
    const result = await tryApi(() => api.post(`/users/${id}/deactivate`))
    if (result) return result
    return db.update('users', id, { status: 'inactive' })
  },

  async activateUser(id) {
    const result = await tryApi(() => api.post(`/users/${id}/activate`))
    if (result) return result
    return db.update('users', id, { status: 'active' })
  },
}

export default authService
