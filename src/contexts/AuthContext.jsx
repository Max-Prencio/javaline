import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import authService from '../services/authService'
import api from '../services/apiClient'
import notificationService from '../services/notificationService'
import securityService from '../services/securityService'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [sessionExpiresAt, setSessionExpiresAt] = useState(null)
  const sessionCheckRef = useRef(null)

  // Restore session on mount
  useEffect(() => {
    const session = securityService.getSession()
    if (session) {
      setUser(session)
      setSessionExpiresAt(new Date(session.expiresAt).getTime())
      notificationService.getUnreadCount(session.userId).then(setUnreadNotifs).catch(() => {})
    }
    setLoading(false)
  }, [])

  // Track user activity to refresh session
  useEffect(() => {
    if (!user) return

    const handleActivity = () => {
      securityService.refreshSession()
      setSessionExpiresAt(Date.now() + 30 * 60 * 1000)
    }

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(e => window.addEventListener(e, handleActivity))

    return () => events.forEach(e => window.removeEventListener(e, handleActivity))
  }, [user])

  // Check session expiry periodically
  useEffect(() => {
    if (!user) return

    sessionCheckRef.current = setInterval(() => {
      if (securityService.isSessionExpired()) {
        setUser(null)
        setError('Sesión expirada. Inicia sesión nuevamente.')
      }
    }, 10000)

    return () => {
      if (sessionCheckRef.current) clearInterval(sessionCheckRef.current)
    }
  }, [user])

  const login = useCallback(async (email, password) => {
    try {
      const result = await authService.login(email, password)
      setError('')
      setUser(result)
      setSessionExpiresAt(Date.now() + 30 * 60 * 1000)
      if (result.id) notificationService.getUnreadCount(result.id).then(setUnreadNotifs).catch(() => {})
      return true
    } catch (e) {
      setError(e.message || 'Error al iniciar sesión')
      return false
    }
  }, [])

  const verifyTwoFactor = useCallback(async (email, code) => {
    try {
      const result = await authService.verifyTwoFactor(email, code)
      setUser(result)
      setSessionExpiresAt(Date.now() + 30 * 60 * 1000)
      setError('')
      return true
    } catch (e) {
      setError(e.message || 'Error al verificar 2FA')
      return false
    }
  }, [])

  const register = useCallback(async (data) => {
    try {
      const u = await authService.register(data)
      setUser(u)
      setError('')
      setSessionExpiresAt(Date.now() + 30 * 60 * 1000)
      return true
    } catch (e) {
      setError(e.message || 'Error al registrar')
      return false
    }
  }, [])

  const acceptInvitation = useCallback(async (code, name, password) => {
    try {
      const u = await authService.acceptInvitation(code, name, password)
      setUser(u)
      setError('')
      securityService.createSession(u)
      setSessionExpiresAt(Date.now() + 30 * 60 * 1000)
      return true
    } catch (e) {
      setError(e.message || 'Error al aceptar invitación')
      return false
    }
  }, [])

  const updateProfile = useCallback(async (data) => {
    try {
      const { default: profileService } = await import('../services/profileService')
      const updated = await profileService.updateProfile(user.userId || user.id, data)
      setUser({ ...user, ...updated })
      securityService.refreshSession()
      setError('')
      return true
    } catch (e) {
      setError(e.message || 'Error al actualizar perfil')
      return false
    }
  }, [user])

  const updatePhoto = useCallback(async (photoDataUrl) => {
    try {
      const { default: profileService } = await import('../services/profileService')
      const updated = await profileService.updatePhoto(user.userId || user.id, photoDataUrl)
      setUser({ ...user, photo: updated?.photo })
      setError('')
      return true
    } catch (e) {
      setError(e.message || 'Error al actualizar foto')
      return false
    }
  }, [user])

  const logout = useCallback(() => {
    api.clearToken()
    securityService.destroySession()
    setUser(null)
    setError('')
    setSessionExpiresAt(null)
  }, [])

  const refreshNotifs = useCallback(async () => {
    if (user) {
      const count = await notificationService.getUnreadCount(user.userId || user.id)
      setUnreadNotifs(count)
    }
  }, [user])

  return (
    <AuthContext.Provider value={{
      user, login, register, logout, updateProfile, updatePhoto,
      acceptInvitation, error, setError, loading, unreadNotifs, refreshNotifs,
      verifyTwoFactor, sessionExpiresAt,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
