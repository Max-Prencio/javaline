import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiShield, FiUsers, FiCheck, FiMinus, FiSearch, FiClock, FiKey, FiSmartphone, FiLock, FiAlertTriangle, FiCheckCircle, FiCopy, FiRefreshCw, FiDownload, FiTrash2, FiUnlock, FiMail } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import securityService from '../services/securityService'
import authService from '../services/authService'
import { roleService } from '../services/entityService'

const MODULES = ['Dashboard', 'Facturación', 'CRM', 'RRHH', 'Compras', 'Agenda', 'Reuniones', 'Ventas', 'Tareas']

const GROUPS = [
  {
    id: 'access',
    label: 'Acceso',
    icon: FiUsers,
    tabs: [
      { id: 'roles', label: 'Roles y Permisos', icon: FiUsers },
    ],
  },
  {
    id: 'auth',
    label: 'Autenticación',
    icon: FiKey,
    tabs: [
      { id: '2fa', label: '2FA', icon: FiSmartphone },
      { id: 'session', label: 'Sesión', icon: FiKey },
      { id: 'score', label: 'Score de Seguridad', icon: FiShield },
    ],
  },
  {
    id: 'audit',
    label: 'Auditoría',
    icon: FiClock,
    tabs: [
      { id: 'audit', label: 'Auditoría', icon: FiClock },
      { id: 'privacy', label: 'Privacidad', icon: FiShield },
    ],
  },
  {
    id: 'lockout',
    label: 'Cuentas',
    icon: FiLock,
    tabs: [
      { id: 'locked', label: 'Cuentas Bloqueadas', icon: FiLock },
    ],
  },
]

const ACCESS_MATRIX = {
  Administrador: MODULES.reduce((acc, m) => ({ ...acc, [m]: true }), {}),
  Gerente: { Dashboard: true, Facturación: true, CRM: false, RRHH: true, Compras: true, Agenda: false, Reuniones: true, Ventas: true, Tareas: false },
  Ventas: { Dashboard: true, Facturación: false, CRM: true, RRHH: false, Compras: false, Agenda: true, Reuniones: false, Ventas: true, Tareas: true },
  Empleado: { Dashboard: false, Facturación: false, CRM: false, RRHH: false, Compras: false, Agenda: true, Reuniones: false, Ventas: false, Tareas: true },
}

const BADGE = {
  total: { bg: 'var(--accent)', color: 'white' },
  alto: { bg: 'var(--warning)', color: 'white' },
  medio: { bg: 'var(--accent-subtle)', color: 'var(--accent)' },
  básico: { bg: 'var(--bg-elevated)', color: 'var(--text-muted)' },
}

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }

export default function Security() {
  const { user } = useAuth()
  const [hoveredCell, setHoveredCell] = useState(null)
  const [search, setSearch] = useState('')
  const [group, setGroup] = useState('access')
  const [tab, setTab] = useState('roles')
  const [auditLog, setAuditLog] = useState([])
  const [securityScore, setSecurityScore] = useState(null)
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [twoFactorSecret, setTwoFactorSecret] = useState('')
  const [twoFactorFormatted, setTwoFactorFormatted] = useState('')
  const [twoFactorQR, setTwoFactorQR] = useState(null)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [twoFactorError, setTwoFactorError] = useState('')
  const [twoFactorSuccess, setTwoFactorSuccess] = useState(false)
  const [sessionInfo, setSessionInfo] = useState(null)
  const [copied, setCopied] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [exportLoading, setExportLoading] = useState(false)
  const [lockedAccounts, setLockedAccounts] = useState([])
  const [lockoutMsg, setLockoutMsg] = useState({})

  const loadLockedAccounts = () =>
    fetch('/admin/accounts/locked', { credentials: 'include' })
      .then(r => r.json()).then(setLockedAccounts).catch(() => {})

  const handleUnlock = async (id) => {
    setLockoutMsg(m => ({ ...m, [id]: 'Desbloqueando...' }))
    const res = await fetch(`/admin/accounts/${id}/unlock`, { method: 'POST', credentials: 'include' })
    const data = await res.json()
    setLockoutMsg(m => ({ ...m, [id]: data.message || 'Listo' }))
    loadLockedAccounts()
  }

  const handleSendReset = async (id) => {
    setLockoutMsg(m => ({ ...m, [id]: 'Enviando correo...' }))
    const res = await fetch(`/admin/accounts/${id}/send-password-reset`, { method: 'POST', credentials: 'include' })
    const data = await res.json()
    setLockoutMsg(m => ({ ...m, [id]: data.message || 'Enviado' }))
  }

  useEffect(() => {
    securityService.getSecurityAudit(null, 50).then(setAuditLog)
    setSecurityScore(securityService.getSecurityScore())
    authService.getUsers().then(setUsers)
    roleService.list().then(setRoles)
    setSessionInfo(user ? { userId: user.id || user.userId, email: user.email, role: user.role } : null)
    if (user?.role === 'admin') loadLockedAccounts()
  }, [user])

  const filteredRoles = roles.filter((r) => (r.name || '').toLowerCase().includes(search.toLowerCase()))

  const handleEnable2FA = async () => {
    const email = user?.email || 'user'
    const { secret, formatted, uri } = securityService.generateTwoFactorSecret(email)
    setTwoFactorSecret(secret)
    setTwoFactorFormatted(formatted)
    const qr = await securityService.generateTwoFactorQR(uri)
    setTwoFactorQR(qr)
    setShow2FASetup(true)
    setTwoFactorSuccess(false)
    setTwoFactorCode('')
    setTwoFactorError('')
  }

  const handleVerify2FA = async () => {
    setTwoFactorError('')
    if (securityService.verifyTwoFactorCode(twoFactorSecret, twoFactorCode)) {
      await authService.updateUser(user?.userId || user?.id, { twoFactorEnabled: true, twoFactorSecret })
      setTwoFactorSuccess(true)
      setSecurityScore(securityService.getSecurityScore())
    } else {
      setTwoFactorError('Código inválido. Asegúrate de que tu app esté sincronizada.')
    }
  }

  const handleExportData = async () => {
    setExportLoading(true)
    try {
      const userId = user?.id || user?.userId
      const result = await authService.exportUserData(userId)
      const json = JSON.stringify(result, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `javaline-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExportLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteText !== 'ELIMINAR') return
    const userId = user?.id || user?.userId
    await authService.deleteAccount(userId, user?.email)
    window.location.href = '/login'
  }

  const handleRefreshScore = () => setSecurityScore(securityService.getSecurityScore())

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentGroup = GROUPS.find(g => g.id === group)

  const renderScore = () => {
    if (!securityScore) return null
    const { score, checks } = securityScore
    const color = score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)'

    return (
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }} style={{
        background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden', padding: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiShield style={{ width: 20, height: 20, color: 'var(--accent)' }} />
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Score de Seguridad</h2>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleRefreshScore}
            style={{ background: 'var(--accent-subtle)', border: 'none', borderRadius: 8, padding: '8px 12px', color: 'var(--accent)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiRefreshCw size={14} /> Recalcular
          </motion.button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 24 }}>
          <div style={{ position: 'relative', width: 100, height: 100 }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="8"
                strokeDasharray={`${(score / 100) * 264} 264`} strokeLinecap="round" transform="rotate(-90 50 50)" />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>{score}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/100</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              {score >= 80 ? 'Buena' : score >= 50 ? 'Regular' : 'Crítica'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {checks.filter(c => c.pass).length} de {checks.length} verificaciones aprobadas
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {checks.map((check, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: check.pass ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${check.pass ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
              {check.pass ? <FiCheckCircle style={{ width: 16, height: 16, color: 'var(--success)', flexShrink: 0 }} /> : <FiAlertTriangle style={{ width: 16, height: 16, color: '#ef4444', flexShrink: 0 }} />}
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{check.text}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    )
  }

  const renderAudit = () => (
    <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }} style={{
      background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 24px', borderBottom: '1px solid var(--border-light)' }}>
        <FiClock style={{ width: 16, height: 16, color: 'var(--accent)' }} />
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Registro de Auditoría</h2>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>{auditLog.length} eventos</span>
      </div>
      <div style={{ maxHeight: 400, overflow: 'auto' }}>
        {auditLog.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No hay eventos de auditoría</div>
        ) : (
          auditLog.slice(0, 50).map((entry, i) => (
            <motion.div key={entry.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FiShield style={{ width: 12, height: 12, color: 'var(--accent)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{entry.detail}</div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>{entry.action}</span>
                  <span>{entry.store}</span>
                  {entry.timestamp && <span>{new Date(entry.timestamp).toLocaleString()}</span>}
                </div>
              </div>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-elevated)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{entry.userId}</span>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )

  const render2FA = () => (
    <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }} style={{
      background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden', padding: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <FiSmartphone style={{ width: 16, height: 16, color: 'var(--accent)' }} />
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Autenticación en Dos Pasos (2FA)</h2>
      </div>

      {!show2FASetup ? (
        <div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
            Añade una capa extra de seguridad a tu cuenta. Al activar 2FA, además de tu contraseña
            se te pedirá un código de verificación cada vez que inicies sesión.
          </p>
          {users.find(u => (u.id === user?.userId || u.id === user?.id))?.twoFactorEnabled ? (
            <div style={{ padding: 16, borderRadius: 12, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <FiCheckCircle style={{ width: 20, height: 20, color: 'var(--success)' }} />
              <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>2FA está activo en tu cuenta</span>
            </div>
          ) : (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleEnable2FA}
              style={{ background: 'var(--accent)', border: 'none', borderRadius: 10, padding: '12px 24px', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiLock size={16} /> Activar 2FA
            </motion.button>
          )}
        </div>
      ) : (
        <div>
          {twoFactorSuccess ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: 24 }}>
              <FiCheckCircle style={{ width: 48, height: 48, color: 'var(--success)', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>2FA Activado</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>Tu cuenta ahora está protegida con autenticación en dos pasos.</p>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShow2FASetup(false)}
                style={{ background: 'var(--accent)', border: 'none', borderRadius: 10, padding: '10px 24px', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Continuar
              </motion.button>
            </motion.div>
          ) : (
            <div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Escanea este código con tu app de autenticación (Google Authenticator, Authy, etc.)
                o ingresa manualmente la clave secreta.
              </p>
              {/* QR Code */}
              {twoFactorQR && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ padding: 12, background: '#fff', borderRadius: 12, border: '1px solid var(--border)', display: 'inline-block' }}>
                    <img src={twoFactorQR} alt="QR 2FA" width={180} height={180} />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
                    Escanea con Google Authenticator, Authy o cualquier app TOTP
                  </p>
                </div>
              )}
              <div style={{ padding: 16, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Clave secreta (manual)</span>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => copyToClipboard(twoFactorFormatted)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {copied ? <FiCheck size={14} /> : <FiCopy size={14} />} {copied ? 'Copiado' : 'Copiar'}
                  </motion.button>
                </div>
                <code style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 3, fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-all' }}>{twoFactorFormatted}</code>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Verifica el código</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="text" placeholder="000000" value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    style={{ ...styles.input, width: 160, textAlign: 'center', fontSize: 22, letterSpacing: 6, fontFamily: "'JetBrains Mono', monospace" }} />
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleVerify2FA}
                    style={{ background: 'var(--accent)', border: 'none', borderRadius: 10, padding: '12px 20px', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    Verificar
                  </motion.button>
                </div>
                {twoFactorError && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{twoFactorError}</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )

  const renderSession = () => (
    <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }} style={{
      background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden', padding: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <FiKey style={{ width: 16, height: 16, color: 'var(--accent)' }} />
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Sesión Actual</h2>
      </div>
      {sessionInfo ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: 'var(--bg-elevated)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Usuario</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{sessionInfo.name} ({sessionInfo.email})</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: 'var(--bg-elevated)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Rol</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{sessionInfo.role}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: 'var(--bg-elevated)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Inicio de sesión</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{new Date(sessionInfo.loginAt).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: 'var(--bg-elevated)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Expira</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{new Date(sessionInfo.expiresAt).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: 'var(--bg-elevated)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Dispositivo</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{sessionInfo.fingerprint}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: 'var(--bg-elevated)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Tiempo restante</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--success)' }}>
              {Math.max(0, Math.floor((new Date(sessionInfo.expiresAt) - new Date()) / 60000))} minutos
            </span>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
          No hay sesión activa
        </div>
      )}
    </motion.div>
  )

  return (
    <div className="p-6 space-y-8">
      <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ padding: 10, borderRadius: 12, background: 'var(--accent-gradient)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <FiShield style={{ width: 20, height: 20, color: 'white' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Seguridad
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Gestión de roles, permisos, 2FA y control de acceso
            </p>
          </div>
        </div>
      </motion.div>

      {/* Level 1 — Group bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 8 }}>
        {GROUPS.map(g => {
          const Icon = g.icon
          const active = group === g.id
          return (
            <button key={g.id} onClick={() => { setGroup(g.id); setTab(g.tabs[0].id) }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '18px 12px',
                background: active ? 'var(--accent-gradient)' : 'var(--bg-card)',
                border: active ? 'none' : '1px solid var(--border)',
                borderRadius: 14,
                color: active ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600, fontSize: 12,
                transition: 'all 0.2s',
                boxShadow: active ? '0 4px 14px rgba(0,0,0,0.25)' : 'none',
              }}>
              <Icon size={22} />
              {g.label}
            </button>
          )
        })}
      </div>

      {/* Level 2 — Module tabs for active group */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '12px 0', marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        {currentGroup.tabs.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px',
                background: active ? 'rgba(var(--accent-rgb, 234,88,12), 0.12)' : 'var(--bg-elevated)',
                border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: 8,
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
              <Icon size={13} />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'roles' && (
        <>
          <motion.div key="roles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
            background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 24px', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiUsers style={{ width: 16, height: 16, color: 'var(--accent)' }} />
                <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Roles y Permisos</h2>
              </div>
              <div style={{ position: 'relative' }}>
                <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', width: 14, height: 14 }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar rol..."
                  style={{ padding: '8px 12px 8px 30px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', width: 200 }} />
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ textAlign: 'left', padding: '14px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>Rol</th>
                    <th style={{ textAlign: 'left', padding: '14px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>Usuarios</th>
                    <th style={{ textAlign: 'left', padding: '14px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>Módulos</th>
                    <th style={{ textAlign: 'left', padding: '14px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>Nivel de Acceso</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.map((rol, idx) => (
                    <motion.tr key={rol.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: idx * 0.08 }} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--text-primary)' }}>{rol.name}</td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{rol.users}</td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{rol.modules.join(', ')}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 500, textTransform: 'capitalize', background: BADGE[rol.permissions].bg, color: BADGE[rol.permissions].color }}>
                          {rol.permissions}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                  {filteredRoles.length === 0 && (
                    <tr><td colSpan={4} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron roles</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div key="matrix" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} style={{
            background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 24px', borderBottom: '1px solid var(--border-light)' }}>
              <FiShield style={{ width: 16, height: 16, color: 'var(--accent)' }} />
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Matriz de Permisos</h2>
            </div>
            <div style={{ overflowX: 'auto', padding: 16 }}>
              <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Módulo</th>
                    {filteredRoles.map((rol) => (
                      <th key={rol.name} style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', minWidth: 120 }}>{rol.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODULES.map((mod, rowIdx) => (
                    <motion.tr key={mod} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: rowIdx * 0.03 }} style={{ borderTop: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--text-primary)' }}>{mod}</td>
                      {filteredRoles.map((rol) => {
                        const hasAccess = ACCESS_MATRIX[rol.name]?.[mod]
                        const cellKey = `${rol.name}-${mod}`
                        return (
                          <td key={cellKey} style={{ textAlign: 'center', padding: '12px 16px' }}
                            onMouseEnter={() => setHoveredCell(cellKey)} onMouseLeave={() => setHoveredCell(null)}>
                            <motion.span whileHover={{ scale: 1.2 }} style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 32, height: 32, borderRadius: 8, transition: 'all 0.2s',
                              background: hasAccess ? hoveredCell === cellKey ? 'var(--success)' : 'var(--accent-subtle)' : hoveredCell === cellKey ? 'var(--bg-elevated)' : 'transparent',
                              color: hasAccess ? hoveredCell === cellKey ? 'white' : 'var(--success)' : 'var(--text-muted)',
                            }}>
                              {hasAccess ? <FiCheck style={{ width: 16, height: 16 }} /> : <FiMinus style={{ width: 16, height: 16 }} />}
                            </motion.span>
                          </td>
                        )
                      })}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '12px 24px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-light)', fontSize: 12, color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiCheck style={{ width: 14, height: 14, color: 'var(--success)' }} /> Acceso concedido</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiMinus style={{ width: 14, height: 14, color: 'var(--text-muted)' }} /> Sin acceso</span>
            </div>
          </motion.div>
        </>
      )}

      {tab === 'audit' && renderAudit()}
      {tab === '2fa' && render2FA()}
      {tab === 'session' && renderSession()}
      {tab === 'score' && renderScore()}

      {tab === 'locked' && (
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <FiLock size={18} color="#ef4444" />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Cuentas Bloqueadas</h3>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={loadLockedAccounts}>
                <FiRefreshCw size={12} /> Actualizar
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Cuentas bloqueadas automáticamente tras 4 intentos fallidos de inicio de sesión.
            </p>

            {lockedAccounts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                <FiCheckCircle size={32} style={{ marginBottom: 8, color: 'var(--success)' }} />
                <p style={{ margin: 0 }}>No hay cuentas bloqueadas</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {lockedAccounts.map(acc => (
                  <div key={acc.id} style={{ background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.2)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{acc.name}</p>
                      <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{acc.email} · {acc.role}</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#ef4444' }}>
                        {acc.failedLoginAttempts} intentos fallidos ·{' '}
                        {acc.lockedAt ? new Date(acc.lockedAt).toLocaleString('es-DO') : '—'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => handleUnlock(acc.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--accent)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        <FiUnlock size={13} /> Desbloquear
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => handleSendReset(acc.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        <FiMail size={13} /> Enviar reset
                      </motion.button>
                      {lockoutMsg[acc.id] && (
                        <span style={{ fontSize: 12, color: 'var(--accent)', fontStyle: 'italic' }}>{lockoutMsg[acc.id]}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {tab === 'privacy' && (
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Export */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <FiDownload size={18} color="var(--accent)" />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Exportar mis datos</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
              Descarga una copia completa de todos tus datos en formato JSON. Incluye facturas, contactos, inventario, tareas y configuraciones. Las contraseñas no se incluyen.
            </p>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleExportData} disabled={exportLoading}
              style={{ background: 'var(--accent)', border: 'none', borderRadius: 10, padding: '10px 22px', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: exportLoading ? 0.7 : 1 }}>
              <FiDownload size={15} /> {exportLoading ? 'Generando...' : 'Descargar backup JSON'}
            </motion.button>
          </div>

          {/* Delete account */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid rgba(239,68,68,0.3)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <FiTrash2 size={18} color="#ef4444" />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#ef4444' }}>Eliminar mi cuenta</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
              Esta acción es irreversible. Se eliminarán tus datos de usuario de esta sesión. Exporta tus datos antes de proceder.
            </p>
            {!deleteConfirm ? (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setDeleteConfirm(true)}
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 22px', color: '#ef4444', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiTrash2 size={15} /> Eliminar mi cuenta
              </motion.button>
            ) : (
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', marginBottom: 10 }}>
                  Escribe <strong>ELIMINAR</strong> para confirmar:
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={deleteText} onChange={e => setDeleteText(e.target.value)} placeholder="ELIMINAR"
                    style={{ padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', width: 160 }} />
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleDeleteAccount} disabled={deleteText !== 'ELIMINAR'}
                    style={{ background: deleteText === 'ELIMINAR' ? '#ef4444' : 'rgba(239,68,68,0.2)', border: 'none', borderRadius: 8, padding: '10px 18px', color: 'white', fontSize: 13, fontWeight: 600, cursor: deleteText === 'ELIMINAR' ? 'pointer' : 'not-allowed' }}>
                    Confirmar
                  </motion.button>
                  <button onClick={() => { setDeleteConfirm(false); setDeleteText('') }}
                    style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 16px', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

const styles = {
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 0 },
  label: { color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: {
    padding: '12px 16px', background: 'var(--bg-card)',
    border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)',
    fontSize: 14, outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
  },
}
