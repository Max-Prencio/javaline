import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiShield, FiUsers, FiCheck, FiMinus, FiSearch, FiClock, FiKey, FiSmartphone, FiLock, FiAlertTriangle, FiCheckCircle, FiCopy, FiRefreshCw } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import securityService from '../services/securityService'
import authService from '../services/authService'
import { roleService } from '../services/entityService'

const MODULES = ['Dashboard', 'Facturación', 'CRM', 'RRHH', 'Compras', 'Agenda', 'Reuniones', 'Ventas', 'Tareas']

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
  const [tab, setTab] = useState('roles')
  const [auditLog, setAuditLog] = useState([])
  const [securityScore, setSecurityScore] = useState(null)
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [twoFactorSecret, setTwoFactorSecret] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [twoFactorError, setTwoFactorError] = useState('')
  const [twoFactorSuccess, setTwoFactorSuccess] = useState(false)
  const [sessionInfo, setSessionInfo] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    securityService.getSecurityAudit(null, 50).then(setAuditLog)
    setSecurityScore(securityService.getSecurityScore())
    authService.getUsers().then(setUsers)
    roleService.list().then(setRoles)
    setSessionInfo(securityService.getSession())
  }, [])

  const filteredRoles = roles.filter((r) => (r.name || '').toLowerCase().includes(search.toLowerCase()))

  const handleEnable2FA = () => {
    const { formatted } = securityService.generateTwoFactorSecret()
    setTwoFactorSecret(formatted)
    setShow2FASetup(true)
    setTwoFactorSuccess(false)
    setTwoFactorCode('')
    setTwoFactorError('')
  }

  const handleVerify2FA = async () => {
    setTwoFactorError('')
    const clean = twoFactorSecret.replace(/\s/g, '')
    if (securityService.verifyTwoFactorCode(clean, twoFactorCode)) {
      await authService.updateUser(user?.userId || user?.id, { twoFactorEnabled: true, twoFactorSecret: clean })
      setTwoFactorSuccess(true)
      setSecurityScore(securityService.getSecurityScore())
    } else {
      setTwoFactorError('Código inválido. Intenta de nuevo.')
    }
  }

  const handleRefreshScore = () => setSecurityScore(securityService.getSecurityScore())

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const TABS = [
    { id: 'roles', label: 'Roles y Permisos', icon: FiUsers },
    { id: 'audit', label: 'Auditoría', icon: FiClock },
    { id: '2fa', label: '2FA', icon: FiSmartphone },
    { id: 'session', label: 'Sesión', icon: FiKey },
    { id: 'score', label: 'Score de Seguridad', icon: FiShield },
  ]

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
              <div style={{ padding: 16, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Clave secreta</span>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => copyToClipboard(twoFactorSecret)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {copied ? <FiCheck size={14} /> : <FiCopy size={14} />} {copied ? 'Copiado' : 'Copiar'}
                  </motion.button>
                </div>
                <code style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 3, fontFamily: "'JetBrains Mono', monospace" }}>{twoFactorSecret}</code>
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: '1px solid var(--border-light)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', cursor: 'pointer',
              border: 'none', borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              background: 'transparent', color: tab === t.id ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 13, fontWeight: tab === t.id ? 600 : 400, transition: 'all 0.2s',
            }}>
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
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
