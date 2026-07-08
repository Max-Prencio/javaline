import db from './db'
import securityService from './securityService'

function delay(ms = 300) { return new Promise(r => setTimeout(r, ms)) }

const authService = {
  async login(email, password) {
    await delay()
    const users = db.getAll('users')
    const user = users.find(u => u.email === email && u.status === 'active')
    if (!user) throw new Error('Credenciales inválidas o cuenta inactiva')

    const passwordMatch = await securityService.verifyPassword(password, user.password)
    if (!passwordMatch) throw new Error('Credenciales inválidas o cuenta inactiva')

    const { password: _, ...safeUser } = user

    if (user.twoFactorEnabled) {
      db.addAudit({ action: 'login_pending_2fa', store: 'users', detail: `2FA pendiente: ${email}`, userId: user.id })
      return { twoFactorRequired: true, tempUser: safeUser }
    }

    securityService.createSession(safeUser)
    db.addAudit({ action: 'login', store: 'users', detail: `Inicio de sesión: ${email}`, userId: user.id })
    return safeUser
  },

  async verifyTwoFactor(email, code) {
    await delay()
    const users = db.getAll('users')
    const user = users.find(u => u.email === email && u.status === 'active')
    if (!user) throw new Error('Usuario no encontrado')
    if (!user.twoFactorSecret) throw new Error('2FA no configurado')

    const valid = securityService.verifyTwoFactorCode(user.twoFactorSecret, code)
    if (!valid) throw new Error('Código 2FA inválido')

    const { password: _, ...safeUser } = user
    securityService.createSession(safeUser)
    db.addAudit({ action: 'login_2fa_complete', store: 'users', detail: `2FA completado: ${email}`, userId: user.id })
    return safeUser
  },

  async register(data) {
    await delay(500)
    const users = db.getAll('users')
    if (users.find(u => u.email === data.email)) throw new Error('El correo ya está registrado')
    if (!data.email || !data.password) throw new Error('Correo y contraseña requeridos')

    const passwordValidation = securityService.validatePassword(data.password)
    if (!passwordValidation.valid) {
      throw new Error('Contraseña no cumple requisitos: ' + passwordValidation.errors.join('. '))
    }

    const hashedPassword = await securityService.hashPassword(data.password)
    const sanitized = securityService.sanitizeObject({
      name: data.name || data.email.split('@')[0],
      email: data.email,
      phone: data.phone || '',
      position: data.position || '',
      bio: '',
      notificationEmail: data.email,
      altEmail: '',
    })

    const newUser = db.insert('users', {
      ...sanitized,
      password: hashedPassword,
      role: 'employee',
      photo: null,
      status: 'active',
      permissions: [],
    })

    db.addAudit({ action: 'register', store: 'users', detail: `Registro: ${data.email}`, userId: newUser.id })
    const { password: _, ...safeUser } = newUser
    return safeUser
  },

  async getUsers() {
    await delay()
    return db.getAll('users').map(({ password, ...u }) => u)
  },

  async getUserById(id) {
    await delay()
    const user = db.getById('users', id)
    if (!user) return null
    const { password: _, ...safeUser } = user
    return safeUser
  },

  async updateUser(id, changes) {
    await delay()
    const allowed = ['name', 'phone', 'position', 'bio', 'notificationEmail', 'altEmail', 'photo', 'permissions', 'role', 'status', 'twoFactorEnabled', 'twoFactorSecret']
    const clean = {}
    Object.keys(changes).forEach(k => { if (allowed.includes(k)) clean[k] = changes[k] })

    if (clean.password) {
      if (clean.password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres')
      clean.password = await securityService.hashPassword(clean.password)
    }

    const sanitized = securityService.sanitizeObject(clean)
    const updated = db.update('users', id, sanitized)
    if (!updated) throw new Error('Usuario no encontrado')
    db.addAudit({ action: 'update_user', store: 'users', detail: `Usuario actualizado: ${updated.email}`, userId: id })
    const { password: _, ...safeUser } = updated
    return safeUser
  },

  async changePassword(id, currentPassword, newPassword) {
    await delay()
    const user = db.getById('users', id)
    if (!user) throw new Error('Usuario no encontrado')

    const valid = await securityService.verifyPassword(currentPassword, user.password)
    if (!valid) throw new Error('Contraseña actual incorrecta')

    const validation = securityService.validatePassword(newPassword)
    if (!validation.valid) throw new Error(validation.errors.join('. '))

    const hashed = await securityService.hashPassword(newPassword)
    db.update('users', id, { password: hashed })
    db.addAudit({ action: 'change_password', store: 'users', detail: 'Contraseña cambiada', userId: id })
    return true
  },

  async changePasswordAdmin(id, newPassword) {
    await delay()
    const user = db.getById('users', id)
    if (!user) throw new Error('Usuario no encontrado')

    const validation = securityService.validatePassword(newPassword)
    if (!validation.valid) throw new Error(validation.errors.join('. '))

    const hashed = await securityService.hashPassword(newPassword)
    db.update('users', id, { password: hashed })
    db.addAudit({ action: 'admin_reset_password', store: 'users', detail: `Contraseña restablecida: ${user.email}`, userId: id })
    return true
  },

  // INVITATIONS
  async sendInvitation(email, invitedBy) {
    await delay(500)
    if (!securityService.validateEmail(email)) throw new Error('Correo inválido')
    const users = db.getAll('users')
    if (users.find(u => u.email === email)) throw new Error('El usuario ya existe')
    const invitations = db.getAll('invitations')
    const existing = invitations.find(i => i.email === email && i.status === 'pending')
    if (existing) throw new Error('Ya hay una invitación pendiente para este correo')
    const code = Math.random().toString(36).slice(2, 10).toUpperCase()
    const invitation = db.insert('invitations', {
      email, code, status: 'pending', invitedBy,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    db.addAudit({ action: 'send_invitation', store: 'invitations', detail: `Invitación enviada a ${email}`, userId: invitedBy })
    console.log(`[EMAIL SIMULADO] Invitación para ${email}: Código ${code}`)
    return { ...invitation, emailSent: true }
  },

  async acceptInvitation(code, name, password) {
    await delay(500)
    const invitations = db.getAll('invitations')
    const inv = invitations.find(i => i.code === code && i.status === 'pending')
    if (!inv) throw new Error('Código de invitación inválido')
    if (new Date(inv.expiresAt) < new Date()) throw new Error('La invitación ha expirado')
    const users = db.getAll('users')
    if (users.find(u => u.email === inv.email)) throw new Error('El correo ya está registrado')

    const passwordValidation = securityService.validatePassword(password)
    if (!passwordValidation.valid) throw new Error(passwordValidation.errors.join('. '))

    const hashedPassword = await securityService.hashPassword(password)
    const newUser = db.insert('users', {
      name, email: inv.email, password: hashedPassword, role: 'employee',
      photo: null, phone: '', position: '', bio: '',
      notificationEmail: inv.email, altEmail: '', status: 'active',
      permissions: [],
    })
    db.update('invitations', inv.id, { status: 'accepted', acceptedAt: new Date().toISOString() })
    db.addAudit({ action: 'accept_invitation', store: 'users', detail: `Invitación aceptada: ${inv.email}`, userId: newUser.id })
    const { password: _, ...safeUser } = newUser
    return safeUser
  },

  async getInvitations() {
    await delay()
    return db.getAll('invitations')
  },

  async resendInvitation(id) {
    const inv = db.update('invitations', id, { status: 'pending' })
    if (!inv) throw new Error('Invitación no encontrada')
    db.addAudit({ action: 'resend_invitation', store: 'invitations', detail: `Reenvío a ${inv.email}`, userId: 'system' })
    console.log(`[EMAIL SIMULADO] Reenvío de invitación para ${inv.email}: Código ${inv.code}`)
    return { ...inv, emailSent: true }
  },

  // DEACTIVATE / ACTIVATE
  async deactivateUser(id) {
    const user = db.update('users', id, { status: 'inactive' })
    db.addAudit({ action: 'deactivate_user', store: 'users', detail: `Usuario desactivado: ${user?.email}`, userId: 'system' })
    return user
  },

  async activateUser(id) {
    const user = db.update('users', id, { status: 'active' })
    db.addAudit({ action: 'activate_user', store: 'users', detail: `Usuario activado: ${user?.email}`, userId: 'system' })
    return user
  },
}

export default authService
