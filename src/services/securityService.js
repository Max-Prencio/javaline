import bcrypt from 'bcryptjs'
import * as OTPAuth from 'otpauth'
import QRCode from 'qrcode'
import db from './db'

const SALT_ROUNDS = 12
const SESSION_TIMEOUT_MS = 30 * 60 * 1000
const ENCRYPTION_KEY_STORE = 'javaline_enc_key'
const ENCRYPTION_PREFIX = 'enc:'

async function generateKey() {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
  const raw = await crypto.subtle.exportKey('raw', key)
  const base64 = btoa(String.fromCharCode(...new Uint8Array(raw)))
  localStorage.setItem(ENCRYPTION_KEY_STORE, base64)
  return key
}

async function getKey() {
  const stored = localStorage.getItem(ENCRYPTION_KEY_STORE)
  if (!stored) return generateKey()
  const raw = Uint8Array.from(atob(stored), c => c.charCodeAt(0))
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}

const securityService = {
  // --- PASSWORD HASHING ---
  async hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS)
  },

  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash)
  },

  async hashPasswordSync(password) {
    return bcrypt.hashSync(password, SALT_ROUNDS)
  },

  // --- DATA ENCRYPTION (AES-256-GCM) ---
  async encrypt(text) {
    try {
      const key = await getKey()
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const encoded = new TextEncoder().encode(text)
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
      )
      const combined = new Uint8Array(iv.length + encrypted.byteLength)
      combined.set(iv)
      combined.set(new Uint8Array(encrypted), iv.length)
      return ENCRYPTION_PREFIX + btoa(String.fromCharCode(...combined))
    } catch {
      return text
    }
  },

  async decrypt(text) {
    if (!text || !text.startsWith(ENCRYPTION_PREFIX)) return text
    try {
      const key = await getKey()
      const raw = Uint8Array.from(atob(text.slice(ENCRYPTION_PREFIX.length)), c => c.charCodeAt(0))
      const iv = raw.slice(0, 12)
      const data = raw.slice(12)
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      )
      return new TextDecoder().decode(decrypted)
    } catch {
      return text
    }
  },

  async encryptField(obj, field) {
    if (!obj[field]) return obj
    return { ...obj, [field]: await this.encrypt(String(obj[field])) }
  },

  async decryptFields(obj, fields) {
    const result = { ...obj }
    for (const field of fields) {
      if (result[field]) result[field] = await this.decrypt(result[field])
    }
    return result
  },

  // --- INPUT SANITIZATION ---
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

  // --- SESSION MANAGEMENT ---
  createSession(user) {
    const session = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions || [],
      loginAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + SESSION_TIMEOUT_MS).toISOString(),
      fingerprint: this.getFingerprint(),
    }
    localStorage.setItem('javaline_session', JSON.stringify(session))
    localStorage.setItem('javaline_session_start', String(Date.now()))
    return session
  },

  getSession() {
    try {
      const raw = localStorage.getItem('javaline_session')
      if (!raw) return null
      const session = JSON.parse(raw)
      if (new Date(session.expiresAt) < new Date()) {
        this.destroySession()
        return null
      }
      return session
    } catch {
      this.destroySession()
      return null
    }
  },

  refreshSession() {
    const session = this.getSession()
    if (!session) return false
    session.expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MS).toISOString()
    localStorage.setItem('javaline_session', JSON.stringify(session))
    localStorage.setItem('javaline_session_start', String(Date.now()))
    return true
  },

  destroySession() {
    localStorage.removeItem('javaline_session')
    localStorage.removeItem('javaline_session_start')
  },

  isSessionExpired() {
    const session = this.getSession()
    return !session
  },

  // --- DEVICE FINGERPRINT ---
  getFingerprint() {
    const nav = navigator
    const screen = window.screen
    const components = [
      nav.userAgent,
      nav.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      nav.hardwareConcurrency,
    ]
    let hash = 0
    const str = components.join('||')
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash |= 0
    }
    return Math.abs(hash).toString(36)
  },

  // --- PERMISSION CHECKING ---
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

  // --- VALIDATION ---
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

  // --- SECURITY AUDIT ---
  async getSecurityAudit(userId = null, limit = 100) {
    const filters = { limit }
    if (userId) filters.userId = userId
    return db.getAudit(filters)
  },

  getSecurityScore() {
    let score = 0
    const checks = []

    // Password hashing
    const users = db.getAll('users')
    const hasHashedPasswords = users.every(u => u.password?.startsWith('$2a$') || u.password?.startsWith('$2b$'))
    if (hasHashedPasswords) { score += 20; checks.push({ pass: true, text: 'Contraseñas hasheadas con bcrypt' }) }
    else { checks.push({ pass: false, text: 'Contraseñas almacenadas en texto plano' }) }

    // Encryption key exists
    if (localStorage.getItem(ENCRYPTION_KEY_STORE)) { score += 15; checks.push({ pass: true, text: 'Cifrado AES-256-GCM configurado' }) }
    else { checks.push({ pass: false, text: 'Cifrado de datos no configurado' }) }

    // Session active
    const session = this.getSession()
    if (session) { score += 15; checks.push({ pass: true, text: 'Sesión activa con expiración' }) }
    else { checks.push({ pass: false, text: 'Sin sesión activa' }) }

    // Audit trail
    const auditCount = db.getAudit().length
    if (auditCount > 0) { score += 15; checks.push({ pass: true, text: `Registro de auditoría activo (${auditCount} eventos)` }) }
    else { checks.push({ pass: false, text: 'Sin registro de auditoría' }) }

    // User permissions
    const hasPermissions = users.every(u => u.permissions?.length > 0)
    if (hasPermissions) { score += 15; checks.push({ pass: true, text: 'Usuarios con permisos asignados' }) }
    else { checks.push({ pass: false, text: 'Usuarios sin permisos definidos' }) }

    // Multiple users
    if (users.length > 1) { score += 10; checks.push({ pass: true, text: `Múltiples usuarios (${users.length})` }) }
    else { checks.push({ pass: false, text: 'Solo un usuario registrado' }) }

    // 2FA check
    const twoFactorUsers = users.filter(u => u.twoFactorEnabled)
    if (twoFactorUsers.length > 0) { score += 10; checks.push({ pass: true, text: `${twoFactorUsers.length} usuario(s) con 2FA habilitado` }) }
    else { checks.push({ pass: false, text: 'Autenticación de dos factores (2FA) no habilitada' }) }

    return { score, maxScore: 100, checks }
  },

  // --- 2FA TOTP (RFC 6238 — compatible con Google Authenticator, Authy, etc.) ---
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
      // window: 1 allows ±30s clock drift
      const delta = totp.validate({ token: String(code), window: 1 })
      return delta !== null
    } catch {
      return false
    }
  },
}

export default securityService
