import bcrypt from 'bcryptjs'
import * as OTPAuth from 'otpauth'
import QRCode from 'qrcode'
import db from './db'

const SALT_ROUNDS = 12

const securityService = {
  async hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS)
  },

  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash)
  },

  sanitize(str) {
    if (typeof str !== 'string') return str
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;' }
    return str.replace(/[&<>"'/]/g, c => map[c])
  },

  sanitizeObject(obj) {
    const result = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = typeof value === 'string' ? this.sanitize(value) : value
    }
    return result
  },

  hasPermission(user, requiredPermission) {
    if (!user || !user.permissions) return false
    if (user.role === 'admin' || user.permissions.includes('todos')) return true
    return user.permissions.includes(requiredPermission)
  },

  hasAnyPermission(user, permissions) {
    return permissions.some(p => this.hasPermission(user, p))
  },

  hasAllPermissions(user, permissions) {
    return permissions.every(p => this.hasPermission(user, p))
  },

  requirePermission(user, permission, action = '') {
    if (!this.hasPermission(user, permission)) {
      db.addAudit({
        action: 'permission_denied',
        store: 'system',
        detail: `Acceso denegado: ${action} requiere permiso "${permission}"`,
        userId: user?.id || 'unknown',
      })
      throw new Error(`No tienes permiso para realizar esta acción: ${action}`)
    }
    return true
  },

  validatePassword(password) {
    const errors = []
    if (!password || password.length < 8) errors.push('Debe tener al menos 8 caracteres')
    if (!/[A-Z]/.test(password)) errors.push('Debe contener una mayúscula')
    if (!/[a-z]/.test(password)) errors.push('Debe contener una minúscula')
    if (!/[0-9]/.test(password)) errors.push('Debe contener un número')
    if (!/[!@#$%^&*(),.?":{}|<>_-]/.test(password)) errors.push('Debe contener un carácter especial')
    return { valid: errors.length === 0, errors }
  },

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  },

  validateRNC(rnc) {
    return /^\d{3}-\d{5}-\d$/.test(rnc)
  },

  async getSecurityAudit(userId = null, limit = 100) {
    const filters = { limit }
    if (userId) filters.userId = userId
    return db.getAudit(filters)
  },

  getSecurityScore() {
    let score = 0
    const checks = []

    const users = db.getAll('users')
    const hasHashedPasswords = users.every(u => u.password?.startsWith('$2a$') || u.password?.startsWith('$2b$'))
    if (hasHashedPasswords) { score += 25; checks.push({ pass: true, text: 'Contraseñas hasheadas con bcrypt' }) }
    else { checks.push({ pass: false, text: 'Contraseñas almacenadas en texto plano' }) }

    const auditCount = db.getAudit().length
    if (auditCount > 0) { score += 25; checks.push({ pass: true, text: `Registro de auditoría activo (${auditCount} eventos)` }) }
    else { checks.push({ pass: false, text: 'Sin registro de auditoría' }) }

    const hasPermissions = users.every(u => u.permissions?.length > 0)
    if (hasPermissions) { score += 25; checks.push({ pass: true, text: 'Usuarios con permisos asignados' }) }
    else { checks.push({ pass: false, text: 'Usuarios sin permisos definidos' }) }

    const twoFactorUsers = users.filter(u => u.twoFactorEnabled)
    if (twoFactorUsers.length > 0) { score += 25; checks.push({ pass: true, text: `${twoFactorUsers.length} usuario(s) con 2FA habilitado` }) }
    else { checks.push({ pass: false, text: 'Autenticación de dos factores (2FA) no habilitada' }) }

    return { score, maxScore: 100, checks }
  },

  generateTwoFactorSecret(email = 'user') {
    const secret = new OTPAuth.Secret({ size: 20 })
    const base32 = secret.base32
    const formatted = base32.match(/.{1,4}/g).join(' ')
    const totp = new OTPAuth.TOTP({
      issuer: 'Javaline',
      label: email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret,
    })
    const uri = totp.toString()
    return { secret: base32, formatted, uri }
  },

  async generateTwoFactorQR(uri) {
    try {
      return await QRCode.toDataURL(uri, { width: 200, margin: 2, color: { dark: '#000', light: '#fff' } })
    } catch {
      return null
    }
  },

  generateTwoFactorCode(secretBase32) {
    try {
      const totp = new OTPAuth.TOTP({
        issuer: 'Javaline',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secretBase32.replace(/\s/g, '')),
      })
      return totp.generate()
    } catch {
      return null
    }
  },

  verifyTwoFactorCode(secretBase32, code) {
    try {
      const totp = new OTPAuth.TOTP({
        issuer: 'Javaline',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secretBase32.replace(/\s/g, '')),
      })
      const delta = totp.validate({ token: String(code), window: 1 })
      return delta !== null
    } catch {
      return false
    }
  },
}

export default securityService