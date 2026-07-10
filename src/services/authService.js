import api from './apiClient'
import securityService from './securityService'

function saveSession(user, token) {
  api.setToken(token)
  securityService.createSession({ ...user, userId: user.id })
}

const authService = {
  async login(email, password) {
    const result = await api.post('/auth/login', { email, password })
    saveSession(result.user, result.access_token)
    return result.user
  },

  async register(data) {
    const result = await api.post('/auth/register', {
      name: data.name || data.email.split('@')[0],
      email: data.email,
      password: data.password,
    })
    saveSession(result.user, result.access_token)
    return result.user
  },

  async getUsers() {
    return api.get('/users')
  },

  async getUserById(id) {
    return api.get(`/users/${id}`)
  },

  async updateUser(id, changes) {
    return api.put(`/users/${id}`, changes)
  },

  async changePassword(id, currentPassword, newPassword) {
    return api.post(`/auth/change-password`, { id, currentPassword, newPassword })
  },

  async changePasswordAdmin(id, newPassword) {
    return api.post(`/auth/change-password-admin`, { id, newPassword })
  },

  async sendInvitation(email, invitedBy) {
    return api.post('/auth/invite', { email, invitedBy })
  },

  async acceptInvitation(code, name, password) {
    const result = await api.post('/auth/accept-invitation', { code, name, password })
    saveSession(result.user, result.access_token)
    return result.user
  },

  async getInvitations() {
    return api.get('/auth/invitations')
  },

  async resendInvitation(id) {
    return api.post(`/auth/invitations/${id}/resend`)
  },

  async deactivateUser(id) {
    return api.post(`/users/${id}/deactivate`)
  },

  async activateUser(id) {
    return api.post(`/users/${id}/activate`)
  },
}

export default authService
